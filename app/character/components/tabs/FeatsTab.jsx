'use client';

import { useState } from 'react';
import Icons from '../../../components/Icons';
import { FEATS, FEAT_CATEGORIES, getFeat, ABILITY_LABELS } from '../feats';

function FeatPickerModal({ isOpen, onClose, onSelect, existingFeats, character }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedFeat, setSelectedFeat] = useState(null);
  const [selectedAbility, setSelectedAbility] = useState('');
  const [selectedAbility2, setSelectedAbility2] = useState('');
  const [asiMode, setAsiMode] = useState('single');
  
  if (!isOpen) return null;
  
  const existingFeatNames = existingFeats.map(f => f.name);
  
  const filteredFeats = FEATS.filter(feat => {
    const matchesSearch = !search || feat.name.toLowerCase().includes(search.toLowerCase()) || feat.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || feat.category === categoryFilter;
    const notTaken = feat.repeatable || !existingFeatNames.includes(feat.name);
    return matchesSearch && matchesCategory && notTaken;
  });

  const handleSelectFeat = (feat) => {
    setSelectedFeat(feat);
    setSelectedAbility('');
    setSelectedAbility2('');
    setAsiMode('single');
  };

  const handleConfirm = () => {
    if (!selectedFeat) return;
    const featData = { ...selectedFeat, chosenAbility: selectedAbility, chosenAbility2: asiMode === 'split' ? selectedAbility2 : null, asiMode: selectedFeat.abilityBoost?.special === 'asi' ? asiMode : null };
    onSelect(featData);
    setSelectedFeat(null);
    setSelectedAbility('');
    setSelectedAbility2('');
    onClose();
  };

  const canConfirm = () => {
    if (!selectedFeat) return false;
    if (!selectedFeat.abilityBoost) return true;
    if (selectedFeat.abilityBoost.special === 'asi') {
      if (asiMode === 'single') return !!selectedAbility;
      return !!selectedAbility && !!selectedAbility2 && selectedAbility !== selectedAbility2;
    }
    return !!selectedAbility;
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-emerald-700 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-stone-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-emerald-400">{selectedFeat ? 'Configure Feat' : 'Add Feat'}</h2>
            <button onClick={() => { setSelectedFeat(null); onClose(); }} className="text-stone-400 hover:text-white"><Icons.X /></button>
          </div>
          {!selectedFeat && (
            <>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search feats..." className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:border-emerald-600" autoFocus />
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setCategoryFilter('All')} className={`px-3 py-1 rounded text-xs transition-colors ${categoryFilter === 'All' ? 'bg-emerald-700 text-white' : 'bg-stone-700 text-stone-300 hover:bg-stone-600'}`}>All</button>
                {FEAT_CATEGORIES.map(cat => (<button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-3 py-1 rounded text-xs transition-colors ${categoryFilter === cat ? 'bg-emerald-700 text-white' : 'bg-stone-700 text-stone-300 hover:bg-stone-600'}`}>{cat}</button>))}
              </div>
            </>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {selectedFeat ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${selectedFeat.category === 'Origin' ? 'bg-blue-900/20 border-blue-800/50' : selectedFeat.category === 'General' ? 'bg-amber-900/20 border-amber-800/50' : selectedFeat.category === 'Fighting Style' ? 'bg-red-900/20 border-red-800/50' : selectedFeat.category === 'Epic Boon' ? 'bg-purple-900/20 border-purple-800/50' : 'bg-stone-800 border-stone-700'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-lg">{selectedFeat.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${selectedFeat.category === 'Origin' ? 'bg-blue-900/50 text-blue-400' : selectedFeat.category === 'General' ? 'bg-amber-900/50 text-amber-400' : selectedFeat.category === 'Fighting Style' ? 'bg-red-900/50 text-red-400' : selectedFeat.category === 'Epic Boon' ? 'bg-purple-900/50 text-purple-400' : 'bg-stone-700 text-stone-400'}`}>{selectedFeat.category}</span>
                </div>
                {selectedFeat.prerequisite && <p className="text-sm text-orange-400 mb-2">Prerequisite: {selectedFeat.prerequisite}</p>}
                <p className="text-sm text-stone-300">{selectedFeat.description}</p>
              </div>

              {selectedFeat.abilityBoost && (
                <div className="bg-lime-900/30 border border-lime-700/50 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-lime-400 mb-3">Ability Score Increase</h3>
                  {selectedFeat.abilityBoost.special === 'asi' ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <button onClick={() => setAsiMode('single')} className={`px-3 py-1.5 rounded text-sm ${asiMode === 'single' ? 'bg-lime-700 text-white' : 'bg-stone-700 text-stone-300'}`}>+2 to one ability</button>
                        <button onClick={() => setAsiMode('split')} className={`px-3 py-1.5 rounded text-sm ${asiMode === 'split' ? 'bg-lime-700 text-white' : 'bg-stone-700 text-stone-300'}`}>+1 to two abilities</button>
                      </div>
                      {asiMode === 'single' ? (
                        <div>
                          <label className="text-xs text-stone-400 mb-1 block">Choose ability (+2):</label>
                          <div className="flex flex-wrap gap-2">
                            {selectedFeat.abilityBoost.options.map(stat => (<button key={stat} onClick={() => setSelectedAbility(stat)} className={`px-3 py-2 rounded text-sm font-medium transition-colors ${selectedAbility === stat ? 'bg-lime-600 text-white' : 'bg-stone-700 text-stone-300 hover:bg-stone-600'}`}>{ABILITY_LABELS[stat]} {character[stat] && `(${character[stat]}→${character[stat] + 2})`}</button>))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div><label className="text-xs text-stone-400 mb-1 block">First ability (+1):</label><div className="flex flex-wrap gap-2">{selectedFeat.abilityBoost.options.map(stat => (<button key={stat} onClick={() => setSelectedAbility(stat)} disabled={selectedAbility2 === stat} className={`px-3 py-2 rounded text-sm font-medium transition-colors ${selectedAbility === stat ? 'bg-lime-600 text-white' : selectedAbility2 === stat ? 'bg-stone-800 text-stone-500 cursor-not-allowed' : 'bg-stone-700 text-stone-300 hover:bg-stone-600'}`}>{ABILITY_LABELS[stat]}</button>))}</div></div>
                          <div><label className="text-xs text-stone-400 mb-1 block">Second ability (+1):</label><div className="flex flex-wrap gap-2">{selectedFeat.abilityBoost.options.map(stat => (<button key={stat} onClick={() => setSelectedAbility2(stat)} disabled={selectedAbility === stat} className={`px-3 py-2 rounded text-sm font-medium transition-colors ${selectedAbility2 === stat ? 'bg-lime-600 text-white' : selectedAbility === stat ? 'bg-stone-800 text-stone-500 cursor-not-allowed' : 'bg-stone-700 text-stone-300 hover:bg-stone-600'}`}>{ABILITY_LABELS[stat]}</button>))}</div></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs text-stone-400 mb-2 block">Choose ability (+{selectedFeat.abilityBoost.amount}, max {selectedFeat.abilityBoost.max || 20}):</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedFeat.abilityBoost.options.map(stat => (<button key={stat} onClick={() => setSelectedAbility(stat)} className={`px-3 py-2 rounded text-sm font-medium transition-colors ${selectedAbility === stat ? 'bg-lime-600 text-white' : 'bg-stone-700 text-stone-300 hover:bg-stone-600'}`}>{ABILITY_LABELS[stat]} {character[stat] && `(${character[stat]}→${Math.min(character[stat] + selectedFeat.abilityBoost.amount, selectedFeat.abilityBoost.max || 20)})`}</button>))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setSelectedFeat(null)} className="flex-1 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-sm">← Back</button>
                <button onClick={handleConfirm} disabled={!canConfirm()} className={`flex-1 py-2 rounded-lg text-sm font-medium ${canConfirm() ? 'bg-emerald-700 hover:bg-emerald-600 text-white' : 'bg-stone-800 text-stone-500 cursor-not-allowed'}`}>Add Feat</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFeats.length === 0 ? (<p className="text-center text-stone-500 py-8">No matching feats found.</p>) : (
                filteredFeats.map(feat => (
                  <button key={feat.name + (feat.repeatable ? Math.random() : '')} onClick={() => handleSelectFeat(feat)} className="w-full text-left p-3 rounded-lg border border-stone-700 bg-stone-800/50 hover:border-emerald-600 hover:bg-stone-800 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-medium ${feat.category === 'Origin' ? 'text-blue-300' : feat.category === 'General' ? 'text-amber-300' : feat.category === 'Fighting Style' ? 'text-red-300' : feat.category === 'Epic Boon' ? 'text-purple-300' : 'text-stone-200'}`}>{feat.name}</span>
                      <div className="flex items-center gap-2">
                        {feat.abilityBoost && <span className="text-xs px-1.5 py-0.5 rounded bg-lime-900/50 text-lime-400">+{feat.abilityBoost.special === 'asi' ? '2/+1+1' : feat.abilityBoost.amount} {feat.abilityBoost.options?.slice(0, 3).map(s => s.toUpperCase()).join('/')}{feat.abilityBoost.options?.length > 3 && '...'}</span>}
                        <span className={`text-xs px-2 py-0.5 rounded ${feat.category === 'Origin' ? 'bg-blue-900/50 text-blue-400' : feat.category === 'General' ? 'bg-amber-900/50 text-amber-400' : feat.category === 'Fighting Style' ? 'bg-red-900/50 text-red-400' : feat.category === 'Epic Boon' ? 'bg-purple-900/50 text-purple-400' : 'bg-stone-700 text-stone-400'}`}>{feat.category}</span>
                      </div>
                    </div>
                    {feat.prerequisite && <p className="text-xs text-orange-400 mb-1">Prerequisite: {feat.prerequisite}</p>}
                    <p className="text-sm text-stone-400 line-clamp-2">{feat.description}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        {!selectedFeat && (<div className="p-4 border-t border-stone-700"><button onClick={() => { onSelect({ name: '', description: '', custom: true }); onClose(); }} className="w-full py-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-sm text-stone-300">+ Add Custom Feature</button></div>)}
      </div>
    </div>
  );
}

export default function FeatsTab({ character, onUpdate }) {
  const [showFeatPicker, setShowFeatPicker] = useState(false);
  const [expandedFeature, setExpandedFeature] = useState(null);

  const addFeature = (feat) => {
    const newFeature = { id: Date.now(), name: feat.name || '', description: feat.description || '', source: feat.source || feat.category || '', category: feat.category, prerequisite: feat.prerequisite, abilityBoost: feat.abilityBoost, chosenAbility: feat.chosenAbility, chosenAbility2: feat.chosenAbility2, asiMode: feat.asiMode, custom: feat.custom || false };
    if (feat.chosenAbility && !feat.custom) {
      const boost = feat.abilityBoost?.special === 'asi' ? (feat.asiMode === 'single' ? 2 : 1) : (feat.abilityBoost?.amount || 1);
      const max = feat.abilityBoost?.max || 20;
      const currentVal = character[feat.chosenAbility] || 10;
      onUpdate(feat.chosenAbility, Math.min(currentVal + boost, max));
      if (feat.chosenAbility2) { const currentVal2 = character[feat.chosenAbility2] || 10; onUpdate(feat.chosenAbility2, Math.min(currentVal2 + 1, max)); }
    }
    onUpdate('features', [...(character.features || []), newFeature]);
  };

  const updateFeature = (id, field, value) => { onUpdate('features', character.features.map(f => f.id === id ? { ...f, [field]: value } : f)); };
  
  const removeFeature = (id) => {
    const feature = character.features.find(f => f.id === id);
    if (feature && feature.chosenAbility && !feature.custom) {
      // Reverse the stat boost
      const boost = feature.abilityBoost?.special === 'asi' ? (feature.asiMode === 'single' ? 2 : 1) : (feature.abilityBoost?.amount || 1);
      const currentVal = character[feature.chosenAbility] || 10;
      onUpdate(feature.chosenAbility, Math.max(currentVal - boost, 1));
      if (feature.chosenAbility2) {
        const currentVal2 = character[feature.chosenAbility2] || 10;
        onUpdate(feature.chosenAbility2, Math.max(currentVal2 - 1, 1));
      }
    }
    onUpdate('features', character.features.filter(f => f.id !== id));
  };
  
  const features = character.features || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-amber-400">Feats & Additional Features</h3>
        <button onClick={() => setShowFeatPicker(true)} className="px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-sm flex items-center gap-2"><Icons.Plus /> Add Feat</button>
      </div>

      {features.length === 0 ? (
        <div className="text-center text-stone-500 py-12 bg-stone-800/50 rounded-lg">
          <Icons.Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No feats or additional features yet.</p>
          <button onClick={() => setShowFeatPicker(true)} className="mt-3 text-emerald-400 hover:text-emerald-300 text-sm">+ Add your first feat</button>
        </div>
      ) : (
        <div className="space-y-2">
          {features.map(feature => {
            const isExpanded = expandedFeature === feature.id;
            const isCustom = feature.custom || (!feature.category && !getFeat(feature.name));
            return (
              <div key={feature.id} className={`rounded-lg border transition-colors ${feature.category === 'Origin' ? 'bg-blue-900/20 border-blue-800/50' : feature.category === 'General' ? 'bg-amber-900/20 border-amber-800/50' : feature.category === 'Fighting Style' ? 'bg-red-900/20 border-red-800/50' : feature.category === 'Epic Boon' ? 'bg-purple-900/20 border-purple-800/50' : 'bg-stone-800 border-stone-700'}`}>
                {isCustom ? (
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <input type="text" value={feature.name} onChange={(e) => updateFeature(feature.id, 'name', e.target.value)} className="bg-transparent font-bold focus:outline-none flex-1 text-stone-200" placeholder="Feature name" />
                      <input type="text" value={feature.source || ''} onChange={(e) => updateFeature(feature.id, 'source', e.target.value)} className="bg-stone-700 rounded px-2 py-0.5 text-xs text-stone-400 w-32 focus:outline-none" placeholder="Source" />
                      <button onClick={() => removeFeature(feature.id)} className="text-red-500 hover:text-red-400 text-xl">×</button>
                    </div>
                    <textarea value={feature.description || ''} onChange={(e) => updateFeature(feature.id, 'description', e.target.value)} className="w-full bg-stone-700/50 rounded p-2 text-sm text-stone-300 focus:outline-none resize-none" rows={3} placeholder="Description..." />
                  </div>
                ) : (
                  <>
                    <div onClick={() => setExpandedFeature(isExpanded ? null : feature.id)} className="w-full p-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium ${feature.category === 'Origin' ? 'text-blue-300' : feature.category === 'General' ? 'text-amber-300' : feature.category === 'Fighting Style' ? 'text-red-300' : feature.category === 'Epic Boon' ? 'text-purple-300' : 'text-stone-200'}`}>{feature.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${feature.category === 'Origin' ? 'bg-blue-900/50 text-blue-400' : feature.category === 'General' ? 'bg-amber-900/50 text-amber-400' : feature.category === 'Fighting Style' ? 'bg-red-900/50 text-red-400' : feature.category === 'Epic Boon' ? 'bg-purple-900/50 text-purple-400' : 'bg-stone-700 text-stone-400'}`}>{feature.category || feature.source}</span>
                        {feature.chosenAbility && <span className="text-xs px-2 py-0.5 rounded bg-lime-900/50 text-lime-400">+{feature.asiMode === 'single' ? '2' : '1'} {ABILITY_LABELS[feature.chosenAbility]?.slice(0,3).toUpperCase()}{feature.chosenAbility2 && `, +1 ${ABILITY_LABELS[feature.chosenAbility2]?.slice(0,3).toUpperCase()}`}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); removeFeature(feature.id); }} className="text-red-500 hover:text-red-400 p-1"><Icons.Trash /></button>
                        <Icons.ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                    {isExpanded && (<div className="px-3 pb-3 border-t border-stone-700/50">{feature.prerequisite && <p className="text-xs text-orange-400 mt-2">Prerequisite: {feature.prerequisite}</p>}<p className="text-sm text-stone-300 mt-2">{feature.description}</p></div>)}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
      <FeatPickerModal isOpen={showFeatPicker} onClose={() => setShowFeatPicker(false)} onSelect={addFeature} existingFeats={features} character={character} />
    </div>
  );
}
