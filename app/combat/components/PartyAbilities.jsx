'use client';

import { useMemo, useState } from 'react';
import { getWeaponStatsFor, findBaseWeapon } from '../../utils/weaponStats';
import { getLevelLabel } from '../../utils/spellFormat';
import { getResourcePools, Pool } from './CharacterCard/PartyGlance';
import { getTurnSpells, pickSlotPool } from '../partyAbilities';
import { StatText } from './MonsterAbilities';
import PartyLoadout from './PartyLoadout';
import ItemDetailModal from './ItemDetailModal';
import ExpandToggle, { useExpandedPref } from './ExpandToggle';

const ECONOMY_LABEL = { action: 'Action', bonus: 'Bonus Action', reaction: 'Reaction' };
const SPELL_GROUPS = [
  { key: 'action', label: 'Action', name: 'text-red-300' },
  { key: 'bonus', label: 'Bonus', name: 'text-orange-300' },
  { key: 'reaction', label: 'Reaction', name: 'text-cyan-300' },
];
const Heading = ({ children, className = 'text-stone-500' }) => (
  <div className={`text-[10px] font-bold uppercase tracking-widest ${className}`}>{children}</div>
);

// "Reaction, which you take when you are hit…" → "which you take when you are hit…"
const reactionTrigger = (spell) =>
  String(spell.castTime || spell.castingTime || '').replace(/^\s*1?\s*reaction\s*,?\s*/i, '');

const isWeaponItem = (item) => item.itemType === 'weapon' || item.isWeapon;
// Older items flagged only with isWeapon lack itemType; the stats key on it.
const weaponStats = (item, character) => getWeaponStatsFor({ ...item, itemType: 'weapon' }, character);

/**
 * A party member's side of the This Turn panel. Collapsed it is just the
 * equipped-kit chips (PartyLoadout). Expanded (shared per-viewer preference
 * with the monster panel, `useExpandedPref`) it lists what they can do right
 * now, in a height-capped scroll box:
 *  - Attacks: equipped weapons with to-hit / damage / properties
 *    (`getWeaponStatsFor`), name → ItemDetailModal, Attack spends the Action.
 *  - Spells: slot pips, then castable spells (`getTurnSpells`) grouped by
 *    casting time; Cast spends the economy slot and, for a leveled spell, the
 *    lowest slot that can cast it (`pickSlotPool`; fix an upcast on the pips).
 *  - Resources: the other pools (Wild Shape, Bardic Inspiration…) as pips,
 *    with the matching feature's text when one shares the name.
 * Gear stays as chips below.
 */
export default function PartyAbilities({ character, usage, reactionUsed, onUpdate, onSpendSlot, onOpen }) {
  const [expanded, toggleExpanded] = useExpandedPref();
  const [openSpell, setOpenSpell] = useState(null); // spell id with full text shown
  const [openItemId, setOpenItemId] = useState(null);

  const weapons = (character.inventory || []).filter(item => item?.equipped && isWeaponItem(item));
  const spells = useMemo(() => getTurnSpells(character), [character]);
  const pools = getResourcePools(character);
  const slotPools = pools.filter(p => p.isSlot);
  const otherPools = pools.filter(p => !p.isSlot);
  const features = [...(character.features || []), ...(character.feats || [])];
  const hasSpells = SPELL_GROUPS.some(g => spells[g.key].length);
  const toggle = <ExpandToggle expanded={expanded} onToggle={toggleExpanded} />;

  if (!expanded) {
    return (
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0"><PartyLoadout character={character} /></div>
        <div className="mt-2 pt-2">{toggle}</div>
      </div>
    );
  }

  const slotSpent = (slot) =>
    slot === 'action' ? usage?.action : slot === 'bonus' ? usage?.bonus : slot === 'reaction' ? reactionUsed : false;
  const spendEconomy = (slot) => { if (!slotSpent(slot)) onSpendSlot(slot); };

  const castSpell = (spell, slot) => {
    if (spell.level > 0) {
      const pool = pickSlotPool(slotPools, spell.level);
      if (pool) onUpdate(pool.set(pool.current - 1));
    }
    spendEconomy(slot);
  };

  const openItem = openItemId != null ? weapons.find(item => item.id === openItemId) : null;
  const button = 'shrink-0 px-2 py-0.5 rounded text-xs text-white font-medium bg-amber-700 hover:bg-amber-600 disabled:bg-stone-700 disabled:text-stone-500';

  return (
    <div data-testid="party-expanded" className="mt-2 pt-2 border-t border-stone-800 space-y-2">
      <div className="flex items-center">
        <Heading>Abilities</Heading>
        {toggle}
      </div>
      <div className="max-h-[40vh] overflow-y-auto pr-1 space-y-3">
        {weapons.length > 0 && (
          <section aria-label="Attacks">
            <Heading>Attacks</Heading>
            <ul className="divide-y divide-stone-800/70">
              {weapons.map(item => {
                const stats = weaponStats(item, character);
                const props = item.weaponProperties?.length ? item.weaponProperties : (findBaseWeapon(item)?.props || []);
                return (
                  <li key={item.id} className="flex items-center gap-3 py-1.5 text-xs">
                    <div className="flex-1 min-w-0 flex flex-wrap items-baseline gap-x-2">
                      <button onClick={() => setOpenItemId(item.id)} className="font-semibold text-red-300 hover:underline">{item.name}</button>
                      {stats && <span className="text-amber-300 font-semibold">{stats.attackBonus} to hit</span>}
                      {stats?.damage && (
                        <span className="text-red-300 font-semibold">
                          {stats.damage}{stats.damageType ? ` ${stats.damageType.toLowerCase()}` : ''}
                          {item.damage2h ? ` (${item.damage2h} 2H)` : ''}
                        </span>
                      )}
                      {props.length > 0 && <span className="text-stone-500">{props.join(', ')}</span>}
                    </div>
                    <button onClick={() => spendEconomy('action')} className={button}>Attack (Action)</button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {(hasSpells || slotPools.length > 0) && (
          <section aria-label="Spells" className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Heading className="text-purple-400">Spells</Heading>
              {slotPools.map(p => <Pool key={p.id} pool={p} onUpdate={onUpdate} onOpen={onOpen} />)}
            </div>
            {SPELL_GROUPS.map(g => spells[g.key].length > 0 && (
              <div key={g.key}>
                <Heading>{g.label}</Heading>
                <ul className="divide-y divide-stone-800/70">
                  {spells[g.key].map(spell => {
                    const open = openSpell === spell.id;
                    const noSlot = spell.level > 0 && slotPools.length > 0 && !pickSlotPool(slotPools, spell.level);
                    return (
                      <li key={spell.id ?? spell.name} className="flex items-start gap-3 py-1.5 text-xs">
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => setOpenSpell(open ? null : spell.id)}
                            aria-expanded={open}
                            className="flex flex-wrap items-baseline gap-x-2 text-left"
                          >
                            <span className={`font-semibold ${g.name}`}>{spell.name}</span>
                            <span className="text-purple-300/80">{getLevelLabel(spell.level)}</span>
                            {spell.concentration && <span title="Concentration" className="px-1 rounded bg-stone-800 text-[10px] text-stone-300">C</span>}
                            {spell.range && <span className="text-stone-500">{spell.range}</span>}
                          </button>
                          {g.key === 'reaction' && reactionTrigger(spell) && (
                            <div className="text-cyan-200/70 italic">{reactionTrigger(spell)}</div>
                          )}
                          <div className={`text-stone-300 leading-relaxed ${open ? '' : 'line-clamp-2'}`}>
                            <StatText text={spell.description} />
                          </div>
                        </div>
                        <button onClick={() => castSpell(spell, g.key)} disabled={noSlot} className={button}>
                          {noSlot ? 'No slots' : `Cast (${ECONOMY_LABEL[g.key]})`}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </section>
        )}

        {otherPools.length > 0 && (
          <section aria-label="Resources">
            <Heading>Resources</Heading>
            <ul className="divide-y divide-stone-800/70">
              {otherPools.map(p => {
                const feature = features.find(f => f?.name && f.name.toLowerCase() === p.name.toLowerCase());
                return (
                  <li key={p.id} className="py-1.5 text-xs space-y-0.5">
                    <Pool pool={p} onUpdate={onUpdate} onOpen={onOpen} />
                    {feature?.description && <div className="text-stone-400 line-clamp-2"><StatText text={feature.description} /></div>}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
      <PartyLoadout character={character} only="gear" />
      {openItem && (
        <ItemDetailModal item={openItem} character={character} stats={weaponStats(openItem, character)} onClose={() => setOpenItemId(null)} />
      )}
    </div>
  );
}
