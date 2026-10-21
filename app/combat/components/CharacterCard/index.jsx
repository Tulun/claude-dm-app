'use client';

import React from 'react';
import { useState } from 'react';
import Icons from '../../../components/Icons';
import { parseSpellcasting } from './spellcastingParser';
import CardActionMenu from './CardActionMenu';
import CardModals from './CardModals';
import InitChip from './InitChip';
import ConditionChips from '../ConditionChips';
import PartyGlance from './PartyGlance';
import EnemyGlance from './EnemyGlance';
import { abilityLabel, parseSavingThrows } from '../../monsterAbilities';
import { applyDamage, applyHealing } from '../../hp';
import { getSaveBonus } from '../../../character/components/constants';
import { formatMod } from '../../../utils/rules';
import { getMod, getModNum, getProfBonus, getSpellSaveDC, getSpellAttackBonus, formatClassList, getActiveWildShapeForm, getCardBaseAC, getCardDisplayAC } from './utils';

const CharacterCard = ({ character, isEnemy, onUpdate, onRemove, onDuplicate, onInspect, onUpdateInitiative, onToggleOwnInit, initFamilySize = 1, initSharedWith = 0, showResources, templates = [], stretch = false }) => {
  // One modal open at a time — a single key replaces the old 10 showX booleans
  const [activeModal, setActiveModal] = useState(null);
  const closeModal = () => setActiveModal(null);
  const [showHpEditor, setShowHpEditor] = useState(false);
  const [hpDelta, setHpDelta] = useState('');
  const [tempHpDelta, setTempHpDelta] = useState('');
  const [hpAmount, setHpAmount] = useState('');
  const [showTempAcEditor, setShowTempAcEditor] = useState(false);
  const [tempAcDelta, setTempAcDelta] = useState('');
  
  const isDead = character.currentHp <= 0;

  // Combined HP / THP editor commit — only fields that parse to a value
  // >= 0 apply, and nothing is sent when neither changed
  const commitHpEditor = () => {
    const hp = parseInt(hpDelta);
    const thp = parseInt(tempHpDelta);
    const next = { ...character };
    if (!isNaN(hp) && hp >= 0) next.currentHp = hp;
    if (!isNaN(thp) && thp >= 0) next.tempHp = thp;
    if (next.currentHp !== character.currentHp || (next.tempHp || 0) !== (character.tempHp || 0)) onUpdate(next);
    setShowHpEditor(false);
  };
  // Damage / Heal row: one amount, the 5e bookkeeping (THP first) is done
  // for you. Works off the stored values, not the HP/THP fields above it.
  const applyHpAmount = (fn) => {
    const next = fn(character, hpAmount);
    if (next !== character) onUpdate(next);
    setShowHpEditor(false);
  };
  const hpEditorKeyDown = (e) => {
    if (e.key === 'Enter') commitHpEditor();
    else if (e.key === 'Escape') setShowHpEditor(false);
  };
  const characterType = character.class ? 'party' : 'template';
  const tempHp = character.tempHp || 0;
  const tempAC = character.tempAC || 0;

  const profBonus = getProfBonus(character);
  const spellDC = getSpellSaveDC(character);
  const spellAttack = getSpellAttackBonus(character);
  const baseAC = getCardBaseAC(character);
  // Wild shape replaces AC entirely; otherwise temp AC is added at display time
  const activeWildShapeForm = getActiveWildShapeForm(character);
  const displayAC = getCardDisplayAC(character);
  const isWildShapeAC = !!activeWildShapeForm;
  
  const spellcastingInfo = parseSpellcasting(character);
  const enemySaves = isEnemy ? parseSavingThrows(character.savingThrows) : null;
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

  // `stretch` (party grid only): the card fills its grid row and the collapsed
  // stat bar anchors to the bottom (mt-auto), so side-by-side cards line up
  // even when one lacks a badge row. NEVER apply h-full unconditionally — in
  // the enemies column the grid cell has a resolved height, so h-full blew the
  // first card up to the full column height.
  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${stretch ? 'h-full flex flex-col' : ''} ${cardColors}`}>
      <div className="p-3">
        {/* Top row: Icon, Name, and action buttons */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 flex-1">
            <div className={`p-2 rounded-lg ${iconBgColor}`}>
              {isEnemy ? <Icons.Skull /> : <Icons.Shield />}
            </div>
            <div>
              <h3 className={`font-bold text-lg ${isDead ? 'line-through text-stone-500' : ''}`}>
                {/* The name opens the page's detail drawer (party and
                    enemies alike); the sheet / stat block stay in the ⋯ menu
                    and icon row. Plain text where there's no drawer. */}
                {onInspect ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onInspect(character.id); }}
                    className={`text-left transition-colors ${isEnemy ? 'hover:text-red-300' : 'hover:text-emerald-300'}`}
                    title="Show full details"
                    aria-label={`Details for ${character.name}`}
                  >
                    {character.name}
                  </button>
                ) : character.name}
                {activeWildShapeForm && (
                  <span className="ml-2 text-sm font-normal text-lime-400">
                    🐾 {activeWildShapeForm.name}
                  </span>
                )}
                {/* Active Innate Sorcery lost its lit header icon to the menu,
                    so flag it beside the name */}
                {!isEnemy && character.innateSorcery && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveModal('sorcerer'); }}
                    className="ml-2 align-middle text-purple-400 hover:text-purple-300"
                    title="Innate Sorcery active"
                    aria-label="Innate Sorcery active"
                  >
                    <Icons.Flame className="w-4 h-4 inline" />
                  </button>
                )}
              </h3>
              <p className="text-xs text-stone-400">
                {isEnemy
                  ? [[character.size, character.creatureType].filter(Boolean).join(' '), character.cr != null && character.cr !== '' && `CR ${character.cr}`].filter(Boolean).join(' · ')
                  : formatClassList(character)}
              </p>
            </div>
          </div>
          {/* p-1.5 (vs the buttons' default p-2) keeps names from wrapping in
              the 3-column card grid */}
          <div className="flex items-center gap-0.5 [&_button]:p-1.5 [&_a]:p-1.5">
            {/* Party and enemies share the ⋯ menu (the old enemy icon row
                wrapped long monster names) */}
            <CardActionMenu
              character={character}
              isEnemy={isEnemy}
              spellcastingInfo={spellcastingInfo}
              onOpen={setActiveModal}
              editHref={isEnemy ? undefined : `/character?id=${character.id}&type=${characterType}`}
              onInspect={onInspect}
              onDuplicate={isEnemy ? onDuplicate : undefined}
              ownInit={!!character.ownInit}
              onToggleOwnInit={isEnemy && initFamilySize > 1 ? onToggleOwnInit : undefined}
              onRemove={isEnemy ? onRemove : undefined}
            />
          </div>
        </div>
        
        {/* Stats row: Init, AC, HP, Spell DC */}
        <div className="flex items-center gap-2 flex-wrap">
          {onUpdateInitiative && <InitChip character={character} onUpdateInitiative={onUpdateInitiative} sharedWith={initSharedWith} />}
          {/* AC Badge - Clickable to edit temp AC */}
          <div className="relative">
            {showTempAcEditor ? (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowTempAcEditor(false)} />
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm z-50 relative ${tempAC > 0 ? 'bg-amber-900/40' : 'bg-stone-800/60'}`}>
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
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); if (!isWildShapeAC) { setTempAcDelta(String(tempAC || '')); setShowTempAcEditor(true); } }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isWildShapeAC 
                    ? 'bg-lime-900/40 text-lime-400 cursor-default' 
                    : tempAC > 0 
                      ? 'bg-amber-900/40 text-amber-400 hover:bg-amber-900/50 shadow-[0_0_10px_rgba(251,191,36,0.4)] cursor-pointer' 
                      : character.acEffect 
                        ? 'bg-cyan-900/30 text-cyan-400 hover:bg-cyan-900/40 cursor-pointer' 
                        : 'bg-stone-800/60 text-stone-300 hover:bg-stone-700/60 cursor-pointer'
                }`}
                title={isWildShapeAC ? `Wild Shape: ${activeWildShapeForm?.name} AC` : tempAC > 0 ? `Base ${baseAC} + ${tempAC} temp bonus` : "Click to add temp AC bonus"}
              >
                <span className="font-mono font-medium">{displayAC}</span>
                <span className={`text-xs ${isWildShapeAC ? 'text-lime-500' : 'text-stone-500'}`}>{isWildShapeAC ? '🐾' : 'AC'}</span>
              </button>
            )}
          </div>
          {/* HP pill — shows temp HP inline. Click opens the editor: a
              Damage / Heal amount (focused; Enter = Damage; damage drains THP
              first) plus direct HP and THP fields. In the HP/THP fields Enter
              or clicking away commits, Escape cancels; no commit-on-blur, so
              Tab moves between fields. Each field keeps the Table view's rule:
              blank/invalid/negative is ignored (type 0 to clear THP). */}
          <div className="relative">
            {showHpEditor ? (
              <>
                <div className="fixed inset-0 z-40" onClick={commitHpEditor} />
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm z-50 relative ${isDead ? 'bg-red-900/40' : 'bg-stone-800/60'}`}>
                  <Icons.Heart />
                  <input
                    type="text"
                    aria-label={`Current HP for ${character.name}`}
                    value={hpDelta}
                    onChange={(e) => setHpDelta(e.target.value)}
                    onKeyDown={hpEditorKeyDown}
                    onFocus={(e) => e.target.select()}
                    className="w-12 text-center bg-stone-900 border border-amber-500 rounded px-1 py-0.5 font-mono focus:outline-none"
                  />
                  <span className="text-stone-500">/</span>
                  <span className="font-mono text-stone-400">{character.maxHp}</span>
                  <span className="text-cyan-400 ml-1">+</span>
                  <input
                    type="text"
                    aria-label={`Temp HP for ${character.name}`}
                    value={tempHpDelta}
                    onChange={(e) => setTempHpDelta(e.target.value)}
                    onKeyDown={hpEditorKeyDown}
                    onFocus={(e) => e.target.select()}
                    className="w-10 text-center bg-stone-900 border border-cyan-600 rounded px-1 py-0.5 font-mono text-cyan-400 focus:outline-none"
                    placeholder="0"
                  />
                  <span className="text-xs text-cyan-500">THP</span>
                  <div className="absolute left-0 top-full mt-1 flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-stone-900 border border-stone-700 shadow-xl">
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label={`Damage or healing for ${character.name}`}
                      value={hpAmount}
                      onChange={(e) => setHpAmount(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') applyHpAmount(applyDamage);
                        else if (e.key === 'Escape') setShowHpEditor(false);
                      }}
                      className="w-12 text-center bg-stone-950 border border-stone-500 rounded px-1 py-0.5 font-mono focus:outline-none focus:border-amber-500"
                      placeholder="amt"
                      autoFocus
                    />
                    <button
                      onClick={() => applyHpAmount(applyDamage)}
                      className="px-2 py-0.5 rounded bg-red-800 hover:bg-red-700 text-white text-xs font-medium"
                      title={tempHp > 0 ? 'Temp HP absorbs damage first (Enter)' : 'Apply damage (Enter)'}
                    >
                      Damage
                    </button>
                    <button
                      onClick={() => applyHpAmount(applyHealing)}
                      className="px-2 py-0.5 rounded bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-medium"
                      title="Heal (up to max HP)"
                    >
                      Heal
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setHpDelta(String(character.currentHp)); setTempHpDelta(String(tempHp)); setHpAmount(''); setShowHpEditor(true); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${isDead ? 'bg-red-900/40 text-red-400 hover:bg-red-900/50' : tempHp > 0 ? 'bg-stone-800/60 text-stone-300 hover:bg-stone-700/60 ring-1 ring-cyan-500/50' : 'bg-stone-800/60 text-stone-300 hover:bg-stone-700/60'}`}
                title={tempHp > 0 ? `${tempHp} temp HP — click to edit HP / THP` : 'Click to edit HP / temp HP'}
                aria-label={`HP for ${character.name}`}
              >
                <Icons.Heart />
                <span className={`font-mono font-medium ${isDead ? 'text-red-400' : ''}`}>{character.currentHp}</span>
                {tempHp > 0 && <span className="text-cyan-400 font-mono" data-testid="temp-hp">+{tempHp}</span>}
                <span className="text-stone-500">/</span>
                <span className="font-mono text-stone-400">{character.maxHp}</span>
                <span className="text-xs text-stone-500">HP</span>
              </button>
            )}
          </div>
          {/* Monster spellcasting DC (parsed from the stat block) — opens Quick
              Actions, where its spells and slots live */}
          {isEnemy && !spellDC && spellcastingInfo.dc && (
            <button
              onClick={(e) => { e.stopPropagation(); setActiveModal('actions'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-purple-900/30 text-purple-400 hover:bg-purple-900/50 transition-colors"
              title={`Spellcasting${spellcastingInfo.attack ? ` · ${spellcastingInfo.attack} to hit` : ''} — open spells`}
            >
              <span className="font-mono font-medium">{spellcastingInfo.dc}</span>
              <span className="text-xs text-purple-500">DC</span>
            </button>
          )}
          {/* Spell DC — opens the spellbook when there is one */}
          {spellDC && (!isEnemy && character.spells?.length > 0 ? (
            <button
              onClick={(e) => { e.stopPropagation(); setActiveModal('spells'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-purple-900/30 text-purple-400 hover:bg-purple-900/50 transition-colors"
              title="Open spellbook"
            >
              <span className="font-mono font-medium">{spellDC}</span>
              <span className="text-xs text-purple-500">DC</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-purple-900/30 text-purple-400">
              <span className="font-mono font-medium">{spellDC}</span>
              <span className="text-xs text-purple-500">DC</span>
            </div>
          ))}
          {/* Combat Notes indicator */}
          {character.combatNotes && (
            <div 
              onClick={(e) => { e.stopPropagation(); setActiveModal('notes'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-amber-900/30 text-amber-400 cursor-pointer hover:bg-amber-900/40"
            >
              <Icons.Scroll className="w-4 h-4" />
              <span className="text-xs max-w-[100px] truncate">{character.combatNotes}</span>
            </div>
          )}
        </div>
        {/* Conditions: one-click remove, "+" opens the picker */}
        <div className="mt-2">
          <ConditionChips character={character} onUpdate={onUpdate} onOpen={setActiveModal} />
        </div>
        {/* Party: resource pips + passives / speed / advantages */}
        {!isEnemy && showResources && (
          <PartyGlance character={character} wildShapeForm={activeWildShapeForm} onUpdate={onUpdate} onOpen={setActiveModal} />
        )}
        {/* Enemies: limited-use pips + senses / speed / defenses */}
        {isEnemy && (
          <EnemyGlance character={character} spellcastingInfo={spellcastingInfo} onUpdate={onUpdate} />
        )}
      </div>

      {/* Quick stats bar (mt-auto pins it to the card bottom when the card
          is stretched in the party grid) */}
      {(
        <div className="mt-auto px-3 pb-2 grid grid-cols-6 gap-1 text-center border-t border-stone-700/30 pt-2">
          {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(label => {
            const key = label.toLowerCase();
            
            // Use beast stats for STR/DEX/CON when wild shaped
            const usesBeastStat = activeWildShapeForm && ['str', 'dex', 'con'].includes(key);
            const statValue = usesBeastStat ? (activeWildShapeForm[key] || 10) : (character[key] || 10);
            const scoreClass = usesBeastStat ? 'text-lime-500' : 'text-stone-500';

            // Enemies: same layout as party; saves come from the stat
            // block's "Saving Throws" line (unlisted = plain modifier). A
            // listed save above the modifier is a proficient one (some
            // stat blocks list all six).
            if (isEnemy) {
              const mod = getModNum(statValue);
              const listed = enemySaves[key];
              const save = listed ?? mod;
              const prof = listed != null && listed > mod;
              return (
                <div
                  key={label}
                  className={`rounded p-1 bg-stone-800/50 ${prof ? 'ring-1 ring-amber-600/50' : ''}`}
                  title={`${label} ${statValue} · save ${formatMod(save)}${prof ? ' (proficient)' : ''}`}
                  data-testid={`ability-${key}`}
                >
                  <div className="text-[10px] text-stone-500">{label} <span className="font-mono text-stone-500">{statValue}</span></div>
                  <div className="text-base font-bold leading-tight">{getMod(statValue)}</div>
                  <div className={`text-[10px] ${prof ? 'text-amber-400 font-semibold' : 'text-stone-500'}`} data-testid={`save-${key}`}>
                    save {formatMod(save)}
                  </div>
                </div>
              );
            }

            // Party: the modifier leads (it's what gets rolled), the score is
            // small beside the label, and the save line marks proficiency.
            // Wild shape keeps the druid's save proficiencies on beast scores.
            const saveProf = (character.saveProficiencies?.[key] || 0) >= 1;
            const save = getSaveBonus({ ...character, [key]: statValue }, key);
            return (
              <div
                key={label}
                className={`rounded p-1 ${usesBeastStat ? 'bg-lime-900/50' : 'bg-stone-800/50'} ${saveProf ? 'ring-1 ring-emerald-600/50' : ''}`}
                title={`${label} ${statValue} · save ${formatMod(save)}${saveProf ? ' (proficient)' : ''}`}
                data-testid={`ability-${key}`}
              >
                <div className="text-[10px] text-stone-500">{label} <span className={`font-mono ${scoreClass}`}>{statValue}</span></div>
                <div className={`text-base font-bold leading-tight ${usesBeastStat ? 'text-lime-400' : ''}`}>{getMod(statValue)}</div>
                <div className={`text-[10px] ${saveProf ? 'text-emerald-400 font-semibold' : 'text-stone-500'}`} data-testid={`save-${key}`}>
                  save {formatMod(save)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick actions preview */}
      {character.actions?.length > 0 && (
        <div className="px-3 pb-3 text-xs">
          <div className="flex flex-wrap gap-1.5">
            {character.actions.map((action, i) => (
              <button 
                key={i} 
                onClick={(e) => { e.stopPropagation(); setActiveModal('actions'); }} 
                className="bg-red-900/30 text-red-300 px-2 py-1 rounded cursor-pointer hover:bg-red-800/40 transition-colors"
                title={action.description}
              >
                {abilityLabel(action.name)}
              </button>
            ))}
            {spellcastingInfo.found && (
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveModal('actions'); }} 
                className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded cursor-pointer hover:bg-purple-800/40 transition-colors flex items-center gap-1"
                title={`Spellcasting: ${spellcastingInfo.spellList?.slice(0, 100) || 'Click to view spells'}${spellcastingInfo.spellList?.length > 100 ? '...' : ''}`}
              >
                <Icons.Sparkles /> Spells
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <CardModals
        activeModal={activeModal}
        onClose={closeModal}
        character={character}
        isEnemy={isEnemy}
        onUpdate={onUpdate}
        onRemove={onRemove}
        templates={templates}
        displayAC={displayAC}
        spellcastingInfo={spellcastingInfo}
      />
    </div>
  );
};

export default React.memo(CharacterCard);
