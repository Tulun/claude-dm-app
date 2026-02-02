export const SKILLS = [
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

export const STATS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export const ADVANTAGE_OPTIONS = [
  { group: 'Saving Throw Advantages', options: [
    'Adv. on STR saves', 'Adv. on DEX saves', 'Adv. on CON saves',
    'Adv. on INT saves', 'Adv. on WIS saves', 'Adv. on CHA saves',
  ]},
  { group: 'Condition Advantages', options: [
    'Adv. vs Charmed', 'Adv. vs Frightened', 'Adv. vs Paralyzed',
    'Adv. vs Poisoned', 'Adv. vs Stunned', 'Adv. vs Sleep',
    'Immune to Charmed', 'Immune to Frightened', 'Immune to Sleep',
  ]},
  { group: 'Damage Resistances', options: [
    'Resist Poison', 'Resist Fire', 'Resist Cold', 'Resist Lightning',
    'Resist Necrotic', 'Resist Radiant', 'Resist Bludgeoning',
    'Resist Piercing', 'Resist Slashing',
  ]},
  { group: 'Other', options: [
    'Adv. vs Magic', 'Adv. on Concentration', 'Adv. on Death Saves',
    'Darkvision 60ft', 'Darkvision 120ft',
  ]},
];

// Utility functions
export const getMod = (score) => Math.floor(((parseInt(score) || 10) - 10) / 2);
export const formatMod = (mod) => mod >= 0 ? `+${mod}` : `${mod}`;

export const getProfBonus = (character) => {
  if (character?.level) return Math.floor((parseInt(character.level) - 1) / 4) + 2;
  if (character?.cr) {
    const cr = character.cr;
    if (['0', '1/8', '1/4', '1/2'].includes(cr)) return 2;
    const crNum = parseInt(cr) || 1;
    return crNum <= 4 ? 2 : crNum <= 8 ? 3 : crNum <= 12 ? 4 : crNum <= 16 ? 5 : crNum <= 20 ? 6 : 7;
  }
  return 2;
};

export const getSkillBonus = (character, skill) => {
  const profBonus = getProfBonus(character);
  return getMod(character[skill.stat]) + ((character.skillProficiencies?.[skill.name] || 0) * profBonus);
};

export const getSaveBonus = (character, stat) => {
  const profBonus = getProfBonus(character);
  return getMod(character[stat]) + ((character.saveProficiencies?.[stat] || 0) * profBonus);
};

export const getSpellDC = (character) => {
  if (!character?.spellStat) return null;
  return 8 + getProfBonus(character) + getMod(character[character.spellStat]);
};

export const getSpellAttack = (character) => {
  if (!character?.spellStat) return null;
  return getProfBonus(character) + getMod(character[character.spellStat]);
};
