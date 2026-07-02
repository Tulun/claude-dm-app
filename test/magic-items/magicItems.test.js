import { describe, it, expect } from 'vitest';
import { searchItems, sortItems, defaultMagicItems, RARITIES, ITEM_CATEGORIES } from '../../app/magic-items/magicItems.js';

const items = [
  { id: 'a', name: 'Bag of Holding', category: 'Wondrous', rarity: 'Uncommon', attunement: false, description: 'Holds a lot of stuff.' },
  { id: 'b', name: 'Cloak of Protection', category: 'Wondrous', rarity: 'Uncommon', attunement: true, description: '+1 to AC and saves.' },
  { id: 'c', name: 'Flame Tongue', category: 'Weapon', rarity: 'Rare', attunement: true, description: 'Fiery sword.', classes: ['Fighter', 'Paladin'] },
  { id: 'd', name: 'Potion of Healing', category: 'Potion', rarity: 'Common', attunement: false, description: 'Regain hit points.' },
];

describe('searchItems', () => {
  it('returns a copy of all items with no query or filters', () => {
    const result = searchItems('', {}, items);
    expect(result).toEqual(items);
    expect(result).not.toBe(items); // must not mutate/alias the input
  });

  it('matches name case-insensitively', () => {
    expect(searchItems('flame', {}, items).map(i => i.id)).toEqual(['c']);
  });

  it('matches description text', () => {
    expect(searchItems('hit points', {}, items).map(i => i.id)).toEqual(['d']);
  });

  it('filters by category and rarity', () => {
    expect(searchItems('', { category: 'Wondrous' }, items)).toHaveLength(2);
    expect(searchItems('', { rarity: 'Rare' }, items).map(i => i.id)).toEqual(['c']);
    expect(searchItems('', { category: 'All', rarity: 'All' }, items)).toHaveLength(4);
  });

  it('filters by class, treating classless items as usable by anyone', () => {
    const result = searchItems('', { classReq: 'Fighter' }, items);
    expect(result.map(i => i.id)).toEqual(['a', 'b', 'c', 'd']);
    const wizardResult = searchItems('', { classReq: 'Wizard' }, items);
    expect(wizardResult.map(i => i.id)).toEqual(['a', 'b', 'd']); // Flame Tongue excluded
  });

  it('filters by attunement in both directions', () => {
    expect(searchItems('', { attunement: true }, items).map(i => i.id)).toEqual(['b', 'c']);
    expect(searchItems('', { attunement: false }, items).map(i => i.id)).toEqual(['a', 'd']);
  });

  it('combines query and filters', () => {
    const result = searchItems('protection', { attunement: true }, items);
    expect(result.map(i => i.id)).toEqual(['b']);
  });

  it('defaults to an empty item list', () => {
    expect(searchItems('anything')).toEqual([]);
  });
});

describe('sortItems', () => {
  it('sorts by name ascending by default', () => {
    expect(sortItems(items).map(i => i.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('sorts by name descending', () => {
    expect(sortItems(items, 'name', 'desc').map(i => i.id)).toEqual(['d', 'c', 'b', 'a']);
  });

  it('sorts by rarity order, not alphabetically', () => {
    const sorted = sortItems(items, 'rarity');
    expect(sorted.map(i => i.rarity)).toEqual(['Common', 'Uncommon', 'Uncommon', 'Rare']);
  });

  it('sorts by category', () => {
    const sorted = sortItems(items, 'category');
    expect(sorted.map(i => i.category)).toEqual(['Potion', 'Weapon', 'Wondrous', 'Wondrous']);
  });

  it('does not mutate the input array', () => {
    const input = [...items];
    sortItems(input, 'name', 'desc');
    expect(input.map(i => i.id)).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('defaultMagicItems dataset integrity', () => {
  it('has unique ids', () => {
    const ids = defaultMagicItems.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only uses known categories and rarities', () => {
    for (const item of defaultMagicItems) {
      expect(ITEM_CATEGORIES).toContain(item.category);
      expect(RARITIES).toContain(item.rarity);
    }
  });

  it('every item has a name and description', () => {
    for (const item of defaultMagicItems) {
      expect(item.name).toBeTruthy();
      expect(item.description).toBeTruthy();
    }
  });
});
