// Tests for app/dm/components/vaultUtils.js — pure grouping/sorting helpers
// behind the DM Campaign dashboard.

import { describe, it, expect } from 'vitest';
import {
  displayFolder,
  numericPrefix,
  sortSessionNotes,
  sessionNotes,
  recentNotes,
  groupNotes,
  duplicateFolderSets,
  searchNotes,
  formatRelativeTime,
  ROOT_GROUP,
} from '../../app/dm/components/vaultUtils.js';

const note = (path, mtime = 0, excerpt = '') => {
  const parts = path.split('/');
  return {
    path,
    name: parts[parts.length - 1].replace(/\.md$/, ''),
    folder: parts.length > 1 ? parts[0] : '',
    dir: parts.slice(0, -1).join('/'),
    mtime,
    excerpt,
  };
};

describe('displayFolder', () => {
  it('merges sync-duplicate folders by stripping a trailing number', () => {
    expect(displayFolder('Locations 2')).toBe('Locations');
    expect(displayFolder('PCs 2')).toBe('PCs');
    expect(displayFolder('NPCs')).toBe('NPCs');
  });

  it('maps root notes to the Overview group', () => {
    expect(displayFolder('')).toBe(ROOT_GROUP);
  });
});

describe('session note ordering', () => {
  it('orders prep notes by their numeric prefix', () => {
    const notes = [note('Current Session 2/03-Swamp.md'), note('Current Session 2/00-Lore.md'), note('Current Session 2/10-End.md')];
    expect(sortSessionNotes(notes).map(n => n.name)).toEqual(['00-Lore', '03-Swamp', '10-End']);
  });

  it('sorts unnumbered notes after numbered ones, alphabetically', () => {
    const notes = [note('Current Session/Zeta.md'), note('Current Session/01-Gear.md'), note('Current Session/Alpha.md')];
    expect(sortSessionNotes(notes).map(n => n.name)).toEqual(['01-Gear', 'Alpha', 'Zeta']);
  });

  it('sessionNotes pulls from both Current Session and Current Session 2', () => {
    const notes = [
      note('Current Session/01-Gear.md'),
      note('Current Session 2/00-Lore.md'),
      note('NPCs/Delina.md'),
    ];
    expect(sessionNotes(notes).map(n => n.name)).toEqual(['00-Lore', '01-Gear']);
  });

  it('numericPrefix returns null for unnumbered names', () => {
    expect(numericPrefix('05-Boons')).toBe(5);
    expect(numericPrefix('Delina')).toBeNull();
  });
});

describe('recentNotes', () => {
  it('returns the most recently modified notes first, capped at count', () => {
    const notes = [note('a.md', 100), note('b.md', 300), note('c.md', 200)];
    expect(recentNotes(notes, 2).map(n => n.name)).toEqual(['b', 'c']);
  });
});

describe('groupNotes', () => {
  it('merges duplicate folders into one group and tracks source folders', () => {
    const notes = [note('PCs/Tidus.md'), note('PCs 2/Auld Nain.md')];
    const groups = groupNotes(notes);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('PCs');
    expect(groups[0].notes).toHaveLength(2);
    expect(groups[0].sourceFolders).toEqual(['PCs', 'PCs 2']);
  });

  it('orders known campaign folders first and the root group last', () => {
    const notes = [
      note('Overview.md'),
      note('Zebra Stuff/x.md'),
      note('NPCs/Delina.md'),
      note('Current Session 2/00-Lore.md'),
    ];
    expect(groupNotes(notes).map(g => g.name)).toEqual([
      'Current Session',
      'NPCs',
      'Zebra Stuff',
      ROOT_GROUP,
    ]);
  });
});

describe('duplicateFolderSets', () => {
  it('reports only groups fed by more than one raw folder', () => {
    const notes = [note('PCs/Tidus.md'), note('PCs 2/Auld Nain.md'), note('NPCs/Delina.md')];
    expect(duplicateFolderSets(notes)).toEqual([
      { name: 'PCs', sourceFolders: ['PCs', 'PCs 2'] },
    ]);
  });
});

describe('searchNotes', () => {
  it('matches on title, directory, and excerpt, case-insensitively', () => {
    const notes = [
      note('NPCs/Delina.md', 0, 'An elven bard'),
      note('Lore/Gods.md', 0, 'The pantheon'),
    ];
    expect(searchNotes(notes, 'delina')).toHaveLength(1);
    expect(searchNotes(notes, 'lore')).toHaveLength(1);
    expect(searchNotes(notes, 'BARD')).toHaveLength(1);
    expect(searchNotes(notes, 'dragon')).toHaveLength(0);
  });

  it('returns everything for a blank query', () => {
    const notes = [note('a.md'), note('b.md')];
    expect(searchNotes(notes, '  ')).toHaveLength(2);
  });
});

describe('formatRelativeTime', () => {
  it('formats age buckets', () => {
    const now = 1_000_000_000_000;
    expect(formatRelativeTime(now - 30 * 1000, now)).toBe('just now');
    expect(formatRelativeTime(now - 5 * 60 * 1000, now)).toBe('5m ago');
    expect(formatRelativeTime(now - 3 * 60 * 60 * 1000, now)).toBe('3h ago');
    expect(formatRelativeTime(now - 2 * 24 * 60 * 60 * 1000, now)).toBe('2d ago');
  });

  it('never goes negative for clock skew', () => {
    expect(formatRelativeTime(2000, 1000)).toBe('just now');
  });
});
