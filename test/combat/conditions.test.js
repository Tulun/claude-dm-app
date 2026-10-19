import { describe, it, expect } from 'vitest';
import {
  CONDITIONS, getConditions, hasCondition, toggledConditions, withoutCondition,
  withExhaustionLevel, getExhaustionLevel, conditionLabel, getConditionInfo,
} from '../../app/combat/conditions.js';

describe('conditions helpers', () => {
  it('lists the 15 core conditions plus Concentrating', () => {
    expect(CONDITIONS).toHaveLength(16);
    expect(getConditionInfo('Prone').summary).toMatch(/half speed/);
    expect(getConditionInfo('Nope')).toBeNull();
  });

  it('getConditions tolerates missing data and legacy string entries', () => {
    expect(getConditions({})).toEqual([]);
    expect(getConditions({ conditions: 'Prone' })).toEqual([]);
    expect(getConditions({ conditions: ['Prone', { name: 'Poisoned' }, null, {}] })).toEqual([{ name: 'Prone' }, { name: 'Poisoned' }]);
  });

  it('toggles a condition on (appended) and off', () => {
    const c = { conditions: [{ name: 'Prone' }] };
    expect(toggledConditions(c, 'Poisoned')).toEqual([{ name: 'Prone' }, { name: 'Poisoned' }]);
    expect(toggledConditions(c, 'Prone')).toEqual([]);
    expect(hasCondition(c, 'Prone')).toBe(true);
    expect(withoutCondition(c, 'Prone')).toEqual([]);
  });

  it('Exhaustion starts at level 1 when toggled and is clamped 0..6 by the stepper', () => {
    expect(toggledConditions({}, 'Exhaustion')).toEqual([{ name: 'Exhaustion', level: 1 }]);
    const tired = { conditions: [{ name: 'Prone' }, { name: 'Exhaustion', level: 2 }, { name: 'Blinded' }] };
    expect(getExhaustionLevel(tired)).toBe(2);
    // keeps its position in the list
    expect(withExhaustionLevel(tired, 3)).toEqual([{ name: 'Prone' }, { name: 'Exhaustion', level: 3 }, { name: 'Blinded' }]);
    expect(withExhaustionLevel(tired, 9)[1].level).toBe(6);
    expect(withExhaustionLevel(tired, 0)).toEqual([{ name: 'Prone' }, { name: 'Blinded' }]);
    expect(withExhaustionLevel({}, 1)).toEqual([{ name: 'Exhaustion', level: 1 }]);
  });

  it('labels exhaustion with its level', () => {
    expect(conditionLabel({ name: 'Exhaustion', level: 2 })).toBe('Exhaustion 2');
    expect(conditionLabel({ name: 'Prone' })).toBe('Prone');
  });
});
