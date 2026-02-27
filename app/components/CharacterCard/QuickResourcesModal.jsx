'use client';

import { useState, useEffect } from 'react';
import Icons from '../Icons';

const QuickResourcesModal = ({ isOpen, character, onUpdate, onClose }) => {
  if (!isOpen) return null;

  const resources = character.resources || [];
  const spellSlots = character.spellSlots || {};
  
  // Check if character is a Sorcerer (for Innate Sorcery)
  const isSorcerer = character.classes?.some(c => c.name?.toLowerCase() === 'sorcerer') || 
                     character.class?.toLowerCase() === 'sorcerer';
  const innateSorceryActive = character.innateSorcery || false;

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
                {resources.map((r, i) => (
                  <div key={i} className="flex items-center justify-between bg-stone-800/50 rounded-lg p-3">
                    <div className="flex-1">
                      <div className="font-medium text-stone-200">{r.name}</div>
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
                      <button 
                        onClick={() => updateResource(i, -1)}
                        disabled={r.current <= 0}
                        className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600 disabled:opacity-50 disabled:hover:bg-stone-700 text-stone-300 flex items-center justify-center"
                      >
                        −
                      </button>
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
                ))}
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
          {!hasResources && !hasSpellSlots && (
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
    </div>
  );
};

export default QuickResourcesModal;
