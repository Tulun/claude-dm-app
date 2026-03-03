'use client';

import { useState, useEffect } from 'react';
import Icons from '../../../components/Icons';

// Parse CR string to number for sorting
function parseCR(cr) {
  if (typeof cr === 'number') return cr;
  if (cr === '1/8') return 0.125;
  if (cr === '1/4') return 0.25;
  if (cr === '1/2') return 0.5;
  return parseFloat(cr) || 0;
}

const QuickResourcesModal = ({ isOpen, character, onUpdate, onClose, templates = [] }) => {
  const [showOptionsFor, setShowOptionsFor] = useState(null);
  const [showWildShapePicker, setShowWildShapePicker] = useState(false);
  const [showOptionDetails, setShowOptionDetails] = useState(null); // { resourceIndex, option }
  const [wildShapeSort, setWildShapeSort] = useState('name'); // 'name' or 'cr'
  
  if (!isOpen) return null;

  const resources = character.resources || [];
  const spellSlots = character.spellSlots || {};
  
  // Check if character is a Sorcerer (for Innate Sorcery)
  const isSorcerer = character.classes?.some(c => c.name?.toLowerCase() === 'sorcerer') || 
                     character.class?.toLowerCase() === 'sorcerer';
  const innateSorceryActive = character.innateSorcery || false;

  // Check if character is a Druid level 2+ (for Wild Shape)
  const isDruid = () => {
    if (character.classes) {
      const druid = character.classes.find(c => c.name?.toLowerCase() === 'druid');
      return druid && parseInt(druid.level) >= 2;
    }
    return character.class?.toLowerCase() === 'druid' && parseInt(character.level) >= 2;
  };

  const getDruidLevel = () => {
    if (character.classes) {
      const druid = character.classes.find(c => c.name?.toLowerCase() === 'druid');
      return druid ? parseInt(druid.level) || 0 : 0;
    }
    return character.class?.toLowerCase() === 'druid' ? parseInt(character.level) || 0 : 0;
  };

  const wildShapeForms = character.wildShapeForms || [];
  const activeWildShapeForm = character.wildShapeActive 
    ? wildShapeForms.find(f => f.id === character.wildShapeFormId)
    : null;
  const activeFormTemplate = activeWildShapeForm 
    ? templates.find(t => t.id === activeWildShapeForm.templateId)
    : null;

  // Calculate spell DC with Innate Sorcery bonus
  const getSpellDC = () => {
    const spellStat = character.spellStat;
    if (!spellStat) return null;
    const statValue = character[spellStat] || 10;
    const mod = Math.floor((statValue - 10) / 2);
    const profBonus = character.profBonus || Math.ceil(1 + (character.level || 1) / 4);
    const baseDC = 8 + mod + profBonus;
    return innateSorceryActive ? baseDC + 1 : baseDC;
  };

  const spellDC = getSpellDC();
  
  // Get spell slot levels that exist
  const slotLevels = Object.keys(spellSlots)
    .filter(k => k.startsWith('level') && spellSlots[k]?.max > 0)
    .sort((a, b) => parseInt(a.replace('level', '')) - parseInt(b.replace('level', '')));

  const updateResource = (index, delta) => {
    const updated = [...resources];
    updated[index] = { 
      ...updated[index], 
      current: Math.max(0, Math.min(updated[index].max, updated[index].current + delta)) 
    };
    onUpdate({ ...character, resources: updated });
  };

  const useResourceWithOption = (index, optionName) => {
    const r = resources[index];
    if (r.current <= 0) return;
    
    const updated = [...resources];
    updated[index] = { 
      ...updated[index], 
      current: r.current - 1,
      lastUsed: optionName
    };
    
    let updates = { ...character, resources: updated };
    
    // Special handling for Bear Spirit - grants temp HP
    if (optionName === 'Bear Spirit') {
      const druidLevel = getDruidLevel();
      const tempHp = 5 + druidLevel;
      // Only apply if greater than current temp HP
      if (tempHp > (character.tempHp || 0)) {
        updates.tempHp = tempHp;
      }
    }
    
    onUpdate(updates);
    setShowOptionsFor(null);
  };

  const resetResource = (index) => {
    const updated = [...resources];
    updated[index] = { ...updated[index], current: updated[index].max };
    onUpdate({ ...character, resources: updated });
  };

  const resetAllResources = () => {
    const updated = resources.map(r => ({ ...r, current: r.max }));
    onUpdate({ ...character, resources: updated });
  };

  const updateSpellSlot = (level, delta) => {
    const key = `level${level}`;
    const current = spellSlots[key]?.current || 0;
    const max = spellSlots[key]?.max || 0;
    const newCurrent = Math.max(0, Math.min(max, current + delta));
    onUpdate({ 
      ...character, 
      spellSlots: { 
        ...spellSlots, 
        [key]: { ...spellSlots[key], current: newCurrent } 
      } 
    });
  };

  const resetSpellSlot = (level) => {
    const key = `level${level}`;
    onUpdate({ 
      ...character, 
      spellSlots: { 
        ...spellSlots, 
        [key]: { ...spellSlots[key], current: spellSlots[key]?.max || 0 } 
      } 
    });
  };

  const resetAllSpellSlots = () => {
    const updated = { ...spellSlots };
    Object.keys(updated).forEach(key => {
      if (key.startsWith('level') && updated[key]?.max) {
        updated[key] = { ...updated[key], current: updated[key].max };
      }
    });
    onUpdate({ ...character, spellSlots: updated });
  };

  const toggleInnateSorcery = () => {
    onUpdate({ ...character, innateSorcery: !innateSorceryActive });
  };

  // Wild Shape functions
  const activateWildShape = (formId) => {
    const form = wildShapeForms.find(f => f.id === formId);
    if (!form) return;

    // Reset form HP when transforming (use stored maxHp)
    const updatedForms = wildShapeForms.map(f => 
      f.id === formId ? { ...f, currentHp: f.maxHp || 1 } : f
    );

    // Decrement wild shape uses if resource exists
    let updatedResources = resources;
    const wildShapeResourceIndex = resources.findIndex(r => 
      r.name.toLowerCase().includes('wild shape')
    );
    if (wildShapeResourceIndex >= 0 && resources[wildShapeResourceIndex].current > 0) {
      updatedResources = [...resources];
      updatedResources[wildShapeResourceIndex] = {
        ...updatedResources[wildShapeResourceIndex],
        current: updatedResources[wildShapeResourceIndex].current - 1
      };
    }

    onUpdate({
      ...character,
      resources: updatedResources,
      wildShapeForms: updatedForms,
      wildShapeActive: true,
      wildShapeFormId: formId
    });
    setShowWildShapePicker(false);
  };

  const deactivateWildShape = () => {
    onUpdate({
      ...character,
      wildShapeActive: false,
      wildShapeFormId: null
    });
  };

  const updateWildShapeHp = (delta) => {
    if (!activeWildShapeForm) return;

    const maxHp = activeWildShapeForm.maxHp || 1;
    const newHp = Math.max(0, Math.min(maxHp, activeWildShapeForm.currentHp + delta));
    const updatedForms = wildShapeForms.map(f =>
      f.id === activeWildShapeForm.id ? { ...f, currentHp: newHp } : f
    );

    let updates = { ...character, wildShapeForms: updatedForms };

    // If HP drops to 0, end wild shape
    if (newHp === 0) {
      updates.wildShapeActive = false;
      updates.wildShapeFormId = null;
    }

    onUpdate(updates);
  };

  const hasSpellSlots = slotLevels.length > 0;
  const hasResources = resources.length > 0;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-emerald-800/50 rounded-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-stone-700 bg-gradient-to-r from-emerald-950/50 to-stone-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-900/50">
              <Icons.Shield />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-400">{character.name}</h2>
              <p className="text-xs text-stone-400">
                {character.classes?.map(c => `${c.name} ${c.level}`).join(' / ') || `${character.class} ${character.level}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-200">
            <Icons.X />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Wild Shape Section - for Druids level 2+ */}
          {isDruid() && (
            <div className={`rounded-lg p-3 border ${character.wildShapeActive ? 'bg-lime-900/30 border-lime-600' : 'bg-lime-900/20 border-lime-700/50'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🐾</span>
                  <span className="font-medium text-lime-300">Wild Shape</span>
                </div>
                {character.wildShapeActive ? (
                  <button
                    onClick={deactivateWildShape}
                    className="px-3 py-1 rounded text-xs bg-red-800 hover:bg-red-700"
                  >
                    End Form
                  </button>
                ) : (
                  <button
                    onClick={() => setShowWildShapePicker(true)}
                    disabled={wildShapeForms.length === 0}
                    className={`px-3 py-1 rounded text-xs ${
                      wildShapeForms.length === 0
                        ? 'bg-stone-700 text-stone-500 cursor-not-allowed'
                        : 'bg-lime-700 hover:bg-lime-600'
                    }`}
                  >
                    Transform
                  </button>
                )}
              </div>

              {/* Active Form Display */}
              {character.wildShapeActive && activeWildShapeForm && (
                <div className="mt-2 p-2 bg-stone-900/50 rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-lime-400">{activeWildShapeForm.name}</span>
                      <div className="text-xs text-stone-400 flex gap-2 mt-1">
                        <span>AC {activeWildShapeForm.ac}</span>
                        <span>Speed {activeWildShapeForm.speed}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateWildShapeHp(-1)}
                        className="w-7 h-7 rounded bg-stone-700 hover:bg-stone-600 text-sm"
                      >−</button>
                      <span className={`font-mono text-sm ${activeWildShapeForm.currentHp <= (activeWildShapeForm.maxHp || 1) / 4 ? 'text-red-400' : 'text-lime-400'}`}>
                        {activeWildShapeForm.currentHp}/{activeWildShapeForm.maxHp}
                      </span>
                      <button 
                        onClick={() => updateWildShapeHp(1)}
                        className="w-7 h-7 rounded bg-stone-700 hover:bg-stone-600 text-sm"
                      >+</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-1 mt-2 text-center text-xs">
                    <div><span className="text-stone-500">STR</span> <span className="text-lime-400">{activeWildShapeForm.str}</span></div>
                    <div><span className="text-stone-500">DEX</span> <span className="text-lime-400">{activeWildShapeForm.dex}</span></div>
                    <div><span className="text-stone-500">CON</span> <span className="text-lime-400">{activeWildShapeForm.con}</span></div>
                    <div><span className="text-stone-500">INT</span> <span className="text-amber-400">{character.int}</span></div>
                    <div><span className="text-stone-500">WIS</span> <span className="text-amber-400">{character.wis}</span></div>
                    <div><span className="text-stone-500">CHA</span> <span className="text-amber-400">{character.cha}</span></div>
                  </div>
                </div>
              )}

              {wildShapeForms.length === 0 && (
                <p className="text-xs text-stone-500 mt-1">No beast forms learned. Add forms in the Wild Shape tab.</p>
              )}
            </div>
          )}

          {/* Innate Sorcery Toggle - only for Sorcerers */}
          {isSorcerer && (
            <div className="flex items-center justify-between bg-purple-900/30 border border-purple-700/50 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <Icons.Sparkles />
                <div>
                  <div className="font-medium text-purple-300">Innate Sorcery</div>
                  <div className="text-xs text-stone-400">+1 to Spell Save DC when active</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {spellDC && (
                  <span className={`text-sm font-mono px-2 py-1 rounded ${innateSorceryActive ? 'bg-purple-700 text-purple-100' : 'bg-stone-700 text-stone-400'}`}>
                    DC {spellDC}
                  </span>
                )}
                <button
                  onClick={toggleInnateSorcery}
                  className={`relative w-12 h-6 rounded-full transition-colors ${innateSorceryActive ? 'bg-purple-600' : 'bg-stone-700'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${innateSorceryActive ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          )}

          {/* Metamagic Options - Show for Sorcerers with Metamagic feature */}
          {(() => {
            // Find Metamagic feature and its options
            const metamagicFeature = (character.features || []).find(f => 
              f.name?.toLowerCase().includes('metamagic')
            );
            const metamagicOptions = metamagicFeature?.options || [];
            
            if (!isSorcerer || metamagicOptions.length === 0) return null;
            
            return (
              <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Icons.Sparkles className="text-orange-400" />
                  <span className="font-medium text-orange-300">Metamagic Options</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {metamagicOptions.map((option, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1.5 bg-orange-900/40 border border-orange-700/50 rounded-lg text-sm text-orange-200"
                    >
                      {option}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Resources Section */}
          {hasResources && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                  <Icons.Sparkles /> Resources
                </h3>
                <button 
                  onClick={resetAllResources}
                  className="text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded hover:bg-emerald-900/30"
                >
                  Reset All
                </button>
              </div>
              <div className="space-y-2">
                {resources.map((r, i) => {
                  const hasOptions = r.options && r.options.length > 0;
                  const isWildShape = r.name.toLowerCase().includes('wild shape');
                  
                  return (
                    <div key={i} className="bg-stone-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-stone-200">{r.name}</span>
                            {r.lastUsed && hasOptions && (
                              <button
                                onClick={() => {
                                  const option = r.options?.find(o => o.name === r.lastUsed);
                                  if (option) {
                                    setShowOptionDetails({ resourceIndex: i, option });
                                  }
                                }}
                                className="text-xs text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded hover:bg-purple-900/50 transition-colors flex items-center gap-1"
                              >
                                {r.lastUsed}
                                <span className="text-purple-500">ⓘ</span>
                              </button>
                            )}
                            {r.lastUsed && hasOptions && (
                              <button
                                onClick={() => {
                                  const updated = [...resources];
                                  updated[i] = { ...r, lastUsed: null };
                                  onUpdate({ ...character, resources: updated });
                                }}
                                className="text-xs text-red-400 hover:text-red-300 px-1"
                                title="Clear active spirit"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {/* Resource dots/pips */}
                            <div className="flex gap-1">
                              {Array.from({ length: r.max }, (_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    const updated = [...resources];
                                    updated[i] = { ...r, current: idx < r.current ? idx : idx + 1 };
                                    onUpdate({ ...character, resources: updated });
                                  }}
                                  className={`w-4 h-4 rounded-full border-2 transition-colors ${
                                    idx < r.current 
                                      ? 'bg-amber-500 border-amber-400' 
                                      : 'bg-stone-700 border-stone-600 hover:border-amber-500/50'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-stone-500">{r.current}/{r.max}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {hasOptions ? (
                            <button 
                              onClick={() => setShowOptionsFor(showOptionsFor === i ? null : i)}
                              disabled={r.current <= 0}
                              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                r.current <= 0
                                  ? 'bg-stone-700 text-stone-500 cursor-not-allowed'
                                  : 'bg-purple-700 hover:bg-purple-600 text-purple-100'
                              }`}
                            >
                              Use ▼
                            </button>
                          ) : (
                            <button 
                              onClick={() => updateResource(i, -1)}
                              disabled={r.current <= 0}
                              className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600 disabled:opacity-50 disabled:hover:bg-stone-700 text-stone-300 flex items-center justify-center"
                            >
                              −
                            </button>
                          )}
                          <button 
                            onClick={() => updateResource(i, 1)}
                            disabled={r.current >= r.max}
                            className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600 disabled:opacity-50 disabled:hover:bg-stone-700 text-stone-300 flex items-center justify-center"
                          >
                            +
                          </button>
                          <button 
                            onClick={() => resetResource(i)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded hover:bg-emerald-900/30"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                      
                      {/* Options dropdown */}
                      {showOptionsFor === i && hasOptions && (
                        <div className="mt-2 pt-2 border-t border-stone-700 space-y-1">
                          {r.options.map((opt, optIdx) => (
                            <button
                              key={optIdx}
                              onClick={() => useResourceWithOption(i, opt.name)}
                              className="w-full text-left p-2 rounded bg-stone-700/50 hover:bg-stone-700 transition-colors"
                            >
                              <div className="font-medium text-amber-400 text-sm">{opt.name}</div>
                              {opt.description && (
                                <div className="text-xs text-stone-400 mt-0.5 line-clamp-2">{opt.description}</div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Spell Slots Section */}
          {hasSpellSlots && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
                  <Icons.Sparkles /> Spell Slots
                </h3>
                <button 
                  onClick={resetAllSpellSlots}
                  className="text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded hover:bg-emerald-900/30"
                >
                  Reset All
                </button>
              </div>
              <div className="space-y-2">
                {slotLevels.map(key => {
                  const level = parseInt(key.replace('level', ''));
                  const slot = spellSlots[key];
                  const ordinal = level === 1 ? '1st' : level === 2 ? '2nd' : level === 3 ? '3rd' : `${level}th`;
                  
                  return (
                    <div key={key} className="flex items-center justify-between bg-purple-900/20 rounded-lg p-3">
                      <div className="flex-1">
                        <div className="font-medium text-stone-200">{ordinal} Level</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex gap-1">
                            {Array.from({ length: slot.max }, (_, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  const newCurrent = idx < slot.current ? idx : idx + 1;
                                  onUpdate({ 
                                    ...character, 
                                    spellSlots: { 
                                      ...spellSlots, 
                                      [key]: { ...slot, current: newCurrent } 
                                    } 
                                  });
                                }}
                                className={`w-4 h-4 rounded-full border-2 transition-colors ${
                                  idx < slot.current 
                                    ? 'bg-purple-500 border-purple-400' 
                                    : 'bg-stone-700 border-stone-600 hover:border-purple-500/50'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-stone-500">{slot.current}/{slot.max}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => updateSpellSlot(level, -1)}
                          disabled={slot.current <= 0}
                          className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600 disabled:opacity-50 disabled:hover:bg-stone-700 text-stone-300 flex items-center justify-center"
                        >
                          −
                        </button>
                        <button 
                          onClick={() => updateSpellSlot(level, 1)}
                          disabled={slot.current >= slot.max}
                          className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600 disabled:opacity-50 disabled:hover:bg-stone-700 text-stone-300 flex items-center justify-center"
                        >
                          +
                        </button>
                        <button 
                          onClick={() => resetSpellSlot(level)}
                          className="text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded hover:bg-emerald-900/30"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No resources message */}
          {!hasResources && !hasSpellSlots && !isDruid() && (
            <div className="text-center py-8 text-stone-500">
              No resources or spell slots configured for this character.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-700 flex justify-between items-center">
          <div className="text-xs text-stone-500">
            {character.senses || ''}
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600"
          >
            Close
          </button>
        </div>
      </div>

      {/* Wild Shape Picker Sub-Modal */}
      {showWildShapePicker && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowWildShapePicker(false)}
        >
          <div 
            className="bg-stone-900 border border-lime-700 rounded-xl w-full max-w-md max-h-[60vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-stone-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-lime-400 flex items-center gap-2">
                  🐾 Choose Beast Form
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => setWildShapeSort('name')}
                    className={`px-2 py-1 rounded text-xs ${wildShapeSort === 'name' ? 'bg-lime-700 text-lime-100' : 'bg-stone-700 text-stone-400'}`}
                  >
                    Name
                  </button>
                  <button
                    onClick={() => setWildShapeSort('cr')}
                    className={`px-2 py-1 rounded text-xs ${wildShapeSort === 'cr' ? 'bg-lime-700 text-lime-100' : 'bg-stone-700 text-stone-400'}`}
                  >
                    CR
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {wildShapeForms.length === 0 ? (
                <p className="text-center text-stone-500 py-4">No beast forms learned yet.</p>
              ) : (
                [...wildShapeForms]
                  .sort((a, b) => {
                    if (wildShapeSort === 'cr') {
                      const crA = parseCR(a.cr);
                      const crB = parseCR(b.cr);
                      return crA - crB;
                    }
                    return (a.name || '').localeCompare(b.name || '');
                  })
                  .map(form => (
                    <button
                      key={form.id}
                      onClick={() => activateWildShape(form.id)}
                      className="w-full text-left p-3 rounded-lg border border-stone-700 bg-stone-800/50 hover:border-lime-600 hover:bg-stone-800 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-lime-400">{form.name}</span>
                        <span className="text-xs text-stone-500">CR {form.cr || '?'}</span>
                      </div>
                      <div className="text-xs text-stone-400 mt-1 flex gap-3">
                        <span>AC {form.ac || '?'}</span>
                        <span>HP {form.maxHp || '?'}</span>
                        <span>{form.speed || '?'}</span>
                      </div>
                    </button>
                  ))
              )}
            </div>
            <div className="p-4 border-t border-stone-700">
              <button
                onClick={() => setShowWildShapePicker(false)}
                className="w-full py-2 rounded-lg bg-stone-700 hover:bg-stone-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Option Details Modal */}
      {showOptionDetails && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowOptionDetails(null)}
        >
          <div 
            className="bg-stone-900 border border-purple-700 rounded-xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-stone-700 bg-purple-900/30">
              <h3 className="text-lg font-bold text-purple-400">
                {showOptionDetails.option.name}
              </h3>
            </div>
            <div className="p-4">
              <p className="text-stone-300 whitespace-pre-wrap">
                {showOptionDetails.option.description || 'No description available.'}
              </p>
            </div>
            <div className="p-4 border-t border-stone-700 flex gap-2">
              <button
                onClick={() => {
                  const updated = [...resources];
                  updated[showOptionDetails.resourceIndex] = { 
                    ...updated[showOptionDetails.resourceIndex], 
                    lastUsed: null 
                  };
                  onUpdate({ ...character, resources: updated });
                  setShowOptionDetails(null);
                }}
                className="flex-1 py-2 rounded-lg bg-red-800 hover:bg-red-700 text-sm"
              >
                End Effect
              </button>
              <button
                onClick={() => setShowOptionDetails(null)}
                className="flex-1 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickResourcesModal;
