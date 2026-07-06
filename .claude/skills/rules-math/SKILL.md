---
name: rules-math
description: Canonical D&D 5e rules math in this repo — ability modifiers, proficiency bonus, spell save DC, AC calculation, encounter XP budgets, and stat-block spellcasting parsing. Load this before touching ANY modifier/AC/DC/proficiency code, before adding a getMod-style helper anywhere, or when a bug report mentions wrong AC, wrong modifier, temp AC, or spell DC values.
---

# Rules Math: Single Source of Truth

All 5e math lives in `app/utils/rules.js` and `app/utils/acCalculation.js`.
**Never define a local getMod / prof-bonus / AC formula.** All inline copies
(14 in the first pass, plus the three 0-score `getMod`s and six inline
prof-bonus formulas) were consolidated in July 2026 — there are no sanctioned
local copies anymore.

## Canonical helpers — `app/utils/rules.js`

| Export | Returns | Notes |
|---|---|---|
| `getModNum(score)` | number | `parseInt`, then unparseable (NaN) input coerces to 10; a real `0` counts as 0 → −5 (see input handling below) |
| `formatMod(mod)` | string | `"+2"` / `"-1"` |
| `getMod(score)` | **string** | `formatMod(getModNum(score))` |
| `getTotalLevel(character)` | number | Sums the multiclass `character.classes[].level` array; falls back to legacy `character.level` |
| `getAllClasses(character)` | array | Normalizes the dual class shape to `[{name, level, subclass}]` (legacy flat fields become a one-entry array; `classes` wins when non-empty) |
| `getClassLevel(character, name)` | number | Level in one class (case-insensitive), 0 when absent |
| `isClass(character, name)` | boolean | `getClassLevel(...) > 0` |
| `formatClassList(character)` | string | `"Fighter 5 / Wizard 3"` — plain, no subclass. `app/character/components/index.js` re-exports it as `formatClasses`; the SUBCLASS-AWARE display variant (with CR fallback) is a separate `formatClasses` in `app/character/components/constants.js` |
| `getProfBonus(character)` | number | Character level first (multiclass-aware); if no level, monster CR table: CR 0–4 → +2 … CR 29+ → +9; defaults to 2 |
| `getSpellSaveDC(character)` | number or null | `8 + prof + mod(spellStat)`, **+1 if `character.innateSorcery`** (Sorcerer feature). Null when no `spellStat` |
| `getSpellAttackBonus(character)` | string or null | `prof + mod(spellStat)` formatted. Innate Sorcery does NOT apply here — DC only |

`app/combat/components/CharacterCard/utils.js` re-exports these
(`getMod`, `getModNum`, `getProfBonus`, `getSpellSaveDC`, `getSpellAttackBonus`,
`getAllClasses`, `getClassLevel`, `isClass`, `formatClassList`)
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

The option flags encode **deliberate** per-view differences. Do not "unify" them.
This table and the temp-AC trap below are the CANONICAL home for per-view AC
behavior — frontend-patterns §4 and the debugging-playbook AC entry point here;
update this section (only) when the behavior changes:

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

Armor-name → base-AC lookup (`ARMOR_AC_TABLE`, exported: name fragment →
`{ baseAC, armorType }`) and light/medium/heavy inference only run when
`parseArmorNames` is true; otherwise only `item.baseAC` is used. Shields add
`baseAC || 2`; equipped non-armor items with `acBonus` stack. The module also
exports `getArmorData(item)` → `{ baseAC, armorType }` or null (name /
armorType-field / "AC n" description lookup, shields included) — used by the
character sheet's inventory when adding armor; the shield entry is deliberately
excluded from the body-armor lookup inside `getEquipmentAC`.

## Input handling (pinned by tests): 0 is a real score, junk coerces to 10

Since July 2026, `getModNum` treats a score of `0` as a real 0 (→ −5, correct
D&D math), while missing/unparseable input (undefined, null, `'potato'`) still
coerces to 10 (→ +0). Pinned by "defaults missing or junk input to 10" and
"treats a score of 0 as a real 0 (-5), not missing input" in
`test/combat/characterCardUtils.test.js`. The three local `getMod`s that
historically preserved the 0 → −5 behavior (Modals.jsx, TemplateEditor.jsx,
ImportMonsterModal.jsx) were merged into the canonical helper in the same
change.

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
- A `"Cantrips (at will):"` header populates ONLY `cantrips` — "at will"
  occurrences inside a cantrips header are skipped, so a separate `"At will:"`
  line is still parsed into `atWill` (fixed July 2026; tests "parses cantrips
  lists" and "still parses a real at-will line alongside a cantrips header").
- Adding a new stat-block format? Write the failing case in
  `test/combat/spellcastingParser.test.js` FIRST, then extend the regexes.

## Do NOT

- Do NOT write a new local `getMod`/`formatMod`/prof-bonus — import from `app/utils/rules.js`. There are no sanctioned local copies.
- Do NOT add temp AC inside any AC helper used by the combat card — it double-counts (see trap above).
- Do NOT assume `getMod` returns a number — check the import; `constants.js`'s is a number, everyone else's is a string.
- Do NOT change the getModNum input coercion (junk → 10, real 0 → −5) without updating the pinned characterization tests and SUGGESTIONS.md.
- Do NOT collapse the `getEquipmentAC` option flags "for consistency" — each caller's flags are load-bearing.
- Do NOT use `Math.ceil(1 + level / 4)` for prof bonus — it is multiclass-blind; use `getProfBonus`. The six legacy inline sites were consolidated in July 2026 (the InventoryTab variant also carried a stray `+1` that was deliberately dropped).

## Verifying changes

Run `npm test` (full Vitest suite, must be green). Rules-math coverage lives in
`test/combat/characterCardUtils.test.js`, `test/utils/acCalculation.test.js`,
`test/combat/spellcastingParser.test.js`, `test/character/constants.test.js`,
and `test/encounters/constants.test.js` — see the **testing-and-validation**
skill for suite conventions. For where these files sit in the app, see
**dm-app-map**; for component-side display patterns, see **frontend-patterns**.
Quirks you decide to leave in place belong in `SUGGESTIONS.md`.
