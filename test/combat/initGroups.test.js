import { describe, it, expect } from 'vitest';
import { initGroupOf, setEnemyInitiative, shareGroupInitiative, setOwnInitiative } from '../../app/combat/initGroups';

const goblins = () => [
  { id: 'g1', name: 'Goblin Boss 1', initiative: 12 },
  { id: 'g2', name: 'Goblin Boss 2', initiative: 12 },
  { id: 'h1', name: 'Hobgoblin Captain', initiative: 8 },
];
const inits = (list) => list.map(e => e.initiative);

describe('group initiative', () => {
  it('an edit moves the whole same-named group, nobody else', () => {
    expect(inits(setEnemyInitiative(goblins(), 'g2', 17))).toEqual([17, 17, 8]);
  });

  it('returns the same array when nothing changes', () => {
    const list = goblins();
    expect(setEnemyInitiative(list, 'g1', 12)).toBe(list);
    expect(shareGroupInitiative(list)).toBe(list);
  });

  it('newcomers take their family\'s first member\'s value', () => {
    const list = [...goblins(), { id: 'g3', name: 'Goblin Boss 3', initiative: 3 }];
    expect(inits(shareGroupInitiative(list))).toEqual([12, 12, 8, 12]);
  });

  it('a separated enemy keeps its value and edits no longer spread to or from it', () => {
    let list = setOwnInitiative(goblins(), 'g2', true);
    expect(list[1].ownInit).toBe(true);
    list = setEnemyInitiative(list, 'g2', 4);
    expect(inits(list)).toEqual([12, 4, 8]);
    list = setEnemyInitiative(list, 'g1', 15);
    expect(inits(list)).toEqual([15, 4, 8]);
    expect(initGroupOf(list, list[0]).map(e => e.id)).toEqual(['g1']);
    expect(inits(shareGroupInitiative(list))).toEqual([15, 4, 8]);
  });

  it('rejoining drops ownInit and takes the group\'s value', () => {
    let list = setEnemyInitiative(setOwnInitiative(goblins(), 'g2', true), 'g2', 4);
    list = setOwnInitiative(list, 'g2', false);
    expect('ownInit' in list[1]).toBe(false);
    expect(inits(list)).toEqual([12, 12, 8]);
  });
});
