# Suggestions & Deferred Work

A running backlog of improvements surfaced during the test/refactor effort (July 2026).
Items here are **known, scoped, and safe to defer** — pick one up any time, or point
Claude at this file. Most quirks below are pinned by a characterization test, so
changing the behavior means flipping that test deliberately (search the test name).

Convention: `[ ]` open · `[x]` done (move to the log at the bottom when completed).

---

## 1. Data safety / API quirks

- [ ] **Atomic writes in `lib/jsonStore.js`** — write to a temp file and rename over the
  original instead of `writeFileSync` in place. Prevents the corrupt-file case (power
  loss / crash mid-write) that the `.bak` recovery path exists for. Cheap, high value.
- [ ] **Extend corrupt-file `.bak` protection to the simple routes** — spells,
  magic-items, and dm now back up corrupt files; `party`, `dm-npcs`, `encounter(s)`
  routes do not. Party is the most valuable user data in the app. Note: corrupt
  `encounters.json` currently returns `[]` silently, and the next user edit overwrites
  the corrupt file (test: "GET falls back to [] when the file is corrupt").
- [ ] **dm.json shallow migration merge** — an old file with a partial `world` object
  permanently loses the other default world keys (`gods`, `factions`, …), which later
  makes DELETE of those types return 400 "Invalid type". Fix: deep-merge `world` and
  `sessionNotes` during migration. (test: "QUIRK: migration merge is shallow" in
  `test/api/dmRoute.test.js`)
- [ ] **dm DELETE returns success for nonexistent ids** — no 404, unlike
  spells/magic-items. (test: "QUIRK: deleting a nonexistent id still returns success")
- [ ] **Conflux cache never invalidates** — `app/api/templates/route.js` caches
  `public/data/conflux-creatures.json` in module memory for the process lifetime;
  editing the file requires a server restart. Fine for prod, mildly confusing in dev.
- [ ] **Templates `source` tag computed on read, never persisted** — harmless today,
  but any future code reading `templates.json` directly won't see `source`.

## 2. Rules-math consolidation leftovers

- [ ] **Three local `getMod` variants intentionally not merged** — `Modals.jsx:447`,
  `TemplateEditor.jsx:391`, `ImportMonsterModal.jsx:127` treat a score of 0 as a real
  0 (−5 mod), while the canonical `app/utils/rules.js` helpers coerce 0/junk to 10
  (→ +0). Decide which semantics are right (0 → −5 is correct D&D math), align the
  canonical helper, then merge these three. (quirk pinned in
  `test/combat/characterCardUtils.test.js`: "defaults missing or junk input to 10")
- [ ] **Local prof-bonus formulas** — `SpellsModal.jsx:331`, `SpellsTab.jsx:498`, and
  `CharacterSheetModal.jsx` compute `Math.ceil(1 + level / 4)` inline instead of using
  the shared `getProfBonus` (same result for levels 1–20, but multiclass-blind).
- [ ] **InventoryTab duplicates the armor table** — `ARMOR_BASE_AC` + `getArmorData`
  in `app/character/components/tabs/InventoryTab.jsx` re-implement
  `ARMOR_AC_TABLE`/`getArmorBaseAC` from `app/utils/acCalculation.js`. Export the
  shared table/lookup and delete the copy.
- [ ] **Spellcasting parser: cantrip lines also populate `atWill`** — a header like
  "Cantrips (at will):" writes the same list into both `cantrips` and `atWill`, so
  UIs that render both show duplicates. (test: "parses cantrips lists" documents it)

## 3. Performance / bundle

- [ ] **Split `app/spellbook/page.jsx`** — 1,062-line single component (search,
  filters, list, editor modal all inline). Extract SpellCard / FilterBar / EditModal;
  add `useMemo` on the filtered list.
- [ ] **Memoization pass on the combat page** — `CharacterCard` and `InitiativeItem`
  re-render on every keystroke/HP tick because the page passes fresh closures each
  render. Needs `React.memo` + `useCallback` done together (memo alone does nothing).
  The combat page tests cover the flows this could break.
- [ ] **Slim the fetch-failure fallback** — `defaultData.js` (508 lines) ships in the
  combat/characters/encounters/templates bundles purely as an offline fallback.
  Consider a minimal fallback (empty party + a handful of templates) if bundle size
  starts to matter.
- [ ] **`classData.js` (863 lines)** — only loads on `/classes`, so low priority;
  could be fetched or dynamic-imported if that page feels slow.
- [ ] **`public/data/conflux-creatures.json` is 5.4 MB** — loaded on demand only when
  the user filters to Conflux, which is the right shape; if it feels slow, split by CR
  band or precompress.
- [ ] **Async fs in API routes** — routes use sync fs; fine for a local single-user
  tool, worth converting only if this ever serves multiple users.

## 4. Testing gaps

- [ ] **Character sheet page** (`app/character/page.jsx` + `TabContent.jsx`, the
  largest untested surface) — no page tests; it edits party.json data directly.
- [ ] **Spellbook, magic-items, dm, classes, templates pages** — no page tests.
- [ ] **CI** — no automated runner; a GitHub Action doing `npm test` + `npm run build`
  on push would lock in the 262-test suite.
- [ ] **jsdom form quirk** — jsdom lacks named-property access on forms
  (`form.npcName`); tests shim it (see `charactersPage.test.jsx`). Any new form using
  that pattern needs the same shim — or refactor forms to controlled state instead.

## 5. Bigger ideas (feature-adjacent)

- [ ] **Rolling backups / export** — a "download my data" button and/or keeping the
  last N copies of each data file on write; pairs well with the atomic-write item.
- [ ] **SWR or React Query** — replace fetch-on-mount + manual debounced auto-save
  with a cache + mutation layer; would delete a lot of per-page effect code.
- [ ] **Shared party context** — combat, characters, and character-sheet pages each
  fetch/save party.json independently; concurrent edits in two tabs last-write-wins.
- [ ] **Monster Manual slot-format coverage** — the spellcasting parser now handles
  "1st level (4 slots):"; stat blocks with unusual formats (e.g. "Spellcasting (Psionics)")
  may still parse partially. Collect real failing examples before extending.

---

## Completed log

- [x] Vitest infrastructure + 262 tests (pure logic, 3 user-data pages, all 8 fs-backed API routes) — July 2026
- [x] Deleted dead `confluxCreatures.js` (148k lines) — July 2026
- [x] Consolidated rules math into `app/utils/rules.js` + single AC calculator (`getEquipmentAC`) — July 2026
- [x] Split magic-item constants/utils out of the dataset module (bundle win for character page) — July 2026
- [x] Shared `lib/jsonStore.js` for the four simple user-data routes — July 2026
- [x] Fixed: combat page party "Add" button crash — July 2026
- [x] Fixed: deleting the last DM NPC never persisted — July 2026
- [x] Fixed: pages echoed unchanged data back to the API ~1s after every load — July 2026
- [x] Fixed: spellcasting parser missed the MM "1st level (4 slots):" format — July 2026
- [x] Fixed: corrupt spells/magic-items/dm files were silently reseeded (now `.bak` + 500) — July 2026
- [x] Fixed: templates migration discarded user edits to `mm-*` templates; removed over-eager `size` heuristic — July 2026
- [x] Fixed: spell sync wrote duplicate `castTime`/`castingTime` keys on character spells (now `castTime` only, legacy key stripped) — July 2026
- [x] Investigated, not a bug: combat card "ignoring" temp AC — the card adds `tempAC` at display time; including it in the calculator would double-count — July 2026
