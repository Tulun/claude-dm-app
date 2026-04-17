'use client';

import { useState } from 'react';
import Icons from '../../../components/Icons';
import { CLASS_FEATURES, SUBCLASS_FEATURES } from '../constants';
import { FEATS, FEAT_CATEGORIES, getFeat } from '../feats';

// Feat Picker Modal
function FeatPickerModal({ isOpen, onClose, onSelect, existingFeats }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  if (!isOpen) return null;
  
  const existingFeatNames = existingFeats.map(f => f.name);
  
  const filteredFeats = FEATS.filter(feat => {
    const matchesSearch = !search || 
      feat.name.toLowerCase().includes(search.toLowerCase()) ||
      feat.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || feat.category === categoryFilter;
    // Allow repeatable feats or feats not already taken
    const notTaken = feat.repeatable || !existingFeatNames.includes(feat.name);
    return matchesSearch && matchesCategory && notTaken;
  });
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-emerald-700 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-stone-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-emerald-400">Add Feat or Feature</h2>
            <button onClick={onClose} className="text-stone-400 hover:text-white">
              <Icons.X />
            </button>
          </div>
          
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search feats..."
            className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:border-emerald-600"
            autoFocus
          />
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCategoryFilter('All')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                categoryFilter === 'All' ? 'bg-emerald-700 text-white' : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
              }`}
            >
              All
            </button>
            {FEAT_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  categoryFilter === cat ? 'bg-emerald-700 text-white' : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredFeats.length === 0 ? (
            <p className="text-center text-stone-500 py-8">No matching feats found.</p>
          ) : (
            filteredFeats.map(feat => (
              <button
                key={feat.name}
                onClick={() => { onSelect(feat); onClose(); }}
                className="w-full text-left p-3 rounded-lg border border-stone-700 bg-stone-800/50 hover:border-emerald-600 hover:bg-stone-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-emerald-400">{feat.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    feat.category === 'Origin' ? 'bg-blue-900/50 text-blue-300' :
                    feat.category === 'General' ? 'bg-amber-900/50 text-amber-300' :
                    feat.category === 'Fighting Style' ? 'bg-red-900/50 text-red-300' :
                    'bg-purple-900/50 text-purple-300'
                  }`}>
                    {feat.category}
                    {feat.repeatable && ' *'}
                  </span>
                </div>
                {feat.prerequisite && (
                  <p className="text-xs text-cyan-400 mb-1">Prerequisite: {feat.prerequisite}</p>
                )}
                <p className="text-xs text-stone-400 line-clamp-2">{feat.description}</p>
              </button>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-stone-700 flex justify-between items-center">
          <button
            onClick={() => { onSelect({ name: '', description: '', source: 'Custom', custom: true }); onClose(); }}
            className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-sm"
          >
            + Add Custom Feature
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Multi-select component with tooltip support
function MultiSelectWithTooltips({ 
  feature, featureKey, selectedOptions, maxSelections, currentValue, 
  isExpanded, toggleExpanded, toggleMultiSelectOption 
}) {
  const [tooltipInfo, setTooltipInfo] = useState(null);

  const handleMouseEnter = (e, opt) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipInfo({ text: opt.description, x: rect.left, y: rect.top - 4 });
  };

  const handleMouseLeave = () => setTooltipInfo(null);

  return (
    <div className="bg-stone-900 border border-amber-700 rounded overflow-hidden">
      {tooltipInfo && (
        <div className="fixed z-[99999] bg-stone-950 border border-stone-600 rounded px-3 py-2 text-xs text-stone-200 shadow-xl pointer-events-none"
          style={{ left: Math.min(tooltipInfo.x, window.innerWidth - 300), top: tooltipInfo.y, transform: 'translateY(-100%)', maxWidth: 280 }}>
          {tooltipInfo.text}
        </div>
      )}

      <button onClick={() => toggleExpanded(featureKey)} className="w-full px-3 py-2 flex items-center justify-between hover:bg-stone-800 transition-colors">
        <div className="flex-1 text-left">
          {selectedOptions.length === 0 ? (
            <span className="text-stone-500 text-sm">Click to select options...</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {selectedOptions.map(name => {
                const opt = feature.options.find(o => o.name === name);
                return (
                  <span key={name} className="text-xs bg-amber-700 text-amber-100 px-2 py-0.5 rounded cursor-help"
                    onMouseEnter={(e) => { e.stopPropagation(); handleMouseEnter(e, opt); }} onMouseLeave={handleMouseLeave}>
                    {name}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 ml-2">
          <span className={`text-xs px-1.5 py-0.5 rounded ${selectedOptions.length === maxSelections ? 'bg-emerald-900/50 text-emerald-400' : 'bg-cyan-900/30 text-cyan-400'}`}>
            {selectedOptions.length}/{maxSelections}
          </span>
          <span className={`text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>
      
      {isExpanded && (
        <div className="border-t border-stone-700 p-2 space-y-1 max-h-64 overflow-y-auto">
          {feature.options.map(opt => {
            const isSelected = selectedOptions.includes(opt.name);
            const canSelect = isSelected || selectedOptions.length < maxSelections;
            return (
              <label key={opt.name} className={`flex items-start gap-2 p-2 rounded cursor-pointer transition-colors ${
                isSelected ? 'bg-amber-900/50 border border-amber-700' : canSelect ? 'hover:bg-stone-800 border border-transparent' : 'opacity-40 cursor-not-allowed border border-transparent'
              }`} onMouseEnter={(e) => handleMouseEnter(e, opt)} onMouseLeave={handleMouseLeave}>
                <input type="checkbox" checked={isSelected} disabled={!canSelect}
                  onChange={() => toggleMultiSelectOption(featureKey, opt.name, currentValue, maxSelections)} className="mt-0.5 accent-amber-500" />
                <div className="flex-1 min-w-0">
                  <span className={`text-sm ${isSelected ? 'text-amber-200 font-medium' : 'text-stone-300'}`}>{opt.name}</span>
                  <p className="text-xs text-stone-500">{opt.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FeaturesTab({ character, onUpdate }) {
  const [expandedMultiSelects, setExpandedMultiSelects] = useState({});
  const [showFeatPicker, setShowFeatPicker] = useState(false);
  const [expandedFeature, setExpandedFeature] = useState(null);

  const addFeature = (feat) => {
    const newFeature = { 
      id: Date.now(), 
      name: feat.name || '', 
      description: feat.description || '', 
      source: feat.source || feat.category || '',
      category: feat.category,
      prerequisite: feat.prerequisite,
      custom: feat.custom || false
    };
    onUpdate('features', [...(character.features || []), newFeature]);
  };

  const updateFeature = (id, field, value) => {
    onUpdate('features', character.features.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const removeFeature = (id) => {
    onUpdate('features', character.features.filter(f => f.id !== id));
  };

  const characterClasses = character.classes?.length > 0 
    ? character.classes 
    : character.class ? [{ name: character.class, level: character.level || 1, subclass: character.subclass }] : [];

  const updateClassFeature = (featureName, value) => {
    onUpdate('classFeatures', { ...(character.classFeatures || {}), [featureName]: value });
  };

  const updateSubclassChoice = (choiceKey, value) => {
    onUpdate('subclassChoices', { ...(character.subclassChoices || {}), [choiceKey]: value });
  };

  const getMaxSelections = (multiSelect, classLevel) => {
    if (!multiSelect) return 1;
    if (multiSelect.base !== undefined) {
      if (classLevel >= 17 && multiSelect.level17) return multiSelect.level17;
      if (classLevel >= 10 && multiSelect.level10) return multiSelect.level10;
      return multiSelect.base;
    }
    let max = 0;
    Object.entries(multiSelect).forEach(([key, value]) => {
      const level = parseInt(key.replace('level', ''));
      if (classLevel >= level) max = value;
    });
    return max;
  };

  const toggleMultiSelectOption = (featureKey, optionName, currentSelections, maxSelections) => {
    const selections = currentSelections ? currentSelections.split(',').filter(Boolean) : [];
    const index = selections.indexOf(optionName);
    if (index >= 0) selections.splice(index, 1);
    else if (selections.length < maxSelections) selections.push(optionName);
    updateClassFeature(featureKey, selections.join(','));
  };

  const toggleExpanded = (featureKey) => {
    setExpandedMultiSelects(prev => ({ ...prev, [featureKey]: !prev[featureKey] }));
  };

  return (
    <div className="space-y-6">
      {characterClasses.length > 0 && (
        <div className="bg-stone-800 rounded-lg p-4">
          <h3 className="text-sm font-bold text-amber-400 mb-3">Class Features (2024 PHB)</h3>
          <div className="space-y-4">
            {characterClasses.map(cls => {
              const classFeatures = CLASS_FEATURES[cls.name];
              if (!classFeatures) return null;
              const classLevel = cls.level || 1;
              const unlockedFeatures = Object.entries(classFeatures).filter(([, f]) => f.level <= classLevel);
              const lockedFeatures = Object.entries(classFeatures).filter(([, f]) => f.level > classLevel);
              
              return (
                <div key={cls.name} className="space-y-3">
                  <div className="text-sm font-medium text-stone-300 border-b border-stone-700 pb-1">
                    {cls.name} <span className="text-stone-500">Level {classLevel}</span>
                  </div>
                  
                  {unlockedFeatures.map(([featureName, feature]) => {
                    const featureKey = `${cls.name}:${featureName}`;
                    const isMultiSelect = feature.multiSelect;
                    const maxSelections = isMultiSelect ? getMaxSelections(feature.multiSelect, classLevel) : 1;
                    const currentValue = character.classFeatures?.[featureKey] || '';
                    const selectedOptions = currentValue ? currentValue.split(',').filter(Boolean) : [];
                    const isExpanded = expandedMultiSelects[featureKey];
                    
                    return (
                      <div key={featureName} className="pl-2 border-l-2 border-amber-800/50">
                        <div className="flex items-start gap-2 mb-1">
                          <span className="text-sm font-medium text-amber-200">{featureName}</span>
                          <span className="text-xs text-amber-600 bg-amber-900/50 px-1.5 rounded">Lv {feature.level}</span>
                        </div>
                        {feature.note && <p className="text-xs text-stone-400 mb-2">{feature.note}</p>}
                        
                        {feature.options && feature.options.length > 0 && !isMultiSelect && (
                          <select value={currentValue} onChange={(e) => updateClassFeature(featureKey, e.target.value)}
                            className="w-full bg-stone-900 border border-amber-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500">
                            <option value="">-- Select --</option>
                            {feature.options.map(opt => <option key={opt.name} value={opt.name}>{opt.name} - {opt.description}</option>)}
                          </select>
                        )}
                        
                        {feature.options && feature.options.length > 0 && isMultiSelect && (
                          <MultiSelectWithTooltips feature={feature} featureKey={featureKey} selectedOptions={selectedOptions}
                            maxSelections={maxSelections} currentValue={currentValue} isExpanded={isExpanded}
                            toggleExpanded={toggleExpanded} toggleMultiSelectOption={toggleMultiSelectOption} />
                        )}
                      </div>
                    );
                  })}
                  
                  {lockedFeatures.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-stone-700">
                      <span className="text-xs text-stone-600">Future: </span>
                      <span className="text-xs text-stone-500">{lockedFeatures.map(([name, f]) => `${name} (Lv ${f.level})`).join(', ')}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {characterClasses.some(cls => cls.subclass && SUBCLASS_FEATURES[cls.subclass]) && (
        <div className="bg-purple-900/30 border border-purple-800/50 rounded-lg p-4">
          <h3 className="text-sm font-bold text-purple-400 mb-3">Subclass Features</h3>
          <div className="space-y-4">
            {characterClasses.map(cls => {
              if (!cls.subclass) return null;
              const subclassData = SUBCLASS_FEATURES[cls.subclass];
              if (!subclassData) return null;
              const classLevel = cls.level || 1;
              
              return (
                <div key={cls.subclass} className="space-y-3">
                  <div className="text-sm font-medium text-purple-300 border-b border-purple-800/50 pb-1">
                    {cls.subclass} <span className="text-stone-500">({cls.name} {classLevel})</span>
                  </div>
                  
                  {subclassData.features.filter(feature => feature.level <= classLevel).map((feature, idx) => (
                    <div key={idx} className="pl-2 border-l-2 border-purple-800/50">
                      <div className="flex items-start gap-2 mb-1">
                        <span className="text-sm font-medium text-purple-200">{feature.name}</span>
                        <span className="text-xs text-purple-600 bg-purple-900/50 px-1.5 rounded">Lv {feature.level}</span>
                      </div>
                      <p className="text-xs text-stone-400 mb-2">{feature.description}</p>
                      
                      {feature.choice && subclassData.choices?.[feature.choice] && (
                        <div className="mt-2">
                          <label className="text-xs text-purple-400 mb-1 block">{subclassData.choices[feature.choice].label}:</label>
                          <select value={character.subclassChoices?.[`${cls.subclass}:${feature.choice}`] || ''}
                            onChange={(e) => updateSubclassChoice(`${cls.subclass}:${feature.choice}`, e.target.value)}
                            className="w-full bg-stone-900 border border-purple-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500">
                            <option value="">-- Select --</option>
                            {subclassData.choices[feature.choice].options.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
                          </select>
                          {character.subclassChoices?.[`${cls.subclass}:${feature.choice}`] && (
                            <p className="text-xs text-purple-300 mt-1 bg-purple-900/30 rounded p-2">
                              {subclassData.choices[feature.choice].options.find(o => o.name === character.subclassChoices[`${cls.subclass}:${feature.choice}`])?.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {subclassData.features.filter(f => f.level > classLevel).length > 0 && (
                    <div className="mt-3 pt-2 border-t border-purple-900/50">
                      <span className="text-xs text-stone-600">Future features: </span>
                      <span className="text-xs text-stone-500">{subclassData.features.filter(f => f.level > classLevel).map(f => `${f.name} (Lv ${f.level})`).join(', ')}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-stone-400">Feats & Other Features</h3>
          <button onClick={() => setShowFeatPicker(true)} className="px-3 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-xs flex items-center gap-1">
            <Icons.Plus /> Add Feat/Feature
          </button>
        </div>
        
        <div className="space-y-2">
          {(character.features || []).map(feature => {
            const isExpanded = expandedFeature === feature.id;
            const isCustom = feature.custom || (!feature.category && !getFeat(feature.name));
            
            return (
              <div key={feature.id} className={`rounded-lg border transition-colors ${
                feature.category === 'Origin' ? 'bg-blue-900/20 border-blue-800/50' :
                feature.category === 'General' ? 'bg-amber-900/20 border-amber-800/50' :
                feature.category === 'Fighting Style' ? 'bg-red-900/20 border-red-800/50' :
                feature.category === 'Epic Boon' ? 'bg-purple-900/20 border-purple-800/50' :
                'bg-stone-800 border-stone-700'
              }`}>
                {isCustom ? (
                  // Editable custom feature
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <input type="text" value={feature.name} onChange={(e) => updateFeature(feature.id, 'name', e.target.value)}
                        className="bg-transparent font-bold focus:outline-none flex-1" placeholder="Feature name" />
                      <input type="text" value={feature.source || ''} onChange={(e) => updateFeature(feature.id, 'source', e.target.value)}
                        className="bg-stone-700 rounded px-2 py-0.5 text-xs text-stone-400 w-32 focus:outline-none" placeholder="Source" />
                      <button onClick={() => removeFeature(feature.id)} className="text-red-500 hover:text-red-400">×</button>
                    </div>
                    <textarea value={feature.description || ''} onChange={(e) => updateFeature(feature.id, 'description', e.target.value)}
                      className="w-full bg-transparent text-sm text-stone-300 focus:outline-none resize-none" rows={2} placeholder="Description..." />
                  </div>
                ) : (
                  // Standard feat display
                  <>
                    <button 
                      onClick={() => setExpandedFeature(isExpanded ? null : feature.id)}
                      className="w-full p-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                          feature.category === 'Origin' ? 'text-blue-300' :
                          feature.category === 'General' ? 'text-amber-300' :
                          feature.category === 'Fighting Style' ? 'text-red-300' :
                          feature.category === 'Epic Boon' ? 'text-purple-300' :
                          'text-stone-200'
                        }`}>{feature.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          feature.category === 'Origin' ? 'bg-blue-900/50 text-blue-400' :
                          feature.category === 'General' ? 'bg-amber-900/50 text-amber-400' :
                          feature.category === 'Fighting Style' ? 'bg-red-900/50 text-red-400' :
                          feature.category === 'Epic Boon' ? 'bg-purple-900/50 text-purple-400' :
                          'bg-stone-700 text-stone-400'
                        }`}>
                          {feature.category || feature.source || 'Feature'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeFeature(feature.id); }}
                          className="text-red-500 hover:text-red-400 p-1"
                        >
                          <Icons.Trash />
                        </button>
                        <span className={`text-stone-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-stone-700/50">
                        {feature.prerequisite && (
                          <p className="text-xs text-cyan-400 mt-2">Prerequisite: {feature.prerequisite}</p>
                        )}
                        <p className="text-sm text-stone-300 mt-2">{feature.description}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
        {(character.features || []).length === 0 && (
          <div className="text-center text-stone-500 py-8">
            <p>No feats or features added yet.</p>
            <button 
              onClick={() => setShowFeatPicker(true)}
              className="mt-2 text-emerald-400 hover:text-emerald-300 text-sm"
            >
              + Add your first feat
            </button>
          </div>
        )}
      </div>

      <FeatPickerModal 
        isOpen={showFeatPicker} 
        onClose={() => setShowFeatPicker(false)} 
        onSelect={addFeature}
        existingFeats={character.features || []}
      />
    </div>
  );
}
