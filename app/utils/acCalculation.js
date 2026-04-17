// Calculate AC from equipped items — shared across combat and characters pages

const ARMOR_AC_TABLE = {
  'padded': 11, 'leather': 11, 'studded leather': 12, 'studded': 12,
  'hide': 12, 'chain shirt': 13, 'scale mail': 14, 'scale': 14,
  'breastplate': 14, 'half plate': 15, 'ring mail': 14,
  'chain mail': 16, 'chain': 16, 'splint': 17, 'plate': 18,
};

const sortedArmorKeys = Object.keys(ARMOR_AC_TABLE).sort((a, b) => b.length - a.length);

const getArmorBaseAC = (item) => {
  if (item.baseAC) return parseInt(item.baseAC);
  const name = (item.name || '').toLowerCase();
  for (const key of sortedArmorKeys) {
    if (name.includes(key)) return ARMOR_AC_TABLE[key];
  }
  const match = (item.description || '').match(/AC (\d+)/);
  if (match) return parseInt(match[1]);
  return 10;
};

export const getCalculatedAC = (character) => {
  const getModNum = (score) => Math.floor(((parseInt(score) || 10) - 10) / 2);
  const dexMod = getModNum(character.dex);
  const inventory = character.inventory || [];
  
  const equippedArmor = inventory.find(i => i.itemType === 'armor' && i.equipped && i.armorType !== 'Shield');
  const equippedShield = inventory.find(i => i.itemType === 'armor' && i.equipped && i.armorType === 'Shield');
  const acBonusItems = inventory.filter(i => i.equipped && i.acBonus && i.itemType !== 'armor');
  
  let baseAC = 10;
  let dexBonus = dexMod;
  let shieldBonus = 0;
  let itemBonuses = 0;
  let tempBonus = parseInt(character.tempAC) || 0;
  
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
    const chaMod = getModNum(character.cha);
    baseAC = 10 + chaMod;
  } else if (equippedArmor) {
    baseAC = getArmorBaseAC(equippedArmor);
    let aType = equippedArmor.armorType || '';
    if (!aType) {
      const name = (equippedArmor.name || '').toLowerCase();
      if (name.includes('studded leather') || name.includes('leather') || name.includes('padded')) aType = 'Light';
      else if (name.includes('half plate') || name.includes('chain shirt') || name.includes('scale') || name.includes('breastplate') || name.includes('hide')) aType = 'Medium';
      else if (name.includes('ring mail') || name.includes('chain mail') || name.includes('splint') || name.includes('plate')) aType = 'Heavy';
      else if (baseAC <= 12) aType = 'Light';
      else if (baseAC <= 15) aType = 'Medium';
      else aType = 'Heavy';
    }
    if (aType === 'Medium') dexBonus = Math.min(2, dexMod);
    else if (aType === 'Heavy') dexBonus = 0;
  } else if (inventory.length === 0 && !character.acEffect) {
    return character.ac || 10;
  }
  
  if (equippedShield) shieldBonus = parseInt(equippedShield.baseAC) || 2;
  acBonusItems.forEach(item => { itemBonuses += parseInt(item.acBonus) || 0; });
  
  return baseAC + dexBonus + shieldBonus + itemBonuses + tempBonus;
};