// Sanity checks on the built-in monster list (app/data/defaultEnemyTemplates.js)
// and on the combat helpers reading 2024 (SRD 5.2.1) stat-block text.
import { describe, it, expect } from 'vitest';
import { defaultEnemyTemplates } from '../../app/data/defaultEnemyTemplates.js';
import { PRIOR_DEFAULT_FINGERPRINTS } from '../../app/data/templateFingerprints.js';
import { parseSpellcasting } from '../../app/combat/components/CharacterCard/spellcastingParser.js';
import { splitStatText, sizeMatches, formatSpeeds, parseSavingThrows } from '../../app/combat/monsterAbilities.js';

const byName = (n) => defaultEnemyTemplates.find(t => t.name === n);
const srd = defaultEnemyTemplates.filter(t => t.edition === '2024');

describe('defaultEnemyTemplates', () => {
  it('has unique mm- ids', () => {
    const ids = defaultEnemyTemplates.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every(id => id.startsWith('mm-'))).toBe(true);
  });

  it('includes all 329 SRD 5.2.1 creatures with complete core stats', () => {
    expect(srd).toHaveLength(329);
    for (const t of srd) {
      for (const k of ['ac', 'maxHp', 'str', 'dex', 'con', 'int', 'wis', 'cha', 'xp', 'profBonus', 'initiativeBonus']) {
        expect(Number.isFinite(t[k]), `${t.name}.${k}`).toBe(true);
      }
      expect(t.cr, t.name).toBeTruthy();
      expect(t.senses, t.name).toMatch(/Passive Perception \d+/);
      expect(Array.isArray(t.actions), t.name).toBe(true);
    }
  });

  it('every attack roll carries a "Hit:" clause the turn panel can highlight', () => {
    for (const t of srd) {
      for (const a of [...t.actions, ...(t.bonusActions || []), ...(t.legendaryActions || [])]) {
        if (/Attack Roll:/.test(a.description)) expect(a.description, `${t.name} / ${a.name}`).toMatch(/Hit: /);
      }
    }
  });

  it('keeps every previously shipped id (saved encounters reference them)', () => {
    const ids = new Set(defaultEnemyTemplates.map(t => t.id));
    for (const id of Object.keys(PRIOR_DEFAULT_FINGERPRINTS)) expect(ids.has(id), id).toBe(true);
  });

  it('Hobgoblin Captain is the 2024 version: Multiattack mixes Greatsword and Longbow', () => {
    const hc = byName('Hobgoblin Captain');
    expect(hc).toMatchObject({ edition: '2024', ac: 17, maxHp: 58, hitDice: '9d8+18', initiativeBonus: 4 });
    expect(hc.actions[0].description).toBe('The hobgoblin makes two attacks, using Greatsword or Longbow in any combination.');
    const longbow = splitStatText(hc.actions.find(a => a.name === 'Longbow').description);
    expect(longbow.filter(s => s.kind).map(s => s.kind)).toEqual(['hit', 'damage', 'damage']);
  });

  it('2024 spellcasting text parses (DC, attack, at-will and per-day lists)', () => {
    const sc = parseSpellcasting(byName('Adult Red Dragon'));
    expect(sc.found).toBe(true);
    expect(sc.dc).toBe('20');
    expect(sc.attack).toBe('+12');
    expect(sc.atWill).toEqual(['Command (level 2 version)', 'Detect Magic', 'Scorching Ray']);
    expect(sc.perDay['1']).toEqual(['Fireball']);

    const mage = parseSpellcasting(byName('Mage'));
    expect(mage.perDay['2']).toEqual(['Fireball (level 4 version)', 'Invisibility']);
    expect(mage.perDay['1']).toEqual(['Cone of Cold', 'Fly']);
  });

  it('speeds and saves come through in the shapes the combat helpers read', () => {
    expect(formatSpeeds(byName('Adult Red Dragon').speed)).toEqual(['40 ft', 'climb 40 ft', 'fly 80 ft']);
    expect(parseSavingThrows(byName('Adult Red Dragon').savingThrows)).toEqual({ dex: 6, wis: 7 });
  });
});

describe('sizeMatches', () => {
  it('matches either size of a 2024 "Medium or Small" choice', () => {
    expect(sizeMatches('Medium or Small', ['Small'])).toBe(true);
    expect(sizeMatches('Medium or Small', ['Medium'])).toBe(true);
    expect(sizeMatches('Medium or Small', ['Large'])).toBe(false);
  });

  it('plain sizes match exactly, and no selection matches everything', () => {
    expect(sizeMatches('Large', ['Large'])).toBe(true);
    expect(sizeMatches('Large', ['Huge'])).toBe(false);
    expect(sizeMatches('Large', [])).toBe(true);
    expect(sizeMatches(undefined, [])).toBe(true);
  });
});
