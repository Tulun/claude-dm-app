'use client';

import { STATS, ADVANTAGE_OPTIONS, formatMod, getSaveBonus, getProfBonus } from './constants';

export default function SavingThrowsModal({ character, onUpdate, onClose }) {
  const profBonus = getProfBonus(character);

  const setSaveProf = (stat, value) => {
    onUpdate('saveProficiencies', { ...character.saveProficiencies, [stat]: value });
  };

  const addAdvantage = (adv) => {
    const current = character.advantages || [];
    if (!current.includes(adv)) {
      onUpdate('advantages', [...current, adv]);
    }
  };

  const removeAdvantage = (index) => {
    onUpdate('advantages', character.advantages.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-stone-900 border border-stone-700 rounded-xl max-w-xl w-full max-h-[85vh] overflow-auto m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-stone-700 flex items-center justify-between sticky top-0 bg-stone-900 z-10">
          <h2 className="text-lg font-bold text-amber-400">Saving Throws & Resistances</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-white text-xl">×</button>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Saving Throws */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wide">Saving Throws</h3>
              <div className="text-xs text-stone-500">Click to toggle proficiency (+{profBonus})</div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {['str', 'dex', 'con'].map(stat => {
                const prof = character.saveProficiencies?.[stat] || 0;
                return (
                  <div 
                    key={stat} 
                    onClick={() => setSaveProf(stat, prof ? 0 : 1)}
                    className={`rounded p-3 cursor-pointer text-center transition-colors ${prof ? 'bg-emerald-900/40 border border-emerald-700/50' : 'bg-stone-800 hover:bg-stone-700'}`}
                  >
                    <div className="text-xs text-stone-500 uppercase">{stat}</div>
                    <div className={`text-xl font-bold font-mono ${prof ? 'text-emerald-400' : ''}`}>
                      {formatMod(getSaveBonus(character, stat))}
                    </div>
                    <div className="text-xs text-stone-500">{prof ? '● Prof' : '○'}</div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['int', 'wis', 'cha'].map(stat => {
                const prof = character.saveProficiencies?.[stat] || 0;
                return (
                  <div 
                    key={stat} 
                    onClick={() => setSaveProf(stat, prof ? 0 : 1)}
                    className={`rounded p-3 cursor-pointer text-center transition-colors ${prof ? 'bg-emerald-900/40 border border-emerald-700/50' : 'bg-stone-800 hover:bg-stone-700'}`}
                  >
                    <div className="text-xs text-stone-500 uppercase">{stat}</div>
                    <div className={`text-xl font-bold font-mono ${prof ? 'text-emerald-400' : ''}`}>
                      {formatMod(getSaveBonus(character, stat))}
                    </div>
                    <div className="text-xs text-stone-500">{prof ? '● Prof' : '○'}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advantages & Resistances */}
          <div>
            <h3 className="text-sm font-bold text-stone-400 mb-3 uppercase tracking-wide">Advantages & Resistances</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {(character.advantages || []).map((adv, i) => (
                <span 
                  key={i} 
                  className="bg-blue-900/40 text-blue-300 rounded px-3 py-1.5 text-sm flex items-center gap-2"
                >
                  {adv}
                  <button 
                    onClick={() => removeAdvantage(i)}
                    className="text-blue-400 hover:text-blue-200"
                  >×</button>
                </span>
              ))}
              {(character.advantages || []).length === 0 && (
                <span className="text-sm text-stone-500 italic">None added yet</span>
              )}
            </div>
            <div className="flex gap-2">
              <select 
                className="flex-1 bg-stone-800 border border-stone-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                onChange={(e) => {
                  if (e.target.value) {
                    addAdvantage(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
              >
                <option value="">Add from list...</option>
                {ADVANTAGE_OPTIONS.map(group => (
                  <optgroup key={group.group} label={group.group}>
                    {group.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <input 
                type="text" 
                placeholder="Or type custom..."
                className="flex-1 bg-stone-800 border border-stone-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    addAdvantage(e.target.value.trim());
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-stone-700 text-xs text-stone-500 sticky bottom-0 bg-stone-900">
          Proficient saves add +{profBonus} to the roll
        </div>
      </div>
    </div>
  );
}
