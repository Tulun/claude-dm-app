'use client';

import { useState } from 'react';
import Icons from '../../../components/Icons';
import SpellPickerModal from '../SpellPickerModal';

// Classes that prepare spells (vs known spells)
const PREPARED_CASTER_CLASSES = ['Cleric', 'Druid', 'Paladin', 'Wizard'];

// Check if character is a prepared caster and get their caster class info
function getPreparedCasterInfo(character) {
  const classes = [];
  if (character.classes) {
    character.classes.forEach(c => classes.push({ name: c.name, level: c.level }));
  } else if (character.class) {
    classes.push({ name: character.class, level: character.level || 1 });
  }
  
  const preparedClass = classes.find(c => PREPARED_CASTER_CLASSES.includes(c.name));
  if (!preparedClass) return null;
  
  return preparedClass;
}

// Calculate max prepared spells
// Druid/Cleric: Level + WIS mod (min 1)
// Paladin: Half level (rounded down) + CHA mod (min 1)
// Wizard: Level + INT mod (min 1)
function calculateMaxPrepared(character, casterInfo) {
  if (!casterInfo) return null;
  
  const getMod = (score) => Math.floor(((parseInt(score) || 10) - 10) / 2);
  const level = parseInt(casterInfo.level) || 1;
  
  let maxPrepared = 0;
  
  switch (casterInfo.name) {
    case 'Druid':
    case 'Cleric':
      maxPrepared = level + getMod(character.wis);
      break;
    case 'Paladin':
      maxPrepared = Math.floor(level / 2) + getMod(character.cha);
      break;
    case 'Wizard':
      maxPrepared = level + getMod(character.int);
      break;
    default:
      return null;
  }
  
  return Math.max(1, maxPrepared);
}

export default function SpellsTab({ character, onUpdate }) {
  const [showSpellPicker, setShowSpellPicker] = useState(false);
  const [expandedSpell, setExpandedSpell] = useState(null);

  const casterInfo = getPreparedCasterInfo(character);
  const preparedCaster = casterInfo !== null;
  const maxPrepared = calculateMaxPrepared(character, casterInfo);
  const spells = character.spells || [];
  
  // Count prepared spells (excluding cantrips and always-prepared spells)
  const preparedCount = spells.filter(s => s.prepared && parseInt(s.level) > 0 && !s.alwaysPrepared).length;
  const alwaysPreparedCount = spells.filter(s => s.alwaysPrepared && parseInt(s.level) > 0).length;

  const addSpell = () => {
    const newSpell = { 
      id: Date.now(), 
      name: '', 
      level: 0, 
      school: '', 
      castTime: '1 action', 
      range: '', 
      duration: '', 
      description: '',
      prepared: !preparedCaster, // Auto-prepare for known casters
      alwaysPrepared: false
    };
    onUpdate('spells', [...spells, newSpell]);
  };

  const addSpellsFromPicker = (newSpells) => {
    // For prepared casters, new spells start unprepared (except cantrips)
    const processedSpells = newSpells.map(spell => ({
      ...spell,
      prepared: !preparedCaster || parseInt(spell.level) === 0
    }));
    onUpdate('spells', [...spells, ...processedSpells]);
  };

  const updateSpell = (id, field, value) => {
    onUpdate('spells', spells.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const togglePrepared = (id) => {
    onUpdate('spells', spells.map(s => s.id === id ? { ...s, prepared: !s.prepared } : s));
  };

  const toggleAlwaysPrepared = (id) => {
    onUpdate('spells', spells.map(s => {
      if (s.id !== id) return s;
      const newAlwaysPrepared = !s.alwaysPrepared;
      // If marking as always prepared, also set prepared to true
      return { ...s, alwaysPrepared: newAlwaysPrepared, prepared: newAlwaysPrepared ? true : s.prepared };
    }));
  };

  const removeSpell = (id) => {
    onUpdate('spells', spells.filter(s => s.id !== id));
  };

  // Prepare all / unprepare all for a level
  const setAllPreparedForLevel = (level, prepared) => {
    onUpdate('spells', spells.map(s => 
      parseInt(s.level) === parseInt(level) ? { ...s, prepared } : s
    ));
  };

  const getLevelLabel = (level) => {
    if (level === 0 || level === '0') return 'Cantrip';
    const num = parseInt(level);
    if (isNaN(num)) return level;
    return `${num}${getOrdinalSuffix(num)}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-sm">
            <span className="text-stone-500">Spellcasting: </span>
            <select value={character.spellStat || ''} onChange={(e) => onUpdate('spellStat', e.target.value || null)}
              className="bg-stone-800 rounded px-2 py-1 text-sm">
              <option value="">None</option>
              <option value="int">INT</option>
              <option value="wis">WIS</option>
              <option value="cha">CHA</option>
            </select>
          </div>
          
          {/* Prepared caster indicator */}
          {preparedCaster && maxPrepared && (
            <div className="text-sm flex items-center gap-3">
              <div>
                <span className="text-stone-500">Prepared: </span>
                <span className={`font-medium ${preparedCount > maxPrepared ? 'text-red-400' : 'text-emerald-400'}`}>
                  {preparedCount}
                </span>
                <span className="text-stone-500"> / </span>
                <span className="text-amber-400">{maxPrepared}</span>
                <span className="text-stone-500"> max</span>
                {preparedCount > maxPrepared && (
                  <span className="text-red-400 ml-2 text-xs">(over limit!)</span>
                )}
              </div>
              {alwaysPreparedCount > 0 && (
                <div className="text-cyan-400">
                  <span className="text-stone-500">+ </span>
                  {alwaysPreparedCount} always
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowSpellPicker(true)} 
            className="px-3 py-1 rounded bg-amber-700 hover:bg-amber-600 text-xs flex items-center gap-1"
          >
            <Icons.Sparkles className="w-3 h-3" /> Browse Spellbook
          </button>
          <button onClick={addSpell} className="px-3 py-1 rounded bg-purple-800 hover:bg-purple-700 text-xs flex items-center gap-1">
            <Icons.Plus /> Add Custom
          </button>
        </div>
      </div>
      
      {/* Spell List */}
      <div className="space-y-2">
        {spells.length === 0 ? (
          <div className="text-center text-stone-500 py-8">
            <Icons.Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No spells yet.</p>
            <p className="text-xs mt-1">Browse the spellbook or add custom spells</p>
          </div>
        ) : (
          // Group spells by level
          Object.entries(
            spells.reduce((groups, spell) => {
              const level = parseInt(spell.level) || 0;
              if (!groups[level]) groups[level] = [];
              groups[level].push(spell);
              return groups;
            }, {})
          )
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([level, levelSpells]) => {
              const isCantrip = level === '0' || level === 0;
              const preparedInLevel = levelSpells.filter(s => s.prepared).length;
              
              return (
                <div key={level} className="mb-4">
                  <div className="flex items-center justify-between mb-2 border-b border-stone-700 pb-1">
                    <h3 className="text-sm font-medium text-purple-400">
                      {isCantrip ? 'Cantrips' : `${getLevelLabel(level)} Level`}
                      {!isCantrip && preparedCaster && (
                        <span className="text-stone-500 font-normal ml-2">
                          ({preparedInLevel}/{levelSpells.length} prepared)
                        </span>
                      )}
                    </h3>
                    {/* Quick prepare/unprepare all for this level */}
                    {!isCantrip && preparedCaster && levelSpells.length > 1 && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setAllPreparedForLevel(level, true)}
                          className="text-xs text-emerald-400 hover:text-emerald-300 px-1"
                          title="Prepare all"
                        >
                          All
                        </button>
                        <span className="text-stone-600">|</span>
                        <button
                          onClick={() => setAllPreparedForLevel(level, false)}
                          className="text-xs text-stone-400 hover:text-stone-300 px-1"
                          title="Unprepare all"
                        >
                          None
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    {levelSpells.map(spell => {
                      const isExpanded = expandedSpell === spell.id;
                      const hasDetails = spell.description || spell.components || spell.duration;
                      const showPrepareToggle = preparedCaster && !isCantrip;
                      
                      return (
                        <div
                          key={spell.id}
                          className={`border rounded-lg overflow-hidden transition-all ${
                            isExpanded 
                              ? 'border-purple-700/50 bg-stone-800/80' 
                              : spell.alwaysPrepared
                                ? 'border-cyan-700/50 bg-cyan-950/20'
                                : 'border-stone-700/50 bg-stone-800/30 hover:bg-stone-800/50'
                          } ${showPrepareToggle && !spell.prepared && !spell.alwaysPrepared ? 'opacity-50' : ''}`}
                        >
                          <div 
                            className="flex items-center gap-2 p-2 cursor-pointer"
                            onClick={() => hasDetails && setExpandedSpell(isExpanded ? null : spell.id)}
                          >
                            {/* Prepared Toggle */}
                            {showPrepareToggle && (
                              spell.alwaysPrepared ? (
                                // Always prepared - show star icon
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleAlwaysPrepared(spell.id); }}
                                  className="w-5 h-5 rounded bg-cyan-600 border-2 border-cyan-500 flex items-center justify-center flex-shrink-0 text-white"
                                  title="Always prepared (domain/circle spell) - click to remove"
                                >
                                  <Icons.Star className="w-3 h-3" />
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); togglePrepared(spell.id); }}
                                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); toggleAlwaysPrepared(spell.id); }}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                    spell.prepared 
                                      ? 'bg-emerald-600 border-emerald-500 text-white' 
                                      : 'border-stone-600 hover:border-stone-500'
                                  }`}
                                  title={spell.prepared ? 'Prepared - click to unprepare, right-click for always prepared' : 'Not prepared - click to prepare, right-click for always prepared'}
                                >
                                  {spell.prepared && <Icons.Check className="w-3 h-3" />}
                                </button>
                              )
                            )}

                            {/* Spell Name */}
                            {spell.sourceId ? (
                              // From spellbook - show as text
                              <span className={`flex-1 font-medium min-w-0 truncate ${spell.alwaysPrepared ? 'text-cyan-400' : 'text-amber-400'}`}>
                                {spell.name}
                              </span>
                            ) : (
                              // Custom spell - editable
                              <input
                                type="text"
                                value={spell.name}
                                onChange={(e) => updateSpell(spell.id, 'name', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className={`flex-1 bg-transparent focus:outline-none font-medium min-w-0 ${spell.alwaysPrepared ? 'text-cyan-400' : 'text-amber-400'}`}
                                placeholder="Spell name"
                              />
                            )}

                            {/* Tags */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {spell.alwaysPrepared && (
                                <span className="px-1.5 py-0.5 bg-cyan-900/30 text-cyan-400 rounded text-[10px]" title="Always Prepared">A</span>
                              )}
                              {spell.concentration && (
                                <span className="px-1.5 py-0.5 bg-amber-900/30 text-amber-400 rounded text-[10px]" title="Concentration">C</span>
                              )}
                              {spell.ritual && (
                                <span className="px-1.5 py-0.5 bg-blue-900/30 text-blue-400 rounded text-[10px]" title="Ritual">R</span>
                              )}
                            </div>

                            {/* Cast Time */}
                            <span className="text-xs text-stone-400 w-20 text-center flex-shrink-0">
                              {abbreviateCastTime(spell.castTime || spell.castingTime)}
                            </span>

                            {/* Range */}
                            <span className="text-xs text-stone-400 w-16 text-center flex-shrink-0">
                              {spell.range || '—'}
                            </span>

                            {/* Save DC */}
                            {(() => {
                              const saveType = extractSaveType(spell.description);
                              const dc = calculateSpellDC(character);
                              if (saveType && dc) {
                                return (
                                  <span className="text-xs text-red-400 w-16 text-center flex-shrink-0" title={`${saveType} Save DC ${dc}`}>
                                    {saveType} {dc}
                                  </span>
                                );
                              }
                              return <span className="w-16 flex-shrink-0" />;
                            })()}

                            {/* Expand/Collapse Indicator */}
                            {hasDetails && (
                              <div className="text-stone-400 p-1 flex-shrink-0">
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                >
                                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                                </svg>
                              </div>
                            )}

                            {/* Always Prepared Toggle (for non-cantrips) */}
                            {preparedCaster && parseInt(spell.level) > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleAlwaysPrepared(spell.id);
                                }}
                                className={`p-1 flex-shrink-0 transition-colors ${
                                  spell.alwaysPrepared 
                                    ? 'text-cyan-400 hover:text-cyan-300' 
                                    : 'text-stone-600 hover:text-cyan-400'
                                }`}
                                title={spell.alwaysPrepared ? 'Remove always prepared (subclass spell)' : 'Mark as always prepared (subclass spell)'}
                              >
                                <Icons.Star className="w-3 h-3" />
                              </button>
                            )}

                            {/* Remove */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSpell(spell.id);
                              }}
                              className="text-red-500 hover:text-red-400 p-1 flex-shrink-0"
                            >
                              <Icons.Trash className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && hasDetails && (
                            <div className="px-3 pb-3 border-t border-stone-700/50">
                              <div className="pt-3 space-y-2 text-sm">
                                {(spell.castTime || spell.castingTime) && (
                                  <p className="text-stone-400">
                                    <span className="text-stone-500">Casting Time:</span> {spell.castTime || spell.castingTime}
                                  </p>
                                )}
                                {spell.components && (
                                  <p className="text-stone-400">
                                    <span className="text-stone-500">Components:</span> {spell.components}
                                  </p>
                                )}
                                {spell.duration && (
                                  <p className="text-stone-400">
                                    <span className="text-stone-500">Duration:</span> {spell.duration}
                                  </p>
                                )}
                                {spell.school && (
                                  <p className="text-stone-400">
                                    <span className="text-stone-500">School:</span> {spell.school}
                                  </p>
                                )}
                                {spell.description && (
                                  <p className="text-stone-300 whitespace-pre-wrap">{spell.description}</p>
                                )}
                                {spell.higherLevels && (
                                  <p className="text-stone-400">
                                    <span className="text-amber-400 font-medium">
                                      {(parseInt(spell.level) || 0) === 0 ? 'Cantrip Upgrade.' : 'At Higher Levels.'}
                                    </span>{' '}
                                    {spell.higherLevels}
                                  </p>
                                )}
                                {/* Source Info */}
                                {(spell.source || spell.sourceUrl) && (
                                  <div className="pt-2 border-t border-stone-700/50 flex items-center justify-between">
                                    <span className="text-stone-500">
                                      Source: <span className="text-stone-400">{spell.sourceShort || spell.source || 'Unknown'}</span>
                                    </span>
                                    {spell.sourceUrl && (
                                      <a 
                                        href={spell.sourceUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        View Source ↗
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* Spell Picker Modal */}
      <SpellPickerModal
        isOpen={showSpellPicker}
        onClose={() => setShowSpellPicker(false)}
        onAddSpells={addSpellsFromPicker}
        characterSpells={spells}
        characterClasses={getCharacterClasses(character)}
      />
    </div>
  );
}

function getOrdinalSuffix(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// Abbreviate casting time for compact display
function abbreviateCastTime(castTime) {
  if (!castTime) return '—';
  const lower = castTime.toLowerCase();
  if (lower.startsWith('reaction')) return 'Reaction';
  if (lower.startsWith('bonus action')) return 'Bonus';
  if (lower === '1 action') return 'Action';
  if (lower.includes('minute')) return castTime.match(/\d+\s*min/i)?.[0] || castTime;
  if (lower.includes('hour')) return castTime.match(/\d+\s*h(ou)?r/i)?.[0] || castTime;
  return castTime;
}

// Extract save type from spell description
function extractSaveType(description) {
  if (!description) return null;
  const lower = description.toLowerCase();
  
  // Match patterns like "Strength saving throw", "a Dexterity save", "Constitution saving throw"
  const saveMatch = lower.match(/(strength|dexterity|constitution|intelligence|wisdom|charisma)\s+sav(e|ing)/i);
  if (saveMatch) {
    const stat = saveMatch[1].toLowerCase();
    const abbrev = { strength: 'STR', dexterity: 'DEX', constitution: 'CON', intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA' };
    return abbrev[stat] || null;
  }
  return null;
}

// Calculate spell save DC: 8 + proficiency + spellcasting mod
// +1 if Innate Sorcery is active (Sorcerer feature)
function calculateSpellDC(character) {
  if (!character.spellStat) return null;
  
  const getMod = (score) => Math.floor(((parseInt(score) || 10) - 10) / 2);
  const profBonus = Math.ceil(1 + (parseInt(character.level) || 1) / 4);
  
  const statMap = { int: 'int', wis: 'wis', cha: 'cha' };
  const stat = statMap[character.spellStat];
  if (!stat) return null;
  
  const mod = getMod(character[stat]);
  let dc = 8 + profBonus + mod;
  
  // Innate Sorcery gives +1 to spell save DC when active
  if (character.innateSorcery) dc += 1;
  
  return dc;
}

function getCharacterClasses(character) {
  const classes = [];
  if (character.class) classes.push(character.class);
  if (character.multiclassClass) classes.push(character.multiclassClass);
  if (character.classes) {
    character.classes.forEach(c => classes.push(c.name));
  }
  return classes;
}
