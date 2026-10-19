---
name: frontend-patterns
description: Client-side conventions for this app's React pages — the save-gating pattern for auto-save effects, the combat page memoization contract (React.memo + stable useCallback), the single-XSS-sink rule for spell text, AC display logic, and Tailwind/modal/toast styling conventions. Load when adding or editing any page under app/, adding an auto-save effect, touching app/combat/, rendering user-entered text, or building a modal.
---

# Frontend Patterns

Conventions that have each been broken at least once. Follow them exactly. For
where files live, see the `dm-app-map` skill; for how to test pages, see
`testing-and-validation`.

## 1. Save gating (the most-regressed pattern)

Every page that auto-saves keeps saving DISABLED until the initial fetch
settles. This bug — loading data echoing an unchanged POST straight back to
the API — shipped once on three pages simultaneously. The pattern, from
`app/characters/page.jsx`:

```jsx
const saveEnabled = useRef(false);

useEffect(() => {
  Promise.all([...fetches...]).then(...).catch(console.error).finally(() => {
    setTimeout(() => { saveEnabled.current = true; }, 500);
  });
}, []);

useEffect(() => {
  if (!saveEnabled.current || !party) return;   // gate FIRST
  const timeout = setTimeout(() => { fetch('/api/party', { method: 'POST', ... }); }, 1000);
  return () => clearTimeout(timeout);
}, [party]);
```

Rules:
- `saveEnabled` is a `useRef(false)`, never state (a state flip would re-run effects).
- Flip it to `true` via `setTimeout(..., 500)` AFTER the load settles — on the
  error path too (see both `setTimeout` calls in the load effect of
  `app/combat/page.jsx`). The 500ms lets React state settle before saves arm.
- Every auto-save effect early-returns while `saveEnabled.current` is false,
  then debounces the POST by 1000ms with cleanup (`clearTimeout`).
- Any NEW auto-save effect MUST use this gate, and its page test MUST assert
  zero POSTs after load. Reference tests:
  `test/combat/combatPage.test.jsx` — "does not echo loaded data back to the API after load"
  `test/characters/charactersPage.test.jsx` — asserts `postCalls(fetchMock, '/api/dm-npcs')` is empty after load.
- Existing gated pages: `app/combat/page.jsx`, `app/characters/page.jsx`,
  `app/encounters/page.jsx`.
- This section is the CANONICAL home for the gate/debounce timings (500ms arm,
  1000ms debounce). In code they live as named constants in
  `app/utils/timings.js` (`SAVE_ARM_DELAY_MS`, `SAVE_DEBOUNCE_MS`,
  `SHEET_SAVE_DEBOUNCE_MS` for the character sheet's 1500ms variant, plus the
  toast durations). The test-settle advances in **testing-and-validation**
  (~1600ms after load, ~1100ms after an edit) and the "wait ~2 seconds" advice
  in **debugging-playbook** derive from them — if you change the timings,
  update the constants, this section, and both derived references in the same
  change.

**Intentional exception:** the dm-npcs save in `app/characters/page.jsx` fires
even when `dmNpcs` is `[]` — deleting the last NPC must persist (this was a
data-loss bug). Do not "optimize" it away with a `length > 0` check. Test:
"persists deleting the last NPC (empty list is saved)".

## 2. Combat page memoization contract

`CharacterCard` (`app/combat/components/CharacterCard/index.jsx`, exported as
`React.memo(CharacterCard)`) and `InitiativeItem`
(`app/combat/components/InitiativeItem.jsx`, `export default memo(InitiativeItem)`)
are memoized, as are the Table-view rows (`CombatantRow` inside
`app/combat/components/CombatantTable.jsx`, `React.memo`). Therefore in
`app/combat/page.jsx`:

- Every function prop passed to them MUST be a stable `useCallback` using
  functional setState. A fresh inline closure compiles and runs fine but
  silently kills the memoization — no error, just re-renders.
- List-updater callbacks bail out by returning `prev` when nothing matched.
  This prevents no-op re-renders AND spurious auto-saves (a new array identity
  with identical contents still triggers the `[party]` save effect):

```jsx
setEnemies(prev => {
  const next = prev.map(x => x.id === id ? { ...x, initiative: newInit } : x);
  return next.some((x, i) => x !== prev[i]) ? next : prev;
});
```

- Companion updates reconstruct the composite id string
  `` `companion-${p.id}-${comp.id}` `` inside the setter (see `updateCompanion`)
  instead of looking anything up in derived lists — derived lists would make
  the callback unstable.
- The derived initiative pipeline is fully memoized:
  `partyCompanions` → `allCombatants` → `fullOrderIds` → `fullInitiativeList`,
  each a `useMemo`, with the final step using a `Map` lookup
  (`new Map(allCombatants.map(c => [c.id, c]))`). Keep new derived data inside
  this chain; do not compute per-render.
- `const EMPTY_TEMPLATES = [];` is module-level so the `templates` fallback
  prop (`templates || EMPTY_TEMPLATES`) keeps a stable identity. Never inline
  `templates || []` as a prop to a memoized component.
- `onToggleExpand` receives the character id: the card calls
  `onToggleExpand(character.id)`; the page handler is
  `useCallback((id) => setExpandedCards(prev => ({ ...prev, [id]: !prev[id] })), [])`.
- Initiative drag-reorder state lives in the `useDragReorder` hook
  (`app/combat/useDragReorder.js`), not on the page. An `InitiativeItem` that
  is meant to be draggable gets ONE `drag` handlers-bundle prop plus per-row
  `isDragging`/`isDragOver` booleans — do not go back to passing four separate
  handler props or a shared `dragOverIndex` (the shared index re-rendered every
  row on hover). `drag` is OPT-IN: only `InitiativeOrderModal` passes it (and
  supplies `onSelect` for click-to-jump). The main page renders exactly ONE
  `InitiativeItem` outside the modal: the lair action card in the Enemies
  section (both card and Table tabs; no drag/select; `lairActionEntry` is its
  own `useMemo` so the memoized row stays stable). Before it existed, "+ Lair
  Action" appeared to do nothing — the lair action only showed inside Manage
  Order. No other combatant gets a row on the page — initiative is a full-width `TurnTracker` bar
  ABOVE the combatant tabs (§2.5); the full order lives exclusively in the
  Manage Order modal. Layout: `main.children[0]` = initiative bar (header +
  tracker), `main.children[1]` = the combatant TABS — a `role="tablist"`
  (Party & Allies | Enemies | Table, each with a count badge) above the
  matching `<section aria-label="Party & Allies">` / `<section
  aria-label="Enemies">`. Party and Enemies tabs show only their own cards,
  full width in a `md:grid-cols-2 xl:grid-cols-3` grid (enemy grid uses
  `items-start` — see the no-stretch rule in §2.5); the Table tab shows BOTH
  sections stacked, each as a `CombatantTable`, with section `<h2>`s (the card
  tabs omit them — the tab is the title). Hidden sections are unmounted, so
  the Enemies-section **encounter bar** exists only on the Enemies/Table
  tabs: the loaded encounter's name (`loadedEncounter` `{ id, name }`, shown
  via the library's current name; "Unsaved encounter" / "None loaded"
  otherwise, `data-testid="encounter-name"`), then bordered `BAR_BUTTON`
  buttons — Edit Encounter (link to `/encounters?edit=<id>&from=combat`, only
  while that id is still in the library; else an "Encounters" link), Load
  Encounter / Load Another, Lair Action, Clear, Add Monster. The load modal
  offers **Add to Combat** (append; takes the saved lair action only if none
  exists; keeps the first loaded name) and, when enemies exist, **Replace
  Enemies** (swaps enemies + lair action + name; party and turn state kept).
  `/encounters` opens the editor for `?edit=`, shows Return to Combat for
  `from=combat`, and flushes a pending debounced save (keepalive POST) on
  unmount so leaving mid-debounce doesn't lose the edit. Page state `viewMode` (`'party' |
  'enemies' | 'table'`, default party) persists per viewer in
  `localStorage['dm-combat-view-mode']`, read in a mount effect, every access
  in try/catch (the pre-tabs value `'cards'` falls back to party). Tests find
  sections via the `getColumns` helper and switch with `showTab(name)`; both
  combat page test files `localStorage.clear()` in `beforeEach` so the saved
  tab doesn't leak between tests. `CombatantTable` takes the same
  `onUpdate`/`onRemove`/`templates` props as the cards and its inline
  HP/THP/temp-AC edits mirror the card badges' commit rules — keep them in
  sync if a badge's validation changes. Tests: `test/combat/combatantTable.test.jsx`
  and the "Party / Enemies / Table tabs" block in `combatPage.test.jsx`.
- Combatant modals are driven by ONE `activeModal` key (`'delete' | 'actions'
  | 'resources' | 'sheet' | 'inventory' | 'notes' | 'statblock' | 'spells' |
  'druid' | 'sorcerer' | 'conditions'`, `null` = closed) rendered by
  `CharacterCard/CardModals.jsx`; the contextual actions that open them are
  ONE descriptor list, `getCardActions(character, isEnemy, spellcastingInfo)`
  in `CharacterCard/CardActionButtons.jsx`, rendered two ways:
  `CardActionButtons` (icon row, `onOpen(key)`, each button's `aria-label` =
  its tooltip) on the Table-view rows, the turn tracker's Now card and ENEMY
  cards; and `CardActionMenu` (`CharacterCard/CardActionMenu.jsx`) — the
  PARTY card's single ⋯ button (`aria-label` "More actions for <name>",
  items are `role="menuitem"`, plus an Edit Character link). The menu portals
  to <body> with fixed positioning because the card is `overflow-hidden`.
  On party cards the name opens the sheet, the Spell DC chip opens the
  spellbook (when there are spells), and an active Innate Sorcery shows a
  flame beside the name (its lit header icon is now in the menu). Add new
  combatant modals/actions to `getCardActions` + CardModals (not as a
  `showX` boolean, not as a copy in one view). Tests:
  `test/combat/cardActionMenu.test.jsx`. The tracker keeps its own
  `cardModal` `{ id, key }` and renders `CardModals` OUTSIDE its sticky z-10
  bar (a fixed overlay inside that stacking context would sit under the
  navbar). Companions and the lair action get no card buttons.
- **Conditions vs notes** (canonical). Conditions are structured state on the
  combatant record — `conditions: [{ name }, { name: 'Exhaustion', level }]`
  (party → party.json, enemies → the encounter) — defined and manipulated ONLY
  through `app/combat/conditions.js` (`CONDITIONS` = the 15 core 2024
  conditions + Concentrating, with short summaries; `getConditions` tolerates
  missing/legacy-string data; `toggledConditions`, `withoutCondition`,
  `withExhaustionLevel` return the new array). `ConditionChips.jsx` renders
  them (× = one-click remove, "+" = `onOpen('conditions')`) on the card, the
  Table row and the tracker's Now card; `ConditionsModal` applies every toggle
  immediately via `onUpdate` (no Save step). `combatNotes` is the free-text
  catch-all — the Notes modal has NO condition quick-add chips anymore, and the
  Combat Notes button shows for party AND enemies. Don't park conditions in
  notes text, and don't add a second conditions shape.
  **Durations** are optional keys on the same entry: `rounds: N` (decremented
  at the START of the bearer's turn, removed at 0) or `until: 'endOfNextTurn'`
  (flips to `'endOfThisTurn'` at the bearer's next turn start, removed when
  that turn ends). Set them only via `withConditionDuration` (the picker's
  per-condition Duration row; Exhaustion never takes one); the chip shows
  `durationLabel` ("3r" / "next turn" / "this turn"). `goToTurn` with
  `refresh = true` runs `applyTurnChange(c, endingId, startingId)` over party
  and enemies through bail-out setters (untimed entries keep identity → no
  save), and sets page state `turnReminder` `{ id, expired, saves }` —
  transient, NOT in the encounter payload, cleared on every pointer move and
  End Combat, dismissible in the tracker. `saves` = the landed combatant's
  `SAVE_AT_END_OF_TURN` conditions (a reminder only, never automated). Back
  (`refresh = false`) never ticks.
  Tests: `test/combat/conditions.test.js`, `test/combat/conditionDurations.test.js`,
  `test/combat/conditionsUi.test.jsx`, `test/combat/conditionTimers.test.jsx`.

## 2.5 The combat turn tracker (canonical)

`app/combat/page.jsx` owns whose turn it is; `TurnTracker.jsx` only renders it.
Three rules keep the pointer honest:

- **`turn` state is `{ index, id }` — position AND occupant.** The rendered
  pointer is `activeIndex`, a `useMemo` that prefers `turn.id`'s current
  position and falls back to a clamped `turn.index` when that combatant has
  left the fight. Never store the resolved index in state: derive it, so a
  re-sort or a deletion can't leave the pointer aimed at the wrong creature.
  Every deliberate move goes through `goToTurn(index)`, which sets index and id
  together (`nextTurn`/`prevTurn` bump `round` first when they wrap).
- **The turn handlers read `listRef` / `activeIndexRef`, not state.**
  `goToTurn` is a prop on the memoized `InitiativeItem` rows, so it must be an
  empty-dependency `useCallback`. The refs are synced in `useEffect`s — do NOT
  assign `ref.current` during render, ESLint's react-hooks rules make that an
  **error** ("Cannot access refs during render"), and `npm run lint` must stay
  at 0 errors.
- **A legendary action is an interrupt, not a turn.** `interrupt`
  (`{ id, name, label }`) overlays the tracker and leaves `turn` untouched, so
  dismissing it resumes exactly where the round was. Do not implement it by
  splicing a temporary combatant into the initiative order.
- **The Now card's AC uses the initiative-row view** —
  `getEquipmentAC(c, { parseArmorNames: false })`, stored-ac fallback, cyan when
  `acEffect` — see the caller table in **rules-math** (canonical) before
  changing it.
- **The bar shows ONLY the next combatant**, inline in the tracker HEADER row
  (Round · Turn · Up Next · Full Order · Legendary on the left; ← Back ·
  End Turn → · End Combat on the right — the turn buttons live in the header,
  not under the This Turn panel), derived inside
  `TurnTracker` from `list` + `activeIndex` (cyclic, wraps into next round);
  the name element carries `data-testid="up-next"` and `title` = the
  combatant name (the tests key on this). It is not clickable; the
  "Full Order" header button opens the order modal (`onOpenOrder`) — the tracker no longer jumps the pointer;
  jumping happens from modal rows. **End Combat two-steps**: the header
  button swaps to an inline confirm (local `confirmingEnd` state) because
  ending combat discards the round/turn position — keep destructive tracker
  actions behind a confirm.
- **Turn start refreshes per-round resources.** `goToTurn(index, refresh = true)`
  clears the landed-on combatant's entry in `reactionsUsed` (page state,
  `{ [id]: true }`, persisted in the encounter — NOT on party/companion
  records) and zeroes that enemy's `legendaryActionsUsed`. Only `prevTurn`
  passes `refresh = false` (rewinding isn't a new turn). It also ticks timed
  conditions and raises the turn reminder — see "Conditions vs notes" (§2,
  canonical). `startCombat` resets
  both for everyone; `endCombat` clears reactions. Reactions are toggled on the
  order-modal rows (`InitiativeItem` `reactionUsed` + stable
  `onToggleReaction(id)`) AND on the tracker's This Turn panel — same map.
  Legendary budgets are NOT a panel on the bar (too much space): the header's
  **Legendary** button (beside Full Order; replaces the old ⚡ control) shows
  mini dots per living legendary enemy and opens `LegendaryActionModal`, whose
  rows carry clickable `LegendaryPips`; the interrupt panel also shows pips and
  clicking an action spends its parsed cost. Budget/cost math lives in
  `app/combat/legendary.js` (`LEGENDARY_ACTIONS_PER_ROUND`, `getLegendaryCost`,
  `toggledLegendaryUsed`) — shared with the enemy card's QuickActionsModal;
  don't re-hardcode `3`.
- **Action economy = `turnUsage`** (`{ id, action, bonus }`, page state,
  persisted). Only meaningful while `id` is the current combatant — the page
  passes `null` otherwise (e.g. after Back), and `updateTurnUsage` starts from
  `FRESH_USAGE` when the id is stale. `TurnEconomy.jsx` renders
  Action/Bonus/Reaction toggles plus a READ-ONLY speed line (every mode via
  `formatSpeeds`, e.g. "40 ft · climb 30 ft · fly 80 ft"). Movement is NOT
  tracked in the app — 5/10/15-ft step buttons, then a typed "Moved" field +
  Dash toggle, were both tried and dropped as awkward (Oct 2026). Don't
  re-add a movement tracker without the user asking. Party members
  (`isParty`) also get a Spells line (`getSpellSaveDC` / `getSpellAttackBonus`
  from rules.js — only when `spellStat` is set) and `PartyLoadout.jsx`:
  EQUIPPED weapons with the sheet's attack/damage (`getWeaponStatsFor`) and
  equipped gear chips; clicking any chip opens `ItemDetailModal.jsx` (to-hit /
  damage breakdown from `getWeaponStatsFor`'s `ability`/`abilityMod`/
  `profBonus`/`magicBonus`, property + mastery text, description as plain
  text). It PORTALS to <body> — anything opened from inside the sticky z-10
  tracker must either portal or render outside the bar. Unequipped items are
  deliberately hidden — the fix for "my weapon isn't showing" is ticking Equip
  on the sheet's inventory.
- **Monster panel**: on an enemy's turn `MonsterAbilities.jsx` renders
  INSIDE the This Turn box (passed as `TurnEconomy` children, below the
  economy toggles) and lists
  actions / bonus actions / reactions as chips (click → text + Use, which
  spends the matching economy slot via `onSpendSlot`), and a Limited row:
  X/Day, recharge and per-rest abilities stored in
  `enemy.abilityUses[name]` — each is a label + one `Pips` circle per use
  (same component as spell slots; recharge = a single pip, no dice roll —
  the DM rolls at the table and clicks the spent pip, or the selected
  ability's Recharge button, to restore; ability chips never grey out —
  the pips show what's spent), plus spell slots / per-day spells via the shared
  `parseSpellcasting` and the card's existing `spellSlots<level>Used` /
  `perDay<N>Used` fields. Parsing lives in `app/combat/monsterAbilities.js`.
- **Party cards stretch; enemy cards must NOT.** `CharacterCard` takes a
  `stretch` prop (party grid only): `h-full flex flex-col` + `mt-auto` on the
  collapsed stat bar so side-by-side cards line up. Never apply `h-full`
  unconditionally — the enemies column's grid cell has a resolved height, so an
  unconditional `h-full` inflated the first enemy card to the full column
  height (shipped briefly, August 2026).

All of it (plus `initiativeOrder`) persists through the ONE encounter auto-save
effect — see the payload shape in the **dm-app-map** skill. Tests:
`test/combat/turnTracker.test.jsx`.

## 3. XSS rule: exactly one dangerouslySetInnerHTML

The app has ONE sink: `app/spellbook/page.jsx` renders spell description
paragraphs via `dangerouslySetInnerHTML={{ __html: formatSpellText(paragraph) }}`.
`formatSpellText` in `app/spellbook/formatSpellText.js` HTML-escapes
(`&`, `<`, `>`, `"`) BEFORE applying keyword-highlighting `<span>`s. Tested in
`test/spellbook/formatSpellText.test.js`.

- Never add a second `dangerouslySetInnerHTML` anywhere.
- Never remove or reorder the escaping in `formatSpellText` — escaping must
  come first or the injected spans get escaped and markup executes.
- Treat all description text as untrusted: users type it, and the image-import
  pipeline writes model output straight into descriptions.

## 4. CharacterCard AC display logic

Precedence on the combat card (`app/combat/components/CharacterCard/index.jsx`):
manual `acOverride` → equipment-derived AC → stored `ac` → 10, with `tempAC`
added at DISPLAY time only, and an active wild shape REPLACING AC entirely
(no tempAC). The exact display snippet, the per-view `getEquipmentAC` option
flags, and the double-count trap live in the **rules-math** skill ("THE TEMP-AC
TRAP" — the canonical home for per-view AC behavior). Read it before touching
anything AC-related on this card.

## 5. Styling conventions

- Tailwind everywhere; page backgrounds are
  `bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100`.
- Color language: **emerald** = party/allies, **red** = enemies,
  **amber** = initiative/actions/highlights, **purple** = lair actions/arcane.
  Match these when adding UI.
- Modal overlays use the shared `Modal` component (`app/components/Modal.jsx`)
  — do NOT hand-roll a `fixed inset-0 bg-black/…` overlay div (34 copies were
  migrated in July 2026). `<Modal onClose={...}>` renders the standardized
  backdrop (`bg-black/70`, centered, `p-4`, z-50) and only fires `onClose`
  when the backdrop itself is clicked, so panel content needs no
  `stopPropagation`. Options: omit `onClose` for modals that must not close on
  backdrop click (see SpellPickerModal); `layer="raised"` (z-[60]) for a modal
  over a modal; `layer="top"` (z-[100]) to beat everything. Render your panel
  div as the child. **Escape** also calls `onClose`, but only for the TOPMOST
  open `Modal` (module-level open stack) — stacked modals peel one per press;
  an `onClose`-less modal still blocks Escape from reaching the one beneath;
  an inner handler can `e.preventDefault()` to keep Escape for itself. Tests:
  `test/components/modal.test.jsx`.
- Toast pattern: `const [saveStatus, showToast] = useToast()`
  (`app/hooks/useToast.js`), then `showToast('Party saved')` — auto-clears
  after `TOAST_DURATION_MS`; pass `TOAST_ERROR_DURATION_MS` for errors or
  `null` for a message that persists until the next one. Do NOT hand-roll the
  old `setSaveStatus(msg); setTimeout(clear, 2000)` pair. `Navbar` renders the
  `saveStatus` prop (`app/components/Navbar.jsx`). Note `saveStatus` is ONE
  shared string per page — on `/combat` three debounced effects (party,
  templates, encounter) all write it, so the toast shows whichever save
  resolved last. A report of "X saved when I edited Y" may be this race, not a
  wrong save — check which POST actually fired before trusting the toast text.

## 6. Testing hooks for pages

Pages import `next/link` and `next/navigation` (`useRouter` in combat,
`usePathname` in `app/components/Navbar.jsx`), so every page test must
`vi.mock` both — copy the mocks at the top of
`test/combat/combatPage.test.jsx`. Debounced saves need fake timers:
`vi.advanceTimersByTime(1100)` inside `act` to flush a 1000ms save debounce.
Full details in the `testing-and-validation` skill.

## Traps / Do NOT

- Do NOT add an auto-save effect without the `saveEnabled` ref gate — this
  exact regression shipped to three pages at once.
- Do NOT skip the "zero POSTs after load" assertion in the page test for any
  new auto-save.
- Do NOT add `if (list.length === 0) return;` to the dm-npcs save in
  `app/characters/page.jsx` — empty-list saves are intentional (delete-last-NPC
  persistence).
- Do NOT pass inline arrow functions or inline `|| []` fallbacks as props to
  `CharacterCard` or `InitiativeItem` — it silently defeats `React.memo`.
- Do NOT return a new array from a list setter when nothing changed — return
  `prev`, or you trigger a pointless render AND a pointless API save.
- Do NOT assign `ref.current` during render to make a handler stable (lint
  error, see §2.5) — sync the ref in a `useEffect`.
- Do NOT store the combat page's resolved turn index in state, and do NOT model
  a legendary action as a real entry in the initiative order (§2.5).
- Do NOT add a new `dangerouslySetInnerHTML` or touch the escape-then-highlight
  order in `app/spellbook/formatSpellText.js`.
- Do NOT include tempAC inside AC calculation helpers used by the combat card —
  it is added at display time (double-count bug).
- Do NOT make `saveEnabled` a `useState` — the flip would re-run every effect
  that reads it and fire the saves you were trying to suppress.
