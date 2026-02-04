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

export const CLASSES = [
  'Artificer', 'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter',
  'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard',
];

// 2024 PHB Class-specific features and choices
export const CLASS_FEATURES = {
  Cleric: {
    'Divine Order': {
      level: 1,
      options: [
        { name: 'Protector', description: 'Proficiency with Martial weapons and Heavy armor' },
        { name: 'Thaumaturge', description: 'Extra cantrip, add WIS to Arcana/Religion checks' },
      ]
    },
    'Blessed Strikes': {
      level: 7,
      options: [
        { name: 'Divine Strike', description: '+1d8 Radiant/Necrotic on weapon hit (1/turn)' },
        { name: 'Potent Spellcasting', description: 'Add WIS modifier to cantrip damage' },
      ]
    },
  },
  Druid: {
    'Primal Order': {
      level: 1,
      options: [
        { name: 'Magician', description: 'Extra cantrip, add WIS to Arcana/Nature checks' },
        { name: 'Warden', description: 'Proficiency with Martial weapons and Medium armor' },
      ]
    },
    'Elemental Fury': {
      level: 7,
      options: [
        { name: 'Potent Spellcasting', description: 'Add WIS modifier to cantrip damage' },
        { name: 'Primal Strike', description: '+1d8 elemental damage on attacks (1/turn)' },
      ]
    },
  },
  Fighter: {
    'Fighting Style': {
      level: 1,
      options: [
        { name: 'Archery', description: '+2 to ranged weapon attack rolls' },
        { name: 'Blind Fighting', description: 'Blindsight 10 ft.' },
        { name: 'Defense', description: '+1 AC while wearing armor' },
        { name: 'Dueling', description: '+2 damage with one-handed weapon' },
        { name: 'Great Weapon Fighting', description: 'Reroll 1s and 2s on damage dice' },
        { name: 'Interception', description: 'Reduce damage to ally by 1d10+PB' },
        { name: 'Protection', description: 'Impose disadvantage on attack vs ally' },
        { name: 'Thrown Weapon Fighting', description: '+2 damage with thrown weapons' },
        { name: 'Two-Weapon Fighting', description: 'Add ability mod to off-hand damage' },
        { name: 'Unarmed Fighting', description: '1d6/1d8 unarmed damage' },
      ]
    },
  },
  Paladin: {
    'Fighting Style': {
      level: 2,
      options: [
        { name: 'Blessed Warrior', description: 'Two Cleric cantrips (WIS-based)' },
        { name: 'Blind Fighting', description: 'Blindsight 10 ft.' },
        { name: 'Defense', description: '+1 AC while wearing armor' },
        { name: 'Dueling', description: '+2 damage with one-handed weapon' },
        { name: 'Great Weapon Fighting', description: 'Reroll 1s and 2s on damage dice' },
        { name: 'Interception', description: 'Reduce damage to ally by 1d10+PB' },
        { name: 'Protection', description: 'Impose disadvantage on attack vs ally' },
      ]
    },
  },
  Ranger: {
    'Fighting Style': {
      level: 2,
      options: [
        { name: 'Archery', description: '+2 to ranged weapon attack rolls' },
        { name: 'Blind Fighting', description: 'Blindsight 10 ft.' },
        { name: 'Defense', description: '+1 AC while wearing armor' },
        { name: 'Druidic Warrior', description: 'Two Druid cantrips (WIS-based)' },
        { name: 'Dueling', description: '+2 damage with one-handed weapon' },
        { name: 'Thrown Weapon Fighting', description: '+2 damage with thrown weapons' },
        { name: 'Two-Weapon Fighting', description: 'Add ability mod to off-hand damage' },
      ]
    },
    'Favored Enemy': {
      level: 1,
      options: [
        { name: 'Hunter\'s Mark', description: 'Always prepared, cast once free/LR' },
      ]
    },
  },
  Sorcerer: {
    'Sorcerous Origin': {
      level: 1,
      note: 'Subclass selected at level 1',
      options: [
        { name: 'Aberrant Sorcery', description: 'Psionic spells, telepathy' },
        { name: 'Clockwork Soul', description: 'Order magic, restore balance' },
        { name: 'Draconic Sorcery', description: 'Dragon ancestor, elemental affinity' },
        { name: 'Wild Magic', description: 'Chaotic surges, Tides of Chaos' },
      ]
    },
  },
  Warlock: {
    'Eldritch Invocations': {
      level: 1,
      note: 'Includes Pact Boons',
      options: [
        { name: 'Pact of the Blade', description: 'Summon bonded weapon' },
        { name: 'Pact of the Chain', description: 'Find Familiar with special forms' },
        { name: 'Pact of the Tome', description: 'Book of Shadows with cantrips' },
        { name: 'Eldritch Spear', description: 'Eldritch Blast range 300 ft.' },
        { name: 'Agonizing Blast', description: 'Add CHA to Eldritch Blast damage' },
        { name: 'Repelling Blast', description: 'Push 10 ft. with Eldritch Blast' },
      ]
    },
  },
  Monk: {
    'Warrior of Mercy': {
      level: 3,
      note: 'Subclass abilities',
      options: []
    },
  },
  Wizard: {
    'Arcane Recovery': {
      level: 1,
      note: 'Recover spell slots on short rest',
      options: []
    },
  },
};

// 2024 D&D Backgrounds with their skill proficiencies and origin feats
export const BACKGROUNDS = [
  { name: 'Acolyte', skills: ['Insight', 'Religion'], feat: 'Magic Initiate (Cleric)', abilities: ['INT', 'WIS', 'CHA'] },
  { name: 'Artisan', skills: ['Investigation', 'Persuasion'], feat: 'Crafter', abilities: ['STR', 'DEX', 'INT'] },
  { name: 'Charlatan', skills: ['Deception', 'Sleight of Hand'], feat: 'Skilled', abilities: ['DEX', 'CON', 'CHA'] },
  { name: 'Criminal', skills: ['Sleight of Hand', 'Stealth'], feat: 'Alert', abilities: ['DEX', 'CON', 'INT'] },
  { name: 'Entertainer', skills: ['Acrobatics', 'Performance'], feat: 'Musician', abilities: ['STR', 'DEX', 'CHA'] },
  { name: 'Farmer', skills: ['Animal Handling', 'Nature'], feat: 'Tough', abilities: ['STR', 'CON', 'WIS'] },
  { name: 'Guard', skills: ['Athletics', 'Perception'], feat: 'Alert', abilities: ['STR', 'CON', 'WIS'] },
  { name: 'Guide', skills: ['Stealth', 'Survival'], feat: 'Magic Initiate (Druid)', abilities: ['DEX', 'CON', 'WIS'] },
  { name: 'Hermit', skills: ['Medicine', 'Religion'], feat: 'Healer', abilities: ['INT', 'WIS', 'CHA'] },
  { name: 'Merchant', skills: ['Animal Handling', 'Persuasion'], feat: 'Lucky', abilities: ['CON', 'INT', 'CHA'] },
  { name: 'Noble', skills: ['History', 'Persuasion'], feat: 'Skilled', abilities: ['STR', 'INT', 'CHA'] },
  { name: 'Sage', skills: ['Arcana', 'History'], feat: 'Magic Initiate (Wizard)', abilities: ['CON', 'INT', 'WIS'] },
  { name: 'Sailor', skills: ['Acrobatics', 'Perception'], feat: 'Tavern Brawler', abilities: ['STR', 'DEX', 'WIS'] },
  { name: 'Scribe', skills: ['Investigation', 'Perception'], feat: 'Skilled', abilities: ['DEX', 'INT', 'WIS'] },
  { name: 'Soldier', skills: ['Athletics', 'Intimidation'], feat: 'Savage Attacker', abilities: ['STR', 'DEX', 'CON'] },
  { name: 'Wayfarer', skills: ['Insight', 'Stealth'], feat: 'Lucky', abilities: ['DEX', 'WIS', 'CHA'] },
];

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

// Get total level from classes array or legacy level field
export const getTotalLevel = (character) => {
  if (character?.classes?.length > 0) {
    return character.classes.reduce((sum, c) => sum + (parseInt(c.level) || 0), 0);
  }
  return parseInt(character?.level) || 0;
};

// Format class string for display (e.g., "Fighter 5 / Wizard 3")
export const formatClasses = (character) => {
  if (character?.classes?.length > 0) {
    return character.classes.map(c => `${c.name} ${c.level}`).join(' / ');
  }
  if (character?.class) {
    return `${character.class} ${character.level || 1}`;
  }
  return character?.cr ? `CR ${character.cr}` : '';
};

export const getProfBonus = (character) => {
  const totalLevel = getTotalLevel(character);
  if (totalLevel > 0) return Math.floor((totalLevel - 1) / 4) + 2;
  if (character?.cr) {
    const cr = character.cr;
    if (['0', '1/8', '1/4', '1/2'].includes(cr)) return 2;
    const crNum = parseInt(cr) || 1;
    return crNum <= 4 ? 2 : crNum <= 8 ? 3 : crNum <= 12 ? 4 : crNum <= 16 ? 5 : crNum <= 20 ? 6 : 7;
  }
  return 2;
};

// Get skill proficiency level: 0 = none, 1 = proficient, 2 = expertise
// Considers: manual skillProficiencies, background skills, Skilled feat
export const getSkillProficiency = (character, skillName) => {
  // Manual proficiency takes precedence (allows for expertise)
  const manualProf = character.skillProficiencies?.[skillName] || 0;
  if (manualProf > 0) return manualProf;
  
  // Check background skills
  const bg = BACKGROUNDS.find(b => b.name === character.background);
  if (bg?.skills?.includes(skillName)) return 1;
  
  // Check if Skilled feat applied (from background or classFeatures)
  // Skilled feat grants 3 skill proficiencies - stored in character.skilledFeatSkills
  if (character.skilledFeatSkills?.includes(skillName)) return 1;
  
  return 0;
};

// Get the source of a skill proficiency for display
export const getSkillProficiencySource = (character, skillName) => {
  const manualProf = character.skillProficiencies?.[skillName] || 0;
  if (manualProf === 2) return 'Expertise';
  if (manualProf === 1) return 'Manual';
  
  const bg = BACKGROUNDS.find(b => b.name === character.background);
  if (bg?.skills?.includes(skillName)) return `Background (${bg.name})`;
  
  if (character.skilledFeatSkills?.includes(skillName)) return 'Skilled Feat';
  
  return null;
};

// Get extra skill bonuses from class features (e.g., Primal Order Magician adds WIS to Arcana/Nature)
export const getSkillFeatureBonus = (character, skillName) => {
  let bonus = 0;
  let sources = [];
  
  // Druid: Primal Order (Magician) - add WIS to Arcana/Nature checks
  if (character.classFeatures?.['Druid:Primal Order'] === 'Magician') {
    if (skillName === 'Arcana' || skillName === 'Nature') {
      const wisBonus = Math.max(1, getMod(character.wis)); // minimum +1
      bonus += wisBonus;
      sources.push(`Primal Order +${wisBonus}`);
    }
  }
  
  // Cleric: Divine Order (Thaumaturge) - add WIS to Arcana/Religion checks
  if (character.classFeatures?.['Cleric:Divine Order'] === 'Thaumaturge') {
    if (skillName === 'Arcana' || skillName === 'Religion') {
      const wisBonus = Math.max(1, getMod(character.wis)); // minimum +1
      bonus += wisBonus;
      sources.push(`Divine Order +${wisBonus}`);
    }
  }
  
  return { bonus, sources };
};

export const getSkillBonus = (character, skill) => {
  const profBonus = getProfBonus(character);
  const profLevel = getSkillProficiency(character, skill.name);
  const featureBonus = getSkillFeatureBonus(character, skill.name);
  return getMod(character[skill.stat]) + (profLevel * profBonus) + featureBonus.bonus;
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