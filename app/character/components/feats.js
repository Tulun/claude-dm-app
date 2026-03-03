// PHB 2024 Feats and Features
// Categories: Origin, General, Fighting Style, Epic Boon

export const FEATS = [
  // Origin Feats
  { name: 'Alert', category: 'Origin', description: 'You gain a +8 bonus to Initiative. You can\'t be Surprised while Conscious. You can swap Initiative with a willing ally.' },
  { name: 'Crafter', category: 'Origin', description: 'You gain Tool proficiency with three Artisan\'s Tools. Faster and cheaper crafting. Can cast Identify 1/Long Rest.' },
  { name: 'Healer', category: 'Origin', description: 'Reroll 1s on healing dice. With Healer\'s Kit, use an action to restore 2d4 + character\'s level HP (1/rest per creature).' },
  { name: 'Lucky', category: 'Origin', description: 'You have Luck Points equal to your Proficiency Bonus. Spend 1 to gain Advantage on d20 Test or impose Disadvantage on attack against you.' },
  { name: 'Magic Initiate', category: 'Origin', repeatable: true, description: 'Learn 2 cantrips and 1 level 1 spell from a class spell list. Cast the spell 1/Long Rest or with spell slots. Choose spellcasting ability.' },
  { name: 'Musician', category: 'Origin', description: 'Gain proficiency with 3 Musical Instruments. After a Short/Long Rest performance, allies gain Inspiration.' },
  { name: 'Savage Attacker', category: 'Origin', description: 'Once per turn when you deal damage with a weapon, you can reroll the weapon\'s damage dice and use either roll.' },
  { name: 'Skilled', category: 'Origin', repeatable: true, description: 'Gain proficiency in any combination of 3 skills or tools.' },
  { name: 'Tavern Brawler', category: 'Origin', description: 'Enhanced Unarmed Strike (1d4). Furniture as 1d4 Improvised Weapons. Reroll damage 1s. Push 5 ft on hit 1/turn.' },
  { name: 'Tough', category: 'Origin', description: 'Your Hit Point Maximum increases by 2 × your character level. Whenever you gain a level, your HP max increases by 2 more.' },

  // General Feats
  { name: 'Ability Score Improvement', category: 'General', repeatable: true, description: 'Increase one ability score by 2, or two ability scores by 1 each. Can\'t increase above 20.' },
  { name: 'Actor', category: 'General', description: '+1 CHA. Advantage on Deception and Performance to impersonate. Mimic speech/sounds after hearing for 1 minute.' },
  { name: 'Athlete', category: 'General', description: '+1 STR or DEX. Move is not halved when climbing. Running jump with 5ft move (not 10). Stand from Prone with 5ft.' },
  { name: 'Charger', category: 'General', description: 'After Dash, bonus action attack with +1d8 damage, or push 10 ft.' },
  { name: 'Chef', category: 'General', description: '+1 CON or WIS. Cook\'s Utensils proficiency. Treats during Short Rest give temp HP. Special food during Long Rest grants +1d8 to HD healing.' },
  { name: 'Crossbow Expert', category: 'General', description: 'Ignore Loading property. No Disadvantage at close range. Bonus action Hand Crossbow attack after one-handed weapon attack.' },
  { name: 'Crusher', category: 'General', description: '+1 STR or CON. Push 5 ft with Bludgeoning damage 1/turn. Crit gives Advantage to all attacks against target until your next turn.' },
  { name: 'Defensive Duelist', category: 'General', prerequisite: 'DEX 13+', description: 'Reaction: Add Proficiency Bonus to AC against one melee attack when wielding Finesse weapon.' },
  { name: 'Dual Wielder', category: 'General', description: '+1 AC while wielding two weapons. Draw/stow two weapons at once. Use two-weapon fighting with non-Light weapons.' },
  { name: 'Durable', category: 'General', description: '+1 CON. Dehydration/Starvation resistance. Regain additional HD on Long Rest equal to Proficiency Bonus.' },
  { name: 'Elemental Adept', category: 'General', repeatable: true, description: 'Choose a damage type. Spells ignore resistance. Treat 1s as 2s on damage dice.' },
  { name: 'Fey Touched', category: 'General', description: '+1 INT, WIS, or CHA. Learn Misty Step + one 1st-level Divination or Enchantment spell. Cast each 1/Long Rest free or with slots.' },
  { name: 'Grappler', category: 'General', prerequisite: 'STR or DEX 13+', description: '+1 STR or DEX. Advantage on attacks vs creatures you\'re Grappling. Can move Grappled creatures at full speed.' },
  { name: 'Great Weapon Master', category: 'General', prerequisite: 'STR 13+', description: 'Graze: Deal STR mod damage on miss with Heavy weapon. Bonus action attack after crit or dropping creature to 0 HP.' },
  { name: 'Heavily Armored', category: 'General', prerequisite: 'Medium Armor proficiency', description: '+1 STR. Gain Heavy Armor proficiency. Heavy armor doesn\'t impose Disadvantage on Stealth.' },
  { name: 'Heavy Armor Master', category: 'General', prerequisite: 'Heavy Armor proficiency', description: '+1 STR. Reduce nonmagical B/P/S damage by Proficiency Bonus while in Heavy Armor.' },
  { name: 'Inspiring Leader', category: 'General', prerequisite: 'WIS or CHA 13+', description: 'After 10-minute speech, grant up to 6 creatures temp HP equal to your level + WIS or CHA mod. 1/Long Rest per creature.' },
  { name: 'Keen Mind', category: 'General', description: '+1 INT. Advantage on INT (Investigation) to Discern Illusions. Resistance to Psychic damage.' },
  { name: 'Lightly Armored', category: 'General', description: '+1 STR or DEX. Gain Light Armor and Shield proficiency.' },
  { name: 'Mage Slayer', category: 'General', description: 'Reaction attack when creature casts within 5ft. Damage causes Concentration save Disadvantage. Advantage on saves vs spells from adjacent creatures.' },
  { name: 'Martial Weapon Training', category: 'General', description: '+1 STR or DEX. Gain proficiency with Martial Weapons.' },
  { name: 'Medium Armor Master', category: 'General', prerequisite: 'Medium Armor proficiency', description: '+1 STR or DEX. Medium Armor doesn\'t impose Stealth Disadvantage. +3 AC max from DEX (not +2).' },
  { name: 'Moderately Armored', category: 'General', prerequisite: 'Light Armor proficiency', description: '+1 STR or DEX. Gain Medium Armor proficiency.' },
  { name: 'Mounted Combatant', category: 'General', description: 'Advantage on melee attacks vs unmounted creatures smaller than mount. Force attacks to target you instead of mount. Mount takes no damage on DEX save success.' },
  { name: 'Observant', category: 'General', description: '+1 INT or WIS. Can lip-read. +5 to Passive Perception and Investigation. Can Search as Bonus Action.' },
  { name: 'Piercer', category: 'General', description: '+1 STR or DEX. Reroll one Piercing damage die 1/turn. Crit deals extra damage die.' },
  { name: 'Poisoner', category: 'General', description: 'Ignore Poison resistance. Apply poison as Bonus Action. Poisoner\'s Kit proficiency. Craft potent poisons during Long Rest.' },
  { name: 'Polearm Master', category: 'General', description: 'Bonus action 1d4 attack with opposite end. Opportunity attack when creature enters reach.' },
  { name: 'Resilient', category: 'General', description: '+1 to chosen ability. Gain proficiency in that ability\'s saving throws.' },
  { name: 'Ritual Caster', category: 'General', prerequisite: 'INT, WIS, or CHA 13+', description: 'Learn two 1st-level Ritual spells. Cast as Rituals. Can learn more Rituals.' },
  { name: 'Sentinel', category: 'General', description: 'Opportunity Attacks ignore Disengage. Speed becomes 0 on Opportunity Attack hit. Reaction attack when adjacent ally is attacked.' },
  { name: 'Shadow Touched', category: 'General', description: '+1 INT, WIS, or CHA. Learn Invisibility + one 1st-level Illusion or Necromancy spell. Cast each 1/Long Rest free or with slots.' },
  { name: 'Sharpshooter', category: 'General', description: 'Ignore cover (not full). No Disadvantage at long range. Can take -5 to attack for +10 damage.' },
  { name: 'Shield Master', category: 'General', prerequisite: 'Shield proficiency', description: 'Bonus Action Shove with Shield. Add Shield AC bonus to DEX saves vs single target effects. Reaction for Evasion with Shield.' },
  { name: 'Skill Expert', category: 'General', description: '+1 to any ability. Gain one skill proficiency. Double proficiency bonus for one skill you\'re proficient in.' },
  { name: 'Skulker', category: 'General', description: '+1 DEX. Can hide when Lightly Obscured. Dim Light doesn\'t impose Disadvantage on Perception.' },
  { name: 'Slasher', category: 'General', description: '+1 STR or DEX. Reduce speed by 10ft with Slashing damage 1/turn. Crit causes Disadvantage on all attacks until target\'s next turn.' },
  { name: 'Speedy', category: 'General', description: '+10 ft Speed. Opportunity attacks have Disadvantage against you. Dash doesn\'t provoke Opportunity Attacks.' },
  { name: 'Spell Sniper', category: 'General', prerequisite: 'Spellcasting feature', description: 'Learn a cantrip with Attack roll. Attack roll spells ignore half/three-quarters cover. Double range of attack roll spells.' },
  { name: 'Telekinetic', category: 'General', description: '+1 INT, WIS, or CHA. Learn Mage Hand (invisible). Bonus Action: Shove creature within 30ft (STR save).' },
  { name: 'Telepathic', category: 'General', description: '+1 INT, WIS, or CHA. Telepathy 60ft. Cast Detect Thoughts 1/Long Rest free or with slots.' },
  { name: 'War Caster', category: 'General', prerequisite: 'Spellcasting feature', description: 'Advantage on Concentration saves. Perform Somatic components with hands full. Cast spell as Opportunity Attack.' },
  { name: 'Weapon Master', category: 'General', description: '+1 STR or DEX. Gain Mastery property use for two weapon types you\'re proficient with.' },

  // Fighting Styles
  { name: 'Archery', category: 'Fighting Style', description: '+2 bonus to attack rolls with Ranged Weapons.' },
  { name: 'Blind Fighting', category: 'Fighting Style', description: 'Blindsight 10 ft. Can see invisible creatures within range.' },
  { name: 'Defense', category: 'Fighting Style', description: '+1 to AC while wearing armor.' },
  { name: 'Dueling', category: 'Fighting Style', description: '+2 to damage when wielding a melee weapon in one hand and no other weapons.' },
  { name: 'Great Weapon Fighting', category: 'Fighting Style', description: 'Reroll 1s and 2s on damage dice with Two-Handed or Versatile weapons.' },
  { name: 'Interception', category: 'Fighting Style', description: 'Reaction: Reduce damage to adjacent creature by 1d10 + PB when wielding Shield or weapon.' },
  { name: 'Protection', category: 'Fighting Style', description: 'Reaction: Impose Disadvantage on attack against adjacent creature when wielding Shield.' },
  { name: 'Thrown Weapon Fighting', category: 'Fighting Style', description: '+2 damage with Thrown weapons. Draw Thrown weapon as part of the attack.' },
  { name: 'Two-Weapon Fighting', category: 'Fighting Style', description: 'Add ability modifier to off-hand weapon damage.' },
  { name: 'Unarmed Fighting', category: 'Fighting Style', description: 'Unarmed Strikes deal 1d6 (or 1d8 with both hands free). Deal 1d4 at start of turn to Grappled creature.' },

  // Epic Boons (Level 19+)
  { name: 'Boon of Combat Prowess', category: 'Epic Boon', description: 'Miss becomes a hit 1/turn. +1 to any ability (max 30).' },
  { name: 'Boon of Dimensional Travel', category: 'Epic Boon', description: 'Misty Step PB times/Long Rest. +1 to any ability (max 30).' },
  { name: 'Boon of Energy Resistance', category: 'Epic Boon', description: 'Resistance to two of: Acid, Cold, Fire, Lightning, Necrotic, Radiant, Thunder. +1 to any ability (max 30).' },
  { name: 'Boon of Fate', category: 'Epic Boon', description: 'Add/subtract 2d4 to creature\'s d20 Test PB times/Long Rest. +1 to any ability (max 30).' },
  { name: 'Boon of Fortitude', category: 'Epic Boon', description: '+40 HP Max. +1 to any ability (max 30).' },
  { name: 'Boon of Irresistible Offense', category: 'Epic Boon', description: 'Bypass resistance with one damage type. +1 to any ability (max 30).' },
  { name: 'Boon of Recovery', category: 'Epic Boon', description: 'Bonus Action: Regain half HP 1/Long Rest. +1 to any ability (max 30).' },
  { name: 'Boon of Skill', category: 'Epic Boon', description: 'Proficiency in all skills. +1 to any ability (max 30).' },
  { name: 'Boon of Speed', category: 'Epic Boon', description: '+30 ft Speed. Opportunity Attacks have Disadvantage. +1 to any ability (max 30).' },
  { name: 'Boon of Spell Recall', category: 'Epic Boon', description: 'Cast a spell without expending slot 1/Long Rest. +1 to any ability (max 30).' },
  { name: 'Boon of the Night Spirit', category: 'Epic Boon', description: 'Darkvision 120ft. Merge with shadows as Magic action (Invisible in Dim/Dark). +1 to any ability (max 30).' },
  { name: 'Boon of Truesight', category: 'Epic Boon', description: 'Truesight 60ft. +1 to any ability (max 30).' },
];

export const FEAT_CATEGORIES = ['Origin', 'General', 'Fighting Style', 'Epic Boon'];

export function getFeatsByCategory(category) {
  return FEATS.filter(f => f.category === category);
}

export function getFeat(name) {
  return FEATS.find(f => f.name === name);
}