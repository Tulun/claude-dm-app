'use client';

import { STATS, formatMod, getSaveBonus } from './constants';

export default function SavingThrows({ character }) {
  return (
    <div className="bg-stone-900 rounded-lg overflow-hidden">
      <div className="p-2 border-b border-stone-700 text-center">
        <span className="text-xs text-stone-500 uppercase tracking-wide">Saving Throws</span>
      </div>
      <div className="p-2 space-y-1">
        {STATS.map(stat => {
          const saveProf = character.saveProficiencies?.[stat] || 0;
          return (
            <div key={stat} className="flex items-center px-2 py-1 rounded hover:bg-stone-800/50">
              <span className={`w-4 ${saveProf ? 'text-emerald-400' : 'text-stone-600'}`}>
                {saveProf ? '●' : '○'}
              </span>
              <span className="text-sm text-stone-400 uppercase flex-1">{stat}</span>
              <span className={`font-mono text-sm ${saveProf ? 'text-emerald-400' : 'text-stone-400'}`}>
                {formatMod(getSaveBonus(character, stat))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
