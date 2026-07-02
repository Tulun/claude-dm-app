import { describe, it, expect } from 'vitest';
import {
  getMod,
  getModNum,
  getProfBonus,
  getSpellSaveDC,
  getSpellAttackBonus,
  getCalculatedAC,
} from '../../app/combat/components/CharacterCard/utils.js';

describe('getMod / getModNum', () => {
  it('formats positive modifiers with a plus sign', () => {
    expect(getMod(10)).toBe('+0');
    expect(getMod(12)).toBe('+1');
    expect(getMod(20)).toBe('+5');
    expect(getMod(30)).toBe('+10');
  });

  it('formats negative modifiers', () => {
    expect(getMod(8)).toBe('-1');
    expect(getMod(3)).toBe('-4');
    expect(getMod(1)).toBe('-5');
  });

  it('handles odd scores by flooring', () => {
    expect(getModNum(11)).toBe(0);
    expect(getModNum(13)).toBe(1);
    expect(getModNum(9)).toBe(-1);
  });

  it('accepts string scores', () => {
    expect(getModNum('16')).toBe(3);
    expect(getMod('7')).toBe('-2');
  });

  it('defaults missing or junk input to 10', () => {
    expect(getModNum(undefined)).toBe(0);
    expect(getModNum('potato')).toBe(0);
    expect(getMod(null)).toBe('+0');
    // Quirk: 0 is falsy, so a score of 0 is treated as 10, not -5.
    expect(getModNum(0)).toBe(0);
  });
});

describe('getProfBonus', () => {
  it('scales with character level', () => {
    expect(getProfBonus({ level: 1 })).toBe(2);
    expect(getProfBonus({ level: 4 })).toBe(2);
    expect(getProfBonus({ level: 5 })).toBe(3);
    expect(getProfBonus({ level: 8 })).toBe(3);
    expect(getProfBonus({ level: 9 })).toBe(4);
    expect(getProfBonus({ level: 12 })).toBe(4);
    expect(getProfBonus({ level: 13 })).toBe(5);
    expect(getProfBonus({ level: 17 })).toBe(6);
    expect(getProfBonus({ level: 20 })).toBe(6);
  });

  it('handles fractional CRs explicitly', () => {
    expect(getProfBonus({ cr: '0' })).toBe(2);
    expect(getProfBonus({ cr: '1/8' })).toBe(2);
    expect(getProfBonus({ cr: '1/4' })).toBe(2);
    expect(getProfBonus({ cr: '1/2' })).toBe(2);
  });

  it('scales with integer CR', () => {
    expect(getProfBonus({ cr: '1' })).toBe(2);
    expect(getProfBonus({ cr: '4' })).toBe(2);
    expect(getProfBonus({ cr: '5' })).toBe(3);
    expect(getProfBonus({ cr: '9' })).toBe(4);
    expect(getProfBonus({ cr: '13' })).toBe(5);
    expect(getProfBonus({ cr: '17' })).toBe(6);
    expect(getProfBonus({ cr: '21' })).toBe(7);
    expect(getProfBonus({ cr: '25' })).toBe(8);
    expect(getProfBonus({ cr: '30' })).toBe(9);
  });

  it('prefers level over CR when both exist', () => {
    expect(getProfBonus({ level: 1, cr: '30' })).toBe(2);
  });

  it('defaults to 2 with neither level nor CR', () => {
    expect(getProfBonus({})).toBe(2);
  });
});

describe('getSpellSaveDC', () => {
  it('returns null without a spellStat', () => {
    expect(getSpellSaveDC({ cha: 18, level: 5 })).toBeNull();
  });

  it('computes 8 + prof + stat mod', () => {
    expect(getSpellSaveDC({ spellStat: 'cha', cha: 18, level: 5 })).toBe(15);
    expect(getSpellSaveDC({ spellStat: 'int', int: 20, level: 17 })).toBe(19);
    expect(getSpellSaveDC({ spellStat: 'wis', wis: 8, level: 1 })).toBe(9);
  });

  it('adds +1 for Innate Sorcery', () => {
    expect(getSpellSaveDC({ spellStat: 'cha', cha: 18, level: 5, innateSorcery: true })).toBe(16);
  });

  it('works for CR-based casters', () => {
    expect(getSpellSaveDC({ spellStat: 'int', int: 18, cr: '10' })).toBe(16); // 8 + 4 + 4
  });
});

describe('getSpellAttackBonus', () => {
  it('returns null without a spellStat', () => {
    expect(getSpellAttackBonus({ wis: 16 })).toBeNull();
  });

  it('returns a formatted prof + mod string', () => {
    expect(getSpellAttackBonus({ spellStat: 'wis', wis: 16, level: 4 })).toBe('+5');
    expect(getSpellAttackBonus({ spellStat: 'cha', cha: 6, level: 1 })).toBe('+0');
  });
});

describe('getCalculatedAC (combat CharacterCard variant)', () => {
  // NOTE: this is a second, divergent implementation of the AC calculator.
  // Differences from app/utils/acCalculation.js are characterized here on purpose.

  it('returns null (not a number) with no inventory and no acEffect', () => {
    expect(getCalculatedAC({ dex: 14, ac: 15 })).toBeNull();
  });

  it('does not parse armor names — unknown armor without baseAC falls back to 10', () => {
    const character = {
      dex: 10,
      inventory: [{ itemType: 'armor', equipped: true, name: 'Chain Mail' }],
    };
    // The shared calculator would return 16 here; this variant returns 10.
    expect(getCalculatedAC(character)).toBe(10);
  });

  it('uses explicit baseAC and armorType', () => {
    const character = {
      dex: 18,
      inventory: [{ itemType: 'armor', equipped: true, baseAC: '14', armorType: 'Medium' }],
    };
    expect(getCalculatedAC(character)).toBe(16); // 14 + capped 2
  });

  it('supports mageArmor', () => {
    expect(getCalculatedAC({ dex: 14, acEffect: 'mageArmor', inventory: [] })).toBe(15);
  });

  it('adds shield and item bonuses', () => {
    const character = {
      dex: 10,
      inventory: [
        { itemType: 'armor', equipped: true, baseAC: '16', armorType: 'Heavy' },
        { itemType: 'armor', equipped: true, armorType: 'Shield' },
        { itemType: 'wondrous', equipped: true, acBonus: '1' },
      ],
    };
    expect(getCalculatedAC(character)).toBe(19); // 16 + 0 dex + 2 shield + 1 ring
  });

  it('ignores tempAC entirely (unlike the shared calculator)', () => {
    const character = {
      dex: 10,
      tempAC: '5',
      inventory: [{ itemType: 'armor', equipped: true, baseAC: '16', armorType: 'Heavy' }],
    };
    expect(getCalculatedAC(character)).toBe(16);
  });
});
