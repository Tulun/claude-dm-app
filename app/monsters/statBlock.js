// Pure helpers for the monster detail page (/monsters/[id]): reading a
// template's stat block for display, and converting it to / from the edit
// form. Display-only parsing — nothing here changes how combat reads a
// template. Ability math comes from app/utils/rules.js (never a local getMod).
import { getModNum } from '../utils/rules';
import { MM2024_HABITATS } from '../data/monsterHabitats';

export const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export const SIZE_OPTIONS = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];

// Stat-block sections in display order. `color` keys into the view/form palettes.
export const SECTIONS = [
  { key: 'traits', label: 'Traits', singular: 'Trait', color: 'amber' },
  { key: 'actions', label: 'Actions', singular: 'Action', color: 'red' },
  { key: 'bonusActions', label: 'Bonus Actions', singular: 'Bonus Action', color: 'orange' },
  { key: 'reactions', label: 'Reactions', singular: 'Reaction', color: 'cyan' },
  { key: 'legendaryActions', label: 'Legendary Actions', singular: 'Legendary Action', color: 'purple' },
];

// Conflux creatures live in a separate ~6 MB file served by
// GET /api/templates?source=conflux; their ids carry this prefix.
export const isConfluxId = (id) => String(id ?? '').startsWith('cc-');

// Conflux release stamps, written by scripts/convert-conflux.mjs: a creature
// new in release X carries `confluxAdded: X`, one whose stat block changed
// carries `confluxUpdated: X` (plus `confluxRenamedFrom` when renamed).
const compareVersions = (a, b) => {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
};

// The newest release any creature in the list is stamped with, or null.
export const latestConfluxVersion = (list) =>
  (list || []).reduce((best, t) => [t?.confluxAdded, t?.confluxUpdated].filter(Boolean)
    .reduce((b, v) => (!b || compareVersions(v, b) > 0 ? v : b), best), null);

// 'new' / 'updated' when the creature changed in `version`, else null.
export const confluxChange = (t, version) => {
  if (!version) return null;
  if (t?.confluxAdded === version) return 'new';
  if (t?.confluxUpdated === version) return 'updated';
  return null;
};

const isBuiltIn = (t) => String(t?.id ?? '').startsWith('mm-') && t?.source !== 'custom';

// MCDM's Flee, Mortals! — third-party, so it has its own library tab rather
// than sitting under Official. Must match BOOK in scripts/import-flee-mortals.mjs.
export const FLEE_MORTALS = 'Flee Mortals';
export const isFleeMortals = (t) => {
  if (isConfluxId(t?.id) || t?.source === 'conflux') return false;
  return String(t?.book ?? '').trim().toLowerCase() === FLEE_MORTALS.toLowerCase();
};

// Official stat block = Wizards of the Coast: a built-in, or anything tagged
// with a real book other than "Homebrew" and Flee Mortals — e.g. a monster
// imported from the 2024 Monster Manual. Drives the library's Official /
// Flee Mortals / Custom tabs (librarySection).
export const isOfficial = (t) => {
  if (isConfluxId(t?.id) || t?.source === 'conflux') return false;
  if (isBuiltIn(t)) return true;
  if (isFleeMortals(t)) return false;
  const book = String(t?.book ?? '').trim();
  return !!book && !/^homebrew$/i.test(book);
};

// Which saved-library tab a (non-Conflux) template is listed under.
export const librarySection = (t) => (isOfficial(t) ? 'official' : isFleeMortals(t) ? 'fm' : 'custom');

// Where the template came from — for the header badge (the book has its own).
export const sourceLabel = (t) => {
  if (isConfluxId(t?.id) || t?.source === 'conflux') return 'Conflux';
  if (isBuiltIn(t)) return 'Built-in';
  return isOfficial(t) || isFleeMortals(t) ? 'Imported' : 'Custom';
};

// Which book a stat block comes from ("MM 2014", "MM 2024", "VGtM", …) —
// stored as free text in `book`, separate from `source` (which only says
// built-in / Conflux / custom and drives the library's source tabs and the
// built-in migration). Untagged built-ins fall back to their edition (or 2024
// markers) so the library labels them without writing anything to disk.
export const BOOK_OPTIONS = ['MM 2014', 'MM 2024', 'MPMM', 'VGtM', 'MToF', 'FToD', 'BGG', FLEE_MORTALS, 'Homebrew'];

export const defaultBook = (t) => {
  if (!t || isConfluxId(t.id) || t.source === 'conflux') return null;
  if (!String(t.id ?? '').startsWith('mm-') || t.source === 'custom') return null;
  return t.edition === '2024' || has2024Markers(t) ? 'MM 2024' : 'MM 2014';
};

// A built-in updated by hand / image import from the 2024 Monster Manual has
// no `edition` tag, but 2024 stat blocks carry an Initiative line and
// legendary-action uses that 2014 ones never had.
const has2024Markers = (t) =>
  t.initiativeBonus != null || t.legendaryActionUses != null ||
  /\b(Initiative [+-−]\d|Legendary Action Uses:)/i.test(String(t.notes ?? ''));

export const bookLabel = (t) => String(t?.book ?? '').trim() || defaultBook(t);

// Habitats ("Any", "Forest", "Planar (Abyss)", …). A template's own
// `habitats` array wins; otherwise a 2024 Monster Manual stat block (built-in
// or imported, i.e. bookLabel "MM 2024") gets the book's habitats by name from
// app/data/monsterHabitats.js. Derived at read time — nothing is written to disk.
const normName = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const HABITATS_BY_NAME = new Map(Object.entries(MM2024_HABITATS).map(([n, h]) => [normName(n), h]));

export const habitatsOf = (t) => {
  if (Array.isArray(t?.habitats) && t.habitats.length) return t.habitats;
  if (bookLabel(t) !== 'MM 2024') return [];
  return HABITATS_BY_NAME.get(normName(t.name)) ?? [];
};

// Filter/display order: "Any" first, then terrain habitats, then the planes.
export const compareHabitats = (a, b) =>
  (b === 'Any') - (a === 'Any') || a.startsWith('Planar') - b.startsWith('Planar') || a.localeCompare(b);

// "Alignment: Lawful Evil. Initiative +12 (22). …" → "Lawful Evil".
export const parseAlignment = (notes) => {
  const m = /Alignment:\s*([^.]+)\./i.exec(String(notes ?? ''));
  return m ? m[1].trim() : null;
};

// Initiative modifier: the 2024 `initiativeBonus` when present, else the
// "Initiative +12 (22)" line imported stat blocks keep in their notes, else
// the DEX mod.
export const getInitiativeBonus = (t) => {
  if (typeof t?.initiativeBonus === 'number') return t.initiativeBonus;
  const m = /Initiative\s*([+\-−]\s*\d+)/i.exec(String(t?.notes ?? ''));
  if (m) return Number(m[1].replace('−', '-').replace(/\s/g, ''));
  return getModNum(t?.dex ?? 10);
};

// Legendary action uses per round: the stored `legendaryActionUses`, else
// "Legendary Action Uses: 3 (4 in Lair)" from the notes, else 3 when the
// creature has legendary actions at all. Returns { uses, lair } or null.
export const getLegendaryUses = (t) => {
  if (!t?.legendaryActions?.length) return null;
  const m = /Legendary Action Uses:\s*(\d+)(?:\s*\((\d+)\s+in\s+lair\))?/i.exec(String(t.notes ?? ''));
  const lair = m?.[2] ? Number(m[2]) : null;
  if (typeof t.legendaryActionUses === 'number') return { uses: t.legendaryActionUses, lair };
  if (m) return { uses: Number(m[1]), lair };
  return { uses: 3, lair: null };
};

// Breaks an ability description into blocks for display. Newlines separate
// paragraphs; a line like "3. Fear Ray. Wisdom Saving Throw…" becomes a
// numbered list item with its own bold name, so long multi-option abilities
// (Eye Rays, Breath Weapons) read as a list instead of a wall of text.
// → [{ kind: 'p', text }] | [{ kind: 'item', marker: '3', name: 'Fear Ray', text }]
export const splitDescription = (text) =>
  String(text ?? '')
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const item = /^(\d+|[•\-*])[.)]?\s+([^.:]{1,40})[.:]\s*(.*)$/.exec(line);
      if (item && /^\d+$/.test(item[1])) return { kind: 'item', marker: item[1], name: item[2].trim(), text: item[3] };
      const bullet = /^[•\-*]\s+(.*)$/.exec(line);
      if (bullet) return { kind: 'item', marker: '•', name: null, text: bullet[1] };
      return { kind: 'p', text: line };
    });

// "Perception +12, Stealth +6" → ['Perception +12', 'Stealth +6'].
// Flavor text ("lore") → [{ heading, text }]. Blocks are separated by blank
// lines; a block whose first line is short and unpunctuated is a heading
// ("Eyes of the Deep") over the rest of the block. A lone heading line is
// joined to the next block.
const isHeading = (line) => line.length <= 60 && !/[.!?:;,"”)]$/.test(line);
export const splitLore = (text) => {
  const out = [];
  let pending = null;
  for (const block of String(text ?? '').split(/\n\s*\n/)) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    let heading = pending;
    pending = null;
    if (isHeading(lines[0])) {
      if (lines.length === 1) {
        if (heading) out.push({ heading, text: '' });
        pending = lines[0];
        continue;
      }
      if (heading) out.push({ heading, text: '' });
      heading = lines.shift();
    }
    out.push({ heading, text: lines.join(' ') });
  }
  if (pending) out.push({ heading: pending, text: '' });
  return out;
};

export const splitList = (text) =>
  String(text ?? '').split(',').map(s => s.trim()).filter(Boolean);

const CR_XP = {
  '0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800,
  '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900, '11': 7200, '12': 8400, '13': 10000,
  '14': 11500, '15': 13000, '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000,
  '21': 33000, '22': 41000, '23': 50000, '24': 62000, '25': 75000, '26': 90000, '27': 105000,
  '28': 120000, '29': 135000, '30': 155000,
};
// Standard XP for a CR (for the form's auto-fill), or null for unknown CRs.
export const xpForCr = (cr) => CR_XP[String(cr ?? '').trim()] ?? null;

// Proficiency bonus by CR (5e table): CR 0–4 → +2 … CR 29–30 → +9.
export const profForCr = (cr) => {
  const s = String(cr ?? '').trim();
  const n = s.includes('/') ? 0 : Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.max(2, Math.floor((Math.max(n, 1) - 1) / 4) + 2);
};

export const BLANK_TEMPLATE = {
  name: '', size: 'Medium', creatureType: 'Humanoid',
  ac: 10, maxHp: 10, hitDice: '1d8', speed: 30, cr: '1', xp: 200, profBonus: 2,
  str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
  savingThrows: '', skills: '', senses: '', languages: '',
  vulnerabilities: '', resistances: '', immunities: '', notes: '', lore: '',
  traits: [], actions: [], bonusActions: [], reactions: [], legendaryActions: [],
};

const STRING_FIELDS = ['name', 'book', 'lore', 'size', 'creatureType', 'hitDice', 'cr', 'savingThrows', 'skills', 'senses',
  'languages', 'vulnerabilities', 'resistances', 'immunities', 'notes'];

// Template → edit form. Every input is a string (so a half-typed "-" or ""
// is representable); lists are copied so editing never mutates the original.
export const toEditForm = (t) => {
  const form = { ...t };
  for (const k of STRING_FIELDS) form[k] = t[k] == null ? '' : String(t[k]);
  for (const k of ['ac', 'maxHp', 'speed', 'xp', 'profBonus', 'initiativeBonus', 'legendaryActionUses', ...ABILITY_KEYS]) {
    form[k] = t[k] == null ? '' : String(t[k]);
  }
  for (const { key } of SECTIONS) form[key] = (t[key] || []).map(a => ({ name: a?.name ?? '', description: a?.description ?? '' }));
  return form;
};

const intOr = (val, fallback) => {
  const n = parseInt(String(val ?? '').replace(/[,\s]/g, ''), 10);
  return Number.isNaN(n) ? fallback : n;
};

// Edit form → template, merged over `original` (so fields the form doesn't
// know about survive). Numbers are coerced back; optional numbers left blank
// are removed. A field that is empty ('' / []) and was absent on the original
// stays absent — so opening and saving a built-in without changes keeps it
// byte-identical (the templates migration fingerprints unedited built-ins;
// see lib/templateFingerprint.js).
export const fromEditForm = (form, original = {}) => {
  const out = { ...original, ...form };
  for (const k of STRING_FIELDS) out[k] = String(form[k] ?? '').trim();
  out.ac = intOr(form.ac, 10);
  out.maxHp = intOr(form.maxHp, 10);
  out.profBonus = intOr(form.profBonus, 2);
  for (const k of ABILITY_KEYS) out[k] = intOr(form[k], 10);
  const xp = intOr(form.xp, null);
  out.xp = xp ?? String(form.xp ?? '').trim();
  const speed = String(form.speed ?? '').trim();
  out.speed = /^\d+$/.test(speed) ? Number(speed) : speed;
  for (const k of ['initiativeBonus', 'legendaryActionUses']) {
    const n = intOr(String(form[k] ?? '').replace('+', ''), null);
    if (n === null) delete out[k]; else out[k] = n;
  }
  for (const { key } of SECTIONS) {
    out[key] = (form[key] || [])
      .map(a => ({ name: String(a.name ?? '').trim(), description: String(a.description ?? '').trim() }))
      .filter(a => a.name || a.description);
  }
  for (const k of Object.keys(out)) {
    const v = out[k];
    const empty = v === '' || (Array.isArray(v) && v.length === 0);
    if (empty && original[k] === undefined) delete out[k];
  }
  return out;
};

// Deep-ish equality for "did the edit change anything?" (key order ignored).
const stable = (v) => {
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`;
  }
  return JSON.stringify(v);
};
export const sameTemplate = (a, b) => stable(a) === stable(b);
