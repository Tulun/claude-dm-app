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

## 0.5 Paused: skill-library validation tail (resume when token budget allows)

- [ ] **Finish the .claude/skills validation workflow** — the library (6 skills) is
  authored and live; 5/6 are adversarially machine-verified (api-route-conventions,
  rules-math, testing-and-validation, frontend-patterns, debugging-playbook pass).
  Remaining tail: (1) formal re-verify of `dm-app-map` after its fix pass (it was
  human-reviewed and looks accurate), (2) a whole-library critic pass (gaps /
  overlaps / trigger collisions), (3) three "first-day junior" simulation sessions
  (tasks: new /api/conditions route + tests; combat HP-edit flicker bug; atomic-writes
  backlog item) that grade the library. To resume IN THE ORIGINAL SESSION: rerun the
  Workflow tool with scriptPath
  `~/.claude/projects/-Users-jasonkiraly-Desktop-projects-claude-dm-app/7bc353df-5f13-4e17-bf4a-bc3e9bf13c5d/workflows/scripts/author-skill-library-wf_98e63a80-8dd.js`
  and resumeFromRunId `wf_98e63a80-8dd` (completed agents are cached). From any OTHER
  session: just run the three parts as plain subagent prompts — the prompts live in
  that script file (verifyPrompt for dm-app-map, the Critic block, the SIM_TASKS block).

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
