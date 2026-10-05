// Weapon attack / damage for a character's inventory item. Moved verbatim out
// of the character sheet's InventoryTab (Oct 2026) so the combat turn tracker
// shows the same numbers. Assumes proficiency; magic bonus is read from a
// "+N" in the name or "+N bonus to attack" in the description.

import { getModNum, getProfBonus } from './rules';

// Base weapon data for property/damage lookups
export const BASE_WEAPONS = {
  'club': { damage: '1d4', type: 'Bludgeoning', props: ['Light'] },
  'dagger': { damage: '1d4', type: 'Piercing', props: ['Finesse', 'Light', 'Thrown'] },
  'greatclub': { damage: '1d8', type: 'Bludgeoning', props: ['Two-Handed'] },
  'handaxe': { damage: '1d6', type: 'Slashing', props: ['Light', 'Thrown'] },
  'javelin': { damage: '1d6', type: 'Piercing', props: ['Thrown'] },
  'light hammer': { damage: '1d4', type: 'Bludgeoning', props: ['Light', 'Thrown'] },
  'mace': { damage: '1d6', type: 'Bludgeoning', props: [] },
  'quarterstaff': { damage: '1d6', type: 'Bludgeoning', props: ['Versatile'] },
  'sickle': { damage: '1d4', type: 'Slashing', props: ['Light'] },
  'spear': { damage: '1d6', type: 'Piercing', props: ['Thrown', 'Versatile'] },
  'light crossbow': { damage: '1d8', type: 'Piercing', props: ['Ammunition', 'Loading', 'Two-Handed'], ranged: true },
  'dart': { damage: '1d4', type: 'Piercing', props: ['Finesse', 'Thrown'], ranged: true },
  'shortbow': { damage: '1d6', type: 'Piercing', props: ['Ammunition', 'Two-Handed'], ranged: true },
  'sling': { damage: '1d4', type: 'Bludgeoning', props: ['Ammunition'], ranged: true },
  'battleaxe': { damage: '1d8', type: 'Slashing', props: ['Versatile'] },
  'flail': { damage: '1d8', type: 'Bludgeoning', props: [] },
  'glaive': { damage: '1d10', type: 'Slashing', props: ['Heavy', 'Reach', 'Two-Handed'] },
  'greataxe': { damage: '1d12', type: 'Slashing', props: ['Heavy', 'Two-Handed'] },
  'greatsword': { damage: '2d6', type: 'Slashing', props: ['Heavy', 'Two-Handed'] },
  'halberd': { damage: '1d10', type: 'Slashing', props: ['Heavy', 'Reach', 'Two-Handed'] },
  'lance': { damage: '1d10', type: 'Piercing', props: ['Heavy', 'Reach'] },
  'longsword': { damage: '1d8', type: 'Slashing', props: ['Versatile'] },
  'maul': { damage: '2d6', type: 'Bludgeoning', props: ['Heavy', 'Two-Handed'] },
  'morningstar': { damage: '1d8', type: 'Piercing', props: [] },
  'pike': { damage: '1d10', type: 'Piercing', props: ['Heavy', 'Reach', 'Two-Handed'] },
  'rapier': { damage: '1d8', type: 'Piercing', props: ['Finesse'] },
  'scimitar': { damage: '1d6', type: 'Slashing', props: ['Finesse', 'Light'] },
  'shortsword': { damage: '1d6', type: 'Piercing', props: ['Finesse', 'Light'] },
  'trident': { damage: '1d8', type: 'Piercing', props: ['Thrown', 'Versatile'] },
  'war pick': { damage: '1d8', type: 'Piercing', props: ['Versatile'] },
  'warhammer': { damage: '1d8', type: 'Bludgeoning', props: ['Versatile'] },
  'whip': { damage: '1d4', type: 'Slashing', props: ['Finesse', 'Reach'] },
  'blowgun': { damage: '1', type: 'Piercing', props: ['Ammunition', 'Loading'], ranged: true },
  'hand crossbow': { damage: '1d6', type: 'Piercing', props: ['Ammunition', 'Light', 'Loading'], ranged: true },
  'heavy crossbow': { damage: '1d10', type: 'Piercing', props: ['Ammunition', 'Heavy', 'Loading', 'Two-Handed'], ranged: true },
  'longbow': { damage: '1d8', type: 'Piercing', props: ['Ammunition', 'Heavy', 'Two-Handed'], ranged: true },
};

// Try to find the base weapon type from item name or weaponType field
export const findBaseWeapon = (item) => {
  const name = (item.name || '').toLowerCase();
  const wType = (item.weaponType || '').toLowerCase();

  // Direct match on weaponType field (e.g. "Dagger", "Longsword")
  for (const [key, data] of Object.entries(BASE_WEAPONS)) {
    if (wType === key || wType.includes(key)) return data;
  }
  // Match from item name (e.g. "Dagger of Venom" → dagger, "Sun Blade" → longsword)
  for (const [key, data] of Object.entries(BASE_WEAPONS)) {
    if (name.startsWith(key) || name.includes(` ${key}`)) return data;
  }
  // Special cases for magic items
  if (wType.includes('sword') || name.includes('sword') || name.includes('blade')) {
    if (name.includes('short')) return BASE_WEAPONS['shortsword'];
    if (name.includes('great')) return BASE_WEAPONS['greatsword'];
    return BASE_WEAPONS['longsword']; // default sword
  }
  if (wType.includes('axe') || name.includes('axe')) {
    if (name.includes('great') || name.includes('battle')) return BASE_WEAPONS['battleaxe'];
    return BASE_WEAPONS['handaxe'];
  }
  if (wType.includes('bow') || name.includes('bow')) {
    if (name.includes('long') || wType.includes('long')) return BASE_WEAPONS['longbow'];
    if (name.includes('cross')) return BASE_WEAPONS['light crossbow'];
    return BASE_WEAPONS['shortbow'];
  }
  return null;
};

// Calculate weapon attack/damage based on character stats
export const getWeaponStatsFor = (item, character) => {
  if (item.itemType !== 'weapon') return null;

  const strMod = getModNum(character.str);
  const dexMod = getModNum(character.dex);

  // Get base weapon data
  const base = findBaseWeapon(item);
  const itemProps = item.weaponProperties || [];
  const props = itemProps.length > 0 ? itemProps : (base?.props || []);

  // Determine ability modifier
  const isFinesse = props.includes('Finesse');
  const isRanged = base?.ranged || (item.weaponType || '').toLowerCase().includes('ranged');
  // Thrown (non-finesse) weapons stay on STR — same ability as the melee attack.
  let abilityMod;
  let ability;
  if (isFinesse) {
    abilityMod = Math.max(strMod, dexMod);
    ability = dexMod > strMod ? 'DEX' : 'STR';
  } else if (isRanged) {
    abilityMod = dexMod;
    ability = 'DEX';
  } else {
    abilityMod = strMod;
    ability = 'STR';
  }

  // Proficiency bonus (assume proficient). The old inline formula added a
  // stray +1 on top of the level-derived bonus — deliberately dropped when
  // consolidating onto getProfBonus (July 2026).
  const profBonus = parseInt(character.profBonus) || getProfBonus(character);

  // Magic bonus from item name or description
  let magicBonus = 0;
  const nameMatch = (item.name || '').match(/\+(\d)/);
  if (nameMatch) {
    magicBonus = parseInt(nameMatch[1]);
  } else {
    const descMatch = (item.description || '').match(/\+(\d) bonus to attack/);
    if (descMatch) magicBonus = parseInt(descMatch[1]);
  }

  // Attack bonus
  const attackBonus = abilityMod + profBonus + magicBonus;

  // Damage dice: use item's set damage, or base weapon damage
  const damageDice = item.damage || base?.damage || '';

  // Damage modifier
  const damageMod = abilityMod + magicBonus;

  // Damage type: use item's set type, or base weapon type
  const damageType = item.damageType || base?.type || '';

  return {
    attackBonus: attackBonus >= 0 ? `+${attackBonus}` : `${attackBonus}`,
    damage: damageDice ? `${damageDice}${damageMod >= 0 ? '+' + damageMod : damageMod}` : null,
    damageType,
    damageDice,
    abilityMod,
    ability,
    profBonus,
    magicBonus,
    properties: props,
    isRanged,
  };
};
