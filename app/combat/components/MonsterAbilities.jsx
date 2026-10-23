'use client';

import { useMemo, useState } from 'react';
import { parseSpellcasting } from './CharacterCard/spellcastingParser';
import { ECONOMY_BY_SECTION, abilityLabel, getAbilityUsed, getMonsterAbilities, parseUsage, splitStatText } from '../monsterAbilities';
import { getLimitedPools } from '../limitedUses';
import LimitedUses from './LimitedUses';
import ExpandToggle, { useExpandedPref } from './ExpandToggle';

const ECONOMY_LABEL = { action: 'Action', bonus: 'Bonus Action', reaction: 'Reaction' };
const GROUPS = [
  { key: 'actions', label: 'Actions', chip: 'border-red-800/60 bg-red-950/40 text-red-200', name: 'text-red-300' },
  { key: 'bonusActions', label: 'Bonus', chip: 'border-orange-800/60 bg-orange-950/40 text-orange-200', name: 'text-orange-300' },
  { key: 'reactions', label: 'Reactions', chip: 'border-cyan-800/60 bg-cyan-950/40 text-cyan-200', name: 'text-cyan-300' },
];
const STAT_CLASS = { hit: 'text-amber-300 font-semibold', damage: 'text-red-300 font-semibold', dc: 'text-purple-300 font-semibold' };

// Stat-block text with to-hit / damage / save DC picked out (plain React
// text nodes — no HTML injection). Shared with PartyAbilities.
export const StatText = ({ text }) => splitStatText(text).map((seg, i) =>
  seg.kind ? <span key={i} className={STAT_CLASS[seg.kind]}>{seg.text}</span> : seg.text
);

/**
 * What the current monster has on hand: its actions / bonus actions /
 * reactions, plus a tracker for everything limited-use — X/Day, recharge and
 * per-rest abilities (as pips), spell slots and per-day spells. Usage is
 * stored on the enemy (see monsterAbilities.js), so the card's Quick Actions
 * modal shows the same spell-slot counts.
 *
 * Two layouts, toggled per viewer (`useExpandedPref`): compact chips (click one for
 * its text and a Use button that spends the matching economy slot), or
 * expanded — every ability's full text with to-hit / damage / DCs
 * highlighted, its own Use button, and the creature's traits (passive ones
 * too, e.g. Martial Advantage), inside a height-capped scroll box so the
 * tracker doesn't jump between turns.
 */
export default function MonsterAbilities({ creature, usage, reactionUsed, onUpdateEnemy, onSpendSlot }) {
  const [selected, setSelected] = useState(null); // `${section}:${name}`
  const [expanded, toggleExpanded] = useExpandedPref();

  const abilities = useMemo(() => getMonsterAbilities(creature), [creature]);
  const spells = useMemo(() => parseSpellcasting(creature), [creature]);
  // Every trait for the expanded view; limited ones carry usage for a Use button
  const traits = useMemo(
    () => (creature?.traits || []).filter(t => t?.name).map(t => ({ ...t, section: 'traits', usage: parseUsage(t.name) })),
    [creature]
  );

  // Legendary actions have their own header control, so not listed here
  const pools = getLimitedPools(creature, spells);
  const hasAnything = GROUPS.some(g => abilities[g.key].length) || pools.length;
  if (!hasAnything) return null;

  const setUses = (name, used) =>
    onUpdateEnemy({ ...creature, abilityUses: { ...(creature.abilityUses || {}), [name]: used } });

  const slotSpent = (slot) =>
    slot === 'action' ? usage?.action : slot === 'bonus' ? usage?.bonus : slot === 'reaction' ? reactionUsed : false;

  const spendAbility = (a) => {
    if (a.usage) setUses(a.name, Math.min(a.usage.max, getAbilityUsed(creature, a.name) + 1));
    const slot = ECONOMY_BY_SECTION[a.section];
    if (slot && !slotSpent(slot)) onSpendSlot(slot);
  };

  // Use (spends the slot + a limited use) / Spent / Recharge for one ability.
  // Passive traits get nothing.
  const renderUseButton = (a, size = 'px-2.5 py-1') => {
    const slot = ECONOMY_BY_SECTION[a.section];
    if (!slot && !a.usage) return null;
    const exhausted = a.usage && getAbilityUsed(creature, a.name) >= a.usage.max;
    // A spent recharge ability offers Recharge (the DM rolled it at the
    // table); other spent uses (X/Day) stay disabled.
    if (exhausted && a.usage.kind === 'recharge') return (
      <button
        onClick={() => setUses(a.name, 0)}
        className={`shrink-0 ${size} rounded bg-purple-700 hover:bg-purple-600 text-white font-medium`}
      >
        Recharge
      </button>
    );
    return (
      <button
        onClick={() => spendAbility(a)}
        disabled={exhausted}
        className={`shrink-0 ${size} rounded bg-amber-700 hover:bg-amber-600 text-white font-medium disabled:bg-stone-700 disabled:text-stone-500`}
      >
        {exhausted ? 'Spent' : `Use${slot ? ` (${ECONOMY_LABEL[slot]})` : ''}`}
      </button>
    );
  };

  const selectedAbility = selected
    ? [...GROUPS.flatMap(g => abilities[g.key]), ...abilities.limitedTraits].find(a => `${a.section}:${a.name}` === selected)
    : null;

  const toggle = <ExpandToggle expanded={expanded} onToggle={toggleExpanded} />;

  const abilityRow = (a, nameClass) => {
    const usesLeft = a.usage ? a.usage.max - getAbilityUsed(creature, a.name) : null;
    return (
      <li key={`${a.section}:${a.name}`} className="flex items-start gap-3 py-1.5">
        <div className="flex-1 min-w-0 text-xs text-stone-300 leading-relaxed">
          <span className={`font-semibold ${nameClass}`}>{a.name}.</span>{' '}
          <StatText text={a.description} />
          {usesLeft != null && a.usage.kind !== 'recharge' && (
            <span className="ml-1.5 text-[10px] font-mono text-purple-300">{usesLeft}/{a.usage.max} left</span>
          )}
        </div>
        {renderUseButton(a, 'px-2 py-0.5 text-xs')}
      </li>
    );
  };

  return (
    <div className="mt-2 pt-2 border-t border-stone-800 space-y-2">
      {expanded ? (
        <div data-testid="abilities-expanded" className="space-y-2">
          <div className="flex items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Abilities</span>
            {toggle}
          </div>
          <div className="max-h-[40vh] overflow-y-auto pr-1 space-y-2">
            {GROUPS.map(g => abilities[g.key].length > 0 && (
              <section key={g.key} aria-label={g.label}>
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">{g.label}</div>
                <ul className="divide-y divide-stone-800/70">{abilities[g.key].map(a => abilityRow(a, g.name))}</ul>
              </section>
            ))}
            {traits.length > 0 && (
              <section aria-label="Traits">
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Traits</div>
                <ul className="divide-y divide-stone-800/70">{traits.map(a => abilityRow(a, 'text-amber-300'))}</ul>
              </section>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-start gap-x-5 gap-y-2">
            {GROUPS.map(g => abilities[g.key].length > 0 && (
              <div key={g.key} className="flex flex-wrap items-center gap-1.5 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mr-0.5">{g.label}</span>
                {abilities[g.key].map(a => {
                  const id = `${a.section}:${a.name}`;
                  return (
                    <button
                      key={id}
                      onClick={() => setSelected(selected === id ? null : id)}
                      title={a.description || a.name}
                      className={`px-2 py-0.5 rounded border text-xs transition-colors ${g.chip} ${
                        selected === id ? 'ring-1 ring-amber-400' : 'hover:border-amber-500/70'
                      }`}
                    >
                      {abilityLabel(a.name)}
                    </button>
                  );
                })}
              </div>
            ))}
            {toggle}
          </div>

          {selectedAbility && (
            <div className="flex items-start gap-3 rounded-md bg-stone-900/80 border border-stone-700 p-2 text-xs">
              <div className="flex-1 min-w-0 text-stone-300">
                <span className="font-semibold text-amber-300">{selectedAbility.name}.</span> {selectedAbility.description}
              </div>
              {renderUseButton(selectedAbility)}
            </div>
          )}
        </>
      )}

      {pools.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 border-t border-stone-800">
          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Limited</span>
          <LimitedUses pools={pools} onUpdate={onUpdateEnemy} />
          {spells.dc && <span className="text-xs text-stone-500">Spell DC {spells.dc}{spells.attack ? ` · ${spells.attack}` : ''}</span>}
        </div>
      )}
    </div>
  );
}
