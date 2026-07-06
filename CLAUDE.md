# dm-app — D&D 5e Dungeon Master tool

Local single-user Next.js 16 App Router app, plain JSX (no TypeScript), Tailwind 4,
Vitest (300+ tests; the count only grows). Persistence = JSON files under `data/` (real campaign data,
deliberately tracked in git). No state library — pages fetch on mount and auto-save
with debounced POSTs.

## Start here

- **`.claude/skills/` is the project knowledge base** — six skills written by the
  original lead. Load `dm-app-map` first for any task; the others cover testing,
  API routes, D&D rules math, frontend patterns, and debugging. They encode real
  incidents (data-loss bugs, double-count traps, save-echo regressions) — trust
  their "Do NOT" sections.
- **`SUGGESTIONS.md`** is the living backlog and quirk registry. Read it before
  starting work; move finished items to its Completed log.

## Commands

- `npm run dev` · `npm run build` · `npm test` (vitest run) · `npm run test:watch`
- `npm run lint` (0 errors expected) · `npm run format:check` (Prettier configured; no mass-reformat has been run)

## Non-negotiables

1. Definition of done: `npx vitest run` green AND `npm run build` clean.
2. Many behaviors are pinned by characterization tests (names often contain
   "QUIRK"). Changing behavior = flipping the pinning test deliberately in the
   same change.
3. Never silently overwrite a corrupt `data/*.json` — the `.bak` backup policy in
   the `api-route-conventions` skill is mandatory.
4. D&D math comes from `app/utils/rules.js` / `app/utils/acCalculation.js` — never
   define a local `getMod` (no sanctioned exceptions remain; see `rules-math` skill).
5. New auto-save effects must use the `saveEnabled` ref gate (see
   `frontend-patterns` skill) so loads never echo POSTs.
6. The skills are living docs. If a change alters behavior a skill documents,
   patch the skill in the same change. Drift-prone facts have ONE canonical
   skill home (marked "canonical" in the skill) — everywhere else must
   cross-reference it, never restate it.
