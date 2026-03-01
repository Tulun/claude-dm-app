'use client';

import Icons from '../../../components/Icons';

const SKILLS = [
  { name: 'Acrobatics', stat: 'dex' },
  { name: 'Animal Handling', stat: 'wis' },
  { name: 'Arcana', stat: 'int' },
  { name: 'Athletics', stat: 'str' },
  { name: 'Deception', stat: 'cha' },
  { name: 'History', stat: 'int' },
  { name: 'Insight', stat: 'wis' },
  { name: 'Intimidation', stat: 'cha' },
  { name: 'Investigation', stat: 'int' },
  { name: 'Medicine', stat: 'wis' },
  { name: 'Nature', stat: 'int' },
  { name: 'Perception', stat: 'wis' },
  { name: 'Performance', stat: 'cha' },
  { name: 'Persuasion', stat: 'cha' },
  { name: 'Religion', stat: 'int' },
  { name: 'Sleight of Hand', stat: 'dex' },
  { name: 'Stealth', stat: 'dex' },
  { name: 'Survival', stat: 'wis' },
];

const SAVES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

const CharacterSheetModal = ({ isOpen, character, onClose }) => {
  if (!isOpen) return null;

  const getMod = (score) => Math.floor(((parseInt(score) || 10) - 10) / 2);
  const formatMod = (mod) => mod >= 0 ? `+${mod}` : `${mod}`;
  
  const profBonus = character.profBonus || Math.ceil(1 + (character.level || 1) / 4);
  
  // skillProficiencies is an object like { "Perception": 1, "Stealth": 2 } where 1=proficient, 2=expertise
  const getSkillBonus = (skill) => {
    const statMod = getMod(character[skill.stat]);
    const profLevel = character.skillProficiencies?.[skill.name] || 0;
    const isProficient = profLevel >= 1;
    const isExpert = profLevel >= 2;
    
    let bonus = statMod;
    if (isProficient) bonus += profBonus;
    if (isExpert) bonus += profBonus; // Expertise adds prof bonus again
    
    return { bonus, isProficient, isExpert };
  };

  // saveProficiencies is an object like { str: 1, wis: 1 } where 1=proficient
  const getSaveBonus = (stat) => {
    const statMod = getMod(character[stat]);
    const isProficient = (character.saveProficiencies?.[stat] || 0) >= 1;
    
    let bonus = statMod;
    if (isProficient) bonus += profBonus;
    
    return { bonus, isProficient };
  };

  const getPassiveScore = (skillName) => {
    const skill = SKILLS.find(s => s.name === skillName);
    if (!skill) return 10;
    const { bonus } = getSkillBonus(skill);
    return 10 + bonus;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-emerald-800/50 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-stone-700 bg-gradient-to-r from-emerald-950/50 to-stone-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-900/50">
              <Icons.Shield />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-400">{character.name}</h2>
              <p className="text-xs text-stone-400">
                {character.classes?.map(c => `${c.name} ${c.level}`).join(' / ') || `${character.class} ${character.level}`}
                {character.background && ` • ${character.background}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-200">
            <Icons.X />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column - Stats, Saves, Passives */}
            <div className="space-y-4">
              {/* Ability Scores */}
              <div className="bg-stone-800/50 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-amber-400 mb-3">Ability Scores</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(stat => (
                    <div key={stat} className="text-center bg-stone-900/50 rounded-lg p-2">
                      <div className="text-xs text-stone-500 uppercase">{stat}</div>
                      <div className="text-xl font-bold text-stone-200">{character[stat] || 10}</div>
                      <div className="text-sm text-amber-400">{formatMod(getMod(character[stat]))}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Saving Throws */}
              <div className="bg-stone-800/50 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-amber-400 mb-3">Saving Throws</h3>
                <div className="grid grid-cols-2 gap-2">
                  {SAVES.map(stat => {
                    const { bonus, isProficient } = getSaveBonus(stat);
                    return (
                      <div key={stat} className={`flex items-center justify-between px-2 py-1 rounded ${isProficient ? 'bg-emerald-900/30' : 'bg-stone-900/30'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isProficient ? 'bg-emerald-500' : 'bg-stone-600'}`} />
                          <span className="text-xs uppercase text-stone-400">{stat}</span>
                        </div>
                        <span className={`font-mono text-sm ${isProficient ? 'text-emerald-400' : 'text-stone-300'}`}>
                          {formatMod(bonus)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Passive Scores */}
              <div className="bg-stone-800/50 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-amber-400 mb-3">Passive Scores</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-2 py-1 bg-stone-900/30 rounded">
                    <span className="text-sm text-stone-300">Passive Perception</span>
                    <span className="font-mono text-lg text-amber-400">{getPassiveScore('Perception')}</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 bg-stone-900/30 rounded">
                    <span className="text-sm text-stone-300">Passive Investigation</span>
                    <span className="font-mono text-lg text-amber-400">{getPassiveScore('Investigation')}</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 bg-stone-900/30 rounded">
                    <span className="text-sm text-stone-300">Passive Insight</span>
                    <span className="font-mono text-lg text-amber-400">{getPassiveScore('Insight')}</span>
                  </div>
                </div>
              </div>

              {/* Senses */}
              {character.senses && (
                <div className="bg-stone-800/50 rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-amber-400 mb-2">Senses</h3>
                  <p className="text-sm text-stone-300">{character.senses}</p>
                </div>
              )}

              {/* Proficiencies */}
              <div className="bg-stone-800/50 rounded-lg p-3 space-y-3">
                <h3 className="text-sm font-semibold text-amber-400">Proficiencies & Training</h3>
                
                {character.armorProficiencies && (
                  <div>
                    <div className="text-xs text-red-400 font-semibold uppercase">Armor</div>
                    <div className="text-sm text-stone-300">{character.armorProficiencies}</div>
                  </div>
                )}
                
                {character.weaponProficiencies && (
                  <div>
                    <div className="text-xs text-red-400 font-semibold uppercase">Weapons</div>
                    <div className="text-sm text-stone-300">{character.weaponProficiencies}</div>
                  </div>
                )}
                
                {character.toolProficiencies && (
                  <div>
                    <div className="text-xs text-red-400 font-semibold uppercase">Tools</div>
                    <div className="text-sm text-stone-300">{character.toolProficiencies}</div>
                  </div>
                )}
                
                {character.languages && (
                  <div>
                    <div className="text-xs text-red-400 font-semibold uppercase">Languages</div>
                    <div className="text-sm text-stone-300">{character.languages}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Skills */}
            <div className="bg-stone-800/50 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-amber-400 mb-3">Skills</h3>
              <div className="space-y-1">
                <div className="grid grid-cols-[auto_auto_1fr_auto] gap-2 text-xs text-stone-500 px-2 mb-2">
                  <span>Prof</span>
                  <span>Mod</span>
                  <span>Skill</span>
                  <span>Bonus</span>
                </div>
                {SKILLS.map(skill => {
                  const { bonus, isProficient, isExpert } = getSkillBonus(skill);
                  return (
                    <div 
                      key={skill.name} 
                      className={`grid grid-cols-[auto_auto_1fr_auto] gap-2 items-center px-2 py-1 rounded ${isProficient ? 'bg-emerald-900/20' : 'hover:bg-stone-700/30'}`}
                    >
                      <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                        isExpert ? 'bg-emerald-500 border-emerald-400' : 
                        isProficient ? 'bg-emerald-500 border-emerald-400' : 
                        'border-stone-600'
                      }`}>
                        {isExpert && <span className="text-[8px] text-white">★</span>}
                      </span>
                      <span className="text-xs uppercase text-stone-500 w-8">{skill.stat}</span>
                      <span className={`text-sm ${isProficient ? 'text-stone-200' : 'text-stone-400'}`}>
                        {skill.name}
                      </span>
                      <span className={`font-mono text-sm ${isProficient ? 'text-emerald-400' : 'text-stone-400'}`}>
                        {formatMod(bonus)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Features & Traits */}
          {character.features?.length > 0 && (
            <div className="mt-4 bg-stone-800/50 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-amber-400 mb-3">Features & Traits</h3>
              <div className="space-y-2">
                {character.features.map((feature, i) => (
                  <div key={i} className="bg-stone-900/50 rounded p-2">
                    <div className="font-medium text-stone-200">{feature.name}</div>
                    {feature.description && (
                      <div className="text-xs text-stone-400 mt-1">{feature.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-700 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterSheetModal;
