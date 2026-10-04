import { describe, it, expect } from 'vitest';
import {
  parseUsage, abilityLabel, getMonsterAbilities, parseWalkSpeed, otherSpeeds,
} from '../../app/combat/monsterAbilities.js';

describe('parseUsage', () => {
  it('reads per-day, recharge and per-rest limits from the name', () => {
    expect(parseUsage('Legendary Resistance (3/Day)')).toEqual({ kind: 'perDay', max: 3 });
    expect(parseUsage('Teleport (1/Day each)')).toEqual({ kind: 'perDay', max: 1 });
    expect(parseUsage('Breath Weapons (Recharge 5-6)')).toEqual({ kind: 'recharge', max: 1, min: 5 });
    expect(parseUsage('Fire Breath (Recharge 5–6)')).toEqual({ kind: 'recharge', max: 1, min: 5 });
    expect(parseUsage('Web (Recharge 6)')).toEqual({ kind: 'recharge', max: 1, min: 6 });
    expect(parseUsage('Shapechange (Recharges after a Short or Long Rest)')).toEqual({ kind: 'rest', max: 1 });
  });

  it('is null for unlimited abilities', () => {
    expect(parseUsage('Bite')).toBeNull();
    expect(parseUsage('Wing Attack (2 Actions)')).toBeNull();
    expect(parseUsage()).toBeNull();
  });
});

describe('abilityLabel', () => {
  it('strips the usage parenthetical but keeps other ones', () => {
    expect(abilityLabel('Breath Weapons (Recharge 5-6)')).toBe('Breath Weapons');
    expect(abilityLabel('Legendary Resistance (3/Day)')).toBe('Legendary Resistance');
    expect(abilityLabel('Wing Attack (2 Actions)')).toBe('Wing Attack (2 Actions)');
  });
});

describe('getMonsterAbilities', () => {
  it('groups by section and only keeps limited-use traits', () => {
    const a = getMonsterAbilities({
      traits: [{ name: 'Amphibious' }, { name: 'Legendary Resistance (3/Day)' }],
      actions: [{ name: 'Bite' }, { name: 'Breath (Recharge 5-6)' }],
      bonusActions: [{ name: 'Nimble Escape' }],
      reactions: [{ name: 'Parry' }],
    });
    expect(a.actions.map(x => x.name)).toEqual(['Bite', 'Breath (Recharge 5-6)']);
    expect(a.actions[1].usage.kind).toBe('recharge');
    expect(a.bonusActions[0].section).toBe('bonusActions');
    expect(a.reactions.map(x => x.name)).toEqual(['Parry']);
    expect(a.limitedTraits.map(x => x.name)).toEqual(['Legendary Resistance (3/Day)']);
  });

  it('tolerates missing sections and creatures', () => {
    expect(getMonsterAbilities({}).actions).toEqual([]);
    expect(getMonsterAbilities(null).reactions).toEqual([]);
  });
});

describe('speed helpers', () => {
  it('walk speed is the first number, defaulting to 30', () => {
    expect(parseWalkSpeed(35)).toBe(35);
    expect(parseWalkSpeed('40 ft.')).toBe(40);
    expect(parseWalkSpeed('40, burrow 40, fly 80')).toBe(40);
    expect(parseWalkSpeed(undefined)).toBe(30);
    expect(parseWalkSpeed('')).toBe(30);
  });

  it('lists the other movement modes', () => {
    expect(otherSpeeds('40, burrow 40, fly 80')).toBe('burrow 40, fly 80');
    expect(otherSpeeds('20 ft., swim 20 ft.')).toBe('swim 20');
    expect(otherSpeeds(30)).toBe('');
  });
});
