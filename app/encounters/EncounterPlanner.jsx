'use client';

import Icons from '../components/Icons';
import { getDailyXPBudget, getDailyBudget2014 } from './constants';

const EncounterPlanner = ({
  partySize,
  setPartySize,
  partyLevel,
  setPartyLevel,
  calcMode,
  setCalcMode,
  dailyEncounters,
  encounters,
  calculateEncounterStats,
  removeFromDaily,
  clearDaily,
}) => {
  const dailyBudget = getDailyXPBudget(partyLevel, partySize);
  const dailyBudget2014 = getDailyBudget2014(partyLevel, partySize);
  
  const dailyTotal = dailyEncounters.reduce((sum, encId) => {
    const enc = encounters.find(e => e.id === encId);
    if (!enc) return sum;
    return sum + calculateEncounterStats(enc).totalXP;
  }, 0);

  const maxBudget = calcMode === '2014' ? dailyBudget2014 : dailyBudget.moderate * 8;
  const percentage = Math.round((dailyTotal / maxBudget) * 100);

  return (
    <div className="w-80 flex-shrink-0">
      <div className="bg-stone-900/50 border border-stone-700/50 rounded-xl p-4 sticky top-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-purple-400">Encounter Planner</h2>
        </div>

        {/* Rules Toggle */}
        <div className="flex rounded-lg bg-stone-800 p-1 mb-4">
          <button
            onClick={() => setCalcMode('2014')}
            className={`flex-1 py-1.5 px-2 rounded text-sm font-medium transition-colors ${
              calcMode === '2014' ? 'bg-purple-600 text-white' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            2014 Rules
          </button>
          <button
            onClick={() => setCalcMode('2024')}
            className={`flex-1 py-1.5 px-2 rounded text-sm font-medium transition-colors ${
              calcMode === '2024' ? 'bg-purple-600 text-white' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            2024 Rules
          </button>
        </div>
        
        {/* Party Configuration */}
        <div className="space-y-3 mb-4 pb-4 border-b border-stone-700">
          <div className="flex items-center justify-between">
            <label className="text-sm text-stone-400">Party Size</label>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPartySize(Math.max(1, partySize - 1))}
                className="w-7 h-7 rounded bg-stone-700 hover:bg-stone-600 flex items-center justify-center"
              >−</button>
              <span className="w-8 text-center font-mono">{partySize}</span>
              <button 
                onClick={() => setPartySize(partySize + 1)}
                className="w-7 h-7 rounded bg-stone-700 hover:bg-stone-600 flex items-center justify-center"
              >+</button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-stone-400">Party Level</label>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPartyLevel(Math.max(1, partyLevel - 1))}
                className="w-7 h-7 rounded bg-stone-700 hover:bg-stone-600 flex items-center justify-center"
              >−</button>
              <span className="w-8 text-center font-mono">{partyLevel}</span>
              <button 
                onClick={() => setPartyLevel(Math.min(20, partyLevel + 1))}
                className="w-7 h-7 rounded bg-stone-700 hover:bg-stone-600 flex items-center justify-center"
              >+</button>
            </div>
          </div>
        </div>

        {/* Single Encounter Difficulty Thresholds */}
        <div className="mb-4 pb-4 border-b border-stone-700">
          <div className="text-xs text-stone-500 mb-2">Single Encounter Difficulty</div>
          {calcMode === '2014' ? (
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-green-400">Easy</span>
                <span className="font-mono text-stone-300">{(dailyBudget.low * 0.5).toLocaleString()} XP</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-yellow-400">Medium</span>
                <span className="font-mono text-stone-300">{dailyBudget.low.toLocaleString()} XP</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-orange-400">Hard</span>
                <span className="font-mono text-stone-300">{dailyBudget.moderate.toLocaleString()} XP</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-400">Deadly</span>
                <span className="font-mono text-stone-300">{dailyBudget.high.toLocaleString()} XP</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-green-400">Low</span>
                <span className="font-mono text-stone-300">{dailyBudget.low.toLocaleString()} XP</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-yellow-400">Moderate</span>
                <span className="font-mono text-stone-300">{dailyBudget.moderate.toLocaleString()} XP</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-400">High</span>
                <span className="font-mono text-stone-300">{dailyBudget.high.toLocaleString()} XP</span>
              </div>
            </div>
          )}
        </div>

        {/* Daily Budget */}
        <div className="mb-4 pb-4 border-b border-stone-700">
          <div className="text-xs text-stone-500 mb-2">Adventuring Day Budget</div>
          {calcMode === '2014' ? (
            <div className="flex justify-between text-sm">
              <span className="text-stone-400">Full day XP</span>
              <span className="font-mono text-amber-400">{dailyBudget2014.toLocaleString()} XP</span>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">~6-8 moderate</span>
                <span className="font-mono text-amber-400">{(dailyBudget.moderate * 6).toLocaleString()} - {(dailyBudget.moderate * 8).toLocaleString()} XP</span>
              </div>
              <div className="text-xs text-stone-600 italic">2024 DMG has no official daily budget</div>
            </div>
          )}
        </div>

        {/* Daily Encounters List */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-400">Today's Encounters</span>
            {dailyEncounters.length > 0 && (
              <button onClick={clearDaily} className="text-xs text-red-400 hover:text-red-300">Clear</button>
            )}
          </div>
          
          {dailyEncounters.length === 0 ? (
            <div className="text-center py-4 text-stone-600 text-sm border border-dashed border-stone-700 rounded">
              Click + on encounters to add
            </div>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {dailyEncounters.map((encId, index) => {
                const enc = encounters.find(e => e.id === encId);
                if (!enc) return null;
                const stats = calculateEncounterStats(enc);
                const difficulty = calcMode === '2014'
                  ? (stats.totalXP >= dailyBudget.high ? 'deadly' :
                     stats.totalXP >= dailyBudget.moderate ? 'hard' :
                     stats.totalXP >= dailyBudget.low ? 'medium' : 'easy')
                  : (stats.totalXP >= dailyBudget.high ? 'high' :
                     stats.totalXP >= dailyBudget.moderate ? 'moderate' : 'low');
                return (
                  <div key={index} className="flex items-center gap-2 bg-stone-800/50 rounded px-2 py-1.5 text-sm">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      difficulty === 'deadly' || difficulty === 'high' ? 'bg-red-500' :
                      difficulty === 'hard' || difficulty === 'moderate' ? 'bg-yellow-500' :
                      difficulty === 'medium' || difficulty === 'low' ? 'bg-green-500' : 'bg-green-300'
                    }`} />
                    <span className="truncate flex-1">{enc.name}</span>
                    <span className="text-amber-400 font-mono text-xs">{stats.totalXP.toLocaleString()}</span>
                    <button 
                      onClick={() => removeFromDaily(index)}
                      className="text-stone-500 hover:text-red-400 flex-shrink-0"
                    >×</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Total XP & Progress */}
        <div className="bg-stone-800 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Day Total</span>
            <span className="font-mono text-lg text-amber-400">
              {dailyTotal.toLocaleString()} XP
            </span>
          </div>
          
          <div className="space-y-1">
            <div className="h-2 bg-stone-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  percentage >= 100 ? 'bg-red-500' :
                  percentage >= 75 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, percentage)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-stone-500">
              <span>{dailyEncounters.length} encounter{dailyEncounters.length !== 1 ? 's' : ''}</span>
              <span>{percentage}% of daily budget</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EncounterPlanner;
