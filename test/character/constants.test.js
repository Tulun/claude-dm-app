import { describe, it, expect } from 'vitest';
import {
  getMod,
  formatMod,
  getTotalLevel,
  formatClasses,
  getProfBonus,
  getSkillProficiency,
  getSkillProficiencySource,
  SKILLS,
} from '../../app/character/components/constants.js';

describe('getMod (character sheet variant)', () => {
  // NOTE: unlike the combat-card getMod, this one returns a NUMBER, not a string.
  it('returns a number', () => {
    expect(getMod(10)).toBe(0);
    expect(getMod(16)).toBe(3);
    expect(getMod(8)).toBe(-1);
    expect(getMod('20')).toBe(5);
  });

  it('defaults missing scores to 10', () => {
    expect(getMod(undefined)).toBe(0);
    expect(getMod('junk')).toBe(0);
  });
});

describe('formatMod', () => {
  it('prefixes non-negative mods with +', () => {
    expect(formatMod(0)).toBe('+0');
    expect(formatMod(3)).toBe('+3');
    expect(formatMod(-2)).toBe('-2');
  });
});

describe('getTotalLevel', () => {
  it('sums multiclass levels', () => {
    const character = { classes: [{ name: 'Fighter', level: 5 }, { name: 'Wizard', level: '3' }] };
    expect(getTotalLevel(character)).toBe(8);
  });

  it('falls back to the legacy level field', () => {
    expect(getTotalLevel({ level: '7' })).toBe(7);
  });

  it('returns 0 with no level info', () => {
    expect(getTotalLevel({})).toBe(0);
    expect(getTotalLevel(undefined)).toBe(0);
  });

  it('ignores classes entries with junk levels', () => {
    const character = { classes: [{ name: 'Fighter', level: 5 }, { name: 'Wizard', level: 'x' }] };
    expect(getTotalLevel(character)).toBe(5);
  });
});

describe('formatClasses', () => {
  it('formats a multiclass character', () => {
    const character = {
      classes: [
        { name: 'Fighter', level: 5 },
        { name: 'Wizard', level: 3, subclass: 'Evoker' },
      ],
    };
    expect(formatClasses(character)).toBe('Fighter 5 / Evoker Wizard 3');
  });

  it('formats a legacy single-class character', () => {
    expect(formatClasses({ class: 'Rogue', level: 4 })).toBe('Rogue 4');
    expect(formatClasses({ class: 'Rogue', level: 4, subclass: 'Thief' })).toBe('Thief Rogue 4');
  });

  it('defaults legacy characters without a level to 1', () => {
    expect(formatClasses({ class: 'Rogue' })).toBe('Rogue 1');
  });

  it('shows CR for monsters', () => {
    expect(formatClasses({ cr: '1/2' })).toBe('CR 1/2');
  });

  it('returns empty string with nothing to show', () => {
    expect(formatClasses({})).toBe('');
    expect(formatClasses(undefined)).toBe('');
  });
});

describe('getProfBonus (character sheet variant)', () => {
  it('uses total multiclass level', () => {
    expect(getProfBonus({ classes: [{ name: 'Fighter', level: 3 }, { name: 'Rogue', level: 2 }] })).toBe(3);
  });

  it('scales with single-class level', () => {
    expect(getProfBonus({ level: 1 })).toBe(2);
    expect(getProfBonus({ level: 5 })).toBe(3);
    expect(getProfBonus({ level: 9 })).toBe(4);
    expect(getProfBonus({ level: 13 })).toBe(5);
    expect(getProfBonus({ level: 17 })).toBe(6);
  });

  it('handles CR-based monsters', () => {
    expect(getProfBonus({ cr: '1/4' })).toBe(2);
    expect(getProfBonus({ cr: '5' })).toBe(3);
    expect(getProfBonus({ cr: '13' })).toBe(5);
    expect(getProfBonus({ cr: '17' })).toBe(6);
    expect(getProfBonus({ cr: '21' })).toBe(7);
    // Consolidated with the shared rules table: CR 25-28 → +8, CR 29+ → +9.
    // (This variant previously capped at +7 — that was a bug.)
    expect(getProfBonus({ cr: '25' })).toBe(8);
    expect(getProfBonus({ cr: '30' })).toBe(9);
  });

  it('defaults to 2', () => {
    expect(getProfBonus({})).toBe(2);
  });
});

describe('getSkillProficiency', () => {
  it('returns manual proficiency and expertise first', () => {
    expect(getSkillProficiency({ skillProficiencies: { Stealth: 1 } }, 'Stealth')).toBe(1);
    expect(getSkillProficiency({ skillProficiencies: { Stealth: 2 } }, 'Stealth')).toBe(2);
  });

  it('grants proficiency from background skills', () => {
    expect(getSkillProficiency({ background: 'Acolyte' }, 'Religion')).toBe(1);
    expect(getSkillProficiency({ background: 'Acolyte' }, 'Stealth')).toBe(0);
  });

  it('manual expertise overrides background proficiency', () => {
    const character = { background: 'Acolyte', skillProficiencies: { Religion: 2 } };
    expect(getSkillProficiency(character, 'Religion')).toBe(2);
  });

  it('grants proficiency from the Skilled feat selections', () => {
    expect(getSkillProficiency({ skilledFeatSkills: ['Arcana'] }, 'Arcana')).toBe(1);
  });

  it('returns 0 for untrained skills', () => {
    expect(getSkillProficiency({}, 'Athletics')).toBe(0);
  });
});

describe('getSkillProficiencySource', () => {
  it('labels each source correctly', () => {
    expect(getSkillProficiencySource({ skillProficiencies: { Stealth: 2 } }, 'Stealth')).toBe('Expertise');
    expect(getSkillProficiencySource({ skillProficiencies: { Stealth: 1 } }, 'Stealth')).toBe('Manual');
    expect(getSkillProficiencySource({ background: 'Acolyte' }, 'Insight')).toBe('Background (Acolyte)');
    expect(getSkillProficiencySource({ skilledFeatSkills: ['Arcana'] }, 'Arcana')).toBe('Skilled Feat');
    expect(getSkillProficiencySource({}, 'Arcana')).toBeNull();
  });
});

describe('SKILLS table', () => {
  it('contains the 18 standard skills each mapped to a stat', () => {
    expect(SKILLS).toHaveLength(18);
    const validStats = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    for (const skill of SKILLS) {
      expect(validStats).toContain(skill.stat);
    }
  });
});
