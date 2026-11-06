// Grouped "index" views of the monster library — the book-appendix style
// "Monsters by Habitat / Creature Type / Challenge Rating" lists. Pure
// functions: the library's sidebar picks a grouping and renders the result.
import { bookLabel, habitatsOf, compareHabitats } from './statBlock';

export const CREATURE_TYPES = [
  'Aberration', 'Beast', 'Celestial', 'Construct', 'Dragon', 'Elemental',
  'Fey', 'Fiend', 'Giant', 'Humanoid', 'Monstrosity', 'Ooze', 'Plant', 'Undead',
];

export const NO_BOOK = 'No book';
export const UNGROUPED = 'Ungrouped';
const NO_HABITAT = 'No habitat listed';
const OTHER_TYPE = 'Other';
const UNKNOWN_CR = 'Unknown';

export const crToNumber = (cr) => {
  const s = String(cr ?? '').trim();
  if (s === '1/8') return 0.125;
  if (s === '1/4') return 0.25;
  if (s === '1/2') return 0.5;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};

// "Undead (Shapechanger)" / "Medium undead" → "Undead"; anything off-list → Other.
export const baseCreatureType = (t) => {
  const raw = String(t?.creatureType ?? '').toLowerCase();
  return CREATURE_TYPES.find(ct => raw.includes(ct.toLowerCase())) ?? OTHER_TYPE;
};

// Each grouping: keys(t) → the group(s) a monster sits in (habitats can be
// several), compare → group order, label → the heading shown.
export const GROUPINGS = {
  habitat: {
    label: 'By Habitat',
    keys: (t) => { const h = habitatsOf(t); return h.length ? h : [NO_HABITAT]; },
    compare: (a, b) => (a === NO_HABITAT) - (b === NO_HABITAT) || compareHabitats(a, b),
  },
  type: {
    label: 'By Creature Type',
    keys: (t) => [baseCreatureType(t)],
    compare: (a, b) => {
      const idx = (k) => { const i = CREATURE_TYPES.indexOf(k); return i === -1 ? CREATURE_TYPES.length : i; };
      return idx(a) - idx(b);
    },
  },
  cr: {
    label: 'By Challenge Rating',
    keys: (t) => { const n = crToNumber(t.cr); return [n === null ? UNKNOWN_CR : String(t.cr).trim()]; },
    compare: (a, b) => (a === UNKNOWN_CR) - (b === UNKNOWN_CR) || crToNumber(a) - crToNumber(b),
    heading: (k) => (k === UNKNOWN_CR ? 'CR unknown' : `CR ${k}`),
  },
  // Conflux's own creature families ("Aboleths", "Goblins"…), in the catalog's
  // table-of-contents order, under its sections ("Aberrations"…). Membership
  // is joined onto each creature by GET /api/templates from
  // public/data/conflux-groups.json (`npm run conflux:groups`). Shown only on
  // the Conflux tabs.
  conflux: {
    label: 'By Conflux Group',
    confluxOnly: true,
    keys: (t) => (t.confluxGroups?.length
      ? t.confluxGroups.map(g => ({ key: g.name, rank: g.order, section: g.section, url: g.url, crRange: g.cr }))
      : [{ key: UNGROUPED, rank: Infinity, section: UNGROUPED }]),
    sortMonsters: (a, b) => (crToNumber(a.cr) ?? Infinity) - (crToNumber(b.cr) ?? Infinity),
  },
  book: {
    label: 'By Book',
    keys: (t) => [bookLabel(t) || NO_BOOK],
    compare: (a, b) => (a === NO_BOOK) - (b === NO_BOOK) || a.localeCompare(b),
  },
};

export const GROUPING_KEYS = Object.keys(GROUPINGS);

/**
 * [{ key, heading, monsters, section?, url?, crRange? }] — groups in their
 * natural order (a grouping's `compare`, else the `rank` its keys carry),
 * monsters alphabetical within each (CR first when the grouping has
 * `sortMonsters`, as Conflux lists its families). Empty groups never appear.
 * A grouping's keys(t) returns strings or { key, rank?, section?, url?, crRange? }.
 */
export const groupMonsters = (list, groupBy) => {
  const g = GROUPINGS[groupBy];
  if (!g) return [];
  const groups = new Map();
  const info = new Map();
  for (const t of list || []) {
    for (const k of g.keys(t)) {
      const entry = typeof k === 'string' ? { key: k } : k;
      if (!groups.has(entry.key)) { groups.set(entry.key, []); info.set(entry.key, entry); }
      groups.get(entry.key).push(t);
    }
  }
  const byName = (a, b) => String(a.name).localeCompare(String(b.name));
  const sortMonsters = g.sortMonsters ? (a, b) => g.sortMonsters(a, b) || byName(a, b) : byName;
  const compare = g.compare || ((a, b) => (info.get(a).rank ?? Infinity) - (info.get(b).rank ?? Infinity) || a.localeCompare(b));
  return [...groups.keys()].sort(compare).map(key => {
    const { section, url, crRange } = info.get(key);
    return {
      key,
      heading: g.heading ? g.heading(key) : key,
      monsters: groups.get(key).slice().sort(sortMonsters),
      ...(section !== undefined && { section }),
      ...(url && { url }),
      ...(crRange && { crRange }),
    };
  });
};

// Groupings offered for a source tab — the Conflux one only on Conflux tabs.
export const groupingKeysFor = (isConflux) => GROUPING_KEYS.filter(k => isConflux || !GROUPINGS[k].confluxOnly);

// DOM id for a group heading (sidebar jump links target it).
export const groupAnchorId = (groupBy, key) =>
  `monsters-${groupBy}-${String(key).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
