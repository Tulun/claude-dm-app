# Suggestions & Deferred Work

A running backlog of improvements surfaced during the test/refactor effort (July 2026).
Items here are **known, scoped, and safe to defer** — pick one up any time, or point
Claude at this file. Most quirks below are pinned by a characterization test, so
changing the behavior means flipping that test deliberately (search the test name).

Convention: `[ ]` open · `[x]` done (move to the log at the bottom when completed).

---

## 0. Security (from July 2026 audit; threat model = local single-user tool)

- [ ] **Origin check on API routes** — a malicious website in the same browser can fire
  cross-origin "simple" POSTs (text/plain) at `http://localhost:3000/api/*`;
  `request.json()` still parses them, so campaign data could be overwritten by a
  drive-by page. Also, `next dev` listens on LAN interfaces ("Network:" URL). Cheap
  mitigations: reject non-localhost Origin headers in the write routes, and/or run
  `next dev -H 127.0.0.1` on untrusted networks.
- [ ] **Schema/size validation on POST bodies** — every write route persists
  `await request.json()` verbatim; `POST null` wipes the file, and there's no body
  size cap. (App Router has no bodyParser config — check `content-length` in the
  handler or add lightweight shape checks: party/npcs/encounters must be arrays, etc.)
  Pairs with the atomic-writes item below.
- [ ] **If this ever gets deployed** (LAN party use, hosting): add auth, rate limiting,
  and CSRF tokens before anything else — the API is intentionally wide open today.

## 0.5 Paused: skill-library validation tail (run in small chunks, token-friendly)

All 6 skills under `.claude/skills/` are authored AND verified (adversarial
fact-check; dm-app-map's last three claims spot-verified July 2026). Remaining
tail, split into independent low-cost chunks — run each in a FRESH session
("read SUGGESTIONS.md section 0.5, run chunk N") to avoid long-conversation
context costs:

- [x] **Chunk B — library critic (cheap, can be done inline by the assistant):**
  read all six SKILL.md files and report gaps (tasks not covered), overlaps that
  could drift, and trigger-description collisions. No subagents needed.
  *Done July 2026 — verified inaccuracies patched (stale test counts 269→307,
  missing /api/vault coverage, dead QuickResourcesModal listing). Residual drift
  risks (facts duplicated across skills) noted in the Completed log entry.*
- [x] **Chunk C — simulation: plan a /api/conditions route (Sonnet, zero context).**
  *Done July 2026 — agent produced a correct plan (right analog routes, `.bak`-then-500
  policy, mocked-cwd tests) using dm-app-map, api-route-conventions, and
  testing-and-validation. Zero inaccuracies, zero trigger problems. Three missing-info
  gaps found and patched into api-route-conventions: (1) explicit policy for seedless
  routes (empty default + strict `.bak` on corrupt, skip migration), (2) checklist item 2
  now includes the no-default-dataset category, (3) shape guidance for per-entity-keyed
  resources (object map keyed by entity id; keep whole-file POST contract).*
- [x] **Chunk D — simulation: diagnose "editing an enemy's HP makes the party column
  flicker and fires a party auto-save" (Sonnet, zero context).**
  *Done July 2026 — see Completed log. Triggers all correct; one real doc/code gap
  found (unguarded `updateEnemy`/`updatePartyMember`) and patched into two skills;
  new §2 backlog item for the code-side fix.*
- [x] **Chunk E — one simulation, run on a SONNET-class model** (that's
  the audience being tested; also ~5x cheaper). Prompt: "You are a new engineer
  with zero context. Task: <X>. First read .claude/skills/, then only the files
  the skills point to. Produce an implementation plan; do NOT modify files. Then
  grade the library: skills used, missing info, inaccuracies." Task:
  - E: plan the "Atomic writes in lib/jsonStore.js" backlog item incl. tests.
  Act on any missing-info/inaccuracy findings by patching the relevant skill.
  *Done July 2026 — see Completed log. Zero inaccuracies, all triggers correct;
  one missing-info gap (jsonStore has no dedicated unit tests) patched into
  testing-and-validation. Skill-library validation tail is now COMPLETE.*

## 1. Data safety / API quirks

- [ ] **Atomic writes in `lib/jsonStore.js`** — write to a temp file and rename over the
  original instead of `writeFileSync` in place. Prevents the corrupt-file case (power
  loss / crash mid-write) that the `.bak` recovery path exists for. Cheap, high value.
  Plan sketched by skill-sim chunk E (July 2026): temp file in the SAME directory as
  the target (rename is only atomic same-filesystem), fsync before rename, unlink the
  temp on failure and rethrow (routes' 500 handling unchanged); scope is `writeJsonFile`
  only, i.e. the 4 simple routes — spells/magic-items/dm/templates use raw `fs` and
  would need a separate pass. Tests: new `test/lib/jsonStore.test.js` (node env,
  mkdtemp + cwd mock) — round-trip, pretty-print preserved, no `.tmp` leftovers,
  original untouched when rename/write throws; existing route tests unchanged.
  Residual gap: a crash between open and our cleanup can still orphan a `.tmp` file
  in `data/` (harmless; would need a startup sweep to fully close).
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


## 3. Performance / bundle

- [ ] **Split `app/spellbook/page.jsx`** — 1,062-line single component (search,
  filters, list, editor modal all inline). Extract SpellCard / FilterBar / EditModal;
  add `useMemo` on the filtered list.
- [ ] **`useMemo` on `groupedItems` in magic-items/page.jsx:44** — leftover micro-win
  from the combat memoization pass (done July 2026).
- [ ] **HTTP caching for the big GETs** — `/api/templates` ships ~630KB and `/api/spells`
  ~440KB on every page mount with no Cache-Control/ETag; tab-switching re-downloads
  everything. If adding caching, invalidate on POST (ETag + 304 is the safe shape) —
  do NOT blanket-cache mutable data like `/api/party`.
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
  on push would lock in the suite mechanically.
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
- [ ] **Obsidian vault follow-ups** (the read-only Campaign dashboard shipped July 2026;
  `lib/vaultStore.js`, `/api/vault`, `app/dm/components/VaultTab.jsx`):
  - Link vault notes to app entities (a dm-npc or saved encounter referencing the
    note that describes it) — user picked this as a "maybe later" in the scoping pass.
  - "Send to Obsidian" append-only export (new files only, never modify existing).
  - Vault cleanup: the vault has sync-duplicate folders ("PCs" + "PCs 2", etc.) with
    real content split across both; the dashboard merges them for display and shows a
    hint. Actual file moves should happen in Obsidian, by the user.
  - Embedded images (`![[map.png]]`) render as placeholders; could serve them via the
    vault route with the same traversal guard.

---

## Completed log

- [x] Component design batch — (1) deleted `TabContent.jsx` (1,501 lines): it was
  already imported nowhere, the tabs/ split was complete; (2) `CharacterCard`'s ten
  `showX` modal booleans collapsed to one `activeModal` string (the three inline
  HP/temp-HP/temp-AC delta editors keep their own state — they're popovers, not
  modals); (3) initiative drag state extracted to `useDragReorder`
  (`app/combat/useDragReorder.js`) — `InitiativeItem` now takes a single `drag`
  handlers bundle + per-row `isDragging`/`isDragOver` booleans (12 props, down
  from 15), and hovering during a drag no longer re-renders every row (the old
  shared `dragOverIndex` prop did). dm-app-map + frontend-patterns updated —
  July 2026
- [x] Shared `<Modal>` wrapper — `app/components/Modal.jsx` replaces all 34
  hand-rolled `fixed inset-0 bg-black/…` overlays. Standardized: opacity /70
  (was /50–/80), `p-4` everywhere, layers base/raised/top for z-50/z-[60]/z-[100].
  Backdrop-only close (`e.target === e.currentTarget`) — panel `stopPropagation`
  handlers removed as redundant; this also FIXES: nested QuickResources sub-modal
  backdrop clicks no longer cascade-close the outer modal, and panels that forgot
  stopPropagation no longer close on panel click. SpellPickerModal keeps its
  no-backdrop-close behavior (omitted onClose). frontend-patterns §5 updated —
  July 2026
- [x] Housekeeping batch — `'fs'` → `'node:fs'` in the 3 raw-fs routes; ESLint
  (flat config, eslint-config-next/core-web-vitals) + Prettier added with
  `lint`/`format`/`format:check` scripts. `npm run lint` = 0 errors (27 legacy
  warnings left visible: exhaustive-deps, set-state-in-effect, no-img-element);
  no repo-wide Prettier reformat was run (would be pure churn — configs are for
  new code). Two real lint finds fixed: ImportMonsterModal's setState-inside-
  useMemo (existingMatch is now derived) and two non-hook `use*` functions
  renamed (`spendSorceryPoints`, `spendResourceWithOption`). README rewritten
  with real project docs. Data-tracking decision: `data/*.json` STAYS tracked
  (deliberate crude backup for a local tool; revisit before ever pushing the
  repo anywhere public) but `data/*.bak` recovery files are now gitignored —
  July 2026
- [x] Dual class-shape ternaries consolidated — new canonical helpers in
  `app/utils/rules.js`: `getAllClasses`, `getClassLevel`, `isClass`,
  `formatClassList` (re-exported from CharacterCard/utils.js; index.js's
  `formatClasses` now delegates to `formatClassList`). Converted ~15 sites:
  CardHeader, CharacterCard/index, QuickResources/Sorcerer/Druid feature modals
  (incl. a fourth undocumented local `getMod` found in DruidFeaturesModal —
  merged), SpellsModal + SpellsTab prepared-caster info, Features/Companions
  tabs + TabContent class normalization, ClassEditor, WildShapeTab,
  acCalculation unarmored-defense lookup. Left alone: SpellsTab's
  `getCharacterClasses` (also reads a third `multiclassClass` shape) and the
  card's `character.class ? 'party' : 'template'` type sniff — July 2026
- [x] Bare `Date.now()` ids replaced with `generateId(prefix)`
  (`app/utils/generateId.js`, timestamp + random suffix) across ~22 client
  sites (TabContent, tabs/*, dm/components/*, combat modals, encounters,
  characters); the four pre-existing safe inline patterns unified onto the
  helper. API routes' server-side ids left as-is (one request at a time).
  Encounters-page id-shape test updated deliberately — July 2026
- [x] Toast/save-status helper — `useToast` hook (`app/hooks/useToast.js`)
  replaces the copied `setSaveStatus + setTimeout` pairs on all six pages;
  newer messages now reset the clear timer (stale timers can't clear a fresh
  toast early). Magic timings named in `app/utils/timings.js` (500/1000/1500
  arm/debounce + 2000/3000 toast durations); values unchanged — July 2026
- [x] getMod 0-score semantics fixed + three local getMods merged — `getModNum` now
  treats a real 0 as −5 (correct D&D math); missing/junk input still coerces to 10.
  Pinning test split/flipped deliberately; local getMods in Modals.jsx,
  TemplateEditor.jsx, ImportMonsterModal.jsx replaced with the canonical import
  (ImportMonsterModal's junk-input "NaN" display becomes "+0"). rules-math skill
  updated — July 2026
- [x] Six inline prof-bonus formulas consolidated onto `getProfBonus` (QuickResources/
  CharacterSheet/Spells/SorcererFeatures modals, SpellsTab, InventoryTab). Now
  multiclass-aware; InventoryTab's stray `+1` on weapon attack bonuses deliberately
  dropped (was wrong D&D math, untested) — July 2026
- [x] Armor table consolidated — `acCalculation.js` now exports the richer
  `ARMOR_AC_TABLE` (name → { baseAC, armorType }) plus `getArmorData`; InventoryTab's
  duplicate `ARMOR_BASE_AC`/`getArmorData` deleted. Union of both tables' keys, so
  the inventory lookup gains the 'studded'/'scale'/'chain' fragment aliases;
  `getEquipmentAC` behavior unchanged (shield entry excluded from its body-armor
  lookup) — July 2026
- [x] Spellcasting parser: "Cantrips (at will):" headers no longer leak into `atWill`
  (duplicate-render bug); a separate "At will:" line still parses. Pinning test
  flipped deliberately + new coverage for the combined case — July 2026
- [x] Extracted `app/utils/spellFormat.js` (`abbreviateCastTime`, `getLevelLabel`,
  `getOrdinalSuffix`) — deleted the three copies in SpellsModal, SpellPickerModal,
  SpellsTab — July 2026
- [x] Guarded `updatePartyMember`/`updateEnemy` on the combat page — both now bail
  out (return `prev`) when nothing matched, matching `updateInitiative`; the
  in-file comment is accurate again and the frontend-patterns §2 "Known gap" note
  was removed — July 2026
- [x] Deleted three 0-byte dead files (tabs/DruidFeaturesModal.jsx,
  tabs/SorcererFeaturesModal.jsx, app/components/QuickResourcesModal.jsx);
  dm-app-map's dead-file note updated — July 2026
- [x] Removed unused legacy helpers from magicItems.js (getItemsByCategory,
  getItemsByRarity, getItemsByClass, getItem) — July 2026
- [x] Skill-library drift hardening — closed the residual drift risk from chunk B.
  Each of the four duplicated fact clusters now has ONE canonical skill home, marked
  "CANONICAL" in place: per-view AC flags + temp-AC trap → rules-math; corrupt-file
  route-by-route table → api-route-conventions §2; conflux-cache behavior →
  api-route-conventions §4; save-gate/debounce timings → frontend-patterns §1 (the
  test-settle advances in testing-and-validation explicitly note they derive from
  it). All other copies replaced with cross-references (frontend-patterns §4,
  debugging-playbook ×4, dm-app-map ×1). Exact test counts (307/22 files) replaced
  with stale-proof wording in five skills + CLAUDE.md + the §4 CI item. New
  CLAUDE.md non-negotiable #6: behavior changes must patch the documenting skill in
  the same change, and drift-prone facts are cross-referenced, never re-duplicated —
  July 2026
- [x] Skill-library validation chunk E (zero-context Sonnet simulation planning the
  "Atomic writes in lib/jsonStore.js" item + tests) — final chunk; the §0.5 validation
  tail is complete. Triggers all correct (dm-app-map → api-route-conventions →
  testing-and-validation → debugging-playbook, no spurious loads); ZERO inaccuracies —
  every skill claim the agent checked matched source (writeJsonFile consumer list,
  raw-fs route split, corrupt-file behavior table, mocked-cwd test pattern). Plan was
  correctly scoped (writeJsonFile only; flagged the raw-fs routes as out of scope) and
  technically sound (same-dir temp + fsync + rename, cleanup on failure). One
  missing-info gap patched into testing-and-validation: jsonStore.js has no dedicated
  unit tests (indirect route-test coverage only) — note added incl. the nuance the
  agent got slightly wrong (ensureDataDir still reads process.cwd(), so the cwd-mock
  pattern still applies). Plan details folded into the §1 atomic-writes item — July 2026
- [x] Skill-library validation chunk D (zero-context Sonnet simulation diagnosing
  "enemy HP edit flickers party column + fires party auto-save") — skill triggers all
  correct (dm-app-map → debugging-playbook → frontend-patterns, no spurious loads,
  correct delegation); agent found the real gap: `updateEnemy`/`updatePartyMember`
  lack the bail-out guard that the in-file comment and frontend-patterns §2 present
  as universal. Verification pass: the literal symptom does NOT reproduce today
  (enemy edits never touch `setParty`; party-card memo props are stable via
  module-level `EMPTY_TEMPLATES`) — it matches pre-memoization behavior, and the
  agent's "flicker extends to the party column" mechanism was rejected. Patches:
  frontend-patterns §2 "Known gap" note naming the unguarded mutators, §5 note on
  the shared `saveStatus` toast race (three effects, one string), debugging-playbook
  gained the missing "spurious renders/saves" symptom entry; code-side fix logged as
  a new §2 backlog item — July 2026
- [x] Skill-library validation chunk C (zero-context Sonnet simulation of the
  /api/conditions task) — plan was correct on the first pass; no inaccuracies or
  trigger issues; three missing-info gaps patched into api-route-conventions
  (seedless-route corrupt policy, no-default checklist category, per-entity-keyed
  data-shape guidance) — July 2026
- [x] Skill-library validation chunk B (library critic) — patched verified inaccuracies:
  stale test counts (269/18 → 307/22 in five skills + CLAUDE.md), `/api/vault` +
  `OBSIDIAN_VAULT_PATH` added to dm-app-map/api-route-conventions/debugging-playbook,
  dead `app/components/QuickResourcesModal.jsx` no longer listed as shared UI, §2
  prof-bonus item expanded to all six sites. Residual (accepted) drift risks: the
  temp-AC display snippet, corrupt-file route table, conflux-cache note, and save-gate
  timings are each duplicated across 2–4 skills — when any of those behaviors change,
  update every copy — July 2026
- [x] Obsidian vault Campaign dashboard on /dm — read-only `/api/vault` route
  (OBSIDIAN_VAULT_PATH in .env.local, traversal-guarded, GET-only by design),
  folder-merged dashboard with Current Session / Recently edited / search, safe
  markdown reader (no new dangerouslySetInnerHTML), 38 new tests — July 2026
- [x] Escaped HTML in `formatSpellText` (app/spellbook/formatSpellText.js) — closed the app's only XSS sink; 7 new tests — July 2026
- [x] Upgraded Next.js 16.1.4 → 16.2.10 — cleared all high-severity npm audit advisories (2 non-actionable moderates remain in Next's vendored postcss) — July 2026
- [x] Combat page memoization — React.memo on CharacterCard + InitiativeItem, useCallback handlers, useMemo initiative pipeline (Map lookup replaced O(n²) find) — July 2026

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
