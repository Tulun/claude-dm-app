---
name: rules-math
description: Canonical D&D 5e rules math in this repo — ability modifiers, proficiency bonus, spell save DC, AC calculation, encounter XP budgets, and stat-block spellcasting parsing. Load this before touching ANY modifier/AC/DC/proficiency code, before adding a getMod-style helper anywhere, or when a bug report mentions wrong AC, wrong modifier, temp AC, or spell DC values.
---

# Rules Math: Single Source of Truth

All 5e math lives in `app/utils/rules.js` and `app/utils/acCalculation.js`.
**Never define a local getMod / prof-bonus / AC formula.** 14 inline copies were
consolidated in July 2026; the three intentional survivors are documented below
and in `SUGGESTIONS.md` (section "Rules-math consolidation leftovers").

## Canonical helpers — `app/utils/rules.js`

| Export | Returns | Notes |
|---|---|---|
| `getModNum(score)` | number | `Math.floor(((parseInt(score) \|\| 10) - 10) / 2)` — coerces junk AND `0` to 10 (see input quirk below) |
| `formatMod(mod)` | string | `"+2"` / `"-1"` |
| `getMod(score)` | **string** | `formatMod(getModNum(score))` |
| `getTotalLevel(character)` | number | Sums the multiclass `character.classes[].level` array; falls back to legacy `character.level` |
| `getProfBonus(character)` | number | Character level first (multiclass-aware); if no level, monster CR table: CR 0–4 → +2 … CR 29+ → +9; defaults to 2 |
| `getSpellSaveDC(character)` | number or null | `8 + prof + mod(spellStat)`, **+1 if `character.innateSorcery`** (Sorcerer feature). Null when no `spellStat` |
| `getSpellAttackBonus(character)` | string or null | `prof + mod(spellStat)` formatted. Innate Sorcery does NOT apply here — DC only |

`app/combat/components/CharacterCard/utils.js` re-exports these
(`getMod`, `getModNum`, `getProfBonus`, `getSpellSaveDC`, `getSpellAttackBonus`)
so combat-card imports keep working. Its `getMod` is the STRING one.

## NAME COLLISION: two `getMod`s with different return types

`app/character/components/constants.js` does:

```js
export const getMod = getModNum;   // returns a NUMBER
export const formatMod = formatModifier;
```

- `getMod` from `app/character/components/constants.js` → **number** (it is `getModNum`)
- `getMod` from `app/utils/rules.js` or `app/combat/components/CharacterCard/utils.js` → **string** like `"+2"`

Before using `getMod`, check the import path. Doing arithmetic on the string
one, or rendering the number one where "+2" is expected, are both silent bugs.
When writing new code, prefer importing `getModNum` / `getMod` (string) directly
from `app/utils/rules.js` so intent is unambiguous.

## AC — `app/utils/acCalculation.js`

- `getEquipmentAC(character, { includeTempAC = true, parseArmorNames = true })`
  → number, or **null** when the character has no inventory AND no `acEffect`
  (null means "no equipment info — the caller picks the fallback").
- `getCalculatedAC(character)` → `getEquipmentAC` with full defaults, falling
  back to `character.ac || 10` on null.

The option flags encode **deliberate** per-view differences. Do not "unify" them:

| Caller | Options | Fallback on null |
|---|---|---|
| `app/characters/page.jsx` | full defaults (temp AC in, name parsing on) | `character.ac \|\| 10` via `getCalculatedAC` |
| `app/combat/components/InitiativeItem.jsx` | `{ parseArmorNames: false }` | local wrapper |
| `app/combat/components/CharacterCard/utils.js` (`getCalculatedAC`) | `{ includeTempAC: false, parseArmorNames: false }` | card computes `character.acOverride || calculatedAC || character.ac || 10` |

### THE TEMP-AC TRAP (a past audit got this wrong)

The combat card adds `character.tempAC` **separately at display time** — in
`app/combat/components/CharacterCard/index.jsx`:

```js
const baseAC = character.acOverride || calculatedAC || character.ac || 10;
const displayAC = activeWildShapeForm ? (activeWildShapeForm.ac || 10) : (baseAC + tempAcValue);
```

So the combat-card AC helper passes `includeTempAC: false` on purpose. An audit
once flagged this as "combat card ignores temp AC" and the proposed fix would
have **double-counted** temp AC. Read the display code in
`CharacterCard/index.jsx` before touching anything temp-AC related.
(SUGGESTIONS.md completed log: "Investigated, not a bug".)

### `acEffect` values handled by `getEquipmentAC`

- `mageArmor` — base 13 + dex
- `barkskin` — floor of 16: when `10 + dexMod < 16`, base becomes 16 with no dex bonus; otherwise normal 10 + dex applies
- `unarmoredDefense` — barbarian 10 + con, monk 10 + wis; checks both the `character.classes` array and legacy `character.class`
- `draconicResilience` — 10 + cha

Armor-name → base-AC lookup (`ARMOR_AC_TABLE`) and light/medium/heavy inference
only run when `parseArmorNames` is true; otherwise only `item.baseAC` is used.
Shields add `baseAC || 2`; equipped non-armor items with `acBonus` stack.

## Input quirk (pinned by tests): score 0 becomes 10

`getModNum` uses `parseInt(score) || 10`, so a score of `0` and junk strings
both coerce to 10 (→ +0 mod). Real D&D says 0 → −5. Three local `getMod`s were
**intentionally not merged** because they treat 0 as a real 0:

- `app/combat/components/Modals.jsx` (`getMod` inside the modal component)
- `app/combat/components/TemplateEditor.jsx`
- `app/combat/components/ImportMonsterModal.jsx`

Decide the 0-score semantics FIRST (see SUGGESTIONS.md item), then merge — do
not silently swap one behavior for the other. The quirk is pinned by the test
"defaults missing or junk input to 10" in `test/combat/characterCardUtils.test.js`.

## Encounter math — `app/encounters/constants.js`

- `crToNumber(cr)` — handles `'0'`, `'1/8'`, `'1/4'`, `'1/2'`, else `parseFloat`
- `XP_THRESHOLDS` — 2024 DMG, **per character per encounter**, levels 1–20, keys `low`/`moderate`/`high`
- `getDailyXPBudget(partyLevel, partySize)` — multiplies thresholds by party size (unknown level falls back to level 5)
- `DAILY_XP_BUDGET_2014` / `getDailyBudget2014(partyLevel, partySize)` — 2014 DMG full-adventuring-day budget

Do not mix the 2014 daily budget with the 2024 per-encounter thresholds.

## Stat-block spellcasting parsing

`parseSpellcasting(character)` in
`app/combat/components/CharacterCard/spellcastingParser.js` extracts
`{ found, dc, attack, cantrips, atWill, perDay, slots, notes, source }` from
trait/action text (names containing "spellcasting"), falling back to
`character.notes`.

- Slot lines accept both `"1st (4 slots):"` and Monster Manual `"1st level (4 slots):"`.
- **Known quirk:** a `"Cantrips (at will):"` header populates BOTH `cantrips`
  and `atWill` (the "at will" regex also matches inside the header). Documented
  in the test "parses cantrips lists" and in SUGGESTIONS.md — don't render both
  lists without dedup, and don't "fix" it without flipping that test deliberately.
- Adding a new stat-block format? Write the failing case in
  `test/combat/spellcastingParser.test.js` FIRST, then extend the regexes.

## Do NOT

- Do NOT write a new local `getMod`/`formatMod`/prof-bonus — import from `app/utils/rules.js`. The only sanctioned local copies are the three 0-score files above.
- Do NOT add temp AC inside any AC helper used by the combat card — it double-counts (see trap above).
- Do NOT assume `getMod` returns a number — check the import; `constants.js`'s is a number, everyone else's is a string.
- Do NOT change the `parseInt(score) || 10` coercion without updating the pinned characterization test and SUGGESTIONS.md.
- Do NOT collapse the `getEquipmentAC` option flags "for consistency" — each caller's flags are load-bearing.
- Do NOT use `Math.ceil(1 + level / 4)` for prof bonus in new code — it is multiclass-blind; use `getProfBonus`. Six legacy inline sites remain: `QuickResourcesModal.jsx:62`, `SpellsModal.jsx:333`, `CharacterSheetModal.jsx:35`, and `SorcererFeaturesModal.jsx:84` under `app/combat/components/CharacterCard/`, plus `app/character/components/tabs/SpellsTab.jsx:500` and `InventoryTab.jsx:464` (a `+1` variant). Note: the SUGGESTIONS.md "Local prof-bonus formulas" item lists only three of these — audit all six.

## Verifying changes

Run `npm test` (Vitest, 307 tests). Rules-math coverage lives in
`test/combat/characterCardUtils.test.js`, `test/utils/acCalculation.test.js`,
`test/combat/spellcastingParser.test.js`, `test/character/constants.test.js`,
and `test/encounters/constants.test.js` — see the **testing-and-validation**
skill for suite conventions. For where these files sit in the app, see
**dm-app-map**; for component-side display patterns, see **frontend-patterns**.
Quirks you decide to leave in place belong in `SUGGESTIONS.md`.
