import { describe, it, expect } from 'vitest';
import { convertMonster, buildConflux, stripTags } from '../../scripts/convert-conflux.mjs';
import { parseSavingThrows } from '../../app/combat/monsterAbilities.js';

const raw = (over = {}) => ({
  name: 'Aboleth Lasher', source: 'ConfC', size: ['L'], type: 'Aberration', ac: [17],
  hp: { average: 135, formula: '18d10 + 36' }, str: 21, dex: 9, con: 15, int: 18, wis: 15, cha: 18,
  speed: { walk: 10, swim: 40 }, cr: '6',
  save: { str: '+5', dex: '+-1' }, skill: { perception: '+8' },
  languages: ['Deep Speech', 'Telepathy 120 ft. **XP**         :: 2', '300 {{bonus **Proficiency Bonus** +3}}'],
  senses: ['darkvision 120 ft.'],
  trait: [{ name: 'Amphibious', entries: ['The aboleth can breathe air and water.'] }],
  action: [{ name: 'Tentacle', entries: ['{@atkr m} {@hit 8} reach 10 ft. {@h}12 ({@damage 2d6 + 5}) bludgeoning damage.  {@dc 14} Con.'] }],
  ...over,
});

describe('convert-conflux: 5eTools → template', () => {
  it('maps the core stat block', () => {
    const t = convertMonster(raw());
    expect(t).toMatchObject({
      name: 'Aboleth Lasher', source: 'conflux', size: 'Large', creatureType: 'Aberration', ac: 17,
      maxHp: 135, hitDice: '18d10 + 36', speed: '10, swim 40', cr: '6', xp: 2300, profBonus: 3,
      senses: 'darkvision 120 ft.', skills: 'Perception +8',
    });
  });

  it('writes saving throws the combat card can parse (the old import wrote "STR ++5")', () => {
    const t = convertMonster(raw());
    expect(t.savingThrows).toBe('Str +5, Dex -1');
    expect(parseSavingThrows(t.savingThrows)).toEqual({ str: 5, dex: -1 });
  });

  it('drops the XP / proficiency text that leaks into languages', () => {
    expect(convertMonster(raw()).languages).toBe('Deep Speech, Telepathy 120 ft.');
  });

  it('turns inline tags into plain stat-block text', () => {
    expect(convertMonster(raw()).actions[0].description)
      .toBe('Attack: +8 reach 10 ft. Hit: 12 (2d6 + 5) bludgeoning damage. DC 14 Con.');
    expect(stripTags('{@link Grappled|https://x} and {@recharge 5}')).toBe('Grappled and (Recharge 5-6)');
  });

  it('folds condition immunities after damage immunities, and mythic actions into legendary', () => {
    const t = convertMonster(raw({
      immune: ['Fire', 'Poison'], conditionImmune: ['Charmed'],
      legendary: [{ name: 'Swipe', entries: ['x'] }], mythic: [{ name: 'Surge', entries: ['y'] }],
    }));
    expect(t.immunities).toBe('Fire, Poison; Charmed');
    expect(t.legendaryActions.map(a => a.name)).toEqual(['Swipe', 'Mythic: Surge']);
  });

  it('handles a missing CR, Colossal size and CR past 30', () => {
    expect(convertMonster(raw({ cr: undefined }))).toMatchObject({ cr: '0', xp: 10 });
    expect(convertMonster(raw({ size: ['C'] })).size).toBe('Gargantuan');
    expect(convertMonster(raw({ cr: '33' })).xp).toBe(215000);
  });
});

describe('convert-conflux: diffing against the previous import', () => {
  const prevOf = (m, extra = {}) => ({ id: `cc-${m.name.toLowerCase().replace(/\s+/g, '-')}`, ...convertMonster(m), ...extra });

  it('stamps new and changed creatures, keeps ids and earlier stamps', () => {
    const same = raw({ name: 'Same' });
    const changed = raw({ name: 'Changed' });
    const previous = [prevOf(same, { confluxAdded: '1.40' }), prevOf(changed)];
    const { creatures, report } = buildConflux(
      [same, { ...changed, ac: [18] }, raw({ name: 'Brand New' })], previous, '1.58');
    const byName = Object.fromEntries(creatures.map(c => [c.name, c]));
    expect(byName.Same).toMatchObject({ id: 'cc-same', confluxAdded: '1.40' });
    expect(byName.Same.confluxUpdated).toBeUndefined();
    expect(byName.Changed).toMatchObject({ id: 'cc-changed', confluxUpdated: '1.58', ac: 18 });
    expect(byName['Brand New']).toMatchObject({ id: 'cc-brand-new', confluxAdded: '1.58' });
    expect(report.added).toEqual(['Brand New']);
    expect(report.updated).toEqual(['Changed (ac)']);
  });

  it('formatting-only differences from older imports are not updates', () => {
    const m = raw({ name: 'Floaty', speed: { fly: 30 } });
    const legacy = { ...prevOf(m), speed: 'fly 30', savingThrows: 'STR ++5, DEX ++-1' };
    const { creatures } = buildConflux([{ ...m, mythic: [{ name: 'Surge', entries: ['y'] }] }], [legacy], '1.58');
    expect(creatures[0].confluxUpdated).toBeUndefined();
  });

  it('a renamed creature with the same core stats keeps its id', () => {
    const m = raw({ name: 'Fleshseeker Ghoul' });
    const { creatures, report } = buildConflux([{ ...m, name: 'Carrion Ghoul' }], [prevOf(m)], '1.58');
    expect(creatures[0]).toMatchObject({ id: 'cc-fleshseeker-ghoul', confluxRenamedFrom: 'Fleshseeker Ghoul', confluxUpdated: '1.58' });
    expect(report.renamed).toEqual(['Fleshseeker Ghoul → Carrion Ghoul']);
    expect(report.removed).toEqual([]);
  });

  it('duplicate names get unique ids', () => {
    const { creatures } = buildConflux([raw({ name: 'Twin' }), raw({ name: 'Twin', ac: [12] })], [], '1.58');
    expect(new Set(creatures.map(c => c.id)).size).toBe(2);
  });
});
