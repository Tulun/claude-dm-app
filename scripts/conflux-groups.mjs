#!/usr/bin/env node
// Build the Conflux creature-group index (public/data/conflux-groups.json)
// from the monthly "Individual Links" PDF — the catalog's table of contents:
// section ("Aberrations") → group ("Aboleths", CR 1-20) → Homebrewery doc.
//
//   npm run conflux:groups [-- <pdf or folder>] [--dry-run] [--refresh] [--force]
//
// With no PDF it takes the newest "…Individual Links….pdf" in ~/Desktop/conflux
// (or $CONFLUX_DIR). The TOC layout is inferred from each PDF (see
// parseTocPage), and the result is checked against the last index written:
// if groups or placed creatures drop sharply, nothing is written (exit 2)
// unless --force.
//
// Membership comes from each group's Homebrewery source (the stat block
// "## Name" headings), matched by name against public/data/conflux-creatures.json.
// The docs are the newest revisions, so some names differ from the last
// 5eTools export — those creatures fall back to the group whose name they
// share ("Aboleth Hatchling" → Aboleths). Run it AFTER `npm run conflux:import`.
//
// Docs are cached under node_modules/.cache/conflux-groups (--refresh refetches).
// Restart the dev server afterwards — GET /api/templates caches the join.
// User-facing steps: README.md § Updating Conflux creatures.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CREATURES_FILE = path.join(ROOT, 'public', 'data', 'conflux-creatures.json');
const OUT_FILE = path.join(ROOT, 'public', 'data', 'conflux-groups.json');
const CACHE_DIR = path.join(ROOT, 'node_modules', '.cache', 'conflux-groups');
const SHARE_RE = /^https:\/\/homebrewery\.naturalcrit\.com\/share\/([\w-]+)/;

export const ENCOUNTER_SECTION = 'Cobra Codex Encounters';

// A CR range fragment as the TOC prints it: "1-20", "½", "-24", "M4-8", "30+", "N/A".
const CR_TOKEN = /^(?:[\d½¼⅛⅓¾/M+\-–]+|N\/A)$/;
const median = (nums) => { const a = [...nums].sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : 0; };

/**
 * TOC entries from one page's text items + link annotations.
 * items: [{ str, x, y, size }]  links: [{ rect: [x0, y0, x1, y1], url }]
 * → [{ section, name, cr, url }] in reading order (column by column, top down).
 * `section` carries over from the previous page via `startSection`.
 *
 * Nothing about the layout is hard-coded, so a re-flowed PDF still parses:
 * - an entry is a Homebrewery link; the text inside its box is the group name
 *   plus CR-range fragments (told apart by shape, not font);
 * - section headings are text outside every link box, clearly larger than the
 *   page's group names;
 * - columns are where the link boxes start (clusters of left edges).
 */
export function parseTocPage(items, links, startSection = null) {
  const inside = (it, r) => it.x >= r[0] - 1 && it.x <= r[2] && it.y >= r[1] - 1 && it.y <= r[3] + 1;
  const groupLinks = links.filter(l => SHARE_RE.test(l.url));
  const texts = items.filter(it => it.str.trim());

  const entries = groupLinks
    .map(l => {
      const inRect = texts.filter(it => inside(it, l.rect)).sort((a, b) => b.y - a.y || a.x - b.x);
      // CR fragments trail the name; everything before the first one is the name.
      const firstCr = inRect.findIndex((it, i) => CR_TOKEN.test(it.str.trim()) && i > 0);
      const nameItems = firstCr === -1 ? inRect : inRect.slice(0, firstCr);
      const crItems = firstCr === -1 ? [] : inRect.slice(firstCr);
      return {
        kind: 'entry', x: l.rect[0], y: l.rect[3], url: l.url,
        name: nameItems.map(it => it.str.trim()).join(' ').replace(/\s+/g, ' '),
        cr: crItems.map(it => it.str.trim()).join(''),
        size: median(nameItems.map(it => it.size)),
      };
    })
    .filter(e => e.name);
  const nameSize = median(entries.map(e => e.size));

  // Column starts: left edges of link boxes, clustered (gap > 40pt = new column).
  const starts = [];
  [...new Set(groupLinks.map(l => Math.round(l.rect[0])))].sort((a, b) => a - b)
    .forEach(x => { if (!starts.length || x - starts[starts.length - 1] > 40) starts.push(x); });
  const col = (x) => Math.max(0, starts.filter(s => s <= x + 10).length - 1);

  // Long headings wrap ("Fiends -" / "Archdevils") and accented ones arrive
  // in fragments on one line ("Qi" "ā" "n Shèng Sh"…) — merge them.
  const headings = [];
  texts
    .filter(it => nameSize && it.size > nameSize * 1.2 && !groupLinks.some(l => inside(it, l.rect))
      && !/^cr$/i.test(it.str.trim()) && !/table of contents/i.test(it.str))
    .sort((a, b) => col(a.x) - col(b.x) || b.y - a.y || a.x - b.x)
    .forEach(it => {
      const prev = headings[headings.length - 1];
      if (prev && col(prev.x) === col(it.x) && prev.lastY - it.y < it.size * 1.4) {
        prev.name += Math.abs(prev.lastY - it.y) < 2 ? it.str : ` ${it.str.trim()}`;
        prev.lastY = it.y;
      } else headings.push({ kind: 'section', x: it.x, y: it.y, lastY: it.y, name: it.str });
    });
  headings.forEach(h => { h.name = h.name.replace(/\s+/g, ' ').trim(); });

  // Reading order: columns left→right, each top→bottom.
  const ordered = [...headings, ...entries].sort((a, b) => col(a.x) - col(b.x) || b.y - a.y);
  let section = startSection;
  const out = [];
  for (const e of ordered) {
    if (e.kind === 'section') section = e.name;
    else out.push({ section, name: e.name, cr: e.cr, url: e.url });
  }
  return { entries: out, lastSection: section };
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'", nbsp: ' ' };
const decodeEntities = (s) => s.replace(/&(#?\w+);/g, (m, e) => ENTITIES[e] ?? (e.startsWith('#') ? String.fromCodePoint(Number(e.slice(1))) : m));

/**
 * Stat block names in a Homebrewery source: every "## Name" heading followed
 * within a few lines — before the next heading — by an Armor Class line. Covers both the V3 format
 * ("{{monster,frame" / "## Name {{bonus **cr 1**}}") and the legacy one
 * ("___" / "> ## Name" / "> - **Armor Class** …").
 */
export function parseHomebreweryNames(source) {
  const lines = decodeEntities(String(source)).split('\n');
  const names = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*(?:>\s*)*##(?!#)\s+(.+?)\s*(\{\{.*)?$/);
    if (!m) continue;
    const after = lines.slice(i + 1, i + 15);
    const nextHeading = after.findIndex(l => /^\s*(?:>\s*)*#/.test(l));
    if (!after.slice(0, nextHeading === -1 ? undefined : nextHeading).some(l => /armor class|\*\*AC\*\*/i.test(l))) continue;
    const name = m[1].replace(/\*+/g, '').replace(/<[^>]+>/g, '').trim();
    if (name) names.push(name);
  }
  return names;
}

export const normalizeName = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

// "Wolves" → "wolf", "Mind Flayers" → "mind flayer", "Crows and Ravens" → ["crow", "raven"].
const singular = (w) => {
  if (/ies$/.test(w)) return w.replace(/ies$/, 'y');
  if (/ves$/.test(w)) return w.replace(/ves$/, 'f');
  if (/(ches|shes|sses|xes)$/.test(w)) return w.replace(/es$/, '');
  if (/ss$|us$|is$/.test(w)) return w;
  return w.replace(/s$/, '');
};
export function groupStems(groupName) {
  const base = normalizeName(groupName.split(/\s+-\s+/)[0]);
  return base.split(/\s+and\s+/).map(p => p.split(' ').map((w, i, a) => (i === a.length - 1 ? singular(w) : w)).join(' ')).filter(s => s.length >= 3);
}

/**
 * Assign creatures to groups. groups: [{ name, docNames, encounter? }];
 * creatures: [{ id, name, confluxRenamedFrom? }]
 * → { members: Map(groupIndex → [ids]), unmatched: [names], viaName: count }
 * In order: an exact doc-name match in a family group (a creature can sit in
 * several); else an exact match in an `encounter` group (Cobra Codex — only
 * for creatures no family claims); else the family group with the longest
 * stem found as whole words in the creature's name.
 */
export function assignMembers(groups, creatures) {
  const index = (encounter) => {
    const byName = new Map();
    groups.forEach((g, gi) => !!g.encounter === encounter && (g.docNames || []).forEach(n => {
      const k = normalizeName(n);
      if (!byName.has(k)) byName.set(k, new Set());
      byName.get(k).add(gi);
    }));
    return byName;
  };
  const families = index(false);
  const encounters = index(true);
  const stems = groups.flatMap((g, gi) => (g.encounter ? [] : groupStems(g.name).map(stem => ({ gi, stem, re: new RegExp(`(^| )${stem}s?( |$)`) }))))
    .sort((a, b) => b.stem.length - a.stem.length);
  const members = new Map();
  const add = (gi, id) => { if (!members.has(gi)) members.set(gi, []); members.get(gi).push(id); };
  const unmatched = [];
  let viaName = 0;
  for (const c of creatures) {
    const names = [c.name, c.confluxRenamedFrom].filter(Boolean).map(normalizeName);
    const exactIn = (byName) => new Set(names.flatMap(n => [...(byName.get(n) || [])]));
    const exact = exactIn(families);
    if (exact.size) { exact.forEach(gi => add(gi, c.id)); continue; }
    const hit = stems.find(s => names.some(n => s.re.test(n)));
    if (hit) { add(hit.gi, c.id); viaName++; continue; }
    const enc = exactIn(encounters);
    if (enc.size) enc.forEach(gi => add(gi, c.id)); else unmatched.push(c.name);
  }
  return { members, unmatched, viaName };
}

export async function readToc(pdfPath) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(pdfPath)), verbosity: 0 }).promise;
  const all = [];
  let section = null;
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const items = (await page.getTextContent()).items.map(it => ({ str: it.str, x: it.transform[4], y: it.transform[5], size: Math.hypot(it.transform[0], it.transform[1]) }));
    const links = (await page.getAnnotations()).filter(a => a.url).map(a => ({ rect: a.rect, url: a.url }));
    const { entries, lastSection } = parseTocPage(items, links, section);
    // Only pages that ARE the table of contents (many group links) count — the
    // intro pages link a handful of rules docs.
    if (entries.length >= 10) { all.push(...entries); section = lastSection; }
  }
  // Entries without a CR range are the "Cobra Codex" setting encounters —
  // mixed groups, mostly of creatures that already sit in a family group.
  // They become one section and only take creatures no family claims (its
  // centered region headings don't parse reliably, so they are not kept).
  const tagged = all.map(e => (e.cr ? e : { ...e, section: ENCOUNTER_SECTION, encounter: true }));
  // The same doc can be linked twice (e.g. a group listed under two sections) — keep the first.
  const seen = new Set();
  return tagged.filter(e => (seen.has(e.url) ? false : seen.add(e.url)));
}

async function fetchSource(url, refresh) {
  const id = url.match(SHARE_RE)[1];
  const cached = path.join(CACHE_DIR, `${id}.txt`);
  if (!refresh && fs.existsSync(cached)) return fs.readFileSync(cached, 'utf8');
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`https://homebrewery.naturalcrit.com/source/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(cached, text);
      return text;
    } catch (e) {
      if (attempt >= 3) {
        // Homebrewery down / doc unshared: last month's copy beats no membership.
        if (fs.existsSync(cached)) { console.warn(`  ! ${id}: ${e.message} — using the cached copy`); return fs.readFileSync(cached, 'utf8'); }
        throw e;
      }
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

async function mapLimit(list, limit, fn) {
  const out = new Array(list.length);
  let next = 0;
  await Promise.all(Array.from({ length: limit }, async () => {
    while (next < list.length) { const i = next++; out[i] = await fn(list[i], i); }
  }));
  return out;
}

/**
 * Compare a new index with the last one written, so a PDF whose layout the
 * parser no longer understands can't silently replace a good index.
 * → { problems: [string], added: [name], removed: [name] }
 */
export function checkAgainstPrevious(next, prev) {
  const problems = [];
  const families = (o) => (o?.groups || []).filter(g => g.section !== ENCOUNTER_SECTION);
  const placed = (o) => new Set((o?.groups || []).flatMap(g => g.members || [])).size;
  const nextFam = families(next);
  if (nextFam.length < 100) problems.push(`only ${nextFam.length} creature groups found — is this the "Individual Links" PDF?`);
  const noSection = nextFam.filter(g => !g.section).length;
  if (noSection) problems.push(`${noSection} groups have no section heading — section headings were not recognized`);
  if (!prev) return { problems, added: [], removed: [] };
  const prevFam = families(prev);
  const prevNames = new Set(prevFam.map(g => g.name));
  const nextNames = new Set(nextFam.map(g => g.name));
  const added = [...nextNames].filter(n => !prevNames.has(n));
  const removed = [...prevNames].filter(n => !nextNames.has(n));
  if (nextFam.length < prevFam.length * 0.9) problems.push(`group count fell from ${prevFam.length} to ${nextFam.length}`);
  if (removed.length > Math.max(10, prevFam.length * 0.1)) problems.push(`${removed.length} groups from last time are gone (names parsed differently?)`);
  const before = placed(prev), after = placed(next);
  if (after < before * 0.95) problems.push(`creatures placed in a group fell from ${before} to ${after}`);
  return { problems, added, removed };
}

// No PDF given: the newest "… Individual Links….pdf" in a folder
// (the argument, if it is one, else $CONFLUX_DIR, else ~/Desktop/conflux).
export function findLatestPdf(dir) {
  if (!dir || !fs.existsSync(dir)) return null;
  const pdfs = fs.readdirSync(dir)
    .filter(f => /individual links.*\.pdf$/i.test(f))
    .map(f => path.join(dir, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return pdfs[0] || null;
}

async function main(argv) {
  const args = argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const refresh = args.includes('--refresh');
  const force = args.includes('--force');
  let pdfPath = args.find(a => !a.startsWith('--'));
  if (!pdfPath || (fs.existsSync(pdfPath) && fs.statSync(pdfPath).isDirectory())) {
    const dir = pdfPath || process.env.CONFLUX_DIR || path.join(os.homedir(), 'Desktop', 'conflux');
    pdfPath = findLatestPdf(dir);
    if (!pdfPath) {
      console.error(`No "Individual Links" PDF found in ${dir}.\nUsage: npm run conflux:groups [-- <pdf or folder>] [--dry-run] [--refresh] [--force]`);
      process.exit(1);
    }
  }
  console.log(`Reading ${pdfPath}`);
  const toc = await readToc(pdfPath);
  console.log(`Table of contents: ${toc.length} groups in ${new Set(toc.map(e => e.section)).size} sections`);

  let failed = 0;
  const groups = await mapLimit(toc, 4, async (e, i) => {
    try {
      const docNames = parseHomebreweryNames(await fetchSource(e.url, refresh));
      if ((i + 1) % 100 === 0) console.log(`  fetched ${i + 1}/${toc.length}`);
      return { ...e, docNames };
    } catch (err) {
      failed++;
      console.warn(`  ! ${e.name}: ${err.message} — membership by name only`);
      return { ...e, docNames: [] };
    }
  });

  const creatures = JSON.parse(fs.readFileSync(CREATURES_FILE, 'utf8'));
  const { members, unmatched, viaName } = assignMembers(groups, creatures);
  const out = {
    sourcePdf: path.basename(pdfPath),
    // Encounter entries that claimed no creature (incl. the appendix links —
    // Curses, Conditions…) are left out; empty families stay (newer than the export).
    groups: groups
      .map((g, gi) => ({ section: g.section, name: g.name, cr: g.cr, url: g.url, members: members.get(gi) || [], encounter: g.encounter }))
      .filter(g => g.members.length || !g.encounter)
      .map(({ encounter: _e, ...g }) => g),
  };
  const empty = out.groups.filter(g => !g.members.length);
  const list = (xs) => `${xs.slice(0, 15).join(', ')}${xs.length > 15 ? ', …' : ''}`;
  console.log(`Assigned ${creatures.length - unmatched.length}/${creatures.length} creatures (${viaName} by group name, the rest by doc stat block names).`);
  if (failed) console.log(`${failed} docs could not be fetched.`);
  if (empty.length) console.log(`${empty.length} groups matched no creature in conflux-creatures.json (newer than the export?): ${list(empty.map(g => g.name))}`);
  if (unmatched.length) console.log(`${unmatched.length} creatures in no group (shown as "Ungrouped"): ${list(unmatched)}`);

  let prev = null;
  try { prev = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')); } catch { /* first run */ }
  const { problems, added, removed } = checkAgainstPrevious(out, prev);
  if (prev) console.log(`Since ${prev.sourcePdf || 'the last run'}: ${added.length} new groups${added.length ? ` (${list(added)})` : ''}, ${removed.length} gone${removed.length ? ` (${list(removed)})` : ''}.`);
  if (problems.length) {
    console.error(`\nThis doesn't look right — the PDF layout may have changed:\n${problems.map(p => `  - ${p}`).join('\n')}`);
    if (!force) {
      console.error(`Nothing written; ${path.relative(ROOT, OUT_FILE)} is unchanged. Re-run with --force to write anyway.`);
      process.exit(2);
    }
  }
  if (dryRun) { console.log('Dry run — nothing written.'); return; }
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 1));
  console.log(`Wrote ${path.relative(ROOT, OUT_FILE)}. Restart the dev server to pick it up.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv).catch(e => { console.error(e); process.exit(1); });
}
