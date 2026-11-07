import { describe, it, expect } from 'vitest';
import {
  getCasterLevel, getSpellSlots, getPactMagic, getSpellcastingLimits, spellListFor,
  spellcastingAbilityFor, isCasterClass, toCharacterSpell, byLevel,
} from '../../app/utils/spellcasting.js';

const c = (name, level, subclass = '') => ({ name, level, subclass });

describe('spell slots', () => {
  it('full casters follow the class table', () => {
    expect(getSpellSlots([c('Wizard', 1)])).toEqual({ 1: 2 });
    expect(getSpellSlots([c('Cleric', 5)])).toEqual({ 1: 4, 2: 3, 3: 2 });
    expect(getSpellSlots([c('Druid', 20)])).toEqual({ 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 });
  });

  it('a lone half caster gets slots from level 1 (2024) and rounds up', () => {
    expect(getSpellSlots([c('Paladin', 1)])).toEqual({ 1: 2 });
    expect(getSpellSlots([c('Ranger', 5)])).toEqual({ 1: 4, 2: 2 });
    expect(getSpellSlots([c('Paladin', 20)])).toEqual({ 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 });
  });

  it('a lone third caster matches the Eldritch Knight table', () => {
    expect(getSpellSlots([c('Fighter', 2)])).toEqual({});
    expect(getSpellSlots([c('Fighter', 3, 'Eldritch Knight')])).toEqual({ 1: 2 });
    expect(getSpellSlots([c('Fighter', 7, 'Eldritch Knight')])).toEqual({ 1: 4, 2: 2 });
    expect(getSpellSlots([c('Rogue', 19, 'Arcane Trickster')])).toEqual({ 1: 4, 2: 3, 3: 3, 4: 1 });
  });

  it('multiclass caster level: full + half rounded up + third rounded down', () => {
    expect(getCasterLevel([c('Wizard', 3), c('Paladin', 3)])).toBe(3 + 2);
    expect(getCasterLevel([c('Cleric', 1), c('Fighter', 5, 'Eldritch Knight')])).toBe(1 + 1);
    expect(getCasterLevel([c('Sorcerer', 2), c('Rogue', 3, 'Arcane Trickster')])).toBe(2 + 1);
  });

  it('warlocks and non-casters add nothing to shared slots', () => {
    expect(getSpellSlots([c('Warlock', 5)])).toEqual({});
    expect(getSpellSlots([c('Barbarian', 5)])).toEqual({});
    expect(getSpellSlots([c('Warlock', 3), c('Bard', 2)])).toEqual({ 1: 3 });
  });
});

describe('pact magic', () => {
  it('scales slots, slot level, and arcanum', () => {
    expect(getPactMagic(1)).toEqual({ slots: 1, slotLevel: 1, arcanum: [] });
    expect(getPactMagic(5)).toEqual({ slots: 2, slotLevel: 3, arcanum: [] });
    expect(getPactMagic(11)).toEqual({ slots: 3, slotLevel: 5, arcanum: [6] });
    expect(getPactMagic(20)).toEqual({ slots: 4, slotLevel: 5, arcanum: [6, 7, 8, 9] });
    expect(getPactMagic(0)).toBeNull();
  });
});

describe('spellcasting limits per class', () => {
  it('level-1 picks', () => {
    expect(getSpellcastingLimits(c('Cleric', 1))).toMatchObject({ list: 'Cleric', cantrips: 3, prepared: 4, maxSpellLevel: 1, ability: 'wis' });
    expect(getSpellcastingLimits(c('Wizard', 1))).toMatchObject({ cantrips: 3, prepared: 4, maxSpellLevel: 1, ability: 'int' });
    expect(getSpellcastingLimits(c('Sorcerer', 1))).toMatchObject({ cantrips: 4, prepared: 2 });
    expect(getSpellcastingLimits(c('Paladin', 1))).toMatchObject({ cantrips: 0, prepared: 2, maxSpellLevel: 1 });
    expect(getSpellcastingLimits(c('Warlock', 1))).toMatchObject({ cantrips: 2, prepared: 2, maxSpellLevel: 1 });
  });

  it('higher levels raise counts and spell level', () => {
    expect(getSpellcastingLimits(c('Bard', 10))).toMatchObject({ cantrips: 4, prepared: 15, maxSpellLevel: 5 });
    expect(getSpellcastingLimits(c('Warlock', 9))).toMatchObject({ maxSpellLevel: 5 });
    expect(getSpellcastingLimits(c('Ranger', 9))).toMatchObject({ maxSpellLevel: 3 });
  });

  it('subclass casters use the Wizard list', () => {
    const ek = getSpellcastingLimits(c('Fighter', 3, 'Eldritch Knight'));
    expect(ek).toMatchObject({ list: 'Wizard', cantrips: 2, prepared: 3, maxSpellLevel: 1, ability: 'int' });
    expect(spellListFor(c('Rogue', 3, 'Arcane Trickster'))).toBe('Wizard');
  });

  it('non-casters have no limits', () => {
    expect(getSpellcastingLimits(c('Barbarian', 5))).toBeNull();
    expect(getSpellcastingLimits(c('Fighter', 5, 'Champion'))).toBeNull();
    expect(isCasterClass(c('Monk', 3))).toBe(false);
    expect(spellcastingAbilityFor(c('Rogue', 3))).toBeNull();
  });
});

describe('helpers', () => {
  it('byLevel picks the highest threshold reached', () => {
    const t = [[1, 2], [4, 3], [10, 4]];
    expect(byLevel(1, t)).toBe(2);
    expect(byLevel(9, t)).toBe(3);
    expect(byLevel(20, t)).toBe(4);
  });

  it('toCharacterSpell maps castingTime → castTime and keeps the source id', () => {
    const sp = toCharacterSpell({ id: 'spell-x', name: 'X', level: 1, castingTime: 'Bonus Action', school: 'Evocation' }, { prepared: true });
    expect(sp).toMatchObject({ sourceId: 'spell-x', name: 'X', castTime: 'Bonus Action', prepared: true });
    expect(sp.id).toMatch(/^spell-/);
    expect(sp).not.toHaveProperty('castingTime');
  });
});
