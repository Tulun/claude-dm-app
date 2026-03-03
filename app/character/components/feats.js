// PHB 2024 Feats - Updated with Ability Score Increases
// Categories: Origin, General, Fighting Style, Epic Boon

export const FEATS = [
  // Origin Feats (Level 1, no prerequisites)
  { name: 'Alert', category: 'Origin', description: 'You gain a +8 bonus to Initiative. You can\'t be Surprised while Conscious. You can swap Initiative with a willing ally.', abilityBoost: { options: ['dex', 'int', 'wis'], amount: 1 } },
  { name: 'Crafter', category: 'Origin', description: 'You gain Tool proficiency with three Artisan\'s Tools. Crafting costs 20% less and takes less time. You can cast Identify without a spell slot once per Long Rest.', abilityBoost: { options: ['str', 'dex', 'con', 'int', 'wis', 'cha'], amount: 1 } },
  { name: 'Healer', category: 'Origin', description: 'Reroll any 1 on dice for healing spells. With a Healer\'s Kit as an action, restore 2d4 + your Proficiency Bonus HP to a creature (once per Short/Long Rest per creature).', abilityBoost: { options: ['wis'], amount: 1 } },
  { name: 'Lucky', category: 'Origin', description: 'You have Luck Points equal to your Proficiency Bonus, regained on Long Rest. Spend 1 to give yourself Advantage on a d20 Test, or impose Disadvantage on an attack roll against you.', abilityBoost: { options: ['str', 'dex', 'con', 'int', 'wis', 'cha'], amount: 1 } },
  { name: 'Magic Initiate (Cleric)', category: 'Origin', description: 'Learn 2 Cleric cantrips and 1 level 1 Cleric spell. Cast the spell once per Long Rest without a slot, or using spell slots. WIS is your spellcasting ability.', abilityBoost: { options: ['wis'], amount: 1 } },
  { name: 'Magic Initiate (Druid)', category: 'Origin', description: 'Learn 2 Druid cantrips and 1 level 1 Druid spell. Cast the spell once per Long Rest without a slot, or using spell slots. WIS is your spellcasting ability.', abilityBoost: { options: ['wis'], amount: 1 } },
  { name: 'Magic Initiate (Wizard)', category: 'Origin', description: 'Learn 2 Wizard cantrips and 1 level 1 Wizard spell. Cast the spell once per Long Rest without a slot, or using spell slots. INT is your spellcasting ability.', abilityBoost: { options: ['int'], amount: 1 } },
  { name: 'Musician', category: 'Origin', description: 'Gain proficiency with 3 Musical Instruments. After finishing a Short or Long Rest, you can play a song that gives a number of allies equal to your Proficiency Bonus Heroic Inspiration.', abilityBoost: { options: ['cha'], amount: 1 } },
  { name: 'Savage Attacker', category: 'Origin', description: 'Once per turn when you hit with a weapon, you can roll the damage dice twice and use either roll.', abilityBoost: { options: ['str', 'dex', 'con'], amount: 1 } },
  { name: 'Skilled', category: 'Origin', repeatable: true, description: 'Gain proficiency in any combination of 3 skills or tools of your choice.', abilityBoost: { options: ['str', 'dex', 'con', 'int', 'wis', 'cha'], amount: 1 } },
  { name: 'Tavern Brawler', category: 'Origin', description: 'Your Unarmed Strike deals 1d4 damage. You can use furniture as 1d4 Improvised Weapons. Reroll 1s on damage. Once per turn when you hit, you can push the target 5 feet.', abilityBoost: { options: ['str', 'con'], amount: 1 } },
  { name: 'Tough', category: 'Origin', description: 'Your Hit Point Maximum increases by an amount equal to twice your character level. Whenever you gain a level thereafter, your HP max increases by 2 additional HP.', abilityBoost: { options: ['con'], amount: 1 } },

  // General Feats (Level 4+)
  { name: 'Ability Score Improvement', category: 'General', level: 4, repeatable: true, description: 'Increase one ability score by 2, or two ability scores by 1 each. Can\'t increase above 20.', abilityBoost: { special: 'asi' } },
  { name: 'Actor', category: 'General', level: 4, description: 'Advantage on Deception and Performance to impersonate. Mimic speech/sounds after hearing for 1 minute.', abilityBoost: { options: ['cha'], amount: 1 } },
  { name: 'Athlete', category: 'General', level: 4, description: 'Speed isn\'t halved when Climbing. Running jump with only 5 feet of movement. Stand from Prone using only 5 feet.', abilityBoost: { options: ['str', 'dex'], amount: 1 } },
  { name: 'Charger', category: 'General', level: 4, prerequisite: 'STR or DEX 13+', description: 'When you Dash, you can make one melee attack or Shove as Bonus Action. If you moved 10+ feet straight, deal +1d8 damage or push 10 feet.', abilityBoost: { options: ['str', 'dex'], amount: 1 } },
  { name: 'Chef', category: 'General', level: 4, description: 'Cook\'s Utensils proficiency. Treats during Short Rest give temp HP = Proficiency Bonus. Long Rest meal grants +1d8 HP when spending Hit Dice.', abilityBoost: { options: ['con', 'wis'], amount: 1 } },
  { name: 'Crossbow Expert', category: 'General', level: 4, prerequisite: 'DEX 13+', description: 'Ignore Loading. No Disadvantage within 5 feet. Bonus Action hand crossbow attack after one-handed weapon attack.', abilityBoost: { options: ['dex'], amount: 1 } },
  { name: 'Crusher', category: 'General', level: 4, description: 'Push 5 ft with Bludgeoning 1/turn. Crit gives Advantage to all attacks vs target until your next turn.', abilityBoost: { options: ['str', 'con'], amount: 1 } },
  { name: 'Defensive Duelist', category: 'General', level: 4, prerequisite: 'DEX 13+', description: 'Reaction with Finesse weapon: Add Proficiency Bonus to AC against one melee attack.', abilityBoost: { options: ['dex'], amount: 1 } },
  { name: 'Dual Wielder', category: 'General', level: 4, prerequisite: 'STR or DEX 13+', description: '+1 AC with weapon in each hand. Draw/stow two weapons at once. Two-Weapon Fighting with non-Light weapons.', abilityBoost: { options: ['str', 'dex'], amount: 1 } },
  { name: 'Durable', category: 'General', level: 4, description: 'Advantage vs Dehydrated/Starving. Extra HP when rolling Hit Die = CON mod (min 1).', abilityBoost: { options: ['con'], amount: 1 } },
  { name: 'Elemental Adept', category: 'General', level: 4, prerequisite: 'Spellcasting feature', repeatable: true, description: 'Choose: Acid/Cold/Fire/Lightning/Thunder. Spells ignore Resistance. Treat 1s as 2s on damage.', abilityBoost: { options: ['int', 'wis', 'cha'], amount: 1 } },
  { name: 'Fey Touched', category: 'General', level: 4, description: 'Learn Misty Step + one 1st-level Divination/Enchantment spell. Cast each 1/Long Rest free or with slots.', abilityBoost: { options: ['int', 'wis', 'cha'], amount: 1 } },
  { name: 'Grappler', category: 'General', level: 4, prerequisite: 'STR or DEX 13+', description: 'Advantage on attacks vs Grappled creatures. Move Grappled creatures at full speed.', abilityBoost: { options: ['str', 'dex'], amount: 1 } },
  { name: 'Great Weapon Master', category: 'General', level: 4, prerequisite: 'STR 13+', description: 'Graze: Deal STR mod damage on miss with Heavy weapon. Bonus Action attack after crit or reducing creature to 0 HP.', abilityBoost: { options: ['str'], amount: 1 } },
  { name: 'Heavily Armored', category: 'General', level: 4, prerequisite: 'Medium Armor proficiency', description: 'Gain Heavy Armor proficiency.', abilityBoost: { options: ['str', 'con'], amount: 1 } },
  { name: 'Heavy Armor Master', category: 'General', level: 4, prerequisite: 'Heavy Armor proficiency', description: 'Reduce nonmagical B/P/S damage by Proficiency Bonus in Heavy Armor.', abilityBoost: { options: ['str', 'con'], amount: 1 } },
  { name: 'Inspiring Leader', category: 'General', level: 4, prerequisite: 'WIS or CHA 13+', description: 'After rest, 10-minute speech grants up to 6 creatures temp HP = level + WIS or CHA mod.', abilityBoost: { options: ['wis', 'cha'], amount: 1 } },
  { name: 'Keen Mind', category: 'General', level: 4, description: 'Advantage on Investigation vs illusions and vs being charmed. Resistance to Psychic damage.', abilityBoost: { options: ['int'], amount: 1 } },
  { name: 'Lightly Armored', category: 'General', level: 4, description: 'Gain Light Armor and Shield proficiency.', abilityBoost: { options: ['str', 'dex'], amount: 1 } },
  { name: 'Mage Slayer', category: 'General', level: 4, description: 'Reaction attack when creature within 5ft casts. Concentration saves have Disadvantage when you damage. Advantage on saves vs spells from adjacent.', abilityBoost: { options: ['str', 'dex'], amount: 1 } },
  { name: 'Martial Weapon Training', category: 'General', level: 4, description: 'Gain proficiency with Martial Weapons.', abilityBoost: { options: ['str', 'dex'], amount: 1 } },
  { name: 'Medium Armor Master', category: 'General', level: 4, prerequisite: 'Medium Armor proficiency', description: 'No Stealth Disadvantage in Medium Armor. +3 AC max from DEX (not +2).', abilityBoost: { options: ['str', 'dex'], amount: 1 } },
  { name: 'Moderately Armored', category: 'General', level: 4, prerequisite: 'Light Armor proficiency', description: 'Gain Medium Armor proficiency.', abilityBoost: { options: ['str', 'dex'], amount: 1 } },
  { name: 'Mounted Combatant', category: 'General', level: 4, description: 'Advantage on melee vs unmounted smaller creatures. Force attacks to target you instead of mount. Mount takes no damage on DEX save success.', abilityBoost: { options: ['str', 'dex', 'wis'], amount: 1 } },
  { name: 'Observant', category: 'General', level: 4, description: 'Lip-read. +5 Passive Perception and Investigation. Search as Bonus Action.', abilityBoost: { options: ['int', 'wis'], amount: 1 } },
  { name: 'Piercer', category: 'General', level: 4, description: 'Reroll one Piercing damage die 1/turn. Crit deals extra damage die.', abilityBoost: { options: ['str', 'dex'], amount: 1 } },
  { name: 'Poisoner', category: 'General', level: 4, description: 'Ignore Poison resistance. Apply poison as Bonus Action. Poisoner\'s Kit proficiency. Craft potent poisons.', abilityBoost: { options: ['dex', 'int'], amount: 1 } },
  { name: 'Polearm Master', category: 'General', level: 4, prerequisite: 'STR or DEX 13+', description: 'Bonus action 1d4 attack with opposite end. Opportunity attack when creatures enter reach.', abilityBoost: { options: ['str', 'dex'], amount: 1 } },
  { name: 'Resilient', category: 'General', level: 4, description: 'Choose one ability. Gain proficiency in saving throws using that ability.', abilityBoost: { options: ['str', 'dex', 'con', 'int', 'wis', 'cha'], amount: 1 } },
  { name: 'Ritual Caster', category: 'General', level: 4, prerequisite: 'INT, WIS, or CHA 13+', description: 'Learn two 1st-level Ritual spells. Cast as Rituals. Can learn more.', abilityBoost: { options: ['int', 'wis', 'cha'], amount: 1 } },
  { name: 'Sentinel', category: 'General', level: 4, prerequisite: 'STR or DEX 13+', description: 'Opportunity Attacks reduce Speed to 0. Disengage doesn\'t prevent OA. Reaction attack when adjacent ally is attacked.', abilityBoost: { options: ['str', 'dex'], amount: 1 } },
  { name: 'Shadow Touched', category: 'General', level: 4, description: 'Learn Invisibility + one 1st-level Illusion/Necromancy spell. Cast each 1/Long Rest free or with slots.', abilityBoost: { options: ['int', 'wis', 'cha'], amount: 1 } },
  { name: 'Sharpshooter', category: 'General', level: 4, prerequisite: 'DEX 13+', description: 'Ignore half/three-quarters cover. No long range Disadvantage. -5 attack for +10 damage.', abilityBoost: { options: ['dex'], amount: 1 } },
  { name: 'Shield Master', category: 'General', level: 4, prerequisite: 'Shield proficiency', description: 'Bonus Action Shove with Shield. Add Shield AC to DEX saves vs single target. Reaction Evasion with Shield.', abilityBoost: { options: ['str'], amount: 1 } },
  { name: 'Skill Expert', category: 'General', level: 4, description: 'Gain one skill proficiency. Gain Expertise in one skill you\'re proficient in.', abilityBoost: { options: ['str', 'dex', 'con', 'int', 'wis', 'cha'], amount: 1 } },
  { name: 'Skulker', category: 'General', level: 4, prerequisite: 'DEX 13+', description: 'Hide when Lightly Obscured. No Disadvantage from Dim Light. Missed ranged attacks don\'t reveal position.', abilityBoost: { options: ['dex'], amount: 1 } },
  { name: 'Slasher', category: 'General', level: 4, description: 'Reduce Speed by 10ft with Slashing 1/turn. Crit gives Disadvantage on all attacks until target\'s next turn.', abilityBoost: { options: ['str', 'dex'], amount: 1 } },
  { name: 'Speedy', category: 'General', level: 4, description: '+10 ft Speed. Difficult Terrain doesn\'t slow Dash. Opportunity Attacks have Disadvantage.', abilityBoost: { options: ['dex', 'con'], amount: 1 } },
  { name: 'Spell Sniper', category: 'General', level: 4, prerequisite: 'Spellcasting feature', description: 'Learn cantrip with attack roll. Ignore half/three-quarters cover. Double spell attack range.', abilityBoost: { options: ['int', 'wis', 'cha'], amount: 1 } },
  { name: 'Telekinetic', category: 'General', level: 4, description: 'Learn Mage Hand (invisible). Bonus Action: Shove creature within 30ft (STR save).', abilityBoost: { options: ['int', 'wis', 'cha'], amount: 1 } },
  { name: 'Telepathic', category: 'General', level: 4, description: 'Telepathy 60ft. Cast Detect Thoughts 1/Long Rest free or with slots.', abilityBoost: { options: ['int', 'wis', 'cha'], amount: 1 } },
  { name: 'War Caster', category: 'General', level: 4, prerequisite: 'Spellcasting feature', description: 'Advantage on Concentration saves. Somatic with hands full. Cast spell as Opportunity Attack.', abilityBoost: { options: ['int', 'wis', 'cha'], amount: 1 } },
  { name: 'Weapon Master', category: 'General', level: 4, description: 'Gain Mastery property use for two weapon types you\'re proficient with.', abilityBoost: { options: ['str', 'dex'], amount: 1 } },

  // Fighting Styles
  { name: 'Archery', category: 'Fighting Style', description: '+2 bonus to attack rolls with Ranged Weapons.' },
  { name: 'Blind Fighting', category: 'Fighting Style', description: 'Blindsight 10 ft. Can see invisible creatures within range.' },
  { name: 'Defense', category: 'Fighting Style', description: '+1 to AC while wearing armor.' },
  { name: 'Dueling', category: 'Fighting Style', description: '+2 to damage when wielding a melee weapon in one hand and no other weapons.' },
  { name: 'Great Weapon Fighting', category: 'Fighting Style', description: 'Reroll 1s and 2s on damage dice with Two-Handed or Versatile weapons.' },
  { name: 'Interception', category: 'Fighting Style', description: 'Reaction: Reduce damage to adjacent creature by 1d10 + PB when wielding Shield or weapon.' },
  { name: 'Protection', category: 'Fighting Style', description: 'Reaction: Impose Disadvantage on attack against adjacent creature when wielding Shield.' },
  { name: 'Thrown Weapon Fighting', category: 'Fighting Style', description: '+2 damage with Thrown weapons. Draw as part of attack.' },
  { name: 'Two-Weapon Fighting', category: 'Fighting Style', description: 'Add ability modifier to off-hand weapon damage.' },
  { name: 'Unarmed Fighting', category: 'Fighting Style', description: 'Unarmed 1d6 (1d8 if both hands free). 1d4 at start of turn to Grappled creature.' },

  // Epic Boons (Level 19+)
  { name: 'Boon of Combat Prowess', category: 'Epic Boon', level: 19, description: 'Miss becomes hit 1/turn.', abilityBoost: { options: ['str', 'dex', 'con', 'int', 'wis', 'cha'], amount: 1, max: 30 } },
  { name: 'Boon of Dimensional Travel', category: 'Epic Boon', level: 19, description: 'Misty Step PB times/Long Rest.', abilityBoost: { options: ['dex', 'int', 'wis', 'cha'], amount: 1, max: 30 } },
  { name: 'Boon of Energy Resistance', category: 'Epic Boon', level: 19, description: 'Resistance to two damage types of choice.', abilityBoost: { options: ['str', 'dex', 'con', 'int', 'wis', 'cha'], amount: 1, max: 30 } },
  { name: 'Boon of Fate', category: 'Epic Boon', level: 19, description: 'Add/subtract 2d4 to creature\'s d20 Test PB times/Long Rest.', abilityBoost: { options: ['str', 'dex', 'con', 'int', 'wis', 'cha'], amount: 1, max: 30 } },
  { name: 'Boon of Fortitude', category: 'Epic Boon', level: 19, description: '+40 HP Maximum.', abilityBoost: { options: ['str', 'dex', 'con', 'int', 'wis', 'cha'], amount: 1, max: 30 } },
  { name: 'Boon of Irresistible Offense', category: 'Epic Boon', level: 19, description: 'Bypass Resistance to one damage type.', abilityBoost: { options: ['str', 'dex', 'con', 'int', 'wis', 'cha'], amount: 1, max: 30 } },
  { name: 'Boon of Recovery', category: 'Epic Boon', level: 19, description: 'Bonus Action: Regain half HP 1/Long Rest.', abilityBoost: { options: ['str', 'dex', 'con', 'int', 'wis', 'cha'], amount: 1, max: 30 } },
  { name: 'Boon of Skill', category: 'Epic Boon', level: 19, description: 'Proficiency in all skills.', abilityBoost: { options: ['str', 'dex', 'con', 'int', 'wis', 'cha'], amount: 1, max: 30 } },
  { name: 'Boon of Speed', category: 'Epic Boon', level: 19, description: '+30 ft Speed. OA have Disadvantage.', abilityBoost: { options: ['str', 'dex', 'con', 'int', 'wis', 'cha'], amount: 1, max: 30 } },
  { name: 'Boon of Spell Recall', category: 'Epic Boon', level: 19, description: 'Cast spell without slot 1/Long Rest.', abilityBoost: { options: ['int', 'wis', 'cha'], amount: 1, max: 30 } },
  { name: 'Boon of the Night Spirit', category: 'Epic Boon', level: 19, description: 'Darkvision 120ft. Become Invisible in Dim/Dark.', abilityBoost: { options: ['dex', 'int', 'wis', 'cha'], amount: 1, max: 30 } },
  { name: 'Boon of Truesight', category: 'Epic Boon', level: 19, description: 'Truesight 60ft.', abilityBoost: { options: ['int', 'wis', 'cha'], amount: 1, max: 30 } },
];

export const FEAT_CATEGORIES = ['Origin', 'General', 'Fighting Style', 'Epic Boon'];

export const ABILITY_LABELS = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' };

export function getFeatsByCategory(category) {
  return FEATS.filter(f => f.category === category);
}

export function getFeat(name) {
  return FEATS.find(f => f.name === name);
}

export function getAbilityBoostLabel(stat) {
  return ABILITY_LABELS[stat] || stat.toUpperCase();
}