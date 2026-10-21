import { describe, it, expect } from 'vitest';
import { numberEnemies, baseName } from '../../app/combat/enemyNames';

const named = (...names) => names.map((name, i) => ({ id: `e${i}`, name }));
const names = (list) => numberEnemies(list).map(e => e.name);

describe('numberEnemies', () => {
  it('numbers a family once it has two members', () => {
    expect(names(named('Goblin Boss', 'Goblin Boss'))).toEqual(['Goblin Boss 1', 'Goblin Boss 2']);
  });

  it('leaves lone and already-unique names alone, returning the same array', () => {
    const list = named('Ogre', 'Goblin 1', 'Goblin 2');
    expect(numberEnemies(list)).toBe(list);
  });

  it('a newcomer to a numbered family takes the next free number', () => {
    expect(names(named('Goblin 1', 'Goblin 3', 'Goblin'))).toEqual(['Goblin 1', 'Goblin 3', 'Goblin 2']);
  });

  it('a second batch numbered from 1 again gets renumbered past the first', () => {
    expect(names(named('Goblin 1', 'Goblin 2', 'Goblin 1', 'Goblin 2'))).toEqual(['Goblin 1', 'Goblin 2', 'Goblin 3', 'Goblin 4']);
  });

  it('an unnumbered original joined by a copy becomes number 1', () => {
    expect(names(named('Ogre', 'Ogre 2'))).toEqual(['Ogre 1', 'Ogre 2']);
  });

  it('only renamed enemies are new objects', () => {
    const list = named('Ogre', 'Goblin', 'Goblin');
    const out = numberEnemies(list);
    expect(out[0]).toBe(list[0]);
    expect(out[1]).not.toBe(list[1]);
  });

  it('baseName strips a trailing number', () => {
    expect(baseName('Goblin Boss 12')).toBe('Goblin Boss');
    expect(baseName('Goblin Boss')).toBe('Goblin Boss');
  });
});
