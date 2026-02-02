'use client';

import Icons from '../../components/Icons';
import { SKILLS, getSkillBonus } from './constants';

export default function SkillsList({ character, onEditClick }) {
  return (
    <div className="bg-stone-900 rounded-lg overflow-hidden">
      <div className="p-2 border-b border-stone-700 flex items-center justify-between">
        <span className="text-xs text-stone-500 uppercase tracking-wide">Skills</span>
        <button onClick={onEditClick} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
          <Icons.Edit />
        </button>
      </div>
      
      {/* Skills Header */}
      <div className="grid grid-cols-12 gap-1 px-2 py-1 text-[10px] text-stone-500 uppercase border-b border-stone-800">
        <div className="col-span-1">P</div>
        <div className="col-span-2">Mod</div>
        <div className="col-span-7">Skill</div>
        <div className="col-span-2 text-right">+/-</div>
      </div>
      
      {/* Skills List */}
      <div className="divide-y divide-stone-800/50">
        {SKILLS.map(skill => {
          const prof = character.skillProficiencies?.[skill.name] || 0;
          const bonus = getSkillBonus(character, skill);
          return (
            <div key={skill.name} className="grid grid-cols-12 gap-1 px-2 py-1.5 hover:bg-stone-800/30 items-center">
              <div className="col-span-1">
                <span className={prof === 2 ? 'text-amber-400' : prof === 1 ? 'text-emerald-400' : 'text-stone-600'}>
                  {prof > 0 ? '●' : '○'}
                </span>
              </div>
              <div className="col-span-2 text-[10px] text-stone-500 uppercase font-medium">{skill.stat}</div>
              <div className={`col-span-7 text-sm truncate ${prof > 0 ? 'text-stone-200' : 'text-stone-400'}`}>
                {skill.name}
              </div>
              <div className={`col-span-2 text-right font-mono text-sm ${prof === 2 ? 'text-amber-400' : prof === 1 ? 'text-emerald-400' : 'text-stone-400'}`}>
                <span className="inline-block border border-stone-700 rounded px-1.5 min-w-[2rem] text-center">
                  {bonus >= 0 ? '+' : ''}{bonus}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
