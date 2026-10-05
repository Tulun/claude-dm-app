'use client';

import { formatSpeeds } from '../monsterAbilities';
import { getSpellSaveDC, getSpellAttackBonus } from '../../utils/rules';
import PartyLoadout from './PartyLoadout';

export const FRESH_USAGE = { action: false, bonus: false };

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
 * The current combatant's action economy — Action, Bonus Action and Reaction
 * toggles — plus their speeds for reference (movement itself is tracked at the
 * table; a typed "Moved" field + Dash toggle was tried and dropped, Oct 2026).
 * Action/bonus live in the page's `turnUsage` (whoever's turn it is); the
 * reaction is the shared per-round `reactionsUsed` map, so it stays in sync
 * with the order modal's toggles. Party members (`isParty`) also get their
 * spell save DC / spell attack and their equipped weapons + gear.
 */
export default function TurnEconomy({ combatant, isParty, usage, reactionUsed, onUpdate, onToggleReaction }) {
  const u = usage || FRESH_USAGE;
  const [walk, ...others] = formatSpeeds(combatant.speed);
  const spellDC = isParty ? getSpellSaveDC(combatant) : null;
  const spellAttack = isParty ? getSpellAttackBonus(combatant) : null;

  return (
    <div className="flex-1 min-w-0 rounded-lg border border-stone-700 bg-stone-950/40 p-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">This Turn</div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-1.5">
          <SlotToggle label="Action" used={u.action} onClick={() => onUpdate({ action: !u.action })} />
          <SlotToggle label="Bonus" used={u.bonus} onClick={() => onUpdate({ bonus: !u.bonus })} />
          <SlotToggle label="Reaction" used={!!reactionUsed} onClick={() => onToggleReaction(combatant.id)} />
        </div>

        <div data-testid="speeds" className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Speed</span>
          <span className="text-sky-300 font-semibold tabular-nums">{walk}</span>
          {others.map(s => (
            <span key={s} className="text-sky-200/80 tabular-nums">{s}</span>
          ))}
        </div>

        {spellDC != null && (
          <div data-testid="spellcasting" className="flex items-baseline gap-2 text-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Spells</span>
            <span className="text-purple-300 font-semibold tabular-nums">DC {spellDC}</span>
            {spellAttack && <span className="text-purple-200/80 tabular-nums">{spellAttack} to hit</span>}
          </div>
        )}
      </div>
      {isParty && <PartyLoadout character={combatant} />}
    </div>
  );
}
