'use client';

import Icons from '../components/Icons';
import { getDailyXPBudget } from './constants';

const EncounterList = ({
  encounters,
  partySize,
  partyLevel,
  calcMode,
  calculateEncounterStats,
  onEdit,
  onDuplicate,
  onDelete,
  onAddToDaily,
  onCreate,
}) => {
  const dailyBudget = getDailyXPBudget(partyLevel, partySize);

  const getDifficulty = (totalXP) => {
    if (calcMode === '2014') {
      if (totalXP >= dailyBudget.high) return { label: 'deadly', color: 'bg-red-900/50 text-red-300' };
      if (totalXP >= dailyBudget.moderate) return { label: 'hard', color: 'bg-orange-900/50 text-orange-300' };
      if (totalXP >= dailyBudget.low) return { label: 'medium', color: 'bg-yellow-900/50 text-yellow-300' };
      return { label: 'easy', color: 'bg-green-900/50 text-green-300' };
    } else {
      if (totalXP >= dailyBudget.high) return { label: 'high', color: 'bg-red-900/50 text-red-300' };
      if (totalXP >= dailyBudget.moderate) return { label: 'moderate', color: 'bg-yellow-900/50 text-yellow-300' };
      return { label: 'low', color: 'bg-green-900/50 text-green-300' };
    }
  };

  return (
    <div className="flex-1">
      <div className="bg-stone-900/50 border border-stone-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-amber-400">Saved Encounters</h2>
          <button
            onClick={onCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium"
          >
            <Icons.Plus /> New Encounter
          </button>
        </div>

        {encounters.length === 0 ? (
          <div className="text-center py-12 text-stone-500 border border-dashed border-stone-700 rounded-lg">
            <Icons.Scroll className="mx-auto mb-3 w-12 h-12 opacity-50" />
            <p>No saved encounters yet.</p>
            <p className="text-sm mt-1">Create an encounter to pre-plan your combats!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {encounters.map(encounter => {
              const stats = calculateEncounterStats(encounter);
              const difficulty = getDifficulty(stats.totalXP);
              return (
                <div
                  key={encounter.id}
                  className="bg-stone-800/50 border border-stone-700/50 rounded-lg p-4 hover:border-stone-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{encounter.name}</h3>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${difficulty.color}`}>
                          {difficulty.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-stone-400">
                        <span>{stats.monsterCount} creatures</span>
                        <span className="text-amber-400">{stats.totalXP.toLocaleString()} XP</span>
                      </div>
                      {encounter.monsters.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {encounter.monsters.slice(0, 5).map(m => (
                            <span key={m.id} className="text-xs bg-stone-700/50 px-2 py-0.5 rounded">
                              {m.quantity > 1 && `${m.quantity}x `}{m.customName || m.name}
                            </span>
                          ))}
                          {encounter.monsters.length > 5 && (
                            <span className="text-xs text-stone-500">+{encounter.monsters.length - 5} more</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onAddToDaily(encounter.id)}
                        className="p-2 rounded hover:bg-purple-900/50 text-purple-400"
                        title="Add to daily tracker"
                      >
                        <Icons.Plus />
                      </button>
                      <button
                        onClick={() => onEdit(encounter)}
                        className="p-2 rounded hover:bg-stone-700 text-amber-400"
                        title="Edit"
                      >
                        <Icons.Edit />
                      </button>
                      <button
                        onClick={() => onDuplicate(encounter)}
                        className="p-2 rounded hover:bg-stone-700 text-stone-400"
                        title="Duplicate"
                      >
                        <Icons.Copy />
                      </button>
                      <button
                        onClick={() => onDelete(encounter.id)}
                        className="p-2 rounded hover:bg-stone-700 text-red-400"
                        title="Delete"
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EncounterList;
