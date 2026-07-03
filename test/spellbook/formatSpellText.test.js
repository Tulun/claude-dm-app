import { describe, it, expect } from 'vitest';
import { formatSpellText } from '../../app/spellbook/formatSpellText.js';

describe('formatSpellText', () => {
  it('escapes HTML so markup in descriptions cannot execute', () => {
    const out = formatSpellText('You cast a spell. <img src=x onerror="alert(1)"> End.');
    expect(out).not.toContain('<img');
    expect(out).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  });

  it('escapes script tags', () => {
    const out = formatSpellText('<script>alert("xss")</script>');
    expect(out).not.toContain('<script');
    expect(out).toContain('&lt;script&gt;');
  });

  it('still highlights area-of-effect keywords', () => {
    expect(formatSpellText('A 20-foot-radius Sphere of fire.'))
      .toContain('<span class="text-purple-400 font-semibold">Sphere</span>');
  });

  it('still highlights dice expressions', () => {
    expect(formatSpellText('Take 8d6 fire damage.'))
      .toContain('<span class="font-mono text-amber-300">8d6</span>');
  });

  it('still highlights ability names and saving throws', () => {
    const out = formatSpellText('Make a Dexterity saving throw.');
    expect(out).toContain('<span class="font-semibold">Dexterity</span>');
    expect(out).toContain('<span class="font-semibold">saving throw</span>');
  });

  it('escapes ampersands without breaking later highlighting', () => {
    const out = formatSpellText('Sword & Sphere');
    expect(out).toContain('&amp;');
    expect(out).toContain('<span class="text-purple-400 font-semibold">Sphere</span>');
  });

  it('leaves plain text untouched apart from highlighting', () => {
    expect(formatSpellText('Just a normal sentence.')).toBe('Just a normal sentence.');
  });
});
