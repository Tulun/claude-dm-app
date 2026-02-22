'use client';

import { useState } from 'react';
import Icons from '../Icons';
import { Tooltip } from '../ui';
import { MASTERY_DESC, PROPERTY_DESC, ARMOR_DESC } from './utils';

const InventoryDisplay = ({ items, character, getModNum, getProfBonus }) => {
  const [expandedItem, setExpandedItem] = useState(null);

  const parseWeapon = (item) => {
    const isWeapon = item.itemType === 'weapon' || item.isWeapon;
    if (!isWeapon && !item.damage && !item.description?.match(/\d+d\d+/)) return null;
    
    const damageStr = item.damage || '';
    const descMatch = item.description?.match(/(\d+d\d+(?:\s*\+\s*\d+)?)/i);
    const dice = damageStr || (descMatch ? descMatch[1] : null);
    
    if (!dice && !isWeapon) return null;

    const props = Array.isArray(item.weaponProperties) 
      ? item.weaponProperties.join(' ').toLowerCase()
      : (item.properties || '').toLowerCase();
    
    const isFinesse = props.includes('finesse');
    const isRanged = props.includes('range') || props.includes('ammunition');
    
    let statMod = getModNum(character.str);
    let statName = 'STR';
    
    if (isRanged) {
      statMod = getModNum(character.dex);
      statName = 'DEX';
    } else if (isFinesse) {
      const strMod = getModNum(character.str);
      const dexMod = getModNum(character.dex);
      if (dexMod > strMod) { statMod = dexMod; statName = 'DEX'; }
    }
    
    const profBonus = getProfBonus();
    
    return {
      dice: dice || '?',
      dice2h: item.damage2h || null,
      isVersatile: props.includes('versatile'),
      damageType: item.damageType || '',
      properties: Array.isArray(item.weaponProperties) ? item.weaponProperties.join(', ') : item.properties,
      statMod, statName, profBonus,
      attackBonus: statMod + profBonus,
      damageBonus: statMod,
      mastery: item.mastery || null
    };
  };

  const parseArmor = (item) => {
    if (item.itemType !== 'armor') return null;
    const dexMod = getModNum(character.dex);
    let ac = parseInt(item.baseAC) || 10;
    let acCalc = `${item.baseAC || '?'}`;
    
    if (item.armorType === 'Light') { ac += dexMod; acCalc += ` + ${dexMod} DEX = ${ac}`; }
    else if (item.armorType === 'Medium') { const cappedDex = Math.min(2, dexMod); ac += cappedDex; acCalc += ` + ${cappedDex} DEX (max 2) = ${ac}`; }
    else if (item.armorType === 'Shield') { ac = 2; acCalc = '+2 bonus'; }
    
    return { ac, acCalc, type: item.armorType, strRequired: item.strRequired, stealthDisadv: item.stealthDisadv };
  };
  
  return (
    <div className="space-y-1">
      <label className="text-xs text-stone-400 flex items-center gap-1"><Icons.Book /> Inventory</label>
      <div className="space-y-1">
        {items.map((item, i) => {
          const weapon = parseWeapon(item);
          const armor = parseArmor(item);
          const isExpanded = expandedItem === i;
          const hasDetails = item.description || weapon || armor;
          
          return (
            <div key={i} className={`rounded overflow-hidden ${
              weapon ? 'bg-red-900/20 border border-red-900/30' : 
              armor ? 'bg-blue-900/20 border border-blue-900/30' :
              'bg-stone-800/50'
            }`}>
              <div 
                className={`px-2 py-1.5 flex items-center justify-between text-xs ${hasDetails ? 'cursor-pointer hover:bg-stone-700/30' : ''}`}
                onClick={() => hasDetails && setExpandedItem(isExpanded ? null : i)}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {item.quantity > 1 && <span className="text-amber-400">{item.quantity}x</span>}
                  <span className={weapon ? 'text-red-300 font-medium' : armor ? 'text-blue-300 font-medium' : 'text-stone-300'}>{item.name}</span>
                  {weapon && weapon.dice !== '?' && (
                    <span className="text-red-400 font-mono text-[11px] bg-red-900/40 px-1.5 rounded">
                      +{weapon.attackBonus} | {weapon.dice}{weapon.isVersatile && weapon.dice2h ? `/${weapon.dice2h}` : ''}{weapon.damageBonus >= 0 ? '+' : ''}{weapon.damageBonus}
                    </span>
                  )}
                  {weapon?.mastery && (
                    <Tooltip text={MASTERY_DESC[weapon.mastery]}>
                      <span className="text-purple-400 text-[10px] bg-purple-900/40 px-1.5 rounded cursor-help">{weapon.mastery}</span>
                    </Tooltip>
                  )}
                  {armor && (
                    <Tooltip text={ARMOR_DESC[armor.type]}>
                      <span className="text-blue-400 text-[10px] bg-blue-900/40 px-1.5 rounded cursor-help">
                        {armor.type === 'Shield' ? '+2' : `AC ${armor.ac}`}
                      </span>
                    </Tooltip>
                  )}
                  {item.equipped && <span className="text-emerald-500 text-[10px]">✓</span>}
                </div>
                {hasDetails && <span className="text-stone-500">{isExpanded ? '▲' : '▼'}</span>}
              </div>
              {isExpanded && (
                <div className="px-2 pb-2 pt-1 border-t border-stone-700/50 text-xs space-y-1">
                  {weapon && (
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div><span className="text-stone-500">Attack:</span> <span className="text-red-300">+{weapon.attackBonus}</span> ({weapon.statName} {weapon.statMod >= 0 ? '+' : ''}{weapon.statMod} + Prof +{weapon.profBonus})</div>
                      <div><span className="text-stone-500">Damage:</span> <span className="text-red-300">{weapon.dice}{weapon.damageBonus >= 0 ? '+' : ''}{weapon.damageBonus}</span> {weapon.damageType}</div>
                      {weapon.isVersatile && weapon.dice2h && <div className="col-span-2"><span className="text-stone-500">Two-handed:</span> {weapon.dice2h}{weapon.damageBonus >= 0 ? '+' : ''}{weapon.damageBonus}</div>}
                      {weapon.properties && <div className="col-span-2"><span className="text-stone-500">Properties:</span> {weapon.properties}</div>}
                    </div>
                  )}
                  {armor && (
                    <div className="text-[11px]">
                      <div><span className="text-stone-500">AC:</span> <span className="text-blue-300">{armor.acCalc}</span></div>
                      {armor.strRequired && <div><span className="text-yellow-500">Requires STR {armor.strRequired}</span></div>}
                      {armor.stealthDisadv && <div><span className="text-yellow-500">Stealth Disadvantage</span></div>}
                    </div>
                  )}
                  {item.description && <div className="text-stone-400 italic">{item.description}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InventoryDisplay;
