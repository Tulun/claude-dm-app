'use client';

import { createPortal } from 'react-dom';
import Icons from '../../components/Icons';
import Modal from '../../components/Modal';
import { formatMod, getModNum } from '../../utils/rules';
import { getArmorData } from '../../utils/acCalculation';
import { ARMOR_DESC, MASTERY_DESC, PROPERTY_DESC } from './CharacterCard/utils';

/**
 * What an equipped item does, opened from the turn tracker's loadout chips.
 * Weapons get the attack / damage breakdown (ability + proficiency + magic,
 * from `getWeaponStatsFor`) plus property and mastery explanations; armor
 * gets the wearer's AC (base + capped DEX, when `character` is passed), how
 * DEX applies, and stealth / STR notes. Every item shows
 * its description as plain text ("No description." only when nothing else
 * is shown).
 *
 * Portaled to <body>: the tracker is a sticky z-10 bar, and a fixed overlay
 * inside that stacking context would sit underneath the navbar.
 */
export default function ItemDetailModal({ item, stats, character, onClose }) {
  if (!item || typeof document === 'undefined') return null;

  const props = stats?.properties || [];
  const parts = stats
    ? [
        `${stats.ability} ${formatMod(stats.abilityMod)}`,
        `Prof ${formatMod(stats.profBonus)}`,
        ...(stats.magicBonus ? [`Magic ${formatMod(stats.magicBonus)}`] : []),
      ]
    : [];
  // Armor stats come from the item's own fields, falling back to the
  // canonical armor table when the item only has a recognisable name.
  const isArmor = item.itemType === 'armor' || !!item.armorType;
  const tableArmor = isArmor ? getArmorData(item) : null;
  const armorType = item.armorType || tableArmor?.armorType || '';
  const baseAC = item.baseAC || tableArmor?.baseAC || '';
  const isShield = armorType === 'Shield';
  const hasArmorInfo = isArmor && (baseAC || armorType);
  // Wearer's AC from this armor alone — same DEX caps as getEquipmentAC.
  // Shields are a flat bonus, so there's nothing to modify.
  const dexMod = character ? getModNum(character.dex) : null;
  const dexBonus = dexMod === null || isShield || armorType === 'Heavy'
    ? null
    : armorType === 'Medium' ? Math.min(2, dexMod) : dexMod;
  const wornAC = baseAC && dexBonus !== null ? Number(baseAC) + dexBonus : null;

  const dmgParts = stats
    ? [
        `${stats.ability} ${formatMod(stats.abilityMod)}`,
        ...(stats.magicBonus ? [`Magic ${formatMod(stats.magicBonus)}`] : []),
      ]
    : [];

  return createPortal(
    <Modal onClose={onClose}>
      <div className="bg-stone-900 border border-stone-700 rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className={`p-4 border-b border-stone-700 flex items-start justify-between gap-3 ${stats ? 'bg-gradient-to-r from-red-950/40 to-stone-900' : ''}`}>
          <div>
            <h2 className={`text-lg font-bold ${stats ? 'text-red-300' : 'text-stone-100'}`}>{item.name}</h2>
            <p className="text-xs text-stone-400">
              {[item.rarity, item.itemType, item.armorType && `${item.armorType} armor`, item.attunement && 'requires attunement']
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-stone-400 hover:text-stone-200"><Icons.X /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {stats && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-stone-800/60 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">To Hit</div>
                <div className="text-2xl font-bold font-mono text-amber-300">{stats.attackBonus}</div>
                <div className="text-xs text-stone-400">{parts.join(' + ')}</div>
              </div>
              <div className="rounded-lg bg-stone-800/60 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Damage</div>
                <div className="text-2xl font-bold font-mono text-stone-100">{stats.damage || '—'}</div>
                <div className="text-xs text-stone-400">
                  {stats.damageDice ? `${stats.damageDice} + ${dmgParts.join(' + ')}` : 'No damage dice on the item'}
                  {stats.damageType ? ` · ${stats.damageType}` : ''}
                  {item.damage2h ? ` · ${item.damage2h} two-handed` : ''}
                </div>
              </div>
            </div>
          )}

          {stats && props.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Properties</div>
              {props.map(p => (
                <div key={p} className="text-sm">
                  <span className="font-medium text-stone-200">{p}</span>
                  {PROPERTY_DESC[p] && <span className="text-stone-400"> — {PROPERTY_DESC[p]}</span>}
                </div>
              ))}
            </div>
          )}

          {item.mastery && (
            <div className="text-sm">
              <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Mastery</div>
              <span className="font-medium text-amber-300">{item.mastery}</span>
              {MASTERY_DESC[item.mastery] && <span className="text-stone-400"> — {MASTERY_DESC[item.mastery]}</span>}
            </div>
          )}

          {hasArmorInfo && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-stone-800/60 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">{isShield ? 'AC Bonus' : wornAC !== null ? 'AC' : 'Base AC'}</div>
                <div className="text-2xl font-bold font-mono text-sky-300">{wornAC ?? (baseAC ? (isShield ? `+${baseAC}` : baseAC) : '—')}</div>
                {wornAC !== null && <div className="text-xs text-stone-400">{baseAC} AC + Dex Modifier ({formatMod(dexBonus)})</div>}
                {armorType && <div className="text-xs text-stone-400">{ARMOR_DESC[armorType] || `${armorType} armor`}</div>}
              </div>
              <div className="rounded-lg bg-stone-800/60 p-3 text-xs text-stone-400 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Wearing</div>
                <div>{item.stealthDisadv ? 'Disadvantage on Stealth checks' : 'No Stealth penalty'}</div>
                {item.strRequired && <div>Requires STR {item.strRequired} (else −10 ft speed)</div>}
              </div>
            </div>
          )}

          {item.description ? (
            <p className="text-sm text-stone-300 whitespace-pre-line leading-relaxed">{item.description}</p>
          ) : hasArmorInfo || stats ? null : (
            <p className="text-sm text-stone-500 italic">No description.</p>
          )}
        </div>
      </div>
    </Modal>,
    document.body
  );
}
