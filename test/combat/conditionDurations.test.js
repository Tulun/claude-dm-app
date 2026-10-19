import { describe, it, expect } from 'vitest';
import {
  END_OF_NEXT_TURN, END_OF_THIS_TURN, applyTurnChange, durationLabel, endOfTurnSaveConditions,
  expireConditionsAtTurnEnd, tickConditionsAtTurnStart, toggledConditions, withConditionDuration,
} from '../../app/combat/conditions';

const who = (conditions, id = 'x') => ({ id, name: 'X', conditions });

describe('condition durations — setting', () => {
  it('sets, changes and clears a round count, keeping list order', () => {
    const c = who([{ name: 'Prone' }, { name: 'Frightened' }]);
    expect(withConditionDuration(c, 'Frightened', 3)).toEqual([{ name: 'Prone' }, { name: 'Frightened', rounds: 3 }]);
    expect(withConditionDuration(c, 'Frightened', '10')).toEqual([{ name: 'Prone' }, { name: 'Frightened', rounds: 10 }]);
    const timed = who([{ name: 'Frightened', rounds: 3 }]);
    expect(withConditionDuration(timed, 'Frightened', null)).toEqual([{ name: 'Frightened' }]);
    expect(withConditionDuration(timed, 'Frightened', 0)).toEqual([{ name: 'Frightened' }]);
  });

  it('switches between rounds and until-end-of-next-turn without leaving both keys', () => {
    const c = who([{ name: 'Stunned', rounds: 2 }]);
    const eont = withConditionDuration(c, 'Stunned', END_OF_NEXT_TURN);
    expect(eont).toEqual([{ name: 'Stunned', until: END_OF_NEXT_TURN }]);
    expect(withConditionDuration(who(eont), 'Stunned', 4)).toEqual([{ name: 'Stunned', rounds: 4 }]);
  });

  it('ignores Exhaustion and conditions the combatant does not have', () => {
    const c = who([{ name: 'Exhaustion', level: 2 }]);
    expect(withConditionDuration(c, 'Exhaustion', 3)).toEqual([{ name: 'Exhaustion', level: 2 }]);
    expect(withConditionDuration(c, 'Prone', 3)).toEqual([{ name: 'Exhaustion', level: 2 }]);
  });

  it('re-toggling a condition drops its old duration', () => {
    const c = who([{ name: 'Prone', rounds: 3 }]);
    const off = who(toggledConditions(c, 'Prone'));
    expect(toggledConditions(off, 'Prone')).toEqual([{ name: 'Prone' }]);
  });

  it('labels remaining time for the chip', () => {
    expect(durationLabel({ name: 'Prone' })).toBe('');
    expect(durationLabel({ name: 'Prone', rounds: 3 })).toBe('3r');
    expect(durationLabel({ name: 'Prone', until: END_OF_NEXT_TURN })).toBe('next turn');
    expect(durationLabel({ name: 'Prone', until: END_OF_THIS_TURN })).toBe('this turn');
  });
});

describe('condition durations — ticking', () => {
  it('counts rounds down at turn start and expires them at zero', () => {
    const c = who([{ name: 'Frightened', rounds: 2 }, { name: 'Stunned', rounds: 1 }, { name: 'Prone' }]);
    const r = tickConditionsAtTurnStart(c);
    expect(r.conditions).toEqual([{ name: 'Frightened', rounds: 1 }, { name: 'Prone' }]);
    expect(r.expired).toEqual(['Stunned']);
  });

  it('until-end-of-next-turn survives the turn start and expires at that turn\'s end', () => {
    const c = who([{ name: 'Blinded', until: END_OF_NEXT_TURN }]);
    const started = tickConditionsAtTurnStart(c);
    expect(started).toEqual({ conditions: [{ name: 'Blinded', until: END_OF_THIS_TURN }], expired: [] });
    // the turn it was applied in ending does nothing — only 'this turn' ends
    expect(expireConditionsAtTurnEnd(c).expired).toEqual([]);
    const ended = expireConditionsAtTurnEnd(who(started.conditions));
    expect(ended).toEqual({ conditions: [], expired: ['Blinded'] });
  });

  it('untimed conditions are untouched — same array identity, nothing expired', () => {
    const conditions = [{ name: 'Prone' }, { name: 'Exhaustion', level: 2 }];
    const c = who(conditions);
    expect(tickConditionsAtTurnStart(c).conditions).toBe(conditions);
    expect(expireConditionsAtTurnEnd(c).conditions).toBe(conditions);
    expect(applyTurnChange(c, 'x', 'x').combatant).toBe(c);
    // and a combatant with no conditions at all
    const bare = { id: 'y', name: 'Y' };
    expect(applyTurnChange(bare, 'y', 'y').combatant).toBe(bare);
  });

  it('applyTurnChange only touches the ending and starting combatants', () => {
    const ending = who([{ name: 'Blinded', until: END_OF_THIS_TURN }], 'a');
    const starting = who([{ name: 'Charmed', rounds: 1 }], 'b');
    const bystander = who([{ name: 'Prone', rounds: 1 }], 'c');
    expect(applyTurnChange(ending, 'a', 'b')).toEqual({ combatant: { ...ending, conditions: [] }, expired: ['Blinded'] });
    expect(applyTurnChange(starting, 'a', 'b')).toEqual({ combatant: { ...starting, conditions: [] }, expired: ['Charmed'] });
    expect(applyTurnChange(bystander, 'a', 'b').combatant).toBe(bystander);
  });

  it('a lone combatant ends then starts its own turn in one change', () => {
    const solo = who([{ name: 'Blinded', until: END_OF_THIS_TURN }, { name: 'Prone', rounds: 2 }], 's');
    expect(applyTurnChange(solo, 's', 's')).toEqual({
      combatant: { ...solo, conditions: [{ name: 'Prone', rounds: 1 }] },
      expired: ['Blinded'],
    });
  });

  it('lists still-active conditions that usually allow an end-of-turn save', () => {
    const c = who([{ name: 'Prone' }, { name: 'Stunned', rounds: 2 }, { name: 'Poisoned' }, 'Charmed']);
    expect(endOfTurnSaveConditions(c)).toEqual(['Stunned', 'Poisoned', 'Charmed']);
    expect(endOfTurnSaveConditions({})).toEqual([]);
  });
});
