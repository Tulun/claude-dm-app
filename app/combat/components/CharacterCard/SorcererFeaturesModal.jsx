'use client';

import { useState } from 'react';
import Icons from '../../../components/Icons';

const METAMAGIC_OPTIONS = {
  'Careful Spell': { cost: 1, description: 'Chosen creatures automatically succeed on the spell\'s saving throw.' },
  'Distant Spell': { cost: 1, description: 'Double the range, or make Touch become 30 ft.' },
  'Empowered Spell': { cost: 1, description: 'Reroll up to CHA mod damage dice (min 1).' },
  'Extended Spell': { cost: 1, description: 'Double the duration (max 24 hours).' },
  'Heightened Spell': { cost: 2, description: 'One target has Disadvantage on first save.' },
  'Quickened Spell': { cost: 2, description: 'Cast as a Bonus Action instead of an Action.' },
  'Seeking Spell': { cost: 1, description: 'Reroll a missed spell attack roll.' },
  'Subtle Spell': { cost: 1, description: 'Cast without Verbal or Somatic components.' },
  'Transmuted Spell': { cost: 1, description: 'Change damage type to acid, cold, fire, lightning, poison, or thunder.' },
  'Twinned Spell': { cost: 1, description: 'Target a second creature with a single-target spell. Cost = spell level (min 1).' },
};

export default function SorcererFeaturesModal({ isOpen, onClose, character, onUpdate }) {
  const [expandedMeta, setExpandedMeta] = useState(null);
  
  if (!isOpen) return null;

  const resources = character.resources || [];
  const features = character.features || [];
  
  // Get sorcerer level
  const getSorcererLevel = () => {
    if (character.classes) {
      const sorc = character.classes.find(c => c.name?.toLowerCase() === 'sorcerer');
      return sorc ? parseInt(sorc.level) || 0 : 0;
    }
    return character.class?.toLowerCase() === 'sorcerer' ? parseInt(character.level) || 0 : 0;
  };
  const sorcererLevel = getSorcererLevel();

  // Get class display string
  const classDisplay = character.classes 
    ? character.classes.map(c => `${c.name} ${c.level}`).join(' / ')
    : `${character.class} ${character.level}`;

  // Find sorcery points resource
  const sorceryPointsResource = resources.find(r => 
    r.name.toLowerCase().includes('sorcery point')
  );
  const sorceryPoints = sorceryPointsResource?.current || 0;
  const maxSorceryPoints = sorceryPointsResource?.max || sorcererLevel;

  // Innate Sorcery
  const innateSorceryActive = character.innateSorcery || false;

  // Find metamagic options from features - check multiple possible structures
  const metamagicFeature = features.find(f => 
    f.name?.toLowerCase().includes('metamagic')
  );
  // Options could be in .options array or .selectedOptions or similar
  let knownMetamagic = [];
  if (metamagicFeature) {
    if (Array.isArray(metamagicFeature.options)) {
      knownMetamagic = metamagicFeature.options;
    } else if (Array.isArray(metamagicFeature.selectedOptions)) {
      knownMetamagic = metamagicFeature.selectedOptions;
    } else if (typeof metamagicFeature.description === 'string') {
      // Try to parse from description
      const match = metamagicFeature.description.match(/Options?:\s*([^.]+)/i);
      if (match) {
        knownMetamagic = match[1].split(/,\s*/).map(s => s.trim());
      }
    }
  }

  // Calculate spell DC with Innate Sorcery
  const getSpellDC = () => {
    const spellStat = character.spellStat || 'cha';
    const statValue = character[spellStat] || 10;
    const mod = Math.floor((statValue - 10) / 2);
    const profBonus = character.profBonus || Math.ceil(1 + (character.level || 1) / 4);
    const baseDC = 8 + mod + profBonus;
    return innateSorceryActive ? baseDC + 1 : baseDC;
  };

  const toggleInnateSorcery = () => {
    onUpdate({ ...character, innateSorcery: !innateSorceryActive });
  };

  const updateSorceryPoints = (delta) => {
    if (!sorceryPointsResource) return;
    const newCurrent = Math.max(0, Math.min(maxSorceryPoints, sorceryPoints + delta));
    const idx = resources.findIndex(r => r.id === sorceryPointsResource.id);
    const updatedResources = [...resources];
    updatedResources[idx] = { ...sorceryPointsResource, current: newCurrent };
    onUpdate({ ...character, resources: updatedResources });
  };

  const useSorceryPoints = (cost) => {
    if (sorceryPoints < cost) return;
    updateSorceryPoints(-cost);
  };

  // Font of Magic conversions
  const spellSlots = character.spellSlots || {};
  const slotCosts = { 1: 2, 2: 3, 3: 5, 4: 6, 5: 7 };
  const slotCreationCosts = { 1: 2, 2: 3, 3: 5, 4: 6, 5: 7 };

  const convertSlotToPoints = (level) => {
    const key = `level${level}`;
    const slot = spellSlots[key];
    if (!slot || slot.current <= 0) return;
    
    const points = level; // 1st = 1 SP, 2nd = 2 SP, etc.
    const newSlots = { ...spellSlots, [key]: { ...slot, current: slot.current - 1 } };
    const newPoints = Math.min(maxSorceryPoints, sorceryPoints + points);
    
    const idx = resources.findIndex(r => r.id === sorceryPointsResource?.id);
    let updatedResources = resources;
    if (idx >= 0) {
      updatedResources = [...resources];
      updatedResources[idx] = { ...sorceryPointsResource, current: newPoints };
    }
    
    onUpdate({ ...character, spellSlots: newSlots, resources: updatedResources });
  };

  const createSlotFromPoints = (level) => {
    const cost = slotCreationCosts[level];
    if (!cost || sorceryPoints < cost) return;
    
    const key = `level${level}`;
    const slot = spellSlots[key] || { current: 0, max: 0 };
    
    // Can't exceed max slots
    if (slot.current >= slot.max) return;
    
    const newSlots = { ...spellSlots, [key]: { ...slot, current: slot.current + 1 } };
    
    const idx = resources.findIndex(r => r.id === sorceryPointsResource?.id);
    let updatedResources = resources;
    if (idx >= 0) {
      updatedResources = [...resources];
      updatedResources[idx] = { ...sorceryPointsResource, current: sorceryPoints - cost };
    }
    
    onUpdate({ ...character, spellSlots: newSlots, resources: updatedResources });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-purple-700 rounded-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-stone-700 bg-gradient-to-r from-purple-950/50 to-stone-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icons.Sparkles className="w-6 h-6 text-purple-400" />
              <div>
                <h2 className="text-lg font-bold text-purple-400">Sorcerer Features</h2>
                <p className="text-xs text-stone-400">{classDisplay}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-stone-400 hover:text-white">
              <Icons.X />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Innate Sorcery */}
          <div className={`rounded-lg p-4 border transition-colors ${
            innateSorceryActive 
              ? 'border-purple-500 bg-purple-900/30' 
              : 'border-stone-700 bg-stone-800/50'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-purple-300">Innate Sorcery</h3>
                <p className="text-xs text-stone-400 mt-1">
                  Bonus Action to activate for 1 minute. +1 to spell attack rolls and save DCs. 
                  Advantage on Sorcerer spell attacks.
                </p>
              </div>
              <button
                onClick={toggleInnateSorcery}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  innateSorceryActive ? 'bg-purple-600' : 'bg-stone-700'
                }`}
              >
                <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  innateSorceryActive ? 'left-8' : 'left-1'
                }`} />
              </button>
            </div>
            {innateSorceryActive && (
              <div className="mt-3 flex items-center gap-4 text-sm">
                <span className="px-3 py-1 rounded bg-purple-700 text-purple-100">
                  Spell DC: {getSpellDC()}
                </span>
                <span className="text-purple-400">+1 to spell attacks</span>
                <span className="text-purple-400">Advantage on attacks</span>
              </div>
            )}
          </div>

          {/* Sorcery Points */}
          {sorcererLevel >= 2 && (
            <div className="rounded-lg p-4 border border-stone-700 bg-stone-800/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-orange-300">Sorcery Points</h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => updateSorceryPoints(-1)}
                    disabled={sorceryPoints <= 0}
                    className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600 disabled:opacity-50"
                  >−</button>
                  <input
                    type="number"
                    value={sorceryPoints}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const clamped = Math.max(0, Math.min(maxSorceryPoints, val));
                      if (sorceryPointsResource) {
                        const idx = resources.findIndex(r => r.id === sorceryPointsResource.id);
                        const updatedResources = [...resources];
                        updatedResources[idx] = { ...sorceryPointsResource, current: clamped };
                        onUpdate({ ...character, resources: updatedResources });
                      }
                    }}
                    className="w-16 bg-stone-700 rounded px-2 py-1 text-center font-mono text-lg"
                  />
                  <span className="text-stone-500">/</span>
                  <span className="font-mono text-lg text-stone-400">{maxSorceryPoints}</span>
                  <button 
                    onClick={() => updateSorceryPoints(1)}
                    disabled={sorceryPoints >= maxSorceryPoints}
                    className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600 disabled:opacity-50"
                  >+</button>
                </div>
              </div>

              {/* Font of Magic */}
              <div className="border-t border-stone-700 pt-3 mt-3">
                <h4 className="text-xs text-stone-500 uppercase mb-2">Font of Magic</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-stone-400 mb-1">Convert Slot → Points</p>
                    <div className="flex gap-1 flex-wrap">
                      {[1, 2, 3, 4, 5].map(level => {
                        const key = `level${level}`;
                        const slot = spellSlots[key];
                        const canConvert = slot && slot.current > 0;
                        return (
                          <button
                            key={level}
                            onClick={() => convertSlotToPoints(level)}
                            disabled={!canConvert}
                            className={`px-2 py-1 rounded ${
                              canConvert 
                                ? 'bg-orange-900/50 text-orange-300 hover:bg-orange-800/50' 
                                : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                            }`}
                            title={`Convert ${level}${['st','nd','rd'][level-1]||'th'} level slot to ${level} SP`}
                          >
                            {level}→{level}SP
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-stone-400 mb-1">Create Slot (costs SP)</p>
                    <div className="flex gap-1 flex-wrap">
                      {[1, 2, 3, 4, 5].map(level => {
                        const cost = slotCreationCosts[level];
                        const key = `level${level}`;
                        const slot = spellSlots[key];
                        const canCreate = sorceryPoints >= cost && slot && slot.current < slot.max;
                        return (
                          <button
                            key={level}
                            onClick={() => createSlotFromPoints(level)}
                            disabled={!canCreate}
                            className={`px-2 py-1 rounded ${
                              canCreate 
                                ? 'bg-purple-900/50 text-purple-300 hover:bg-purple-800/50' 
                                : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                            }`}
                            title={`Spend ${cost} SP to create a ${level}${['st','nd','rd'][level-1]||'th'} level slot`}
                          >
                            {cost}SP→{level}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metamagic */}
          {sorcererLevel >= 2 && (
            <div className="rounded-lg p-4 border border-stone-700 bg-stone-800/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-amber-300">Metamagic Options</h3>
                {knownMetamagic.length > 0 && (
                  <span className="text-xs text-stone-500">{knownMetamagic.length} known</span>
                )}
              </div>
              
              {knownMetamagic.length === 0 ? (
                <div>
                  <p className="text-xs text-stone-500 mb-3">
                    No metamagic options found. Select your known options:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(METAMAGIC_OPTIONS).map(name => (
                      <button
                        key={name}
                        onClick={() => {
                          // Add metamagic feature if it doesn't exist
                          const existingFeature = features.find(f => f.name?.toLowerCase().includes('metamagic'));
                          let updatedFeatures;
                          if (existingFeature) {
                            updatedFeatures = features.map(f => 
                              f.id === existingFeature.id 
                                ? { ...f, options: [...(f.options || []), name] }
                                : f
                            );
                          } else {
                            updatedFeatures = [...features, {
                              id: Date.now(),
                              name: 'Metamagic',
                              description: 'Sorcerer feature allowing you to twist spells.',
                              options: [name]
                            }];
                          }
                          onUpdate({ ...character, features: updatedFeatures });
                        }}
                        className="px-2 py-1 rounded text-xs bg-amber-900/30 text-amber-300 hover:bg-amber-800/50"
                        title={METAMAGIC_OPTIONS[name].description}
                      >
                        + {name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {knownMetamagic.map((name, idx) => {
                    const meta = METAMAGIC_OPTIONS[name] || { cost: '?', description: 'Unknown metamagic option' };
                    const isExpanded = expandedMeta === idx;
                    const canUse = sorceryPoints >= meta.cost;
                    
                    return (
                      <div key={idx} className="bg-stone-900/50 rounded-lg overflow-hidden">
                        <div 
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-stone-800/50"
                          onClick={() => setExpandedMeta(isExpanded ? null : idx)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-amber-400 font-medium">{name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              canUse ? 'bg-orange-900/50 text-orange-300' : 'bg-stone-800 text-stone-500'
                            }`}>
                              {meta.cost} SP
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); useSorceryPoints(meta.cost); }}
                              disabled={!canUse}
                              className={`px-3 py-1 rounded text-xs ${
                                canUse 
                                  ? 'bg-amber-700 hover:bg-amber-600 text-amber-100' 
                                  : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                              }`}
                            >
                              Use
                            </button>
                            <span className={`text-stone-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                              ▼
                            </span>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="px-3 pb-3 text-sm text-stone-400">
                            {meta.description}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-700">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg bg-stone-700 hover:bg-stone-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
