'use client';

import { SKILLS, formatMod, getSkillBonus, getProfBonus } from './constants';

export default function ProficiencyModal({ character, onUpdate, onClose }) {
  const profBonus = getProfBonus(character);

  const setSkillProf = (name, value) => {
    onUpdate('skillProficiencies', { ...character.skillProficiencies, [name]: value });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-stone-900 border border-stone-700 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-auto m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-stone-700 flex items-center justify-between sticky top-0 bg-stone-900 z-10">
          <h2 className="text-lg font-bold text-amber-400">Skill Proficiencies</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-white text-xl">×</button>
        </div>
        
        <div className="p-4">
          {/* Skills - D&D Beyond Style */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-stone-400">Click row to cycle proficiency</div>
            <div className="text-xs text-stone-500">○ None → ● Prof (+{profBonus}) → ◆ Expert (+{profBonus * 2})</div>
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
                        {prof === 2 ? '◆' : prof === 1 ? '●' : '○'}
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

        <div className="p-4 border-t border-stone-700 text-xs text-stone-500 sticky bottom-0 bg-stone-900">
          ○ = No proficiency | ● = Proficient (+{profBonus}) | ◆ = Expertise (+{profBonus * 2})
        </div>
      </div>
    </div>
  );
}
