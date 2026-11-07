import { describe, it, expect } from 'vitest';
import {
  parseAlignment, getInitiativeBonus, getLegendaryUses, splitDescription, splitList, xpForCr, profForCr,
  toEditForm, fromEditForm, sameTemplate, sourceLabel, isConfluxId, latestConfluxVersion, confluxChange, isOfficial, isFleeMortals, librarySection, bookLabel, defaultBook, splitLore,
  habitatsOf, compareHabitats,
} from '../../app/monsters/statBlock.js';
import { MM2024_HABITATS } from '../../app/data/monsterHabitats.js';
import { defaultEnemyTemplates } from '../../app/data/defaultEnemyTemplates.js';

const beholder = {
  id: 'mm-beholder', name: 'Beholder', size: 'Large', creatureType: 'Aberration', ac: 18, maxHp: 190,
  hitDice: '20d10+80', speed: '5, fly 40 (hover)', cr: '13', xp: 10000, profBonus: 5,
  str: 16, dex: 14, con: 18, int: 17, wis: 15, cha: 17, savingThrows: 'Con +9, Wis +7',
  vulnerabilities: '', immunities: 'Prone', senses: 'Darkvision 120 ft., Passive Perception 22', languages: 'Deep Speech',
  isNpc: false, source: 'mm',
  notes: 'Alignment: Lawful Evil. Initiative +12 (22). Legendary Action Uses: 3 (4 in Lair). Immediately after…',
  traits: [{ name: 'Legendary Resistance (3/Day)', description: 'Succeeds instead.' }],
  actions: [{ name: 'Bite', description: 'Melee Attack Roll: +8' }],
  legendaryActions: [{ name: 'Chomp', description: 'Two Bite attacks.' }],
};

describe('stat block display helpers', () => {
  it('reads alignment, initiative and legendary uses out of 2024 notes', () => {
    expect(parseAlignment(beholder.notes)).toBe('Lawful Evil');
    expect(getInitiativeBonus(beholder)).toBe(12);
    expect(getLegendaryUses(beholder)).toEqual({ uses: 3, lair: 4 });
  });

  it('prefers stored fields, then falls back to DEX / 3 uses', () => {
    expect(getInitiativeBonus({ ...beholder, initiativeBonus: 7 })).toBe(7);
    expect(getInitiativeBonus({ dex: 14 })).toBe(2);
    expect(getLegendaryUses({ legendaryActions: [{ name: 'X' }] })).toEqual({ uses: 3, lair: null });
    expect(getLegendaryUses({ legendaryActions: [{ name: 'X' }], legendaryActionUses: 2 })).toEqual({ uses: 2, lair: null });
    expect(getLegendaryUses({ legendaryActions: [] })).toBeNull();
  });

  it('turns numbered lines into list items with their own names', () => {
    const blocks = splitDescription('The beholder shoots a ray:\n1. Charm Ray. Wisdom Saving Throw: DC 16.\n2. Fear Ray. Failure: 14 (4d6).');
    expect(blocks).toEqual([
      { kind: 'p', text: 'The beholder shoots a ray:' },
      { kind: 'item', marker: '1', name: 'Charm Ray', text: 'Wisdom Saving Throw: DC 16.' },
      { kind: 'item', marker: '2', name: 'Fear Ray', text: 'Failure: 14 (4d6).' },
    ]);
    expect(splitDescription('Just one paragraph.')).toEqual([{ kind: 'p', text: 'Just one paragraph.' }]);
    expect(splitDescription('')).toEqual([]);
  });

  it('splits comma lists and labels sources', () => {
    expect(splitList('Perception +12, Stealth +6')).toEqual(['Perception +12', 'Stealth +6']);
    expect(sourceLabel(beholder)).toBe('Built-in');
    expect(sourceLabel({ id: 'tpl-1', source: 'custom' })).toBe('Custom');
    // Imported from an official book: not custom, even though it isn't built in.
    expect(sourceLabel({ id: 'imported-1', source: 'custom', book: 'MM 2024' })).toBe('Imported');
    expect(sourceLabel({ id: 'imported-1', book: 'Homebrew' })).toBe('Custom');
    expect(isOfficial({ id: 'imported-1', book: 'MM 2024' })).toBe(true);
    expect(isOfficial({ id: 'imported-1', book: ' homebrew ' })).toBe(false);
    expect(isOfficial({ id: 'imported-1' })).toBe(false);
    expect(isOfficial(beholder)).toBe(true);
    expect(isOfficial({ id: 'cc-x', book: 'MM 2024' })).toBe(false);
    expect(sourceLabel({ id: 'cc-aboleth' })).toBe('Conflux');
    // Flee Mortals (MCDM) is third-party: its own tab, not Official.
    const fm = { id: 'fm-angulotl-needler', source: 'custom', book: 'Flee Mortals' };
    expect(isOfficial(fm)).toBe(false);
    expect(isFleeMortals(fm)).toBe(true);
    expect(isFleeMortals({ id: 'tpl-1', book: ' flee mortals ' })).toBe(true);
    expect(isFleeMortals({ id: 'cc-x', book: 'Flee Mortals' })).toBe(false);
    expect(sourceLabel(fm)).toBe('Imported');
    expect(librarySection(fm)).toBe('fm');
    expect(librarySection(beholder)).toBe('official');
    expect(librarySection({ id: 'tpl-1', book: 'Homebrew' })).toBe('custom');
    expect(isConfluxId('cc-aboleth')).toBe(true);
    expect(isConfluxId('mm-aboleth')).toBe(false);
  });

  it('labels the source book: stored tag first, then the built-in edition', () => {
    // Beholder: untagged edition, but its notes are a 2024 stat block's.
    expect(bookLabel(beholder)).toBe('MM 2024');
    expect(bookLabel({ id: 'mm-orc', source: 'mm', notes: '' })).toBe('MM 2014');
    expect(bookLabel({ id: 'mm-orc', source: 'mm', initiativeBonus: 1 })).toBe('MM 2024');
    expect(bookLabel({ ...beholder, edition: '2024' })).toBe('MM 2024');
    expect(bookLabel({ ...beholder, book: ' VGtM ' })).toBe('VGtM');
    expect(bookLabel({ id: 'tpl-1', source: 'custom' })).toBeNull();
    expect(bookLabel({ id: 'tpl-1', source: 'custom', book: 'Homebrew' })).toBe('Homebrew');
    expect(defaultBook({ id: 'cc-aboleth', source: 'conflux' })).toBeNull();
  });

  it('splits lore into paragraphs with their headings', () => {
    const lore = 'A beholder is a floating orb of flesh.\n\nEyes of the Deep\nBeholders lair in caverns.\nThey hoard.\n\nTyrants\n\nEach believes itself supreme.';
    expect(splitLore(lore)).toEqual([
      { heading: null, text: 'A beholder is a floating orb of flesh.' },
      { heading: 'Eyes of the Deep', text: 'Beholders lair in caverns. They hoard.' },
      { heading: 'Tyrants', text: 'Each believes itself supreme.' },
    ]);
    expect(splitLore('')).toEqual([]);
    expect(splitLore(undefined)).toEqual([]);
  });

  it('knows standard XP and proficiency by CR', () => {
    expect(xpForCr('13')).toBe(10000);
    expect(xpForCr('1/4')).toBe(50);
    expect(xpForCr('weird')).toBeNull();
    expect(profForCr('1/2')).toBe(2);
    expect(profForCr('4')).toBe(2);
    expect(profForCr('5')).toBe(3);
    expect(profForCr('13')).toBe(5);
    expect(profForCr('30')).toBe(9);
  });
});

describe('edit form round trip', () => {
  it('an unchanged save is identical to the original (keeps built-in fingerprints intact)', () => {
    const saved = fromEditForm(toEditForm(beholder), beholder);
    expect(sameTemplate(saved, beholder)).toBe(true);
    expect('bonusActions' in saved).toBe(false);
    expect('initiativeBonus' in saved).toBe(false);
    expect('book' in saved).toBe(false);
    expect('lore' in saved).toBe(false);
  });

  it('stores an edited book and drops a cleared one', () => {
    expect(fromEditForm({ ...toEditForm(beholder), book: ' MM 2024 ' }, beholder).book).toBe('MM 2024');
    const tagged = { ...beholder, book: 'MM 2014' };
    expect(fromEditForm({ ...toEditForm(tagged), book: '' }, tagged).book).toBe('');
  });

  it('coerces numbers back and drops blank optional numbers', () => {
    const form = { ...toEditForm(beholder), ac: '19', xp: '11,500', speed: '30', initiativeBonus: '+12', legendaryActionUses: '' };
    const saved = fromEditForm(form, { ...beholder, legendaryActionUses: 3 });
    expect(saved.ac).toBe(19);
    expect(saved.xp).toBe(11500);
    expect(saved.speed).toBe(30);
    expect(saved.initiativeBonus).toBe(12);
    expect('legendaryActionUses' in saved).toBe(false);
  });

  it('keeps a text speed, trims names, and drops empty ability rows', () => {
    const form = { ...toEditForm(beholder), speed: '5, fly 40 (hover)', bonusActions: [{ name: '  Dash ', description: '' }, { name: '', description: '' }] };
    const saved = fromEditForm(form, beholder);
    expect(saved.speed).toBe('5, fly 40 (hover)');
    expect(saved.bonusActions).toEqual([{ name: 'Dash', description: '' }]);
  });

  it('does not mutate the original lists while editing', () => {
    const form = toEditForm(beholder);
    form.actions[0].name = 'Changed';
    expect(beholder.actions[0].name).toBe('Bite');
  });
});

describe('habitatsOf — 2024 Monster Manual habitats', () => {
  it('covers all 503 MM 2024 stat blocks; the "Any" list matches the book\'s Any Habitat table (65)', () => {
    expect(Object.keys(MM2024_HABITATS)).toHaveLength(503);
    const any = Object.keys(MM2024_HABITATS).filter(n => MM2024_HABITATS[n].includes('Any'));
    expect(any).toHaveLength(65);
    for (const n of ['Commoner', 'Crawling Claw', 'Homunculus', 'Priest Acolyte', 'Tough Boss', 'Lich', 'Colossus', 'Warrior Infantry']) {
      expect(any, n).toContain(n);
    }
  });

  it('every 2024 built-in gets habitats by name', () => {
    const srd = defaultEnemyTemplates.filter(t => t.edition === '2024');
    expect(srd.filter(t => habitatsOf(t).length === 0).map(t => t.name)).toEqual([]);
    expect(habitatsOf(srd.find(t => t.name === 'Pit Fiend'))).toEqual(['Planar (Nine Hells)']);
  });

  it('an MM 2024 import gets habitats by name (ignoring case/punctuation); other books get none', () => {
    expect(habitatsOf({ id: 'imported-1', name: 'violet fungus necrohulk', source: 'custom', book: 'MM 2024' }).length).toBeGreaterThan(0);
    expect(habitatsOf({ id: 'imported-2', name: 'Lich', source: 'custom', book: 'Homebrew' })).toEqual([]);
    expect(habitatsOf({ id: 'mm-orc', name: 'Orc', source: 'mm' })).toEqual([]); // MM 2014 built-in
    expect(habitatsOf({ id: 'cc-1', name: 'Lich', source: 'conflux' })).toEqual([]);
  });

  it('a monster keeps every habitat it is listed under, with the book-table corrections applied', () => {
    expect(MM2024_HABITATS['Troll']).toEqual(['Arctic', 'Forest', 'Hill', 'Mountain', 'Swamp', 'Underdark']);
    expect(MM2024_HABITATS['Ice Mephit']).toEqual(['Arctic', 'Planar (Elemental Planes)']);
    expect(MM2024_HABITATS['Plesiosaurus']).toEqual(['Coastal', 'Underwater']); // not Arctic
    expect(MM2024_HABITATS['Stone Giant']).toEqual(['Hill', 'Mountain', 'Underdark']);
  });

  it("a template's own habitats win over the lookup", () => {
    expect(habitatsOf({ id: 'tpl-1', name: 'Lich', book: 'MM 2024', habitats: ['Urban'] })).toEqual(['Urban']);
  });

  it('sorts Any first, then terrain, then planes', () => {
    expect(['Planar (Abyss)', 'Urban', 'Any', 'Forest'].sort(compareHabitats)).toEqual(['Any', 'Forest', 'Urban', 'Planar (Abyss)']);
  });
});

describe('Conflux release stamps', () => {
  it('latestConfluxVersion compares versions numerically', () => {
    expect(latestConfluxVersion([{ confluxAdded: '1.9' }, { confluxUpdated: '1.58' }, {}])).toBe('1.58');
    expect(latestConfluxVersion([{ confluxAdded: '1.58' }, { confluxAdded: '2.0' }])).toBe('2.0');
    expect(latestConfluxVersion([{}, null])).toBe(null);
  });

  it('confluxChange reports new / updated only for the given release', () => {
    expect(confluxChange({ confluxAdded: '1.58' }, '1.58')).toBe('new');
    expect(confluxChange({ confluxAdded: '1.50', confluxUpdated: '1.58' }, '1.58')).toBe('updated');
    expect(confluxChange({ confluxAdded: '1.50' }, '1.58')).toBe(null);
    expect(confluxChange({ confluxAdded: '1.58' }, null)).toBe(null);
  });
});
