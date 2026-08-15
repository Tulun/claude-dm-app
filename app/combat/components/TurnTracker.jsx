'use client';

import { memo } from 'react';
import Icons from '../../components/Icons';
import { getEquipmentAC } from '../../utils/acCalculation';
import { getMod } from '../../utils/rules';

// Colour language matches the rest of combat: emerald = party, red = enemies,
// purple = companions/lair, amber = the turn pointer itself.
const KIND_STYLES = {
  party: { border: 'border-emerald-600/60', bg: 'bg-emerald-950/40', text: 'text-emerald-300' },
  companion: { border: 'border-purple-600/60', bg: 'bg-purple-950/40', text: 'text-purple-300' },
  enemy: { border: 'border-red-600/60', bg: 'bg-red-950/40', text: 'text-red-300' },
  lair: { border: 'border-purple-600/60', bg: 'bg-purple-950/40', text: 'text-purple-300' },
};

const styleFor = (kind) => KIND_STYLES[kind] || KIND_STYLES.party;

const combatantName = (c) => (c ? (c.isLairAction ? 'Lair Action' : c.name) : '—');

// Small HP/AC strip shown under the current combatant's name.
// AC matches the initiative-row view: temp AC / acEffects included, no
// armor-name parsing; null means "no equipment info — show the stored AC"
// (see the caller table in the rules-math skill).
const VitalsLine = ({ combatant }) => {
  if (!combatant || combatant.isLairAction) return null;
  const down = combatant.currentHp <= 0;
  const calculatedAC = getEquipmentAC(combatant, { parseArmorNames: false });
  const displayAC = calculatedAC !== null ? calculatedAC : (combatant.ac || 10);
  return (
    <div className="flex items-center gap-3 text-xs text-stone-400 mt-0.5">
      <span className={`flex items-center gap-1 ${combatant.acEffect ? 'text-cyan-400' : ''}`}><Icons.Shield /> {displayAC}</span>
      <span className={`flex items-center gap-1 ${down ? 'text-red-500' : ''}`}>
        <Icons.Heart /> {combatant.currentHp}/{combatant.maxHp}
      </span>
      {combatant.dex != null && <span className="text-stone-500">{`DEX ${getMod(combatant.dex)}`}</span>}
      {down && <span className="text-red-500 font-medium uppercase tracking-wide">Down</span>}
    </div>
  );
};

/**
 * The turn pointer for the initiative column: whose turn it is right now,
 * who is next, and the buttons that move the pointer. Legendary actions are
 * an *interrupt* — they overlay the pointer without moving it, so ending the
 * interrupt returns to exactly the same turn.
 */
const TurnTracker = ({
  combatActive,
  round,
  turnNumber,
  turnCount,
  current,
  currentKind,
  next,
  nextKind,
  interrupt,
  interruptCreature,
  onStart,
  onEndCombat,
  onNextTurn,
  onPrevTurn,
  onOpenLegendary,
  onResume,
}) => {
  if (!combatActive) {
    return (
      <div className="rounded-xl border border-stone-700 bg-stone-900/60 p-3 flex items-center justify-between gap-3">
        <div className="text-sm text-stone-400">
          {turnCount > 0 ? `${turnCount} combatant${turnCount === 1 ? '' : 's'} in the order` : 'Add combatants to begin'}
        </div>
        <button
          onClick={onStart}
          disabled={!turnCount}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm ${
            turnCount
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-stone-800 text-stone-600 cursor-not-allowed'
          }`}
        >
          <Icons.Play />Start Combat
        </button>
      </div>
    );
  }

  const style = styleFor(currentKind);

  return (
    <div className="rounded-xl border border-amber-800/50 bg-stone-900/70 p-3 space-y-3 sticky top-2 z-10 shadow-lg shadow-black/40">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold uppercase tracking-widest text-amber-400">
          Round {round}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-stone-500">Turn {turnNumber} / {turnCount}</span>
          <button onClick={onEndCombat} className="text-stone-500 hover:text-red-400">End combat</button>
        </div>
      </div>

      {interrupt ? (
        <div className="rounded-lg border-2 border-amber-500 bg-amber-950/40 p-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
            <Icons.Bolt />{interrupt.label || 'Legendary Action'}
          </div>
          <div className="text-xl font-bold text-amber-100 mt-1">{interrupt.name}</div>
          {interruptCreature?.legendaryActions?.length > 0 && (
            <ul className="mt-2 space-y-1">
              {interruptCreature.legendaryActions.map((la, i) => (
                <li key={la.name || i} className="text-xs text-stone-300">
                  <span className="font-medium text-amber-300">{la.name}</span>
                  {la.description ? ` — ${la.description}` : ''}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs text-stone-400 truncate">
              Resuming: <span className="text-stone-200">{combatantName(current)}</span>
            </span>
            <button
              onClick={onResume}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium shrink-0"
            >
              <Icons.Check />Done
            </button>
          </div>
        </div>
      ) : (
        <div className={`rounded-lg border-2 ${style.border} ${style.bg} p-3`}>
          <div className="text-xs font-bold uppercase tracking-widest text-amber-400">Now</div>
          <div className={`text-2xl font-bold truncate ${style.text}`}>{combatantName(current)}</div>
          {current?.isCompanion && current.ownerName && (
            <div className="text-xs text-purple-400">{current.ownerName}&apos;s {current.form || 'companion'}</div>
          )}
          {current?.isLairAction && current.notes && (
            <div className="text-xs text-stone-300 mt-1">{current.notes}</div>
          )}
          <VitalsLine combatant={current} />
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-stone-400">
        <span className="uppercase tracking-widest text-[10px] font-bold text-stone-500">Next</span>
        <span className={`truncate font-medium ${styleFor(nextKind).text}`}>{combatantName(next)}</span>
        {next && !next.isLairAction && next.currentHp <= 0 && <span className="text-xs text-red-500">(down)</span>}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onPrevTurn}
          title="Back one turn"
          className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm"
        >
          ← Back
        </button>
        <button
          onClick={onNextTurn}
          className="flex-1 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm"
        >
          End Turn →
        </button>
        <button
          onClick={onOpenLegendary}
          title="Slot in a legendary action"
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-amber-900/50 hover:bg-amber-800/50 text-amber-300 text-sm"
        >
          <Icons.Bolt />
        </button>
      </div>
    </div>
  );
};

export default memo(TurnTracker);
