'use client';

import { SKILLS, getSkillBonus } from './constants';

export default function Senses({ character }) {
  const perception = SKILLS.find(s => s.name === 'Perception');
  const investigation = SKILLS.find(s => s.name === 'Investigation');
  const insight = SKILLS.find(s => s.name === 'Insight');

  return (
    <div className="bg-stone-900 rounded-lg overflow-hidden">
      <div className="p-2 border-b border-stone-700 text-center">
        <span className="text-xs text-stone-500 uppercase tracking-wide">Senses</span>
      </div>
      <div className="p-2 space-y-1">
        <div className="flex items-center px-2 py-1 bg-stone-800 rounded">
          <span className="text-lg font-bold w-8">{10 + getSkillBonus(character, perception)}</span>
          <span className="text-xs text-stone-400 uppercase">Passive Perception</span>
        </div>
        <div className="flex items-center px-2 py-1 bg-stone-800 rounded">
          <span className="text-lg font-bold w-8">{10 + getSkillBonus(character, investigation)}</span>
          <span className="text-xs text-stone-400 uppercase">Passive Investigation</span>
        </div>
        <div className="flex items-center px-2 py-1 bg-stone-800 rounded">
          <span className="text-lg font-bold w-8">{10 + getSkillBonus(character, insight)}</span>
          <span className="text-xs text-stone-400 uppercase">Passive Insight</span>
        </div>
      </div>
    </div>
  );
}
