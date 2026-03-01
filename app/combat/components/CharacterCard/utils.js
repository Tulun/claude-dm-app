// Helper functions for CharacterCard

export const getMod = (score) => {
  const num = parseInt(score) || 10;
  const mod = Math.floor((num - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

export const getModNum = (score) => {
  const num = parseInt(score) || 10;
  return Math.floor((num - 10) / 2);
};

export const getProfBonus = (character) => {
  if (character.level) {
    const lvl = parseInt(character.level) || 1;
    return Math.floor((lvl - 1) / 4) + 2;
  }
  if (character.cr) {
    const cr = character.cr;
    if (cr === '0' || cr === '1/8' || cr === '1/4' || cr === '1/2') return 2;
    const crNum = parseInt(cr) || 1;
    if (crNum <= 4) return 2;
    if (crNum <= 8) return 3;
    if (crNum <= 12) return 4;
    if (crNum <= 16) return 5;
    if (crNum <= 20) return 6;
    if (crNum <= 24) return 7;
    if (crNum <= 28) return 8;
    return 9;
  }
  return 2;
};

export const getSpellSaveDC = (character) => {
  if (!character.spellStat) return null;
  const statMap = { str: character.str, dex: character.dex, con: character.con, int: character.int, wis: character.wis, cha: character.cha };
  const mod = getModNum(statMap[character.spellStat]);
  let dc = 8 + getProfBonus(character) + mod;
  // Add +1 for Innate Sorcery if active (Sorcerer feature)
  if (character.innateSorcery) dc += 1;
  return dc;
};

export const getSpellAttackBonus = (character) => {
  if (!character.spellStat) return null;
  const statMap = { str: character.str, dex: character.dex, con: character.con, int: character.int, wis: character.wis, cha: character.cha };
  const mod = getModNum(statMap[character.spellStat]);
  const bonus = getProfBonus(character) + mod;
  return bonus >= 0 ? `+${bonus}` : `${bonus}`;
};

export const getCalculatedAC = (character) => {
  const dexMod = getModNum(character.dex);
  const inventory = character.inventory || [];
  
  if (inventory.length === 0 && !character.acEffect) return null;
  
  const equippedArmor = inventory.find(i => i.itemType === 'armor' && i.equipped && i.armorType !== 'Shield');
  const equippedShield = inventory.find(i => i.itemType === 'armor' && i.equipped && i.armorType === 'Shield');
  const acBonusItems = inventory.filter(i => i.equipped && i.acBonus && i.itemType !== 'armor');
  
  let baseAC = 10;
  let dexBonus = dexMod;
  let shieldBonus = 0;
  let itemBonuses = 0;
  
  if (character.acEffect === 'mageArmor') {
    baseAC = 13;
  } else if (character.acEffect === 'barkskin') {
    if (10 + dexMod < 16) { baseAC = 16; dexBonus = 0; }
  } else if (character.acEffect === 'unarmoredDefense') {
    const conMod = getModNum(character.con);
    const wisMod = getModNum(character.wis);
    const classes = character.classes?.map(c => c.name.toLowerCase()) || [character.class?.toLowerCase()];
    if (classes.includes('barbarian')) baseAC = 10 + conMod;
    else if (classes.includes('monk')) baseAC = 10 + wisMod;
  } else if (character.acEffect === 'draconicResilience') {
    baseAC = 10 + getModNum(character.cha);
  } else if (equippedArmor) {
    baseAC = parseInt(equippedArmor.baseAC) || 10;
    if (equippedArmor.armorType === 'Medium') dexBonus = Math.min(2, dexMod);
    else if (equippedArmor.armorType === 'Heavy') dexBonus = 0;
  }
  
  if (equippedShield) shieldBonus = parseInt(equippedShield.baseAC) || 2;
  acBonusItems.forEach(item => { itemBonuses += parseInt(item.acBonus) || 0; });
  
  return baseAC + dexBonus + shieldBonus + itemBonuses;
};

export const MASTERY_DESC = {
  'Cleave': 'Hit another creature within 5 ft (weapon dice only)',
  'Graze': 'Deal modifier damage on miss',
  'Nick': 'Extra attack with light weapon (no mod to damage)',
  'Push': 'Push Large or smaller target 10 ft away',
  'Sap': 'Target has disadvantage on next attack',
  'Slow': 'Reduce target speed by 10 ft',
  'Topple': 'Target makes CON save or falls prone',
  'Vex': 'Gain advantage on next attack vs target',
};

export const PROPERTY_DESC = {
  'Ammunition': 'Requires ammunition to fire.',
  'Finesse': 'Use STR or DEX for attack/damage.',
  'Heavy': 'Small creatures have disadvantage.',
  'Light': 'Can two-weapon fight.',
  'Loading': 'One attack per action.',
  'Range': 'Attack at distance.',
  'Reach': '+5 ft reach.',
  'Thrown': 'Can throw for ranged attack.',
  'Two-Handed': 'Requires two hands.',
  'Versatile': 'One or two hands.',
};

export const ARMOR_DESC = {
  'Light': 'AC + full DEX',
  'Medium': 'AC + DEX (max +2)',
  'Heavy': 'AC only',
  'Shield': '+2 AC bonus',
};