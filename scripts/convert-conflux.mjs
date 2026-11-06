#!/usr/bin/env node
// Convert a Conflux Creatures 5eTools export into the app's template shape
// (public/data/conflux-creatures.json), diffing against the current file so
// the library's "Latest" tab can show what changed.
//
//   npm run conflux:import -- <ConfluxCreatures_X.YY_5eTools.json> [--version X.YY] [--dry-run]
//   (same as: node scripts/convert-conflux.mjs …; the `--` keeps npm from eating the flags)
//
// Restart the dev server afterwards — GET /api/templates caches the file.
// User-facing steps: README.md § Updating Conflux creatures.
//
// The version defaults to the one in the file name (the export's _meta
// version is not kept up to date by the publisher). Each creature that is new
// or whose stat block changed is stamped with `confluxAdded` / `confluxUpdated`
// = that version; creatures renamed between versions keep their old id and get
// `confluxRenamedFrom`. Stamps from earlier imports are carried forward.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_FILE = path.join(ROOT, 'public', 'data', 'conflux-creatures.json');

const SIZES = { F: 'Fine', D: 'Diminutive', T: 'Tiny', S: 'Small', M: 'Medium', L: 'Large', H: 'Huge', G: 'Gargantuan', C: 'Gargantuan' }; // C(olossal) is beyond 5e's scale; the app's size lists stop at Gargantuan
const CR_XP = {
  '0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800,
  '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900, '11': 7200, '12': 8400, '13': 10000,
  '14': 11500, '15': 13000, '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000,
  '21': 33000, '22': 41000, '23': 50000, '24': 62000, '25': 75000, '26': 90000, '27': 105000,
  '28': 120000, '29': 135000, '30': 155000,
};
const crNum = (cr) => (cr.includes('/') ? Number(cr.split('/')[0]) / Number(cr.split('/')[1]) : Number(cr));
const profForCr = (cr) => Math.max(2, Math.floor((Math.max(crNum(cr), 1) - 1) / 4) + 2);
const ABILS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// UTF-8 text that was decoded as Windows-1252 somewhere upstream.
const MOJIBAKE = [['â€“', '–'], ['â€”', '—'], ['â€™', '’'], ['â€˜', '‘'], ['â€œ', '“'], ['â€\u009d', '”'], ['â€¦', '…'], ['Ã©', 'é']];
const fixMojibake = (s) => MOJIBAKE.reduce((acc, [bad, good]) => acc.split(bad).join(good), s);

// 5eTools inline tags → plain text.
export function stripTags(text) {
  let s = String(text);
  let prev;
  do {
    prev = s;
    s = s.replace(/\{@(\w+)\s*([^{}]*)\}/g, (_, tag, body) => {
      const first = body.split('|')[0].trim();
      switch (tag) {
        case 'atkr':
        case 'atk': return 'Attack:';
        case 'hit': return `${/^[+-]/.test(first) ? '' : '+'}${first}`;
        case 'h': return 'Hit: ';
        case 'dc': return `DC ${first}`;
        case 'recharge': return `(Recharge ${first ? `${first}-6` : '6'})`;
        default: return first;
      }
    });
  } while (s !== prev);
  return s;
}

const renderEntry = (e) => {
  if (typeof e === 'string') return stripTags(e);
  if (Array.isArray(e)) return e.map(renderEntry).join(' ');
  if (e && typeof e === 'object') {
    const inner = [e.entries, e.items, e.entry].filter(Boolean).map(renderEntry).join(' ');
    return e.name ? `${stripTags(e.name)}. ${inner}` : inner;
  }
  return '';
};
const cleanText = (s) => fixMojibake(s).replace(/[ \t]{2,}/g, ' ').replace(/ +\n/g, '\n').trim();
const toAbilities = (list) =>
  (list || []).map(a => ({ name: cleanText(stripTags(a.name || '')), description: cleanText(renderEntry(a.entries || [])) }));

// The PDF→5eTools export leaks the stat block's XP / proficiency lines into
// the last language ("Telepathy 120 ft. **XP** :: 200 {{bonus …}}") and splits
// "2,300" across two entries — keep only the real language text.
function cleanLanguages(list) {
  const out = [];
  for (const raw of list || []) {
    const cut = String(raw).split(/\*\*XP\*\*|\{\{/)[0];
    if (cut !== raw) { if (cut.trim()) out.push(cut); break; }
    out.push(raw);
  }
  const s = cleanText(stripTags(out.map(x => x.trim()).filter(Boolean).join(', ')));
  return s || undefined;
}

const fmtSpeed = (speed) => {
  const v = (x) => (typeof x === 'object' && x ? `${x.number}${x.condition ? ` ${x.condition}` : ''}` : x);
  const parts = [];
  if (speed?.walk != null) parts.push(String(v(speed.walk)));
  for (const k of Object.keys(speed || {})) {
    if (k === 'walk' || k === 'canHover') continue;
    parts.push(`${k} ${v(speed[k])}${k === 'fly' && speed.canHover ? ' (hover)' : ''}`);
  }
  return parts.join(', ');
};

// "+-1" (the export's way of writing -1) → "-1".
const fmtBonus = (b) => String(b).replace(/^\+\s*-/, '-').replace(/^\+\+/, '+');
const fmtSaves = (save) => (save ? ABILS.filter(k => save[k] != null).map(k => `${cap(k)} ${fmtBonus(save[k])}`).join(', ') || undefined : undefined);
const fmtSkills = (skill) => (skill ? Object.entries(skill).map(([k, b]) => `${k.split(' ').map(cap).join(' ')} ${fmtBonus(b)}`).join(', ') || undefined : undefined);
const fmtDefenses = (list) => {
  if (!list?.length) return undefined;
  return cleanText(list.map(d => (typeof d === 'string' ? d : [fmtDefenses(d.immune || d.resist || d.vulnerable), d.note].filter(Boolean).join(' '))).join(', '));
};
const fmtType = (t) => (typeof t === 'string' ? t : t?.tags?.length ? `${cap(t.type)} (${t.tags.map(x => (typeof x === 'string' ? x : x.tag)).join(', ')})` : cap(t?.type || ''));

export const MYTHIC_PREFIX = 'Mythic: ';
const slug = (name) => `cc-${name.toLowerCase().replace(/\s+/g, '-')}`;

export function convertMonster(m) {
  const cr = typeof m.cr === 'object' && m.cr ? m.cr.cr : m.cr || '0';
  const ac = m.ac?.[0];
  const immune = fmtDefenses(m.immune);
  const condImmune = m.conditionImmune?.length ? m.conditionImmune.map(c => (typeof c === 'string' ? c : c.conditionImmune?.join(', '))).join(', ') : undefined;
  const out = {
    name: cleanText(m.name),
    source: 'conflux',
    size: (m.size || []).map(s => SIZES[s] || s).join(' or ') || 'Medium',
    creatureType: fmtType(m.type),
    ac: typeof ac === 'object' ? ac.ac : ac,
    maxHp: m.hp?.average ?? 1,
    hitDice: m.hp?.formula || m.hp?.special || '',
    speed: fmtSpeed(m.speed),
    cr,
    // Conflux goes past CR 30 (up to 44); extend the table's last step.
    xp: CR_XP[cr] ?? (crNum(cr) > 30 ? 155000 + (crNum(cr) - 30) * 20000 : 0),
    profBonus: profForCr(cr),
    ...Object.fromEntries(ABILS.map(k => [k, m[k] ?? 10])),
    isNpc: false,
    savingThrows: fmtSaves(m.save),
    skills: fmtSkills(m.skill),
    vulnerabilities: fmtDefenses(m.vulnerable),
    resistances: fmtDefenses(m.resist),
    immunities: [immune, condImmune].filter(Boolean).join('; ') || undefined,
    senses: m.senses?.length ? cleanText(stripTags(m.senses.join(', '))) : undefined,
    languages: cleanLanguages(m.languages),
    traits: toAbilities(m.trait),
    actions: toAbilities(m.action),
    bonusActions: m.bonus?.length ? toAbilities(m.bonus) : undefined,
    reactions: m.reaction?.length ? toAbilities(m.reaction) : undefined,
    // No separate mythic section in the app: mythic actions ride along with
    // the legendary ones, labelled so the DM knows they need the mythic trait.
    legendaryActions: [...toAbilities(m.legendary), ...toAbilities(m.mythic).map(a => ({ ...a, name: `${MYTHIC_PREFIX}${a.name}` }))],
  };
  if (!out.legendaryActions.length) delete out.legendaryActions;
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined));
}

// What counts as "the stat block changed" — numbers and ability text, with
// whitespace/punctuation noise and our own formatting fixes normalized away.
const norm = (s) => fixMojibake(String(s ?? '')).toLowerCase().replace(/[^a-z0-9]+/g, '');
const abilitySig = (list) => (list || []).map(a => `${norm(a.name)}:${norm(a.description)}`).join('|');
// Order-insensitive, and a missing walk speed equals "0".
const speedSig = (s) => String(s ?? '').split(',').map(norm).filter(p => p && p !== '0').sort().join(',');
// Imports before 1.58 dropped mythic actions; their appearing isn't an update.
const legendarySig = (t, prev) => abilitySig((t.legendaryActions || []).filter(a => !prev || prev.legendaryActions?.some(p => p.name.startsWith(MYTHIC_PREFIX)) || !a.name.startsWith(MYTHIC_PREFIX)));
export const statSignature = (t, prev) =>
  [t.size, t.creatureType, t.ac, t.maxHp, t.hitDice, speedSig(t.speed), t.cr, ...ABILS.map(k => t[k]),
    abilitySig(t.traits), abilitySig(t.actions), abilitySig(t.bonusActions), abilitySig(t.reactions),
    legendarySig(t, prev)].map(norm).join('#');
const coreSig = (t) => [t.size, t.ac, t.maxHp, t.hitDice, t.cr, ...ABILS.map(k => t[k])].map(norm).join('#');
const changedFields = (a, b) => {
  const f = [];
  for (const k of ['ac', 'maxHp', 'cr', 'size', 'creatureType', ...ABILS]) if (norm(a[k]) !== norm(b[k])) f.push(k);
  if (speedSig(a.speed) !== speedSig(b.speed)) f.push('speed');
  for (const k of ['traits', 'actions', 'bonusActions', 'reactions']) if (abilitySig(a[k]) !== abilitySig(b[k])) f.push(k);
  if (legendarySig(b, a) !== abilitySig(a.legendaryActions)) f.push('legendaryActions');
  return f;
};

export function buildConflux(source, previous, version) {
  // Previous entries grouped by name, in file order, so duplicate names keep
  // their ids by position.
  const prevByName = new Map();
  // Keyed by mojibake-repaired name: older imports kept names like "OgrÃ©moch".
  const key = (name) => fixMojibake(name);
  for (const p of previous) prevByName.set(key(p.name), [...(prevByName.get(key(p.name)) || []), p]);
  const converted = source.map(convertMonster);
  const newNames = new Set(converted.map(c => c.name));
  const removed = previous.filter(p => !newNames.has(key(p.name)));
  const removedByCore = new Map();
  for (const r of removed) removedByCore.set(coreSig(r), [...(removedByCore.get(coreSig(r)) || []), r]);

  const usedIds = new Set();
  const report = { added: [], updated: [], renamed: [], removed: [] };
  const out = converted.map((c, i) => {
    let prev = prevByName.get(c.name)?.shift();
    // Pre-1.58 imports turned Colossal ("C") into Medium; that fix isn't an update.
    const cmp = prev && source[i].size?.includes('C') ? { ...c, size: prev.size } : c;
    let renamedFrom;
    if (!prev) {
      const candidates = removedByCore.get(coreSig(c));
      if (candidates?.length) { prev = candidates.shift(); renamedFrom = prev.name; }
    }
    let id = prev?.id || slug(c.name);
    if (usedIds.has(id)) id = `${slug(c.name)}-${i}`;
    usedIds.add(id);

    const t = { id, ...c };
    // Carry forward stamps from earlier imports.
    for (const k of ['confluxAdded', 'confluxUpdated', 'confluxRenamedFrom']) if (prev?.[k]) t[k] = prev[k];
    if (!prev) {
      t.confluxAdded = version;
      delete t.confluxUpdated;
      report.added.push(c.name);
    } else if (renamedFrom || statSignature(prev) !== statSignature(cmp, prev)) {
      t.confluxUpdated = version;
      if (renamedFrom) { t.confluxRenamedFrom = renamedFrom; report.renamed.push(`${renamedFrom} → ${c.name}`); }
      else report.updated.push(`${c.name} (${changedFields(prev, cmp).join(', ')})`);
    }
    return t;
  });
  const renamedAway = new Set(report.renamed.map(r => r.split(' → ')[0]));
  report.removed = removed.filter(r => !renamedAway.has(r.name)).map(r => r.name);
  return { creatures: out, report };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const vi = args.indexOf('--version');
  const input = args.find((a, i) => !a.startsWith('--') && (vi < 0 || i !== vi + 1));
  if (!input) { console.error('usage: npm run conflux:import -- <export.json> [--version X.YY] [--dry-run]'); process.exit(1); }
  const version = vi >= 0 ? args[vi + 1] : (path.basename(input).match(/_(\d+(?:\.\d+)+)_/)?.[1]);
  if (!version) { console.error('Could not read a version from the file name; pass --version.'); process.exit(1); }
  const source = JSON.parse(fs.readFileSync(input, 'utf8')).monster;
  const previous = fs.existsSync(OUT_FILE) ? JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')) : [];
  const { creatures, report } = buildConflux(source, previous, version);
  console.log(`Conflux ${version}: ${creatures.length} creatures (was ${previous.length})`);
  for (const k of ['added', 'renamed', 'updated', 'removed']) {
    console.log(`\n${k.toUpperCase()} (${report[k].length})`);
    for (const line of report[k]) console.log(`  ${line}`);
  }
  if (!args.includes('--dry-run')) {
    fs.writeFileSync(OUT_FILE, JSON.stringify(creatures));
    console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)}`);
  }
}
