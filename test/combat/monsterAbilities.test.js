import { describe, it, expect } from 'vitest';
import {
  parseUsage, abilityLabel, getMonsterAbilities, formatSpeeds,
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

describe('formatSpeeds', () => {
  it('lists every movement mode with units', () => {
    expect(formatSpeeds(35)).toEqual(['35 ft']);
    expect(formatSpeeds('40 ft.')).toEqual(['40 ft']);
    expect(formatSpeeds('40, burrow 40, fly 80')).toEqual(['40 ft', 'burrow 40 ft', 'fly 80 ft']);
    expect(formatSpeeds('20 ft., swim 20 ft.')).toEqual(['20 ft', 'swim 20 ft']);
    expect(formatSpeeds('0, fly 50 ft. (hover)')).toEqual(['0 ft', 'fly 50 ft (hover)']);
  });

  it('defaults to 30 ft', () => {
    expect(formatSpeeds(undefined)).toEqual(['30 ft']);
    expect(formatSpeeds('')).toEqual(['30 ft']);
  });
});
