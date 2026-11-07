import { describe, it, expect } from 'vitest';
import { getDefaultResources, applyResourceEdits } from '../../app/characters/creation/classResources.js';

const scores = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 16 };
const ctx = (classes, extra = {}) => ({
  classes: classes.map(([name, level, subclass = '']) => ({ name, level, subclass })),
  totalLevel: classes.reduce((s, [, l]) => s + l, 0),
  scores,
  species: '',
  lineage: '',
  feats: [],
  ...extra,
});
const table = (list) => Object.fromEntries(list.map(r => [r.name, r.max]));

describe('default resources', () => {
  it('level-1 fighter: Second Wind only', () => {
    expect(table(getDefaultResources(ctx([['Fighter', 1]])))).toEqual({ 'Second Wind': 2 });
  });

  it('class features scale with class level', () => {
    expect(table(getDefaultResources(ctx([['Fighter', 17]])))).toEqual({ 'Second Wind': 4, 'Action Surge': 2, Indomitable: 3 });
    expect(table(getDefaultResources(ctx([['Barbarian', 6]])))).toEqual({ Rage: 4 });
    expect(table(getDefaultResources(ctx([['Druid', 6]])))['Wild Shape']).toBe(3);
    expect(table(getDefaultResources(ctx([['Druid', 16]])))['Wild Shape']).toBe(3);
    expect(table(getDefaultResources(ctx([['Druid', 17]])))['Wild Shape']).toBe(4);
    expect(table(getDefaultResources(ctx([['Paladin', 11]])))).toMatchObject({ 'Lay on Hands (HP pool)': 55, 'Channel Divinity': 3 });
    expect(table(getDefaultResources(ctx([['Monk', 1]])))).toEqual({});
    expect(table(getDefaultResources(ctx([['Monk', 5]])))).toEqual({ 'Focus Points': 5 });
  });

  it('Bardic Inspiration uses CHA and recharges on a short rest from level 5', () => {
    const lvl1 = getDefaultResources(ctx([['Bard', 1]])).find(r => r.name === 'Bardic Inspiration');
    const lvl5 = getDefaultResources(ctx([['Bard', 5]])).find(r => r.name === 'Bardic Inspiration');
    expect(lvl1).toMatchObject({ max: 3, recharge: 'Long Rest' });
    expect(lvl5.recharge).toBe('Short or Long Rest');
  });

  it('spell slots use the names the combat tracker spends', () => {
    const rows = getDefaultResources(ctx([['Wizard', 3]]));
    expect(rows.map(r => r.name)).toEqual(['Arcane Recovery', '1st Level Spell Slots', '2nd Level Spell Slots']);
    expect(table(rows)).toMatchObject({ '1st Level Spell Slots': 4, '2nd Level Spell Slots': 2 });
  });

  it('a lone warlock gets standard-named pact slots and arcanum', () => {
    const rows = getDefaultResources(ctx([['Warlock', 11]]));
    expect(table(rows)).toMatchObject({ '5th Level Spell Slots': 3, 'Magical Cunning': 1, 'Mystic Arcanum (6th level)': 1 });
    expect(rows.find(r => r.key === 'pact').recharge).toBe('Short or Long Rest');
  });

  it('a multiclass warlock keeps pact slots apart from shared slots', () => {
    const rows = getDefaultResources(ctx([['Sorcerer', 3], ['Warlock', 2]]));
    expect(table(rows)).toMatchObject({
      '1st Level Spell Slots': 4, '2nd Level Spell Slots': 2,
      'Pact Magic Slots (1st level)': 2, 'Sorcery Points': 3, 'Innate Sorcery': 2,
    });
  });

  it('same-named resources from two classes are labelled by class', () => {
    const names = getDefaultResources(ctx([['Cleric', 2], ['Paladin', 3]])).map(r => r.name);
    expect(names).toContain('Channel Divinity (Cleric)');
    expect(names).toContain('Channel Divinity (Paladin)');
  });

  it('adds species and feat resources scaled by proficiency bonus', () => {
    const rows = getDefaultResources(ctx([['Rogue', 5]], { species: 'Goliath', lineage: "Stone's Endurance", feats: ['Lucky'] }));
    expect(table(rows)).toEqual({ "Giant Ancestry: Stone's Endurance": 3, 'Large Form': 1, 'Luck Points': 3 });
  });
});

describe('applyResourceEdits', () => {
  it('overlays edits by key and appends custom rows', () => {
    const defaults = getDefaultResources(ctx([['Fighter', 2]]));
    const rows = applyResourceEdits(defaults, { 'Fighter:Action Surge': { max: 2 }, 'Fighter:Second Wind': { removed: true } }, [{ key: 'c1', name: 'Battle Cry', max: 1 }]);
    expect(rows.map(r => [r.name, r.max, !!r.removed])).toEqual([
      ['Second Wind', 2, true],
      ['Action Surge', 2, false],
      ['Battle Cry', 1, false],
    ]);
    expect(rows[2].source).toBe('Custom');
  });
});
