'use client';

import { SKILLS, STATS, ADVANTAGE_OPTIONS, formatMod, getSkillBonus, getSaveBonus, getProfBonus } from './constants';

export default function ProficiencyModal({ character, onUpdate, onClose }) {
  const profBonus = getProfBonus(character);

  const setSkillProf = (name, value) => {
    onUpdate('skillProficiencies', { ...character.skillProficiencies, [name]: value });
  };

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
      <div className="bg-stone-900 border border-stone-700 rounded-xl max-w-3xl w-full max-h-[85vh] overflow-auto m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-stone-700 flex items-center justify-between sticky top-0 bg-stone-900 z-10">
          <h2 className="text-lg font-bold text-amber-400">Proficiencies, Skills & Advantages</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-white text-xl">×</button>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Saving Throws */}
          <div>
            <h3 className="text-sm font-bold text-stone-400 mb-3 uppercase tracking-wide">Saving Throws</h3>
            <div className="grid grid-cols-6 gap-2">
              {STATS.map(stat => {
                const prof = character.saveProficiencies?.[stat] || 0;
                return (
                  <div 
                    key={stat} 
                    onClick={() => setSaveProf(stat, prof ? 0 : 1)}
                    className={`rounded p-3 cursor-pointer text-center transition-colors ${prof ? 'bg-emerald-900/40 border border-emerald-700/50' : 'bg-stone-800 hover:bg-stone-700'}`}
                  >
                    <div className="text-xs text-stone-500 uppercase">{stat}</div>
                    <div className={`text-lg font-bold ${prof ? 'text-emerald-400' : ''}`}>
                      {formatMod(getSaveBonus(character, stat))}
                    </div>
                    <div className="text-xs text-stone-500">{prof ? '● Prof' : '○'}</div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Skills - D&D Beyond Style */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wide">Skills</h3>
              <div className="text-xs text-stone-500">Click row to cycle: ○ → ● → ◆</div>
            </div>
            <div className="bg-stone-800 rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-stone-500 uppercase border-b border-stone-700">
                <div className="col-span-1">Prof</div>
                <div className="col-span-2">Mod</div>
                <div className="col-span-7">Skill</div>
                <div className="col-span-2 text-right">Bonus</div>
              </div>
              {/* Skill Rows */}
              <div className="divide-y divide-stone-700/50">
                {SKILLS.map(skill => {
                  const prof = character.skillProficiencies?.[skill.name] || 0;
                  const bonus = getSkillBonus(character, skill);
                  return (
                    <div 
                      key={skill.name} 
                      onClick={() => setSkillProf(skill.name, (prof + 1) % 3)}
                      className={`grid grid-cols-12 gap-2 px-3 py-2 cursor-pointer transition-colors hover:bg-stone-700/50 ${prof > 0 ? 'bg-stone-750' : ''}`}
                    >
                      <div className="col-span-1">
                        <span className={prof === 2 ? 'text-amber-400' : prof === 1 ? 'text-emerald-400' : 'text-stone-600'}>
                          {prof === 2 ? '●' : prof === 1 ? '●' : '○'}
                        </span>
                      </div>
                      <div className="col-span-2 text-stone-500 uppercase text-sm font-medium">{skill.stat}</div>
                      <div className={`col-span-7 ${prof > 0 ? 'font-medium' : 'text-stone-300'}`}>{skill.name}</div>
                      <div className={`col-span-2 text-right font-mono ${prof === 2 ? 'text-amber-400 font-bold' : prof === 1 ? 'text-emerald-400 font-bold' : 'text-stone-400'}`}>
                        <span className="inline-block border border-stone-600 rounded px-2 py-0.5 min-w-[3rem]">
                          {bonus >= 0 ? '+' : ''}{bonus}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
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
          ○ = No proficiency | ● = Proficient (+{profBonus}) | ◆ = Expertise (+{profBonus * 2})
        </div>
      </div>
    </div>
  );
}
