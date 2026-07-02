// Helper functions for CharacterCard
//
// Rules math lives in app/utils/rules.js — re-exported here so existing
// imports keep working.

import { getEquipmentAC } from '../../../utils/acCalculation';

export { getMod, getModNum, getProfBonus, getSpellSaveDC, getSpellAttackBonus } from '../../../utils/rules';

// Combat-card AC: equipment-derived only, no temp AC, no armor-name parsing;
// null means "no equipment info — show the stored AC instead".
export const getCalculatedAC = (character) =>
  getEquipmentAC(character, { includeTempAC: false, parseArmorNames: false });

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
