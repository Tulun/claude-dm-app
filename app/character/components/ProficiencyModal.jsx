'use client';

import { SKILLS, formatMod, getSkillBonus, getSkillProficiency, getSkillProficiencySource, getProfBonus, BACKGROUNDS } from './constants';

export default function ProficiencyModal({ character, onUpdate, onClose }) {
  const profBonus = getProfBonus(character);
  const selectedBackground = BACKGROUNDS.find(b => b.name === character.background);

  const setSkillProf = (skillName, currentProf, source) => {
    // If from background, clicking cycles through: bg(1) -> expert(2) -> none(0) -> bg(1)
    // For manual: none(0) -> prof(1) -> expert(2) -> none(0)
    const isFromBackground = source?.startsWith('Background');
    
    if (isFromBackground) {
      // Cycle: background prof -> expertise -> back to background only
      if (currentProf === 1) {
        // Upgrade to expertise (manual override)
        onUpdate('skillProficiencies', { ...character.skillProficiencies, [skillName]: 2 });
      } else if (currentProf === 2) {
        // Remove manual override, revert to background
        const newProfs = { ...character.skillProficiencies };
        delete newProfs[skillName];
        onUpdate('skillProficiencies', newProfs);
      }
    } else {
      // Normal cycling for non-background skills
      const newValue = (currentProf + 1) % 3;
      if (newValue === 0) {
        const newProfs = { ...character.skillProficiencies };
        delete newProfs[skillName];
        onUpdate('skillProficiencies', newProfs);
      } else {
        onUpdate('skillProficiencies', { ...character.skillProficiencies, [skillName]: newValue });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-stone-900 border border-stone-700 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-auto m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-stone-700 flex items-center justify-between sticky top-0 bg-stone-900 z-10">
          <h2 className="text-lg font-bold text-amber-400">Skill Proficiencies</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-white text-xl">×</button>
        </div>
        
        <div className="p-4">
          {/* Background info */}
          {selectedBackground && (
            <div className="mb-4 p-3 bg-blue-900/30 border border-blue-800/50 rounded-lg">
              <div className="text-sm text-blue-300 font-medium mb-1">Background: {selectedBackground.name}</div>
              <div className="text-xs text-blue-400">
                Grants proficiency in: <span className="font-medium">{selectedBackground.skills.join(', ')}</span>
              </div>
            </div>
          )}

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
              <div className="col-span-5">Skill</div>
              <div className="col-span-2">Source</div>
              <div className="col-span-2 text-right">Bonus</div>
            </div>
            {/* Skill Rows */}
            <div className="divide-y divide-stone-700/50">
              {SKILLS.map(skill => {
                const prof = getSkillProficiency(character, skill.name);
                const source = getSkillProficiencySource(character, skill.name);
                const bonus = getSkillBonus(character, skill);
                const isFromBackground = source?.startsWith('Background');
                return (
                  <div 
                    key={skill.name} 
                    onClick={() => setSkillProf(skill.name, prof, source)}
                    className={`grid grid-cols-12 gap-2 px-3 py-2 cursor-pointer transition-colors hover:bg-stone-700/50 ${prof > 0 ? 'bg-stone-750' : ''}`}
                  >
                    <div className="col-span-1">
                      <span className={prof === 2 ? 'text-amber-400' : prof === 1 ? (isFromBackground ? 'text-blue-400' : 'text-emerald-400') : 'text-stone-600'}>
                        {prof === 2 ? '◆' : prof === 1 ? '●' : '○'}
                      </span>
                    </div>
                    <div className="col-span-2 text-stone-500 uppercase text-sm font-medium">{skill.stat}</div>
                    <div className={`col-span-5 ${prof > 0 ? 'font-medium' : 'text-stone-300'}`}>{skill.name}</div>
                    <div className="col-span-2 text-xs">
                      {isFromBackground && <span className="text-blue-400">BG</span>}
                      {source === 'Expertise' && <span className="text-amber-400">Expert</span>}
                      {source === 'Manual' && <span className="text-emerald-400">Class</span>}
                      {source === 'Skilled Feat' && <span className="text-purple-400">Feat</span>}
                    </div>
                    <div className={`col-span-2 text-right font-mono ${prof === 2 ? 'text-amber-400 font-bold' : prof === 1 ? (isFromBackground ? 'text-blue-400' : 'text-emerald-400') + ' font-bold' : 'text-stone-400'}`}>
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
          <div className="flex gap-4 flex-wrap">
            <span>○ = No proficiency</span>
            <span className="text-emerald-400">● = Proficient (+{profBonus})</span>
            <span className="text-blue-400">● = From Background</span>
            <span className="text-amber-400">◆ = Expertise (+{profBonus * 2})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
