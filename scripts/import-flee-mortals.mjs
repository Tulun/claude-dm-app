#!/usr/bin/env node
// Import the stat blocks from your own copy of the Flee, Mortals! PDF (MCDM)
// into the monster library (data/templates.json), tagged book "Flee Mortals".
//
//   npm run fm:import -- "<path to Flee, Mortals! … .pdf>" [--dry-run] [--force] [--verbose] [--json <out>]
//
// Runs entirely locally — no AI, no network. The PDF's text layer carries
// font styles and positions, which is all a stat block needs:
//   title        HypatiaSans Bold 13 ("Angulotl Needler" + "CR 4 Artillery")
//   type line    Italic ("Small Humanoid (Angulotl), Any Alignment" + "1,100 XP")
//   labels       Bold 9 ("Armor Class", "Senses", …)
//   features     Bold-Italic name ("Amphibious.") + Regular text
//   sections     Bold all-caps ("ACTIONS", "VILLAIN ACTIONS", …)
// Anything else (body serif, sidebars, quotes, headings) ends a stat block.
//
// Two stat blocks that share a page sit in horizontal bands across both
// columns, so a block's right-column continuation starts level with its own
// title — continuations are matched to blocks by that y position, not by
// reading order.
//
// Existing `fm-*` templates are left untouched unless --force (so your edits
// survive a re-run). Retainer stat blocks (level-scaled, for the party) are
// skipped. Stop the dev server or close the Monsters page first: an open page
// POSTs its whole list back and would drop the new entries.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATES_FILE = path.join(ROOT, 'data', 'templates.json');
export const BOOK = 'Flee Mortals';
export const ID_PREFIX = 'fm-';
export const VILLAIN_PREFIX = 'Villain Action ';

// ── 1. PDF → positioned, styled text items ─────────────────────────────────

const styleOf = (fontName) => {
  const n = String(fontName || '');
  if (!/Hypatia/i.test(n)) return 'other';
  if (/BoldIt/i.test(n)) return 'bi';
  if (/Black/i.test(n)) return 'other';
  if (/Bold/i.test(n)) return 'b';
  if (/It/i.test(n)) return 'i';
  return 'r';
};

export async function readPdf(pdfPath) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(pdfPath)), verbosity: 0, disableFontFace: true }).promise;
  const pages = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    await page.getOperatorList(); // loads the fonts so their real names resolve
    const { width } = page.getViewport({ scale: 1 });
    const tc = await page.getTextContent();
    const fontName = (id) => { try { return page.commonObjs.get(id).name; } catch { return ''; } };
    pages.push({
      page: p,
      width,
      items: tc.items.filter(i => i.str?.trim()).map(i => ({
        s: i.str,
        x: i.transform[4],
        y: i.transform[5],
        w: i.width,
        size: Math.hypot(i.transform[2], i.transform[3]),
        style: styleOf(fontName(i.fontName)),
      })),
    });
    page.cleanup();
  }
  return pages;
}

// ── 2. items → lines per column ────────────────────────────────────────────

const near = (a, b, tol) => Math.abs(a - b) <= tol;

// Lines of one page, per column (0 = left, 1 = right), top to bottom.
// Each line: { x, y, segs: [{ s, style, size }] }. Tiny superscript markers
// (the book's spell-list footnote glyphs) are dropped.
export function pageLines({ width, items }) {
  const cols = [[], []];
  for (const it of items) {
    if (it.size < 7) continue;
    const col = it.x < width / 2 ? 0 : 1;
    let line = cols[col].find(l => near(l.y, it.y, 2.5));
    if (!line) { line = { y: it.y, items: [] }; cols[col].push(line); }
    line.items.push(it);
  }
  return cols.map(lines => lines
    .sort((a, b) => b.y - a.y)
    .map(l => {
      const its = l.items.sort((a, b) => a.x - b.x);
      // sp: whether a space separates this piece from the previous one
      // (measured from the glyph positions, so a drop cap "F" + "orce" joins).
      return {
        x: its[0].x, y: l.y,
        segs: its.map((i, k) => ({
          s: i.s, style: i.style, size: i.size,
          ...(k && its[k - 1].w != null ? { sp: i.x - (its[k - 1].x + its[k - 1].w) > 0.8 || /\s$/.test(its[k - 1].s) } : {}),
        })),
      };
    }));
}

const isTitle = (l) => l.segs[0].style === 'b' && l.segs[0].size > 12 && l.segs[0].size < 14;
const isBodyStyle = (seg) => ['b', 'i', 'r', 'bi'].includes(seg.style) && near(seg.size, 9, 0.6);

// The column's left margin: the most common start x of stat-block anchor
// lines (labels, section headers, feature names — bold 9pt), so a sidebar of
// regular text set at another indent can't win.
function columnMargin(lines) {
  const counts = new Map();
  for (const l of lines) {
    if (!isBodyStyle(l.segs[0]) || !['b', 'bi'].includes(l.segs[0].style)) continue;
    const k = Math.round(l.x);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  let best = null;
  for (const [k, n] of counts) if (best == null || n > counts.get(best) || (n === counts.get(best) && k < best)) best = k;
  return best;
}

// A line that can belong to a stat block: title, or body-styled text that
// starts near the column margin (paragraph and bullet indents, text wrapped
// around art). Quotes are serif; their attributions sit much further right.
const isXpLine = (l) => /^[\d,]+\s*XP$/.test(l.segs.map(x => x.s).join('').trim());
function isStatLine(l, margin) {
  if (isTitle(l) || isXpLine(l)) return true;
  if (!l.segs.every(s => isBodyStyle(s))) return false;
  return margin != null && l.x >= margin - 5 && l.x <= margin + 60;
}

// Runs of consecutive stat-block lines in one column (a gap > 28pt or any
// non-stat-block line breaks a run; a title always starts a new one).
export function columnRuns(lines) {
  const margin = columnMargin(lines);
  const runs = [];
  let cur = null;
  for (const l of lines) {
    if (!isStatLine(l, margin)) { cur = null; continue; }
    // A name set on two lines ("Frost Giant" / "Storm Hurler") stays one title.
    const headerOnly = cur && cur.lines.every(x => isTitle(x) || isXpLine(x));
    const titleGoesOn = isTitle(l) && headerOnly && cur.lines.at(-1).y - l.y < 16;
    if (!cur || (isTitle(l) && !titleGoesOn) || cur.lines.at(-1).y - l.y > 28) {
      cur = { lines: [], margin, top: l.y };
      runs.push(cur);
    }
    cur.lines.push(l);
  }
  return runs;
}

// ── 3. runs → stat blocks (with continuations matched by position) ────────

// Returns [{ page, lines: [...], margins }] — each block's lines in reading
// order, every line tagged with its own column margin (for indent detection).
export function collectBlocks(pages) {
  const blocks = [];
  const dropped = []; // stat-block-looking text no block claimed (sidebars, optional-feature tables)
  let lastOnPrevPage = null; // block whose text ran lowest at the end of the previous page
  for (const pg of pages) {
    const cols = pageLines(pg);
    const [left, right] = cols.map(columnRuns);
    // Text that continues a block without being level with its title must
    // start at the top of the page's text area — a run lower down after a
    // heading is a sidebar, not a stat block that carried over.
    const pageTop = Math.max(...cols.flat().filter(l => isBodyStyle(l.segs[0]) || isTitle(l)).map(l => l.y));
    // …and nothing else (a sidebar heading, a quote) may sit above it in its column.
    const atTop = (run, c) => run.top >= pageTop - 15 && !cols[c].some(l => l.y > run.top + 1);
    const tag = (run) => run.lines.map(l => ({ ...l, margin: run.margin }));
    const leftStarts = [];
    let lastHere = null;
    left.forEach((run, i) => {
      if (isTitle(run.lines[0])) {
        const b = { page: pg.page, lines: tag(run) };
        blocks.push(b);
        leftStarts.push({ y: run.top, block: b });
        lastHere = b;
      } else if (i === 0 && lastOnPrevPage && atTop(run, 0)) {
        lastOnPrevPage.lines.push(...tag(run));
        lastHere = lastOnPrevPage;
      } else if (looksLikeStatText(run)) {
        dropped.push(`p${pg.page}: left-column text "${preview(run)}"`);
      }
    });
    right.forEach((run, i) => {
      if (isTitle(run.lines[0])) {
        const b = { page: pg.page, lines: tag(run) };
        blocks.push(b);
        lastHere = b;
        return;
      }
      // Level with a left-column block's title → that block's continuation.
      const band = leftStarts.find(s => near(s.y, run.top, 4));
      const target = band?.block
        ?? (i === 0 && atTop(run, 1) ? (leftStarts.length ? leftStarts.at(-1).block : lastHere ?? lastOnPrevPage) : null);
      if (target) {
        target.lines.push(...tag(run));
        lastHere = target;
      } else if (looksLikeStatText(run)) {
        dropped.push(`p${pg.page}: right-column text "${preview(run)}"`);
      }
    });
    lastOnPrevPage = lastHere;
  }
  return { blocks, dropped };
}

const lineText = (l) => joinSegs(l.segs.map(s => s.s));
const preview = (run) => lineText(run.lines[0]).slice(0, 60);
// Only worth a warning when it reads like a stat block piece.
const looksLikeStatText = (run) => run.lines.some(l => l.segs[0].style === 'bi' || /^[A-Z ]{5,}$/.test(l.segs[0].s.trim()));

// ── 4. text helpers ────────────────────────────────────────────────────────

// Join text pieces with a space unless punctuation makes one wrong.
// Pieces may be strings or line segments; a segment's measured `sp` wins.
export function joinSegs(parts) {
  let out = '';
  for (const part of parts) {
    const raw = typeof part === 'string' ? part : part.s;
    const p = raw.replace(/\s+/g, ' ');
    if (typeof part === 'object' && part.sp != null && out && p.trim()) {
      const space = part.sp && !out.endsWith(' ') && !/^[.,;:)\]’]/.test(p.trimStart());
      out += (space ? ' ' : '') + p.trimStart();
      continue;
    }
    if (!p.trim()) { if (out && !out.endsWith(' ')) out += ' '; continue; }
    if (!out || out.endsWith(' ') || /^[.,;:)\]’']/.test(p.trimStart()) || /[([‘]$/.test(out)) out += p.trimStart();
    else out += ' ' + p.trimStart();
  }
  return out.replace(/\s+/g, ' ').trim();
}

// Append a wrapped line. A lone "-" piece at the end of a line is a soft
// (typesetter) hyphen: drop it and join the word. A hyphen that is part of
// the text ("20-foot-") is kept, joined without a space.
const endsSoft = (parts) => parts.length > 1 && parts.at(-1).trim() === '-';
const stripSoft = (s) => s.replace(/\s*-$/, '');

// Builds a paragraph-aware string from wrapped lines.
class TextBuilder {
  constructor() { this.text = ''; this.pendingSoft = false; this.pendingHard = false; }
  add(segs, { paragraph = false } = {}) {
    const parts = segs.map(s => s.s);
    let piece = joinSegs(segs);
    const soft = endsSoft(parts);
    if (soft) piece = stripSoft(piece);
    if (!this.text) this.text = piece;
    else if (paragraph) this.text += '\n' + piece;
    else if (this.pendingSoft) this.text += piece;
    else if (this.pendingHard) this.text += piece;
    else this.text += ' ' + piece;
    this.pendingSoft = soft;
    this.pendingHard = !soft && /[A-Za-z]-$/.test(piece) && !/\s-$/.test(piece);
    return this;
  }
  toString() { return this.text.trim(); }
}

const MINUS = /[−–]/g;
const num = (s) => Number(String(s).replace(MINUS, '-').replace(/[^\d-]/g, ''));

// ── 5. one block's lines → parsed stat block ───────────────────────────────

const LABELS = {
  'Armor Class': 'ac', 'Hit Points': 'hp', Speed: 'speed', 'Saving Throws': 'savingThrows', Skills: 'skills',
  'Damage Vulnerabilities': 'vulnerabilities', 'Damage Vulnerability': 'vulnerabilities',
  'Damage Resistances': 'resistances', 'Damage Resistance': 'resistances',
  'Damage Immunities': 'damageImmunities', 'Damage Immunity': 'damageImmunities',
  'Condition Immunities': 'conditionImmunities', 'Condition Immunity': 'conditionImmunities',
  Senses: 'senses', Languages: 'languages', 'Proficiency Bonus': 'profBonus', 'Proficiency Bonus (PB)': 'profBonus',
};

const SECTIONS = {
  ACTIONS: 'actions', ACTION: 'actions', 'BONUS ACTIONS': 'bonusActions', 'BONUS ACTION': 'bonusActions',
  REACTIONS: 'reactions', REACTION: 'reactions', 'VILLAIN ACTIONS': 'villainActions',
  'LEGENDARY ACTIONS': 'legendaryActions', 'UTILITY SPELLS': 'utilitySpells', FEATURES: 'features',
};

const isSectionHeader = (l) => l.segs.length === 1 && l.segs[0].style === 'b' && SECTIONS[l.segs[0].s.trim()];
const isAbilityHeader = (l) => l.segs.length === 6 && l.segs.every((s, i) => s.s.trim() === ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'][i]);
const labelOf = (l) => (l.segs[0].style === 'b' && !isSectionHeader(l) ? l.segs[0].s.trim() : null);

// "Huge Fiend (Demon, Category 5), Typically Chaotic Evil" → size / type / alignment.
export function parseTypeLine(text) {
  let depth = 0;
  let split = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(') depth++;
    else if (text[i] === ')') depth--;
    else if (text[i] === ',' && depth === 0) split = i;
  }
  const head = (split >= 0 ? text.slice(0, split) : text).trim();
  const alignment = split >= 0 ? text.slice(split + 1).trim() : '';
  const m = /^((?:Tiny|Small|Medium|Large|Huge|Gargantuan)(?:\s+or\s+(?:Tiny|Small|Medium|Large|Huge|Gargantuan))?)\s+(.*)$/i.exec(head);
  return { size: m ? m[1] : 'Medium', creatureType: m ? m[2] : head, alignment };
}

// New paragraph: a first-line indent (~12pt) or a bullet. Bullet wraps and
// text wrapped around art are indented further and just continue.
// List item: "• …" or a numbered "1." option.
const isBullet = (l) => l.segs[0].s.trim().startsWith('•') || /^\d+\.$/.test(l.segs[0].s.trim());
const isParagraphStart = (l, indent) => isBullet(l) || (indent > 6 && indent < 16);

export function parseBlock(lines) {
  // Header: one or two title lines (name pieces are 13pt; the "CR 4 Artillery"
  // tag is 9pt) plus an XP line that can sit between them.
  let i = 0;
  const nameSegs = [];
  const tagSegs = [];
  let xp;
  for (; i < lines.length && (isTitle(lines[i]) || isXpLine(lines[i])); i++) {
    if (isXpLine(lines[i])) { xp = num(lines[i].segs.map(s => s.s).join('')); continue; }
    lines[i].segs.forEach((s, k) => {
      if (s.size > 12) nameSegs.push(k === 0 && nameSegs.length ? { ...s, sp: true } : s);
      else tagSegs.push(s);
    });
  }
  const tag = joinSegs(tagSegs);
  const out = { name: joinSegs(nameSegs).replace(/,$/, ''), tag, labels: {}, extraLabels: {}, abilities: null, sections: {}, intros: {} };
  if (xp != null) out.xp = xp;
  const crm = /^CR\s+(\S+)\s*(.*)$/.exec(tag);
  if (crm) { out.cr = crm[1]; out.role = crm[2].trim() || null; }

  // Type line(s): italic text up to the first label; a Regular piece is the XP.
  const typeParts = [];
  for (; i < lines.length && !labelOf(lines[i]); i++) {
    for (const s of lines[i].segs) {
      if (/^[\d,]+\s*XP$/.test(s.s.trim())) out.xp = num(s.s);
      else typeParts.push(s);
    }
  }
  Object.assign(out, parseTypeLine(joinSegs(typeParts)));

  // Labels and the ability table.
  let curLabel = null;
  for (; i < lines.length; i++) {
    const l = lines[i];
    if (isAbilityHeader(l)) {
      const vals = joinSegs(lines[i + 1]?.segs.map(s => s.s) ?? []).match(/\d+/g)?.map(Number);
      // "7 (−2) 18 (+4) …" → every other number is the score.
      if (vals) out.abilities = vals.filter((_, k) => k % 2 === 0).slice(0, 6);
      i++;
      curLabel = null;
      continue;
    }
    const label = labelOf(l);
    if (label && (LABELS[label] || l.segs.length > 1)) {
      curLabel = LABELS[label] ? out.labels : out.extraLabels;
      const key = LABELS[label] || label;
      curLabel[key] = new TextBuilder().add(l.segs.slice(1));
      curLabel = { bag: curLabel, key };
      continue;
    }
    if (l.segs[0].style === 'r' && curLabel) { curLabel.bag[curLabel.key].add(l.segs); continue; }
    break;
  }
  for (const bag of [out.labels, out.extraLabels]) for (const k in bag) bag[k] = bag[k].toString();

  // Features and sections.
  let section = 'traits';
  let entry = null;
  let intro = null;
  const push = (sec, e) => { (out.sections[sec] ||= []).push(e); };
  for (; i < lines.length; i++) {
    const l = lines[i];
    const header = isSectionHeader(l);
    if (header) { section = header; entry = null; intro = null; continue; }
    const first = l.segs[0];
    const indent = l.x - l.margin;
    const startsEntry = first.style === 'bi' || (first.style === 'b' && /^Action \d+:/.test(first.s.trim()));
    if (startsEntry && !(entry && !entry.nameDone)) {
      // Name = leading bold pieces up to the one ending in ".".
      let k = 0;
      let nm = '';
      // (a stray regular ")." closing the name still belongs to it)
      while (k < l.segs.length && (['bi', 'b'].includes(l.segs[k].style) || (k && /^[).]+$/.test(l.segs[k].s.trim())))) {
        nm = joinSegs([nm, l.segs[k]]);
        k++;
        if (/[.!?]$/.test(nm)) break;
      }
      entry = { name: nm, nameDone: /[.!?]$/.test(nm), body: new TextBuilder() };
      if (k < l.segs.length) entry.body.add(l.segs.slice(k));
      push(section, entry);
      intro = null;
      continue;
    }
    if (entry && !entry.nameDone && first.style === 'bi') {
      // Feature name wrapped onto the next line.
      let k = 0;
      while (k < l.segs.length && l.segs[k].style === 'bi') { entry.name = joinSegs([entry.name, l.segs[k].s]); k++; }
      entry.nameDone = /[.!?]$/.test(entry.name);
      if (k < l.segs.length) entry.body.add(l.segs.slice(k));
      continue;
    }
    if (entry && section !== 'utilitySpells') {
      // A bold "Option." line inside an entry ("Hellbite.", "Flame Bloom.") is a
      // sub-option on its own line. Sub-options and villain actions use a
      // hanging indent, so an indented line under them is a wrap.
      const subOption = first.style === 'b' && (/\.$|^\d+\./.test(first.s.trim()) || /^\./.test(l.segs[1]?.s.trim() ?? ''));
      if (subOption) entry.hanging = true;
      const hanging = entry.hanging || section === 'villainActions';
      let para;
      if (isBullet(l)) { para = true; entry.inList = true; }
      else if (entry.inList) {
        // Bullet wraps are indented; text back at the margin ends the list.
        para = indent <= 6;
        if (para) entry.inList = false;
      } else para = subOption || (!hanging && isParagraphStart(l, indent));
      para = para && entry.body.text !== '';
      entry.body.add(l.segs, { paragraph: para });
      continue;
    }
    // Section text without a named entry: villain-action rules, utility spells.
    if (!intro) { intro = new TextBuilder(); out.intros[section] = intro; }
    const listLine = /^(At will|\d+\/day|Cantrips|\d+(st|nd|rd|th))/i.test(joinSegs(l.segs.map(s => s.s)));
    // Utility spell lists: each "At will:" / "1/day each:" line is its own
    // paragraph; their hanging-indented wraps are not.
    const para = section === 'utilitySpells' ? listLine : listLine || (intro.text !== '' && isParagraphStart(l, indent));
    intro.add(l.segs, { paragraph: para });
  }
  for (const sec in out.sections) {
    out.sections[sec] = out.sections[sec].map(e => ({ name: e.name.replace(/\.$/, '').trim(), description: e.body.toString() }));
  }
  for (const sec in out.intros) out.intros[sec] = out.intros[sec].toString();
  return out;
}

// ── 6. parsed block → app template ─────────────────────────────────────────

export const slugify = (name) => `${ID_PREFIX}${name.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

const CR_XP = {
  '0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800, '6': 2300,
  '7': 2900, '8': 3900, '9': 5000, '10': 5900, '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000,
  '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000, '21': 33000, '22': 41000, '23': 50000,
  '24': 62000, '25': 75000, '26': 90000, '27': 105000, '28': 120000, '29': 135000, '30': 155000,
};
const crNum = (cr) => (String(cr).includes('/') ? Number(cr.split('/')[0]) / Number(cr.split('/')[1]) : Number(cr));
const profForCr = (cr) => Math.max(2, Math.floor((Math.max(crNum(cr), 1) - 1) / 4) + 2);
const sentence = (s) => (s && !/[.!?]$/.test(s) ? `${s}.` : s);

// "20 ft., climb 20 ft., swim 30 ft. (hover)" → "20, climb 20, swim 30 (hover)" (the app's speed format).
export const formatSpeed = (s) => String(s || '').replace(/\s*ft\.?/g, '').replace(/\s+,/g, ',').trim();

export function toTemplate(b) {
  const L = b.labels;
  const hp = /^(\d+)\s*(?:\(([^)]+)\))?/.exec(L.hp || '');
  const s = b.sections;
  const villain = (s.villainActions || []).map(a => ({ ...a, name: a.name.replace(/^Action (\d+):\s*/, `${VILLAIN_PREFIX}$1: `) }));
  const traits = [...(s.traits || [])];
  // Each spell-list line gets a closing period: the combat tracker's
  // spellcasting parser reads "At will: a, b" up to the next ".".
  if (b.intros.utilitySpells) {
    const description = b.intros.utilitySpells.split('\n').map(l => (/^(At will|\d+\/day)/i.test(l) && !/[.:]$/.test(l) ? `${l}.` : l)).join('\n');
    traits.push({ name: 'Spellcasting (Utility Spells)', description });
  }
  const notes = [
    b.alignment && `Alignment: ${b.alignment}.`,
    b.role && `Role: ${b.role}.`,
    ...Object.entries(b.extraLabels).map(([k, v]) => `${k}: ${sentence(v)}`),
    b.intros.villainActions && `Villain Actions: ${b.intros.villainActions}`,
  ].filter(Boolean).join(' ');
  const [str, dex, con, int, wis, cha] = b.abilities || [10, 10, 10, 10, 10, 10];
  const t = {
    id: slugify(b.name),
    name: b.name,
    source: 'custom',
    book: BOOK,
    size: b.size,
    creatureType: b.creatureType,
    ac: num(/^\s*(\d+)/.exec(L.ac || '')?.[1] ?? 10),
    maxHp: hp ? Number(hp[1]) : 1,
    hitDice: hp?.[2]?.trim() || '',
    speed: formatSpeed(L.speed),
    cr: b.cr,
    xp: b.xp ?? CR_XP[b.cr] ?? 0,
    profBonus: L.profBonus ? num(L.profBonus) : profForCr(b.cr),
    str, dex, con, int, wis, cha,
    savingThrows: (L.savingThrows || '').replace(MINUS, '-'),
    skills: (L.skills || '').replace(MINUS, '-'),
    vulnerabilities: L.vulnerabilities || '',
    resistances: L.resistances || '',
    immunities: [L.damageImmunities, L.conditionImmunities].filter(Boolean).join('; '),
    senses: L.senses || '',
    languages: L.languages || '',
    traits,
    actions: s.actions || [],
    bonusActions: s.bonusActions || [],
    reactions: s.reactions || [],
    notes,
  };
  const legendary = [...(s.legendaryActions || []), ...villain];
  if (legendary.length) t.legendaryActions = legendary;
  // Villain actions: one per round (after an enemy's turn), each once per encounter.
  if (villain.length && !s.legendaryActions?.length) t.legendaryActionUses = 1;
  return t;
}

// Problems worth reporting before anything is written.
export function validate(t) {
  const problems = [];
  if (!t.cr || !(t.cr in CR_XP)) problems.push(`CR "${t.cr}"`);
  if (!(t.ac > 0)) problems.push('AC');
  if (!(t.maxHp > 0)) problems.push('HP');
  if (!t.speed) problems.push('speed');
  if (['str', 'dex', 'con', 'int', 'wis', 'cha'].some(k => !(t[k] > 0 && t[k] <= 30))) problems.push('ability scores');
  if (!t.actions.length && !t.traits.length) problems.push('no traits or actions');
  for (const a of [...t.traits, ...t.actions, ...t.bonusActions, ...t.reactions, ...(t.legendaryActions || [])]) {
    if (!a.name || !a.description) problems.push(`empty entry "${a.name}"`);
  }
  return problems;
}

// ── 7. whole PDF → templates, and merging into the library ────────────────

export function extractTemplates(pages) {
  const { blocks, dropped } = collectBlocks(pages);
  const warnings = [];
  const templates = [];
  const skipped = [];
  for (const blk of blocks) {
    const parsed = parseBlock(blk.lines);
    if (!parsed.cr) { skipped.push(`${parsed.name} (p${blk.page}, ${parsed.tag || 'no CR'})`); continue; }
    const t = toTemplate(parsed);
    const problems = validate(t);
    if (problems.length) warnings.push(`p${blk.page} ${t.name}: ${problems.join(', ')}`);
    templates.push({ ...t, _page: blk.page });
  }
  // Same name twice (variant blocks): keep ids unique.
  const seen = new Map();
  for (const t of templates) {
    const n = (seen.get(t.id) || 0) + 1;
    seen.set(t.id, n);
    if (n > 1) t.id = `${t.id}-${n}`;
  }
  return { templates, skipped, warnings, dropped };
}

const normName = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Adds new fm-* templates; existing ones are kept as saved unless `force`.
// A monster you already added by hand (a custom template of the same name with
// no book, or tagged with this book) is skipped rather than duplicated —
// other books' same-name monsters (MM Ogre vs FM Ogre) are different stat
// blocks and both stay.
export function mergeTemplates(existing, incoming, { force = false } = {}) {
  const byId = new Map(existing.map((t, i) => [t.id, i]));
  const handMade = new Map(existing
    .filter(t => !String(t.id).startsWith(ID_PREFIX) && !String(t.id).startsWith('mm-') && t.source !== 'mm'
      && (!String(t.book ?? '').trim() || t.book === BOOK))
    .map(t => [normName(t.name), t]));
  const merged = [...existing];
  const report = { added: [], replaced: [], kept: [], alreadyByHand: [] };
  for (const raw of incoming) {
    const { _page, ...t } = raw;
    if (!byId.has(t.id) && handMade.has(normName(t.name))) report.alreadyByHand.push(t.name);
    else if (!byId.has(t.id)) { merged.push(t); report.added.push(t.name); }
    else if (force) { merged[byId.get(t.id)] = t; report.replaced.push(t.name); }
    else report.kept.push(t.name);
  }
  return { templates: merged, report };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const input = args.find(a => !a.startsWith('--'));
  if (!input) { console.error('usage: npm run fm:import -- "<Flee, Mortals! PDF>" [--dry-run] [--force] [--verbose] [--json <out>]'); process.exit(1); }
  const ji = args.indexOf('--json');
  const pages = await readPdf(input);
  const { templates, skipped, warnings, dropped } = extractTemplates(pages);
  console.log(`Parsed ${templates.length} stat blocks from ${pages.length} pages.`);
  console.log(`Skipped ${skipped.length} blocks without a CR (retainers, companions, examples).`);
  if (args.includes('--verbose')) {
    for (const k of skipped) console.log(`  skipped ${k}`);
    for (const d of dropped) console.log(`  not part of a stat block: ${d}`);
  } else if (dropped.length) console.log(`Ignored ${dropped.length} sidebar / optional-feature passages (--verbose lists them).`);
  if (warnings.length) { console.log(`\nPROBLEMS (${warnings.length}) — check these in the library after importing`); for (const w of warnings) console.log(`  ${w}`); }
  if (ji >= 0) { fs.writeFileSync(args[ji + 1], JSON.stringify(templates, null, 2)); console.log(`\nWrote parsed blocks to ${args[ji + 1]}`); }

  const raw = fs.readFileSync(TEMPLATES_FILE, 'utf8');
  let parsed;
  try { parsed = JSON.parse(raw); } catch (e) {
    // Never overwrite a corrupt data file (api-route-conventions skill).
    console.error(`data/templates.json is not valid JSON (${e.message}) — fix or restore it first; nothing written.`);
    process.exit(1);
  }
  const existing = parsed.templates || parsed;
  const { templates: merged, report } = mergeTemplates(existing, templates, { force: args.includes('--force') });
  console.log(`\nAdded ${report.added.length}, replaced ${report.replaced.length}, kept ${report.kept.length} already imported (use --force to overwrite).`);
  if (report.alreadyByHand.length) console.log(`Skipped ${report.alreadyByHand.length} you already have as custom templates: ${report.alreadyByHand.join(', ')}`);
  if (args.includes('--dry-run')) { console.log('Dry run — nothing written.'); process.exit(0); }
  if (!report.added.length && !report.replaced.length) process.exit(0);
  fs.writeFileSync(`${TEMPLATES_FILE}.bak`, raw);
  const out = Array.isArray(parsed) ? merged : { ...parsed, templates: merged };
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(out, null, 2), 'utf8');
  console.log(`Wrote data/templates.json (previous copy in data/templates.json.bak). Reload any open Monsters page.`);
}
