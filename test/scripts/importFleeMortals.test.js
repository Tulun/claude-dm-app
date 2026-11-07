import { describe, it, expect } from 'vitest';
import {
  extractTemplates, mergeTemplates, parseTypeLine, formatSpeed, joinSegs, validate, slugify,
  BOOK, VILLAIN_PREFIX,
} from '../../scripts/import-flee-mortals.mjs';
import { parseSpellcasting } from '../../app/combat/components/CharacterCard/spellcastingParser.js';

// Synthetic PDF text items (invented monsters — no book text in the repo).
// A line is [y, x, ...pieces]; a piece is [style, text, size?, { nosp }].
// Pieces sit 2pt apart (a space) unless `nosp` puts them flush.
const W = 594;
function items(lines) {
  const out = [];
  for (const [y, x0, ...pieces] of lines) {
    let x = x0;
    for (const [style, s, size = 9, opts = {}] of pieces) {
      if (opts.nosp) x -= 2;
      const w = s.length * 4;
      out.push({ s, x, y, w, size, style });
      x += w + 2;
    }
  }
  return out;
}
const page = (n, lines) => ({ page: n, width: W, items: items(lines) });

// One stat block's lines starting at (x, top), 11.5pt line spacing.
function block(x, top, { name = 'Mire Lurker', tag = 'CR 2 Brute', xp = '450 XP', type = 'Medium Beast, Unaligned', body = [] } = {}) {
  let y = top;
  const L = [];
  const add = (dx, ...pieces) => { L.push([y, x + dx, ...pieces]); y -= 11.5; };
  add(0, ['b', name, 13], ['b', tag]);
  add(0, ['i', type], ['r', xp]);
  add(0, ['b', 'Armor Class'], ['r', '13 (natural armor)']);
  add(0, ['b', 'Hit Points'], ['r', '45 (6d8 + 18)']);
  add(0, ['b', 'Speed'], ['r', '30 ft., swim 40 ft.']);
  add(12, ...['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(s => ['b', s]));
  add(10, ...[['16', '(+3)'], ['12', '(+1)'], ['16', '(+3)'], ['3', '(−4)'], ['10', '(+0)'], ['5', '(−3)']].flat().map(s => ['r', s]));
  add(0, ['b', 'Saving Throws'], ['r', 'Str +5, Int −2']);
  add(0, ['b', 'Damage Immunities'], ['r', 'poison']);
  add(0, ['b', 'Condition Immunities'], ['r', 'poisoned']);
  add(0, ['b', 'Senses'], ['r', 'darkvision 60 ft., passive']);
  add(12, ['r', 'Perception 10']);
  add(0, ['b', 'Languages'], ['r', '—']);
  add(0, ['b', 'Proficiency Bonus'], ['r', '+2']);
  for (const [dx, ...pieces] of body) add(dx, ...pieces);
  return { lines: L, bottom: y };
}

const BODY = [
  [0, ['bi', 'Murky.'], ['r', 'The lurker has advantage on Stealth checks in swa'], ['r', '-']],
  [0, ['r', 'mps and bogs.']],
  [0, ['b', 'ACTIONS']],
  [0, ['bi', 'Bite.'], ['i', 'Melee Weapon Attack:'], ['r', '+5 to hit, reach 5 ft.,']],
  [0, ['r', 'one target.'], ['i', 'Hit:'], ['r', '10 (2d6 + 3) piercing damage.']],
  [12, ['r', 'A creature bitten twice is poisoned.']],
  [0, ['b', 'BONUS ACTIONS']],
  [0, ['bi', 'Sink.'], ['r', 'The lurker submerges.']],
];

describe('import-flee-mortals: one stat block', () => {
  const { templates, warnings } = extractTemplates([page(1, block(61, 700, { body: BODY }).lines)]);
  const t = templates[0];

  it('reads the header, labels and ability table', () => {
    expect(templates).toHaveLength(1);
    expect(t).toMatchObject({
      id: 'fm-mire-lurker', name: 'Mire Lurker', book: BOOK, source: 'custom',
      size: 'Medium', creatureType: 'Beast', cr: '2', xp: 450, profBonus: 2,
      ac: 13, maxHp: 45, hitDice: '6d8 + 18', speed: '30, swim 40',
      str: 16, dex: 12, con: 16, int: 3, wis: 10, cha: 5,
      savingThrows: 'Str +5, Int -2', immunities: 'poison; poisoned',
      senses: 'darkvision 60 ft., passive Perception 10', languages: '—',
    });
    expect(t.notes).toBe('Alignment: Unaligned. Role: Brute.');
    expect(warnings).toEqual([]);
  });

  it('joins soft hyphens, keeps paragraph indents, and files sections', () => {
    expect(t.traits).toEqual([{ name: 'Murky', description: 'The lurker has advantage on Stealth checks in swamps and bogs.' }]);
    expect(t.actions).toEqual([{
      name: 'Bite',
      description: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) piercing damage.\nA creature bitten twice is poisoned.',
    }]);
    expect(t.bonusActions).toEqual([{ name: 'Sink', description: 'The lurker submerges.' }]);
    expect(t.reactions).toEqual([]);
    expect(t.legendaryActions).toBeUndefined();
  });

  it('uses the book XP, not the CR table (minions are worth far less)', () => {
    const { templates: [m] } = extractTemplates([page(1, block(61, 700, { tag: 'CR 1/4 Minion', xp: '10 XP', body: BODY }).lines)]);
    expect(m).toMatchObject({ cr: '1/4', xp: 10 });
  });
});

describe('import-flee-mortals: layout', () => {
  it('matches right-column continuations to the block level with them (two blocks banded on one page)', () => {
    const a = block(61, 700, { name: 'Upper Beast', body: [[0, ['bi', 'Upper Trait.'], ['r', 'Upper text.']]] });
    const b = block(61, 400, { name: 'Lower Beast', body: [[0, ['bi', 'Lower Trait.'], ['r', 'Lower text.']]] });
    const right = [
      [700, 309, ['b', 'ACTIONS']], [688.5, 309, ['bi', 'Upper Claw.'], ['r', 'Up.']],
      [400, 309, ['b', 'ACTIONS']], [388.5, 309, ['bi', 'Lower Claw.'], ['r', 'Down.']],
    ];
    const { templates } = extractTemplates([page(1, [...a.lines, ...b.lines, ...right])]);
    expect(templates.map(t => [t.name, t.actions.map(x => x.name)])).toEqual([
      ['Upper Beast', ['Upper Claw']],
      ['Lower Beast', ['Lower Claw']],
    ]);
  });

  it('carries a block onto the next page, but not into a sidebar lower down', () => {
    const p1 = block(309, 700, { name: 'Long Beast', body: [[0, ['bi', 'Trait.'], ['r', 'The beast is long, so']]] });
    const p2 = [
      [704, 61, ['r', 'very long.']],
      [692.5, 61, ['b', 'ACTIONS']], [681, 61, ['bi', 'Whip.'], ['r', 'It whips.']],
      [500, 65, ['b', 'Long Beast Tactics', 11]],
      [488, 65, ['r', 'Sidebar advice for the GM.']],
      [470, 65, ['bi', 'Sidebar Feature.'], ['r', 'Not part of the block.']],
    ];
    const { templates, dropped } = extractTemplates([page(1, p1.lines), page(2, p2)]);
    expect(templates[0].traits).toEqual([{ name: 'Trait', description: 'The beast is long, so very long.' }]);
    expect(templates[0].actions).toEqual([{ name: 'Whip', description: 'It whips.' }]);
    expect(dropped).toHaveLength(1);
  });

  it('ignores quotes and their attributions beside a block', () => {
    const a = block(61, 300, { name: 'Quiet Beast', body: [[0, ['bi', 'Hush.'], ['r', 'Shh.']]] });
    const right = [
      [716, 346, ['other', 'They are lovely, honestly.', 9.5]],
      [700, 423, ['r', 'A Witness, Somewhere']],
      [300, 309, ['bi', 'Second.'], ['r', 'Also quiet.']],
    ];
    const { templates } = extractTemplates([page(1, [...a.lines, ...right])]);
    expect(templates[0].traits.map(x => x.name)).toEqual(['Hush', 'Second']);
  });

  it('reads a name set on two lines and a drop-cap first letter', () => {
    const lines = block(61, 700, { name: 'Frost Wyrm', body: BODY }).lines;
    lines.splice(1, 0, [688.5, 61, ['b', 'Ice Caller', 13]]);
    for (const l of lines.slice(2)) l[0] -= 11.5;
    const { templates: [t] } = extractTemplates([page(1, lines)]);
    expect(t.name).toBe('Frost Wyrm Ice Caller');

    const drop = block(61, 700, { name: 'F', body: BODY }).lines;
    drop[0].splice(3, 0, ['b', 'orce of Mud', 13, { nosp: true }]);
    expect(extractTemplates([page(1, drop)]).templates[0].name).toBe('Force of Mud');
  });

  it('skips retainer / companion blocks (no CR)', () => {
    const { templates, skipped } = extractTemplates([page(1, block(61, 700, { name: 'Mire Pal', tag: 'Retainer', xp: '', body: BODY }).lines)]);
    expect(templates).toEqual([]);
    expect(skipped[0]).toMatch(/Mire Pal/);
  });
});

describe('import-flee-mortals: Flee, Mortals! sections', () => {
  it('turns villain actions into one-per-round legendary actions with the rules in the notes', () => {
    const body = [
      ...BODY,
      [0, ['b', 'VILLAIN ACTIONS']],
      [0, ['r', 'The lurker has two villain actions. They can take each action once.']],
      [0, ['b', 'Action 1: Rise!'], ['r', 'The lurker rises from the']],
      [12, ['r', 'water and roars.']],
      [0, ['b', 'Action 2: Drown.'], ['r', 'The lurker drags a foe under.']],
    ];
    const { templates: [t] } = extractTemplates([page(1, block(61, 700, { tag: 'CR 6 Solo', xp: '2,300 XP', body }).lines)]);
    expect(t.legendaryActions).toEqual([
      { name: `${VILLAIN_PREFIX}1: Rise!`, description: 'The lurker rises from the water and roars.' },
      { name: `${VILLAIN_PREFIX}2: Drown`, description: 'The lurker drags a foe under.' },
    ]);
    expect(t.legendaryActionUses).toBe(1);
    expect(t.notes).toContain('Villain Actions: The lurker has two villain actions.');
  });

  it('turns utility spells into a Spellcasting trait the combat tracker can read', () => {
    const body = [
      ...BODY,
      [0, ['b', 'UTILITY SPELLS']],
      [0, ['r', 'The lurker can cast the following spells (spell save DC 13):']],
      [0, ['r', 'At will:'], ['i', 'light'], ['i', ', message', 9, { nosp: true }]],
      [0, ['r', '1/day each:'], ['i', 'fog cloud'], ['i', ', water', 9, { nosp: true }]],
      [12, ['i', 'breathing']],
    ];
    const { templates: [t] } = extractTemplates([page(1, block(61, 700, { body }).lines)]);
    const trait = t.traits.find(x => x.name === 'Spellcasting (Utility Spells)');
    expect(trait.description).toBe('The lurker can cast the following spells (spell save DC 13):\nAt will: light, message.\n1/day each: fog cloud, water breathing.');
    expect(parseSpellcasting(t)).toMatchObject({ found: true, dc: '13', atWill: ['light', 'message'], perDay: { 1: ['fog cloud', 'water breathing'] } });
  });

  it('keeps bulleted and numbered options on their own lines, wraps joined', () => {
    const body = [
      [0, ['b', 'ACTIONS']],
      [0, ['bi', 'Shift.'], ['r', 'The lurker gains one benefit:']],
      [0, ['r', '•'], ['r', 'They gain a swim speed of']],
      [12, ['r', '60 feet.']],
      [0, ['r', '1.'], ['i', 'Mud Spit'], ['r', '.', 9, { nosp: true }], ['r', 'A foe is blinded.']],
      [0, ['bi', 'Hex.'], ['r', 'Choose one:']],
      [0, ['b', 'Rot.'], ['r', 'The target rots and']],
      [12, ['r', 'smells.']],
    ];
    const { templates: [t] } = extractTemplates([page(1, block(61, 700, { body }).lines)]);
    expect(t.actions[0].description).toBe('The lurker gains one benefit:\n• They gain a swim speed of 60 feet.\n1. Mud Spit. A foe is blinded.');
    expect(t.actions[1].description).toBe('Choose one:\nRot. The target rots and smells.');
  });
});

describe('import-flee-mortals: helpers', () => {
  it('parses type lines with commas inside parentheses', () => {
    expect(parseTypeLine('Huge Fiend (Demon, Category 5), Typically Chaotic Evil'))
      .toEqual({ size: 'Huge', creatureType: 'Fiend (Demon, Category 5)', alignment: 'Typically Chaotic Evil' });
    expect(parseTypeLine('Small or Medium Beast, Unaligned').size).toBe('Small or Medium');
  });

  it('formats speed the way the app stores it', () => {
    expect(formatSpeed('30 ft., fly 50 ft. (hover)')).toBe('30, fly 50 (hover)');
  });

  it('joins text pieces without spaces before punctuation', () => {
    expect(joinSegs(['potions of', 'giant strength', '.'])).toBe('potions of giant strength.');
    expect(slugify('Bugbear’s Champion')).toBe('fm-bugbears-champion');
  });

  it('flags implausible stat blocks', () => {
    expect(validate({ cr: '99', ac: 0, maxHp: 0, speed: '', str: 0, traits: [], actions: [], bonusActions: [], reactions: [] }))
      .toEqual(expect.arrayContaining(['CR "99"', 'AC', 'HP', 'speed', 'ability scores', 'no traits or actions']));
  });
});

describe('import-flee-mortals: merging into the library', () => {
  const fm = (name, extra = {}) => ({ id: slugify(name), name, book: BOOK, _page: 1, ...extra });
  const existing = [
    { id: 'mm-ogre', name: 'Ogre', source: 'mm' },
    { id: 'fm-troll', name: 'Troll', book: BOOK, hp: 'edited by me' },
    { id: 'imported-123', name: 'Gnoll Cackler', source: 'custom' },
    { id: 'tpl-9', name: 'Wight', source: 'custom', book: 'MM 2024' },
  ];

  it('adds new monsters, keeps ones already imported, skips ones you added by hand', () => {
    const { templates, report } = mergeTemplates(existing, [fm('Ogre'), fm('Troll'), fm('Gnoll Cackler'), fm('Wight'), fm('New One')]);
    expect(report).toEqual({ added: ['Ogre', 'Wight', 'New One'], replaced: [], kept: ['Troll'], alreadyByHand: ['Gnoll Cackler'] });
    expect(templates.find(t => t.id === 'fm-troll').hp).toBe('edited by me');
    expect(templates.every(t => !('_page' in t))).toBe(true);
    expect(templates).toHaveLength(existing.length + 3);
  });

  it('--force replaces already-imported ones', () => {
    const { templates, report } = mergeTemplates(existing, [fm('Troll')], { force: true });
    expect(report.replaced).toEqual(['Troll']);
    expect(templates.find(t => t.id === 'fm-troll').hp).toBeUndefined();
  });
});
