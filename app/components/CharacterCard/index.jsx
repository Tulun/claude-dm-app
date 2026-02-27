'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icons from '../Icons';
import { EditableField, HpBar, Tooltip } from '../ui';
import InventoryDisplay from './InventoryDisplay';
import QuickActionsModal from './QuickActionsModal';
import QuickResourcesModal from './QuickResourcesModal';
import CharacterSheetModal from './CharacterSheetModal';
import NotesModal from './NotesModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import StatBlockModal from './StatBlockModal';
import { parseSpellcasting } from './spellcastingParser';
import { getMod, getModNum, getProfBonus, getSpellSaveDC, getSpellAttackBonus, getCalculatedAC } from './utils';

const CharacterCard = ({ character, isEnemy, onUpdate, onRemove, expanded, onToggleExpand, showResources }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showQuickResources, setShowQuickResources] = useState(false);
  const [showCharacterSheet, setShowCharacterSheet] = useState(false);
  const [showHpEditor, setShowHpEditor] = useState(false);
  const [hpDelta, setHpDelta] = useState('');
  const [showTempHpEditor, setShowTempHpEditor] = useState(false);
  const [tempHpDelta, setTempHpDelta] = useState('');
  const [showTempAcEditor, setShowTempAcEditor] = useState(false);
  const [tempAcDelta, setTempAcDelta] = useState('');
  const [showNotesPopup, setShowNotesPopup] = useState(false);
  const [showStatBlock, setShowStatBlock] = useState(false);
  
  const isDead = character.currentHp <= 0;
  const characterType = character.class ? 'party' : 'template';
  const tempHp = character.tempHp || 0;
  const tempAC = character.tempAC || 0;

  const profBonus = getProfBonus(character);
  const spellDC = getSpellSaveDC(character);
  const spellAttack = getSpellAttackBonus(character);
  const calculatedAC = getCalculatedAC(character);
  const baseAC = character.acOverride || calculatedAC || character.ac || 10;
  const displayAC = baseAC + (parseInt(tempAC) || 0);
  const spellcastingInfo = parseSpellcasting(character);
  const isNpc = character.isNpc;

  // Determine card colors - NPCs get teal, enemies get red, party gets emerald
  const cardColors = isDead 
    ? 'border-red-900/50 bg-stone-900/30 opacity-60' 
    : isEnemy 
      ? (isNpc 
          ? 'border-teal-800/50 bg-gradient-to-br from-teal-950/40 to-stone-900/60' 
          : 'border-red-800/50 bg-gradient-to-br from-red-950/40 to-stone-900/60')
      : 'border-emerald-800/50 bg-gradient-to-br from-emerald-950/40 to-stone-900/60';
  
  const iconBgColor = isEnemy ? (isNpc ? 'bg-teal-900/50' : 'bg-red-900/50') : 'bg-emerald-900/50';

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${cardColors}`}>
      <div className="p-3">
        {/* Top row: Icon, Name, and action buttons */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 flex-1">
            <div className={`p-2 rounded-lg ${iconBgColor}`}>
              {isEnemy ? <Icons.Skull /> : <Icons.Shield />}
            </div>
            <div>
              <h3 className={`font-bold text-lg ${isDead ? 'line-through text-stone-500' : ''}`}>{character.name}</h3>
              <p className="text-xs text-stone-400">
                {character.classes?.length > 0 
                  ? character.classes.map(c => `${c.name} ${c.level}`).join(' / ')
                  : character.class 
                    ? `${character.class} ${character.level || 1}` 
                    : character.cr ? `CR ${character.cr}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Stat Block Button - for enemies/NPCs */}
            {isEnemy && (
              <Tooltip text="View Stat Block">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowStatBlock(true); }}
                  className="p-2 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-amber-900/30 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path d="M4 6h16M4 10h16M4 14h10M4 18h7" />
                  </svg>
                </button>
              </Tooltip>
            )}
            {/* Character Sheet Button - for party members */}
            {!isEnemy && (
              <Tooltip text="Character Sheet">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowCharacterSheet(true); }}
                  className="p-2 rounded-lg text-stone-400 hover:text-emerald-300 hover:bg-emerald-900/30 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path d="M4 6h16M4 10h16M4 14h10M4 18h7" />
                  </svg>
                </button>
              </Tooltip>
            )}
            {/* Quick Resources Button - for party members */}
            {!isEnemy && ((character.resources?.length > 0) || (character.spellSlots && Object.keys(character.spellSlots).some(k => k.startsWith('level') && character.spellSlots[k]?.max > 0))) && (
              <Tooltip text="Quick Resources">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowQuickResources(true); }}
                  className="p-2 rounded-lg text-amber-400 hover:bg-amber-900/30 transition-colors"
                >
                  <Icons.Sparkles />
                </button>
              </Tooltip>
            )}
            {/* Notes Button */}
            {isEnemy && (
              <Tooltip text="Combat Notes">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowNotesPopup(true); }}
                  className={`p-2 rounded-lg transition-colors ${character.combatNotes ? 'text-amber-400 hover:bg-amber-900/30 bg-amber-900/20' : 'text-stone-500 hover:text-amber-400 hover:bg-amber-900/30'}`}
                >
                  <Icons.Scroll className="w-5 h-5" />
                </button>
              </Tooltip>
            )}
            {/* Quick Actions Button */}
            {isEnemy && (character.actions?.length > 0 || character.legendaryActions?.length > 0 || spellcastingInfo.found) && (
              <Tooltip text="Quick Actions">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowQuickActions(true); }}
                  className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${character.legendaryActions?.length > 0 ? 'text-purple-400 hover:bg-purple-900/30 bg-purple-900/20' : 'text-red-400 hover:bg-red-900/30'}`}
                >
                  <Icons.Sword />
                  {character.legendaryActions?.length > 0 && <span className="text-xs">★</span>}
                </button>
              </Tooltip>
            )}
            {isEnemy && onRemove && (
              <Tooltip text="Remove from Combat">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                  className="p-2 rounded-lg text-stone-500 hover:text-red-400 hover:bg-red-900/30 transition-colors"
                >
                  <Icons.Trash />
                </button>
              </Tooltip>
            )}
            {/* Expand/Collapse Arrow - only show if expand is available */}
            {onToggleExpand && (
              <Tooltip text={expanded ? "Collapse" : "Expand"}>
                <button 
                  onClick={onToggleExpand} 
                  className={`p-2 rounded-lg transition-colors ${isEnemy ? 'hover:bg-red-900/30' : 'hover:bg-emerald-900/30'}`}
                >
                  {expanded ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
                  )}
                </button>
              </Tooltip>
            )}
          </div>
        </div>
        
        {/* Stats row: AC, HP, Spell DC */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* AC Badge - Clickable to edit temp AC for enemies */}
          <div className="relative">
            {showTempAcEditor && isEnemy ? (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowTempAcEditor(false)} />
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm z-50 relative ${tempAC > 0 ? 'bg-amber-900/40' : 'bg-stone-800/60'}`}>
                  <Icons.Shield />
                  <span className="font-mono text-stone-400">{baseAC}</span>
                  <span className="text-amber-400">+</span>
                  <input
                    type="text"
                    value={tempAcDelta}
                    onChange={(e) => setTempAcDelta(e.target.value)}
                    onBlur={() => {
                      const num = parseInt(tempAcDelta);
                      onUpdate({ ...character, tempAC: isNaN(num) ? 0 : Math.max(0, num) });
                      setShowTempAcEditor(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const num = parseInt(tempAcDelta);
                        onUpdate({ ...character, tempAC: isNaN(num) ? 0 : Math.max(0, num) });
                        setShowTempAcEditor(false);
                      } else if (e.key === 'Escape') setShowTempAcEditor(false);
                    }}
                    className="w-8 text-center bg-stone-900 border border-amber-500 rounded px-1 py-0.5 font-mono focus:outline-none"
                    autoFocus
                    placeholder="0"
                  />
                  <span className="text-xs text-stone-500">AC</span>
                </div>
              </>
            ) : isEnemy ? (
              <button
                onClick={(e) => { e.stopPropagation(); setTempAcDelta(String(tempAC || '')); setShowTempAcEditor(true); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${tempAC > 0 ? 'bg-amber-900/30 text-amber-400 hover:bg-amber-900/40 ring-1 ring-amber-500/50' : character.acEffect ? 'bg-cyan-900/30 text-cyan-400 hover:bg-cyan-900/40' : 'bg-stone-800/60 text-stone-300 hover:bg-stone-700/60'}`}
                title="Click to add temp AC bonus"
              >
                <Icons.Shield />
                <span className="font-mono font-medium">{baseAC}</span>
                {tempAC > 0 && <span className="text-amber-400 font-mono">+{tempAC}</span>}
                <span className="text-xs text-stone-500">AC</span>
              </button>
            ) : (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${character.acEffect ? 'bg-cyan-900/30 text-cyan-400' : 'bg-stone-800/60 text-stone-300'}`}>
                <Icons.Shield />
                <span className="font-mono font-medium">{displayAC}</span>
                <span className="text-xs text-stone-500">AC</span>
              </div>
            )}
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
                      if (!isNaN(num) && num >= 0) onUpdate({ ...character, currentHp: num });
                      setShowHpEditor(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const num = parseInt(hpDelta);
                        if (!isNaN(num) && num >= 0) onUpdate({ ...character, currentHp: num });
                        setShowHpEditor(false);
                      } else if (e.key === 'Escape') setShowHpEditor(false);
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${isDead ? 'bg-red-900/40 text-red-400 hover:bg-red-900/50' : tempHp > 0 ? 'bg-stone-800/60 text-stone-300 hover:bg-stone-700/60 ring-1 ring-cyan-500/50' : 'bg-stone-800/60 text-stone-300 hover:bg-stone-700/60'}`}
                title="Click to edit HP"
              >
                <Icons.Heart />
                <span className={`font-mono font-medium ${isDead ? 'text-red-400' : ''}`}>{character.currentHp}</span>
                {tempHp > 0 && <span className="text-cyan-400 font-mono">+{tempHp}</span>}
                <span className="text-stone-500">/</span>
                <span className="font-mono text-stone-400">{character.maxHp}</span>
                <span className="text-xs text-stone-500">HP</span>
              </button>
            )}
          </div>
          {/* Temp HP Badge */}
          <div className="relative">
            {showTempHpEditor ? (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowTempHpEditor(false)} />
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm bg-cyan-900/40 z-50 relative">
                  <Icons.Shield className="w-4 h-4 text-cyan-400" />
                  <input
                    type="text"
                    value={tempHpDelta}
                    onChange={(e) => setTempHpDelta(e.target.value)}
                    onBlur={() => {
                      const num = parseInt(tempHpDelta);
                      if (!isNaN(num) && num >= 0) onUpdate({ ...character, tempHp: num });
                      setShowTempHpEditor(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const num = parseInt(tempHpDelta);
                        if (!isNaN(num) && num >= 0) onUpdate({ ...character, tempHp: num });
                        setShowTempHpEditor(false);
                      } else if (e.key === 'Escape') setShowTempHpEditor(false);
                    }}
                    className="w-10 text-center bg-stone-900 border border-cyan-500 rounded px-1 py-0.5 font-mono text-cyan-400 focus:outline-none"
                    autoFocus
                    placeholder="0"
                  />
                  <span className="text-xs text-cyan-500">THP</span>
                </div>
              </>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setTempHpDelta(String(tempHp)); setShowTempHpEditor(true); }}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${tempHp > 0 ? 'bg-cyan-900/40 text-cyan-400 hover:bg-cyan-900/50' : 'bg-stone-800/40 text-stone-500 hover:bg-stone-700/40 hover:text-cyan-400'}`}
                title="Click to add/edit Temporary HP"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M12 8v4M10 10h4" />
                </svg>
                {tempHp > 0 ? (
                  <span className="font-mono font-medium">{tempHp}</span>
                ) : (
                  <span className="text-xs">+THP</span>
                )}
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
          {/* Combat Notes indicator */}
          {isEnemy && character.combatNotes && (
            <div 
              onClick={(e) => { e.stopPropagation(); setShowNotesPopup(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-amber-900/30 text-amber-400 cursor-pointer hover:bg-amber-900/40"
            >
              <Icons.Scroll className="w-4 h-4" />
              <span className="text-xs max-w-[100px] truncate">{character.combatNotes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick stats bar - collapsed */}
      {!expanded && (
        <div className="px-3 pb-2 grid grid-cols-6 gap-1 text-center border-t border-stone-700/30 pt-2">
          {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(label => {
            const key = label.toLowerCase();
            return (
              <div key={label} className="bg-stone-800/50 rounded p-1">
                <div className="text-[10px] text-stone-500">{label}</div>
                <div className="text-sm font-bold">{character[key] || 10}</div>
                <div className="text-xs text-stone-400">{getMod(character[key])}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick actions preview - collapsed */}
      {!expanded && character.actions?.length > 0 && (
        <div className="px-3 pb-3 text-xs">
          <div className="flex flex-wrap gap-1.5">
            {character.actions.map((action, i) => (
              <button 
                key={i} 
                onClick={(e) => { e.stopPropagation(); setShowQuickActions(true); }} 
                className="bg-red-900/30 text-red-300 px-2 py-1 rounded cursor-pointer hover:bg-red-800/40 transition-colors"
                title={action.description}
              >
                {action.name}
              </button>
            ))}
            {spellcastingInfo.found && (
              <button 
                onClick={(e) => { e.stopPropagation(); setShowQuickActions(true); }} 
                className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded cursor-pointer hover:bg-purple-800/40 transition-colors flex items-center gap-1"
                title={`Spellcasting: ${spellcastingInfo.spellList?.slice(0, 100) || 'Click to view spells'}${spellcastingInfo.spellList?.length > 100 ? '...' : ''}`}
              >
                <Icons.Sparkles /> Spells
              </button>
            )}
          </div>
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-stone-700/50">
          <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
          <div>
            <label className="text-xs text-stone-400 mb-2 block">Hit Points</label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <HpBar current={character.currentHp} max={character.maxHp} onChange={(curr, max) => onUpdate({ ...character, currentHp: curr, maxHp: max })} />
              </div>
              <div className="flex flex-col items-center gap-1">
                <label className="text-[10px] text-cyan-400">Temp HP</label>
                <input
                  type="number"
                  min="0"
                  value={tempHp || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    onUpdate({ ...character, tempHp: isNaN(val) ? 0 : Math.max(0, val) });
                  }}
                  placeholder="0"
                  className="w-14 bg-cyan-900/30 border border-cyan-700/50 rounded px-2 py-1 text-center text-sm font-mono text-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>
          
          {/* Stat block */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="text-xs text-stone-400">Name</label>
              <div className="bg-stone-800/30 rounded px-2 py-1">{character.name}</div>
            </div>
            <div>
              <label className="text-xs text-stone-400">AC</label>
              <div className="flex items-center gap-2">
                <div className={`bg-stone-700/50 rounded px-2 py-1 font-mono flex-1 ${tempAC > 0 ? 'text-amber-400' : character.acEffect ? 'text-cyan-400' : ''}`}>
                  {baseAC}{tempAC > 0 && <span className="text-amber-400"> +{tempAC}</span>}
                </div>
                <div className="flex flex-col items-center">
                  <label className="text-[10px] text-amber-400">+AC</label>
                  <input
                    type="number"
                    min="0"
                    value={character.tempAC || ''}
                    onChange={(e) => onUpdate({ ...character, tempAC: e.target.value })}
                    placeholder="0"
                    className="w-12 bg-amber-900/30 border border-amber-700/50 rounded px-1 py-1 text-center text-sm font-mono text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    title="Temporary AC bonus (Shield, Cover, etc.)"
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
              </div>
            </div>
          </div>

          {/* Ability scores */}
          <div className="grid grid-cols-6 gap-2 text-center">
            {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(label => {
              const key = label.toLowerCase();
              return (
                <div key={label} className="bg-stone-800/50 rounded p-2">
                  <div className="text-[10px] text-stone-500">{label}</div>
                  <div className="font-bold">{character[key] || 10}</div>
                  <div className="text-xs text-stone-400">{getMod(character[key])}</div>
                </div>
              );
            })}
          </div>
          
          {/* Saving Throws */}
          <div>
            <label className="text-xs text-stone-400 mb-2 block">Saving Throws</label>
            <div className="grid grid-cols-6 gap-2 text-center">
              {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(label => {
                const key = label.toLowerCase();
                const baseMod = getModNum(character[key]);
                const hasSaveProf = character.savingThrows?.toLowerCase().includes(label.toLowerCase());
                const totalMod = hasSaveProf ? baseMod + profBonus : baseMod;
                return (
                  <div key={label} className={`rounded p-1.5 ${hasSaveProf ? 'bg-amber-900/30 border border-amber-800/50' : 'bg-stone-800/50'}`}>
                    <div className="text-[10px] text-stone-500">{label}</div>
                    <div className={`font-bold ${hasSaveProf ? 'text-amber-400' : ''}`}>{totalMod >= 0 ? '+' : ''}{totalMod}</div>
                    {hasSaveProf && <div className="text-[9px] text-amber-600">{profBonus}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Defenses */}
          {(character.vulnerabilities || character.resistances || character.immunities) && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              {character.vulnerabilities && <div className="bg-yellow-900/20 rounded p-2"><span className="text-yellow-400 font-medium">Vulnerable:</span> <span className="text-stone-300">{character.vulnerabilities}</span></div>}
              {character.resistances && <div className="bg-blue-900/20 rounded p-2"><span className="text-blue-400 font-medium">Resistant:</span> <span className="text-stone-300">{character.resistances}</span></div>}
              {character.immunities && <div className="bg-green-900/20 rounded p-2"><span className="text-green-400 font-medium">Immune:</span> <span className="text-stone-300">{character.immunities}</span></div>}
            </div>
          )}

          {/* Senses & Languages */}
          {(character.senses || character.languages) && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              {character.senses && <div><span className="text-stone-400">Senses:</span> <span className="text-stone-300">{character.senses}</span></div>}
              {character.languages && <div><span className="text-stone-400">Languages:</span> <span className="text-stone-300">{character.languages}</span></div>}
            </div>
          )}

          {/* Spellcasting */}
          {spellDC && (
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm bg-purple-900/20 rounded-lg p-3">
                <div className="text-center">
                  <label className="text-xs text-stone-400">Spellcasting</label>
                  <div className="font-mono text-purple-400 text-sm uppercase">{character.spellStat}</div>
                </div>
                <div className="text-center">
                  <label className="text-xs text-stone-400">Spell DC</label>
                  <div className={`font-mono text-lg ${character.innateSorcery ? 'text-purple-300' : 'text-purple-400'}`}>
                    {spellDC}
                    {character.innateSorcery && <span className="text-xs text-purple-300 ml-1">+1</span>}
                  </div>
                </div>
                <div className="text-center">
                  <label className="text-xs text-stone-400">Spell Atk</label>
                  <div className="font-mono text-purple-400 text-lg">{spellAttack}</div>
                </div>
              </div>
              {/* Innate Sorcery Toggle - for Sorcerers */}
              {(character.classes?.some(c => c.name?.toLowerCase() === 'sorcerer') || character.class?.toLowerCase() === 'sorcerer') && (
                <button
                  onClick={(e) => { e.stopPropagation(); onUpdate({ ...character, innateSorcery: !character.innateSorcery }); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${character.innateSorcery ? 'bg-purple-700/50 border border-purple-500/50' : 'bg-stone-800/50 border border-stone-700/50 hover:border-purple-500/30'}`}
                >
                  <div className="flex items-center gap-2">
                    <Icons.Sparkles />
                    <span className={`text-sm ${character.innateSorcery ? 'text-purple-300' : 'text-stone-400'}`}>Innate Sorcery</span>
                    <span className="text-xs text-stone-500">(+1 DC)</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors relative ${character.innateSorcery ? 'bg-purple-600' : 'bg-stone-700'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${character.innateSorcery ? 'left-5' : 'left-0.5'}`} />
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Resources */}
          {showResources && (character.resources || []).length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-stone-400 flex items-center gap-1"><Icons.Sparkles /> Resources</label>
              {character.resources.map((r, i) => (
                <div key={i} className="bg-stone-800/50 rounded px-2 py-1.5 flex items-center justify-between">
                  <span className="text-stone-300 text-sm">{r.name}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); const updated = [...character.resources]; updated[i] = { ...r, current: Math.max(0, r.current - 1) }; onUpdate({ ...character, resources: updated }); }} className="w-6 h-6 rounded bg-stone-700 hover:bg-stone-600 text-stone-300 flex items-center justify-center text-sm">−</button>
                    <span className="font-mono text-amber-400 w-12 text-center">{r.current}/{r.max}</span>
                    <button onClick={(e) => { e.stopPropagation(); const updated = [...character.resources]; updated[i] = { ...r, current: Math.min(r.max, r.current + 1) }; onUpdate({ ...character, resources: updated }); }} className="w-6 h-6 rounded bg-stone-700 hover:bg-stone-600 text-stone-300 flex items-center justify-center text-sm">+</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Inventory */}
          {showResources && (character.inventory || []).length > 0 && (
            <InventoryDisplay items={character.inventory} character={character} getModNum={(s) => getModNum(s)} getProfBonus={() => profBonus} />
          )}

          {/* Traits */}
          {(character.traits || []).length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-amber-400 font-bold">Traits</label>
              {character.traits.map((trait, i) => (
                <div key={i} className="text-xs bg-stone-800/30 rounded p-2">
                  <span className="text-amber-300 font-semibold italic">{trait.name}.</span> <span className="text-stone-300">{trait.description}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Actions */}
          {(character.actions || []).length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-red-400 font-bold flex items-center gap-1"><Icons.Sword /> Actions</label>
              {character.actions.map((action, i) => (
                <div key={i} className="text-xs bg-red-950/30 border border-red-900/30 rounded p-2">
                  <span className="text-red-300 font-semibold italic">{action.name}.</span> <span className="text-stone-300">{action.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* Reactions */}
          {(character.reactions || []).length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-cyan-400 font-bold">Reactions</label>
              {character.reactions.map((r, i) => (
                <div key={i} className="text-xs bg-cyan-950/30 border border-cyan-900/30 rounded p-2">
                  <span className="text-cyan-300 font-semibold italic">{r.name}.</span> <span className="text-stone-300">{r.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* Legendary Actions */}
          {(character.legendaryActions || []).length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-purple-400 font-bold">★ Legendary Actions</label>
              {character.legendaryActions.map((a, i) => (
                <div key={i} className="text-xs bg-purple-950/30 border border-purple-900/30 rounded p-2">
                  <span className="text-purple-300 font-semibold italic">{a.name}.</span> <span className="text-stone-300">{a.description}</span>
                </div>
              ))}
            </div>
          )}
          </div>
          
          {/* Footer - outside scrollable area */}
          <div className="flex justify-between items-center p-4 pt-2 border-t border-stone-700/30">
            {isEnemy ? (
              <button onClick={() => setShowQuickActions(true)} className="flex items-center gap-1 px-3 py-1 rounded text-sm bg-red-900/30 hover:bg-red-800/50 text-red-400">
                <Icons.Sword /> Actions & Spells
              </button>
            ) : (
              <Link href={`/character?id=${character.id}&type=${characterType}`} className="flex items-center gap-1 px-3 py-1 rounded text-sm bg-amber-900/30 hover:bg-amber-800/50 text-amber-400">
                <Icons.Edit /> Full Page
              </Link>
            )}
            <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1 px-3 py-1 rounded text-sm bg-red-900/30 hover:bg-red-800/50 text-red-400">
              <Icons.Trash />{isEnemy ? 'Kill' : 'Remove'}
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <DeleteConfirmModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} character={character} isEnemy={isEnemy} onRemove={onRemove} />
      <QuickActionsModal isOpen={showQuickActions} onClose={() => setShowQuickActions(false)} character={character} onUpdate={onUpdate} displayAC={displayAC} spellcastingInfo={spellcastingInfo} />
      <QuickResourcesModal isOpen={showQuickResources} onClose={() => setShowQuickResources(false)} character={character} onUpdate={onUpdate} />
      <CharacterSheetModal isOpen={showCharacterSheet} onClose={() => setShowCharacterSheet(false)} character={character} />
      <NotesModal isOpen={showNotesPopup} onClose={() => setShowNotesPopup(false)} character={character} onUpdate={onUpdate} />
      <StatBlockModal isOpen={showStatBlock} onClose={() => setShowStatBlock(false)} character={character} />
    </div>
  );
};

export default CharacterCard;
