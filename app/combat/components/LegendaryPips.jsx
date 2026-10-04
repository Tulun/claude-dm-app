'use client';

import { LEGENDARY_ACTIONS_PER_ROUND, toggledLegendaryUsed } from '../legendary';

// One creature's legendary-action budget as clickable pips (filled = spent).
const LegendaryPips = ({ creature, onSetUsed }) => {
  const used = creature.legendaryActionsUsed || 0;
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: LEGENDARY_ACTIONS_PER_ROUND }, (_, i) => (
        <button
          key={i}
          title={`${creature.name}: legendary action ${i + 1}${i < used ? ' (spent)' : ''}`}
          aria-pressed={i < used}
          onClick={() => onSetUsed(creature.id, toggledLegendaryUsed(used, i))}
          className={`w-4 h-4 rounded-full border-2 transition-colors ${
            i < used ? 'bg-stone-700 border-stone-600' : 'bg-purple-500 border-purple-300 hover:bg-purple-400'
          }`}
        />
      ))}
      <span className={`text-xs tabular-nums ${used >= LEGENDARY_ACTIONS_PER_ROUND ? 'text-stone-500' : 'text-purple-300'}`}>
        {LEGENDARY_ACTIONS_PER_ROUND - used}/{LEGENDARY_ACTIONS_PER_ROUND}
      </span>
    </div>
  );
};

export default LegendaryPips;
