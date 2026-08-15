'use client';

import Icons from '../../components/Icons';
import Modal from '../../components/Modal';

/**
 * Picker for slotting an out-of-turn action into the round. Creatures that
 * actually have legendary actions float to the top; anything else in the
 * encounter is still selectable (readied actions, reactions, mid-turn lair
 * effects). Choosing one sets the turn tracker's interrupt — it does NOT move
 * the turn pointer, so "Done" resumes exactly where the round was.
 */
export default function LegendaryActionModal({ isOpen, onClose, creatures, onSelect }) {
  if (!isOpen) return null;

  const withLegendary = creatures.filter(c => c.legendaryActions?.length > 0);
  const others = creatures.filter(c => !(c.legendaryActions?.length > 0));

  const row = (c) => (
    <button
      key={c.id}
      onClick={() => onSelect(c)}
      className="w-full text-left p-3 rounded-lg border border-stone-700 bg-stone-800/50 hover:border-amber-600/60 hover:bg-amber-950/20 transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium truncate">{c.name}</span>
        {c.legendaryActions?.length > 0 && (
          <span className="text-xs text-amber-400 shrink-0">
            {c.legendaryActions.length} legendary action{c.legendaryActions.length === 1 ? '' : 's'}
          </span>
        )}
      </div>
      {c.legendaryActions?.length > 0 && (
        <div className="text-xs text-stone-500 truncate mt-0.5">
          {c.legendaryActions.map(la => la.name).filter(Boolean).join(' · ')}
        </div>
      )}
    </button>
  );

  return (
    <Modal onClose={onClose}>
      <div className="bg-stone-900 border border-stone-700 rounded-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-stone-700">
          <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
            <Icons.Bolt /> Legendary Action
          </h2>
          <p className="text-sm text-stone-400 mt-1">
            Slot a creature in without losing your place — the round resumes where it left off.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {withLegendary.map(row)}
          {withLegendary.length > 0 && others.length > 0 && (
            <div className="pt-2 text-xs uppercase tracking-widest text-stone-600">Other combatants</div>
          )}
          {others.map(row)}
          {!creatures.length && (
            <div className="text-center py-8 text-stone-500">No enemies in this encounter.</div>
          )}
        </div>

        <div className="p-4 border-t border-stone-700">
          <button onClick={onClose} className="w-full py-2 rounded-lg bg-stone-700 hover:bg-stone-600">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
