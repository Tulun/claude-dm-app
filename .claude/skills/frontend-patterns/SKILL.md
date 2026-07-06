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
are memoized. Therefore in `app/combat/page.jsx`:

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
  (`app/combat/useDragReorder.js`), not on the page. Each `InitiativeItem` gets
  ONE `drag` handlers-bundle prop plus per-row `isDragging`/`isDragOver`
  booleans — do not go back to passing four separate handler props or a shared
  `dragOverIndex` (the shared index re-rendered every row on hover).
- Inside `CharacterCard`, the ten modals are driven by ONE `activeModal`
  string (`'delete' | 'actions' | 'resources' | 'sheet' | 'inventory' |
  'notes' | 'statblock' | 'spells' | 'druid' | 'sorcerer'`, `null` = closed) —
  add new card modals to that enum, not as a new `showX` boolean.

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
  div as the child.
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
- Do NOT add a new `dangerouslySetInnerHTML` or touch the escape-then-highlight
  order in `app/spellbook/formatSpellText.js`.
- Do NOT include tempAC inside AC calculation helpers used by the combat card —
  it is added at display time (double-count bug).
- Do NOT make `saveEnabled` a `useState` — the flip would re-run every effect
  that reads it and fire the saves you were trying to suppress.
