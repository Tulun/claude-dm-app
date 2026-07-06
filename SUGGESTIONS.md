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

- [ ] **Unguarded list mutators on the combat page** — `updatePartyMember`
  (`app/combat/page.jsx:261`) and `updateEnemy` (`:263`) `.map()` unconditionally,
  while the comment above them (lines 258–260) and frontend-patterns §2 describe the
  bail-out guard ("return `prev` when nothing matched") as universal. Impact is small
  (callers always pass a fresh object, so the guard only catches unmatched ids), but
  a no-op call still re-arms the debounced encounter/party save. Align both with
  `updateInitiative`'s guarded pattern, fix the stale comment, and remove the
  "Known gap" note from frontend-patterns §2. (Found by skill-sim chunk D.)
- [ ] **Three local `getMod` variants intentionally not merged** — `Modals.jsx:447`,
  `TemplateEditor.jsx:391`, `ImportMonsterModal.jsx:127` treat a score of 0 as a real
  0 (−5 mod), while the canonical `app/utils/rules.js` helpers coerce 0/junk to 10
  (→ +0). Decide which semantics are right (0 → −5 is correct D&D math), align the
  canonical helper, then merge these three. (quirk pinned in
  `test/combat/characterCardUtils.test.js`: "defaults missing or junk input to 10")
- [ ] **Local prof-bonus formulas** — six sites compute `Math.ceil(1 + level / 4)` inline
  instead of using the shared `getProfBonus` (same result for levels 1–20, but
  multiclass-blind): under `app/combat/components/CharacterCard/` —
  `QuickResourcesModal.jsx:62`, `CharacterSheetModal.jsx:35`, `SpellsModal.jsx:333`,
  `SorcererFeaturesModal.jsx:84`; plus `app/character/components/tabs/SpellsTab.jsx:500`
  and `InventoryTab.jsx:464` (a `+1` variant).
- [ ] **InventoryTab duplicates the armor table** — `ARMOR_BASE_AC` + `getArmorData`
  in `app/character/components/tabs/InventoryTab.jsx` re-implement
  `ARMOR_AC_TABLE`/`getArmorBaseAC` from `app/utils/acCalculation.js`. Export the
  shared table/lookup and delete the copy.
- [ ] **Spellcasting parser: cantrip lines also populate `atWill`** — a header like
  "Cantrips (at will):" writes the same list into both `cantrips` and `atWill`, so
  UIs that render both show duplicates. (test: "parses cantrips lists" documents it)
- [ ] **Duplicated spell formatters** — `abbreviateCastTime` ×3 (SpellsModal.jsx:304,
  SpellPickerModal.jsx:11, SpellsTab.jsx:468) and `getLevelLabel` ×3 (same files).
  Extract to `app/utils/spellFormat.js`.
- [ ] **Delete three 0-byte files** — `app/character/components/tabs/DruidFeaturesModal.jsx`,
  `app/character/components/tabs/SorcererFeaturesModal.jsx`,
  `app/components/QuickResourcesModal.jsx` — all empty and imported nowhere (verified).
- [ ] **Remove unused legacy helpers in magicItems.js** — `getItemsByCategory`,
  `getItemsByRarity`, `getItemsByClass`, `getItem` are exported but never imported.
- [ ] **Dual class-shape ternaries (~20 sites)** — components branch on
  `character.classes` array vs legacy `class`/`level` everywhere (CardHeader,
  QuickResourcesModal, Druid/SorcererFeaturesModal, …). `formatClasses`/`getTotalLevel`
  already exist in shared modules — reuse them, and add `isDruid(char)`-style helpers
  (or normalize the shape on load).
- [ ] **Bare `Date.now()` ids** — ~15 sites create ids with no random suffix
  (TabContent, tabs/*, dm/components/*); collisions possible when creating items in a
  loop. Extract a `generateId(prefix)` helper (the combat page already uses the safe
  `Date.now() + random` pattern).
- [ ] **Shared `<Modal>` wrapper** — 33 hand-rolled `fixed inset-0 bg-black/…` overlay
  divs with inconsistent opacity (50–80), z-index (50/60/100), and padding.
- [ ] **Toast/save-status helper** — the `setSaveStatus(msg); setTimeout(clear, 2000)`
  pair is copied ~10× across pages; extract a `useToast` hook. Same for the magic
  debounce numbers (500/1000/1500/2000ms) → named constants.
- [ ] **Housekeeping batch** — standardize `'fs'` → `'node:fs'` imports (3 routes);
  add ESLint + Prettier; rewrite the stock create-next-app README; decide whether
  `data/*.json` (campaign data) should stay tracked in git — it works as a crude
  backup for a local tool, but any push publishes your campaign and `.bak` recovery
  files will accumulate.
- [ ] **Component design (larger)** — `InitiativeItem` takes 15 props (drag state
  belongs in a hook/context); `CharacterCard` juggles 11+ `showX` modal booleans
  (collapse to one `activeModal` string); `TabContent.jsx` is 1,501 lines and predates
  the tabs/ split — finish migrating and delete the mega-component.

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
