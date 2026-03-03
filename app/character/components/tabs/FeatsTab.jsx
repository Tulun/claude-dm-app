'use client';

import { useState } from 'react';
import Icons from '../../../components/Icons';
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
            <h2 className="text-lg font-bold text-emerald-400">Add Feat</h2>
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
                key={feat.name + (feat.repeatable ? Math.random() : '')}
                onClick={() => { onSelect(feat); onClose(); }}
                className="w-full text-left p-3 rounded-lg border border-stone-700 bg-stone-800/50 hover:border-emerald-600 hover:bg-stone-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-medium ${
                    feat.category === 'Origin' ? 'text-blue-300' :
                    feat.category === 'General' ? 'text-amber-300' :
                    feat.category === 'Fighting Style' ? 'text-red-300' :
                    feat.category === 'Epic Boon' ? 'text-purple-300' :
                    'text-stone-200'
                  }`}>{feat.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    feat.category === 'Origin' ? 'bg-blue-900/50 text-blue-400' :
                    feat.category === 'General' ? 'bg-amber-900/50 text-amber-400' :
                    feat.category === 'Fighting Style' ? 'bg-red-900/50 text-red-400' :
                    feat.category === 'Epic Boon' ? 'bg-purple-900/50 text-purple-400' :
                    'bg-stone-700 text-stone-400'
                  }`}>{feat.category}</span>
                </div>
                {feat.prerequisite && (
                  <p className="text-xs text-orange-400 mb-1">Prerequisite: {feat.prerequisite}</p>
                )}
                <p className="text-sm text-stone-400 line-clamp-2">{feat.description}</p>
                {feat.repeatable && (
                  <span className="text-xs text-emerald-500 mt-1 inline-block">Repeatable</span>
                )}
              </button>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-stone-700">
          <button
            onClick={() => {
              onSelect({ name: '', description: '', custom: true });
              onClose();
            }}
            className="w-full py-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-sm text-stone-300"
          >
            + Add Custom Feature
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FeatsTab({ character, onUpdate }) {
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

  const features = character.features || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-amber-400">Feats & Additional Features</h3>
        <button 
          onClick={() => setShowFeatPicker(true)} 
          className="px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-sm flex items-center gap-2"
        >
          <Icons.Plus /> Add Feat
        </button>
      </div>

      {features.length === 0 ? (
        <div className="text-center text-stone-500 py-12 bg-stone-800/50 rounded-lg">
          <Icons.Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No feats or additional features yet.</p>
          <button 
            onClick={() => setShowFeatPicker(true)}
            className="mt-3 text-emerald-400 hover:text-emerald-300 text-sm"
          >
            + Add your first feat
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {features.map(feature => {
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
                      <input 
                        type="text" 
                        value={feature.name} 
                        onChange={(e) => updateFeature(feature.id, 'name', e.target.value)}
                        className="bg-transparent font-bold focus:outline-none flex-1 text-stone-200" 
                        placeholder="Feature name" 
                      />
                      <input 
                        type="text" 
                        value={feature.source || ''} 
                        onChange={(e) => updateFeature(feature.id, 'source', e.target.value)}
                        className="bg-stone-700 rounded px-2 py-0.5 text-xs text-stone-400 w-32 focus:outline-none" 
                        placeholder="Source" 
                      />
                      <button onClick={() => removeFeature(feature.id)} className="text-red-500 hover:text-red-400 text-xl">×</button>
                    </div>
                    <textarea 
                      value={feature.description || ''} 
                      onChange={(e) => updateFeature(feature.id, 'description', e.target.value)}
                      className="w-full bg-stone-700/50 rounded p-2 text-sm text-stone-300 focus:outline-none resize-none" 
                      rows={3} 
                      placeholder="Description..." 
                    />
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
                        }`}>{feature.category || feature.source}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeFeature(feature.id); }}
                          className="text-red-500 hover:text-red-400 p-1"
                        >
                          <Icons.Trash />
                        </button>
                        <Icons.ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-stone-700/50">
                        {feature.prerequisite && (
                          <p className="text-xs text-orange-400 mt-2">Prerequisite: {feature.prerequisite}</p>
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
      )}

      <FeatPickerModal 
        isOpen={showFeatPicker} 
        onClose={() => setShowFeatPicker(false)} 
        onSelect={addFeature}
        existingFeats={features}
      />
    </div>
  );
}
