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

  **Known gap (July 2026):** `updateInitiative` and `updateCompanion` follow
  this, but `updatePartyMember` (`app/combat/page.jsx:261`) and `updateEnemy`
  (`app/combat/page.jsx:263`) still `.map()` unconditionally — and the comment
  above them claims all list setters bail out. Practical impact is small
  (callers always pass a freshly spread object, so the guard only catches
  unmatched ids), but a no-op call still re-arms the debounced save. Tracked in
  `SUGGESTIONS.md` §2; if you add the guards, also fix the stale comment at
  `page.jsx:258-260` and delete this note.

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

In `app/combat/components/CharacterCard/index.jsx`:

```jsx
const calculatedAC = getCalculatedAC(character);            // from ./utils
const baseAC = character.acOverride || calculatedAC || character.ac || 10;
const displayAC = activeWildShapeForm ? (activeWildShapeForm.ac || 10) : (baseAC + tempAcValue);
```

- Precedence: manual override → equipment-derived AC → stored `ac` → 10.
- `tempAC` is added at DISPLAY time only. The card's `getCalculatedAC`
  (`app/combat/components/CharacterCard/utils.js`) deliberately calls
  `getEquipmentAC(character, { includeTempAC: false, parseArmorNames: false })`
  — including tempAC there would double-count it.
- Active wild shape REPLACES AC entirely (no tempAC added).
- Deeper AC/modifier math: see the `rules-math` skill and `app/utils/rules.js`.

## 5. Styling conventions

- Tailwind everywhere; page backgrounds are
  `bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100`.
- Color language: **emerald** = party/allies, **red** = enemies,
  **amber** = initiative/actions/highlights, **purple** = lair actions/arcane.
  Match these when adding UI.
- Modal overlays are hand-rolled divs: `fixed inset-0 bg-black/70` (opacity
  varies /50–/80 across ~33 copies — known inconsistency, tracked in
  `SUGGESTIONS.md` under "Shared `<Modal>` wrapper"). If your change touches
  several modals, extract a shared `Modal` component instead of adding copy #34;
  otherwise copy the pattern from the Load Encounter modal in
  `app/combat/page.jsx` (outer div closes on click, inner div
  `e.stopPropagation()`).
- Toast pattern: `setSaveStatus('Party saved')` then
  `setTimeout(() => setSaveStatus(''), 2000)`; `Navbar` renders the
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
