'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icons from './Icons';
import { EditableField, HpBar, Tooltip } from './ui';

// Expandable inventory display with weapon stats and armor
const InventoryDisplay = ({ items, character, getModNum, getProfBonus }) => {
  const [expandedItem, setExpandedItem] = useState(null);
  
  // Mastery descriptions
  const MASTERY_DESC = {
    'Cleave': 'Hit another creature within 5 ft (weapon dice only)',
    'Graze': 'Deal modifier damage on miss',
    'Nick': 'Extra attack with light weapon (no mod to damage)',
    'Push': 'Push Large or smaller target 10 ft away',
    'Sap': 'Target has disadvantage on next attack',
    'Slow': 'Reduce target speed by 10 ft',
    'Topple': 'Target makes CON save or falls prone',
    'Vex': 'Gain advantage on next attack vs target',
  };

  // Weapon property descriptions
  const PROPERTY_DESC = {
    'Ammunition': 'Requires ammunition to fire. Drawing ammo is part of the attack.',
    'Finesse': 'Use STR or DEX for attack and damage rolls.',
    'Heavy': 'Small creatures have disadvantage on attacks.',
    'Light': 'Can engage in two-weapon fighting.',
    'Loading': 'Only one attack per action, bonus action, or reaction.',
    'Range': 'Can attack at a distance. Two numbers: normal/long range.',
    'Reach': 'Adds 5 ft to your reach when attacking.',
    'Thrown': 'Can be thrown for a ranged attack using same modifier.',
    'Two-Handed': 'Requires two hands to use.',
    'Versatile': 'Can be used with one or two hands (larger damage die).',
    'Simple': 'Simple weapon - most classes are proficient.',
    'Martial': 'Martial weapon - requires proficiency.',
  };

  // Armor type descriptions
  const ARMOR_DESC = {
    'Light': 'AC + full DEX modifier',
    'Medium': 'AC + DEX modifier (max +2)',
    'Heavy': 'AC only (no DEX)',
    'Shield': '+2 AC bonus',
  };
  
  // Detect if item is a weapon and parse damage
  const parseWeapon = (item) => {
    // Use explicit itemType or legacy isWeapon flag
    const isWeapon = item.itemType === 'weapon' || item.isWeapon;
    if (!isWeapon && !item.damage && !item.description?.match(/\d+d\d+/)) return null;
    
    // Try to extract damage dice from item.damage or description
    const damageStr = item.damage || '';
    const descMatch = item.description?.match(/(\d+d\d+(?:\s*\+\s*\d+)?)/i);
    const dice = damageStr || (descMatch ? descMatch[1] : null);
    
    // If marked as weapon but no dice, still show as weapon
    if (!dice && !isWeapon) return null;

    // Check properties - handle both array and string formats
    const props = Array.isArray(item.weaponProperties) 
      ? item.weaponProperties.join(' ').toLowerCase()
      : (item.properties || '').toLowerCase();
    
    // Determine stat modifier (default to STR, use DEX for finesse/ranged)
    const isFinesse = props.includes('finesse') || item.description?.toLowerCase()?.includes('finesse');
    const isRanged = props.includes('range') || props.includes('ammunition') ||
                     item.description?.toLowerCase()?.includes('ranged');
    
    let statMod = getModNum(character.str);
    let statName = 'STR';
    
    if (isRanged) {
      statMod = getModNum(character.dex);
      statName = 'DEX';
    } else if (isFinesse) {
      const strMod = getModNum(character.str);
      const dexMod = getModNum(character.dex);
      if (dexMod > strMod) {
        statMod = dexMod;
        statName = 'DEX';
      }
    }
    
    const profBonus = getProfBonus();
    const attackBonus = statMod + profBonus;
    
    // Check if versatile
    const isVersatile = props.includes('versatile');
    
    return {
      dice: dice || '?',
      dice2h: item.damage2h || null,
      isVersatile,
      damageType: item.damageType || '',
      properties: Array.isArray(item.weaponProperties) ? item.weaponProperties.join(', ') : item.properties,
      statMod,
      statName,
      profBonus,
      attackBonus,
      damageBonus: statMod,
      mastery: item.mastery || null
    };
  };

  // Parse armor stats
  const parseArmor = (item) => {
    if (item.itemType !== 'armor') return null;
    
    const dexMod = getModNum(character.dex);
    let ac = parseInt(item.baseAC) || 10;
    let acCalc = `${item.baseAC || '?'}`;
    
    if (item.armorType === 'Light') {
      ac += dexMod;
      acCalc += ` + ${dexMod} DEX = ${ac}`;
    } else if (item.armorType === 'Medium') {
      const cappedDex = Math.min(2, dexMod);
      ac += cappedDex;
      acCalc += ` + ${cappedDex} DEX (max 2) = ${ac}`;
    } else if (item.armorType === 'Shield') {
      ac = 2;
      acCalc = '+2 bonus';
    }
    // Heavy armor: no DEX bonus
    
    return {
      ac,
      acCalc,
      type: item.armorType,
      strRequired: item.strRequired,
      stealthDisadv: item.stealthDisadv
    };
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
                  {/* Weapon stats badge */}
                  {weapon && weapon.dice !== '?' && (
                    <span className="text-red-400 font-mono text-[11px] bg-red-900/40 px-1.5 rounded">
                      +{weapon.attackBonus} | {weapon.dice}{weapon.isVersatile && weapon.dice2h ? `/${weapon.dice2h}` : ''}{weapon.damageBonus >= 0 ? '+' : ''}{weapon.damageBonus}
                    </span>
                  )}
                  {weapon?.mastery && (
                    <Tooltip text={MASTERY_DESC[weapon.mastery]}>
                      <span className="text-purple-400 text-[10px] bg-purple-900/40 px-1.5 rounded cursor-help">
                        {weapon.mastery}
                      </span>
                    </Tooltip>
                  )}
                  {/* Armor stats badge */}
                  {armor && (
                    <Tooltip text={ARMOR_DESC[armor.type]}>
                      <span className="text-blue-400 font-mono text-[11px] bg-blue-900/40 px-1.5 rounded cursor-help">
                        AC {armor.ac}
                      </span>
                    </Tooltip>
                  )}
                  {armor?.stealthDisadv && (
                    <Tooltip text="Disadvantage on Stealth checks while wearing this armor">
                      <span className="text-orange-400 text-[10px] bg-orange-900/40 px-1.5 rounded cursor-help">
                        Stealth ⊘
                      </span>
                    </Tooltip>
                  )}
                </div>
                {hasDetails && (
                  <span className="text-stone-500 ml-2">{isExpanded ? '▲' : '▼'}</span>
                )}
              </div>
              
              {isExpanded && (
                <div className="px-2 py-2 border-t border-stone-700/50 bg-stone-900/50 space-y-1.5">
                  {/* Weapon details */}
                  {weapon && (
                    <div className="text-xs text-stone-400 space-y-0.5">
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                        <span>Attack: <span className="text-red-300 font-mono">+{weapon.attackBonus}</span> <span className="text-stone-500">({weapon.statName} {weapon.statMod >= 0 ? '+' : ''}{weapon.statMod} + Prof +{weapon.profBonus})</span></span>
                        {weapon.dice !== '?' && (
                          weapon.isVersatile && weapon.dice2h ? (
                            <span>Damage: <span className="text-red-300 font-mono">{weapon.dice}{weapon.damageBonus >= 0 ? '+' : ''}{weapon.damageBonus}</span> <span className="text-stone-500">(1H)</span> / <span className="text-red-300 font-mono">{weapon.dice2h}{weapon.damageBonus >= 0 ? '+' : ''}{weapon.damageBonus}</span> <span className="text-stone-500">(2H)</span> {weapon.damageType && <span className="text-stone-500">{weapon.damageType}</span>}</span>
                          ) : (
                            <span>Damage: <span className="text-red-300 font-mono">{weapon.dice}{weapon.damageBonus >= 0 ? '+' : ''}{weapon.damageBonus}</span> {weapon.damageType && <span className="text-stone-500">{weapon.damageType}</span>}</span>
                          )
                        )}
                      </div>
                      {weapon.properties && (
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-stone-500">Properties:</span>
                          {weapon.properties.split(',').map((prop, idx) => {
                            const trimmed = prop.trim();
                            return (
                              <Tooltip key={idx} text={PROPERTY_DESC[trimmed]}>
                                <span className="bg-amber-900/40 text-amber-300 px-1.5 py-0.5 rounded cursor-help">
                                  {trimmed}
                                </span>
                              </Tooltip>
                            );
                          })}
                        </div>
                      )}
                      {weapon.mastery && (
                        <Tooltip text={MASTERY_DESC[weapon.mastery]}>
                          <span className="text-purple-400 cursor-help">
                            <span className="font-medium">{weapon.mastery}</span>
                          </span>
                        </Tooltip>
                      )}
                    </div>
                  )}
                  {/* Armor details */}
                  {armor && (
                    <div className="text-xs text-stone-400 space-y-0.5">
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                        <span>AC: <span className="text-blue-300 font-mono">{armor.acCalc}</span></span>
                        {armor.type && <span>Type: <span className="text-blue-300">{armor.type}</span> <span className="text-stone-500">({ARMOR_DESC[armor.type]})</span></span>}
                      </div>
                      {armor.strRequired && <div className="text-orange-400/80">Requires STR {armor.strRequired}</div>}
                      {armor.stealthDisadv && <div className="text-orange-400/80">Disadvantage on Stealth checks</div>}
                    </div>
                  )}
                  {item.description && (
                    <p className="text-xs text-stone-400 whitespace-pre-wrap">{item.description}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CharacterCard = ({ character, isEnemy, onUpdate, onRemove, expanded, onToggleExpand, showResources }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isDead = character.currentHp <= 0;
  const characterType = character.class ? 'party' : 'template';

  const getMod = (score) => {
    const num = parseInt(score) || 10;
    const mod = Math.floor((num - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const getModNum = (score) => {
    const num = parseInt(score) || 10;
    return Math.floor((num - 10) / 2);
  };

  // Calculate proficiency bonus based on level or CR
  const getProfBonus = () => {
    if (character.level) {
      const lvl = parseInt(character.level) || 1;
      return Math.floor((lvl - 1) / 4) + 2;
    }
    if (character.cr) {
      const cr = character.cr;
      if (cr === '0' || cr === '1/8' || cr === '1/4' || cr === '1/2') return 2;
      const crNum = parseInt(cr) || 1;
      if (crNum <= 4) return 2;
      if (crNum <= 8) return 3;
      if (crNum <= 12) return 4;
      if (crNum <= 16) return 5;
      if (crNum <= 20) return 6;
      if (crNum <= 24) return 7;
      if (crNum <= 28) return 8;
      return 9;
    }
    return 2;
  };

  // Calculate spell save DC: 8 + proficiency + spellcasting mod
  const getSpellSaveDC = () => {
    if (!character.spellStat) return null;
    const statMap = { str: character.str, dex: character.dex, con: character.con, int: character.int, wis: character.wis, cha: character.cha };
    const mod = getModNum(statMap[character.spellStat]);
    return 8 + getProfBonus() + mod;
  };

  const getSpellAttackBonus = () => {
    if (!character.spellStat) return null;
    const statMap = { str: character.str, dex: character.dex, con: character.con, int: character.int, wis: character.wis, cha: character.cha };
    const mod = getModNum(statMap[character.spellStat]);
    const bonus = getProfBonus() + mod;
    return bonus >= 0 ? `+${bonus}` : `${bonus}`;
  };

  const spellDC = getSpellSaveDC();
  const spellAttack = getSpellAttackBonus();

  // Calculate AC from equipped items
  const getCalculatedAC = () => {
    const dexMod = getModNum(character.dex);
    const inventory = character.inventory || [];
    
    const equippedArmor = inventory.find(i => i.itemType === 'armor' && i.equipped && i.armorType !== 'Shield');
    const equippedShield = inventory.find(i => i.itemType === 'armor' && i.equipped && i.armorType === 'Shield');
    const acBonusItems = inventory.filter(i => i.equipped && i.acBonus && i.itemType !== 'armor');
    
    let baseAC = 10;
    let dexBonus = dexMod;
    let shieldBonus = 0;
    let itemBonuses = 0;
    let tempBonus = parseInt(character.tempAC) || 0;
    
    // Check temp effects
    if (character.acEffect === 'mageArmor') {
      baseAC = 13;
    } else if (character.acEffect === 'barkskin') {
      const naturalCalc = 10 + dexMod;
      if (naturalCalc < 16) {
        baseAC = 16;
        dexBonus = 0;
      }
    } else if (character.acEffect === 'unarmoredDefense') {
      const conMod = getModNum(character.con);
      const wisMod = getModNum(character.wis);
      const classes = character.classes?.map(c => c.name.toLowerCase()) || [character.class?.toLowerCase()];
      if (classes.includes('barbarian')) {
        baseAC = 10 + conMod;
      } else if (classes.includes('monk')) {
        baseAC = 10 + wisMod;
      }
    } else if (character.acEffect === 'draconicResilience') {
      // Draconic Sorcerer: 10 + DEX + CHA
      const chaMod = getModNum(character.cha);
      baseAC = 10 + chaMod;
    } else if (equippedArmor) {
      baseAC = parseInt(equippedArmor.baseAC) || 10;
      if (equippedArmor.armorType === 'Medium') {
        dexBonus = Math.min(2, dexMod);
      } else if (equippedArmor.armorType === 'Heavy') {
        dexBonus = 0;
      }
    }
    
    if (equippedShield) {
      shieldBonus = parseInt(equippedShield.baseAC) || 2;
    }
    
    acBonusItems.forEach(item => {
      itemBonuses += parseInt(item.acBonus) || 0;
    });
    
    return baseAC + dexBonus + shieldBonus + itemBonuses + tempBonus;
  };

  // Use calculated AC if no manual override, or if items are equipped
  const displayAC = character.acOverride || getCalculatedAC() || character.ac;

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${isDead ? 'border-red-900/50 bg-stone-900/30 opacity-60' : isEnemy ? 'border-red-800/50 bg-gradient-to-br from-red-950/40 to-stone-900/60' : 'border-emerald-800/50 bg-gradient-to-br from-emerald-950/40 to-stone-900/60'}`}>
      <div className={`flex items-center justify-between p-3 ${isEnemy ? 'hover:bg-red-900/20' : 'hover:bg-emerald-900/20'}`}>
        <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={onToggleExpand}>
          <div className={`p-2 rounded-lg ${isEnemy ? 'bg-red-900/50' : 'bg-emerald-900/50'}`}>{isEnemy ? <Icons.Skull /> : <Icons.Shield />}</div>
          <div>
            <h3 className={`font-bold ${isDead ? 'line-through text-stone-500' : ''}`}>{character.name}</h3>
            <p className="text-xs text-stone-400">
              {character.classes?.length > 0 
                ? character.classes.map(c => `${c.name} ${c.level}`).join(' / ')
                : character.class 
                  ? `${character.class} ${character.level || 1}` 
                  : character.cr 
                    ? `CR ${character.cr}`
                    : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1 text-sm ${character.acEffect ? 'text-cyan-400' : ''}`}><Icons.Shield /><span className="font-mono">{displayAC}</span></div>
          <div className="flex items-center gap-1 text-sm"><Icons.Heart /><span className={`font-mono ${isDead ? 'text-red-500' : ''}`}>{character.currentHp}/{character.maxHp}</span></div>
          {spellDC && <div className="flex items-center gap-1 text-sm text-purple-400"><Icons.Sparkles /><span className="font-mono">{spellDC}</span></div>}
          {isEnemy && onRemove && (
            <button 
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
              className="p-1.5 rounded text-stone-500 hover:text-red-400 hover:bg-red-900/30 transition-colors"
              title="Remove from combat"
            >
              <Icons.Trash />
            </button>
          )}
          <div className="cursor-pointer" onClick={onToggleExpand}>
            {expanded ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
          </div>
        </div>
      </div>

      {/* Quick stats bar - always visible when collapsed */}
      {!expanded && (
        <div className="px-3 pb-2 grid grid-cols-6 gap-1 text-center border-t border-stone-700/30 pt-2">
          {[
            { label: 'STR', value: character.str },
            { label: 'DEX', value: character.dex },
            { label: 'CON', value: character.con },
            { label: 'INT', value: character.int },
            { label: 'WIS', value: character.wis },
            { label: 'CHA', value: character.cha },
          ].map(stat => (
            <div key={stat.label} className="bg-stone-800/50 rounded p-1">
              <div className="text-[10px] text-stone-500">{stat.label}</div>
              <div className="text-sm font-bold">{stat.value || 10}</div>
              <div className="text-xs text-stone-400">{getMod(stat.value)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions preview - always visible when collapsed and has actions */}
      {!expanded && character.actions?.length > 0 && (
        <div className="px-3 pb-2 text-xs">
          <div className="flex flex-wrap gap-1">
            {character.actions.map((action, i) => (
              <span key={i} className="bg-red-900/30 text-red-300 px-2 py-0.5 rounded">{action.name}</span>
            ))}
          </div>
        </div>
      )}

      {expanded && (
        <div className="p-4 pt-0 border-t border-stone-700/50 space-y-4">
          <div>
            <label className="text-xs text-stone-400 mb-1 block">Hit Points</label>
            <HpBar current={character.currentHp} max={character.maxHp} onChange={(curr, max) => onUpdate({ ...character, currentHp: curr, maxHp: max })} />
          </div>
          
          {/* Read-only stat block for enemies */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="text-xs text-stone-400">Name</label>
              <div className="bg-stone-800/30 rounded px-2 py-1">{character.name}</div>
            </div>
            <div>
              <label className="text-xs text-stone-400">AC</label>
              <div className="flex items-center gap-2">
                <div className={`bg-stone-700/50 rounded px-2 py-1 font-mono flex-1 ${character.acEffect ? 'text-cyan-400' : ''}`}>
                  {displayAC}
                  {character.acEffect && <span className="text-xs text-cyan-600 ml-1">({character.acEffect.replace(/([A-Z])/g, ' $1').trim()})</span>}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-stone-500">+</span>
                  <input
                    type="number"
                    value={character.tempAC || ''}
                    onChange={(e) => onUpdate({ ...character, tempAC: e.target.value })}
                    placeholder="0"
                    className="w-10 bg-stone-700 rounded px-1 py-1 text-center text-sm font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    title="Bonus AC (Shield spell, cover, etc.)"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-stone-400">Initiative</label>
              <EditableField value={character.initiative} onChange={(v) => onUpdate({ ...character, initiative: v })} type="number" className="block w-full" />
            </div>
            <div>
              <label className="text-xs text-stone-400">Speed</label>
              <div className="flex items-center gap-1 bg-stone-800/30 rounded px-2 py-1">
                <Icons.Boot />
                <span>{character.speed}</span>
                {typeof character.speed === 'number' && <span className="text-stone-500">ft</span>}
              </div>
            </div>
          </div>

          {/* Read-only ability scores */}
          <div className="grid grid-cols-6 gap-2 text-center">
            {[
              { label: 'STR', key: 'str' },
              { label: 'DEX', key: 'dex' },
              { label: 'CON', key: 'con' },
              { label: 'INT', key: 'int' },
              { label: 'WIS', key: 'wis' },
              { label: 'CHA', key: 'cha' },
            ].map(stat => (
              <div key={stat.key} className="bg-stone-800/50 rounded p-2">
                <div className="text-[10px] text-stone-500">{stat.label}</div>
                <div className="font-bold">{character[stat.key] || 10}</div>
                <div className="text-xs text-stone-400">{getMod(character[stat.key])}</div>
              </div>
            ))}
          </div>
          
          {/* Saving Throws - read only */}
          <div>
            <label className="text-xs text-stone-400 mb-2 block">Saving Throws</label>
            <div className="grid grid-cols-6 gap-2 text-center">
              {[
                { label: 'STR', key: 'str' },
                { label: 'DEX', key: 'dex' },
                { label: 'CON', key: 'con' },
                { label: 'INT', key: 'int' },
                { label: 'WIS', key: 'wis' },
                { label: 'CHA', key: 'cha' },
              ].map(stat => {
                const saveProfs = character.saveProficiencies || {};
                const isProf = saveProfs[stat.key] || 0;
                const mod = getModNum(character[stat.key]);
                const bonus = mod + (isProf ? getProfBonus() : 0);
                const bonusStr = bonus >= 0 ? `+${bonus}` : `${bonus}`;
                return (
                  <div 
                    key={stat.key} 
                    className={`rounded p-2 ${isProf ? 'bg-emerald-900/40 border border-emerald-700/50' : 'bg-stone-800/50'}`}
                  >
                    <div className="text-[10px] text-stone-500">{stat.label}</div>
                    <div className={`text-sm font-bold ${isProf ? 'text-emerald-400' : ''}`}>{bonusStr}</div>
                    {isProf && <div className="text-[10px] text-emerald-500">Prof</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Defenses - Vulnerabilities, Resistances, Immunities */}
          {(character.vulnerabilities || character.resistances || character.immunities) && (
            <div className="space-y-2 text-xs">
              {character.vulnerabilities && (
                <div><span className="text-yellow-500 font-semibold">Vulnerabilities:</span> <span className="text-yellow-300">{character.vulnerabilities}</span></div>
              )}
              {character.resistances && (
                <div><span className="text-blue-500 font-semibold">Resistances:</span> <span className="text-blue-300">{character.resistances}</span></div>
              )}
              {character.immunities && (
                <div><span className="text-green-500 font-semibold">Immunities:</span> <span className="text-green-300">{character.immunities}</span></div>
              )}
            </div>
          )}

          {/* Senses & Languages */}
          {(character.senses || character.languages) && (
            <div className="text-xs space-y-1">
              {character.senses && <div><span className="text-stone-500 font-semibold">Senses:</span> <span className="text-stone-300">{character.senses}</span></div>}
              {character.languages && <div><span className="text-stone-500 font-semibold">Languages:</span> <span className="text-stone-300">{character.languages}</span></div>}
            </div>
          )}

          {/* Advantages / Resistances - View Only (legacy) */}
          {(character.advantages || []).length > 0 && (
            <div>
              <label className="text-xs text-stone-400 mb-2 block">Advantages & Resistances</label>
              <div className="flex flex-wrap gap-1">
                {character.advantages.map((adv, i) => (
                  <span 
                    key={i} 
                    className="bg-blue-900/40 text-blue-300 rounded px-2 py-1 text-xs"
                  >
                    {adv}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Spellcasting section - display only */}
          {spellDC && (
            <div className="flex items-center gap-4 text-sm bg-purple-900/20 rounded-lg p-3">
              <div className="text-center">
                <label className="text-xs text-stone-400">Spellcasting</label>
                <div className="font-mono text-purple-400 text-sm uppercase">{character.spellStat}</div>
              </div>
              <div className="text-center">
                <label className="text-xs text-stone-400">Spell DC</label>
                <div className="font-mono text-purple-400 text-lg">{spellDC}</div>
              </div>
              <div className="text-center">
                <label className="text-xs text-stone-400">Spell Atk</label>
                <div className="font-mono text-purple-400 text-lg">{spellAttack}</div>
              </div>
              <div className="text-center">
                <label className="text-xs text-stone-400">Prof</label>
                <div className="font-mono text-stone-400 text-lg">+{getProfBonus()}</div>
              </div>
            </div>
          )}

          {/* Notes - editable for status effects, conditions, etc. */}
          <div><label className="text-xs text-stone-400">Notes (conditions, status effects)</label><EditableField value={character.notes} onChange={(v) => onUpdate({ ...character, notes: v })} className="block w-full text-sm" placeholder="Click to add notes..." /></div>
          
          {/* Resources with +/- controls */}
          {showResources && (character.resources || []).length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-stone-400 flex items-center gap-1"><Icons.Sparkles /> Resources</label>
              <div className="space-y-1">
                {character.resources.map((r, i) => (
                  <div key={i} className="bg-stone-800/50 rounded px-2 py-1.5 flex items-center justify-between">
                    <span className="text-stone-300 text-sm">{r.name}</span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); const updated = [...character.resources]; updated[i] = { ...r, current: Math.max(0, r.current - 1) }; onUpdate({ ...character, resources: updated }); }}
                        className="w-6 h-6 rounded bg-stone-700 hover:bg-stone-600 text-stone-300 flex items-center justify-center text-sm"
                      >−</button>
                      <span className="font-mono text-amber-400 w-12 text-center">{r.current}/{r.max}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); const updated = [...character.resources]; updated[i] = { ...r, current: Math.min(r.max, r.current + 1) }; onUpdate({ ...character, resources: updated }); }}
                        className="w-6 h-6 rounded bg-stone-700 hover:bg-stone-600 text-stone-300 flex items-center justify-center text-sm"
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Inventory summary - expandable with weapon stats */}
          {showResources && (character.inventory || []).length > 0 && (
            <InventoryDisplay 
              items={character.inventory} 
              character={character}
              getModNum={getModNum}
              getProfBonus={getProfBonus}
            />
          )}

          {/* Traits - full display */}
          {(character.traits || []).length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-amber-400 font-bold flex items-center gap-1">Traits</label>
              <div className="space-y-2">
                {character.traits.map((trait, i) => (
                  <div key={i} className="text-xs bg-stone-800/30 rounded p-2">
                    <span className="text-amber-300 font-semibold italic">{trait.name}.</span>{' '}
                    <span className="text-stone-300">{trait.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Actions - full display with descriptions */}
          {(character.actions || []).length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-red-400 font-bold flex items-center gap-1"><Icons.Sword /> Actions</label>
              <div className="space-y-2">
                {character.actions.map((action, i) => (
                  <div key={i} className="text-xs bg-red-950/30 border border-red-900/30 rounded p-2">
                    <span className="text-red-300 font-semibold italic">{action.name}.</span>{' '}
                    <span className="text-stone-300">{action.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reactions - full display */}
          {(character.reactions || []).length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-cyan-400 font-bold flex items-center gap-1">Reactions</label>
              <div className="space-y-2">
                {character.reactions.map((reaction, i) => (
                  <div key={i} className="text-xs bg-cyan-950/30 border border-cyan-900/30 rounded p-2">
                    <span className="text-cyan-300 font-semibold italic">{reaction.name}.</span>{' '}
                    <span className="text-stone-300">{reaction.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legendary Actions - full display */}
          {(character.legendaryActions || []).length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-purple-400 font-bold flex items-center gap-1">★ Legendary Actions</label>
              <div className="space-y-2">
                {character.legendaryActions.map((action, i) => (
                  <div key={i} className="text-xs bg-purple-950/30 border border-purple-900/30 rounded p-2">
                    <span className="text-purple-300 font-semibold italic">{action.name}.</span>{' '}
                    <span className="text-stone-300">{action.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center pt-2 border-t border-stone-700/30">
            <Link 
              href={`/character?id=${character.id}&type=${characterType}`}
              className="flex items-center gap-1 px-3 py-1 rounded text-sm bg-amber-900/30 hover:bg-amber-800/50 text-amber-400"
            >
              <Icons.Edit /> Full Page
            </Link>
            <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1 px-3 py-1 rounded text-sm bg-red-900/30 hover:bg-red-800/50 text-red-400">
              <Icons.Trash />{isEnemy ? 'Kill' : 'Remove'}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-stone-900 border border-stone-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-full ${isEnemy ? 'bg-red-900/50' : 'bg-emerald-900/50'}`}>
                {isEnemy ? <Icons.Skull /> : <Icons.Shield />}
              </div>
              <div>
                <h3 className="text-lg font-bold">{isEnemy ? 'Kill' : 'Remove'} {character.name}?</h3>
                <p className="text-sm text-stone-400">
                  {isEnemy 
                    ? 'This will remove the enemy from combat.' 
                    : 'This will remove the party member from your party.'}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)} 
                className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => { onRemove(character.id); setShowDeleteConfirm(false); }} 
                className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm flex items-center gap-2"
              >
                <Icons.Trash /> Yes, {isEnemy ? 'Kill' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterCard;
