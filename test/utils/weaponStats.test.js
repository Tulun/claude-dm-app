import { describe, it, expect } from 'vitest';
import { getWeaponStatsFor, findBaseWeapon } from '../../app/utils/weaponStats.js';

// Level 5 → prof +3
const fighter = { level: 5, str: 16, dex: 14 };

describe('getWeaponStatsFor', () => {
  it('is null for non-weapons', () => {
    expect(getWeaponStatsFor({ itemType: 'armor', name: 'Chain Mail' }, fighter)).toBeNull();
  });

  it('melee weapons use STR + proficiency', () => {
    const s = getWeaponStatsFor({ itemType: 'weapon', name: 'Longsword' }, fighter);
    expect(s.attackBonus).toBe('+6');
    expect(s.damage).toBe('1d8+3');
    expect(s.damageType).toBe('Slashing');
  });

  it('finesse takes the better of STR/DEX; ranged uses DEX', () => {
    const nimble = { level: 5, str: 8, dex: 18 };
    expect(getWeaponStatsFor({ itemType: 'weapon', name: 'Rapier' }, nimble).attackBonus).toBe('+7');
    expect(getWeaponStatsFor({ itemType: 'weapon', name: 'Longbow' }, fighter).attackBonus).toBe('+5');
  });

  it('thrown (non-finesse) weapons use STR even though they can be thrown', () => {
    // Marshuh's Javelin of Lightning: STR 10, DEX 13, level 4 (prof +2)
    const marshuh = { level: 4, str: 10, dex: 13 };
    const s = getWeaponStatsFor(
      { itemType: 'weapon', name: 'Javelin of Lightning', damage: '1d6', damageType: 'Piercing', weaponProperties: ['Thrown', 'Simple'] },
      marshuh
    );
    expect(s.ability).toBe('STR');
    expect(s.abilityMod).toBe(0);
    expect(s.profBonus).toBe(2);
    expect(s.attackBonus).toBe('+2');
    expect(s.damage).toBe('1d6+0');
  });

  it('reports which ability a finesse weapon used', () => {
    expect(getWeaponStatsFor({ itemType: 'weapon', name: 'Rapier' }, { level: 5, str: 8, dex: 18 }).ability).toBe('DEX');
    expect(getWeaponStatsFor({ itemType: 'weapon', name: 'Rapier' }, { level: 5, str: 18, dex: 8 }).ability).toBe('STR');
  });

  it('reads a magic bonus from the name or description', () => {
    expect(getWeaponStatsFor({ itemType: 'weapon', name: 'Dagger +1' }, fighter).attackBonus).toBe('+7');
    const venom = getWeaponStatsFor(
      { itemType: 'weapon', name: 'Dagger of Venom', description: 'You gain a +1 bonus to attack and damage rolls.' },
      fighter
    );
    expect(venom.attackBonus).toBe('+7');
    expect(venom.damage).toBe('1d4+4');
  });

  it('item fields override the base weapon table', () => {
    const s = getWeaponStatsFor({ itemType: 'weapon', name: 'Staff', damage: '1d6', damageType: 'Bludgeoning', weaponProperties: ['Versatile'] }, fighter);
    expect(s.damage).toBe('1d6+3');
    expect(s.damageType).toBe('Bludgeoning');
  });
});

describe('findBaseWeapon', () => {
  it('matches from the item name', () => {
    expect(findBaseWeapon({ name: 'Heavy Crossbow' }).damage).toBe('1d10');
    expect(findBaseWeapon({ name: 'Sun Blade' }).damage).toBe('1d8');
    expect(findBaseWeapon({ name: 'Bag of Holding' })).toBeNull();
  });
});
