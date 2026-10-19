import { describe, it, expect } from 'vitest';
import { applyDamage, applyHealing } from '../../app/combat/hp';

const c = { id: 'p1', currentHp: 30, maxHp: 35, tempHp: 10 };

describe('applyDamage', () => {
  it('temp HP absorbs first, the rest comes off HP', () => {
    expect(applyDamage(c, 20)).toEqual({ ...c, tempHp: 0, currentHp: 20 });
  });
  it('damage under the THP pool only drains THP', () => {
    expect(applyDamage(c, 4)).toEqual({ ...c, tempHp: 6, currentHp: 30 });
  });
  it('HP floors at 0', () => {
    expect(applyDamage(c, 100)).toEqual({ ...c, tempHp: 0, currentHp: 0 });
  });
  it('works with no tempHp field', () => {
    expect(applyDamage({ currentHp: 7, maxHp: 7 }, 3)).toEqual({ currentHp: 4, maxHp: 7, tempHp: 0 });
  });
  it('returns the same object for 0 / junk / negative / no effect', () => {
    for (const amt of [0, '', 'abc', -5, undefined]) expect(applyDamage(c, amt)).toBe(c);
    const down = { currentHp: 0, maxHp: 10 };
    expect(applyDamage(down, 5)).toBe(down);
  });
  it('accepts numeric strings', () => {
    expect(applyDamage(c, '12').currentHp).toBe(28);
  });
});

describe('applyHealing', () => {
  it('heals up to max and leaves temp HP alone', () => {
    expect(applyHealing(c, 3)).toEqual({ ...c, currentHp: 33 });
    expect(applyHealing(c, 50)).toEqual({ ...c, currentHp: 35 });
  });
  it('heals from 0', () => {
    expect(applyHealing({ ...c, currentHp: 0 }, 8).currentHp).toBe(8);
  });
  it('returns the same object when nothing changes', () => {
    const full = { ...c, currentHp: 35 };
    expect(applyHealing(full, 5)).toBe(full);
    expect(applyHealing(c, 'x')).toBe(c);
  });
  it('never lowers HP that is already above max', () => {
    const over = { currentHp: 40, maxHp: 35 };
    expect(applyHealing(over, 5)).toBe(over);
  });
});
