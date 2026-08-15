'use client';

import { memo, useState } from 'react';
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

const CHIP_STYLES = {
  party: 'border-emerald-800/60 bg-emerald-950/40 text-emerald-200',
  companion: 'border-purple-800/60 bg-purple-950/40 text-purple-200',
  enemy: 'border-red-800/60 bg-red-950/40 text-red-200',
  lair: 'border-purple-700/60 bg-purple-950/40 text-purple-200',
};

const styleFor = (kind) => KIND_STYLES[kind] || KIND_STYLES.party;

const combatantName = (c) => (c ? (c.isLairAction ? 'Lair Action' : c.name) : '—');

const formatInit = (init) => {
  if (init === undefined || init === null) return '—';
  return Math.floor(init) === init ? init : init.toFixed(1);
};

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
 * The turn bar above the combat columns: whose turn it is right now, the
 * upcoming order as clickable chips, and the buttons that move the pointer.
 * Legendary actions are an *interrupt* — they overlay the pointer without
 * moving it, so ending the interrupt returns to exactly the same turn.
 */
const TurnTracker = ({
  combatActive,
  round,
  turnNumber,
  turnCount,
  current,
  currentKind,
  list,
  activeIndex,
  kindOf,
  onJumpTo,
  interrupt,
  interruptCreature,
  onStart,
  onEndCombat,
  onNextTurn,
  onPrevTurn,
  onOpenLegendary,
  onResume,
}) => {
  // Ending combat throws away the round/turn position, so it two-steps:
  // the header button swaps to an inline confirm.
  const [confirmingEnd, setConfirmingEnd] = useState(false);

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

  // The rest of the round in cyclic order after the pointer (wraps into the
  // top of the next round).
  const upcoming = [];
  const n = list?.length || 0;
  for (let i = 1; i < n; i++) {
    const index = (activeIndex + i) % n;
    upcoming.push({ c: list[index], index });
  }

  return (
    <div className="rounded-xl border border-amber-800/50 bg-stone-900/70 p-3 space-y-3 sticky top-2 z-10 shadow-lg shadow-black/40">
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold uppercase tracking-widest text-amber-400">Round {round}</span>
          <span className="text-stone-500">Turn {turnNumber} / {turnCount}</span>
        </div>
        {confirmingEnd ? (
          <div className="flex items-center gap-2">
            <span className="text-stone-400">End combat and reset the round?</span>
            <button
              onClick={() => { setConfirmingEnd(false); onEndCombat(); }}
              className="px-2.5 py-1 rounded bg-red-700 hover:bg-red-600 text-white font-medium"
            >
              End Combat
            </button>
            <button
              onClick={() => setConfirmingEnd(false)}
              className="px-2.5 py-1 rounded bg-stone-700 hover:bg-stone-600 text-stone-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingEnd(true)}
            className="px-2.5 py-1 rounded border border-red-900/60 text-red-400/80 hover:text-red-300 hover:border-red-700"
          >
            End Combat
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-stretch">
        {interrupt ? (
          <div className="flex-1 min-w-0 rounded-lg border-2 border-amber-500 bg-amber-950/40 p-3">
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
          <>
            <div className={`lg:w-72 shrink-0 rounded-lg border-2 ${style.border} ${style.bg} p-3`}>
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

            {/* The rest of the order as clickable chips — click to jump the
                pointer (same as the Manage Order modal rows). */}
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1.5">Up Next</div>
              <div className="flex flex-wrap gap-1.5">
                {upcoming.map(({ c, index }, i) => {
                  const kind = kindOf ? kindOf(c) : 'party';
                  const dead = !c.isLairAction && c.currentHp <= 0;
                  return (
                    <button
                      key={c.id}
                      title={combatantName(c)}
                      onClick={() => onJumpTo && onJumpTo(index)}
                      className={`flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-lg border text-sm transition-colors hover:border-amber-500/70 ${
                        CHIP_STYLES[kind] || CHIP_STYLES.party
                      } ${dead ? 'opacity-40' : ''} ${i === 0 ? 'ring-1 ring-amber-500/60' : ''}`}
                    >
                      <span className="w-6 h-6 rounded bg-black/30 flex items-center justify-center text-xs font-bold shrink-0">{formatInit(c.initiative)}</span>
                      <span className={`truncate max-w-[140px] ${dead ? 'line-through' : ''}`}>{combatantName(c)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <div className="flex items-center gap-2 shrink-0 lg:self-end">
          <button
            onClick={onPrevTurn}
            title="Back one turn"
            className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm"
          >
            ← Back
          </button>
          <button
            onClick={onNextTurn}
            className="flex-1 lg:flex-none px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm"
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
    </div>
  );
};

export default memo(TurnTracker);
