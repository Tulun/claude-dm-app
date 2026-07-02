import { describe, it, expect } from 'vitest';
import {
  crToNumber,
  XP_THRESHOLDS,
  DAILY_XP_BUDGET_2014,
  getDailyXPBudget,
  getDailyBudget2014,
} from '../../app/encounters/constants.js';

describe('crToNumber', () => {
  it('converts fractional CR strings', () => {
    expect(crToNumber('0')).toBe(0);
    expect(crToNumber('1/8')).toBe(0.125);
    expect(crToNumber('1/4')).toBe(0.25);
    expect(crToNumber('1/2')).toBe(0.5);
  });

  it('converts integer CR strings', () => {
    expect(crToNumber('1')).toBe(1);
    expect(crToNumber('10')).toBe(10);
    expect(crToNumber('30')).toBe(30);
  });

  it('falls back to 0 for junk input', () => {
    expect(crToNumber('')).toBe(0);
    expect(crToNumber(undefined)).toBe(0);
    expect(crToNumber('unknown')).toBe(0);
  });
});

describe('XP threshold tables', () => {
  it('covers levels 1 through 20', () => {
    for (let lvl = 1; lvl <= 20; lvl++) {
      expect(XP_THRESHOLDS[lvl]).toBeDefined();
      expect(XP_THRESHOLDS[lvl].low).toBeLessThan(XP_THRESHOLDS[lvl].moderate);
      expect(XP_THRESHOLDS[lvl].moderate).toBeLessThan(XP_THRESHOLDS[lvl].high);
      expect(DAILY_XP_BUDGET_2014[lvl]).toBeGreaterThan(0);
    }
  });

  it('thresholds are monotonically increasing with level', () => {
    for (let lvl = 2; lvl <= 20; lvl++) {
      expect(XP_THRESHOLDS[lvl].low).toBeGreaterThanOrEqual(XP_THRESHOLDS[lvl - 1].low);
      expect(XP_THRESHOLDS[lvl].high).toBeGreaterThanOrEqual(XP_THRESHOLDS[lvl - 1].high);
    }
  });
});

describe('getDailyXPBudget', () => {
  it('multiplies the per-character thresholds by party size', () => {
    expect(getDailyXPBudget(5, 4)).toEqual({ low: 2000, moderate: 3000, high: 4400 });
    expect(getDailyXPBudget(1, 1)).toEqual({ low: 50, moderate: 75, high: 100 });
  });

  it('falls back to level 5 thresholds for out-of-range levels', () => {
    expect(getDailyXPBudget(99, 2)).toEqual({ low: 1000, moderate: 1500, high: 2200 });
    expect(getDailyXPBudget(0, 2)).toEqual({ low: 1000, moderate: 1500, high: 2200 });
  });
});

describe('getDailyBudget2014', () => {
  it('multiplies the per-character budget by party size', () => {
    expect(getDailyBudget2014(5, 4)).toBe(14000);
    expect(getDailyBudget2014(20, 1)).toBe(40000);
  });

  it('falls back to level 5 for out-of-range levels', () => {
    expect(getDailyBudget2014(99, 2)).toBe(7000);
  });
});
