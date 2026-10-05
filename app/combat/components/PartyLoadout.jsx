'use client';

import { useState } from 'react';
import { getWeaponStatsFor } from '../../utils/weaponStats';
import ItemDetailModal from './ItemDetailModal';

const isWeaponItem = (item) => item.itemType === 'weapon' || item.isWeapon;
// Older items flagged only with isWeapon lack itemType; the stats key on it.
const weaponStats = (item, character) => getWeaponStatsFor({ ...item, itemType: 'weapon' }, character);

// Chip damage reads like the table says it: "1d6 piercing", "1d4+3 piercing"
// (no "+0"). The item modal keeps the full breakdown.
const chipDamage = (stats) => {
  if (!stats?.damageDice) return null;
  const mod = stats.abilityMod + stats.magicBonus;
  return `${stats.damageDice}${mod ? (mod > 0 ? `+${mod}` : mod) : ''}`;
};

/**
 * A party member's equipped kit for the This Turn panel: weapons with the
 * character sheet's attack / damage numbers (`getWeaponStatsFor`), and other
 * equipped gear (armor, shields, wondrous items) as chips. Clicking any chip
 * opens ItemDetailModal (attack/damage breakdown, properties, description).
 * Only `equipped` items show — tick "Equip" on the sheet's inventory to add
 * one here.
 */
export default function PartyLoadout({ character }) {
  const [openId, setOpenId] = useState(null);
  const equipped = (character.inventory || []).filter(item => item?.equipped);
  const weapons = equipped.filter(isWeaponItem);
  const gear = equipped.filter(item => !isWeaponItem(item));
  const openItem = openId != null ? equipped.find(item => item.id === openId) : null;
  if (!weapons.length && !gear.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-2 pt-2 border-t border-stone-800">
      {weapons.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mr-0.5">Weapons</span>
          {weapons.map(item => {
            const stats = weaponStats(item, character);
            return (
              <button
                key={item.id}
                onClick={() => setOpenId(item.id)}
                title={item.description || item.name}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-red-800/60 bg-red-950/40 text-xs text-red-100 hover:border-red-500"
              >
                <span className="font-medium">{item.name}</span>
                {stats && (
                  <span className="pl-1.5 border-l border-red-800/60">
                    <span className="font-semibold text-amber-300">{stats.attackBonus}</span>
                    <span className="text-stone-400"> to hit</span>
                  </span>
                )}
                {chipDamage(stats) && (
                  <span className="pl-1.5 border-l border-red-800/60 text-stone-300">
                    {chipDamage(stats)}{stats.damageType ? ` ${stats.damageType.toLowerCase()}` : ''}
                    {item.damage2h ? ` (${item.damage2h} 2H)` : ''}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {gear.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mr-0.5">Gear</span>
          {gear.map(item => (
            <button
              key={item.id}
              onClick={() => setOpenId(item.id)}
              title={item.description || item.name}
              className="px-2 py-0.5 rounded border border-stone-700 bg-stone-800/60 text-xs text-stone-200 hover:border-stone-500"
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
      {openItem && (
        <ItemDetailModal
          item={openItem}
          stats={isWeaponItem(openItem) ? weaponStats(openItem, character) : null}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}
