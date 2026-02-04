'use client';

import Icons from '../../components/Icons';
import ResourceRow from './ResourceRow';
import { BACKGROUNDS, CLASS_FEATURES } from './constants';

// Resources Tab
export function ResourcesTab({ character, onUpdate }) {
  const addResource = () => {
    const newResource = { id: Date.now(), name: '', current: 1, max: 1 };
    onUpdate('resources', [...(character.resources || []), newResource]);
  };

  const updateResource = (index, field, value) => {
    const updated = [...(character.resources || [])];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate('resources', updated);
  };

  const removeResource = (index) => {
    const updated = [...(character.resources || [])];
    updated.splice(index, 1);
    onUpdate('resources', updated);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-stone-400">Track spell slots, abilities, wild shapes, and other limited-use resources.</p>
        <button onClick={addResource} className="px-3 py-1 rounded bg-amber-800 hover:bg-amber-700 text-xs flex items-center gap-1">
          <Icons.Plus /> Add Resource
        </button>
      </div>
      
      <div className="space-y-2">
        {(character.resources || []).map((resource, i) => (
          <ResourceRow 
            key={resource.id || i} 
            resource={resource} 
            onUpdate={(field, value) => updateResource(i, field, value)}
            onRemove={() => removeResource(i)}
          />
        ))}
      </div>
      {(character.resources || []).length === 0 && (
        <div className="text-center text-stone-500 py-8">No resources yet. Add things like spell slots, wild shapes, rage uses, etc.</div>
      )}
    </div>
  );
}

// Inventory Tab
export function InventoryTab({ character, onUpdate }) {
  const addItem = () => {
    const newItem = { id: Date.now(), name: '', quantity: 1, weight: '', description: '' };
    onUpdate('inventory', [...(character.inventory || []), newItem]);
  };

  const updateItem = (id, field, value) => {
    onUpdate('inventory', character.inventory.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeItem = (id) => {
    onUpdate('inventory', character.inventory.filter(i => i.id !== id));
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={addItem} className="px-3 py-1 rounded bg-amber-800 hover:bg-amber-700 text-xs flex items-center gap-1">
          <Icons.Plus /> Add Item
        </button>
      </div>
      
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-stone-500 border-b border-stone-700">
            <th className="pb-2 font-medium">Item</th>
            <th className="pb-2 font-medium w-16">Qty</th>
            <th className="pb-2 font-medium w-20">Weight</th>
            <th className="pb-2 font-medium">Description</th>
            <th className="pb-2 w-8"></th>
          </tr>
        </thead>
        <tbody>
          {(character.inventory || []).map(item => (
            <tr key={item.id} className="border-b border-stone-800 hover:bg-stone-800/50">
              <td className="py-2">
                <input type="text" value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                  className="bg-transparent focus:outline-none w-full" placeholder="Item name" />
              </td>
              <td>
                <input type="text" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                  className="bg-stone-800 rounded px-2 py-1 w-12 text-center focus:outline-none" />
              </td>
              <td>
                <input type="text" value={item.weight} onChange={(e) => updateItem(item.id, 'weight', e.target.value)}
                  className="bg-transparent focus:outline-none w-full text-center" placeholder="1 lb" />
              </td>
              <td>
                <input type="text" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  className="bg-transparent focus:outline-none w-full text-stone-400" placeholder="Description..." />
              </td>
              <td>
                <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-400">×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(character.inventory || []).length === 0 && <div className="text-center text-stone-500 py-8">No items yet.</div>}
    </div>
  );
}

// Spells Tab
export function SpellsTab({ character, onUpdate }) {
  const addSpell = () => {
    const newSpell = { id: Date.now(), name: '', level: 0, school: '', castTime: '1 action', range: '', duration: '', description: '' };
    onUpdate('spells', [...(character.spells || []), newSpell]);
  };

  const updateSpell = (id, field, value) => {
    onUpdate('spells', character.spells.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSpell = (id) => {
    onUpdate('spells', character.spells.filter(s => s.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
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
        </div>
        <button onClick={addSpell} className="px-3 py-1 rounded bg-purple-800 hover:bg-purple-700 text-xs flex items-center gap-1">
          <Icons.Plus /> Add Spell
        </button>
      </div>
      
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-stone-500 border-b border-stone-700">
            <th className="pb-2 font-medium">Spell</th>
            <th className="pb-2 font-medium w-16">Level</th>
            <th className="pb-2 font-medium w-24">Cast Time</th>
            <th className="pb-2 font-medium w-24">Range</th>
            <th className="pb-2 font-medium">Description</th>
            <th className="pb-2 w-8"></th>
          </tr>
        </thead>
        <tbody>
          {(character.spells || []).map(spell => (
            <tr key={spell.id} className="border-b border-stone-800 hover:bg-stone-800/50">
              <td className="py-2">
                <input type="text" value={spell.name} onChange={(e) => updateSpell(spell.id, 'name', e.target.value)}
                  className="bg-transparent focus:outline-none w-full font-medium" placeholder="Spell name" />
              </td>
              <td>
                <input type="text" value={spell.level} onChange={(e) => updateSpell(spell.id, 'level', e.target.value)}
                  className="bg-stone-800 rounded px-2 py-1 w-12 text-center focus:outline-none" placeholder="0" />
              </td>
              <td>
                <input type="text" value={spell.castTime} onChange={(e) => updateSpell(spell.id, 'castTime', e.target.value)}
                  className="bg-transparent focus:outline-none w-full" placeholder="1 action" />
              </td>
              <td>
                <input type="text" value={spell.range} onChange={(e) => updateSpell(spell.id, 'range', e.target.value)}
                  className="bg-transparent focus:outline-none w-full" placeholder="60 ft." />
              </td>
              <td>
                <input type="text" value={spell.description} onChange={(e) => updateSpell(spell.id, 'description', e.target.value)}
                  className="bg-transparent focus:outline-none w-full text-stone-400" placeholder="Description..." />
              </td>
              <td>
                <button onClick={() => removeSpell(spell.id)} className="text-red-500 hover:text-red-400">×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(character.spells || []).length === 0 && <div className="text-center text-stone-500 py-8">No spells yet.</div>}
    </div>
  );
}

// Features Tab
export function FeaturesTab({ character, onUpdate }) {
  const addFeature = () => {
    const newFeature = { id: Date.now(), name: '', description: '', source: '' };
    onUpdate('features', [...(character.features || []), newFeature]);
  };

  const updateFeature = (id, field, value) => {
    onUpdate('features', character.features.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const removeFeature = (id) => {
    onUpdate('features', character.features.filter(f => f.id !== id));
  };

  // Get character's classes for class-specific features
  const characterClasses = character.classes?.length > 0 
    ? character.classes.map(c => c.name) 
    : character.class ? [character.class] : [];

  const updateClassFeature = (featureName, value) => {
    onUpdate('classFeatures', { ...(character.classFeatures || {}), [featureName]: value });
  };

  return (
    <div className="space-y-6">
      {/* Class-Specific Features (2024 PHB) */}
      {characterClasses.length > 0 && (
        <div className="bg-stone-800 rounded-lg p-4">
          <h3 className="text-sm font-bold text-amber-400 mb-3">Class Features (2024 PHB)</h3>
          <div className="space-y-4">
            {characterClasses.map(className => {
              const classFeatures = CLASS_FEATURES[className];
              if (!classFeatures) return null;
              
              return (
                <div key={className} className="space-y-3">
                  <div className="text-sm font-medium text-stone-300 border-b border-stone-700 pb-1">{className}</div>
                  {Object.entries(classFeatures).map(([featureName, feature]) => (
                    <div key={featureName} className="pl-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-stone-400">{featureName}</span>
                        <span className="text-xs text-stone-600">(Level {feature.level})</span>
                        {feature.note && <span className="text-xs text-stone-500 italic">- {feature.note}</span>}
                      </div>
                      {feature.options.length > 0 && (
                        <select
                          value={character.classFeatures?.[`${className}:${featureName}`] || ''}
                          onChange={(e) => updateClassFeature(`${className}:${featureName}`, e.target.value)}
                          className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                        >
                          <option value="">-- Select --</option>
                          {feature.options.map(opt => (
                            <option key={opt.name} value={opt.name}>{opt.name} - {opt.description}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Features */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-stone-400">Other Features & Traits</h3>
          <button onClick={addFeature} className="px-3 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-xs flex items-center gap-1">
            <Icons.Plus /> Add Feature
          </button>
        </div>
        
        <div className="space-y-3">
          {(character.features || []).map(feature => (
            <div key={feature.id} className="bg-stone-800 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <input type="text" value={feature.name} onChange={(e) => updateFeature(feature.id, 'name', e.target.value)}
                  className="bg-transparent font-bold focus:outline-none flex-1" placeholder="Feature name" />
                <input type="text" value={feature.source} onChange={(e) => updateFeature(feature.id, 'source', e.target.value)}
                  className="bg-stone-700 rounded px-2 py-0.5 text-xs text-stone-400 w-32 focus:outline-none" placeholder="Source" />
                <button onClick={() => removeFeature(feature.id)} className="text-red-500 hover:text-red-400">×</button>
              </div>
              <textarea value={feature.description} onChange={(e) => updateFeature(feature.id, 'description', e.target.value)}
                className="w-full bg-transparent text-sm text-stone-300 focus:outline-none resize-none" rows={2} placeholder="Description..." />
            </div>
          ))}
        </div>
        {(character.features || []).length === 0 && <div className="text-center text-stone-500 py-4">No custom features yet.</div>}
      </div>
    </div>
  );
}

// Background Tab
export function BackgroundTab({ character, onUpdate }) {
  const selectedBackground = BACKGROUNDS.find(b => b.name === character.background);

  const handleBackgroundChange = (backgroundName) => {
    onUpdate('background', backgroundName);
    
    // Optionally apply skill proficiencies from background
    const bg = BACKGROUNDS.find(b => b.name === backgroundName);
    if (bg && bg.skills) {
      // Show which skills the background grants (user can apply them in proficiency modal)
    }
  };

  const applyBackgroundSkills = () => {
    if (!selectedBackground) return;
    const currentProfs = { ...(character.skillProficiencies || {}) };
    selectedBackground.skills.forEach(skill => {
      if (!currentProfs[skill]) {
        currentProfs[skill] = 1; // Set to proficient
      }
    });
    onUpdate('skillProficiencies', currentProfs);
  };

  return (
    <div className="space-y-6">
      {/* Background Selection */}
      <div className="bg-stone-800 rounded-lg p-4">
        <h3 className="text-sm font-bold text-amber-400 mb-3">Background (2024)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-stone-500">Select Background</label>
            <select 
              value={character.background || ''} 
              onChange={(e) => handleBackgroundChange(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="">-- Select --</option>
              {BACKGROUNDS.map(bg => (
                <option key={bg.name} value={bg.name}>{bg.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-stone-500">Or Custom</label>
            <input 
              type="text" 
              value={character.background || ''} 
              onChange={(e) => onUpdate('background', e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 focus:outline-none focus:border-amber-500" 
              placeholder="Type custom background..." 
            />
          </div>
        </div>
        
        {selectedBackground && (
          <div className="mt-3 p-3 bg-stone-900 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500">Skill Proficiencies: </span>
                <span className="text-sm text-emerald-400">{selectedBackground.skills.join(', ')}</span>
              </div>
              <button 
                onClick={applyBackgroundSkills}
                className="px-3 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-xs text-emerald-200"
              >
                Apply Skills
              </button>
            </div>
            <div>
              <span className="text-xs text-stone-500">Origin Feat: </span>
              <span className="text-sm text-purple-400">{selectedBackground.feat}</span>
            </div>
            <div>
              <span className="text-xs text-stone-500">Ability Score Options: </span>
              <span className="text-xs text-amber-400">{selectedBackground.abilities.join(', ')}</span>
              <span className="text-xs text-stone-600 ml-2">(+2/+1 or +1/+1/+1)</span>
            </div>
          </div>
        )}
      </div>

      {/* Character Details */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-stone-500">Race / Species</label>
          <input type="text" value={character.race || ''} onChange={(e) => onUpdate('race', e.target.value)}
            className="w-full bg-stone-800 rounded px-3 py-2 focus:outline-none" placeholder="e.g., Human, Elf..." />
        </div>
        <div>
          <label className="text-xs text-stone-500">Alignment</label>
          <input type="text" value={character.alignment || ''} onChange={(e) => onUpdate('alignment', e.target.value)}
            className="w-full bg-stone-800 rounded px-3 py-2 focus:outline-none" placeholder="e.g., Neutral Good" />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-stone-500">Languages</label>
          <input type="text" value={character.languages || ''} onChange={(e) => onUpdate('languages', e.target.value)}
            className="w-full bg-stone-800 rounded px-3 py-2 focus:outline-none" placeholder="Common, Elvish..." />
        </div>
      </div>

      {/* Personality */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-stone-400">Personality</h3>
        <div>
          <label className="text-xs text-stone-500">Personality Traits</label>
          <textarea value={character.personality || ''} onChange={(e) => onUpdate('personality', e.target.value)}
            className="w-full bg-stone-800 rounded px-3 py-2 h-20 resize-none focus:outline-none" placeholder="Personality traits..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-stone-500">Ideals</label>
            <textarea value={character.ideals || ''} onChange={(e) => onUpdate('ideals', e.target.value)}
              className="w-full bg-stone-800 rounded px-3 py-2 h-16 resize-none focus:outline-none" placeholder="Ideals..." />
          </div>
          <div>
            <label className="text-xs text-stone-500">Bonds</label>
            <textarea value={character.bonds || ''} onChange={(e) => onUpdate('bonds', e.target.value)}
              className="w-full bg-stone-800 rounded px-3 py-2 h-16 resize-none focus:outline-none" placeholder="Bonds..." />
          </div>
        </div>
        <div>
          <label className="text-xs text-stone-500">Flaws</label>
          <textarea value={character.flaws || ''} onChange={(e) => onUpdate('flaws', e.target.value)}
            className="w-full bg-stone-800 rounded px-3 py-2 h-16 resize-none focus:outline-none" placeholder="Flaws..." />
        </div>
      </div>
    </div>
  );
}

// Notes Tab
export function NotesTab({ character, onUpdate }) {
  return (
    <div>
      <textarea value={character.notes || ''} onChange={(e) => onUpdate('notes', e.target.value)}
        className="w-full bg-stone-800 rounded px-4 py-3 h-[450px] resize-none focus:outline-none"
        placeholder="Session notes, character backstory, goals, etc..." />
    </div>
  );
}
