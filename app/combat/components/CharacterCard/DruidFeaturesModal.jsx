'use client';

import { useState } from 'react';
import Icons from '../../../components/Icons';

// Parse CR string to number for sorting
function parseCR(cr) {
  if (typeof cr === 'number') return cr;
  if (cr === '1/8') return 0.125;
  if (cr === '1/4') return 0.25;
  if (cr === '1/2') return 0.5;
  return parseFloat(cr) || 0;
}

function getMod(score) {
  const mod = Math.floor(((parseInt(score) || 10) - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export default function DruidFeaturesModal({ isOpen, onClose, character, onUpdate }) {
  const [sortBy, setSortBy] = useState('name');
  
  if (!isOpen) return null;

  const resources = character.resources || [];
  const wildShapeForms = character.wildShapeForms || [];
  
  // Find wild shape resource
  const wildShapeResource = resources.find(r => 
    r.name.toLowerCase().includes('wild shape')
  );
  const wildShapeUses = wildShapeResource?.current || 0;
  const wildShapeMax = wildShapeResource?.max || 2;

  // Get druid level
  const getDruidLevel = () => {
    if (character.classes) {
      const druid = character.classes.find(c => c.name?.toLowerCase() === 'druid');
      return druid ? parseInt(druid.level) || 0 : 0;
    }
    return character.class?.toLowerCase() === 'druid' ? parseInt(character.level) || 0 : 0;
  };
  const druidLevel = getDruidLevel();

  // Active form
  const activeForm = character.wildShapeActive 
    ? wildShapeForms.find(f => f.id === character.wildShapeFormId)
    : null;

  const activateWildShape = (formId) => {
    const form = wildShapeForms.find(f => f.id === formId);
    if (!form) return;

    // Reset form HP when transforming
    const updatedForms = wildShapeForms.map(f => 
      f.id === formId ? { ...f, currentHp: f.maxHp || 1 } : f
    );

    // Decrement wild shape uses
    let updatedResources = resources;
    if (wildShapeResource && wildShapeResource.current > 0) {
      const idx = resources.findIndex(r => r.id === wildShapeResource.id);
      updatedResources = [...resources];
      updatedResources[idx] = { ...wildShapeResource, current: wildShapeResource.current - 1 };
    }

    onUpdate({
      ...character,
      resources: updatedResources,
      wildShapeForms: updatedForms,
      wildShapeActive: true,
      wildShapeFormId: formId
    });
  };

  const deactivateWildShape = () => {
    onUpdate({
      ...character,
      wildShapeActive: false,
      wildShapeFormId: null
    });
  };

  const updateWildShapeUses = (delta) => {
    if (!wildShapeResource) return;
    const newCurrent = Math.max(0, Math.min(wildShapeMax, wildShapeUses + delta));
    const idx = resources.findIndex(r => r.id === wildShapeResource.id);
    const updatedResources = [...resources];
    updatedResources[idx] = { ...wildShapeResource, current: newCurrent };
    onUpdate({ ...character, resources: updatedResources });
  };

  const sortedForms = [...wildShapeForms].sort((a, b) => {
    if (sortBy === 'cr') {
      return parseCR(a.cr) - parseCR(b.cr);
    }
    return (a.name || '').localeCompare(b.name || '');
  });

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-lime-700 rounded-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-stone-700 bg-gradient-to-r from-lime-950/50 to-stone-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🐾</span>
              <div>
                <h2 className="text-lg font-bold text-lime-400">Wild Shape</h2>
                <p className="text-xs text-stone-400">Druid {druidLevel}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-stone-400 hover:text-white">
              <Icons.X />
            </button>
          </div>

          {/* Uses Counter */}
          <div className="mt-3 flex items-center justify-between bg-stone-800/50 rounded-lg p-3">
            <span className="text-stone-300">Uses Remaining</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => updateWildShapeUses(-1)}
                disabled={wildShapeUses <= 0}
                className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600 disabled:opacity-50"
              >−</button>
              <div className="flex gap-1">
                {Array.from({ length: wildShapeMax }, (_, i) => (
                  <div 
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 ${
                      i < wildShapeUses 
                        ? 'bg-lime-500 border-lime-400' 
                        : 'bg-stone-700 border-stone-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-stone-400 w-12 text-center">{wildShapeUses}/{wildShapeMax}</span>
              <button 
                onClick={() => updateWildShapeUses(1)}
                disabled={wildShapeUses >= wildShapeMax}
                className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600 disabled:opacity-50"
              >+</button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Active Form */}
          {activeForm && (
            <div className="p-4 rounded-lg border-2 border-lime-500 bg-lime-950/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lime-400 text-lg">{activeForm.name}</h3>
                  <div className="text-sm text-stone-400 flex gap-3">
                    <span>CR {activeForm.cr}</span>
                    <span>AC {activeForm.ac}</span>
                    <span>{activeForm.speed}</span>
                  </div>
                </div>
                <button
                  onClick={deactivateWildShape}
                  className="px-4 py-2 rounded-lg bg-red-800 hover:bg-red-700 text-sm"
                >
                  End Form
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-6 gap-2 text-center">
                {['str', 'dex', 'con'].map(stat => (
                  <div key={stat} className="bg-lime-900/50 rounded p-2">
                    <div className="text-[10px] text-lime-500 uppercase">{stat}</div>
                    <div className="font-bold text-lime-400">{activeForm[stat]}</div>
                    <div className="text-xs text-lime-400/70">{getMod(activeForm[stat])}</div>
                  </div>
                ))}
                {['int', 'wis', 'cha'].map(stat => (
                  <div key={stat} className="bg-stone-800/50 rounded p-2">
                    <div className="text-[10px] text-stone-500 uppercase">{stat}</div>
                    <div className="font-bold text-amber-400">{character[stat]}</div>
                    <div className="text-xs text-amber-400/70">{getMod(character[stat])}</div>
                  </div>
                ))}
              </div>

              {/* Senses */}
              {activeForm.senses && (
                <div className="mt-3 text-sm">
                  <span className="text-stone-500">Senses:</span> <span className="text-stone-300">{activeForm.senses}</span>
                </div>
              )}

              {/* Traits & Actions */}
              {activeForm.traits && activeForm.traits.length > 0 && (
                <div className="mt-3 text-sm space-y-1">
                  <div className="text-stone-500 text-xs uppercase">Traits</div>
                  {activeForm.traits.map((t, i) => (
                    <p key={i}><span className="text-amber-400">{t.name}.</span> {t.description}</p>
                  ))}
                </div>
              )}
              {activeForm.actions && activeForm.actions.length > 0 && (
                <div className="mt-3 text-sm space-y-1">
                  <div className="text-stone-500 text-xs uppercase">Actions</div>
                  {activeForm.actions.map((a, i) => (
                    <p key={i}><span className="text-red-400">{a.name}.</span> {a.description}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Beast Forms List */}
          {!activeForm && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-stone-300 font-medium">Known Beast Forms</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSortBy('name')}
                    className={`px-2 py-1 rounded text-xs ${sortBy === 'name' ? 'bg-lime-700' : 'bg-stone-700'}`}
                  >Name</button>
                  <button
                    onClick={() => setSortBy('cr')}
                    className={`px-2 py-1 rounded text-xs ${sortBy === 'cr' ? 'bg-lime-700' : 'bg-stone-700'}`}
                  >CR</button>
                </div>
              </div>

              {wildShapeForms.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  <p>No beast forms learned.</p>
                  <p className="text-xs mt-1">Add forms in the character's Wild Shape tab.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedForms.map(form => (
                    <button
                      key={form.id}
                      onClick={() => wildShapeUses > 0 && activateWildShape(form.id)}
                      disabled={wildShapeUses <= 0}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        wildShapeUses <= 0 
                          ? 'border-stone-700 bg-stone-800/30 text-stone-500 cursor-not-allowed'
                          : 'border-stone-700 bg-stone-800/50 hover:border-lime-600 hover:bg-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${wildShapeUses > 0 ? 'text-lime-400' : 'text-stone-500'}`}>
                          {form.name}
                        </span>
                        <span className="text-xs text-stone-500">CR {form.cr || '?'}</span>
                      </div>
                      <div className="text-xs text-stone-400 mt-1 flex gap-3">
                        <span>AC {form.ac}</span>
                        <span>HP {form.maxHp}</span>
                        <span>{form.speed}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-700">
          <p className="text-xs text-stone-500 text-center">
            Duration: {Math.floor(druidLevel / 2)} hours • End as Bonus Action or if Incapacitated
          </p>
        </div>
      </div>
    </div>
  );
}
