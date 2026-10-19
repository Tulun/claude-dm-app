import { describe, it, expect } from 'vitest';
import { compareInitiative } from '../../app/utils/rules';

const order = (list) => [...list].sort(compareInitiative).map((c) => c.name);

describe('compareInitiative', () => {
  it('orders by descending initiative', () => {
    expect(order([
      { name: 'a', initiative: 5 },
      { name: 'b', initiative: 18 },
      { name: 'c', initiative: 12 },
    ])).toEqual(['b', 'c', 'a']);
  });

  it('breaks ties by higher DEX score', () => {
    expect(order([
      { name: 'Braadlei', initiative: 5, dex: 12 },
      { name: 'Vesna', initiative: 5, dex: 16 },
      { name: 'Dragon', initiative: 5, dex: 10 },
    ])).toEqual(['Vesna', 'Braadlei', 'Dragon']);
  });

  it('lair action loses initiative ties, even to low DEX', () => {
    expect(order([
      { name: 'Lair', initiative: 20, isLairAction: true },
      { name: 'Slow', initiative: 20, dex: 3 },
    ])).toEqual(['Slow', 'Lair']);
  });

  it('missing DEX sorts after known DEX; full ties keep their order', () => {
    expect(order([
      { name: 'x', initiative: 7 },
      { name: 'y', initiative: 7, dex: 8 },
      { name: 'z', initiative: 7 },
    ])).toEqual(['y', 'x', 'z']);
  });

  it('accepts numeric strings and puts unparseable initiative last', () => {
    expect(order([
      { name: 'blank', initiative: '' },
      { name: 'str', initiative: '11' },
      { name: 'num', initiative: 3 },
    ])).toEqual(['str', 'num', 'blank']);
  });
});
