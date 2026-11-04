import { describe, it, expect } from 'vitest';
import {
  parseAlignment, getInitiativeBonus, getLegendaryUses, splitDescription, splitList, xpForCr, profForCr,
  toEditForm, fromEditForm, sameTemplate, sourceLabel, isConfluxId,
} from '../../app/templates/statBlock.js';

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
    expect(sourceLabel(beholder)).toBe('Monster Manual');
    expect(sourceLabel({ id: 'tpl-1', source: 'custom' })).toBe('Custom');
    expect(sourceLabel({ id: 'cc-aboleth' })).toBe('Conflux');
    expect(isConfluxId('cc-aboleth')).toBe(true);
    expect(isConfluxId('mm-aboleth')).toBe(false);
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
