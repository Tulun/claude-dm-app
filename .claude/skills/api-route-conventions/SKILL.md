---
name: api-route-conventions
description: Persistence-layer rules for the API routes under app/api/ — how to read/write the JSON data files via lib/jsonStore.js, the mandatory corrupt-file backup policy, the version-migration merge pattern, and the checklist for adding a new route. Load this before touching any file under app/api/, lib/jsonStore.js, or data/*.json, or when a task mentions "API route", "data file", "corrupt JSON", "migration", "version bump", or "seeding defaults".
---

# API Route Conventions (Persistence Layer)

All user data lives as pretty-printed JSON files in `data/` at the repo root
(`party.json`, `spells.json`, `magic-items.json`, `templates.json`, `dm.json`,
`dm-npcs.json`, `encounter.json`, `encounters.json`). The Next.js route handlers
under `app/api/*/route.js` are the only code that reads or writes them.

## 1. Use lib/jsonStore.js for all file access

`lib/jsonStore.js` exports the only sanctioned helpers:

- `dataPath(filename)` — resolves `data/<filename>` from `process.cwd()`. Never hardcode paths.
- `ensureDataDir()` — creates `data/` if missing (the read/write helpers already call it).
- `readJsonFile(file)` — returns parsed contents, returns `undefined` when the file does not exist, and **throws** on corrupt/unparseable JSON. The caller decides: 500 or fallback.
- `writeJsonFile(file, data)` — pretty-printed (`JSON.stringify(data, null, 2)`).
- `deleteJsonFile(file)` — no-op if the file is absent.
- `backupCorruptFile(file)` — renames the file to `<file>.corrupt-<timestamp>.bak` and returns the backup path.

Simple pass-through routes (`app/api/party/route.js`, `app/api/dm-npcs/route.js`,
`app/api/encounter/route.js`, `app/api/encounters/route.js`) use these helpers directly.
The versioned routes (`spells`, `magic-items`, `dm`, `templates`) still use raw `fs`;
`spells`, `magic-items`, and `dm` additionally use `backupCorruptFile` — if you refactor
them, keep the exact behavior below.

## 2. Corrupt-file policy (non-negotiable)

Born from a real data-loss incident: corrupt files used to be silently reseeded with
defaults, destroying user data. **Never silently overwrite an unparseable data file.**

The canonical pattern is `loadSpells` in `app/api/spells/route.js`:

- **File missing** → seed defaults, write the file, return them.
- **File exists but `JSON.parse` throws** → call `backupCorruptFile(DATA_FILE)`, then
  `throw new Error(\`spells.json is corrupt and was backed up to ${path.basename(backup)}\`)`.
- **GET** catches and returns `{ error: error.message }` with status 500 — the user sees
  where their data went.
- **The next request** finds no file and reseeds, so the app stays usable without manual repair.

Routes that follow this pattern: `spells`, `magic-items`, `dm`. Characterization tests in
`test/api/spellsRoute.test.js`, `test/api/magicItemsRoute.test.js`, `test/api/dmRoute.test.js`
enforce it — do not weaken them.

**Known inconsistency (tracked in SUGGESTIONS.md, section 1):** `party`, `dm-npcs`, and
`templates` return 500 on a corrupt file but leave it in place (no `.bak`); `encounter`
and `encounters` silently fall back to defaults (`EMPTY_ENCOUNTER` / `[]`), and the next
user save overwrites the corrupt file. If you touch any of these routes, upgrade them to
the `.bak`-then-throw pattern and update SUGGESTIONS.md.

## 3. Version-migration pattern (spells / magic-items / templates / dm)

Each versioned file carries a version stamp written on every save:

| Route | Const (in its route.js) | File key | Payload key |
|---|---|---|---|
| `app/api/spells/route.js` | `SPELLS_VERSION` (4) | `version` | `spells` |
| `app/api/magic-items/route.js` | `ITEMS_VERSION` (3) | `version` | `items` |
| `app/api/templates/route.js` | `TEMPLATES_VERSION` (12) | `_version` | `templates` |
| `app/api/dm/route.js` | `DM_VERSION` (1) | `version` | (whole object) |

**Bump the const whenever you add default content or default fields.** On load, if
`!data.version || data.version < CURRENT_VERSION`, migrate:

1. For each saved entry whose id matches a default: merge as
   `{ ...defaultEntry, ...savedEntry }` — spread the default first, the saved entry
   second, so **user edits always win** and new default fields fill the gaps.
2. Append defaults whose ids are not in the saved set (brand-new content).
3. Entries not in the default set (custom creations, stray ids) carry over untouched.
4. Save the merged result with the new version stamp.

From `app/api/magic-items/route.js` (`loadItems`):

```js
const updated = (data.items || []).map(item => {
  const def = defaultMap.get(item.id);
  if (def) {
    return { ...def, ...item };
  }
  return item;
});
const existingIds = new Set(updated.map(i => i.id));
const newDefaults = defaultMagicItems.filter(i => !existingIds.has(i.id));
```

Default datasets live at `app/data/defaultSpells.js` (`defaultSpells`),
`app/magic-items/magicItems.js` (`defaultMagicItems`), and
`app/components/defaultData.js` (`defaultEnemyTemplates`).

## 4. Side effects to know

- **POST /api/spells on an existing spell** calls `syncSpellToCharacters` (same file),
  which rewrites `data/party.json`: every character spell whose `sourceId` or `id`
  matches gets its fields refreshed. Character spell instances carry **`castTime` only**
  (set from the spellbook spell's `castingTime`); the sync explicitly strips any legacy
  `castingTime` key. Sync failures are logged, never thrown — the spell save still succeeds.
- **GET /api/templates** caches `public/data/conflux-creatures.json` in module memory
  for the process lifetime (`confluxCache`) — editing that file requires a dev-server
  restart. It also runs its migration inside GET, so a plain GET can rewrite `templates.json`.

## 5. New-route checklist

1. Create `app/api/<name>/route.js`; import helpers from `../../../lib/jsonStore.js`
   (copy `app/api/party/route.js` as the minimal template).
2. Decide the GET-when-missing default **consciously**: `null` (party), `[]`
   (dm-npcs, encounters), an object (`EMPTY_ENCOUNTER` in encounter), or seed-and-write
   defaults (spells/magic-items/dm). Document the choice in a comment.
3. Corrupt file → follow section 2. Do not add a new silent-fallback route.
4. Response shapes: successful POST/DELETE that don't return data respond
   `{ success: true }`; errors respond `{ error: <message> }` with a proper status
   (400 missing params, 404 not found, 500 unexpected). Content-returning POSTs may
   echo the saved entity (spells/magic-items return the item; dm returns the merged doc).
5. Add a test file under `test/api/` using the mocked-cwd pattern: `// @vitest-environment node`,
   `vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)` **before** the dynamic
   `await import(...)` of the route — see `test/api/spellsRoute.test.js` and the
   **testing-and-validation** skill. Run `npm test` (269 tests must stay green).

## Traps / Do NOT

- **Do NOT reseed over a corrupt file.** Missing file → seed; corrupt file → `.bak` + throw + 500. This exact bug destroyed user data once.
- **Do NOT spread saved-over-default in the wrong order or filter out edited defaults.** The templates route once replaced user-edited `mm-*` monsters with pristine defaults during migration. `{ ...def, ...saved }` — default first, saved second, always.
- **Do NOT trigger migration on field-presence heuristics.** Migration fires ONLY on version comparison. A `size`-field heuristic once re-merged all 441 default templates into a user's custom-only list on every load.
- **Do NOT forget the version bump** when adding default content/fields — without it, existing installs never receive the new defaults.
- **Do NOT bypass `lib/jsonStore.js`** with ad-hoc `fs` calls in new routes, and never write a data file without `JSON.stringify(data, null, 2)` (the pretty format is what makes `data/` diffable in git).
- **Do NOT assume POST bodies are valid** — routes currently persist `await request.json()` verbatim (`POST null` wipes a file). Known gap in SUGGESTIONS.md section 0; don't make it worse in new routes.
- **Do NOT edit `data/*.json` in tests** — tests must mock `process.cwd()` to a temp dir (see the testing-and-validation skill). The real `data/` files are the user's live campaign.

Related skills: **dm-app-map** (where routes fit in the app), **testing-and-validation**
(mocked-cwd route tests), **debugging-playbook** (recovering from `.bak` files),
**frontend-patterns** (how pages fetch/auto-save against these routes).
