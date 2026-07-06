// Calculate AC from equipped items — shared across combat and characters pages.
//
// getEquipmentAC is the single implementation; the option flags exist because
// different views historically applied slightly different rules (temp AC,
// armor-name parsing) and callers rely on those exact behaviors.

import { getModNum, getAllClasses } from './rules';

// Canonical mundane-armor table (name fragment → base AC + armor type).
// Shared with the character sheet's inventory (getArmorData below); the
// bare-fragment aliases ('studded', 'scale', 'chain') keep name parsing
// forgiving. The shield entry is kept separate so body-armor lookups
// (getArmorBaseAC) never match an item named "Shield".
export const ARMOR_AC_TABLE = {
  'padded': { baseAC: 11, armorType: 'Light' },
  'leather': { baseAC: 11, armorType: 'Light' },
  'studded leather': { baseAC: 12, armorType: 'Light' },
  'studded': { baseAC: 12, armorType: 'Light' },
  'hide': { baseAC: 12, armorType: 'Medium' },
  'chain shirt': { baseAC: 13, armorType: 'Medium' },
  'scale mail': { baseAC: 14, armorType: 'Medium' },
  'scale': { baseAC: 14, armorType: 'Medium' },
  'breastplate': { baseAC: 14, armorType: 'Medium' },
  'half plate': { baseAC: 15, armorType: 'Medium' },
  'ring mail': { baseAC: 14, armorType: 'Heavy' },
  'chain mail': { baseAC: 16, armorType: 'Heavy' },
  'chain': { baseAC: 16, armorType: 'Heavy' },
  'splint': { baseAC: 17, armorType: 'Heavy' },
  'plate': { baseAC: 18, armorType: 'Heavy' },
};

const SHIELD_DATA = { baseAC: 2, armorType: 'Shield' };

const sortedArmorKeys = Object.keys(ARMOR_AC_TABLE).sort((a, b) => b.length - a.length);

const getArmorBaseAC = (item) => {
  if (item.baseAC) return parseInt(item.baseAC);
  const name = (item.name || '').toLowerCase();
  for (const key of sortedArmorKeys) {
    if (name.includes(key)) return ARMOR_AC_TABLE[key].baseAC;
  }
  const match = (item.description || '').match(/AC (\d+)/);
  if (match) return parseInt(match[1]);
  return 10;
};

// Resolve { baseAC, armorType } for an armor-ish item (incl. shields) from its
// name, armorType field, or an "AC n" description fragment; null when nothing
// matches. Used by the character sheet when adding armor from the magic-item
// library.
export const getArmorData = (item) => {
  const name = (item.name || '').toLowerCase();
  const keysWithShield = [...sortedArmorKeys, 'shield'].sort((a, b) => b.length - a.length);
  const lookup = (key) => (key === 'shield' ? SHIELD_DATA : ARMOR_AC_TABLE[key]);
  for (const key of keysWithShield) {
    if (name.includes(key)) return lookup(key);
  }
  const aType = (item.armorType || '').toLowerCase();
  if (aType === 'shield') return SHIELD_DATA;
  for (const key of keysWithShield) {
    if (aType.includes(key)) return lookup(key);
  }
  const acMatch = (item.description || '').match(/AC (\d+)/);
  if (acMatch) {
    const ac = parseInt(acMatch[1]);
    return { baseAC: ac, armorType: item.armorType || (ac <= 12 ? 'Light' : ac <= 15 ? 'Medium' : 'Heavy') };
  }
  return null;
};

// Returns the AC derived from equipment and active effects, or null when the
// character has no inventory and no AC effect (caller decides the fallback).
export const getEquipmentAC = (character, { includeTempAC = true, parseArmorNames = true } = {}) => {
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
  const tempBonus = includeTempAC ? (parseInt(character.tempAC) || 0) : 0;

  if (character.acEffect === 'mageArmor') {
    baseAC = 13;
  } else if (character.acEffect === 'barkskin') {
    if (10 + dexMod < 16) { baseAC = 16; dexBonus = 0; }
  } else if (character.acEffect === 'unarmoredDefense') {
    const conMod = getModNum(character.con);
    const wisMod = getModNum(character.wis);
    const classes = getAllClasses(character).map(c => c.name?.toLowerCase());
    if (classes.includes('barbarian')) baseAC = 10 + conMod;
    else if (classes.includes('monk')) baseAC = 10 + wisMod;
  } else if (character.acEffect === 'draconicResilience') {
    const chaMod = getModNum(character.cha);
    baseAC = 10 + chaMod;
  } else if (equippedArmor) {
    baseAC = parseArmorNames ? getArmorBaseAC(equippedArmor) : (parseInt(equippedArmor.baseAC) || 10);
    let aType = equippedArmor.armorType || '';
    if (!aType && parseArmorNames) {
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
  }

  if (equippedShield) shieldBonus = parseInt(equippedShield.baseAC) || 2;
  acBonusItems.forEach(item => { itemBonuses += parseInt(item.acBonus) || 0; });

  return baseAC + dexBonus + shieldBonus + itemBonuses + tempBonus;
};

export const getCalculatedAC = (character) => {
  const equipmentAC = getEquipmentAC(character);
  if (equipmentAC === null) return character.ac || 10;
  return equipmentAC;
};
