// Reference data for the character-creation stepper (/characters → Add / New NPC).
//
// Class rules are NOT restated here: hit die + saving throws come from
// CLASS_DATA (app/classes/classData.js) and skill choices + starting equipment
// from CLASS_DETAILS (app/classes/classDetails.js) — parsed by
// buildCharacter.js. Backgrounds (skills, origin feat, ability options, tool,
// equipment) live in BACKGROUNDS (app/character/components/constants.js).
// This file only holds what has no other home: species, the ability-score
// generation methods, alignments, and languages. Spellcasting progression is
// canonical in app/utils/spellcasting.js.

// Ability-score generation (2024 PHB ch. 2)
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
export const POINT_BUY_BUDGET = 27;
export const POINT_BUY_COSTS = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
export const POINT_BUY_MIN = 8;
export const POINT_BUY_MAX = 15;

// Artificer isn't in CLASS_DATA / CLASS_DETAILS (the /classes reference page
// covers the PHB classes only), so its creation rules live here.
export const EXTRA_CLASS_RULES = {
  Artificer: {
    hitDie: 8,
    emoji: '🔧',
    tagline: 'A magical inventor who infuses everyday objects with power',
    primaryAbility: 'Intelligence',
    saves: ['con', 'int'],
    armorProf: 'Light, Medium, Shields',
    weaponProf: 'Simple',
    skillChoices: 'Choose 2: Arcana, History, Investigation, Medicine, Nature, Perception, or Sleight of Hand',
    startingEquipment: 'Choose A or B: (A) Leather Armor, Dagger, Thieves\' Tools, Tinker\'s Tools, Dungeoneer\'s Pack, and 16 GP; or (B) 150 GP',
  },
};

export const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil', 'Unaligned',
];

// 2024 PHB: every character knows Common plus two Standard languages.
export const STANDARD_LANGUAGES = [
  'Common Sign Language', 'Draconic', 'Dwarvish', 'Elvish', 'Giant',
  'Gnomish', 'Goblin', 'Halfling', 'Orc',
];
export const RARE_LANGUAGES = [
  'Abyssal', 'Celestial', 'Deep Speech', 'Druidic', 'Infernal',
  'Primordial', 'Sylvan', "Thieves' Cant", 'Undercommon',
];
export const BONUS_LANGUAGE_COUNT = 2;

// 2024 PHB species. `advantages` use the strings of ADVANTAGE_OPTIONS
// (character sheet) so they show up in the sheet's advantages list.
// `lineages` is a required sub-choice; a lineage may override speed /
// darkvision and add advantages. `skillChoice` = pick one skill (from
// `options`, or any skill when omitted). `originFeat` = pick an Origin feat.
export const SPECIES = [
  {
    name: 'Aasimar', size: 'Medium or Small', speed: 30, darkvision: 60,
    advantages: ['Resist Necrotic', 'Resist Radiant'],
    traits: [
      { name: 'Celestial Resistance', description: 'Resistance to Necrotic and Radiant damage.' },
      { name: 'Healing Hands', description: 'Magic action: touch a creature and roll d4s equal to your Proficiency Bonus; it regains that many HP. Once per Long Rest.' },
      { name: 'Light Bearer', description: 'You know the Light cantrip (CHA is your spellcasting ability for it).' },
      { name: 'Celestial Revelation', level: 3, description: 'Bonus Action transformation for 1 minute (Heavenly Wings, Inner Radiance, or Necrotic Shroud); extra damage equal to your Proficiency Bonus once per turn. Once per Long Rest.' },
    ],
  },
  {
    name: 'Dragonborn', size: 'Medium', speed: 30, darkvision: 60,
    lineageLabel: 'Draconic Ancestry',
    lineages: [
      { name: 'Black', advantages: ['Resist Acid'], note: 'Acid' },
      { name: 'Blue', advantages: ['Resist Lightning'], note: 'Lightning' },
      { name: 'Brass', advantages: ['Resist Fire'], note: 'Fire' },
      { name: 'Bronze', advantages: ['Resist Lightning'], note: 'Lightning' },
      { name: 'Copper', advantages: ['Resist Acid'], note: 'Acid' },
      { name: 'Gold', advantages: ['Resist Fire'], note: 'Fire' },
      { name: 'Green', advantages: ['Resist Poison'], note: 'Poison' },
      { name: 'Red', advantages: ['Resist Fire'], note: 'Fire' },
      { name: 'Silver', advantages: ['Resist Cold'], note: 'Cold' },
      { name: 'White', advantages: ['Resist Cold'], note: 'Cold' },
    ],
    traits: [
      { name: 'Breath Weapon', description: 'Replace one attack with a 15 ft Cone or 30 ft Line of your ancestry\'s damage type. DEX save (DC 8 + CON mod + PB); 1d10 damage (2d10 at 5, 3d10 at 11, 4d10 at 17). Uses = Proficiency Bonus per Long Rest.' },
      { name: 'Damage Resistance', description: 'Resistance to your ancestry\'s damage type.' },
      { name: 'Draconic Flight', level: 5, description: 'Bonus Action: sprout spectral wings for 10 minutes, gaining a Fly Speed equal to your Speed. Once per Long Rest.' },
    ],
  },
  {
    name: 'Dwarf', size: 'Medium', speed: 30, darkvision: 120,
    advantages: ['Resist Poison', 'Adv. vs Poisoned'],
    hpPerLevel: 1,
    traits: [
      { name: 'Dwarven Resilience', description: 'Resistance to Poison damage; Advantage on saves to avoid or end the Poisoned condition.' },
      { name: 'Dwarven Toughness', description: 'Your Hit Point maximum increases by 1 per level (already included).' },
      { name: 'Stonecunning', description: 'Bonus Action: gain Tremorsense 60 ft for 10 minutes while on or touching stone. Uses = Proficiency Bonus per Long Rest.' },
    ],
  },
  {
    name: 'Elf', size: 'Medium', speed: 30, darkvision: 60,
    advantages: ['Adv. vs Charmed'],
    lineageLabel: 'Elven Lineage',
    lineages: [
      { name: 'Drow', darkvision: 120, note: 'Darkvision 120 ft; Dancing Lights cantrip (Faerie Fire at 3, Darkness at 5)' },
      { name: 'High Elf', note: 'Prestidigitation cantrip, swappable after a Long Rest (Detect Magic at 3, Misty Step at 5)' },
      { name: 'Wood Elf', speed: 35, note: 'Speed 35 ft; Druidcraft cantrip (Longstrider at 3, Pass without Trace at 5)' },
    ],
    skillChoice: { label: 'Keen Senses', options: ['Insight', 'Perception', 'Survival'] },
    traits: [
      { name: 'Fey Ancestry', description: 'Advantage on saves to avoid or end the Charmed condition.' },
      { name: 'Keen Senses', description: 'Proficiency in Insight, Perception, or Survival.' },
      { name: 'Trance', description: 'You don\'t need to sleep; a Long Rest takes 4 hours of meditation.' },
    ],
  },
  {
    name: 'Gnome', size: 'Small', speed: 30, darkvision: 60,
    lineageLabel: 'Gnomish Lineage',
    lineages: [
      { name: 'Forest Gnome', note: 'Minor Illusion cantrip; Speak with Animals (PB times per Long Rest)' },
      { name: 'Rock Gnome', note: 'Mending and Prestidigitation cantrips; build Tiny clockwork devices' },
    ],
    traits: [
      { name: 'Gnomish Cunning', description: 'Advantage on Intelligence, Wisdom, and Charisma saving throws.' },
    ],
  },
  {
    name: 'Goliath', size: 'Medium', speed: 35, darkvision: 0,
    lineageLabel: 'Giant Ancestry',
    lineages: [
      { name: 'Cloud\'s Jaunt', note: 'Bonus Action: teleport 30 ft (PB per Long Rest)' },
      { name: 'Fire\'s Burn', note: '+1d10 Fire damage on a hit (PB per Long Rest)' },
      { name: 'Frost\'s Chill', note: '+1d6 Cold damage and −10 ft Speed on a hit (PB per Long Rest)' },
      { name: 'Hill\'s Tumble', note: 'Knock a Large or smaller target Prone on a hit (PB per Long Rest)' },
      { name: 'Stone\'s Endurance', note: 'Reaction: reduce damage by 1d12 + CON mod (PB per Long Rest)' },
      { name: 'Storm\'s Thunder', note: 'Reaction: 1d8 Thunder to an attacker within 60 ft (PB per Long Rest)' },
    ],
    traits: [
      { name: 'Large Form', level: 5, description: 'Bonus Action: become Large for 10 minutes — Advantage on STR checks, +10 ft Speed. Once per Long Rest.' },
      { name: 'Powerful Build', description: 'Advantage on checks to end the Grappled condition; count as one size larger for carrying capacity.' },
    ],
  },
  {
    name: 'Halfling', size: 'Small', speed: 30, darkvision: 0,
    advantages: ['Adv. vs Frightened'],
    traits: [
      { name: 'Brave', description: 'Advantage on saves to avoid or end the Frightened condition.' },
      { name: 'Halfling Nimbleness', description: 'You can move through the space of any creature a size larger than you.' },
      { name: 'Luck', description: 'When you roll a 1 on a d20 Test, you can reroll the die and must use the new roll.' },
      { name: 'Naturally Stealthy', description: 'You can take the Hide action when obscured only by a creature at least one size larger than you.' },
    ],
  },
  {
    name: 'Human', size: 'Medium or Small', speed: 30, darkvision: 0,
    skillChoice: { label: 'Skillful' },
    originFeat: true,
    traits: [
      { name: 'Resourceful', description: 'You gain Heroic Inspiration whenever you finish a Long Rest.' },
      { name: 'Skillful', description: 'Proficiency in one skill of your choice.' },
      { name: 'Versatile', description: 'You gain an Origin feat of your choice.' },
    ],
  },
  {
    name: 'Orc', size: 'Medium', speed: 30, darkvision: 120,
    traits: [
      { name: 'Adrenaline Rush', description: 'Dash as a Bonus Action and gain Temp HP equal to your Proficiency Bonus. Uses = PB per Short or Long Rest.' },
      { name: 'Relentless Endurance', description: 'When reduced to 0 HP but not killed, drop to 1 HP instead. Once per Long Rest.' },
    ],
  },
  {
    name: 'Tiefling', size: 'Medium or Small', speed: 30, darkvision: 60,
    lineageLabel: 'Fiendish Legacy',
    lineages: [
      { name: 'Abyssal', advantages: ['Resist Poison'], note: 'Poison resistance; Poison Spray cantrip (Ray of Sickness at 3, Hold Person at 5)' },
      { name: 'Chthonic', advantages: ['Resist Necrotic'], note: 'Necrotic resistance; Chill Touch cantrip (False Life at 3, Ray of Enfeeblement at 5)' },
      { name: 'Infernal', advantages: ['Resist Fire'], note: 'Fire resistance; Fire Bolt cantrip (Hellish Rebuke at 3, Darkness at 5)' },
    ],
    traits: [
      { name: 'Otherworldly Presence', description: 'You know the Thaumaturgy cantrip.' },
    ],
  },
];

export const findSpecies = (name) => SPECIES.find(s => s.name === name) || null;
