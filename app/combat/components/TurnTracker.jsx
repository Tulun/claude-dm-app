'use client';

import { memo, useState } from 'react';
import Icons from '../../components/Icons';
import { getEquipmentAC } from '../../utils/acCalculation';
import { getMod } from '../../utils/rules';
import { LEGENDARY_ACTIONS_PER_ROUND, getLegendaryCost } from '../legendary';
import LegendaryPips from './LegendaryPips';
import TurnEconomy from './TurnEconomy';
import MonsterAbilities from './MonsterAbilities';
import CardActionButtons from './CharacterCard/CardActionButtons';
import CardModals from './CharacterCard/CardModals';
import ConditionChips from './ConditionChips';
import { parseSpellcasting } from './CharacterCard/spellcastingParser';
import { getCardDisplayAC } from './CharacterCard/utils';

// Colour language matches the rest of combat: emerald = party, red = enemies,
// purple = companions/lair, amber = the turn pointer itself.
const KIND_STYLES = {
  party: { border: 'border-emerald-600/60', bg: 'bg-emerald-950/40', text: 'text-emerald-300' },
  companion: { border: 'border-purple-600/60', bg: 'bg-purple-950/40', text: 'text-purple-300' },
  enemy: { border: 'border-red-600/60', bg: 'bg-red-950/40', text: 'text-red-300' },
  lair: { border: 'border-purple-600/60', bg: 'bg-purple-950/40', text: 'text-purple-300' },
};

const styleFor = (kind) => KIND_STYLES[kind] || KIND_STYLES.party;

const combatantName = (c) => (c ? c.name : '—');

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

// Turn-start reminder from the page's goToTurn: timed conditions that just
// expired (anyone's) and the current combatant's conditions that usually
// allow a save at the end of its turn. Dismissible; replaced on every turn.
const TurnReminder = ({ reminder, name, onDismiss }) => (
  <div role="status" aria-label="Condition reminder" className="flex items-start justify-between gap-3 rounded-lg border border-amber-700/50 bg-amber-950/30 px-3 py-1.5 text-xs text-amber-200">
    <div className="space-y-0.5 min-w-0">
      {reminder.expired.map((e, i) => (
        <div key={i}>
          <span className="font-semibold">Expired</span> on {e.name}: {e.labels.join(', ')}
        </div>
      ))}
      {reminder.saves.length > 0 && (
        <div>
          <span className="font-semibold">End-of-turn save?</span> {name}: {reminder.saves.join(', ')}
        </div>
      )}
    </div>
    <button type="button" onClick={onDismiss} aria-label="Dismiss reminder" className="text-amber-400/70 hover:text-amber-200 shrink-0">
      <Icons.X />
    </button>
  </div>
);

/**
 * The turn bar above the combat columns: whose turn it is right now, who is
 * up next (in the header), and the current combatant's action economy
 * (This Turn — which also holds the current monster's abilities + limited-use
 * tracker). The header carries Full Order / Legendary beside the round/turn
 * info, and Back / End Turn / End Combat on the right.
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
  onOpenOrder,
  legendaryCreatures,
  onSetLegendaryUsed,
  turnUsage,
  reactionsUsed,
  onUpdateTurnUsage,
  onToggleReaction,
  onSpendSlot,
  onUpdateEnemy,
  interrupt,
  interruptCreature,
  onStart,
  onEndCombat,
  onNextTurn,
  onPrevTurn,
  onOpenLegendary,
  onResume,
  onUpdateParty,
  templates,
  reminder,
  onDismissReminder,
  onInspect,
  onInspectCurrent,
}) => {
  // Ending combat throws away the round/turn position, so it two-steps:
  // the header button swaps to an inline confirm.
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  // The Now card's own copy of the combatant modals (sheet, spells, stat
  // block…): { id, key }. Tied to whoever was current when it opened, so it
  // never shows a different combatant after the turn moves on.
  const [cardModal, setCardModal] = useState(null);

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

  // Only the next combatant shows here (wrapping into the next round); the
  // full order is one click away in the order modal.
  const n = list?.length || 0;
  const next = n > 1 ? list[(activeIndex + 1) % n] : null;
  const nextKind = next ? styleFor(kindOf ? kindOf(next) : 'party') : null;
  const nextDead = next && !next.isLairAction && next.currentHp <= 0;
  const interruptUsed = interruptCreature?.legendaryActionsUsed || 0;

  // Party members and enemies get the same contextual buttons as their card
  // (companions and the lair action have no card modals).
  const cardUpdate = currentKind === 'party' ? onUpdateParty : currentKind === 'enemy' ? onUpdateEnemy : null;
  const showCardButtons = !!(current && cardUpdate);
  const spellcastingInfo = showCardButtons ? parseSpellcasting(current) : null;
  const openCardModal = (key) => setCardModal({ id: current.id, key });
  const closeCardModal = () => setCardModal(null);

  // The modals render OUTSIDE the sticky bar: its z-10 stacking context would
  // otherwise trap their fixed overlay underneath the navbar.
  return (
    <>
    <div className="rounded-xl border border-amber-800/50 bg-stone-900/70 p-3 space-y-3 sticky top-2 z-10 shadow-lg shadow-black/40">
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <span className="font-bold uppercase tracking-widest text-amber-400">Round {round}</span>
          <span className="text-stone-500">Turn {turnNumber} / {turnCount}</span>
          {/* Just the next combatant — Full Order opens the rest. */}
          {next && (
            <span className="flex items-center gap-1.5 min-w-0 pl-3 border-l border-stone-700">
              <span className="font-bold uppercase tracking-widest text-stone-500">Up Next</span>
              {/* Clicking the name opens the detail drawer pinned to them */}
              <button
                type="button"
                data-testid="up-next"
                title={combatantName(next)}
                aria-label={`Details for ${combatantName(next)}`}
                onClick={onInspect ? () => onInspect(next.id) : undefined}
                className={`flex items-center gap-1.5 min-w-0 rounded hover:bg-stone-800/70 pr-1 ${nextDead ? 'opacity-40' : ''}`}
              >
                <span className={`px-1.5 py-0.5 rounded border ${nextKind.border} ${nextKind.bg} font-bold`}>{formatInit(next.initiative)}</span>
                <span className={`text-sm font-semibold truncate max-w-[240px] ${nextKind.text} ${nextDead ? 'line-through' : ''}`}>{combatantName(next)}</span>
              </button>
            </span>
          )}
          <button
            onClick={onOpenOrder}
            title="Show the full initiative order"
            className="flex items-center gap-1 px-2.5 py-1 rounded border border-amber-800/60 bg-amber-950/40 text-amber-300 hover:border-amber-600 hover:text-amber-200 font-medium"
          >
            <Icons.GripVertical />Full Order
          </button>
          <button
            onClick={onOpenLegendary}
            title="Slot in a legendary action"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-purple-800/60 bg-purple-950/40 text-purple-300 hover:border-purple-500 hover:text-purple-200 font-medium"
          >
            <Icons.Bolt />Legendary
            {legendaryCreatures?.map(c => {
              const left = LEGENDARY_ACTIONS_PER_ROUND - (c.legendaryActionsUsed || 0);
              return (
                <span key={c.id} title={`${c.name}: ${left}/${LEGENDARY_ACTIONS_PER_ROUND} left`} className="flex items-center gap-0.5 ml-0.5">
                  {Array.from({ length: LEGENDARY_ACTIONS_PER_ROUND }, (_, i) => (
                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < left ? 'bg-purple-400' : 'bg-stone-600'}`} />
                  ))}
                </span>
              );
            })}
          </button>
        </div>
        <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onPrevTurn}
          title="Back one turn"
          className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm"
        >
          ← Back
        </button>
        <button
          onClick={onNextTurn}
          className="px-5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm"
        >
          End Turn →
        </button>
        <span className="w-px self-stretch bg-stone-700 mx-1" aria-hidden />
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
      </div>

      {reminder && (
        <TurnReminder reminder={reminder} name={combatantName(current)} onDismiss={onDismissReminder} />
      )}

      <div className="flex flex-col lg:flex-row gap-3 lg:items-stretch">
        {interrupt ? (
          <div className="flex-1 min-w-0 rounded-lg border-2 border-amber-500 bg-amber-950/40 p-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
              <Icons.Bolt />{interrupt.label || 'Legendary Action'}
            </div>
            <div className="flex items-center justify-between gap-3 mt-1">
              <div className="text-xl font-bold text-amber-100 truncate">{interrupt.name}</div>
              {interruptCreature?.legendaryActions?.length > 0 && onSetLegendaryUsed && (
                <LegendaryPips creature={interruptCreature} onSetUsed={onSetLegendaryUsed} />
              )}
            </div>
            {interruptCreature?.legendaryActions?.length > 0 && (
              <ul className="mt-2 space-y-1">
                {interruptCreature.legendaryActions.map((la, i) => {
                  // Clicking an action spends its cost from the round's budget.
                  const cost = getLegendaryCost(la);
                  const affordable = interruptUsed + cost <= LEGENDARY_ACTIONS_PER_ROUND;
                  return (
                    <li key={la.name || i}>
                      <button
                        disabled={!affordable || !onSetLegendaryUsed}
                        onClick={() => onSetLegendaryUsed(interruptCreature.id, interruptUsed + cost)}
                        title={affordable ? `Spend ${cost} legendary action${cost === 1 ? '' : 's'}` : 'Not enough legendary actions left this round'}
                        className={`w-full text-left text-xs rounded px-1.5 py-1 ${
                          affordable ? 'text-stone-300 hover:bg-amber-900/30' : 'text-stone-600 cursor-not-allowed'
                        }`}
                      >
                        <span className={`font-medium ${affordable ? 'text-amber-300' : ''}`}>{la.name}</span>
                        {la.description ? ` — ${la.description}` : ''}
                      </button>
                    </li>
                  );
                })}
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
              {/* The name opens the detail drawer, following the turn */}
              <div className={`text-2xl font-bold truncate ${style.text}`}>
                <button
                  type="button"
                  onClick={onInspectCurrent}
                  title="Show full details"
                  className="max-w-full truncate text-left hover:underline decoration-2 underline-offset-4"
                >
                  {combatantName(current)}
                </button>
              </div>
              {current?.isCompanion && current.ownerName && (
                <div className="text-xs text-purple-400">{current.ownerName}&apos;s {current.form || 'companion'}</div>
              )}
              {current?.isLairAction && current.notes && (
                <div className="text-xs text-stone-300 mt-1">{current.notes}</div>
              )}
              <VitalsLine combatant={current} />
              {showCardButtons && (
                <div className="mt-1.5">
                  <ConditionChips character={current} onUpdate={cardUpdate} onOpen={openCardModal} compact />
                </div>
              )}
              {showCardButtons && (
                <div className="flex items-center gap-0.5 mt-1.5 -ml-2">
                  <CardActionButtons
                    character={current}
                    isEnemy={currentKind === 'enemy'}
                    spellcastingInfo={spellcastingInfo}
                    onOpen={openCardModal}
                  />
                </div>
              )}
            </div>

            {current && !current.isLairAction ? (
              <TurnEconomy
                combatant={current}
                isParty={currentKind === 'party'}
                usage={turnUsage}
                reactionUsed={!!reactionsUsed?.[current.id]}
                onUpdate={onUpdateTurnUsage}
                onToggleReaction={onToggleReaction}
              >
                {currentKind === 'enemy' && (
                  <MonsterAbilities
                    key={current.id}
                    creature={current}
                    usage={turnUsage}
                    reactionUsed={!!reactionsUsed?.[current.id]}
                    onUpdateEnemy={onUpdateEnemy}
                    onSpendSlot={onSpendSlot}
                  />
                )}
              </TurnEconomy>
            ) : (
              <div className="flex-1" />
            )}
          </>
        )}
      </div>
    </div>
    {showCardButtons && cardModal?.id === current.id && (
      <CardModals
        activeModal={cardModal.key}
        onClose={closeCardModal}
        character={current}
        isEnemy={currentKind === 'enemy'}
        onUpdate={cardUpdate}
        templates={templates}
        displayAC={getCardDisplayAC(current)}
        spellcastingInfo={spellcastingInfo}
      />
    )}
    </>
  );
};

export default memo(TurnTracker);
