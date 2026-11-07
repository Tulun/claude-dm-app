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
| `npm run conflux:import -- <export.json>` | Rebuild the Conflux creature list from a new release (see below) |
| `npm run conflux:groups` | Rebuild the Conflux creature-group index from the newest Individual Links PDF (see below) |
| `npm run fm:import -- "<Flee, Mortals! PDF>"` | Import the Flee, Mortals! stat blocks from your own PDF into the monster library (see below) |

## Pages

- `/combat` — initiative tracker (party, enemies, companions, lair actions)
- `/characters` — party roster + DM NPCs
- `/character?id=…&type=party|dm-npc` — character sheet editor
- `/encounters` — encounter planner + saved-encounter library
- `/spellbook`, `/magic-items`, `/monsters`, `/classes` — libraries/reference
- `/dm` — session notes, world notes, NPC generator, Obsidian Campaign tab

## Data & persistence

`data/*.json` is real campaign data (tracked in git as a crude backup — see
SUGGESTIONS.md for the trade-offs). Pages fetch on mount and auto-save with
debounced POSTs to the API routes under `app/api/`. Treat `data/` as
production data: never truncate or regenerate it by hand.

## Importing Flee, Mortals! (MCDM)

With your own copy of the *Flee, Mortals!* PDF, every monster stat block can go
into the monster library in one pass — parsed locally from the PDF's text, no
AI or network:

```bash
npm run fm:import -- "~/Desktop/dnd-manuals/Flee, Mortals! The MCDM Monster Book v1.1.pdf" --dry-run
```

Drop `--dry-run` to write `data/templates.json` (the previous copy is kept as
`data/templates.json.bak`), then reload any open Monsters page — an open page
saves its whole list back and would otherwise drop the new monsters.

- Monsters get the book **Flee Mortals**, ids `fm-<name>`, and show on the
  library's own **Flee Mortals** tab (Official is Wizards of the Coast only); role (Brute, Minion, Solo…) and alignment go in the notes.
  XP is the book's own (minions are worth far less than their CR).
- **Villain actions** become legendary actions named `Villain Action 1: …`
  at 1 per round; the "three villain actions…" rule text goes in the notes.
  **Utility spells** become a `Spellcasting (Utility Spells)` trait the combat
  tracker reads.
- Re-running only adds what's missing: already-imported `fm-*` monsters keep
  your edits (`--force` overwrites them). A monster you'd already added by hand
  as a custom template (same name, no book) is skipped, not duplicated.
- Retainers and beastheart companions (level-scaled, no CR) and the optional
  feature tables are skipped. `--verbose` lists everything skipped.

## Updating Conflux creatures

The Conflux list (`public/data/conflux-creatures.json`) is generated, not
hand-edited. When a new Conflux release comes out, download its 5eTools
export and run:

```bash
npm run conflux:import -- ~/Desktop/conflux/ConfluxCreatures_1.58_5eTools.json --dry-run
```

`--dry-run` prints what would change (added / renamed / updated / removed)
without writing anything. Drop it to write the file, then **restart
`npm run dev`** (the API caches the list in memory). The new and updated
creatures show up under **Monsters → Conflux → Latest**.

- The release version comes from the file name (`_1.58_`). If a file is
  named differently, add `--version 1.58`.
- The `--` matters: without it npm swallows `--dry-run` / `--version`.
- Existing creature ids are kept (renames included), so links and saved
  encounters keep working.

### Conflux creature groups

**Monsters → Conflux → By Conflux Group** lists the creatures the way the
Conflux catalog does — by family ("Aboleths", "Goblins"…) under its sections
("Aberrations", "Humanoids"…), each with its CR range and a link to the
family's Homebrewery page. The index (`public/data/conflux-groups.json`) is
generated from the monthly *Individual Links* PDF. Drop the new month's PDF
into `~/Desktop/conflux` and, after `conflux:import`, run:

```bash
npm run conflux:groups -- --dry-run
```

It picks the newest `…Individual Links….pdf` in that folder (or pass a PDF or
folder: `npm run conflux:groups -- ~/Downloads/December.pdf`; `CONFLUX_DIR`
changes the default folder), reads its table of contents, downloads each linked
Homebrewery doc (cached in `node_modules/.cache/conflux-groups`; `--refresh`
refetches; a doc that fails to download falls back to last month's copy) and
matches the stat blocks to the imported creatures by name.

The PDF's layout isn't hard-coded — fonts and columns are worked out from each
month's file — and the result is compared with the last index written: it
prints which groups are new or gone, and if the group count or the number of
placed creatures drops sharply it **writes nothing** and says why (re-run with
`--force` if the drop is real). Creatures it can't place show under
"Ungrouped" — usually ones renamed since the last 5eTools export. Drop
`--dry-run` to write, then restart `npm run dev`.

## Contributing / working on the code

Start with `CLAUDE.md` and the skills under `.claude/skills/` — they are the
project knowledge base (architecture map, API conventions, D&D rules math,
frontend patterns, testing guide, debugging playbook). `SUGGESTIONS.md` is the
living backlog and quirk registry.

Definition of done for any change: `npx vitest run` fully green **and**
`npm run build` clean.
