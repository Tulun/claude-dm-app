import { describe, it, expect } from 'vitest';
import { parseSpellcasting } from '../../app/combat/components/CharacterCard/spellcastingParser.js';

const archmageDesc =
  'The archmage is an 18th-level spellcaster. Its spellcasting ability is Intelligence ' +
  '(spell save DC 17, +9 to hit with spell attacks)';

describe('parseSpellcasting', () => {
  it('returns found=false for a character with no spellcasting', () => {
    const result = parseSpellcasting({
      traits: [{ name: 'Keen Smell', description: 'Advantage on smell checks.' }],
      actions: [{ name: 'Bite', description: 'Melee attack: +4 to hit.' }],
    });
    expect(result.found).toBe(false);
    expect(result.dc).toBeNull();
    expect(result.atWill).toEqual([]);
  });

  it('handles a character with no traits/actions/notes at all', () => {
    const result = parseSpellcasting({});
    expect(result.found).toBe(false);
  });

  it('finds spellcasting in traits and extracts DC and attack bonus', () => {
    const result = parseSpellcasting({
      traits: [{ name: 'Spellcasting', description: archmageDesc }],
    });
    expect(result.found).toBe(true);
    expect(result.source).toBe('trait');
    expect(result.dc).toBe('17');
    expect(result.attack).toBe('+9');
    expect(result.notes).toBe(archmageDesc);
  });

  it('finds spellcasting in actions', () => {
    const result = parseSpellcasting({
      actions: [{ name: 'Spellcasting', description: 'Spell save DC 13.' }],
    });
    expect(result.found).toBe(true);
    expect(result.source).toBe('action');
    expect(result.dc).toBe('13');
  });

  it('matches Innate Spellcasting trait names', () => {
    const result = parseSpellcasting({
      traits: [{ name: 'Innate Spellcasting', description: 'Spell save DC 16.' }],
    });
    expect(result.found).toBe(true);
    expect(result.dc).toBe('16');
  });

  it('prefers traits over actions (first match wins)', () => {
    const result = parseSpellcasting({
      traits: [{ name: 'Spellcasting', description: 'Spell save DC 11.' }],
      actions: [{ name: 'Spellcasting', description: 'Spell save DC 19.' }],
    });
    expect(result.dc).toBe('11');
    expect(result.source).toBe('trait');
  });

  it('parses cantrips lists', () => {
    const result = parseSpellcasting({
      traits: [{
        name: 'Spellcasting',
        description: 'Cantrips (at will): fire bolt, light, mage hand, prestidigitation.',
      }],
    });
    expect(result.cantrips).toEqual(['fire bolt', 'light', 'mage hand', 'prestidigitation']);
    // Quirk: the "(at will)" in the cantrip header also populates atWill.
    expect(result.atWill).toEqual(['fire bolt', 'light', 'mage hand', 'prestidigitation']);
  });

  it('parses at-will spell lists', () => {
    const result = parseSpellcasting({
      traits: [{
        name: 'Innate Spellcasting',
        description: 'At will: detect magic, misty step.',
      }],
    });
    expect(result.atWill).toEqual(['detect magic', 'misty step']);
  });

  it('parses X/day groups and merges duplicates', () => {
    const result = parseSpellcasting({
      traits: [{
        name: 'Innate Spellcasting',
        description: '3/day each: counterspell, fly. 1/day each: dominate monster, plane shift.',
      }],
    });
    expect(result.perDay['3']).toEqual(['counterspell', 'fly']);
    expect(result.perDay['1']).toEqual(['dominate monster', 'plane shift']);
  });

  it('parses spell slot levels in the "1st (4 slots):" format', () => {
    const result = parseSpellcasting({
      traits: [{
        name: 'Spellcasting',
        description: '1st (4 slots): detect magic, shield. 2nd (3 slots): misty step.',
      }],
    });
    expect(result.slots['1st']).toEqual({ slots: 4, spells: ['detect magic', 'shield'] });
    expect(result.slots['2nd']).toEqual({ slots: 3, spells: ['misty step'] });
  });

  it('parses the Monster Manual "1st level (4 slots):" format', () => {
    const result = parseSpellcasting({
      traits: [{
        name: 'Spellcasting',
        description: '1st level (4 slots): detect magic, shield. 3rd level (2 slots): fireball.',
      }],
    });
    expect(result.slots['1st']).toEqual({ slots: 4, spells: ['detect magic', 'shield'] });
    expect(result.slots['3rd']).toEqual({ slots: 2, spells: ['fireball'] });
  });

  it('parses a combined (DC X, +Y) header', () => {
    const result = parseSpellcasting({
      traits: [{ name: 'Spellcasting', description: 'Wisdom (DC 14, +6).' }],
    });
    expect(result.dc).toBe('14');
    expect(result.attack).toBe('+6');
  });

  it('falls back to notes when no trait/action matches', () => {
    const result = parseSpellcasting({
      traits: [],
      actions: [],
      notes: 'Spell save DC 13. At will: minor illusion.',
    });
    expect(result.found).toBe(true);
    expect(result.source).toBe('notes');
    expect(result.dc).toBe('13');
    expect(result.atWill).toEqual(['minor illusion']);
  });

  it('ignores notes without spellcasting keywords', () => {
    const result = parseSpellcasting({ notes: 'Just a big angry bear.' });
    expect(result.found).toBe(false);
  });
});
