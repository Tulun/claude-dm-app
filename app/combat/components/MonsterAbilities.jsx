'use client';

import { useMemo, useState } from 'react';
import { parseSpellcasting } from './CharacterCard/spellcastingParser';
import { ECONOMY_BY_SECTION, abilityLabel, getAbilityUsed, getMonsterAbilities } from '../monsterAbilities';
import { getLimitedPools } from '../limitedUses';
import LimitedUses from './LimitedUses';

const ECONOMY_LABEL = { action: 'Action', bonus: 'Bonus Action', reaction: 'Reaction' };
const GROUPS = [
  { key: 'actions', label: 'Actions', chip: 'border-red-800/60 bg-red-950/40 text-red-200' },
  { key: 'bonusActions', label: 'Bonus', chip: 'border-orange-800/60 bg-orange-950/40 text-orange-200' },
  { key: 'reactions', label: 'Reactions', chip: 'border-cyan-800/60 bg-cyan-950/40 text-cyan-200' },
];

/**
 * What the current monster has on hand: its actions / bonus actions /
 * reactions as chips (click one for its text and a Use button that spends the
 * matching economy slot), plus a tracker for everything limited-use —
 * X/Day, recharge and per-rest abilities (as pips), spell slots and
 * per-day spells. Usage is stored on the enemy (see monsterAbilities.js), so
 * the card's Quick Actions modal shows the same spell-slot counts.
 */
export default function MonsterAbilities({ creature, usage, reactionUsed, onUpdateEnemy, onSpendSlot }) {
  const [selected, setSelected] = useState(null); // `${section}:${name}`

  const abilities = useMemo(() => getMonsterAbilities(creature), [creature]);
  const spells = useMemo(() => parseSpellcasting(creature), [creature]);

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

  const selectedAbility = selected
    ? [...GROUPS.flatMap(g => abilities[g.key]), ...abilities.limitedTraits].find(a => `${a.section}:${a.name}` === selected)
    : null;

  return (
    <div className="mt-2 pt-2 border-t border-stone-800 space-y-2">
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
      </div>

      {selectedAbility && (
        <div className="flex items-start gap-3 rounded-md bg-stone-900/80 border border-stone-700 p-2 text-xs">
          <div className="flex-1 min-w-0 text-stone-300">
            <span className="font-semibold text-amber-300">{selectedAbility.name}.</span> {selectedAbility.description}
          </div>
          {(() => {
            const slot = ECONOMY_BY_SECTION[selectedAbility.section];
            const exhausted = selectedAbility.usage && getAbilityUsed(creature, selectedAbility.name) >= selectedAbility.usage.max;
            // A spent recharge ability offers Recharge (the DM rolled it at
            // the table); other spent uses (X/Day) stay disabled.
            const canRecharge = exhausted && selectedAbility.usage.kind === 'recharge';
            if (canRecharge) return (
              <button
                onClick={() => setUses(selectedAbility.name, 0)}
                className="shrink-0 px-2.5 py-1 rounded bg-purple-700 hover:bg-purple-600 text-white font-medium"
              >
                Recharge
              </button>
            );
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
