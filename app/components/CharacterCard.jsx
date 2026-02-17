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
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showHpEditor, setShowHpEditor] = useState(false);
  const [hpDelta, setHpDelta] = useState('');
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
    
    // If no inventory and no AC effect, return null to use template's ac value
    if (inventory.length === 0 && !character.acEffect && !character.tempAC) {
      return null;
    }
    
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

  // Use calculated AC if available, otherwise fall back to template's ac value
  const calculatedAC = getCalculatedAC();
  const displayAC = character.acOverride || calculatedAC || character.ac || 10;

  // Parse spellcasting from traits, actions, or notes
  const parseSpellcasting = () => {
    const spellcasting = {
      found: false,
      dc: null,
      attack: null,
      ability: null,
      atWill: [],
      perDay: {}, // { "1": ["spell1", "spell2"], "3": ["spell3"] }
      slots: {}, // { "1st": { slots: 4, spells: ["entangle", "longstrider"] } }
      cantrips: [],
      notes: null,
      source: null, // 'trait', 'action', or 'notes'
    };

    // Check traits and actions for Spellcasting
    const allAbilities = [
      ...(character.traits || []).map(t => ({ ...t, source: 'trait' })),
      ...(character.actions || []).map(a => ({ ...a, source: 'action' })),
    ];

    for (const ability of allAbilities) {
      const name = ability.name?.toLowerCase() || '';
      const desc = ability.description || '';
      
      if (name.includes('spellcasting') || name.includes('innate spellcasting')) {
        spellcasting.found = true;
        spellcasting.notes = desc;
        spellcasting.source = ability.source;
        parseSpellText(desc, spellcasting);
        break;
      }
    }

    // If not found in traits/actions, check notes field
    if (!spellcasting.found && character.notes) {
      const notes = character.notes.toLowerCase();
      if (notes.includes('spellcasting') || notes.includes('spell save dc') || notes.includes('cantrips')) {
        spellcasting.found = true;
        spellcasting.notes = character.notes;
        spellcasting.source = 'notes';
        parseSpellText(character.notes, spellcasting);
      }
    }

    return spellcasting;
  };

  // Helper to parse spell text into structured data
  const parseSpellText = (desc, spellcasting) => {
    // Extract DC and attack bonus
    const dcMatch = desc.match(/(?:spell save DC|DC)\s*(\d+)/i);
    if (dcMatch) spellcasting.dc = dcMatch[1];
    
    const attackMatch = desc.match(/([+-]\d+)\s*(?:to hit|spell attack)/i);
    if (attackMatch) spellcasting.attack = attackMatch[1];

    // Also try format like "(DC 12, +4)"
    const comboMatch = desc.match(/\(DC\s*(\d+),?\s*([+-]\d+)\)/i);
    if (comboMatch) {
      spellcasting.dc = comboMatch[1];
      spellcasting.attack = comboMatch[2];
    }

    // Extract cantrips
    const cantripMatch = desc.match(/cantrips?[^:]*:\s*([^.]+?)(?:\.|$|\d+(?:st|nd|rd|th))/i);
    if (cantripMatch) {
      spellcasting.cantrips = cantripMatch[1].split(/,\s*/).map(s => s.trim()).filter(Boolean);
    }

    // Extract at-will spells
    const atWillMatch = desc.match(/at will[^:]*:\s*([^.]+)/i);
    if (atWillMatch) {
      spellcasting.atWill = atWillMatch[1].split(/,\s*/).map(s => s.trim()).filter(Boolean);
    }

    // Extract X/day spells
    const perDayMatches = desc.matchAll(/(\d+)\/day[^:]*:\s*([^.]+)/gi);
    for (const match of perDayMatches) {
      const count = match[1];
      const spells = match[2].split(/,\s*/).map(s => s.trim()).filter(Boolean);
      spellcasting.perDay[count] = [...(spellcasting.perDay[count] || []), ...spells];
    }

    // Extract slot-based spells (e.g., "1st (4 slots): entangle, longstrider")
    const slotMatches = desc.matchAll(/(\d+)(?:st|nd|rd|th)\s*\((\d+)\s*slots?\)[^:]*:\s*([^.]+?)(?:\.|$|\d+(?:st|nd|rd|th))/gi);
    for (const match of slotMatches) {
      const level = match[1] + (match[1] === '1' ? 'st' : match[1] === '2' ? 'nd' : match[1] === '3' ? 'rd' : 'th');
      spellcasting.slots[level] = {
        slots: parseInt(match[2]),
        spells: match[3].split(/,\s*/).map(s => s.trim()).filter(Boolean),
      };
    }
  };

  const spellcastingInfo = parseSpellcasting();

  // State for notes popup
  const [showNotesPopup, setShowNotesPopup] = useState(false);
  const [notesText, setNotesText] = useState(character.notes || '');

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${isDead ? 'border-red-900/50 bg-stone-900/30 opacity-60' : isEnemy ? 'border-red-800/50 bg-gradient-to-br from-red-950/40 to-stone-900/60' : 'border-emerald-800/50 bg-gradient-to-br from-emerald-950/40 to-stone-900/60'}`}>
      <div className="p-3">
        {/* Top row: Icon, Name, and action buttons */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 flex-1">
            <div className={`p-2 rounded-lg ${isEnemy ? 'bg-red-900/50' : 'bg-emerald-900/50'}`}>{isEnemy ? <Icons.Skull /> : <Icons.Shield />}</div>
            <div>
              <h3 className={`font-bold text-lg ${isDead ? 'line-through text-stone-500' : ''}`}>{character.name}</h3>
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
          <div className="flex items-center gap-1">
            {/* Notes Button */}
            {isEnemy && (
              <button 
                onClick={(e) => { e.stopPropagation(); setNotesText(character.notes || ''); setShowNotesPopup(true); }}
                className={`p-2 rounded-lg transition-colors ${
                  character.notes 
                    ? 'text-amber-400 hover:bg-amber-900/30 bg-amber-900/20' 
                    : 'text-stone-500 hover:text-amber-400 hover:bg-amber-900/30'
                }`}
                title="Combat Notes (conditions, status)"
              >
                <Icons.Scroll className="w-5 h-5" />
              </button>
            )}
            {/* Quick Actions Button */}
            {isEnemy && (character.actions?.length > 0 || character.legendaryActions?.length > 0 || spellcastingInfo.found) && (
              <button 
                onClick={(e) => { e.stopPropagation(); setShowQuickActions(true); }}
                className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
                  character.legendaryActions?.length > 0 
                    ? 'text-purple-400 hover:bg-purple-900/30 bg-purple-900/20' 
                    : 'text-red-400 hover:bg-red-900/30'
                }`}
                title="Quick Actions"
              >
                <Icons.Sword />
                {character.legendaryActions?.length > 0 && <span className="text-xs">★</span>}
              </button>
            )}
            {isEnemy && onRemove && (
              <button 
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                className="p-2 rounded-lg text-stone-500 hover:text-red-400 hover:bg-red-900/30 transition-colors"
                title="Remove from combat"
              >
                <Icons.Trash />
              </button>
            )}
            {/* Expand/Collapse Arrow - bigger and more prominent */}
            <button 
              onClick={onToggleExpand}
              className={`p-2 rounded-lg transition-colors ${isEnemy ? 'hover:bg-red-900/30' : 'hover:bg-emerald-900/30'}`}
              title={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Stats row: AC, HP, Spell DC in styled badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${character.acEffect ? 'bg-cyan-900/30 text-cyan-400' : 'bg-stone-800/60 text-stone-300'}`}>
            <Icons.Shield />
            <span className="font-mono font-medium">{displayAC}</span>
            <span className="text-xs text-stone-500">AC</span>
          </div>
          {/* HP Badge - Clickable to edit */}
          <div className="relative">
            {showHpEditor ? (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowHpEditor(false)} />
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm z-50 relative ${isDead ? 'bg-red-900/40' : 'bg-stone-800/60'}`}>
                  <Icons.Heart />
                  <input
                    type="text"
                    value={hpDelta}
                    onChange={(e) => setHpDelta(e.target.value)}
                    onBlur={() => {
                      const num = parseInt(hpDelta);
                      if (!isNaN(num) && num >= 0) {
                        onUpdate({ ...character, currentHp: num });
                      }
                      setShowHpEditor(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const num = parseInt(hpDelta);
                        if (!isNaN(num) && num >= 0) {
                          onUpdate({ ...character, currentHp: num });
                        }
                        setShowHpEditor(false);
                      } else if (e.key === 'Escape') {
                        setShowHpEditor(false);
                      }
                    }}
                    className="w-12 text-center bg-stone-900 border border-amber-500 rounded px-1 py-0.5 font-mono focus:outline-none"
                    autoFocus
                  />
                  <span className="text-stone-500">/</span>
                  <span className="font-mono text-stone-400">{character.maxHp}</span>
                  <span className="text-xs text-stone-500">HP</span>
                </div>
              </>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setHpDelta(String(character.currentHp)); setShowHpEditor(true); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${
                  isDead ? 'bg-red-900/40 text-red-400 hover:bg-red-900/50' : 'bg-stone-800/60 text-stone-300 hover:bg-stone-700/60'
                }`}
                title="Click to edit HP"
              >
                <Icons.Heart />
                <span className={`font-mono font-medium ${isDead ? 'text-red-400' : ''}`}>{character.currentHp}</span>
                <span className="text-stone-500">/</span>
                <span className="font-mono text-stone-400">{character.maxHp}</span>
                <span className="text-xs text-stone-500">HP</span>
              </button>
            )}
          </div>
          {spellDC && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-purple-900/30 text-purple-400">
              <Icons.Sparkles />
              <span className="font-mono font-medium">{spellDC}</span>
              <span className="text-xs text-purple-500">DC</span>
            </div>
          )}
          {/* Show notes indicator in stats row if notes exist */}
          {isEnemy && character.notes && (
            <div 
              onClick={(e) => { e.stopPropagation(); setNotesText(character.notes || ''); setShowNotesPopup(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-amber-900/30 text-amber-400 cursor-pointer hover:bg-amber-900/40"
              title={character.notes}
            >
              <Icons.Scroll className="w-4 h-4" />
              <span className="text-xs max-w-[100px] truncate">{character.notes}</span>
            </div>
          )}
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
        <div className="px-3 pb-3 text-xs">
          <div className="flex flex-wrap gap-1.5">
            {character.actions.map((action, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setShowQuickActions(true); }}
                className="bg-red-900/30 text-red-300 px-2 py-1 rounded cursor-pointer hover:bg-red-800/40 transition-colors"
              >
                {action.name}
              </button>
            ))}
            {/* Show spellcasting indicator if present */}
            {spellcastingInfo.found && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowQuickActions(true); }}
                className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded cursor-pointer hover:bg-purple-800/40 transition-colors flex items-center gap-1"
              >
                <Icons.Sparkles /> Spells
              </button>
            )}
          </div>
        </div>
      )}

      {expanded && (
        <div className="p-4 border-t border-stone-700/50 space-y-4">
          <div>
            <label className="text-xs text-stone-400 mb-2 block">Hit Points</label>
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
          {/* If spellcasting was parsed from notes, don't show it again in Notes */}
          {spellcastingInfo.source !== 'notes' ? (
            <div><label className="text-xs text-stone-400">Notes (conditions, status effects)</label><EditableField value={character.notes} onChange={(v) => onUpdate({ ...character, notes: v })} className="block w-full text-sm" placeholder="Click to add notes..." /></div>
          ) : (
            <div>
              <label className="text-xs text-stone-400">Notes (conditions, status effects)</label>
              <div className="text-xs text-stone-500 italic mt-1">Spellcasting info shown above. Click to edit raw notes.</div>
              <EditableField value={character.notes} onChange={(v) => onUpdate({ ...character, notes: v })} className="block w-full text-sm opacity-50" placeholder="Click to add notes..." />
            </div>
          )}
          
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

          {/* Spellcasting - parsed and formatted nicely */}
          {spellcastingInfo.found && (
            <div className="space-y-2">
              <label className="text-xs text-purple-400 font-bold flex items-center gap-2">
                <Icons.Sparkles /> Spellcasting
                {spellcastingInfo.dc && (
                  <span className="font-mono bg-purple-900/40 px-2 py-0.5 rounded text-purple-300">
                    DC {spellcastingInfo.dc}
                  </span>
                )}
                {spellcastingInfo.attack && (
                  <span className="font-mono bg-purple-900/40 px-2 py-0.5 rounded text-purple-300">
                    {spellcastingInfo.attack} to hit
                  </span>
                )}
              </label>
              <div className="bg-purple-950/20 border border-purple-900/30 rounded-lg p-3 space-y-2">
                {/* Cantrips */}
                {spellcastingInfo.cantrips.length > 0 && (
                  <div className="text-xs">
                    <span className="text-purple-400 font-medium">Cantrips: </span>
                    <span className="text-stone-300 italic">{spellcastingInfo.cantrips.join(', ')}</span>
                  </div>
                )}
                
                {/* At Will */}
                {spellcastingInfo.atWill.length > 0 && (
                  <div className="text-xs">
                    <span className="text-purple-400 font-medium">At Will: </span>
                    <span className="text-stone-300 italic">{spellcastingInfo.atWill.join(', ')}</span>
                  </div>
                )}
                
                {/* Per Day */}
                {Object.keys(spellcastingInfo.perDay).length > 0 && (
                  <div className="space-y-1">
                    {Object.entries(spellcastingInfo.perDay).sort((a, b) => parseInt(b[0]) - parseInt(a[0])).map(([count, spells]) => (
                      <div key={count} className="text-xs">
                        <span className="text-purple-400 font-medium">{count}/Day: </span>
                        <span className="text-stone-300 italic">{spells.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Spell Slots */}
                {Object.keys(spellcastingInfo.slots).length > 0 && (
                  <div className="space-y-1">
                    {Object.entries(spellcastingInfo.slots).map(([level, data]) => (
                      <div key={level} className="text-xs">
                        <span className="text-purple-400 font-medium">{level} ({data.slots} slots): </span>
                        <span className="text-stone-300 italic">{data.spells.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fallback: show raw notes if no structured data parsed */}
                {spellcastingInfo.cantrips.length === 0 && 
                 spellcastingInfo.atWill.length === 0 && 
                 Object.keys(spellcastingInfo.perDay).length === 0 && 
                 Object.keys(spellcastingInfo.slots).length === 0 && 
                 spellcastingInfo.notes && (
                  <div className="text-xs text-stone-300">{spellcastingInfo.notes}</div>
                )}
              </div>
            </div>
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
            {isEnemy ? (
              <button 
                onClick={() => setShowQuickActions(true)}
                className="flex items-center gap-1 px-3 py-1 rounded text-sm bg-red-900/30 hover:bg-red-800/50 text-red-400"
              >
                <Icons.Sword /> Actions & Spells
              </button>
            ) : (
              <Link 
                href={`/character?id=${character.id}&type=${characterType}`}
                className="flex items-center gap-1 px-3 py-1 rounded text-sm bg-amber-900/30 hover:bg-amber-800/50 text-amber-400"
              >
                <Icons.Edit /> Full Page
              </Link>
            )}
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

      {/* Quick Actions Modal */}
      {showQuickActions && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowQuickActions(false)}>
          <div className="bg-stone-900 border border-red-800/50 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-4 border-b border-stone-700 bg-gradient-to-r from-red-950/50 to-stone-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-900/50"><Icons.Skull /></div>
                  <div>
                    <h2 className="text-lg font-bold text-red-400">{character.name}</h2>
                    <p className="text-xs text-stone-400">
                      CR {character.cr} • AC {displayAC} • HP {character.currentHp}/{character.maxHp}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowQuickActions(false)} className="text-stone-400 hover:text-stone-200">
                  <Icons.X />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Legendary Actions Tracker */}
              {character.legendaryActions?.length > 0 && (
                <div className="bg-purple-950/30 border border-purple-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
                      ★ Legendary Actions
                      <span className="text-xs text-stone-400 font-normal">(3 per round, at end of other creature's turn)</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-400">Used:</span>
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <button
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation();
                              const used = character.legendaryActionsUsed || 0;
                              const newUsed = i < used ? i : i + 1;
                              onUpdate({ ...character, legendaryActionsUsed: newUsed });
                            }}
                            className={`w-6 h-6 rounded-full border-2 transition-colors ${
                              i < (character.legendaryActionsUsed || 0)
                                ? 'bg-purple-600 border-purple-400'
                                : 'bg-stone-800 border-stone-600 hover:border-purple-500'
                            }`}
                            title={`${i + 1} legendary action${i > 0 ? 's' : ''} used`}
                          />
                        ))}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onUpdate({ ...character, legendaryActionsUsed: 0 }); }}
                        className="text-xs text-purple-400 hover:text-purple-300 ml-2 px-2 py-1 rounded hover:bg-purple-900/30"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {character.legendaryActions.map((action, i) => (
                      <div key={i} className="bg-purple-900/20 rounded p-3">
                        <div className="text-sm">
                          <span className="text-purple-300 font-semibold">{action.name}.</span>{' '}
                          <span className="text-stone-300">{action.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Spellcasting with Slot Tracking */}
              {spellcastingInfo.found && (
                <div className="bg-purple-950/30 border border-purple-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
                      <Icons.Sparkles /> Spellcasting
                      {spellcastingInfo.dc && (
                        <span className="font-mono bg-purple-900/40 px-2 py-0.5 rounded text-purple-300 text-xs">
                          DC {spellcastingInfo.dc}
                        </span>
                      )}
                      {spellcastingInfo.attack && (
                        <span className="font-mono bg-purple-900/40 px-2 py-0.5 rounded text-purple-300 text-xs">
                          {spellcastingInfo.attack} to hit
                        </span>
                      )}
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Cantrips */}
                    {spellcastingInfo.cantrips.length > 0 && (
                      <div>
                        <div className="text-xs text-purple-400 font-medium mb-1">Cantrips (at will)</div>
                        <div className="flex flex-wrap gap-1">
                          {spellcastingInfo.cantrips.map((spell, i) => (
                            <span key={i} className="bg-purple-900/30 text-purple-200 px-2 py-1 rounded text-xs italic">
                              {spell}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* At Will Spells */}
                    {spellcastingInfo.atWill.length > 0 && (
                      <div>
                        <div className="text-xs text-purple-400 font-medium mb-1">At Will</div>
                        <div className="flex flex-wrap gap-1">
                          {spellcastingInfo.atWill.map((spell, i) => (
                            <span key={i} className="bg-purple-900/30 text-purple-200 px-2 py-1 rounded text-xs italic">
                              {spell}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Per Day Spells with Usage Tracking */}
                    {Object.keys(spellcastingInfo.perDay).length > 0 && (
                      <div className="space-y-2">
                        {Object.entries(spellcastingInfo.perDay).sort((a, b) => parseInt(b[0]) - parseInt(a[0])).map(([count, spells]) => {
                          const usageKey = `perDay${count}Used`;
                          const used = character[usageKey] || 0;
                          const total = parseInt(count);
                          return (
                            <div key={count}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-purple-400 font-medium">{count}/Day</span>
                                <div className="flex gap-1">
                                  {Array.from({ length: total }).map((_, i) => (
                                    <button
                                      key={i}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const newUsed = i < used ? i : i + 1;
                                        onUpdate({ ...character, [usageKey]: newUsed });
                                      }}
                                      className={`w-4 h-4 rounded-full border transition-colors ${
                                        i < used
                                          ? 'bg-purple-600 border-purple-400'
                                          : 'bg-stone-800 border-stone-600 hover:border-purple-500'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onUpdate({ ...character, [usageKey]: 0 }); }}
                                  className="text-[10px] text-purple-400 hover:text-purple-300 px-1"
                                >
                                  Reset
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {spells.map((spell, i) => (
                                  <span key={i} className="bg-purple-900/30 text-purple-200 px-2 py-1 rounded text-xs italic">
                                    {spell}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Spell Slots with Tracking */}
                    {Object.keys(spellcastingInfo.slots).length > 0 && (
                      <div className="space-y-2">
                        {Object.entries(spellcastingInfo.slots).map(([level, data]) => {
                          const usageKey = `spellSlots${level}Used`;
                          const used = character[usageKey] || 0;
                          return (
                            <div key={level}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-purple-400 font-medium">{level} Level</span>
                                <div className="flex gap-1">
                                  {Array.from({ length: data.slots }).map((_, i) => (
                                    <button
                                      key={i}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const newUsed = i < used ? i : i + 1;
                                        onUpdate({ ...character, [usageKey]: newUsed });
                                      }}
                                      className={`w-4 h-4 rounded border transition-colors ${
                                        i < used
                                          ? 'bg-purple-600 border-purple-400'
                                          : 'bg-stone-800 border-stone-600 hover:border-purple-500'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-[10px] text-stone-500">{data.slots - used}/{data.slots}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onUpdate({ ...character, [usageKey]: 0 }); }}
                                  className="text-[10px] text-purple-400 hover:text-purple-300 px-1"
                                >
                                  Reset
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {data.spells.map((spell, i) => (
                                  <span key={i} className="bg-purple-900/30 text-purple-200 px-2 py-1 rounded text-xs italic">
                                    {spell}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Reset All Spell Slots */}
                    {(Object.keys(spellcastingInfo.slots).length > 0 || Object.keys(spellcastingInfo.perDay).length > 0) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const updates = { ...character };
                          Object.keys(spellcastingInfo.slots).forEach(level => {
                            updates[`spellSlots${level}Used`] = 0;
                          });
                          Object.keys(spellcastingInfo.perDay).forEach(count => {
                            updates[`perDay${count}Used`] = 0;
                          });
                          onUpdate(updates);
                        }}
                        className="text-xs text-purple-400 hover:text-purple-300 px-2 py-1 rounded hover:bg-purple-900/30 border border-purple-800/50"
                      >
                        Reset All Spell Slots
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Traits */}
              {character.traits?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">Traits</h3>
                  <div className="space-y-2">
                    {character.traits.map((trait, i) => (
                      <div key={i} className="bg-amber-950/20 border border-amber-900/30 rounded p-3">
                        <div className="text-sm">
                          <span className="text-amber-300 font-semibold italic">{trait.name}.</span>{' '}
                          <span className="text-stone-300">{trait.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {character.actions?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
                    <Icons.Sword /> Actions
                  </h3>
                  <div className="space-y-2">
                    {character.actions.map((action, i) => (
                      <div key={i} className="bg-red-950/20 border border-red-900/30 rounded p-3">
                        <div className="text-sm">
                          <span className="text-red-300 font-semibold italic">{action.name}.</span>{' '}
                          <span className="text-stone-300">{action.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bonus Actions */}
              {character.bonusActions?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-orange-400 mb-2">Bonus Actions</h3>
                  <div className="space-y-2">
                    {character.bonusActions.map((action, i) => (
                      <div key={i} className="bg-orange-950/20 border border-orange-900/30 rounded p-3">
                        <div className="text-sm">
                          <span className="text-orange-300 font-semibold italic">{action.name}.</span>{' '}
                          <span className="text-stone-300">{action.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reactions */}
              {character.reactions?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-cyan-400 mb-2">Reactions</h3>
                  <div className="space-y-2">
                    {character.reactions.map((reaction, i) => (
                      <div key={i} className="bg-cyan-950/20 border border-cyan-900/30 rounded p-3">
                        <div className="text-sm">
                          <span className="text-cyan-300 font-semibold italic">{reaction.name}.</span>{' '}
                          <span className="text-stone-300">{reaction.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Abilities from Notes */}
              {character.notes && (
                <div>
                  <h3 className="text-sm font-bold text-stone-400 mb-2">Notes</h3>
                  <div className="bg-stone-800/50 rounded p-3 text-sm text-stone-300 italic">
                    {character.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-700 flex justify-between items-center">
              <div className="text-xs text-stone-500">
                {character.senses && <span>Senses: {character.senses}</span>}
              </div>
              <button 
                onClick={() => setShowQuickActions(false)} 
                className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Popup Modal */}
      {showNotesPopup && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowNotesPopup(false)}>
          <div className="bg-stone-900 border border-amber-800/50 rounded-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-stone-700 bg-gradient-to-r from-amber-950/50 to-stone-900">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                  <Icons.Scroll className="w-5 h-5" /> Combat Notes
                </h2>
                <button onClick={() => setShowNotesPopup(false)} className="text-stone-400 hover:text-stone-200">
                  <Icons.X />
                </button>
              </div>
              <p className="text-xs text-stone-400 mt-1">{character.name} - Conditions, status effects, etc.</p>
            </div>
            <div className="p-4">
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Prone, Poisoned, Concentrating on spell, Hidden behind pillar..."
                className="w-full h-32 bg-stone-800 border border-stone-700 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-600 resize-none"
                autoFocus
              />
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs text-stone-500">Quick add:</span>
                {['Prone', 'Poisoned', 'Frightened', 'Stunned', 'Restrained', 'Blinded', 'Concentrating'].map(condition => (
                  <button
                    key={condition}
                    onClick={() => setNotesText(prev => prev ? `${prev}, ${condition}` : condition)}
                    className="text-xs px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-amber-400"
                  >
                    {condition}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-stone-700 flex justify-between">
              <button 
                onClick={() => { setNotesText(''); }}
                className="px-3 py-2 rounded-lg text-stone-400 hover:text-red-400 hover:bg-red-900/20 text-sm"
              >
                Clear
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowNotesPopup(false)}
                  className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => { onUpdate({ ...character, notes: notesText }); setShowNotesPopup(false); }}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterCard;
