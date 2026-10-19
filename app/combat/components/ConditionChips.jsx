'use client';

import {
  CONDITION_TONES, conditionLabel, durationLabel, durationTitle, getConditionInfo, getConditions, withoutCondition,
} from '../conditions';

/**
 * A combatant's active conditions as removable chips plus a "+" that opens
 * the conditions picker (CardModals key 'conditions' via `onOpen`). Used by
 * the combat card, the Table-view row and the turn tracker's Now card.
 * `compact` shrinks the chips for the table/tracker.
 */
export default function ConditionChips({ character, onUpdate, onOpen, compact = false }) {
  const conditions = getConditions(character);
  // Each chip is two separate hit targets (label → picker, × → remove) with
  // their own padding and a divider, so neither is a tiny sliver to aim at.
  const text = compact ? 'text-xs' : 'text-sm';
  const labelPad = compact ? 'pl-2.5 pr-2 py-1.5' : 'pl-3 pr-2.5 py-2';
  const removePad = compact ? 'px-2.5 py-1.5' : 'px-3 py-2';

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {conditions.map(c => {
        const label = conditionLabel(c);
        const info = getConditionInfo(c.name);
        const remaining = durationLabel(c);
        return (
          <span
            key={c.name}
            title={[info?.summary, durationTitle(c)].filter(Boolean).join(' — ') || undefined}
            className={`inline-flex items-stretch rounded-full border overflow-hidden leading-none ${text} ${CONDITION_TONES[info?.tone] || CONDITION_TONES.debuff}`}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onOpen('conditions'); }}
              className={`${labelPad} hover:bg-white/10 transition-colors`}
            >
              {label}
              {remaining && <span data-testid="condition-duration" className="ml-1 opacity-75 font-mono">{remaining}</span>}
            </button>
            <button
              type="button"
              aria-label={`Remove ${label} from ${character.name}`}
              onClick={(e) => { e.stopPropagation(); onUpdate({ ...character, conditions: withoutCondition(character, c.name) }); }}
              className={`${removePad} border-l border-current/20 opacity-70 hover:opacity-100 hover:bg-white/15 transition-colors`}
            >
              ×
            </button>
          </span>
        );
      })}
      <button
        type="button"
        aria-label={`Add condition to ${character.name}`}
        title="Add or remove conditions"
        onClick={(e) => { e.stopPropagation(); onOpen('conditions'); }}
        className={`rounded-full border border-dashed border-stone-600 text-stone-500 hover:text-amber-300 hover:border-amber-600 leading-none ${text} ${removePad}`}
      >
        {conditions.length || compact ? '+' : '+ Condition'}
      </button>
    </div>
  );
}
