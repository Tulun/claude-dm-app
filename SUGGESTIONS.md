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

- [ ] **Combat CharacterSheetModal has its own skill/save/passive math**
  (`app/combat/components/CharacterCard/CharacterSheetModal.jsx`): ignores
  background skill profs, Skilled feat, Primal/Divine Order bonuses and Jack of
  All Trades, and honours a stored `profBonus`. The party card's passives use
  the sheet's `getSkillBonus` from `app/character/components/constants.js`, so
  e.g. a Bard's passives can differ between the card and the modal. Fix: switch
  the modal to `getSkillBonus` / `getSaveBonus`. (Also: QuickResourcesModal and
  SorcererFeaturesModal compute spell DC inline instead of `getSpellSaveDC`.)
  Side note: the combat bundle now imports that 100 KB constants module — if
  bundle size matters, lift the skill helpers into `app/utils/`.


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
- [ ] **Party card at-a-glance follow-ups** (⋯ menu, resource pips, passives
  and save row shipped Oct 2026):
  - Thin HP bar (bloodied colouring); shrink "+ Condition" to a small "+".
  - Damage / Heal (`app/combat/hp.js`) is card-only so far — the Table view
    rows and the tracker's Now card still edit HP and THP as raw numbers.

---

## Completed log

- [x] /combat encounter bar tidy: Edit Encounter button removed (the encounter
  name is now the edit link), "Load Another" always reads "Load Encounter"
  and sits alone on the encounter bar; Clear / Add Lair Action / Add Monster
  moved to a second "Encounter actions" bar — Oct 2026.
- [x] Multiple lair actions: combat state and saved encounters store
  `lairActions: [{ id, initiative, notes }]` (`app/utils/lairActions.js`);
  legacy single `lairAction` files read back as a one-item list (id
  `'lair-action'`, so saved orders still match) and are rewritten on the next
  save — no route/version migration (both routes are pass-through). Add to
  Combat now appends a saved encounter's lair actions instead of ignoring them
  when one existed. Encounter editor edits a list. Also: enemy card ⋯ menu
  gained Duplicate (fresh copy after the original) — Oct 2026.
  Not done: the Table view's enemy rows have no Duplicate.
- [x] Same-named enemies are numbered for tracking: Add Monster / Load
  Encounter only numbered within one batch, so a second "Goblin Boss" (or a
  quantity-1 encounter added twice) collided. `numberEnemies`
  (`app/combat/enemyNames.js`) now runs on every add path and on load, so
  existing collisions in `data/encounter.json` fix themselves — Oct 2026.
  Not done: renaming an enemy by hand can still create a duplicate name.
- [x] Group initiative + quick init edit: same-named enemies share one
  initiative value (`app/combat/initGroups.js`; ⋯ menu Separate / Rejoin via
  `ownInit`); every party and enemy card has an Init chip for inline edits;
  "Manage Order" renamed **Current Order** and the tracker's duplicate "Full
  Order" button removed — Oct 2026.
  Not done: grouped enemies still take separate turns (shared number only);
  the Table view's Init column is read-only.

- [x] Enemy card glowup (mirrors the party cards): ⋯ menu instead of the
  icon row (Remove from Combat lives there), "size type · CR" subtitle,
  parsed spellcasting DC pill, `EnemyGlance` (limited-use pips incl.
  legendary actions, senses with passive Perception, speeds, defenses
  chips), modifier-led ability row with stat-block saves, short action
  chip labels. Limited pools extracted to `app/combat/limitedUses.js` +
  `LimitedUses.jsx`, shared with the tracker's Limited row — Oct 2026.
- [x] Combat detail drawer (`app/combat/components/CombatantDrawer.jsx`):
  a slide-over showing one combatant in full (HP damage/heal + THP, AC /
  init / prof / spell DC, speeds, conditions, card modals, abilities + party
  saves, defenses & senses, traits → legendary actions with pips, monster
  spellcasting, party resources / loadout / features, combat notes). Follows
  the turn or pins one creature. Opened from the Now card name, Up Next,
  order-modal rows, any card's name (party names used to open the sheet —
  still in ⋯), party ⋯ → Details. Replaced the
  unreachable enemy-card expanded block (the page never passed `expanded`
  to enemies) and its `expandedCards` state — Oct 2026. Not wired: Table-view
  rows.
- [x] Combat card HP editor: Damage / Heal amount (Enter = Damage) with temp
  HP absorbing damage first (`app/combat/hp.js`), so "20 damage with 10 THP"
  is one entry instead of editing two fields — Oct 2026.
- [x] Combat card vitals: temp HP folded into the HP pill (one combined
  HP/THP editor, separate +THP chip removed) so AC / HP / DC fit one row;
  AC and DC pills dropped their icons — Oct 2026.
- [x] Party combat card at-a-glance (`PartyGlance.jsx`): clickable resource
  pips (spell slots first; options pools open the Resources modal), passive
  Perception/Insight/Investigation, speed, advantages chips; ability row leads
  with the modifier and shows save bonuses with proficiency marked — Oct 2026.
- [x] Party combat card header: the 6–8 icon buttons collapsed into one ⋯
  menu (`CardActionMenu`, fed by the shared `getCardActions` list); the name
  opens the character sheet, the Spell DC chip opens the spellbook, active
  Innate Sorcery shows a flame by the name. Enemy cards, Table rows and the
  Now card keep the icon row — Oct 2026.
- [x] /combat Enemies encounter bar: shows the loaded saved encounter's name
  (`loadedEncounter` in the active encounter), real bordered buttons for Edit
  Encounter (deep link `/encounters?edit=<id>&from=combat` → editor with
  Return to Combat), Load Encounter / Load Another (Add to Combat or Replace
  Enemies), Lair Action, Clear, Add Monster. Saved encounters can carry a lair
  action (editor panel) that loads with them. Also fixed: the /encounters page
  armed auto-save with a 0ms timer instead of SAVE_ARM_DELAY_MS (could echo the
  loaded list), and it now flushes a pending save on unmount — Oct 2026.
  Not done: editing a saved encounter doesn't change monsters already in the
  fight (use Load Another → Replace Enemies); fights older than this have no
  `loadedEncounter` and show "Unsaved encounter".
- [x] "+ Lair Action" seemed to vanish: the lair action was only rendered
  inside the Manage Order modal. It now also shows as a card (initiative,
  notes, remove) in the Enemies section — Oct 2026.
- [x] Timed combat conditions: an optional duration per condition entry —
  `rounds: N` (ticks down at the start of the bearer's turn, removed at 0) or
  `until: 'endOfNextTurn'` (→ `'endOfThisTurn'` at that turn's start, removed
  when it ends) — set from the conditions picker, remaining time shown on the
  chip. `goToTurn` (refresh only) applies `applyTurnChange` and shows a
  dismissible, NOT persisted tracker reminder of what expired plus the new
  combatant's save-ends conditions (Frightened, Paralyzed, Stunned,
  Restrained, Charmed, Poisoned) — Oct 2026. Known limits: durations count
  the BEARER's turns, not the caster's (a "until the start of the caster's
  next turn" effect has to be timed by hand); jumping to the current
  combatant from the order modal counts as a new turn and ticks; the
  reminder disappears on reload; companions have no conditions at all.
- [x] Combat conditions as structured state: `conditions` array on party
  members and enemies (`app/combat/conditions.js`), removable chips + "+"
  picker on cards, table rows and the tracker's Now card (instant toggles,
  Exhaustion level stepper). Combat Notes is now free text only and available
  to party members too — Oct 2026. Not done: no custom (non-5e) condition tags (use notes), and
  old notes text that names conditions is NOT migrated into chips.
- [x] /combat combatant tabs: Party & Allies (cards) | Enemies (cards) | Table.
  Card tabs use the full width (up to 3 columns). The Table tab renders party
  and enemies as compact rows (`app/combat/components/CombatantTable.jsx`) —
  name/class or CR, Init, AC (click = temp AC), HP + bar (click = current HP),
  THP, spell DC (stat-block DC for enemies), speed, six abilities with mods,
  and the shared `CardActionButtons`/`CardModals`. Selected tab is per-viewer
  localStorage (`dm-combat-view-mode`) — Oct 2026. The table is expected to
  keep evolving (user wants to iterate on it).
  Quirk kept for parity with the card: an ability score of `0` displays as
  10/+0 (`character[key] || 10`), unlike `getModNum`'s real-0 rule.
- [x] Sort by Init breaks ties: higher DEX score wins, the lair action loses
  ties (5e RAW), remaining ties keep their order. Comparator is
  `compareInitiative` in `app/utils/rules.js` (see rules-math skill).
- [x] Turn tracker cleanup: the bar shows only the next combatant in an
  "Up Next" card, with a "Full Order" header button for the modal (chips removed); living
  legendary enemies get clickable budget pips on the bar (refresh at the start
  of the creature's turn; interrupt-panel actions spend their parsed cost via
  `app/combat/legendary.js`); the order modal gets a per-row Reaction toggle
  (`reactionsUsed` map in the encounter, refreshed when that combatant's turn
  starts, not on Back). Tests: `test/combat/turnTracker.test.jsx`,
  `test/combat/legendary.test.js`. Documented in frontend-patterns §2.5 —
  October 2026
- [x] Turn tracker, round 2: legendary budgets moved off the bar into a
  header **Legendary** button (mini dots; modal has the pips; replaces ⚡);
  a **This Turn** panel tracks action / bonus / reaction and movement
  (5/10/15-ft steps, Dash) for whoever's turn it is (`turnUsage`, persisted);
  on a monster's turn a panel lists its actions / bonus actions / reactions
  (Use spends the slot) and tracks limited uses — X/Day, recharge with a d6
  roll, per-rest (`abilityUses`), spell slots + per-day spells (existing
  card fields). Tests: `turnTracker.test.jsx`, `monsterAbilities.test.js` —
  October 2026. Follow-up: Up Next moved into the header row; movement is a
  typed "Moved" field plus a Dash toggle (+speed only; step buttons removed).
  Follow-up: limited uses render as pips like spell slots (Legendary
  Resistance = 3 circles); recharge abilities get one pip and the d6 Roll
  button was removed. Temp HP chip icon is now an outlined heart + plus.
- [x] Escape closes modals app-wide (shared `Modal`, topmost only — stacked
  modals peel one per press). The combat card's contextual buttons + modals
  were extracted to `CharacterCard/CardActionButtons.jsx` / `CardModals.jsx`
  and reused on the turn tracker's Now card; the card's display-AC formula
  moved verbatim into `getCardDisplayAC` (CharacterCard/utils.js). Tests:
  `test/components/modal.test.jsx`, `turnTracker.test.jsx` — October 2026
- [x] Movement tracking removed from the turn tracker (DM tracks it at the
  table): This Turn shows a read-only speed line with every mode
  (`formatSpeeds`); `turnUsage` is now `{ id, action, bonus }`. Deleted the
  dead `CharacterCard/CardHeader.jsx` (unimported duplicate of the card
  header) — October 2026
- [x] Party members on the turn tracker show spell save DC / spell attack and
  their EQUIPPED weapons (sheet attack/damage) + gear. The weapon math moved
  verbatim from InventoryTab into `app/utils/weaponStats.js`. Note: in the
  real data several weapons (Braadlei's daggers, Vesna's crossbow/scimitar)
  aren't marked equipped, so they won't show until ticked. Tests:
  `test/utils/weaponStats.test.js`, `turnTracker.test.jsx` — October 2026.
  Follow-up: loadout chips open `ItemDetailModal` (to-hit breakdown, props,
  mastery, description). Checked: Javelin of Lightning +2 / 1d6+0 for Marshuh
  is correct — Thrown without Finesse uses STR (10 → +0), prof +2.

- [x] **Turn tracker on /combat** — the initiative column now tracks whose turn
  it is instead of leaving it to the DM's memory. `TurnTracker.jsx` shows
  round, Now/Next and the End Turn / ← Back controls; the Now card's AC uses
  the initiative-row view (`getEquipmentAC` with `parseArmorNames: false`, cyan
  on `acEffect` — see the rules-math caller table), and the Now card and order
  rows show the DEX modifier via the canonical `getMod`. The full order renders
  ONLY inside `InitiativeOrderModal.jsx` (sort, drag-reorder, initiative
  editing, Now/Next badges, click-to-jump) — the "Sort by Init" / lair-action /
  companion page tests open the modal first. Page layout: the tracker is a
  full-width bar ABOVE the columns — Now card left, the rest of the round as
  clickable color-coded "Up Next" chips filling the middle (click to jump the
  pointer; chips wrap into the next round), controls right, and End Combat is
  a header button with an inline confirm. Party & Allies spans 2 of the 3 grid
  columns with cards in a 2-col sub-grid (`stretch` prop on CharacterCard
  evens up rows — see frontend-patterns §2.5 for why it must stay opt-in),
  Enemies takes the third; the tests' `getColumns` helper encodes the DOM
  shape. Legendary actions are an *interrupt* (`LegendaryActionModal.jsx`):
  they overlay the tracker, list the creature's legendary actions, and resume
  the same turn on Done, without touching the order. The pointer is derived
  from `{ index, id }` so it follows its combatant across a re-sort and clamps
  when one is removed. `initiativeOrder` + turn state now persist through the
  existing encounter auto-save, so a refresh no longer loses the manual order
  or the round. Tests: `test/combat/turnTracker.test.jsx` (11). Documented in
  frontend-patterns §2.5 (canonical) + the /api/encounter shape in dm-app-map
  — August 2026
- [x] Merged the Feats tab into Features. The tabs split had left feats data
  forked: the new FeatsTab wrote a fresh `character.feats` field (empty for
  everyone) while the real entries (Inspiring Leader, Metamagic) sat invisible
  in `character.features`, which no tab rendered anymore. FeaturesTab now has
  the "Feats & Other Features" section back (rich `feats.js` picker with
  categories/prereqs, plus FeatsTab's per-feat notes input); `character.features`
  is the single canonical field; the sheet folds any legacy `feats` array into
  `features` at load (persisted on next edit, no echo save); FeatsTab.jsx
  deleted. Pinned by `test/character/featuresTab.test.jsx` — July 2026
- [x] Fixed: CompanionsTab regression — the tabs refactor's real companions UI
  (familiars/steeds/summons, `character.companions`, the shape the combat page's
  initiative tracker consumes) was clobbered one commit later (d1d24ed) by a
  stale copy of FeaturesTab, so the Companions tab showed class features.
  Restored from 428bdfb, modernized (`generateId('companion')` ids, canonical
  `getMod` from rules.js instead of its local copy). Companions tab is now
  opt-in: shown when `character.companions` is non-empty or
  `character.companionsEnabled` is set ("+ Companions" button in the sheet's
  tab strip enables it; "Hide this tab" in the empty state disables it).
  Pinned by `test/character/companionsTab.test.jsx` — July 2026
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
