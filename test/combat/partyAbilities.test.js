import { describe, it, expect } from 'vitest';
import { spellEconomy, getTurnSpells, pickSlotPool, getPreparedCasterInfo } from '../../app/combat/partyAbilities.js';

describe('spellEconomy', () => {
  it('maps casting times to the economy slot they cost', () => {
    expect(spellEconomy('Action')).toBe('action');
    expect(spellEconomy('1 action')).toBe('action');
    expect(spellEconomy('Bonus Action')).toBe('bonus');
    expect(spellEconomy('1 bonus action')).toBe('bonus');
    expect(spellEconomy('Reaction, which you take when you are hit by an attack roll')).toBe('reaction');
    expect(spellEconomy('1 hour')).toBeNull();
    expect(spellEconomy('10 minutes')).toBeNull();
    expect(spellEconomy(undefined)).toBeNull();
  });
});

describe('getTurnSpells', () => {
  const spells = [
    { id: 'a', name: 'Fireball', level: 3, castTime: 'Action' },
    { id: 'b', name: 'Fire Bolt', level: 0, castTime: 'Action' },
    { id: 'c', name: 'Burning Hands', level: '1', castTime: '1 action' },
    { id: 'd', name: 'Shield', level: 1, castingTime: 'Reaction, which you take when hit' },
    { id: 'e', name: 'Alarm', level: 1, castTime: '1 minute' },
  ];

  it('known casters get every combat spell, grouped and sorted cantrips first', () => {
    const out = getTurnSpells({ class: 'Sorcerer', level: 5, spells });
    expect(out.action.map(s => s.name)).toEqual(['Fire Bolt', 'Burning Hands', 'Fireball']);
    expect(out.reaction.map(s => s.name)).toEqual(['Shield']); // legacy castingTime read too
    expect(out.bonus).toEqual([]);
    expect(out.action[1].level).toBe(1); // string levels normalised
  });

  it('prepared casters only get prepared / always-prepared spells (cantrips always)', () => {
    const druid = {
      classes: [{ name: 'Druid', level: 3 }],
      spells: [
        { id: 'x', name: 'Shillelagh', level: 0, castTime: 'Bonus Action' },
        { id: 'y', name: 'Entangle', level: 1, castTime: 'Action', prepared: true },
        { id: 'z', name: 'Thunderwave', level: 1, castTime: 'Action', prepared: false },
        { id: 'w', name: 'Moonbeam', level: 2, castTime: 'Action', alwaysPrepared: true },
      ],
    };
    expect(getPreparedCasterInfo(druid)?.name).toBe('Druid');
    const out = getTurnSpells(druid);
    expect(out.action.map(s => s.name)).toEqual(['Entangle', 'Moonbeam']);
    expect(out.bonus.map(s => s.name)).toEqual(['Shillelagh']);
  });

  it('handles characters without spells', () => {
    expect(getTurnSpells({})).toEqual({ action: [], bonus: [], reaction: [] });
  });
});

describe('pickSlotPool', () => {
  const pools = [
    { id: '3', isSlot: true, slotLevel: 3, current: 1 },
    { id: '1', isSlot: true, slotLevel: 1, current: 0 },
    { id: '2', isSlot: true, slotLevel: 2, current: 2 },
    { id: 'ki', isSlot: false, current: 4 },
  ];
  it('picks the lowest slot level that can cast the spell and still has a slot', () => {
    expect(pickSlotPool(pools, 1).id).toBe('2'); // 1st is empty → upcast to 2nd
    expect(pickSlotPool(pools, 3).id).toBe('3');
    expect(pickSlotPool(pools, 4)).toBeNull();
  });
});
