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

// 2024 PHB Subclasses (plus select legacy subclasses marked with *)
export const SUBCLASSES = {
  Artificer: [
    { name: 'Alchemist', level: 3, description: 'Create experimental elixirs and potions' },
    { name: 'Armorer', level: 3, description: 'Modify armor into a powerful magical suit' },
    { name: 'Artillerist', level: 3, description: 'Create magical cannons and explosives' },
    { name: 'Battle Smith', level: 3, description: 'Fight alongside a Steel Defender' },
  ],
  Barbarian: [
    { name: 'Path of the Berserker', level: 3, description: 'Channel rage into violent fury' },
    { name: 'Path of the Wild Heart', level: 3, description: 'Connect with animal spirits' },
    { name: 'Path of the World Tree', level: 3, description: 'Draw power from the World Tree' },
    { name: 'Path of the Zealot', level: 3, description: 'Fueled by divine fury' },
  ],
  Bard: [
    { name: 'College of Dance', level: 3, description: 'Weave magic through movement' },
    { name: 'College of Glamour', level: 3, description: 'Fey-touched performer' },
    { name: 'College of Lore', level: 3, description: 'Master of secrets and knowledge' },
    { name: 'College of Valor', level: 3, description: 'Inspire heroics in battle' },
  ],
  Cleric: [
    { name: 'Life Domain', level: 3, description: 'Master of healing magic' },
    { name: 'Light Domain', level: 3, description: 'Wield radiant fire and light' },
    { name: 'Trickery Domain', level: 3, description: 'Deception and illusion' },
    { name: 'War Domain', level: 3, description: 'Divine warrior' },
  ],
  Druid: [
    { name: 'Circle of the Land', level: 3, description: 'Draw power from specific terrain' },
    { name: 'Circle of the Moon', level: 3, description: 'Master of Wild Shape combat' },
    { name: 'Circle of the Sea', level: 3, description: 'Harness ocean and storm' },
    { name: 'Circle of the Stars', level: 3, description: 'Channel starlight and constellations' },
    { name: 'Circle of the Shepherd*', level: 2, description: '(Legacy) Summon spirit totems, empower beasts and fey' },
  ],
  Fighter: [
    { name: 'Battle Master', level: 3, description: 'Tactical superiority maneuvers' },
    { name: 'Champion', level: 3, description: 'Raw physical power and crits' },
    { name: 'Eldritch Knight', level: 3, description: 'Blend magic with martial prowess' },
    { name: 'Psi Warrior', level: 3, description: 'Augment attacks with psionic power' },
  ],
  Monk: [
    { name: 'Warrior of Mercy', level: 3, description: 'Heal or harm with a touch' },
    { name: 'Warrior of Shadow', level: 3, description: 'Strike from darkness' },
    { name: 'Warrior of the Elements', level: 3, description: 'Channel elemental power' },
    { name: 'Warrior of the Open Hand', level: 3, description: 'Master of unarmed combat' },
  ],
  Paladin: [
    { name: 'Oath of Devotion', level: 3, description: 'Uphold justice and virtue' },
    { name: 'Oath of Glory', level: 3, description: 'Achieve legendary deeds' },
    { name: 'Oath of the Ancients', level: 3, description: 'Protect light and life' },
    { name: 'Oath of Vengeance', level: 3, description: 'Punish the wicked' },
  ],
  Ranger: [
    { name: 'Beast Master', level: 3, description: 'Bond with a primal beast' },
    { name: 'Fey Wanderer', level: 3, description: 'Touched by the Feywild' },
    { name: 'Gloom Stalker', level: 3, description: 'Ambush from darkness' },
    { name: 'Hunter', level: 3, description: 'Specialize in slaying prey' },
  ],
  Rogue: [
    { name: 'Arcane Trickster', level: 3, description: 'Blend magic with stealth' },
    { name: 'Assassin', level: 3, description: 'Master of deadly strikes' },
    { name: 'Soulknife', level: 3, description: 'Manifest psionic blades' },
    { name: 'Thief', level: 3, description: 'Supreme agility and cunning' },
  ],
  Sorcerer: [
    { name: 'Aberrant Sorcery', level: 3, description: 'Psionic power from beyond' },
    { name: 'Clockwork Sorcery', level: 3, description: 'Order magic from Mechanus' },
    { name: 'Draconic Sorcery', level: 3, description: 'Dragon blood magic' },
    { name: 'Wild Magic Sorcery', level: 3, description: 'Unpredictable magical surges' },
  ],
  Warlock: [
    { name: 'Archfey Patron', level: 3, description: 'Pact with a fey lord' },
    { name: 'Celestial Patron', level: 3, description: 'Pact with a celestial being' },
    { name: 'Fiend Patron', level: 3, description: 'Pact with a demon or devil' },
    { name: 'Great Old One Patron', level: 3, description: 'Pact with an elder entity' },
  ],
  Wizard: [
    { name: 'Abjurer', level: 3, description: 'Master of protective magic' },
    { name: 'Diviner', level: 3, description: 'See the future and manipulate fate' },
    { name: 'Evoker', level: 3, description: 'Unleash devastating elemental magic' },
    { name: 'Illusionist', level: 3, description: 'Create convincing illusions' },
  ],
};

// Subclass features with level requirements and choices
export const SUBCLASS_FEATURES = {
  // BARBARIAN
  'Path of the Berserker': {
    features: [
      { level: 3, name: 'Frenzy', description: 'While raging, you can make one extra attack as a Bonus Action each turn. After rage ends, you gain one level of Exhaustion.' },
      { level: 6, name: 'Mindless Rage', description: "You can't be Charmed or Frightened while raging. If Charmed/Frightened when you enter rage, the effect is suspended." },
      { level: 10, name: 'Retaliation', description: 'When you take damage from a creature within 5 ft, use your Reaction to make a melee attack against it.' },
      { level: 14, name: 'Intimidating Presence', description: 'As a Bonus Action, frighten a creature within 30 ft (WIS save DC 8 + PB + STR). Lasts 1 minute or until out of line of sight.' },
    ],
  },
  'Path of the Wild Heart': {
    features: [
      { level: 3, name: 'Animal Speaker', description: 'Cast Speak with Animals as a ritual.' },
      { level: 3, name: 'Rage of the Wilds', description: 'Choose an animal aspect when you rage.', choice: 'wild_heart_rage_3' },
      { level: 6, name: 'Aspect of the Wilds', description: 'Gain a permanent animal aspect.', choice: 'wild_heart_aspect_6' },
      { level: 10, name: 'Nature Speaker', description: 'Cast Commune with Nature as a ritual.' },
      { level: 14, name: 'Power of the Wilds', description: 'Choose an upgraded animal power when you rage.', choice: 'wild_heart_power_14' },
    ],
    choices: {
      'wild_heart_rage_3': {
        label: 'Rage of the Wilds (Level 3)',
        options: [
          { name: 'Bear', description: 'Resistance to all damage except Force, Necrotic, Psychic, and Radiant.' },
          { name: 'Eagle', description: 'Disengage as a Bonus Action, and opportunity attacks have Disadvantage against you.' },
          { name: 'Wolf', description: 'Allies have Advantage on attacks against enemies within 5 ft of you.' },
        ],
      },
      'wild_heart_aspect_6': {
        label: 'Aspect of the Wilds (Level 6)',
        options: [
          { name: 'Owl', description: 'Darkvision 60 ft (or +60 ft). Cast Detect Magic as a ritual.' },
          { name: 'Panther', description: '+10 ft speed. Climbing speed equal to walking speed.' },
          { name: 'Salmon', description: 'Swimming speed equal to walking speed. Breathe underwater.' },
        ],
      },
      'wild_heart_power_14': {
        label: 'Power of the Wilds (Level 14)',
        options: [
          { name: 'Falcon', description: 'Fly up to half your speed (fall if you end in the air).' },
          { name: 'Lion', description: 'If you move 20+ ft toward a Large or smaller creature, it makes STR save or is knocked Prone.' },
          { name: 'Ram', description: 'If you hit a Large or smaller creature, it makes STR save or is pushed 15 ft.' },
        ],
      },
    },
  },
  'Path of the World Tree': {
    features: [
      { level: 3, name: 'Vitality of the Tree', description: 'While raging, heal 1d4 + CON HP at the end of each turn (if current HP is less than half max).' },
      { level: 6, name: 'Branches of the Tree', description: 'Teleport up to 60 ft to an unoccupied space you can see while raging (Bonus Action). Also teleport one willing ally within 10 ft to a space within 5 ft of your destination.' },
      { level: 10, name: 'Battering Roots', description: 'When you Shove, the distance is increased by 15 ft. Shoving a Large or smaller creature moves them to an unoccupied space within 15 ft.' },
      { level: 14, name: 'Travel Along the Tree', description: 'Once per Long Rest, transport yourself and up to 6 willing creatures via the World Tree to a location on the same plane.' },
    ],
  },
  'Path of the Zealot': {
    features: [
      { level: 3, name: 'Divine Fury', description: 'While raging, first creature you hit each turn takes extra 1d6 + half Barbarian level Necrotic or Radiant damage (your choice).' },
      { level: 3, name: 'Warrior of the Gods', description: "Spells that restore you to life (not Revivify) don't require material components." },
      { level: 6, name: 'Fanatical Focus', description: 'Once per rage, reroll a failed saving throw.' },
      { level: 10, name: 'Zealous Presence', description: 'Bonus Action: up to 10 creatures within 60 ft gain Advantage on attack rolls and saves until start of your next turn. Once per Long Rest.' },
      { level: 14, name: 'Rage Beyond Death', description: "While raging, dropping to 0 HP doesn't knock you unconscious. You still make death saves, and you die if you fail 3. You die when rage ends if at 0 HP." },
    ],
  },

  // BARD
  'College of Dance': {
    features: [
      { level: 3, name: 'Dazzling Footwork', description: 'While not wearing armor or using a shield, AC equals 10 + DEX + CHA. Your speed increases by 10 ft. Disengage as part of your movement.' },
      { level: 3, name: 'Inspiring Movement', description: 'When you use Bardic Inspiration, you can move up to half your speed. If you end within 5 ft of an ally, they can use their Reaction to move up to half their speed.' },
      { level: 6, name: 'Tandem Footwork', description: 'When you roll Initiative, you can spend a use of Bardic Inspiration. You and allies within 30 ft who can see you add a roll of your Bardic Inspiration die to their Initiative.' },
      { level: 14, name: 'Leading Evasion', description: 'When subjected to an effect that allows DEX save for half damage, you take no damage on success and half on failure. Allies within 5 ft who can see you gain the same benefit.' },
    ],
  },
  'College of Glamour': {
    features: [
      { level: 3, name: 'Beguiling Magic', description: 'Add Charm Person and Mirror Image to your known spells. When a creature fails a save against one of your Enchantment or Illusion spells, it has Disadvantage on saves against your spells until the start of your next turn.' },
      { level: 3, name: 'Mantle of Inspiration', description: 'Bonus Action: spend a Bardic Inspiration use to give up to CHA mod (min 1) creatures 2x Bardic Inspiration die THP. Each can use Reaction to move up to their speed without provoking opportunity attacks.' },
      { level: 6, name: 'Mantle of Majesty', description: 'Bonus Action: cast Command without a spell slot (CHA times per Long Rest). While concentrating, cast Command as Bonus Action without spending a slot.' },
      { level: 14, name: 'Unbreakable Majesty', description: 'Bonus Action: assume an appearance of majesty for 1 minute. First time a creature attacks you each turn, it must make CHA save or choose a new target (attack is wasted if no other targets). On failed save, it also has Disadvantage on saves against your spells until start of your next turn.' },
    ],
  },
  'College of Lore': {
    features: [
      { level: 3, name: 'Bonus Proficiencies', description: 'Gain proficiency in three skills of your choice.' },
      { level: 3, name: 'Cutting Words', description: 'Reaction when a creature you can see within 60 ft makes an attack, ability check, or damage roll: subtract your Bardic Inspiration die from the roll.' },
      { level: 6, name: 'Magical Discoveries', description: 'Learn two spells from any spell list. They count as Bard spells for you.' },
      { level: 14, name: 'Peerless Skill', description: 'When you make an ability check and fail, you can expend a Bardic Inspiration use, roll the die, and add it to the check (potentially turning failure to success).' },
    ],
  },
  'College of Valor': {
    features: [
      { level: 3, name: 'Combat Inspiration', description: 'A creature with your Bardic Inspiration die can add it to a weapon damage roll or to AC against one attack (after seeing roll, before knowing outcome).' },
      { level: 3, name: 'Martial Training', description: 'Gain proficiency with Medium armor, Shields, and Martial weapons.' },
      { level: 6, name: 'Extra Attack', description: 'Attack twice when you take the Attack action.' },
      { level: 14, name: 'Battle Magic', description: 'When you cast a spell using an action, you can make one weapon attack as a Bonus Action.' },
    ],
  },

  // CLERIC
  'Life Domain': {
    features: [
      { level: 3, name: 'Disciple of Life', description: 'Healing spells you cast on others restore additional HP equal to 2 + spell level.' },
      { level: 3, name: 'Life Domain Spells', description: 'Always prepared: Bless, Cure Wounds, Aid, Lesser Restoration, Mass Healing Word, Revivify, Aura of Life, Death Ward, Greater Restoration, Mass Cure Wounds.' },
      { level: 6, name: 'Blessed Healer', description: 'When you cast a spell that restores HP to another creature, you regain 2 + spell level HP.' },
      { level: 17, name: 'Supreme Healing', description: 'When you roll dice to restore HP with a spell, treat any roll of 1-3 as a 4.' },
    ],
  },
  'Light Domain': {
    features: [
      { level: 3, name: 'Radiance of the Dawn', description: 'Action: dispel magical darkness within 30 ft. Each hostile creature within 30 ft makes CON save or takes 2d10 + Cleric level Radiant damage (half on success). PB uses per Long Rest.' },
      { level: 3, name: 'Light Domain Spells', description: 'Always prepared: Burning Hands, Faerie Fire, Flaming Sphere, Scorching Ray, Daylight, Fireball, Arcane Eye, Wall of Fire, Flame Strike, Scrying.' },
      { level: 3, name: 'Warding Flare', description: 'Reaction when attacked by creature within 30 ft: impose Disadvantage on attack (PB uses per Long Rest). Must be able to see attacker.' },
      { level: 6, name: 'Improved Warding Flare', description: 'You can use Warding Flare when a creature you can see within 30 ft attacks a creature other than you.' },
      { level: 17, name: 'Corona of Light', description: 'Action: activate an aura of sunlight (60 ft radius bright light, 30 ft dim light, lasts 1 minute). Enemies in bright light have Disadvantage on saves vs spells that deal Fire or Radiant damage.' },
    ],
  },
  'Trickery Domain': {
    features: [
      { level: 3, name: 'Blessing of the Trickster', description: 'Action: touch a willing creature (not yourself) to give it Advantage on Stealth checks. Lasts 1 hour or until you use this again.' },
      { level: 3, name: 'Trickery Domain Spells', description: 'Always prepared: Charm Person, Disguise Self, Invisibility, Pass without Trace, Hypnotic Pattern, Nondetection, Confusion, Dimension Door, Dominate Person, Modify Memory.' },
      { level: 6, name: 'Invoke Duplicity', description: 'Bonus Action: create an illusory duplicate within 30 ft (lasts 1 minute, concentration). Move it 30 ft as Bonus Action. Cast spells as if in its space. Advantage on attacks when you and duplicate are within 5 ft of target. PB uses per Long Rest.' },
      { level: 17, name: 'Improved Duplicity', description: 'When you and your duplicate are within 5 ft of a creature, it has Disadvantage on saves against your spells. You can create up to 4 duplicates with one use of Invoke Duplicity.' },
    ],
  },
  'War Domain': {
    features: [
      { level: 3, name: 'Guided Strike', description: 'When you or a creature within 30 ft misses an attack, use Reaction to grant +10 to the roll. PB uses per Long Rest.' },
      { level: 3, name: 'War Domain Spells', description: 'Always prepared: Divine Favor, Shield of Faith, Magic Weapon, Spiritual Weapon, Crusaders Mantle, Spirit Guardians, Fire Shield, Freedom of Movement, Flame Strike, Hold Monster.' },
      { level: 3, name: 'War Priest', description: 'Bonus Action: make one weapon attack. WIS mod (min 1) uses per Long Rest.' },
      { level: 6, name: 'War Gods Blessing', description: 'You can use Guided Strike on attacks made by allies within 30 ft, not just yourself.' },
      { level: 17, name: 'Avatar of Battle', description: 'You have Resistance to Bludgeoning, Piercing, and Slashing damage.' },
    ],
  },

  // DRUID
  'Circle of the Land': {
    features: [
      { level: 3, name: 'Land\'s Aid', description: 'As a Magic action, expend a Wild Shape use to cast Healing Word (level = PB, no spell slot). After casting, a creature that received healing gains Advantage on the next attack roll it makes before the end of its next turn.' },
      { level: 3, name: 'Circle Spells', description: 'Choose a land type. You always have its spells prepared.', choice: 'land_type' },
      { level: 6, name: 'Natural Recovery', description: 'During a Short Rest, choose expended spell slots to recover (total levels ≤ half Druid level, none above 5th). Once per Long Rest.' },
      { level: 10, name: 'Nature\'s Ward', description: 'Immune to the Poisoned condition and resistance to Poison damage. Immune to the Charmed condition from Fey and Elementals.' },
      { level: 14, name: 'Nature\'s Sanctuary', description: 'When a creature attacks you, it must make a WIS save. On failure, it must choose a different target or the attack misses. On success, immune for 24 hours. Creatures immune to Charmed auto-succeed.' },
    ],
    choices: {
      'land_type': {
        label: 'Land Type',
        options: [
          { name: 'Arid', description: 'Blur, Burning Hands, Fire Bolt (cantrip), Fire Shield, Wall of Stone.' },
          { name: 'Polar', description: 'Fog Cloud, Hold Person, Ray of Frost (cantrip), Sleet Storm, Ice Storm.' },
          { name: 'Temperate', description: 'Misty Step, Shocking Grasp (cantrip), Lightning Bolt, Freedom of Movement, Tree Stride.' },
          { name: 'Tropical', description: 'Acid Splash (cantrip), Entangle, Spike Growth, Stinking Cloud, Polymorph.' },
        ],
      },
    },
  },
  'Circle of the Moon': {
    features: [
      { level: 3, name: 'Combat Wild Shape', description: 'Use Wild Shape as a Bonus Action. While in Wild Shape, you can use a Bonus Action to expend a spell slot and regain 1d8 HP per slot level.' },
      { level: 3, name: 'Circle Forms', description: 'Wild Shape into beasts with CR as high as your Druid level divided by 3 (round down). Ignore beast movement requirements.' },
      { level: 6, name: 'Improved Circle Forms', description: 'While in Wild Shape, your attacks count as magical. You can Wild Shape into a beast with a swim or fly speed.' },
      { level: 10, name: 'Elemental Wild Shape', description: 'Expend two Wild Shape uses to transform into an Air, Earth, Fire, or Water Elemental.' },
      { level: 14, name: 'Thousand Forms', description: 'Cast Alter Self at will without expending a spell slot.' },
    ],
  },
  'Circle of the Sea': {
    features: [
      { level: 3, name: 'Wrath of the Sea', description: 'As a Bonus Action, expend a Wild Shape use to create a 10-ft-radius sphere of ocean fury. Lasts 1 minute. When you end your turn in the sphere, you can force creatures of your choice in it to make CON save: 1d6 Cold damage (increases at 5th, 9th, 13th, 17th level) and their speed is halved until start of your next turn; half damage on success and no speed reduction.' },
      { level: 6, name: 'Aquatic Affinity', description: 'You gain a swim speed equal to your walking speed. You can breathe underwater.' },
      { level: 10, name: 'Stormborn', description: "Resistance to Cold and Lightning damage. You can move through hostile creatures. You can target a creature with Wrath of the Sea even if you can't see it, as long as it's in the sphere." },
      { level: 14, name: 'Oceanic Gift', description: 'When you use Wrath of the Sea, choose up to 5 creatures you can see. They gain swim speed, can breathe underwater, and have resistance to Cold and Lightning damage while in the sphere.' },
    ],
  },
  'Circle of the Stars': {
    features: [
      { level: 3, name: 'Star Map', description: "You have a star map that is your spellcasting focus. You know Guidance and can cast it without needing the material component. You learn Guiding Bolt and it doesn't count against spells known; you can cast it PB times without a spell slot per Long Rest." },
      { level: 3, name: 'Starry Form', description: 'As a Bonus Action, expend a Wild Shape to assume a starry form (lasts 10 minutes). Choose a constellation.', choice: 'starry_form' },
      { level: 6, name: 'Cosmic Omen', description: 'After a Long Rest, roll a die: even = Weal, odd = Woe. PB times per Long Rest, when a creature within 30 ft makes an attack/check/save, you can use Reaction to add or subtract 1d6 based on your omen.' },
      { level: 10, name: 'Twinkling Constellations', description: 'Starry Form becomes more powerful. Archer: bonus becomes +1d10. Chalice: additional 1d8 HP to you or another creature. Dragon: minimum 10 on concentration checks.' },
      { level: 14, name: 'Full of Stars', description: 'While in Starry Form, you have resistance to Bludgeoning, Piercing, and Slashing damage.' },
    ],
    choices: {
      'starry_form': {
        label: 'Starry Form Constellation',
        options: [
          { name: 'Archer', description: 'Bonus Action: make a ranged spell attack, 60 ft, deals Radiant damage equal to 1d8 + WIS.' },
          { name: 'Chalice', description: 'When you cast a spell using a spell slot that restores HP, you or another creature within 30 ft regains 1d8 + WIS HP.' },
          { name: 'Dragon', description: 'You can treat a roll of 9 or lower on concentration checks as a 10. You understand Draconic. You have 20 ft hover speed.' },
        ],
      },
    },
  },
  'Circle of the Shepherd*': {
    features: [
      { level: 2, name: 'Speech of the Woods', description: 'You learn Sylvan. You can cast Speak with Animals at will.' },
      { level: 2, name: 'Spirit Totem', description: 'Bonus Action: summon an incorporeal spirit (60-ft aura, lasts 1 minute). Choose Bear (THP), Hawk (Advantage on Perception, Advantage on attacks vs enemies in aura), or Unicorn (Advantage on detecting creatures, healing spells give additional HP).', choice: 'spirit_totem' },
      { level: 6, name: 'Mighty Summoner', description: 'Beasts and Fey you conjure have +2 HP per Hit Die and their attacks count as magical.' },
      { level: 10, name: 'Guardian Spirit', description: 'Your Spirit Totem also grants your summoned creatures half your Druid level in THP when they appear in its aura.' },
      { level: 14, name: 'Faithful Summons', description: 'If you drop to 0 HP or are incapacitated, you can immediately summon 4 beasts of CR 2 or lower. They appear within 20 ft, act on your turn, and protect you. Lasts 1 hour. Once per Long Rest.' },
    ],
    choices: {
      'spirit_totem': {
        label: 'Spirit Totem',
        options: [
          { name: 'Bear Spirit', description: 'You and allies in aura gain your Druid level + 5 THP and have Advantage on STR checks/saves.' },
          { name: 'Hawk Spirit', description: 'You and allies in aura have Advantage on Perception checks. Reaction: grant Advantage on one attack roll against a target in the aura.' },
          { name: 'Unicorn Spirit', description: 'You and allies in aura have Advantage on detecting creatures. When you cast a healing spell, each creature of your choice in the aura regains HP equal to your Druid level.' },
        ],
      },
    },
  },

  // FIGHTER
  'Battle Master': {
    features: [
      { level: 3, name: 'Combat Superiority', description: 'Learn 3 maneuvers. Gain 4 Superiority Dice (d8). Regain all on Short/Long Rest. DC = 8 + PB + STR or DEX.', choice: 'maneuvers_3' },
      { level: 3, name: 'Student of War', description: 'Gain proficiency with one Artisan\'s Tools of your choice.' },
      { level: 7, name: 'Know Your Enemy', description: 'If you spend 1 minute observing a creature, learn if it is superior, equal, or inferior in two characteristics of your choice (STR, DEX, CON, AC, current HP, total class levels, Fighter levels).' },
      { level: 10, name: 'Improved Combat Superiority', description: 'Superiority Dice become d10. Learn 2 more maneuvers.' },
      { level: 15, name: 'Relentless', description: 'When you roll Initiative and have no Superiority Dice remaining, you regain 1.' },
      { level: 18, name: 'Ultimate Combat Superiority', description: 'Superiority Dice become d12. Learn 2 more maneuvers.' },
    ],
    choices: {
      'maneuvers_3': {
        label: 'Maneuvers (Choose 3)',
        multi: true,
        max: 3,
        options: [
          { name: 'Ambush', description: 'Add Superiority Die to Stealth or Initiative roll.' },
          { name: 'Bait and Switch', description: 'Switch places with ally within 5 ft; one of you adds die to AC until start of your next turn.' },
          { name: 'Commander\'s Strike', description: 'Forgo one attack to direct ally to attack as Reaction; add die to damage.' },
          { name: 'Commanding Presence', description: 'Add die to Intimidation, Performance, or Persuasion check.' },
          { name: 'Disarming Attack', description: 'Add die to damage; target makes STR save or drops one item.' },
          { name: 'Distracting Strike', description: 'Add die to damage; next attack vs target has Advantage.' },
          { name: 'Evasive Footwork', description: 'Add die to AC while moving.' },
          { name: 'Feinting Attack', description: 'Bonus Action: Advantage on next attack vs target, add die to damage.' },
          { name: 'Goading Attack', description: 'Add die to damage; target has Disadvantage on attacks vs others.' },
          { name: 'Lunging Attack', description: '+5 ft reach for one attack; add die to damage.' },
          { name: 'Maneuvering Attack', description: 'Add die to damage; ally can move half speed as Reaction without opportunity attacks.' },
          { name: 'Menacing Attack', description: 'Add die to damage; target makes WIS save or is Frightened.' },
          { name: 'Parry', description: 'Reaction: reduce melee damage by die + DEX mod.' },
          { name: 'Precision Attack', description: 'Add die to attack roll.' },
          { name: 'Pushing Attack', description: 'Add die to damage; target makes STR save or is pushed 15 ft.' },
          { name: 'Rally', description: 'Bonus Action: ally gains die + CHA mod THP.' },
          { name: 'Riposte', description: 'Reaction when missed: attack and add die to damage.' },
          { name: 'Sweeping Attack', description: 'Hit another creature within reach for the die in damage.' },
          { name: 'Tactical Assessment', description: 'Add die to History, Insight, or Investigation check.' },
          { name: 'Trip Attack', description: 'Add die to damage; target makes STR save or falls Prone.' },
        ],
      },
    },
  },
  'Champion': {
    features: [
      { level: 3, name: 'Improved Critical', description: 'Your weapon attacks score a critical hit on a roll of 19 or 20.' },
      { level: 3, name: 'Remarkable Athlete', description: 'Add half your PB (round up) to any STR, DEX, or CON check that doesn\'t already use your PB. Running long jump distance increases by a number of feet equal to your STR mod.' },
      { level: 7, name: 'Additional Fighting Style', description: 'Choose another Fighting Style from the Fighter list.' },
      { level: 10, name: 'Heroic Warrior', description: 'Once per turn when you hit with a weapon attack, you can give yourself Heroic Advantage. Once per Long Rest, if you have no uses of Heroic Advantage, you regain one use.' },
      { level: 15, name: 'Superior Critical', description: 'Weapon attacks score a critical hit on a roll of 18-20.' },
      { level: 18, name: 'Survivor', description: 'At the start of your turn, you regain HP equal to 5 + CON mod if you have no more than half your HP. Doesn\'t work if you have 0 HP.' },
    ],
  },
  'Eldritch Knight': {
    features: [
      { level: 3, name: 'Spellcasting', description: 'You learn cantrips and spells from the Wizard spell list. INT is your spellcasting ability. You know 2 cantrips and 2 spells (Abjuration or Evocation). Spell slots as Eldritch Knight table.' },
      { level: 3, name: 'War Bond', description: 'Bond with up to 2 weapons. You can\'t be disarmed while conscious. Bonus Action: summon bonded weapon to your hand if on same plane.' },
      { level: 7, name: 'War Magic', description: 'When you cast a cantrip, you can make one weapon attack as a Bonus Action.' },
      { level: 10, name: 'Eldritch Strike', description: 'When you hit a creature with a weapon, it has Disadvantage on saves vs your spells until the end of your next turn.' },
      { level: 15, name: 'Arcane Charge', description: 'When you use Action Surge, you can teleport up to 30 ft to an unoccupied space you can see.' },
      { level: 18, name: 'Improved War Magic', description: 'When you cast a spell, you can make one weapon attack as a Bonus Action.' },
    ],
  },
  'Psi Warrior': {
    features: [
      { level: 3, name: 'Psionic Power', description: 'You have a pool of Psionic Energy dice (d6, number = 2x PB). Regain all on Long Rest; regain one as Bonus Action once per Short Rest.' },
      { level: 3, name: 'Protective Field', description: 'Reaction when you or creature within 30 ft takes damage: reduce damage by Psionic Energy die + INT mod.' },
      { level: 3, name: 'Psionic Strike', description: 'Once per turn when you hit, deal extra Force damage equal to Psionic Energy die + INT mod.' },
      { level: 3, name: 'Telekinetic Movement', description: 'Action: move a Large or smaller loose object or willing creature up to 30 ft. If you spend a Psionic Energy die, it can be a Magic action.' },
      { level: 7, name: 'Telekinetic Adept', description: 'Psi-Powered Leap: Bonus Action, fly speed = 2x walking speed until end of turn. Telekinetic Thrust: deal Psionic Strike damage and make target STR save or be knocked prone or pushed 10 ft.' },
      { level: 10, name: 'Guarded Mind', description: 'Resistance to Psychic damage. Spend a Psionic Energy die to end Charmed or Frightened on yourself.' },
      { level: 15, name: 'Bulwark of Force', description: 'Bonus Action: create half cover for up to INT mod creatures within 30 ft. Lasts 1 minute or until incapacitated. Once per Long Rest, or spend a Psionic Energy die.' },
      { level: 18, name: 'Telekinetic Master', description: 'Cast Telekinesis without components, using INT. While concentrating, make one weapon attack as Bonus Action. Once per Long Rest, or spend a Psionic Energy die.' },
    ],
  },

  // MONK - keeping brief for space
  'Warrior of Mercy': {
    features: [
      { level: 3, name: 'Hand of Harm', description: 'When you hit with an Unarmed Strike, spend 1 Focus Point to deal extra Necrotic damage equal to one Martial Arts die + WIS mod. Can only use once per turn.' },
      { level: 3, name: 'Hand of Healing', description: 'Action: spend 1 Focus Point to touch a creature and restore HP equal to Martial Arts die + WIS mod. Or replace one Unarmed Strike with this.' },
      { level: 3, name: 'Implements of Mercy', description: 'Proficiency with Herbalism Kit and one skill: Insight, Medicine, or Survival.' },
      { level: 6, name: 'Physician\'s Touch', description: 'Hand of Healing also ends one disease or condition (Blinded, Deafened, Paralyzed, Poisoned, Stunned). Hand of Harm can inflict Poisoned until end of your next turn.' },
      { level: 11, name: 'Flurry of Healing and Harm', description: 'You can replace each Flurry of Blows strike with Hand of Healing (no additional Focus Point). When using Hand of Harm, you can use it twice per turn.' },
      { level: 17, name: 'Hand of Ultimate Mercy', description: 'Action: touch a creature that died in the last 24 hours and expend 5 Focus Points. They return to life with 4d10 + WIS mod HP. Once per Long Rest.' },
    ],
  },
  'Warrior of Shadow': {
    features: [
      { level: 3, name: 'Shadow Arts', description: 'You can use Focus Points to cast: Darkness (2), Darkvision (2), Pass without Trace (2), Silence (2). You can also spend 1 Focus Point to see up to 120 ft in normal and magical darkness (1 minute).' },
      { level: 6, name: 'Shadow Step', description: 'Bonus Action: teleport up to 60 ft from one dim/dark area to another you can see. Advantage on first melee attack before end of turn.' },
      { level: 11, name: 'Improved Shadow Step', description: 'Shadow Step teleport increases to 120 ft. When you use it, you can make an Unarmed Strike as part of the Bonus Action.' },
      { level: 17, name: 'Cloak of Shadows', description: 'Action: become Invisible in dim light or darkness. Lasts 1 minute (or until you attack or cast a spell). While invisible, you have 15 ft Blindsight.' },
    ],
  },
  'Warrior of the Elements': {
    features: [
      { level: 3, name: 'Elemental Attunement', description: 'Your connection to the elements allows you to augment your strikes with elemental power.' },
      { level: 3, name: 'Manipulate Elements', description: 'Action: cause harmless elemental effects (chill water, create a spark, stir a breeze, etc.)' },
      { level: 3, name: 'Elemental Burst', description: 'As a Magic action, spend 2 Focus Points: each creature in a 20-ft radius sphere within 120 ft makes DEX save. Takes 3d6 damage (Acid, Cold, Fire, Lightning, or Thunder) on failure, half on success.' },
      { level: 6, name: 'Environmental Burst', description: 'When you use Elemental Burst, you can create difficult terrain or 20-ft-radius obscuring smoke.' },
      { level: 11, name: 'Stride of the Elements', description: 'Step of the Wind grants Fly and Swim speed until end of turn (fall if you end turn in the air).' },
      { level: 17, name: 'Elemental Epitome', description: 'When you use Step of the Wind, elemental power suffuses you for 1 minute: +1d6 elemental damage on hit, Fly and Swim speed without falling at end of turn, Resistance to one element (choose when activated).' },
    ],
  },
  'Warrior of the Open Hand': {
    features: [
      { level: 3, name: 'Open Hand Technique', description: 'When you hit with a Flurry of Blows attack, you can impose one effect: DEX save or Prone, STR save or pushed 15 ft, or can\'t take Reactions until your next turn.' },
      { level: 6, name: 'Wholeness of Body', description: 'Bonus Action: regain HP equal to 3 × Monk level. Once per Long Rest.' },
      { level: 11, name: 'Fleet Step', description: 'When you take a Bonus Action, you can also take the Dash action as part of it.' },
      { level: 17, name: 'Quivering Palm', description: 'When you hit with Unarmed Strike, you can start vibrations lasting 14 days. Action to end: target CON save or drop to 0 HP, or take 10d12 Necrotic damage on success. One creature at a time.' },
    ],
  },

  // PALADIN
  'Oath of Devotion': {
    features: [
      { level: 3, name: 'Oath Spells', description: 'Protection from Evil and Good, Shield of Faith, Aid, Zone of Truth, Beacon of Hope, Dispel Magic, Freedom of Movement, Guardian of Faith, Commune, Flame Strike.' },
      { level: 3, name: 'Sacred Weapon', description: 'Channel Divinity: Bonus Action, for 10 minutes your weapon is magical, +CHA to attack rolls, emits bright light 20 ft / dim 20 ft.' },
      { level: 3, name: 'Turn the Unholy', description: 'Channel Divinity: Action, Fiends and Undead within 30 ft make WIS save or are turned for 1 minute.' },
      { level: 7, name: 'Aura of Devotion', description: 'You and allies within 10 ft can\'t be Charmed while you\'re conscious. At 18th level, range increases to 30 ft.' },
      { level: 15, name: 'Smite of Protection', description: 'When you (or an ally within 30 ft) hit with Divine Smite, you can give the creature temporary HP equal to 1d8 + your CHA mod.' },
      { level: 20, name: 'Holy Nimbus', description: 'Bonus Action: for 10 minutes, emit bright light 30 ft / dim 30 ft. Enemies starting turn in bright light take 10 Radiant damage. Advantage on saves vs spells of Fiends/Undead. Once per Long Rest.' },
    ],
  },
  'Oath of Glory': {
    features: [
      { level: 3, name: 'Oath Spells', description: 'Guiding Bolt, Heroism, Enhance Ability, Magic Weapon, Haste, Protection from Energy, Compulsion, Freedom of Movement, Legend Lore, Yolande\'s Regal Presence.' },
      { level: 3, name: 'Peerless Athlete', description: 'Channel Divinity: Bonus Action, for 1 hour you have Advantage on Athletics and Acrobatics, carry/push/lift capacity doubles, and jumping distance increases by 10 ft.' },
      { level: 3, name: 'Inspiring Smite', description: 'Channel Divinity: When you hit with Divine Smite, grant THP to creatures of your choice within 30 ft (total THP = 2d8 + Paladin level, distributed as you choose).' },
      { level: 7, name: 'Aura of Alacrity', description: 'Your walking speed increases by 10 ft. Allies within 10 ft have +10 ft walking speed. At 18th level, range increases to 30 ft.' },
      { level: 15, name: 'Glorious Defense', description: 'Reaction when you or ally within 10 ft is hit: add CHA to target\'s AC for that attack (possibly causing miss). If attack misses, you can attack the attacker.' },
      { level: 20, name: 'Living Legend', description: 'Bonus Action: for 10 minutes, advantage on CHA checks, once per turn turn a miss into a hit, reroll a failed save (once). Once per Long Rest or spend a 5th-level slot.' },
    ],
  },
  'Oath of the Ancients': {
    features: [
      { level: 3, name: 'Oath Spells', description: 'Ensnaring Strike, Speak with Animals, Misty Step, Moonbeam, Plant Growth, Protection from Energy, Ice Storm, Stoneskin, Commune with Nature, Tree Stride.' },
      { level: 3, name: 'Nature\'s Wrath', description: 'Channel Divinity: Action, spectral vines restrain a creature within 15 ft (STR or DEX save to escape).' },
      { level: 3, name: 'Turn the Faithless', description: 'Channel Divinity: Action, Fey and Fiends within 30 ft make WIS save or are turned for 1 minute.' },
      { level: 7, name: 'Aura of Warding', description: 'You and allies within 10 ft have Resistance to spell damage. At 18th level, range increases to 30 ft.' },
      { level: 15, name: 'Undying Sentinel', description: 'When you drop to 0 HP and aren\'t killed outright, you can choose to drop to 1 HP instead. Once per Long Rest. Also, you don\'t suffer the drawbacks of old age and can\'t be aged magically.' },
      { level: 20, name: 'Elder Champion', description: 'Bonus Action: for 10 minutes, regain 10 HP at start of turn, cast Paladin spells as Bonus Action, enemies within 10 ft have Disadvantage on saves vs your spells and Channel Divinity. Once per Long Rest.' },
    ],
  },
  'Oath of Vengeance': {
    features: [
      { level: 3, name: 'Oath Spells', description: 'Bane, Compelled Duel, Hold Person, Misty Step, Haste, Protection from Energy, Banishment, Dimension Door, Hold Monster, Scrying.' },
      { level: 3, name: 'Vow of Enmity', description: 'Channel Divinity: Bonus Action, choose a creature within 30 ft. Advantage on attack rolls against it for 1 minute or until it drops to 0 HP or falls unconscious.' },
      { level: 3, name: 'Abjure Enemy', description: 'Channel Divinity: Action, one creature within 60 ft makes WIS save or is Frightened for 1 minute (or until it takes damage). Speed is 0 while Frightened. Fiends/Undead have Disadvantage on the save.' },
      { level: 7, name: 'Relentless Avenger', description: 'When you hit with an Opportunity Attack, you can move up to half your speed immediately after as part of your Reaction. This movement doesn\'t provoke Opportunity Attacks.' },
      { level: 15, name: 'Soul of Vengeance', description: 'When a creature under your Vow of Enmity makes an attack, you can use your Reaction to make a melee weapon attack against it if it\'s within range.' },
      { level: 20, name: 'Avenging Angel', description: 'Bonus Action: for 10 minutes, gain flying speed of 60 ft, emanate a 30-ft aura of menace (enemies make WIS save or Frightened for 1 minute). Once per Long Rest.' },
    ],
  },

  // RANGER
  'Beast Master': {
    features: [
      { level: 3, name: 'Primal Companion', description: 'Summon a Beast of the Land, Sea, or Sky. It obeys your commands, acts on your turn, and you can command it as a Bonus Action. You can restore it with a 1st-level spell slot.' },
      { level: 7, name: 'Exceptional Training', description: 'On your turn, you can command your beast to Dash, Disengage, Dodge, or Help as a Bonus Action. Its attacks count as magical.' },
      { level: 11, name: 'Bestial Fury', description: 'When you command your beast to attack, it can make two attacks.' },
      { level: 15, name: 'Share Spells', description: 'When you cast a spell targeting yourself, you can also affect your beast if it\'s within 30 ft.' },
    ],
  },
  'Fey Wanderer': {
    features: [
      { level: 3, name: 'Dreadful Strikes', description: 'Your weapon attacks deal extra 1d4 Psychic damage (once per turn per creature). Increases to 1d6 at 11th level.' },
      { level: 3, name: 'Fey Wanderer Magic', description: 'Learn Charm Person. At 5th level Misty Step, 9th Dispel Magic, 13th Dimension Door, 17th Mislead. These don\'t count against spells known.' },
      { level: 3, name: 'Otherworldly Glamour', description: 'Add WIS mod to CHA checks (min +1). Proficiency in one skill: Deception, Performance, or Persuasion.' },
      { level: 7, name: 'Beguiling Twist', description: 'Advantage on saves vs Charmed/Frightened. Reaction when you or creature within 120 ft succeeds on such a save: force another creature within 120 ft to make WIS save or be Charmed/Frightened by you for 1 minute.' },
      { level: 11, name: 'Fey Reinforcements', description: 'Cast Summon Fey without a spell slot once per Long Rest. You can cast it with a slot for additional effect.' },
      { level: 15, name: 'Misty Wanderer', description: 'Cast Misty Step without a slot PB times per Long Rest. When you cast it, you can bring along a willing creature within 5 ft.' },
    ],
  },
  'Gloom Stalker': {
    features: [
      { level: 3, name: 'Dread Ambusher', description: 'Add WIS mod to Initiative. On the first turn of combat, your speed increases by 10 ft. The first creature you hit takes an extra 2d6 damage.' },
      { level: 3, name: 'Gloom Stalker Magic', description: 'Learn Disguise Self. At 5th Rope Trick, 9th Fear, 13th Greater Invisibility, 17th Seeming.' },
      { level: 3, name: 'Umbral Sight', description: 'Darkvision 60 ft (or +60 ft if you have it). You are invisible to creatures relying on Darkvision to see you in darkness.' },
      { level: 7, name: 'Iron Mind', description: 'Proficiency in WIS saves. If you already have it, choose INT or CHA saves instead.' },
      { level: 11, name: 'Stalker\'s Flurry', description: 'Once per turn when you miss with a weapon attack, you can make another weapon attack as part of the same action.' },
      { level: 15, name: 'Shadowy Dodge', description: 'Reaction when a creature you can see attacks you and doesn\'t have Advantage: impose Disadvantage on the attack.' },
    ],
  },
  'Hunter': {
    features: [
      { level: 3, name: 'Hunter\'s Prey', description: 'Choose a Hunter\'s Prey option.', choice: 'hunters_prey' },
      { level: 7, name: 'Defensive Tactics', description: 'Choose a Defensive Tactics option.', choice: 'defensive_tactics' },
      { level: 11, name: 'Superior Hunter\'s Prey', description: 'Choose a Superior Hunter\'s Prey option.', choice: 'superior_hunters_prey' },
      { level: 15, name: 'Superior Hunter\'s Defense', description: 'Choose a Superior Hunter\'s Defense option.', choice: 'superior_hunters_defense' },
    ],
    choices: {
      'hunters_prey': {
        label: 'Hunter\'s Prey (Level 3)',
        options: [
          { name: 'Colossus Slayer', description: 'Once per turn, deal an extra 1d8 damage to a creature that is below its HP maximum.' },
          { name: 'Horde Breaker', description: 'Once per turn, make another attack against a different creature within 5 ft of your target.' },
        ],
      },
      'defensive_tactics': {
        label: 'Defensive Tactics (Level 7)',
        options: [
          { name: 'Escape the Horde', description: 'Opportunity attacks against you have Disadvantage.' },
          { name: 'Multiattack Defense', description: 'When a creature hits you, you gain +4 AC against subsequent attacks from that creature this turn.' },
        ],
      },
      'superior_hunters_prey': {
        label: 'Superior Hunter\'s Prey (Level 11)',
        options: [
          { name: 'Volley', description: 'Action: make a ranged attack against any number of creatures within 10 ft of a point you can see within range. One attack per creature.' },
          { name: 'Whirlwind Attack', description: 'Action: make a melee attack against any number of creatures within 5 ft of you. One attack per creature.' },
        ],
      },
      'superior_hunters_defense': {
        label: 'Superior Hunter\'s Defense (Level 15)',
        options: [
          { name: 'Evasion', description: 'When you make a DEX save for half damage, you take none on success and half on failure.' },
          { name: 'Stand Against the Tide', description: 'Reaction when a creature misses you with a melee attack: force it to repeat the attack against another creature of your choice.' },
          { name: 'Uncanny Dodge', description: 'Reaction when an attacker you can see hits you: halve the attack\'s damage against you.' },
        ],
      },
    },
  },

  // ROGUE
  'Arcane Trickster': {
    features: [
      { level: 3, name: 'Spellcasting', description: 'You learn cantrips and spells from the Wizard spell list (Enchantment or Illusion). INT is your spellcasting ability. Know Mage Hand plus 2 cantrips and 2 spells.' },
      { level: 3, name: 'Mage Hand Legerdemain', description: 'Your Mage Hand is invisible. You can use it to: stow/retrieve objects from containers worn by others, use Thieves\' Tools at range. Bonus Action to control.' },
      { level: 9, name: 'Magical Ambush', description: 'If you are hidden when you cast a spell, the target has Disadvantage on saves against it.' },
      { level: 13, name: 'Versatile Trickster', description: 'Bonus Action: direct your Mage Hand to distract a creature within 5 ft of it. You have Advantage on attacks against that creature until the end of the turn.' },
      { level: 17, name: 'Spell Thief', description: 'Reaction when a creature casts a spell targeting you or including you in its area: the creature makes a save (DC = your spell save DC). On failure, negate the effect on you, and you learn the spell for 8 hours (can cast it once using a spell slot). Once per Long Rest.' },
    ],
  },
  'Assassin': {
    features: [
      { level: 3, name: 'Assassinate', description: 'On the first turn of combat, you have Advantage on attack rolls against creatures that haven\'t taken a turn. Any hit you score against a Surprised creature is a Critical Hit.' },
      { level: 3, name: 'Assassin\'s Tools', description: 'Proficiency with Disguise Kit and Poisoner\'s Kit.' },
      { level: 9, name: 'Infiltration Expertise', description: 'You can unfailingly create false identities. You can forge documents with a DC 15 + days spent modifier to detect.' },
      { level: 13, name: 'Envenom Weapons', description: 'When you use the Poison action, you can apply poison to a weapon or 3 pieces of ammunition. It lasts for 1 minute. Once per turn, the weapon\'s damage triggers a CON save (DC = 8 + DEX mod + PB) or be Poisoned until end of your next turn.' },
      { level: 17, name: 'Death Strike', description: 'When you hit a Surprised creature, it makes a CON save (DC = 8 + DEX mod + PB). On failure, double the damage.' },
    ],
  },
  'Soulknife': {
    features: [
      { level: 3, name: 'Psionic Power', description: 'You have Psionic Energy dice (d6, number = 2x PB). Regain all on Long Rest; regain one as Bonus Action once per Short Rest.' },
      { level: 3, name: 'Psi-Bolstered Knack', description: 'When you fail an ability check using a skill you\'re proficient in, roll a Psionic Energy die and add it. If that exceeds the DC, you succeed instead of fail. The die is expended only if you succeed.' },
      { level: 3, name: 'Psychic Whispers', description: 'Action: choose PB creatures you can see. You can speak telepathically with them for 1d12 hours (or until you use this again or are incapacitated). No die expended unless you want to extend the duration.' },
      { level: 3, name: 'Psychic Blades', description: 'Summon a psychic blade as part of an attack (1d6 Psychic, Finesse, Thrown 60 ft). After attacking with it, you can make a Bonus Action attack with a second blade (1d4 damage).' },
      { level: 9, name: 'Soul Blades', description: 'Homing Strikes: if you miss with your psychic blade, roll Psionic Energy die and add to attack roll. Psychic Teleportation: Bonus Action, throw a blade up to 10 × Psionic die ft, then teleport to that space.' },
      { level: 13, name: 'Psychic Veil', description: 'Action: become Invisible for 1 hour (or until you damage a creature or force a save). Once per Long Rest, or expend a Psionic Energy die.' },
      { level: 17, name: 'Rend Mind', description: 'When you deal Sneak Attack damage with your Psychic Blades, force a WIS save (DC = 8 + DEX + PB). On failure, the target is Stunned for 1 minute (saves at end of each turn). Once per Long Rest, or expend 3 Psionic Energy dice.' },
    ],
  },
  'Thief': {
    features: [
      { level: 3, name: 'Fast Hands', description: 'You can use Cunning Action to make a DEX (Sleight of Hand) check, use Thieves\' Tools, or take the Use an Object action.' },
      { level: 3, name: 'Second-Story Work', description: 'Climbing doesn\'t cost extra movement. Running jump distance increases by a number of feet equal to your DEX mod.' },
      { level: 9, name: 'Supreme Sneak', description: 'You have Advantage on DEX (Stealth) checks if you move no more than half your speed on the same turn.' },
      { level: 13, name: 'Use Magic Device', description: 'You can use any magic item, ignoring class, race, and level requirements.' },
      { level: 17, name: 'Thief\'s Reflexes', description: 'You can take two turns during the first round of combat. You take your first turn at your normal Initiative and your second turn at your Initiative minus 10.' },
    ],
  },

  // SORCERER
  'Aberrant Sorcery': {
    features: [
      { level: 3, name: 'Psionic Spells', description: 'Learn additional spells: Arms of Hadar, Calm Emotions, Detect Thoughts, Dissonant Whispers, Mind Sliver (cantrip). At higher levels: Hunger of Hadar, Evard\'s Black Tentacles, Summon Aberration, Telekinesis.' },
      { level: 3, name: 'Telepathic Speech', description: 'Bonus Action: form a telepathic link with a creature within 30 ft. You can communicate telepathically while within a number of miles equal to your CHA mod. Lasts for a number of minutes equal to your Sorcerer level.' },
      { level: 6, name: 'Psionic Sorcery', description: 'When you cast any Psionic Spell, you can cast it by expending Sorcery Points equal to the spell\'s level (no verbal or somatic components required).' },
      { level: 6, name: 'Psychic Defenses', description: 'Resistance to Psychic damage. Advantage on saves against being Charmed or Frightened.' },
      { level: 14, name: 'Revelation in Flesh', description: 'Bonus Action: spend 1+ Sorcery Points to transform for 10 minutes. Each point grants one benefit: see invisible creatures 60 ft, fly speed equal to walking, swim speed = 2× walking + breathe water, squeeze through 1-inch spaces.' },
      { level: 18, name: 'Warping Implosion', description: 'Action: teleport to a space within 120 ft. Each creature within 30 ft of the space you left makes STR save or takes 3d10 Force damage and is pulled toward the space. Once per Long Rest, or spend 5 Sorcery Points.' },
    ],
  },
  'Clockwork Sorcery': {
    features: [
      { level: 3, name: 'Clockwork Magic', description: 'Learn additional spells: Aid, Alarm, Lesser Restoration, Protection from Evil and Good. At higher levels: Dispel Magic, Protection from Energy, Freedom of Movement, Summon Construct, Wall of Force.' },
      { level: 3, name: 'Restore Balance', description: 'Reaction when a creature within 60 ft is about to roll with Advantage or Disadvantage: spend 1 Sorcery Point to prevent the roll from being affected by Advantage or Disadvantage.' },
      { level: 6, name: 'Bastion of Law', description: 'Action: spend 1-5 Sorcery Points to create a ward on a creature within 30 ft. Ward has dice equal to points spent. When the creature takes damage, expend any number of dice, rolling them and reducing the damage.' },
      { level: 14, name: 'Trance of Order', description: 'Bonus Action: enter a state of clockwork consciousness for 1 minute. Attack rolls against you can\'t benefit from Advantage. You can treat any attack, check, or save roll of 9 or lower as a 10. Once per Long Rest, or spend 5 Sorcery Points.' },
      { level: 18, name: 'Clockwork Cavalcade', description: 'Action: summon spirits of order in a 30-ft cube within 120 ft. Each creature of your choice in the area is restored to max HP and can end one spell affecting it (and Repairs damaged objects). Each other creature takes 100 Force damage (save for half). Once per Long Rest, or spend 7 Sorcery Points.' },
    ],
  },
  'Draconic Sorcery': {
    features: [
      { level: 3, name: 'Draconic Resilience', description: 'HP max increases by 3 and by 1 whenever you gain a Sorcerer level. Your AC equals 10 + DEX + CHA when not wearing armor.' },
      { level: 3, name: 'Dragon Ancestor', description: 'Choose a dragon type. You can speak, read, and write Draconic. Double your PB for CHA checks when interacting with dragons.', choice: 'dragon_ancestor' },
      { level: 6, name: 'Elemental Affinity', description: 'When you cast a spell that deals damage of your dragon\'s type, add CHA mod to one damage roll. You can spend 1 Sorcery Point to gain resistance to that damage type for 1 hour.' },
      { level: 14, name: 'Dragon Wings', description: 'Bonus Action: manifest dragon wings, gaining a flying speed equal to your walking speed. Lasts until you dismiss them. Can\'t manifest if wearing armor unless it\'s made to accommodate them.' },
      { level: 18, name: 'Draconic Presence', description: 'Action: spend 5 Sorcery Points to create a 60-ft aura of awe or fear. Hostile creatures that start their turn in the aura must make WIS save or be Charmed (awe) or Frightened (fear) until they leave. Once they leave, can\'t be affected for 24 hours.' },
    ],
    choices: {
      'dragon_ancestor': {
        label: 'Dragon Ancestor',
        options: [
          { name: 'Black (Acid)', description: 'Acid damage' },
          { name: 'Blue (Lightning)', description: 'Lightning damage' },
          { name: 'Brass (Fire)', description: 'Fire damage' },
          { name: 'Bronze (Lightning)', description: 'Lightning damage' },
          { name: 'Copper (Acid)', description: 'Acid damage' },
          { name: 'Gold (Fire)', description: 'Fire damage' },
          { name: 'Green (Poison)', description: 'Poison damage' },
          { name: 'Red (Fire)', description: 'Fire damage' },
          { name: 'Silver (Cold)', description: 'Cold damage' },
          { name: 'White (Cold)', description: 'Cold damage' },
        ],
      },
    },
  },
  'Wild Magic Sorcery': {
    features: [
      { level: 3, name: 'Wild Magic Surge', description: 'When you cast a spell of 1st level or higher, the DM can have you roll a d20. On a 1, roll on the Wild Magic Surge table.' },
      { level: 3, name: 'Tides of Chaos', description: 'Gain Advantage on one attack roll, ability check, or saving throw. Once you do, you must finish a Long Rest or cast a 1st-level or higher sorcerer spell (triggering a Wild Magic Surge) before you can use it again.' },
      { level: 6, name: 'Bend Luck', description: 'Reaction when another creature you can see makes an attack roll, ability check, or saving throw: spend 2 Sorcery Points to roll 1d4 and add or subtract it from the roll.' },
      { level: 14, name: 'Controlled Chaos', description: 'Whenever you roll on the Wild Magic Surge table, you can roll twice and choose either result.' },
      { level: 18, name: 'Spell Bombardment', description: 'When you roll damage for a spell and roll the highest number possible on any of the dice, you can roll that die again and add the extra roll to the damage. You can use this once per turn.' },
    ],
  },

  // WARLOCK
  'Archfey Patron': {
    features: [
      { level: 3, name: 'Archfey Spells', description: 'Learn additional spells: Calm Emotions, Faerie Fire, Misty Step, Phantasmal Force, Sleep. At higher levels: Blink, Plant Growth, Dominate Beast, Greater Invisibility, Dominate Person, Seeming.' },
      { level: 3, name: 'Steps of the Fey', description: 'Bonus Action: teleport up to 30 ft. PB uses per Long Rest. Each use includes one effect: Refreshing Step (gain THP = 1d10 + Warlock level), Taunting Step (a creature within 5 ft of where you left must make WIS save or have Disadvantage on attacks not against you), or Beguiling Step (a creature within 5 ft of where you appear must make WIS save or be Charmed by you for 1 minute).' },
      { level: 6, name: 'Misty Escape', description: 'Reaction when you take damage: become Invisible and teleport up to 60 ft. Invisible until start of next turn or until you attack/cast. Once per Short/Long Rest.' },
      { level: 10, name: 'Beguiling Defenses', description: 'You are immune to being Charmed. When another creature attempts to charm you, you can use your Reaction to turn the charm back on that creature (WIS save).' },
      { level: 14, name: 'Bewitching Magic', description: 'When you cast an Enchantment or Illusion spell using a spell slot, you can do one: impose Disadvantage on saves against the spell, or you have Advantage on attack rolls with the spell.' },
    ],
  },
  'Celestial Patron': {
    features: [
      { level: 3, name: 'Celestial Spells', description: 'Learn additional spells: Aid, Cure Wounds, Guiding Bolt, Lesser Restoration, Light (cantrip), Sacred Flame (cantrip). At higher levels: Daylight, Revivify, Guardian of Faith, Wall of Fire, Greater Restoration, Summon Celestial.' },
      { level: 3, name: 'Healing Light', description: 'You have a pool of d6s equal to 1 + Warlock level. Bonus Action: heal a creature within 60 ft by expending dice from the pool (max dice = CHA mod, min 1). Regain all dice on Long Rest.' },
      { level: 6, name: 'Radiant Soul', description: 'Resistance to Radiant damage. When you cast a spell that deals Fire or Radiant damage, add CHA mod to one damage roll.' },
      { level: 10, name: 'Celestial Resilience', description: 'You gain temporary HP equal to your Warlock level + CHA mod when you finish a Short or Long Rest. Additionally, choose up to 5 creatures you can see: each gains temporary HP equal to half your Warlock level + your CHA mod.' },
      { level: 14, name: 'Searing Vengeance', description: 'When you make death saving throws, you can instead spring back. You regain HP equal to half your HP max, and each creature of your choice within 30 ft takes 2d8 + CHA mod Radiant damage and is Blinded until the end of your turn. Once per Long Rest.' },
    ],
  },
  'Fiend Patron': {
    features: [
      { level: 3, name: 'Fiend Spells', description: 'Learn additional spells: Burning Hands, Command, Scorching Ray, Suggestion. At higher levels: Fireball, Stinking Cloud, Fire Shield, Wall of Fire, Geas, Insect Plague.' },
      { level: 3, name: 'Dark One\'s Blessing', description: 'When you reduce a hostile creature to 0 HP, you gain temporary HP equal to CHA mod + Warlock level (minimum 1).' },
      { level: 6, name: 'Dark One\'s Own Luck', description: 'When you make an ability check or saving throw, you can add a d10 to the roll (after seeing the roll, before knowing the outcome). Once per Short/Long Rest.' },
      { level: 10, name: 'Fiendish Resilience', description: 'When you finish a Short or Long Rest, choose a damage type (not Force or Radiant). You have Resistance to that type until you choose a different one.' },
      { level: 14, name: 'Hurl Through Hell', description: 'When you hit a creature with an attack, you can send it through the lower planes. It disappears and takes 10d10 Psychic damage at the end of your next turn as it returns. Once per Long Rest.' },
    ],
  },
  'Great Old One Patron': {
    features: [
      { level: 3, name: 'Great Old One Spells', description: 'Learn additional spells: Detect Thoughts, Dissonant Whispers, Phantasmal Force, Tasha\'s Hideous Laughter. At higher levels: Clairvoyance, Hunger of Hadar, Evard\'s Black Tentacles, Summon Aberration, Modify Memory, Telekinesis.' },
      { level: 3, name: 'Awakened Mind', description: 'You can telepathically speak to any creature you can see within 30 ft. The creature understands you only if you share a language. You can speak this way to one creature at a time.' },
      { level: 3, name: 'Psychic Spells', description: 'When you cast a Warlock spell that deals damage, you can change the damage type to Psychic.' },
      { level: 6, name: 'Clairvoyant Combatant', description: 'When you cast Detect Thoughts, you can use your Bonus Action on subsequent turns to target a new creature (no action required). When you target a creature with Detect Thoughts, it has Disadvantage on attack rolls against you and you have Advantage on attacks against it.' },
      { level: 10, name: 'Eldritch Hex', description: 'When you cast Hex, its range is 90 ft, and you can cast it without Concentration (one at a time). When you roll damage for Hex, you can replace the damage type with Psychic.' },
      { level: 10, name: 'Thought Shield', description: 'Your thoughts can\'t be read unless you allow it. You have Resistance to Psychic damage, and when a creature deals Psychic damage to you, that creature takes the same amount of damage.' },
      { level: 14, name: 'Create Thrall', description: 'When you deal Psychic damage to an Incapacitated creature, you can Charm it (INT save negates). It remains Charmed until you use this feature on another creature. You can communicate with it telepathically at any distance.' },
    ],
  },

  // WIZARD
  'Abjurer': {
    features: [
      { level: 3, name: 'Abjuration Savant', description: 'Abjuration spells cost half gold and time to copy into your spellbook.' },
      { level: 3, name: 'Arcane Ward', description: 'When you cast an Abjuration spell of 1st level or higher, you create or restore a protective ward. It has HP equal to twice your Wizard level + INT mod. When you take damage, the ward takes the damage instead. When reduced to 0, you take remaining damage.' },
      { level: 6, name: 'Projected Ward', description: 'Reaction when a creature within 30 ft takes damage: your ward takes the damage instead.' },
      { level: 10, name: 'Spell Breaker', description: 'When you restore HP with Abjuration spells, you can also end one spell of your choice on that creature.' },
      { level: 14, name: 'Spell Resistance', description: 'You have Advantage on saving throws against spells. You have Resistance to the damage of spells.' },
    ],
  },
  'Diviner': {
    features: [
      { level: 3, name: 'Divination Savant', description: 'Divination spells cost half gold and time to copy into your spellbook.' },
      { level: 3, name: 'Portent', description: 'When you finish a Long Rest, roll 2d20 and record the numbers. You can replace any attack roll, saving throw, or ability check made by you or a creature you can see with one of these rolls. You must choose to do so before the roll.' },
      { level: 6, name: 'Expert Divination', description: 'When you cast a Divination spell of 2nd level or higher using a spell slot, you regain one expended slot of a level lower than the spell cast (max 5th level).' },
      { level: 10, name: 'The Third Eye', description: 'Action: gain one benefit until you use this feature again or take a Short/Long Rest: Darkvision 120 ft, Ethereal Sight 60 ft, read any language, or see Invisible creatures within 10 ft.' },
      { level: 14, name: 'Greater Portent', description: 'You roll 3d20 for your Portent feature instead of 2d20.' },
    ],
  },
  'Evoker': {
    features: [
      { level: 3, name: 'Evocation Savant', description: 'Evocation spells cost half gold and time to copy into your spellbook.' },
      { level: 3, name: 'Sculpt Spells', description: 'When you cast an Evocation spell that affects other creatures, choose a number of them equal to 1 + spell level. Those creatures automatically succeed on saves against the spell and take no damage if they normally take half on a successful save.' },
      { level: 6, name: 'Potent Cantrip', description: 'When a creature succeeds on a saving throw against your cantrip, it takes half the cantrip\'s damage (if any) but suffers no additional effect.' },
      { level: 10, name: 'Empowered Evocation', description: 'Add your INT mod to one damage roll of any Wizard Evocation spell you cast.' },
      { level: 14, name: 'Overchannel', description: 'When you cast a Wizard spell of 1st-5th level that deals damage, deal max damage. If you use this again before a Long Rest, take 2d12 Necrotic per spell level (increases each time). This damage ignores Resistance and Immunity.' },
    ],
  },
  'Illusionist': {
    features: [
      { level: 3, name: 'Illusion Savant', description: 'Illusion spells cost half gold and time to copy into your spellbook.' },
      { level: 3, name: 'Improved Minor Illusion', description: 'You know Minor Illusion (doesn\'t count against cantrips known). When you cast it, you can create both a sound and an image.' },
      { level: 6, name: 'Malleable Illusions', description: 'When you cast an Illusion spell with a duration of 1 minute or longer, you can use an action to change the nature of that illusion (using the spell\'s normal parameters).' },
      { level: 10, name: 'Illusory Self', description: 'Reaction when a creature makes an attack roll against you: interpose an illusion to cause the attack to miss. Once per Short/Long Rest.' },
      { level: 14, name: 'Illusory Reality', description: 'Bonus Action: choose one inanimate, nonmagical object that is part of an Illusion spell you cast. Make that object real for 1 minute. It can\'t deal damage or directly harm anyone.' },
    ],
  },
};

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
    return character.classes.map(c => {
      const base = `${c.name} ${c.level}`;
      return c.subclass ? `${c.subclass} ${base}` : base;
    }).join(' / ');
  }
  if (character?.class) {
    const base = `${character.class} ${character.level || 1}`;
    return character.subclass ? `${character.subclass} ${base}` : base;
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

// Calculate AC from equipped items
export const calculateAC = (character) => {
  const dexMod = getMod(character.dex);
  const inventory = character.inventory || [];
  
  // Find equipped armor and shields
  const equippedArmor = inventory.find(i => i.itemType === 'armor' && i.equipped && i.armorType !== 'Shield');
  const equippedShield = inventory.find(i => i.itemType === 'armor' && i.equipped && i.armorType === 'Shield');
  
  // Find items that grant AC bonuses (rings, cloaks, etc.)
  const acBonusItems = inventory.filter(i => i.equipped && i.acBonus && i.itemType !== 'armor');
  
  let baseAC = 10;
  let dexBonus = dexMod;
  let shieldBonus = 0;
  let itemBonuses = 0;
  let tempBonus = parseInt(character.tempAC) || 0;
  let breakdown = [];
  let stealthDisadv = false;
  let strWarning = null;
  
  // Check for temp AC effects that replace base calculation
  if (character.acEffect === 'mageArmor') {
    baseAC = 13;
    dexBonus = dexMod;
    breakdown.push(`Mage Armor: 13`);
    breakdown.push(`DEX: ${dexMod >= 0 ? '+' : ''}${dexMod}`);
  } else if (character.acEffect === 'barkskin') {
    // Barkskin sets AC to minimum 16
    const naturalCalc = 10 + dexMod;
    if (naturalCalc >= 16) {
      baseAC = 10;
      dexBonus = dexMod;
      breakdown.push(`Base: 10`);
      breakdown.push(`DEX: ${dexMod >= 0 ? '+' : ''}${dexMod}`);
    } else {
      baseAC = 16;
      dexBonus = 0;
      breakdown.push(`Barkskin: 16 (minimum)`);
    }
  } else if (character.acEffect === 'unarmoredDefense') {
    // Barbarian/Monk unarmored defense
    const conMod = getMod(character.con);
    const wisMod = getMod(character.wis);
    // Check if character has Barbarian or Monk
    const classes = character.classes?.map(c => c.name.toLowerCase()) || [character.class?.toLowerCase()];
    if (classes.includes('barbarian')) {
      baseAC = 10;
      dexBonus = dexMod;
      breakdown.push(`Unarmored: 10`);
      breakdown.push(`DEX: ${dexMod >= 0 ? '+' : ''}${dexMod}`);
      breakdown.push(`CON: ${conMod >= 0 ? '+' : ''}${conMod}`);
      baseAC += conMod;
    } else if (classes.includes('monk')) {
      baseAC = 10;
      dexBonus = dexMod;
      breakdown.push(`Unarmored: 10`);
      breakdown.push(`DEX: ${dexMod >= 0 ? '+' : ''}${dexMod}`);
      breakdown.push(`WIS: ${wisMod >= 0 ? '+' : ''}${wisMod}`);
      baseAC += wisMod;
    } else {
      baseAC = 10;
      dexBonus = dexMod;
      breakdown.push(`Base: 10`);
      breakdown.push(`DEX: ${dexMod >= 0 ? '+' : ''}${dexMod}`);
    }
  } else if (equippedArmor) {
    // Standard armor calculation
    const armorAC = parseInt(equippedArmor.baseAC) || 10;
    baseAC = armorAC;
    
    if (equippedArmor.armorType === 'Light') {
      dexBonus = dexMod;
      breakdown.push(`${equippedArmor.name}: ${armorAC}`);
      breakdown.push(`DEX: ${dexMod >= 0 ? '+' : ''}${dexMod}`);
    } else if (equippedArmor.armorType === 'Medium') {
      dexBonus = Math.min(2, dexMod);
      breakdown.push(`${equippedArmor.name}: ${armorAC}`);
      breakdown.push(`DEX: ${dexBonus >= 0 ? '+' : ''}${dexBonus} (max 2)`);
    } else if (equippedArmor.armorType === 'Heavy') {
      dexBonus = 0;
      breakdown.push(`${equippedArmor.name}: ${armorAC}`);
      // Check STR requirement
      const strReq = parseInt(equippedArmor.strRequired) || 0;
      if (strReq > 0 && (character.str || 10) < strReq) {
        strWarning = `STR ${strReq} required (speed -10 ft)`;
      }
    }
    
    if (equippedArmor.stealthDisadv) {
      stealthDisadv = true;
    }
  } else {
    // No armor - base 10 + DEX
    breakdown.push(`Base: 10`);
    breakdown.push(`DEX: ${dexMod >= 0 ? '+' : ''}${dexMod}`);
  }
  
  // Add shield
  if (equippedShield) {
    const shieldAC = parseInt(equippedShield.baseAC) || 2;
    shieldBonus = shieldAC;
    breakdown.push(`${equippedShield.name}: +${shieldAC}`);
  }
  
  // Add item bonuses (rings, cloaks, etc.)
  acBonusItems.forEach(item => {
    const bonus = parseInt(item.acBonus) || 0;
    if (bonus !== 0) {
      itemBonuses += bonus;
      breakdown.push(`${item.name}: ${bonus >= 0 ? '+' : ''}${bonus}`);
    }
  });
  
  // Add temp bonus
  if (tempBonus !== 0) {
    breakdown.push(`Temp: ${tempBonus >= 0 ? '+' : ''}${tempBonus}`);
  }
  
  const totalAC = baseAC + dexBonus + shieldBonus + itemBonuses + tempBonus;
  
  return {
    total: totalAC,
    breakdown,
    stealthDisadv,
    strWarning,
    hasEquippedArmor: !!equippedArmor || !!equippedShield,
    effect: character.acEffect
  };
};

// Common temporary AC effects
export const AC_EFFECTS = [
  { id: '', name: 'None', desc: 'Normal AC calculation' },
  { id: 'mageArmor', name: 'Mage Armor', desc: 'Base AC becomes 13 + DEX' },
  { id: 'barkskin', name: 'Barkskin', desc: 'AC cannot be less than 16' },
  { id: 'unarmoredDefense', name: 'Unarmored Defense', desc: 'Barbarian: 10+DEX+CON, Monk: 10+DEX+WIS' },
  { id: 'shield', name: 'Shield (spell)', desc: '+5 AC until start of next turn' },
];