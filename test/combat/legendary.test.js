import { describe, it, expect } from 'vitest';
import { getLegendaryCost, toggledLegendaryUsed } from '../../app/combat/legendary.js';

describe('getLegendaryCost', () => {
  it('reads the cost from the action name', () => {
    expect(getLegendaryCost({ name: 'Heal Self (3 Actions)' })).toBe(3);
    expect(getLegendaryCost({ name: 'Wing Attack (Costs 2 Actions)' })).toBe(2);
    expect(getLegendaryCost({ name: 'Shimmering Shield (2 actions)' })).toBe(2);
  });

  it('defaults to 1', () => {
    expect(getLegendaryCost({ name: 'Detect' })).toBe(1);
    expect(getLegendaryCost({})).toBe(1);
    expect(getLegendaryCost(undefined)).toBe(1);
  });
});

describe('toggledLegendaryUsed', () => {
  it('spends up through a fresh pip and un-spends back to a spent one', () => {
    expect(toggledLegendaryUsed(0, 0)).toBe(1);
    expect(toggledLegendaryUsed(0, 2)).toBe(3);
    expect(toggledLegendaryUsed(2, 0)).toBe(0);
    expect(toggledLegendaryUsed(2, 1)).toBe(1);
  });
});
