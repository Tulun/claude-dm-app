'use client';

import { useEffect, useRef } from 'react';
import Icons from '../../components/Icons';
import { getModNum, formatMod } from '../../utils/rules';
import { ABILITY_KEYS, SECTIONS, SIZE_OPTIONS, BOOK_OPTIONS, xpForCr, profForCr, getInitiativeBonus, defaultBook } from '../statBlock';

const CREATURE_TYPES = ['Aberration', 'Beast', 'Celestial', 'Construct', 'Dragon', 'Elemental', 'Fey', 'Fiend',
  'Giant', 'Humanoid', 'Monstrosity', 'Ooze', 'Plant', 'Undead'];

const INPUT = 'w-full bg-stone-950/60 border border-stone-700 rounded-md px-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40';

const SECTION_COLORS = {
  amber: { title: 'text-amber-400', ring: 'border-amber-900/50', add: 'text-amber-300 hover:bg-amber-900/30 border-amber-800/60' },
  red: { title: 'text-red-400', ring: 'border-red-900/50', add: 'text-red-300 hover:bg-red-900/30 border-red-800/60' },
  orange: { title: 'text-orange-400', ring: 'border-orange-900/50', add: 'text-orange-300 hover:bg-orange-900/30 border-orange-800/60' },
  cyan: { title: 'text-cyan-400', ring: 'border-cyan-900/50', add: 'text-cyan-300 hover:bg-cyan-900/30 border-cyan-800/60' },
  purple: { title: 'text-purple-400', ring: 'border-purple-900/50', add: 'text-purple-300 hover:bg-purple-900/30 border-purple-800/60' },
};

const Field = ({ label, hint, children, className = '' }) => (
  <label className={`block min-w-0 ${className}`}>
    <span className="flex items-baseline justify-between gap-2 mb-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">{label}</span>
      {hint}
    </span>
    {children}
  </label>
);

const Card = ({ title, children, right, id }) => (
  <section id={id} className="rounded-xl border border-stone-800 bg-stone-900/60 p-4 scroll-mt-24">
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-stone-300">{title}</h2>
      {right}
    </div>
    {children}
  </section>
);

// Textarea that grows with its content, so long abilities (Eye Rays) are
// editable without a tiny scroll box.
export const AutoTextarea = ({ value, onChange, minRows = 2, className = '', ...props }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    if (el.scrollHeight) el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return <textarea ref={ref} rows={minRows} value={value} onChange={onChange} className={`${INPUT} resize-none leading-relaxed ${className}`} {...props} />;
};

const AbilityListEditor = ({ section, items, onChange, extra }) => {
  const c = SECTION_COLORS[section.color];
  const focusLast = useRef(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (!focusLast.current) return;
    focusLast.current = false;
    const inputs = listRef.current?.querySelectorAll('input[data-ability-name]');
    inputs?.[inputs.length - 1]?.focus();
  }, [items.length]);

  const update = (i, field, value) => onChange(items.map((a, j) => (j === i ? { ...a, [field]: value } : a)));
  const remove = (i) => onChange(items.filter((_, j) => j !== i));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = () => { focusLast.current = true; onChange([...items, { name: '', description: '' }]); };

  return (
    <Card
      id={`edit-${section.key}`}
      title={<span className={c.title}>{section.label} <span className="text-stone-500 font-normal normal-case">({items.length})</span></span>}
      right={extra}
    >
      <div className="space-y-3" ref={listRef} data-testid={`edit-section-${section.key}`}>
        {items.map((a, i) => (
          <div key={i} className={`rounded-lg border ${c.ring} bg-stone-950/40 p-3 space-y-2`}>
            <div className="flex items-center gap-2">
              <input
                data-ability-name
                aria-label={`${section.singular} ${i + 1} name`}
                value={a.name}
                onChange={(e) => update(i, 'name', e.target.value)}
                placeholder={`${section.singular} name (e.g. "Bite" or "Breath Weapon (Recharge 5–6)")`}
                className={`${INPUT} font-semibold`}
              />
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"
                  className="w-8 h-8 rounded-md bg-stone-800 hover:bg-stone-700 disabled:opacity-30 flex items-center justify-center"><Icons.ChevronUp /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down"
                  className="w-8 h-8 rounded-md bg-stone-800 hover:bg-stone-700 disabled:opacity-30 flex items-center justify-center"><Icons.ChevronDown /></button>
                <button type="button" onClick={() => remove(i)} aria-label={`Remove ${section.singular.toLowerCase()} ${i + 1}`}
                  className="w-8 h-8 rounded-md bg-red-950/60 hover:bg-red-900/60 text-red-300 flex items-center justify-center"><Icons.Trash /></button>
              </div>
            </div>
            <AutoTextarea
              aria-label={`${section.singular} ${i + 1} description`}
              value={a.description}
              onChange={(e) => update(i, 'description', e.target.value)}
              placeholder="Description… Put numbered options (1. Charm Ray. …) on their own lines to show them as a list."
            />
          </div>
        ))}
        <button type="button" onClick={add}
          className={`w-full rounded-lg border border-dashed px-3 py-2 text-sm flex items-center justify-center gap-1 ${c.add}`}>
          <Icons.Plus /> Add {section.singular}
        </button>
      </div>
    </Card>
  );
};

/** The full-width monster editor. Controlled: `form` is a toEditForm() shape. */
export default function StatBlockForm({ form, setForm, bookOptions = [] }) {
  // Standard abbreviations first, then any other books already in the library.
  const books = [...new Set([...BOOK_OPTIONS, ...bookOptions])];
  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  const setList = (key) => (items) => setForm(f => ({ ...f, [key]: items }));

  const stdXp = xpForCr(form.cr);
  const stdPb = profForCr(form.cr);
  // What a blank Initiative falls back to (notes' "Initiative +N", else DEX).
  const initFallback = formatMod(getInitiativeBonus({ notes: form.notes, dex: form.dex }));

  return (
    <div className="space-y-4" data-testid="stat-block-form">
      <Card title="Identity" id="edit-identity">
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
          <Field label="Name"><input value={form.name} onChange={set('name')} className={`${INPUT} text-base font-semibold`} placeholder="Creature name" autoFocus={!form.name} /></Field>
          <Field label="Size">
            <input value={form.size} onChange={set('size')} list="size-options" className={INPUT} placeholder="Medium" />
            <datalist id="size-options">{SIZE_OPTIONS.map(s => <option key={s} value={s} />)}</datalist>
          </Field>
          <Field label="Creature type">
            <input value={form.creatureType} onChange={set('creatureType')} list="type-options" className={INPUT} placeholder="Humanoid (Goblinoid)" />
            <datalist id="type-options">{CREATURE_TYPES.map(s => <option key={s} value={s} />)}</datalist>
          </Field>
        </div>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3 mt-3">
          <Field label="Source book" className="w-full sm:w-64">
            <input value={form.book} onChange={set('book')} list="book-options" className={INPUT}
              placeholder={defaultBook(form) ? `${defaultBook(form)} (auto)` : 'e.g. MM 2024, VGtM, Homebrew'} />
            <datalist id="book-options">{books.map(b => <option key={b} value={b} />)}</datalist>
          </Field>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 mr-1">Role</span>
          <button type="button" onClick={() => setForm(f => ({ ...f, isNpc: false }))} aria-pressed={!form.isNpc}
            className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1 ${!form.isNpc ? 'bg-red-800 text-red-50' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}><Icons.Skull /> Enemy</button>
          <button type="button" onClick={() => setForm(f => ({ ...f, isNpc: true }))} aria-pressed={form.isNpc}
            className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1 ${form.isNpc ? 'bg-emerald-800 text-emerald-50' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}><Icons.Shield /> NPC</button>
        </div>
        </div>
      </Card>

      <Card title="Combat" id="edit-combat">
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <Field label="Armor Class"><input value={form.ac} onChange={set('ac')} inputMode="numeric" className={INPUT} /></Field>
          <Field label="Hit Points"><input value={form.maxHp} onChange={set('maxHp')} inputMode="numeric" className={INPUT} /></Field>
          <Field label="Hit Dice"><input value={form.hitDice} onChange={set('hitDice')} className={INPUT} placeholder="20d10+80" /></Field>
          <Field label="Initiative">
            <input value={form.initiativeBonus} onChange={set('initiativeBonus')} className={INPUT} placeholder={`${initFallback} (auto)`} />
          </Field>
          <Field label="Speed" className="col-span-2"><input value={form.speed} onChange={set('speed')} className={INPUT} placeholder="30, fly 60 (hover)" /></Field>
          <Field label="Challenge"><input value={form.cr} onChange={set('cr')} className={INPUT} placeholder="1/2" /></Field>
          <Field label="Prof. Bonus" hint={stdPb != null && String(stdPb) !== String(form.profBonus) && (
            <button type="button" onClick={() => setForm(f => ({ ...f, profBonus: String(stdPb) }))} className="text-[11px] text-amber-400 hover:text-amber-300">use +{stdPb}</button>
          )}>
            <input value={form.profBonus} onChange={set('profBonus')} inputMode="numeric" className={INPUT} />
          </Field>
          <Field label="XP" className="col-span-2" hint={stdXp != null && String(stdXp) !== String(form.xp).replace(/,/g, '') && (
            <button type="button" onClick={() => setForm(f => ({ ...f, xp: String(stdXp) }))} className="text-[11px] text-amber-400 hover:text-amber-300">use CR {form.cr} standard ({stdXp.toLocaleString()})</button>
          )}>
            <input value={form.xp} onChange={set('xp')} inputMode="numeric" className={INPUT} />
          </Field>
        </div>
      </Card>

      <Card title="Ability Scores" id="edit-abilities">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ABILITY_KEYS.map(k => (
            <label key={k} className="rounded-lg bg-stone-950/50 border border-stone-700/60 p-2 text-center">
              <span className="block text-xs uppercase tracking-wider text-stone-500 font-bold">{k}</span>
              <input aria-label={k.toUpperCase()} value={form[k]} onChange={set(k)} inputMode="numeric"
                className="w-full bg-transparent text-center text-xl font-bold text-stone-50 focus:outline-none focus:bg-stone-900 rounded" />
              <span className="block text-sm text-stone-400">{formatMod(getModNum(form[k]))}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card title="Proficiencies & Senses" id="edit-details">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Saving throws"><input value={form.savingThrows} onChange={set('savingThrows')} className={INPUT} placeholder="Con +9, Wis +7" /></Field>
          <Field label="Skills"><input value={form.skills} onChange={set('skills')} className={INPUT} placeholder="Perception +12, Stealth +6" /></Field>
          <Field label="Senses"><input value={form.senses} onChange={set('senses')} className={INPUT} placeholder="Darkvision 120 ft., Passive Perception 22" /></Field>
          <Field label="Languages"><input value={form.languages} onChange={set('languages')} className={INPUT} placeholder="Common, Deep Speech" /></Field>
        </div>
      </Card>

      <Card title="Defenses" id="edit-defenses">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={<span className="text-yellow-500">Vulnerabilities</span>}><input value={form.vulnerabilities} onChange={set('vulnerabilities')} className={INPUT} placeholder="Fire" /></Field>
          <Field label={<span className="text-blue-400">Resistances</span>}><input value={form.resistances} onChange={set('resistances')} className={INPUT} placeholder="Cold; Bludgeoning" /></Field>
          <Field label={<span className="text-emerald-400">Immunities</span>}><input value={form.immunities} onChange={set('immunities')} className={INPUT} placeholder="Poison; Charmed, Prone" /></Field>
        </div>
        <p className="text-xs text-stone-500 mt-2">Separate damage and condition immunities with a semicolon, entries with commas.</p>
      </Card>

      {SECTIONS.map(s => (
        <AbilityListEditor
          key={s.key}
          section={s}
          items={form[s.key] || []}
          onChange={setList(s.key)}
          extra={s.key === 'legendaryActions' ? (
            <label className="flex items-center gap-2 text-xs text-stone-400">
              Uses / round
              <input aria-label="Legendary action uses" value={form.legendaryActionUses} onChange={set('legendaryActionUses')} inputMode="numeric" placeholder="3"
                className="w-14 bg-stone-950/60 border border-stone-700 rounded-md px-2 py-1 text-center text-sm focus:outline-none focus:border-amber-500" />
            </label>
          ) : null}
        />
      ))}

      <Card title="Lore" id="edit-lore">
        <AutoTextarea value={form.lore} onChange={set('lore')} minRows={4} aria-label="Lore"
          placeholder={'Flavor text from the book. Separate paragraphs with a blank line; a short line on its own becomes a heading.\n\nEyes of the Deep\nA beholder is a floating orb of flesh…'} />
      </Card>

      <Card title="Notes" id="edit-notes">
        <AutoTextarea value={form.notes} onChange={set('notes')} minRows={3} placeholder="Alignment: Lawful Evil. Gear, tactics, lair details…" aria-label="Notes" />
      </Card>
    </div>
  );
}
