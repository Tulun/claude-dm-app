import { describe, it, expect } from 'vitest';
import {
  parseUsage, abilityLabel, getMonsterAbilities, formatSpeeds,
  parseSavingThrows, parseSenses, splitDefenses, splitStatText,
} from '../../app/combat/monsterAbilities.js';
import { getLimitedPools } from '../../app/combat/limitedUses.js';

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

describe('parseSavingThrows', () => {
  it('reads listed saves (signed, unicode minus too) and skips unlisted ones', () => {
    expect(parseSavingThrows('Dex +6, Con +13, Wis +8, Cha +10')).toEqual({ dex: 6, con: 13, wis: 8, cha: 10 });
    expect(parseSavingThrows('Str +3, Int -4, Cha −5')).toEqual({ str: 3, int: -4, cha: -5 });
    expect(parseSavingThrows('Dexterity +4')).toEqual({ dex: 4 });
    expect(parseSavingThrows(undefined)).toEqual({});
  });
});

describe('parseSenses', () => {
  it('pulls passive Perception out of the senses line', () => {
    expect(parseSenses('Blindsight 60 ft. (blind beyond), Passive Perception 10')).toEqual({
      passive: 10, senses: ['Blindsight 60 ft. (blind beyond)'],
    });
    expect(parseSenses('')).toEqual({ passive: null, senses: [] });
  });
});

describe('splitDefenses', () => {
  it('splits damage types and 2024 "; conditions" groups into chips', () => {
    expect(splitDefenses('Cold, Fire')).toEqual(['Cold', 'Fire']);
    expect(splitDefenses('Lightning; Blinded, Deafened')).toEqual(['Lightning', 'Blinded', 'Deafened']);
  });
  it('keeps a qualified clause whole', () => {
    expect(splitDefenses('Bludgeoning, Piercing, and Slashing from Nonmagical Attacks'))
      .toEqual(['Bludgeoning, Piercing, and Slashing from Nonmagical Attacks']);
    expect(splitDefenses(undefined)).toEqual([]);
  });
});

describe('getLimitedPools', () => {
  const dragon = {
    id: 'd', name: 'Dragon',
    traits: [{ name: 'Legendary Resistance (3/Day)' }, { name: 'Amphibious' }],
    actions: [{ name: 'Bite' }, { name: 'Fire Breath (Recharge 5-6)' }],
    legendaryActions: [{ name: 'Tail' }],
    legendaryActionsUsed: 1,
    abilityUses: { 'Legendary Resistance (3/Day)': 2 },
  };
  const spells = { perDay: { 1: ['fly'] }, slots: { '1st': { slots: 4, spells: ['shield'] } } };

  it('lists legendary (opt-in), limited abilities, then spells', () => {
    const pools = getLimitedPools(dragon, spells, { legendary: true });
    expect(pools.map(p => [p.label, p.total, p.used, p.note ?? null])).toEqual([
      ['Legendary', 3, 1, '/round'],
      ['Legendary Resistance', 3, 2, null],
      ['Fire Breath', 1, 0, 'Recharge 5+'],
      ['1/Day spells', 1, 0, null],
      ['1st', 4, 0, null],
    ]);
    expect(getLimitedPools(dragon, spells).map(p => p.id)).not.toContain('legendary');
  });

  it('set() writes the right field', () => {
    const [legendary, lr, breath, perDay, slot] = getLimitedPools(dragon, spells, { legendary: true });
    expect(legendary.set(3).legendaryActionsUsed).toBe(3);
    expect(lr.set(3).abilityUses).toEqual({ 'Legendary Resistance (3/Day)': 3 });
    expect(breath.set(1).abilityUses['Fire Breath (Recharge 5-6)']).toBe(1);
    expect(perDay.set(1).perDay1Used).toBe(1);
    expect(slot.set(2).spellSlots1stUsed).toBe(2);
  });
});

describe('splitStatText', () => {
  const marked = (text) => splitStatText(text).filter(s => s.kind).map(s => [s.kind, s.text]);

  it('picks out to-hit, damage and save DCs (2014 and 2024 wording)', () => {
    expect(marked('Melee Attack Roll: +4, reach 5 ft. Hit: 9 (2d6+2) Slashing damage.')).toEqual([
      ['hit', '+4'], ['damage', '9 (2d6+2) Slashing damage'],
    ]);
    expect(marked('Melee Weapon Attack: +6 to hit. Hit: 13 (2d8 + 4) bludgeoning damage.')).toEqual([
      ['hit', '+6 to hit'], ['damage', '13 (2d8 + 4) bludgeoning damage'],
    ]);
    expect(marked('Each creature must make a DC 13 Dexterity saving throw.')).toEqual([['dc', 'DC 13 Dexterity saving throw']]);
    expect(marked('Once per turn, +10 (3d6) damage if an ally is near.')).toEqual([['damage', '+10 (3d6) damage']]);
    // spell-style dice
    expect(marked('Each creature takes 8d6 fire damage, or half as much.')).toEqual([['damage', '8d6 fire damage']]);
  });

  it('round-trips the text and leaves plain prose alone', () => {
    const text = 'Melee Attack Roll: +4, reach 5 ft. Hit: 5 (1d6+2) Piercing damage. DC 12.';
    expect(splitStatText(text).map(s => s.text).join('')).toBe(text);
    expect(splitStatText('Two Greatsword attacks.')).toEqual([{ text: 'Two Greatsword attacks.', kind: null }]);
    expect(splitStatText('+2 AC against one melee attack.')).toEqual([{ text: '+2 AC against one melee attack.', kind: null }]);
    expect(splitStatText(undefined)).toEqual([]);
  });
});
