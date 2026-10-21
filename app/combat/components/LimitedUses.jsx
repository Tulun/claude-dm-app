'use client';

import { toggledLegendaryUsed as toggledUsed } from '../legendary';

const Pips = ({ label, total, used, onToggle, size }) => (
  <span className="flex items-center gap-1">
    {Array.from({ length: total }, (_, i) => (
      <button
        key={i}
        onClick={(e) => { e.stopPropagation(); onToggle(i); }}
        aria-pressed={i < used}
        title={`${label}: use ${i + 1}${i < used ? ' (spent)' : ''}`}
        className={`${size} rounded-full border transition-colors ${
          i < used ? 'bg-stone-700 border-stone-600' : 'bg-purple-500 border-purple-300 hover:bg-purple-400'
        }`}
      />
    ))}
  </span>
);

/**
 * `getLimitedPools` (app/combat/limitedUses.js) rendered as label + one pip
 * per use (filled = available, grey = spent; click toggles via
 * `toggledLegendaryUsed`). Shared by the tracker's Limited row and the enemy
 * card's glance block. `compact` = the card's smaller pips and labels.
 */
export default function LimitedUses({ pools, onUpdate, compact = false }) {
  return pools.map(p => (
    <span key={p.id} className="flex items-center gap-1.5 text-xs" title={p.title || undefined} data-testid="limited-pool">
      <span className={`${compact ? 'text-[11px] max-w-[9rem] truncate' : ''} ${p.isSlot ? 'text-purple-300/80' : 'text-purple-200'}`}>{p.label}</span>
      <Pips label={p.pipLabel} total={p.total} used={p.used} size={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} onToggle={(i) => onUpdate(p.set(toggledUsed(p.used, i)))} />
      {p.note && <span className="text-stone-500">{p.note}</span>}
    </span>
  ));
}
