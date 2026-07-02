import { describe, it, expect } from 'vitest';
import { getCalculatedAC } from '../../app/utils/acCalculation.js';

// Characterization tests: these lock in the current behavior of the shared
// AC calculator so refactors can be verified against it.

const armor = (overrides = {}) => ({
  itemType: 'armor',
  equipped: true,
  ...overrides,
});

describe('getCalculatedAC (app/utils/acCalculation)', () => {
  describe('no inventory, no acEffect', () => {
    it('returns the stored ac when inventory is empty', () => {
      expect(getCalculatedAC({ dex: 14, ac: 15 })).toBe(15);
    });

    it('returns 10 when no stored ac exists', () => {
      expect(getCalculatedAC({ dex: 14 })).toBe(10);
    });

    it('ignores tempAC on the early-return path (current behavior)', () => {
      // Quirk: tempAC only applies when inventory or acEffect exists.
      expect(getCalculatedAC({ dex: 14, ac: 15, tempAC: '2' })).toBe(15);
    });
  });

  describe('unarmored with items in inventory', () => {
    it('computes 10 + dex mod when armor is unequipped', () => {
      const character = {
        dex: 14,
        inventory: [armor({ name: 'Chain Mail', equipped: false })],
      };
      expect(getCalculatedAC(character)).toBe(12);
    });
  });

  describe('acEffect: mageArmor', () => {
    it('uses base 13 + dex mod', () => {
      expect(getCalculatedAC({ dex: 16, acEffect: 'mageArmor', inventory: [] })).toBe(16);
    });
  });

  describe('acEffect: barkskin', () => {
    it('floors AC at 16 when 10 + dex mod is below 16', () => {
      expect(getCalculatedAC({ dex: 10, acEffect: 'barkskin', inventory: [] })).toBe(16);
      expect(getCalculatedAC({ dex: 18, acEffect: 'barkskin', inventory: [] })).toBe(16);
    });

    it('keeps natural AC when 10 + dex mod is 16 or more', () => {
      expect(getCalculatedAC({ dex: 22, acEffect: 'barkskin', inventory: [] })).toBe(16);
      expect(getCalculatedAC({ dex: 24, acEffect: 'barkskin', inventory: [] })).toBe(17);
    });
  });

  describe('acEffect: unarmoredDefense', () => {
    it('uses 10 + con + dex for barbarians (classes array)', () => {
      const character = {
        dex: 14, con: 16,
        acEffect: 'unarmoredDefense',
        classes: [{ name: 'Barbarian' }],
        inventory: [],
      };
      expect(getCalculatedAC(character)).toBe(15);
    });

    it('uses 10 + wis + dex for monks', () => {
      const character = {
        dex: 14, wis: 16,
        acEffect: 'unarmoredDefense',
        classes: [{ name: 'Monk' }],
        inventory: [],
      };
      expect(getCalculatedAC(character)).toBe(15);
    });

    it('falls back to the legacy single class field', () => {
      const character = {
        dex: 14, con: 16,
        acEffect: 'unarmoredDefense',
        class: 'Barbarian',
        inventory: [],
      };
      expect(getCalculatedAC(character)).toBe(15);
    });

    it('leaves base 10 for classes without unarmored defense', () => {
      const character = {
        dex: 14, con: 16,
        acEffect: 'unarmoredDefense',
        classes: [{ name: 'Wizard' }],
        inventory: [],
      };
      expect(getCalculatedAC(character)).toBe(12);
    });
  });

  describe('acEffect: draconicResilience', () => {
    it('uses 10 + cha + dex', () => {
      const character = { dex: 12, cha: 16, acEffect: 'draconicResilience', inventory: [] };
      expect(getCalculatedAC(character)).toBe(14);
    });
  });

  describe('equipped armor', () => {
    it('reads heavy armor from name and zeroes dex bonus', () => {
      const character = { dex: 18, inventory: [armor({ name: 'Chain Mail' })] };
      expect(getCalculatedAC(character)).toBe(16);
    });

    it('reads light armor from name with full dex bonus', () => {
      const character = { dex: 18, inventory: [armor({ name: 'Studded Leather' })] };
      expect(getCalculatedAC(character)).toBe(16); // 12 + 4
    });

    it('matches "studded leather" before the shorter "leather" key', () => {
      const character = { dex: 10, inventory: [armor({ name: 'Studded Leather Armor' })] };
      expect(getCalculatedAC(character)).toBe(12); // studded leather = 12, not leather = 11
    });

    it('caps medium armor dex bonus at +2', () => {
      const character = { dex: 18, inventory: [armor({ name: 'Half Plate' })] };
      expect(getCalculatedAC(character)).toBe(17); // 15 + 2
    });

    it('prefers explicit baseAC over the name lookup', () => {
      const character = {
        dex: 10,
        inventory: [armor({ name: 'Chain Mail', baseAC: '17', armorType: 'Heavy' })],
      };
      expect(getCalculatedAC(character)).toBe(17);
    });

    it('falls back to an "AC n" pattern in the description', () => {
      const character = {
        dex: 10,
        inventory: [armor({ name: 'Weird Carapace', description: 'AC 14, ancient chitin', armorType: 'Heavy' })],
      };
      expect(getCalculatedAC(character)).toBe(14);
    });

    it('respects an explicit armorType over name inference', () => {
      const character = {
        dex: 18,
        inventory: [armor({ name: 'Mystery Suit', baseAC: '13', armorType: 'Medium' })],
      };
      expect(getCalculatedAC(character)).toBe(15); // 13 + capped 2
    });

    it('infers armor weight from baseAC when name and type are unknown', () => {
      // baseAC 12 or less => Light (full dex)
      expect(getCalculatedAC({ dex: 18, inventory: [armor({ name: 'X', baseAC: '12' })] })).toBe(16);
      // 13-15 => Medium (dex capped at 2)
      expect(getCalculatedAC({ dex: 18, inventory: [armor({ name: 'X', baseAC: '15' })] })).toBe(17);
      // 16+ => Heavy (no dex)
      expect(getCalculatedAC({ dex: 18, inventory: [armor({ name: 'X', baseAC: '16' })] })).toBe(16);
    });
  });

  describe('shields and bonus items', () => {
    it('adds +2 for a shield without explicit baseAC', () => {
      const character = {
        dex: 14,
        inventory: [
          armor({ name: 'Chain Mail' }),
          armor({ name: 'Shield', armorType: 'Shield' }),
        ],
      };
      expect(getCalculatedAC(character)).toBe(18);
    });

    it('uses the shield baseAC when provided', () => {
      const character = {
        dex: 10,
        inventory: [armor({ name: 'Shield +1', armorType: 'Shield', baseAC: '3' })],
      };
      expect(getCalculatedAC(character)).toBe(13); // 10 + 0 + 3
    });

    it('adds equipped non-armor acBonus items', () => {
      const character = {
        dex: 10,
        inventory: [
          { name: 'Ring of Protection', itemType: 'wondrous', equipped: true, acBonus: '1' },
          { name: 'Cloak of Protection', itemType: 'wondrous', equipped: false, acBonus: '1' },
        ],
      };
      expect(getCalculatedAC(character)).toBe(11); // unequipped cloak ignored
    });

    it('adds tempAC on the computed path', () => {
      const character = {
        dex: 14,
        tempAC: '2',
        inventory: [armor({ name: 'Leather' })],
      };
      expect(getCalculatedAC(character)).toBe(15); // 11 + 2 + 2
    });
  });

  describe('input robustness', () => {
    it('treats missing or junk ability scores as 10', () => {
      expect(getCalculatedAC({ acEffect: 'mageArmor', inventory: [] })).toBe(13);
      expect(getCalculatedAC({ dex: 'potato', acEffect: 'mageArmor', inventory: [] })).toBe(13);
    });

    it('handles a character with no inventory property', () => {
      expect(getCalculatedAC({ dex: 14, ac: 12 })).toBe(12);
    });
  });
});
