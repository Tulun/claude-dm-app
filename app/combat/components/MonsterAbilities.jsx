'use client';

import { useMemo, useState } from 'react';
import { parseSpellcasting } from './CharacterCard/spellcastingParser';
import { toggledLegendaryUsed as toggledUsed } from '../legendary';
import { ECONOMY_BY_SECTION, abilityLabel, getAbilityUsed, getMonsterAbilities } from '../monsterAbilities';

const ECONOMY_LABEL = { action: 'Action', bonus: 'Bonus Action', reaction: 'Reaction' };
const GROUPS = [
  { key: 'actions', label: 'Actions', chip: 'border-red-800/60 bg-red-950/40 text-red-200' },
  { key: 'bonusActions', label: 'Bonus', chip: 'border-orange-800/60 bg-orange-950/40 text-orange-200' },
  { key: 'reactions', label: 'Reactions', chip: 'border-cyan-800/60 bg-cyan-950/40 text-cyan-200' },
];

const Pips = ({ label, total, used, onToggle }) => (
  <span className="flex items-center gap-1">
    {Array.from({ length: total }, (_, i) => (
      <button
        key={i}
        onClick={() => onToggle(i)}
        aria-pressed={i < used}
        title={`${label}: use ${i + 1}${i < used ? ' (spent)' : ''}`}
        className={`w-3.5 h-3.5 rounded-full border transition-colors ${
          i < used ? 'bg-stone-700 border-stone-600' : 'bg-purple-500 border-purple-300 hover:bg-purple-400'
        }`}
      />
    ))}
  </span>
);

/**
 * What the current monster has on hand: its actions / bonus actions /
 * reactions as chips (click one for its text and a Use button that spends the
 * matching economy slot), plus a tracker for everything limited-use —
 * X/Day and recharge abilities (with a d6 recharge roll), spell slots and
 * per-day spells. Usage is stored on the enemy (see monsterAbilities.js), so
 * the card's Quick Actions modal shows the same spell-slot counts.
 */
export default function MonsterAbilities({ creature, usage, reactionUsed, onUpdateEnemy, onSpendSlot }) {
  const [selected, setSelected] = useState(null); // `${section}:${name}`
  const [rolls, setRolls] = useState({}); // last recharge roll per ability name

  const abilities = useMemo(() => getMonsterAbilities(creature), [creature]);
  const spells = useMemo(() => parseSpellcasting(creature), [creature]);

  const limited = [
    ...abilities.limitedTraits,
    ...GROUPS.flatMap(g => abilities[g.key]).filter(a => a.usage),
  ];
  const slotLevels = Object.entries(spells.slots || {});
  const perDaySpells = Object.entries(spells.perDay || {});
  const hasAnything = GROUPS.some(g => abilities[g.key].length) || limited.length || slotLevels.length || perDaySpells.length;
  if (!hasAnything) return null;

  const setUses = (name, used) =>
    onUpdateEnemy({ ...creature, abilityUses: { ...(creature.abilityUses || {}), [name]: used } });
  const setField = (field, used) => onUpdateEnemy({ ...creature, [field]: used });

  const slotSpent = (slot) =>
    slot === 'action' ? usage?.action : slot === 'bonus' ? usage?.bonus : slot === 'reaction' ? reactionUsed : false;

  const spendAbility = (a) => {
    if (a.usage) setUses(a.name, Math.min(a.usage.max, getAbilityUsed(creature, a.name) + 1));
    const slot = ECONOMY_BY_SECTION[a.section];
    if (slot && !slotSpent(slot)) onSpendSlot(slot);
  };

  const rollRecharge = (a) => {
    const roll = Math.floor(Math.random() * 6) + 1;
    setRolls(prev => ({ ...prev, [a.name]: roll }));
    if (roll >= a.usage.min) setUses(a.name, 0);
  };

  const selectedAbility = selected
    ? [...GROUPS.flatMap(g => abilities[g.key]), ...abilities.limitedTraits].find(a => `${a.section}:${a.name}` === selected)
    : null;

  return (
    <div className="rounded-lg border border-red-900/40 bg-red-950/10 p-3 space-y-2">
      <div className="flex flex-wrap items-start gap-x-5 gap-y-2">
        {GROUPS.map(g => abilities[g.key].length > 0 && (
          <div key={g.key} className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mr-0.5">{g.label}</span>
            {abilities[g.key].map(a => {
              const id = `${a.section}:${a.name}`;
              const exhausted = a.usage && getAbilityUsed(creature, a.name) >= a.usage.max;
              return (
                <button
                  key={id}
                  onClick={() => setSelected(selected === id ? null : id)}
                  title={a.description || a.name}
                  className={`px-2 py-0.5 rounded border text-xs transition-colors ${g.chip} ${
                    selected === id ? 'ring-1 ring-amber-400' : 'hover:border-amber-500/70'
                  } ${exhausted ? 'opacity-40 line-through' : ''}`}
                >
                  {abilityLabel(a.name)}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {selectedAbility && (
        <div className="flex items-start gap-3 rounded-md bg-stone-900/80 border border-stone-700 p-2 text-xs">
          <div className="flex-1 min-w-0 text-stone-300">
            <span className="font-semibold text-amber-300">{selectedAbility.name}.</span> {selectedAbility.description}
          </div>
          {(() => {
            const slot = ECONOMY_BY_SECTION[selectedAbility.section];
            const exhausted = selectedAbility.usage && getAbilityUsed(creature, selectedAbility.name) >= selectedAbility.usage.max;
            return (
              <button
                onClick={() => spendAbility(selectedAbility)}
                disabled={exhausted}
                className="shrink-0 px-2.5 py-1 rounded bg-amber-700 hover:bg-amber-600 text-white font-medium disabled:bg-stone-700 disabled:text-stone-500"
              >
                {exhausted ? 'Spent' : `Use${slot ? ` (${ECONOMY_LABEL[slot]})` : ''}`}
              </button>
            );
          })()}
        </div>
      )}

      {(limited.length > 0 || slotLevels.length > 0 || perDaySpells.length > 0) && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 border-t border-stone-800">
          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Limited</span>
          {limited.map(a => {
            const used = getAbilityUsed(creature, a.name);
            const spent = used >= a.usage.max;
            return (
              <span key={`${a.section}:${a.name}`} className="flex items-center gap-1.5 text-xs">
                {/* The ability itself is the toggle: each click spends a use,
                    greying out once none are left; clicking a spent one
                    restores it. */}
                <button
                  onClick={() => setUses(a.name, spent ? 0 : used + 1)}
                  aria-pressed={spent}
                  title={spent ? `${abilityLabel(a.name)} spent — click to restore` : `Use ${abilityLabel(a.name)}`}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    spent
                      ? 'border-stone-700 bg-stone-800/80 text-stone-500 line-through'
                      : 'border-purple-700/60 bg-purple-950/40 text-purple-200 hover:border-purple-400'
                  }`}
                >
                  {abilityLabel(a.name)}
                  {a.usage.max > 1 && <span className="ml-1 tabular-nums opacity-70">{a.usage.max - used}/{a.usage.max}</span>}
                </button>
                {a.usage.kind === 'recharge' && (
                  <>
                    <span className="text-stone-500">{a.usage.min === 6 ? '6' : `${a.usage.min}–6`}</span>
                    {spent && (
                      <button
                        onClick={() => rollRecharge(a)}
                        title={`Roll a d6 — recharges on ${a.usage.min}+`}
                        className="px-1.5 py-0.5 rounded border border-purple-700/60 text-purple-300 hover:border-purple-400"
                      >
                        Roll
                      </button>
                    )}
                    {rolls[a.name] != null && (
                      <span className={rolls[a.name] >= a.usage.min ? 'text-emerald-400' : 'text-stone-500'}>
                        rolled {rolls[a.name]}
                      </span>
                    )}
                  </>
                )}
                {a.usage.kind === 'rest' && <span className="text-stone-500">/rest</span>}
              </span>
            );
          })}
          {perDaySpells.map(([count, list]) => {
            const field = `perDay${count}Used`;
            const used = creature[field] || 0;
            return (
              <span key={field} className="flex items-center gap-1.5 text-xs" title={list.join(', ')}>
                <span className="text-purple-200">{count}/Day spells</span>
                <Pips label={`${count}/Day spells`} total={Number(count)} used={used} onToggle={(i) => setField(field, toggledUsed(used, i))} />
              </span>
            );
          })}
          {slotLevels.map(([level, data]) => {
            const field = `spellSlots${level}Used`;
            const used = creature[field] || 0;
            return (
              <span key={field} className="flex items-center gap-1.5 text-xs" title={data.spells.join(', ')}>
                <span className="text-purple-200">{level}</span>
                <Pips label={`${level}-level slots`} total={data.slots} used={used} onToggle={(i) => setField(field, toggledUsed(used, i))} />
              </span>
            );
          })}
          {spells.dc && <span className="text-xs text-stone-500">Spell DC {spells.dc}{spells.attack ? ` · ${spells.attack}` : ''}</span>}
        </div>
      )}
    </div>
  );
}
