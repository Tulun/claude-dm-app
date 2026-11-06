'use client';

import { useState } from 'react';
import { getModNum, formatMod } from '../../utils/rules';
import { formatSpeeds, parseSavingThrows, parseSenses, splitDefenses, parseUsage, abilityLabel } from '../../combat/monsterAbilities';
import { StatText } from '../../combat/components/MonsterAbilities';
import {
  habitatsOf,
  ABILITY_KEYS, SECTIONS, parseAlignment, getInitiativeBonus, getLegendaryUses, splitDescription, splitList, splitLore,
} from '../statBlock';

const PALETTE = {
  amber: { title: 'text-amber-400', bar: 'bg-amber-500', name: 'text-amber-300', marker: 'bg-amber-900/60 text-amber-200' },
  red: { title: 'text-red-400', bar: 'bg-red-500', name: 'text-red-300', marker: 'bg-red-900/60 text-red-200' },
  orange: { title: 'text-orange-400', bar: 'bg-orange-500', name: 'text-orange-300', marker: 'bg-orange-900/60 text-orange-200' },
  cyan: { title: 'text-cyan-400', bar: 'bg-cyan-500', name: 'text-cyan-300', marker: 'bg-cyan-900/60 text-cyan-200' },
  purple: { title: 'text-purple-400', bar: 'bg-purple-500', name: 'text-purple-300', marker: 'bg-purple-900/60 text-purple-200' },
};

const usageBadge = (name) => {
  const u = parseUsage(name);
  if (!u) return null;
  if (u.kind === 'perDay') return `${u.max}/Day${/each/i.test(name) ? ' each' : ''}`;
  if (u.kind === 'recharge') return u.min === 6 ? 'Recharge 6' : `Recharge ${u.min}–6`;
  return 'Per Rest';
};

const VitalTile = ({ label, value, sub, testId }) => (
  <div className="rounded-lg bg-stone-950/50 border border-stone-700/60 text-center px-2 py-2 min-w-0" data-testid={testId}>
    <div className="text-xs uppercase tracking-wider text-stone-500 font-bold truncate">{label}</div>
    <div className="text-2xl font-bold text-stone-50 leading-tight truncate">{value}</div>
    {sub && <div className="text-xs text-stone-500 truncate">{sub}</div>}
  </div>
);

const ChipRow = ({ label, items, chip, labelClass = 'text-stone-500' }) => {
  if (!items?.length) return null;
  return (
    <div>
      <div className={`text-[11px] uppercase tracking-wider font-semibold mb-1 ${labelClass}`}>{label}</div>
      <div className="flex flex-wrap gap-1">
        {items.map((s, i) => <span key={i} className={`px-2 py-0.5 rounded text-sm ${chip}`}>{s}</span>)}
      </div>
    </div>
  );
};

// Outcome labels in 2024 stat blocks ("Hit:", "Failure:", "Success:") get
// their own emphasis so the branches of an ability scan at a glance.
const LABEL_RE = /((?:First |Second )?Failure or Success:|(?:First |Second )?Failure:|Success:|Hit(?: or Miss)?:|Miss:|Trigger:|Response:)/;
const RichText = ({ text }) => String(text ?? '').split(LABEL_RE).map((part, i) =>
  i % 2 === 1
    ? <span key={i} className="font-semibold italic text-stone-100">{part}</span>
    : <StatText key={i} text={part} />
);

const Description = ({ text, palette }) => {
  const blocks = splitDescription(text);
  return (
    <div className="space-y-1.5 text-stone-300 leading-relaxed">
      {blocks.map((b, i) => b.kind === 'p' ? (
        <p key={i}><RichText text={b.text} /></p>
      ) : (
        <div key={i} className="flex gap-2.5 pl-1">
          <span className={`shrink-0 mt-0.5 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${palette.marker}`}>{b.marker}</span>
          <div className="min-w-0">
            {b.name && <span className="font-semibold text-stone-100">{b.name}. </span>}
            <RichText text={b.text} />
          </div>
        </div>
      ))}
    </div>
  );
};

const AbilitySection = ({ section, items, extra }) => {
  if (!items?.length) return null;
  const p = PALETTE[section.color];
  return (
    <section data-testid={`section-${section.key}`}>
      <div className="flex items-baseline gap-3 mb-2">
        <span className={`w-1 h-5 rounded ${p.bar} self-center`} />
        <h3 className={`text-lg font-bold ${p.title}`}>{section.label}</h3>
        {extra && <span className="text-sm text-stone-400">{extra}</span>}
      </div>
      <div className="divide-y divide-stone-800/80 rounded-lg border border-stone-800 bg-stone-950/30">
        {items.map((a, i) => {
          const badge = usageBadge(a.name || '');
          return (
            <div key={i} className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`font-bold italic ${p.name}`}>{badge ? abilityLabel(a.name) : (a.name || 'Unnamed')}</span>
                {badge && <span className="text-[11px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">{badge}</span>}
              </div>
              {a.description && <Description text={a.description} palette={p} />}
            </div>
          );
        })}
      </div>
    </section>
  );
};

// Flavor text from the book, collapsed to a two-line teaser until expanded.
// Plain text only (no HTML) — imported from screenshots or typed in the editor.
const LorePanel = ({ lore, defaultOpen }) => {
  const [open, setOpen] = useState(defaultOpen);
  const blocks = splitLore(lore);
  if (!blocks.length) return null;
  const teaser = blocks.find(b => b.text)?.text || blocks[0].heading;
  return (
    <section data-testid="lore" className="rounded-lg border border-amber-900/40 bg-amber-950/10">
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-amber-950/20 rounded-lg">
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-amber-500/90">Lore</span>
        {!open && <span className="flex-1 min-w-0 truncate text-sm italic text-stone-400">{teaser}</span>}
        {open && <span className="flex-1" />}
        <span className="shrink-0 text-xs text-amber-400/80">{open ? 'Hide' : 'Read more'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 max-w-prose">
          {blocks.map((b, i) => (
            <div key={i}>
              {b.heading && <h3 className="font-semibold text-amber-200/90 mb-1">{b.heading}</h3>}
              {b.text && <p className="text-[15px] leading-relaxed text-stone-300 italic">{b.text}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

/**
 * A monster template rendered as a full stat block: vitals, ability scores
 * with saves, a details column (skills / senses / languages / defenses /
 * notes) and the ability sections with numbers highlighted. `compact` stacks
 * everything in one column (the editor's live preview).
 */
export default function StatBlockView({ template: t, compact = false, stickyTop = null }) {
  const saves = parseSavingThrows(t.savingThrows);
  const senses = parseSenses(t.senses);
  const alignment = parseAlignment(t.notes);
  const init = getInitiativeBonus(t);
  const legendary = getLegendaryUses(t);
  const notes = String(t.notes ?? '').replace(/Alignment:\s*[^.]+\.\s*/i, '').trim();
  const subtitle = [[t.size, t.creatureType].filter(Boolean).join(' '), alignment].filter(Boolean).join(', ');
  const xp = typeof t.xp === 'number' ? t.xp.toLocaleString() : t.xp;

  const details = (
    <div className="space-y-4">
      <ChipRow label="Habitat" items={habitatsOf(t)} chip="bg-lime-950/40 border border-lime-800/50 text-lime-200" labelClass="text-lime-500" />
      {t.confluxGroups?.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider font-semibold mb-1 text-sky-500">Conflux group</div>
          <div className="flex flex-wrap gap-1">
            {t.confluxGroups.map(g => (
              <a key={g.url || g.name} href={g.url} target="_blank" rel="noopener noreferrer" title={`${g.section} — open Conflux's page for this group`}
                className="px-2 py-0.5 rounded text-sm bg-sky-950/40 border border-sky-800/50 text-sky-200 hover:text-amber-200 hover:border-amber-700">{g.name} ↗</a>
            ))}
          </div>
        </div>
      )}
      <ChipRow label="Skills" items={splitList(t.skills)} chip="bg-stone-800 text-stone-200" />
      {(senses.senses.length > 0 || senses.passive != null) && (
        <div>
          <div className="text-[11px] uppercase tracking-wider font-semibold mb-1 text-stone-500">Senses</div>
          <div className="flex flex-wrap gap-1">
            {senses.senses.map((s, i) => <span key={i} className="px-2 py-0.5 rounded text-sm bg-stone-800 text-stone-200">{s}</span>)}
            {senses.passive != null && (
              <span className="px-2 py-0.5 rounded text-sm bg-amber-950/50 border border-amber-800/50 text-amber-200">Passive Perception {senses.passive}</span>
            )}
          </div>
        </div>
      )}
      <ChipRow label="Languages" items={splitList(t.languages)} chip="bg-stone-800 text-stone-200" />
      <ChipRow label="Vulnerabilities" items={splitDefenses(t.vulnerabilities)} chip="bg-yellow-950/50 border border-yellow-800/50 text-yellow-200" labelClass="text-yellow-500" />
      <ChipRow label="Resistances" items={splitDefenses(t.resistances)} chip="bg-blue-950/50 border border-blue-800/50 text-blue-200" labelClass="text-blue-400" />
      <ChipRow label="Immunities" items={splitDefenses(t.immunities)} chip="bg-emerald-950/50 border border-emerald-800/50 text-emerald-200" labelClass="text-emerald-400" />
      {notes && (
        <div>
          <div className="text-[11px] uppercase tracking-wider font-semibold mb-1 text-stone-500">Notes</div>
          <p className="text-sm text-stone-400 leading-relaxed whitespace-pre-line">{notes}</p>
        </div>
      )}
    </div>
  );

  const hasSections = SECTIONS.some(s => t[s.key]?.length);

  return (
    <div className="space-y-5" data-testid="stat-block">
      <header>
        <h1 className={`${compact ? 'text-2xl' : 'text-3xl md:text-4xl'} font-bold tracking-tight text-stone-50`}>{t.name || 'Unnamed creature'}</h1>
        {subtitle && <div className="text-stone-400 italic mt-0.5">{subtitle}</div>}
      </header>

      <LorePanel lore={t.lore} defaultOpen={compact} />

      <div className={`grid gap-2 ${compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'}`}>
        <VitalTile label="Armor Class" value={t.ac ?? '—'} testId="vital-ac" />
        <VitalTile label="Hit Points" value={t.maxHp ?? '—'} sub={t.hitDice} testId="vital-hp" />
        <VitalTile label="Speed" value={formatSpeeds(t.speed)[0]} sub={formatSpeeds(t.speed).slice(1).join(', ') || null} testId="vital-speed" />
        <VitalTile label="Initiative" value={formatMod(init)} sub={`(${10 + init})`} testId="vital-init" />
        <VitalTile label="Challenge" value={t.cr ?? '—'} sub={xp ? `${xp} XP` : null} testId="vital-cr" />
        <VitalTile label="Proficiency" value={t.profBonus != null && t.profBonus !== '' ? formatMod(Number(t.profBonus)) : '—'} />
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {ABILITY_KEYS.map(k => {
          const mod = getModNum(t[k] ?? 10);
          const save = saves[k];
          const prof = save !== undefined;
          return (
            <div key={k} className="rounded-lg bg-stone-950/50 border border-stone-700/60 text-center py-2" data-testid={`ability-${k}`}>
              <div className="text-xs uppercase tracking-wider text-stone-500 font-bold">{k}</div>
              <div className="text-2xl font-bold text-stone-50 leading-tight">{t[k] ?? 10}</div>
              <div className="text-sm text-stone-400 font-mono">{formatMod(mod)}</div>
              {/* A non-proficient save equals the modifier, so only proficient ones are shown. */}
              {prof && (
                <div className="mt-1 mx-2 rounded text-[11px] py-0.5 bg-emerald-950/60 text-emerald-300 font-semibold">
                  save {formatMod(save)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={compact ? 'space-y-5' : 'grid gap-6 lg:grid-cols-[minmax(240px,300px)_1fr] items-start'}>
        <aside className={`rounded-lg border border-stone-800 bg-stone-950/30 p-4 ${!compact && stickyTop != null ? 'lg:sticky' : ''}`} style={!compact && stickyTop != null ? { top: stickyTop + 16 } : undefined}>{details}</aside>
        <div className="space-y-6 min-w-0">
          {SECTIONS.map(s => (
            <AbilitySection
              key={s.key}
              section={s}
              items={t[s.key]}
              extra={s.key === 'legendaryActions' && legendary
                ? `${legendary.uses} per round${legendary.lair ? ` (${legendary.lair} in lair)` : ''}`
                : null}
            />
          ))}
          {!hasSections && <div className="text-stone-500 italic">No traits or actions yet.</div>}
        </div>
      </div>
    </div>
  );
}
