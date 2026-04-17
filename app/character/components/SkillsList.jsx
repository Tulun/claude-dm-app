'use client';

import Icons from '../../components/Icons';
import { SKILLS, getSkillBonus, getSkillProficiency, getSkillProficiencySource, getSkillFeatureBonus, hasJackOfAllTrades } from './constants';

export default function SkillsList({ character, onEditClick }) {
  const hasJoAT = hasJackOfAllTrades(character);
  
  return (
    <div className="bg-stone-900 rounded-lg overflow-hidden">
      <div className="p-2 border-b border-stone-700 flex items-center justify-between">
        <span className="text-xs text-stone-500 uppercase tracking-wide">Skills</span>
        <div className="flex items-center gap-2">
          {hasJoAT && <span className="text-[9px] text-cyan-400 bg-cyan-900/30 px-1.5 py-0.5 rounded" title="Jack of All Trades: +half PB to non-proficient skills">JoAT</span>}
          <button onClick={onEditClick} className="text-xs text-amber-400 hover:text-amber-300 cursor-pointer hover:scale-110 transition-transform flex items-center gap-1">
            <Icons.Edit />
          </button>
        </div>
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
          const prof = getSkillProficiency(character, skill.name);
          const source = getSkillProficiencySource(character, skill.name);
          const featureBonus = getSkillFeatureBonus(character, skill.name);
          const bonus = getSkillBonus(character, skill);
          const isFromBackground = source?.startsWith('Background');
          const hasFeatureBonus = featureBonus.bonus > 0;
          const hasJoATBonus = prof === 0 && hasJoAT;
          
          // Build tooltip
          let tooltip = source || '';
          if (hasFeatureBonus) {
            tooltip += (tooltip ? ' | ' : '') + featureBonus.sources.join(', ');
          }
          if (hasJoATBonus) {
            tooltip += (tooltip ? ' | ' : '') + 'Jack of All Trades';
          }
          
          return (
            <div key={skill.name} className="grid grid-cols-12 gap-1 px-2 py-1.5 hover:bg-stone-800/30 items-center group" title={tooltip}>
              <div className="col-span-1">
                <span className={prof === 2 ? 'text-amber-400' : prof === 1 ? (isFromBackground ? 'text-blue-400' : 'text-emerald-400') : hasJoATBonus ? 'text-cyan-500' : 'text-stone-600'}>
                  {prof > 0 ? '●' : hasJoATBonus ? '◐' : '○'}
                </span>
              </div>
              <div className="col-span-2 text-[10px] text-stone-500 uppercase font-medium">{skill.stat}</div>
              <div className={`col-span-7 text-sm truncate ${prof > 0 || hasFeatureBonus || hasJoATBonus ? 'text-stone-200' : 'text-stone-400'}`}>
                {skill.name}
                {isFromBackground && <span className="text-[9px] text-blue-400 ml-1 opacity-0 group-hover:opacity-100">BG</span>}
                {hasFeatureBonus && <span className="text-[9px] text-purple-400 ml-1">★</span>}
              </div>
              <div className={`col-span-2 text-right font-mono text-sm ${hasFeatureBonus ? 'text-purple-400' : prof === 2 ? 'text-amber-400' : prof === 1 ? (isFromBackground ? 'text-blue-400' : 'text-emerald-400') : hasJoATBonus ? 'text-cyan-400' : 'text-stone-400'}`}>
                <span className={`inline-block border rounded px-1.5 min-w-[2rem] text-center ${hasFeatureBonus ? 'border-purple-700' : hasJoATBonus ? 'border-cyan-700' : 'border-stone-700'}`}>
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
