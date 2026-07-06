---
name: dm-app-map
description: Architecture map and working process for this D&D dungeon-master app (Next.js 16, plain JSX, Vitest). Load this FIRST for any task in this repo — "where does X live", "add a feature to the combat/character/encounter page", "which API route stores Y", "what's the data shape for characters/spells/templates", or before starting any refactor.
---

# dm-app Architecture Map

A local, single-user D&D 5e dungeon-master tool. Next.js 16 App Router, **plain JSX (no TypeScript)**, Tailwind 4, Vitest (jsdom). No state library, no React context — every page is a `'use client'` component that fetches its data on mount and auto-saves with a debounced POST. Persistence is JSON files on disk, not a database.

## The universal page pattern

State-heavy pages (combat, characters, encounters) do this (see `app/characters/page.jsx` or `app/encounters/page.jsx` for reference):

1. `'use client'` at the top.
2. `useEffect` on mount → `fetch('/api/<resource>')` → `setState`.
3. A second `useEffect` watching the state → debounced `setTimeout` → `fetch(POST)` the whole payload back. A `saveEnabled` ref gates saving until the initial load finishes.

Library pages (spellbook, magic-items, templates, dm) save explicitly per action instead of watching state; `app/character/page.jsx` debounces saves but has no `saveEnabled` gate; classes is static.

Follow this pattern for new pages. Do not introduce Redux/Zustand/Context.

## Page inventory

| Route | File | Purpose |
|---|---|---|
| `/combat` | `app/combat/page.jsx` | Initiative tracker: party, enemies, companions, lair actions, rounds/turns |
| `/characters` | `app/characters/page.jsx` | Roster of party members + DM NPCs |
| `/character?id=X&type=party\|dm-npc` | `app/character/page.jsx` | Full character sheet editor. `type` picks the backing API (`party` → `/api/party`, `dm-npc` → `/api/dm-npcs`, anything else falls back to `/api/templates`) |
| `/encounters` | `app/encounters/page.jsx` | Encounter planner (XP budgets) + saved-encounter library |
| `/spellbook` | `app/spellbook/page.jsx` | Global spell library, plus AI spell parsing |
| `/magic-items` | `app/magic-items/page.jsx` | Magic item library |
| `/classes` | `app/classes/page.jsx` | Static class reference (`classData.js`, `classDetails.js`) |
| `/templates` | `app/templates/page.jsx` | Monster template library |
| `/dm` | `app/dm/page.jsx` | Tabs: session notes, world notes, DM characters, NPC generator, Campaign (read-only Obsidian vault dashboard, `app/dm/components/VaultTab.jsx`) |

`app/character/components/TabContent.jsx` is a **legacy ~1500-line mega-component** being incrementally replaced by `app/character/components/tabs/` (ResourcesTab, InventoryTab, SpellsTab, FeaturesTab, FeatsTab, BackgroundTab, NotesTab, CompanionsTab, WildShapeTab). Add new sheet functionality to `tabs/`, not to TabContent.

Shared UI: `app/components/` (Navbar.jsx, Icons.jsx, ui.jsx, defaultData.js). (`app/components/QuickResourcesModal.jsx` is a 0-byte dead file slated for deletion — the real one lives under `app/combat/components/CharacterCard/`.)

## API inventory (all under `app/api/*/route.js`)

Eight fs-backed JSON CRUD routes persisting to `data/*.json` — seven via `lib/jsonStore.js`; the templates route is the exception (raw `node:fs` with its own constants, writing a versioned `{ _version, templates }` wrapper):

- `/api/party` → `data/party.json` (party members — most valuable user data)
- `/api/dm-npcs` → `data/dm-npcs.json`
- `/api/encounter` → `data/encounter.json` — the **active combat** (`{ enemies, round, turnIndex }` + lairAction). Singular.
- `/api/encounters` → `data/encounters.json` — the **saved-encounter library**. Plural. Do not confuse the two.
- `/api/spells` → `data/spells.json` (also syncs edits into character spell instances)
- `/api/magic-items` → `data/magic-items.json`
- `/api/templates` → `data/templates.json` + lazy Conflux loading (see below)
- `/api/dm` → `data/dm.json` (world + session notes)

Two Anthropic-vision parser routes: `/api/parse-monster` and `/api/parse-spell`. Both require `ANTHROPIC_API_KEY` in `.env.local` and return a helpful error if it is missing.

One vault route: `/api/vault` serves the user's Obsidian vault (path from `OBSIDIAN_VAULT_PATH` in `.env.local`) via `lib/vaultStore.js` for the /dm Campaign tab. It is **GET-only and traversal-guarded by design** — never add write endpoints; the vault is never modified by this app.

See the **api-route-conventions** skill before adding or editing routes.

## Data

- `data/*.json` is the user's **real campaign data**, deliberately tracked in git as a crude backup. Never delete or regenerate these files; treat any change to them as touching production data.
- `public/data/conflux-creatures.json` is 5.4 MB / 2383 monsters. It is **never imported statically** — it is lazy-loaded only inside `app/api/templates/route.js` when `GET /api/templates?source=conflux` is hit, and cached in module memory for the process lifetime (edit → restart dev server to see changes). Do not import it into any client bundle.

## Shared modules — reach for these BEFORE writing new logic

- `app/utils/rules.js` — canonical 5e math: `getModNum`, `getMod`, `formatMod`, `getTotalLevel`, `getProfBonus`, `getSpellSaveDC`, `getSpellAttackBonus`. Single source of truth (see **rules-math** skill).
- `app/utils/acCalculation.js` — `getEquipmentAC`, `getCalculatedAC`.
- `lib/jsonStore.js` — `dataPath`, `readJsonFile`, `writeJsonFile`, `deleteJsonFile`, `backupCorruptFile`. All routes persist through this except `app/api/templates/route.js`, which uses raw `node:fs` and a versioned `{ _version, templates }` wrapper (plus its own Conflux loader).
- `app/magic-items/constants.js` (`ITEM_CATEGORIES`, `RARITIES`, `RARITY_VALUES`, `RARITY_COLORS`) + `app/magic-items/itemUtils.js` (`searchItems`, `sortItems`).
- `app/encounters/constants.js` — `crToNumber`, `XP_THRESHOLDS`, `getDailyXPBudget`, `getDailyBudget2014`.
- `app/combat/components/CharacterCard/spellcastingParser.js` — `parseSpellcasting` for monster stat-block spellcasting text.
- `app/character/components/constants.js` — re-exports the rules helpers and defines `formatClasses` (subclass-aware) plus class/subclass/skill tables for the sheet editor.

## Data-shape conventions

- **Dual class shape**: characters may have the legacy `{class, level, subclass}` flat fields OR the new `{classes: [{name, level, subclass}]}` array — often both. **Always** use `getTotalLevel` (`app/utils/rules.js`) and `formatClasses` (`app/character/components/constants.js` or `app/character/components/index.js`) — never hand-roll the `classes?.length ? ... : ...` ternary again.
- **Spell field split**: spellbook spells (in `data/spells.json`) use `castingTime`; spell instances on characters use `castTime`. The sync in `app/api/spells/route.js` copies `castingTime → castTime` and strips the legacy `castingTime` key from character instances. UI code that displays both sources reads `spell.castTime || spell.castingTime`.
- **Template ids**: `mm-*` prefix = Monster Manual defaults; anything else (user-created templates get `tpl-${Date.now()}`) is `source: 'custom'`. `app/api/templates/route.js` backfills `source` at read time for any untagged template (`mm-*` prefix → `'mm'`, else `'custom'`), but persisted `source` values take precedence — and the tag IS stored in `data/templates.json` today, because clients POST the full array (tags included) back.
- **Entity ids** are strings like `` `enemy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` `` (combat enemies) or `` `party-${Date.now()}` ``. Never assume numeric ids.

## Process — follow every time

1. **Read `SUGGESTIONS.md` (repo root) before starting any task.** It is the living backlog and quirk registry. When you complete an item from it, move it to the "Completed log" section at the bottom.
2. **Quirks are pinned by characterization tests** (test names often start with `QUIRK:`). Changing a behavior means finding its pinning test and flipping it *deliberately in the same change* — a surprise test failure with "QUIRK" in the name means you changed intentional behavior.
3. **Definition of done**: `npx vitest run` green (307+ tests, `test/**/*.test.{js,jsx}`) AND `npm run build` clean. Both, always.

Commands: `npm run dev` · `npm run build` · `npm test` (= `vitest run`) · `npm run test:watch`.

## Traps — do NOT

- Do NOT confuse `/api/encounter` (active combat) with `/api/encounters` (saved library). One letter, different files, different shapes.
- Do NOT import `public/data/conflux-creatures.json` anywhere except the templates route — it's 5.4 MB and will wreck the bundle.
- Do NOT hand-roll class/level logic; the dual legacy/multiclass shape is exactly why `getTotalLevel`/`formatClasses` exist.
- Do NOT write `castingTime` onto a character's spell instance — use `castTime`; the spells-route sync strips `castingTime` from instances.
- Do NOT add new features to `app/character/components/TabContent.jsx`; extend `app/character/components/tabs/` instead.
- Do NOT add TypeScript, a state library, or React context — the codebase is deliberately plain JSX with local state.
- Do NOT edit or truncate `data/*.json` casually — it is the user's real campaign data.
- Do NOT declare a task done without both `npx vitest run` and `npm run build` passing.

## Sibling skills

**testing-and-validation** (Vitest layout, characterization tests), **api-route-conventions** (route/jsonStore patterns), **rules-math** (D&D math consolidation state), **frontend-patterns** (fetch/auto-save/modal conventions), **debugging-playbook** (common failure modes).
