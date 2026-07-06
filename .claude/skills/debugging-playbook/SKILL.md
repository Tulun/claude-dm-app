---
name: debugging-playbook
description: Symptom-to-fix playbook for incidents this repo has actually had - lost/corrupt data files, edits not saving, stale Conflux monsters, template migration surprises, AC mismatches between views, and known test-failure signatures. Load this when the user reports a bug, says "my data disappeared", "edits are not saving", "monsters are stale/reappeared", "AC is wrong", or when a test fails with a confusing error.
---

# Debugging Playbook

Every entry below is a real incident from this repo's history. Check this table BEFORE
investigating from scratch, and grep `SUGGESTIONS.md` (repo root) plus `test/` before
"fixing" anything that looks like a quirk - most quirks are documented and pinned by a
characterization test.

## Dev basics

- Start the app: `npm run dev`. Next.js binds LAN interfaces too (a "Network:" URL is
  printed) - on untrusted networks run `npx next dev -H 127.0.0.1` instead.
- Run tests: `npm test` (Vitest, 307 tests across 22 files as of July 2026).
- `ANTHROPIC_API_KEY` in `.env.local` is ONLY needed for the image-import features
  (`app/api/parse-monster/route.js`, `app/api/parse-spell/route.js`). Everything else
  works without it. `.env.local` is gitignored (`.env*` in `.gitignore`).
- `OBSIDIAN_VAULT_PATH` in `.env.local` is only needed for the /dm Campaign tab
  (`/api/vault`, read-only) — the rest of the app works without it.
- Route `console.error`/`console.log` output goes to the TERMINAL running `npm run dev`,
  not the browser console. Always check both.

## Symptom -> cause -> fix

### "My data disappeared" / a route returned 500 mentioning a backup

Cause: a data file under `data/` was corrupt JSON. The spells, magic-items, and dm
routes call `backupCorruptFile` (exported from `lib/jsonStore.js`), which renames the
file to `data/<name>.json.corrupt-<timestamp>.bak` and returns 500 once. On the NEXT
request the file no longer exists, so the route reseeds defaults - your data is not
gone, it is sitting in the `.bak`.

Recovery:
1. Stop the dev server.
2. `ls data/*.bak` and inspect the newest backup.
3. Repair the JSON (usually a truncated write - see the atomic-writes item in
   `SUGGESTIONS.md`).
4. Rename the repaired `.bak` back over the freshly reseeded file, e.g.
   `mv data/spells.json.corrupt-1751500000000.bak data/spells.json`.
5. Restart the dev server.

Route-by-route corrupt-file behavior (verified in `test/api/`):
- `spells`, `magic-items`, `dm`: `.bak` + 500, reseed defaults next request.
- `templates`: 500, corrupt file left IN PLACE (no `.bak`, no reseed) - pinned by
  "returns 500 ... (file NOT overwritten)" in `test/api/templatesRoute.test.js`.
- `party`, `dm-npcs`: 500, file left in place (no backup - see `SUGGESTIONS.md` §1).
- `encounter`, `encounters`: silently fall back to empty; the next save OVERWRITES the
  corrupt file. Recover before touching those pages.

### "Edits are not saving"

Check in this order:
1. **Debounce + gate.** Pages auto-save with a 1000ms debounce, and saving is disabled
   until 500ms after the initial load settles (`saveEnabled` ref in
   `app/characters/page.jsx` and `app/combat/page.jsx`). Wait ~2 seconds after an edit
   before concluding nothing saved.
2. **Server terminal.** Look for `POST /api/...` log lines and `console.error` output
   in the terminal running `npm run dev` - route errors never reach the browser console.
3. **Empty-list regression.** On `/characters`, deleting the last NPC DOES save an
   empty list. This was a real bug (fixed July 2026). If it regresses, check that the
   dm-npcs save effect in `app/characters/page.jsx` is still gated ONLY by
   `saveEnabled.current` - someone adding a `dmNpcs.length` guard reintroduces the bug.
   Pinned by "persists deleting the last NPC (empty list is saved)" in
   `test/characters/charactersPage.test.jsx`.

### "Editing one card makes other columns flicker" / "a save fired for data I didn't touch"

The mirror image of "edits are not saving": extra renders or saves instead of missing
ones. The combat page's save effects key on array IDENTITY (`[party]`, `[templates]`,
`[enemies, lairAction]` in `app/combat/page.jsx`), and `CharacterCard`/`InitiativeItem`
are `React.memo`'d — so this class of bug is almost always a broken identity. Check:
1. An inline closure or inline `|| []` fallback passed as a prop, silently defeating
   `React.memo` (this is why the memoization contract in frontend-patterns §2 exists;
   before the July 2026 memoization pass, edits re-rendered every card).
2. A list setter returning a new array when nothing changed, re-arming the debounced
   save — see the bail-out guard in frontend-patterns §2, and note
   `updatePartyMember`/`updateEnemy` currently lack it (known gap, `SUGGESTIONS.md` §2).
3. Misattribution: the Navbar toast is one shared `saveStatus` string written by all
   three effects, so its text can name the wrong save. Confirm which `POST /api/...`
   actually fired (server terminal or Network tab) before trusting the toast.

### "Conflux monsters are stale after editing public/data/conflux-creatures.json"

Cause: `app/api/templates/route.js` caches the 5.4MB conflux file in a module-level
variable (`confluxCache` in `loadConflux`) for the process lifetime.
Fix: restart the dev server. This is intentional (see `SUGGESTIONS.md` §1); do not
"fix" it by removing the cache.

### "Template edits to a Monster Manual creature vanished" / "441 default monsters reappeared in my custom list"

This is the templates version-migration class of bug. `GET /api/templates` re-runs a
migration whenever `_version` in `data/templates.json` is missing or below
`TEMPLATES_VERSION` in `app/api/templates/route.js` (currently 12). The migration
layers saved edits over the 441 `defaultEnemyTemplates` (from
`app/components/defaultData.js`) by id: `{ ...def, ...saved }`, and carries non-default
ids over untouched.

Debug steps:
1. Compare `_version` in `data/templates.json` against `TEMPLATES_VERSION`.
2. Read `test/api/templatesRoute.test.js` BEFORE changing any merge logic - a previous
   migration bug discarded user edits to `mm-*` templates, and the tests pin the
   correct merge.
3. Note `POST /api/templates` replaces the whole file with the posted array and stamps
   the current version - a client posting a filtered list wipes the rest.

See the api-route-conventions skill for the general version-migration pattern shared
with spells and magic-items.

### "AC differs between the combat card and the initiative row / characters page"

STOP - read the rules-math skill FIRST. The per-view differences are deliberate and
this was mis-diagnosed as a bug once already:
- Combat card (`app/combat/components/CharacterCard/utils.js`, `getCalculatedAC`):
  `getEquipmentAC(character, { includeTempAC: false, parseArmorNames: false })` - the
  card adds `character.tempAC` at display time, so including it in the calculator
  would double-count.
- Initiative row (`app/combat/components/InitiativeItem.jsx`): `getEquipmentAC(character,
  { parseArmorNames: false })` - temp AC included, no armor-name parsing.
- Characters page (`app/characters/page.jsx`): `getCalculatedAC` from
  `app/utils/acCalculation.js` - both flags on, so armor names like "studded leather"
  are parsed into base AC only here.

## Test failures decoder

| Error | Cause | Fix |
|---|---|---|
| `React is not defined` | `esbuild: { jsx: 'automatic' }` missing from `vitest.config.mjs` | Restore that line; do not add `import React` to components |
| `No "usePathname" export` (or similar from `next/navigation`) | Incomplete `vi.mock('next/navigation', ...)` in the test file - mocks live per-file, not in `test/setup.js` | Copy the mock shape from `test/characters/charactersPage.test.jsx` (includes `usePathname`) |
| Route tests write to the real `data/` dir | `vi.spyOn(process, 'cwd')` set AFTER the route import - routes compute file paths at import time | Set the cwd spy BEFORE the dynamic `import('../../app/api/.../route.js')`; see `beforeAll` in `test/api/templatesRoute.test.js` |
| `Cannot read properties of undefined (reading 'value')` on form submit in jsdom | jsdom lacks named property access on forms (`form.npcName`) | Add the named-form-access shim; see the testing-and-validation skill and `test/characters/charactersPage.test.jsx` |
| Conflux tests see stale data | Module-level `confluxCache` survives between tests | `vi.resetModules()` + fresh dynamic import per test (the `freshRoute()` helper in `test/api/templatesRoute.test.js`) |

## Traps / Do NOT

- Do NOT restart the dev server before recovering a `.corrupt-*.bak` workflow midway -
  but DO stop it before renaming the `.bak` back, or a pending debounced save can
  overwrite your restored file.
- Do NOT "fix" the combat card ignoring `tempAC` inside the AC calculator - it is added
  at display time (documented as investigated-not-a-bug in `SUGGESTIONS.md`).
- Do NOT add a length guard to the dm-npcs auto-save effect - empty lists must persist.
- Do NOT change templates merge logic without reading `test/api/templatesRoute.test.js`.
- Do NOT delete the `confluxCache` module cache to make dev edits live - restart instead.
- Do NOT assume a weird behavior is a bug: grep `SUGGESTIONS.md` and `test/` for it
  first. Quirks are pinned by characterization tests; changing behavior means flipping
  the named test deliberately.

## Related skills

- rules-math - AC/modifier math and the deliberate per-view differences.
- testing-and-validation - vitest setup, jsdom shims, route-test patterns.
- api-route-conventions - version migrations, jsonStore, corrupt-file handling.
- dm-app-map - where files live.
- frontend-patterns - the debounced auto-save / saveEnabled pattern in full.
