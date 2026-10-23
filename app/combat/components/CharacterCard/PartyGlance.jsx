'use client';

import { SKILLS, getSkillBonus } from '../../../character/components/constants';
import { formatSpeeds } from '../../monsterAbilities';
import { getOrdinalSuffix } from '../../../utils/spellFormat';

// Resources with more uses than this show as "n/max" with −/+ instead of pips
const MAX_PIPS = 8;
const SLOT_NAME = /^(\d+)(st|nd|rd|th)[- ]level spell slots?$/i;
const PASSIVES = ['Perception', 'Investigation', 'Insight'];

/**
 * Every spendable pool on a party member, in display order: spell slots
 * first (from `resources` named "1st Level Spell Slot(s)" or the legacy
 * `spellSlots.levelN` map), then everything else in `resources` order.
 * `set(current)` returns the updated character.
 */
export function getResourcePools(character) {
  const resources = character.resources || [];
  const spellSlots = character.spellSlots || {};
  const pools = [];
  resources.forEach((r, index) => {
    if (!(r.max > 0)) return;
    const slot = r.name?.match(SLOT_NAME);
    pools.push({
      id: `r-${r.id ?? index}`,
      name: r.name,
      label: slot ? `${slot[1]}${slot[2].toLowerCase()}` : r.name,
      isSlot: !!slot,
      slotLevel: slot ? parseInt(slot[1]) : null,
      current: Math.max(0, Math.min(r.max, r.current ?? r.max)),
      max: r.max,
      hasOptions: r.options?.length > 0,
      set: (current) => ({
        ...character,
        resources: resources.map((x, i) => (i === index ? { ...x, current } : x)),
      }),
    });
  });
  Object.keys(spellSlots)
    .filter(k => k.startsWith('level') && spellSlots[k]?.max > 0)
    .forEach(key => {
      const level = parseInt(key.replace('level', ''));
      const s = spellSlots[key];
      pools.push({
        id: `s-${key}`,
        name: `Level ${level} spell slots`,
        label: `${level}${getOrdinalSuffix(level)}`,
        isSlot: true,
        slotLevel: level,
        current: Math.max(0, Math.min(s.max, s.current ?? s.max)),
        max: s.max,
        set: (current) => ({ ...character, spellSlots: { ...spellSlots, [key]: { ...s, current } } }),
      });
    });
  // Slots by level ahead of everything else; stable otherwise
  return pools
    .map((p, i) => ({ p, i }))
    .sort((a, b) => (a.p.isSlot === b.p.isSlot ? (a.p.isSlot ? a.p.slotLevel - b.p.slotLevel : a.i - b.i) : a.p.isSlot ? -1 : 1))
    .map(({ p }) => p);
}

// Also used by the tracker's expanded party panel (PartyAbilities).
export function Pool({ pool, onUpdate, onOpen }) {
  const { name, label, current, max, isSlot } = pool;
  const change = (delta) => onUpdate(pool.set(Math.max(0, Math.min(max, current + delta))));
  // Spending a pool with options (e.g. Spirit Totem) needs the picker, which
  // also applies side effects like Bear Spirit's temp HP — open the modal.
  const spend = () => (pool.hasOptions ? onOpen('resources') : change(-1));
  const fill = isSlot ? 'bg-purple-500 border-purple-300 hover:bg-purple-400' : 'bg-amber-500 border-amber-300 hover:bg-amber-400';

  return (
    <span className="flex items-center gap-1.5" title={`${name}: ${current}/${max}`} data-testid="resource-pool">
      <span className={`text-[11px] ${isSlot ? 'text-purple-300/80' : 'text-stone-400'} max-w-[7rem] truncate`}>{label}</span>
      {max > MAX_PIPS ? (
        <span className="flex items-center gap-1 font-mono text-xs">
          <button aria-label={`Spend ${name}`} onClick={(e) => { e.stopPropagation(); spend(); }} disabled={current <= 0}
            className="w-4 h-4 leading-none rounded bg-stone-800 text-stone-400 hover:text-stone-200 disabled:opacity-30">−</button>
          <span className="text-stone-200">{current}<span className="text-stone-500">/{max}</span></span>
          <button aria-label={`Restore ${name}`} onClick={(e) => { e.stopPropagation(); change(1); }} disabled={current >= max}
            className="w-4 h-4 leading-none rounded bg-stone-800 text-stone-400 hover:text-stone-200 disabled:opacity-30">+</button>
        </span>
      ) : (
        <span className="flex items-center gap-0.5">
          {Array.from({ length: max }, (_, i) => {
            const available = i < current;
            return (
              <button
                key={i}
                aria-label={available ? `Spend ${name}` : `Restore ${name}`}
                aria-pressed={!available}
                onClick={(e) => { e.stopPropagation(); available ? spend() : change(1); }}
                className={`w-3 h-3 rounded-full border transition-colors ${available ? fill : 'bg-stone-800 border-stone-600 hover:border-stone-400'}`}
              />
            );
          })}
        </span>
      )}
    </span>
  );
}

/**
 * Party card at-a-glance block: spendable resource pips, then passives /
 * speed / advantages. Skill math is the character sheet's own `getSkillBonus`
 * (background profs, expertise, Jack of All Trades, feature bonuses) so the
 * card agrees with /character.
 */
export default function PartyGlance({ character, wildShapeForm, onUpdate, onOpen }) {
  const pools = getResourcePools(character);
  const speeds = formatSpeeds(wildShapeForm?.speed ?? character.speed);
  const advantages = character.advantages || [];

  return (
    <div className="mt-2 space-y-1.5">
      {pools.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1" aria-label="Resources">
          {pools.map(p => <Pool key={p.id} pool={p} onUpdate={onUpdate} onOpen={onOpen} />)}
        </div>
      )}
      <div className="flex items-start gap-2">
        {/* Passive scores — spelled out, one per row */}
        <div className="w-36 shrink-0 rounded bg-stone-800/50 px-2 py-1" aria-label="Passive scores">
          <div className="text-[10px] uppercase tracking-wider text-stone-500">Passive</div>
          {PASSIVES.map(skill => (
            <div key={skill} className="flex justify-between text-xs" data-testid={`passive-${skill.toLowerCase()}`}>
              <span className="text-stone-400">{skill}</span>
              <span className="font-mono font-semibold text-stone-100">{10 + getSkillBonus(character, SKILLS.find(s => s.name === skill))}</span>
            </div>
          ))}
        </div>
        <div className="min-w-0 space-y-1 text-xs">
          <div className="rounded bg-stone-800/50 px-2 py-1">
            <div className="text-[10px] uppercase tracking-wider text-stone-500">Speed</div>
            <div className={`font-mono ${wildShapeForm ? 'text-lime-400' : 'text-stone-100'}`}>{speeds.join(' · ')}</div>
          </div>
          {advantages.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {advantages.map(a => (
                <span key={a} className="px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-300 text-[11px]">{a}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
