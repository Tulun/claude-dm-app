'use client';

import { useState } from 'react';
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
  const [showNameModal, setShowNameModal] = useState(false);
  const [newEncounterName, setNewEncounterName] = useState('');
  
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

  const handleCreateClick = () => {
    setNewEncounterName('');
    setShowNameModal(true);
  };

  const handleCreateConfirm = () => {
    const name = newEncounterName.trim() || 'New Encounter';
    onCreate(name);
    setShowNameModal(false);
    setNewEncounterName('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCreateConfirm();
    } else if (e.key === 'Escape') {
      setShowNameModal(false);
    }
  };

  return (
    <div className="flex-1">
      <div className="bg-stone-900/50 border border-stone-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-amber-400">Saved Encounters</h2>
          <button
            onClick={handleCreateClick}
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

      {/* New Encounter Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowNameModal(false)}>
          <div className="bg-stone-900 border border-amber-800/50 rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-stone-700">
              <h2 className="text-lg font-bold text-amber-400">Create New Encounter</h2>
            </div>
            <div className="p-4">
              <label className="block text-sm text-stone-400 mb-2">Encounter Name</label>
              <input
                type="text"
                value={newEncounterName}
                onChange={(e) => setNewEncounterName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., Goblin Ambush, Dragon's Lair..."
                className="w-full bg-stone-800 border border-stone-600 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500"
                autoFocus
              />
            </div>
            <div className="p-4 border-t border-stone-700 flex gap-3">
              <button
                onClick={() => setShowNameModal(false)}
                className="flex-1 py-2 rounded-lg bg-stone-700 hover:bg-stone-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateConfirm}
                className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium flex items-center justify-center gap-2"
              >
                <Icons.Plus /> Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EncounterList;
