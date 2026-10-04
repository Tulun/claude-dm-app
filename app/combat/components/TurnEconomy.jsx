'use client';

import { parseWalkSpeed, otherSpeeds } from '../monsterAbilities';

export const FRESH_USAGE = { action: false, bonus: false, move: 0, dash: false };

const SlotToggle = ({ label, used, onClick }) => (
  <button
    onClick={onClick}
    aria-pressed={used}
    title={used ? `${label} used — click to restore` : `${label} available — click to mark used`}
    className={`px-2.5 py-1.5 rounded-md border text-xs font-bold uppercase tracking-wider transition-colors ${
      used
        ? 'border-stone-700 bg-stone-800/80 text-stone-500 line-through'
        : 'border-amber-700/60 bg-amber-950/40 text-amber-300 hover:border-amber-500'
    }`}
  >
    {label}
  </button>
);

/**
 * The current combatant's action economy: Action, Bonus Action, Reaction and
 * movement used, typed in by hand (feet moved so far this turn). Dash adds
 * another speed's worth to the turn's movement (it doesn't spend the Action —
 * a rogue's Cunning Action dashes with a bonus action, so mark that yourself). Action/bonus/move live in the page's `turnUsage`
 * (whoever's turn it is); the reaction is the shared per-round
 * `reactionsUsed` map, so it stays in sync with the order modal's toggles.
 */
export default function TurnEconomy({ combatant, usage, reactionUsed, onUpdate, onToggleReaction }) {
  const u = usage || FRESH_USAGE;
  const speed = parseWalkSpeed(combatant.speed);
  const moved = u.move || 0;
  const budget = u.dash ? speed * 2 : speed;
  const left = budget - moved;
  const extra = otherSpeeds(combatant.speed);

  return (
    <div className="flex-1 min-w-0 rounded-lg border border-stone-700 bg-stone-950/40 p-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">This Turn</div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5">
          <SlotToggle label="Action" used={u.action} onClick={() => onUpdate({ action: !u.action })} />
          <SlotToggle label="Bonus" used={u.bonus} onClick={() => onUpdate({ bonus: !u.bonus })} />
          <SlotToggle label="Reaction" used={!!reactionUsed} onClick={() => onToggleReaction(combatant.id)} />
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-400">
        <label className="flex items-center gap-2">
          Moved
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={moved || ''}
            placeholder="0"
            onChange={(e) => onUpdate({ move: Math.max(0, parseInt(e.target.value, 10) || 0) })}
            aria-label="Feet moved this turn"
            className="w-16 px-2 py-1 rounded bg-stone-800 border border-stone-700 text-stone-100 text-sm text-right tabular-nums focus:outline-none focus:border-amber-500"
          />
          <span data-testid="move-left" className="tabular-nums">
            / {budget} ft
            {left > 0 && <span className="text-stone-500"> · {left} left</span>}
            {left < 0 && <span className="text-red-400"> · {-left} over</span>}
          </span>
        </label>
          <button
            onClick={() => onUpdate({ dash: !u.dash })}
            aria-pressed={!!u.dash}
            title={u.dash ? 'Dashing — click to undo' : `Dash: +${speed} ft this turn`}
            className={`px-2.5 py-1.5 rounded-md border text-xs font-bold uppercase tracking-wider transition-colors ${
              u.dash
                ? 'border-sky-500 bg-sky-800/50 text-sky-100'
                : 'border-sky-800/60 bg-sky-950/40 text-sky-300 hover:border-sky-500'
            }`}
          >
            Dash{u.dash ? ` +${speed}` : ''}
          </button>
          {extra && <span className="text-stone-500">(also {extra})</span>}
        </div>
      </div>
    </div>
  );
}
