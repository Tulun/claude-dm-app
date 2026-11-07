import { describe, it, expect } from 'vitest';
import { groupMonsters, baseCreatureType, groupAnchorId, crToNumber, groupingKeysFor, GROUPING_KEYS } from '../../app/monsters/groupMonsters';

const m = (name, extra = {}) => ({ id: `tpl-${name}`, name, ...extra });

describe('groupMonsters', () => {
  it('groups by challenge rating in numeric order, fractions first, unknown last', () => {
    const groups = groupMonsters([
      m('Ogre', { cr: '2' }), m('Rat', { cr: '0' }), m('Bandit', { cr: '1/8' }),
      m('Dragon', { cr: '10' }), m('Goblin', { cr: '1/4' }), m('Mystery', { cr: '' }),
    ], 'cr');
    expect(groups.map(g => g.heading)).toEqual(['CR 0', 'CR 1/8', 'CR 1/4', 'CR 2', 'CR 10', 'CR unknown']);
  });

  it('groups by base creature type in book order, names alphabetical, unknown types under Other', () => {
    const groups = groupMonsters([
      m('Zombie', { creatureType: 'Undead' }), m('Wolf', { creatureType: 'Beast' }),
      m('Ape', { creatureType: 'Beast' }), m('Werewolf', { creatureType: 'Monstrosity (Shapechanger)' }),
      m('Thing', { creatureType: 'Blob' }),
    ], 'type');
    expect(groups.map(g => g.key)).toEqual(['Beast', 'Monstrosity', 'Undead', 'Other']);
    expect(groups[0].monsters.map(t => t.name)).toEqual(['Ape', 'Wolf']);
  });

  it('lists a monster under every habitat it has; Any first, no-habitat last', () => {
    const groups = groupMonsters([
      m('Frog', { habitats: ['Swamp', 'Forest'] }), m('Rat', { habitats: ['Any'] }), m('Homebrew Thing'),
    ], 'habitat');
    expect(groups.map(g => g.key)).toEqual(['Any', 'Forest', 'Swamp', 'No habitat listed']);
    expect(groups.find(g => g.key === 'Forest').monsters[0].name).toBe('Frog');
    expect(groups.find(g => g.key === 'Swamp').monsters[0].name).toBe('Frog');
  });

  it('groups by book with untagged entries last', () => {
    const groups = groupMonsters([m('A', { book: 'VGtM' }), m('B'), m('C', { book: 'MM 2024' })], 'book');
    expect(groups.map(g => g.key)).toEqual(['MM 2024', 'VGtM', 'No book']);
  });

  it('unknown grouping → no groups', () => {
    expect(groupMonsters([m('A')], 'nope')).toEqual([]);
  });

  it('helpers', () => {
    expect(baseCreatureType({ creatureType: 'Humanoid (Goblinoid)' })).toBe('Humanoid');
    expect(crToNumber('1/2')).toBe(0.5);
    expect(crToNumber('?')).toBeNull();
    expect(groupAnchorId('habitat', 'Planar (Abyss)')).toBe('monsters-habitat-planar-abyss');
  });
});

describe('groupMonsters — Conflux groups', () => {
  const grp = (name, order, section = 'Aberrations') => ({ name, order, section, cr: '1-20', url: `https://homebrewery.naturalcrit.com/share/${name}` });

  it('orders groups by catalog position, carries section / url / CR range, and sorts creatures by CR', () => {
    const groups = groupMonsters([
      m('Aboleth Overseer', { cr: '10', confluxGroups: [grp('Aboleths', 0)] }),
      m('Aboleth Hatchling', { cr: '1', confluxGroups: [grp('Aboleths', 0)] }),
      m('Grey Wolf', { cr: '1/4', confluxGroups: [grp('Wolves', 60, 'Beasts')] }),
      m('Ant Lion', { cr: '2', confluxGroups: [grp('Ants', 45, 'Beasts')] }),
      m('Stray Thing', { cr: '3' }),
    ], 'conflux');
    expect(groups.map(g => g.key)).toEqual(['Aboleths', 'Ants', 'Wolves', 'Ungrouped']);
    expect(groups[0]).toMatchObject({ section: 'Aberrations', crRange: '1-20', url: 'https://homebrewery.naturalcrit.com/share/Aboleths' });
    expect(groups[0].monsters.map(t => t.name)).toEqual(['Aboleth Hatchling', 'Aboleth Overseer']);
    expect(groups[3]).toMatchObject({ section: 'Ungrouped' });
    expect(groups[3].url).toBeUndefined();
  });

  it('lists a creature under every group it belongs to', () => {
    const groups = groupMonsters([m('Fighter Hero', { cr: '5', confluxGroups: [grp('2014 Fighters', 1), grp('2024 Fighters', 2)] })], 'conflux');
    expect(groups.map(g => g.key)).toEqual(['2014 Fighters', '2024 Fighters']);
  });

  it('is offered only on the Conflux tabs', () => {
    expect(groupingKeysFor(true)).toContain('conflux');
    expect(groupingKeysFor(false)).not.toContain('conflux');
    expect(groupingKeysFor(false)).toContain('habitat');
  });

  it('By Book is left off the Conflux tabs (no books) and single-book tabs', () => {
    expect(groupingKeysFor(false)).toContain('book');
    expect(groupingKeysFor(true)).toEqual(GROUPING_KEYS.filter(k => k !== 'book'));
    expect(groupingKeysFor(false, { singleBook: true })).toEqual(['habitat', 'type', 'cr']);
  });
});
