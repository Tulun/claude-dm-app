import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseTocPage, parseHomebreweryNames, groupStems, assignMembers, normalizeName, checkAgainstPrevious, findLatestPdf, ENCOUNTER_SECTION } from '../../scripts/conflux-groups.mjs';

// Text items as pdfjs reports them (x, y = baseline origin; size from the transform).
const text = (str, x, y, size) => ({ str, x, y, size });
const link = (x0, y0, x1, y1, id) => ({ rect: [x0, y0, x1, y1], url: `https://homebrewery.naturalcrit.com/share/${id}` });

describe('parseTocPage', () => {
  it('reads section → group name + CR range → link, column by column, merging wrapped headings', () => {
    const items = [
      text('Table Of Contents', 54, 734, 25),
      text('Aberrations', 54, 710, 16), text('cr', 189, 710, 16),
      text('Aboleths', 54, 695, 11), text('1-20', 186, 695, 10),
      text('Beholders', 54, 682, 11), text('½', 184, 682, 10), text('-24', 191, 682, 10),
      // second column: a heading that wraps onto two lines
      text('Fiends -', 230, 740, 16), text('Archdevils', 230, 724, 16),
      text('Asmodeus', 230, 709, 11), text('30', 390, 709, 10),
    ];
    const links = [
      link(54, 692, 205, 704, 'abo'), link(54, 679, 205, 692, 'beh'),
      link(230, 706, 400, 718, 'asm'),
      { rect: [10, 10, 20, 20], url: 'https://www.patreon.com/confluxcreatures/' }, // not a group doc
    ];
    const { entries, lastSection } = parseTocPage(items, links);
    expect(entries).toEqual([
      { section: 'Aberrations', name: 'Aboleths', cr: '1-20', url: 'https://homebrewery.naturalcrit.com/share/abo' },
      { section: 'Aberrations', name: 'Beholders', cr: '½-24', url: 'https://homebrewery.naturalcrit.com/share/beh' },
      { section: 'Fiends - Archdevils', name: 'Asmodeus', cr: '30', url: 'https://homebrewery.naturalcrit.com/share/asm' },
    ]);
    expect(lastSection).toBe('Fiends - Archdevils');
  });

  it('infers the layout: different font sizes, two columns at other offsets, same font for name and CR', () => {
    // A re-flowed month: everything 1.5x larger, columns at 40 / 320, CR in the name's font.
    const items = [
      text('Humanoids', 40, 760, 22),
      text('Goblins', 40, 735, 15), text('M1-11', 250, 735, 15),
      text('Gnolls', 40, 715, 15), text('¼', 250, 715, 15), text('-9', 258, 715, 15),
      text('Undead', 320, 760, 22),
      text('Death Knights', 320, 735, 15), text('11-17', 520, 735, 15),
      text('Ghouls', 320, 715, 15), text('M6-16', 520, 715, 15),
    ];
    const links = [
      link(40, 731, 300, 750, 'gob'), link(40, 711, 300, 730, 'gno'),
      link(320, 731, 580, 750, 'dk'), link(320, 711, 580, 730, 'gh'),
    ];
    expect(parseTocPage(items, links).entries.map(e => [e.section, e.name, e.cr])).toEqual([
      ['Humanoids', 'Goblins', 'M1-11'], ['Humanoids', 'Gnolls', '¼-9'],
      ['Undead', 'Death Knights', '11-17'], ['Undead', 'Ghouls', 'M6-16'],
    ]);
  });

  it('keeps a number that starts a group name ("2014 Fighters")', () => {
    const { entries } = parseTocPage([text('2014 Fighters', 54, 700, 11), text('1-20', 186, 700, 10)], [link(54, 697, 205, 709, 'f')], 'NPCs');
    expect(entries[0]).toMatchObject({ name: '2014 Fighters', cr: '1-20' });
  });

  it('a page that starts mid-section carries the previous page\'s section', () => {
    const { entries } = parseTocPage([text('Wolves', 54, 700, 11), text('¼-17', 186, 700, 10)], [link(54, 697, 205, 709, 'w')], 'Beasts');
    expect(entries[0]).toMatchObject({ section: 'Beasts', name: 'Wolves', cr: '¼-17' });
  });
});

describe('parseHomebreweryNames', () => {
  it('finds V3 stat blocks ("{{monster" + "## Name {{bonus …}}" + **AC**)', () => {
    const src = [
      '# Aboleths', '### Lore', 'Some lore.',
      '{{monster,frame', '', ' ## Aboleth Spawnling {{bonus **cr 1**}}', '*Tiny aberration*', '{{stats', '**AC** :: 13', '}}',
      '{{monster,frame,wide', '## Aboleth Overseer {{bonus **cr 14**}}', '**AC** :: 18',
    ].join('\n');
    expect(parseHomebreweryNames(src)).toEqual(['Aboleth Spawnling', 'Aboleth Overseer']);
  });

  it('finds legacy blockquote stat blocks and decodes HTML entities from the source page', () => {
    const src = [
      '<code><pre># Slaadi', '___', '&gt; ## Red Slaad', '&gt;*Large aberration, chaotic neutral*', '&gt; ___',
      '&gt; - **Armor Class** 14 (natural armor)', '## Slaad Tactics', 'They fight dirty.', '&gt; ## Lyr&#39;vessa', '&gt; - **Armor Class** 12',
    ].join('\n');
    expect(parseHomebreweryNames(src)).toEqual(['Red Slaad', "Lyr'vessa"]);
  });

  it('ignores ## headings that are not stat blocks', () => {
    expect(parseHomebreweryNames('## Adventure Hooks\nGo somewhere.\n### Lairs\nA cave.')).toEqual([]);
  });
});

describe('groupStems', () => {
  it('singularizes the last word and splits "and" lists; drops a " - " qualifier', () => {
    expect(groupStems('Wolves')).toEqual(['wolf']);
    expect(groupStems('Mind Flayers')).toEqual(['mind flayer']);
    expect(groupStems('Crows and Ravens')).toEqual(['crow', 'raven']);
    expect(groupStems('Snakes - Venomous')).toEqual(['snake']);
    expect(groupStems('Cranium Rats')).toEqual(['cranium rat']);
  });
});

describe('assignMembers', () => {
  const groups = [
    { name: 'Aboleths', docNames: ['Aboleth Spawnling', 'Aboleth Lasher'] },
    { name: 'Beholders', docNames: ['Gazer'] },
    { name: 'Rats', docNames: ['Giant Rat'] },
    { name: 'Cranium Rats', docNames: [] },
    { name: 'Boondaburra Pirates', encounter: true, docNames: ['Boondaburra Captain', 'Gazer'] },
  ];
  const run = (creatures) => assignMembers(groups, creatures);

  it('matches by stat block name first (case / punctuation insensitive)', () => {
    const { members } = run([{ id: 'a', name: 'Aboleth lasher' }, { id: 'g', name: 'Gazer' }]);
    expect(members.get(0)).toEqual(['a']);
    expect(members.get(1)).toEqual(['g']); // the family, not the encounter that also lists it
    expect(members.get(4)).toBeUndefined();
  });

  it('uses the pre-rename name, then the longest group name inside the creature name', () => {
    const { members, viaName } = run([
      { id: 'h', name: 'Aboleth Hatchling', confluxRenamedFrom: 'Aboleth Spawnling' },
      { id: 'b', name: 'Aboleth Behemoth' },
      { id: 'c', name: 'Cranium Rat Swarm' },
    ]);
    expect(members.get(0)).toEqual(['h', 'b']);
    expect(members.get(3)).toEqual(['c']); // "cranium rat" beats "rat"
    expect(viaName).toBe(2);
  });

  it('falls back to a Cobra Codex encounter group, else reports the creature unmatched', () => {
    const { members, unmatched } = run([{ id: 'p', name: 'Boondaburra Captain' }, { id: 'x', name: 'Uchuulon' }]);
    expect(members.get(4)).toEqual(['p']);
    expect(unmatched).toEqual(['Uchuulon']);
  });
});

describe('normalizeName', () => {
  it('folds case, accents, apostrophes and punctuation', () => {
    expect(normalizeName("Lyr’vessa, the Ōmukade!")).toBe('lyrvessa the omukade');
  });
});

describe('checkAgainstPrevious', () => {
  const families = (n, members = 3) => Array.from({ length: n }, (_, i) => ({ section: 'Beasts', name: `Group ${i}`, members: Array.from({ length: members }, (_, j) => `cc-${i}-${j}`) }));

  it('passes a normal month and reports added / removed groups', () => {
    const prev = { groups: families(200) };
    const next = { groups: [...families(199), { section: 'Beasts', name: 'Brand New', members: ['cc-new'] }] };
    expect(checkAgainstPrevious(next, prev)).toEqual({ problems: [], added: ['Brand New'], removed: ['Group 199'] });
  });

  it('flags a layout it no longer understands: too few groups, lost sections, lost creatures', () => {
    expect(checkAgainstPrevious({ groups: families(40) }, null).problems[0]).toMatch(/only 40 creature groups/);
    const noSections = { groups: families(200).map(g => ({ ...g, section: null })) };
    expect(checkAgainstPrevious(noSections, null).problems.join()).toMatch(/no section heading/);
    const prev = { groups: families(200) };
    expect(checkAgainstPrevious({ groups: families(150) }, prev).problems.join()).toMatch(/group count fell from 200 to 150/);
    expect(checkAgainstPrevious({ groups: families(200, 2) }, prev).problems.join()).toMatch(/placed in a group fell from 600 to 400/);
    const renamed = { groups: families(200).map((g, i) => (i < 30 ? { ...g, name: `${g.name}!` } : g)) };
    expect(checkAgainstPrevious(renamed, prev).problems.join()).toMatch(/30 groups from last time are gone/);
  });

  it('does not count Cobra Codex encounters as groups', () => {
    const next = { groups: [...families(99), { section: ENCOUNTER_SECTION, name: 'Pirates', members: ['x'] }] };
    expect(checkAgainstPrevious(next, null).problems[0]).toMatch(/only 99/);
  });
});

describe('findLatestPdf', () => {
  let dir;
  afterEach(() => dir && fs.rmSync(dir, { recursive: true, force: true }));

  it('picks the newest "Individual Links" PDF and ignores other files', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'conflux-pdfs-'));
    const touch = (name, mtime) => { const f = path.join(dir, name); fs.writeFileSync(f, ''); fs.utimesSync(f, mtime, mtime); };
    touch('October 2026 - Individual Links.pdf', new Date('2026-10-01'));
    touch('November 2026 - Individual Links.pdf', new Date('2026-11-01'));
    touch('December 2026 - Compendium.pdf', new Date('2026-12-01'));
    expect(path.basename(findLatestPdf(dir))).toBe('November 2026 - Individual Links.pdf');
    expect(findLatestPdf(path.join(dir, 'missing'))).toBeNull();
  });
});
