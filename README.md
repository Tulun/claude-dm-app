# dm-app — D&D 5e Dungeon Master Tool

A local, single-user toolkit for running D&D 5e games: initiative tracker,
party roster, full character sheets, encounter planner with XP budgets, spell
and magic-item libraries, monster templates, and DM notes with a read-only
Obsidian-vault dashboard.

Built with Next.js (App Router), plain JSX (no TypeScript), Tailwind 4, and
Vitest. No database — your campaign lives as JSON files in `data/`.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Optional `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-...        # enables the AI stat-block / spell image parsers
OBSIDIAN_VAULT_PATH=/path/to/vault   # enables the read-only Campaign tab on /dm
```

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build (must pass before shipping a change) |
| `npm test` | Full Vitest suite (must be green before shipping a change) |
| `npm run test:watch` | Vitest watch mode |

## Pages

- `/combat` — initiative tracker (party, enemies, companions, lair actions)
- `/characters` — party roster + DM NPCs
- `/character?id=…&type=party|dm-npc` — character sheet editor
- `/encounters` — encounter planner + saved-encounter library
- `/spellbook`, `/magic-items`, `/templates`, `/classes` — libraries/reference
- `/dm` — session notes, world notes, NPC generator, Obsidian Campaign tab

## Data & persistence

`data/*.json` is real campaign data (tracked in git as a crude backup — see
SUGGESTIONS.md for the trade-offs). Pages fetch on mount and auto-save with
debounced POSTs to the API routes under `app/api/`. Treat `data/` as
production data: never truncate or regenerate it by hand.

## Contributing / working on the code

Start with `CLAUDE.md` and the skills under `.claude/skills/` — they are the
project knowledge base (architecture map, API conventions, D&D rules math,
frontend patterns, testing guide, debugging playbook). `SUGGESTIONS.md` is the
living backlog and quirk registry.

Definition of done for any change: `npx vitest run` fully green **and**
`npm run build` clean.
