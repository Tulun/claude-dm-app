'use client';

import { useState } from 'react';
import Icons from '../../../components/Icons';

const COMPANION_TYPES = [
  { id: 'familiar', name: 'Familiar', desc: 'Find Familiar spell (any caster)', color: 'purple' },
  { id: 'spirit_totem', name: 'Spirit Totem', desc: 'Circle of Shepherd spirit', color: 'teal' },
  { id: 'beast_companion', name: 'Beast Companion', desc: 'Animal companion or bonded beast', color: 'emerald' },
  { id: 'steed', name: 'Steed', desc: 'Find Steed or summoned mount', color: 'amber' },
  { id: 'homunculus', name: 'Homunculus', desc: 'Constructed servant', color: 'cyan' },
  { id: 'wildfire', name: 'Wildfire Spirit', desc: 'Elemental spirit companion', color: 'red' },
  { id: 'drake', name: 'Drake', desc: 'Draconic companion', color: 'orange' },
  { id: 'summon', name: 'Summon', desc: 'Summoned creature (spell)', color: 'blue' },
  { id: 'pet', name: 'Pet / Mount', desc: 'Non-magical companion or mount', color: 'stone' },
];

const FAMILIAR_FORMS = [
  'Bat', 'Cat', 'Crab', 'Frog/Toad', 'Hawk', 'Lizard', 'Octopus', 'Owl', 'Poisonous Snake',
  'Fish (Quipper)', 'Rat', 'Raven', 'Sea Horse', 'Spider', 'Weasel',
  'Imp', 'Pseudodragon', 'Quasit', 'Sprite',
];

const colorClasses = {
  purple: 'border-purple-700 bg-purple-900/20',
  teal: 'border-teal-700 bg-teal-900/20',
  emerald: 'border-emerald-700 bg-emerald-900/20',
  amber: 'border-amber-700 bg-amber-900/20',
  cyan: 'border-cyan-700 bg-cyan-900/20',
  red: 'border-red-700 bg-red-900/20',
  orange: 'border-orange-700 bg-orange-900/20',
  blue: 'border-blue-700 bg-blue-900/20',
  stone: 'border-stone-600 bg-stone-800',
};

const headerColors = {
  purple: 'text-purple-400',
  teal: 'text-teal-400',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  cyan: 'text-cyan-400',
  red: 'text-red-400',
  orange: 'text-orange-400',
  blue: 'text-blue-400',
  stone: 'text-stone-300',
};

export default function CompanionsTab({ character, onUpdate }) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const addCompanion = () => {
    const newCompanion = {
      id: Date.now(), name: '', type: 'familiar', form: '', ac: 10, maxHp: 1, currentHp: 1,
      speed: '30 ft.', str: 3, dex: 15, con: 10, int: 3, wis: 12, cha: 7,
      senses: '', languages: '', abilities: '', actions: '', notes: '', active: true,
    };
    onUpdate('companions', [...(character.companions || []), newCompanion]);
    setExpandedId(newCompanion.id);
  };

  const updateCompanion = (id, field, value) => {
    onUpdate('companions', (character.companions || []).map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCompanion = (id) => {
    if (confirm('Remove this companion?')) {
      onUpdate('companions', (character.companions || []).filter(c => c.id !== id));
    }
  };

  const handleDragStart = (e, index) => { setDraggedIndex(index); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e, index) => { e.preventDefault(); if (draggedIndex !== index) setDragOverIndex(index); };
  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) { setDraggedIndex(null); setDragOverIndex(null); return; }
    const updated = [...(character.companions || [])];
    const [dragged] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, dragged);
    onUpdate('companions', updated);
    setDraggedIndex(null); setDragOverIndex(null);
  };

  const getTypeInfo = (typeId) => COMPANION_TYPES.find(t => t.id === typeId) || COMPANION_TYPES[0];
  const getModifier = (score) => {
    const mod = Math.floor(((parseInt(score) || 10) - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-stone-400">Track familiars, animal companions, mounts, and summoned creatures.</p>
        <button onClick={addCompanion} className="px-3 py-1 rounded bg-purple-800 hover:bg-purple-700 text-xs flex items-center gap-1">
          <Icons.Plus /> Add Companion
        </button>
      </div>

      <div className="space-y-3">
        {(character.companions || []).map((companion, index) => {
          const typeInfo = getTypeInfo(companion.type);
          const isExpanded = expandedId === companion.id;
          
          return (
            <div key={companion.id} draggable={!isExpanded} onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)} onDragLeave={() => setDragOverIndex(null)}
              onDrop={(e) => handleDrop(e, index)} onDragEnd={() => { setDraggedIndex(null); setDragOverIndex(null); }}
              className={`rounded-lg border overflow-hidden transition-all ${colorClasses[typeInfo.color]} ${
                draggedIndex === index ? 'opacity-50' : ''} ${dragOverIndex === index ? 'ring-2 ring-amber-400' : ''} ${
                !companion.active ? 'opacity-60' : ''}`}>
              
              <div className="p-3 flex items-center gap-3 cursor-pointer hover:bg-white/5" onClick={() => setExpandedId(isExpanded ? null : companion.id)}>
                <div className="cursor-grab active:cursor-grabbing text-stone-600 hover:text-stone-400"><Icons.GripVertical /></div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${headerColors[typeInfo.color]}`}>{companion.name || 'Unnamed Companion'}</span>
                    <span className="text-xs text-stone-500">({typeInfo.name})</span>
                    {!companion.active && <span className="text-xs text-red-400">[Dismissed]</span>}
                  </div>
                  <div className="text-xs text-stone-400 flex items-center gap-3">
                    {companion.form && <span>{companion.form}</span>}
                    <span className="flex items-center gap-1"><Icons.Shield /> AC {companion.ac}</span>
                    <span className="flex items-center gap-1"><Icons.Heart /> {companion.currentHp}/{companion.maxHp}</span>
                  </div>
                </div>

                <button onClick={(e) => { e.stopPropagation(); updateCompanion(companion.id, 'inCombat', !companion.inCombat); }}
                  className={`px-2 py-1 rounded text-xs ${companion.inCombat ? 'bg-amber-800 text-amber-200' : 'bg-stone-700 text-stone-400'}`} title="Add to initiative tracker">
                  {companion.inCombat ? '⚔️ In Combat' : '⚔️ Combat'}
                </button>

                <button onClick={(e) => { e.stopPropagation(); updateCompanion(companion.id, 'active', !companion.active); }}
                  className={`px-2 py-1 rounded text-xs ${companion.active ? 'bg-green-800 text-green-200' : 'bg-stone-700 text-stone-400'}`}>
                  {companion.active ? 'Active' : 'Inactive'}
                </button>
                
                <span className={`text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
              </div>

              {isExpanded && (
                <div className="p-4 pt-0 space-y-4 border-t border-stone-700/50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs text-stone-500">Name</label>
                      <input type="text" value={companion.name} onChange={(e) => updateCompanion(companion.id, 'name', e.target.value)}
                        className="w-full bg-stone-900 rounded px-3 py-2 text-sm focus:outline-none" placeholder="Companion name" />
                    </div>
                    <div>
                      <label className="text-xs text-stone-500">Type</label>
                      <select value={companion.type} onChange={(e) => updateCompanion(companion.id, 'type', e.target.value)}
                        className="w-full bg-stone-900 rounded px-3 py-2 text-sm focus:outline-none">
                        {COMPANION_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-stone-500">Form / Creature</label>
                      {companion.type === 'familiar' ? (
                        <select value={companion.form} onChange={(e) => updateCompanion(companion.id, 'form', e.target.value)}
                          className="w-full bg-stone-900 rounded px-3 py-2 text-sm focus:outline-none">
                          <option value="">Select form...</option>
                          {FAMILIAR_FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      ) : (
                        <input type="text" value={companion.form || ''} onChange={(e) => updateCompanion(companion.id, 'form', e.target.value)}
                          className="w-full bg-stone-900 rounded px-3 py-2 text-sm focus:outline-none" placeholder="e.g., Wolf, Warhorse..." />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                    <div>
                      <label className="text-xs text-stone-500">AC</label>
                      <input type="number" value={companion.ac} onChange={(e) => updateCompanion(companion.id, 'ac', e.target.value)}
                        className="w-full bg-stone-900 rounded px-3 py-2 text-sm text-center focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-stone-500">Current HP</label>
                      <input type="number" value={companion.currentHp} onChange={(e) => updateCompanion(companion.id, 'currentHp', e.target.value)}
                        className="w-full bg-stone-900 rounded px-3 py-2 text-sm text-center focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-stone-500">Max HP</label>
                      <input type="number" value={companion.maxHp} onChange={(e) => updateCompanion(companion.id, 'maxHp', e.target.value)}
                        className="w-full bg-stone-900 rounded px-3 py-2 text-sm text-center focus:outline-none" />
                    </div>
                    <div className="col-span-1 md:col-span-3">
                      <label className="text-xs text-stone-500">Speed</label>
                      <input type="text" value={companion.speed || ''} onChange={(e) => updateCompanion(companion.id, 'speed', e.target.value)}
                        className="w-full bg-stone-900 rounded px-3 py-2 text-sm focus:outline-none" placeholder="30 ft., fly 60 ft." />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-stone-500 mb-2 block">Ability Scores</label>
                    <div className="grid grid-cols-6 gap-2">
                      {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(stat => (
                        <div key={stat} className="text-center">
                          <div className="text-[10px] text-stone-500 uppercase">{stat}</div>
                          <input type="number" value={companion[stat] || 10} onChange={(e) => updateCompanion(companion.id, stat, e.target.value)}
                            className="w-full bg-stone-900 rounded px-1 py-1 text-sm text-center focus:outline-none" />
                          <div className="text-xs text-stone-400">{getModifier(companion[stat])}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-stone-500">Senses</label>
                      <input type="text" value={companion.senses || ''} onChange={(e) => updateCompanion(companion.id, 'senses', e.target.value)}
                        className="w-full bg-stone-900 rounded px-3 py-2 text-sm focus:outline-none" placeholder="Darkvision 60 ft., passive Perception 11" />
                    </div>
                    <div>
                      <label className="text-xs text-stone-500">Languages</label>
                      <input type="text" value={companion.languages || ''} onChange={(e) => updateCompanion(companion.id, 'languages', e.target.value)}
                        className="w-full bg-stone-900 rounded px-3 py-2 text-sm focus:outline-none" placeholder="Understands Common, telepathy 100 ft." />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-stone-500">Special Abilities</label>
                    <textarea value={companion.abilities || ''} onChange={(e) => updateCompanion(companion.id, 'abilities', e.target.value)}
                      className="w-full bg-stone-900 rounded px-3 py-2 text-sm h-20 resize-none focus:outline-none" placeholder="Keen Hearing and Smell, Pack Tactics, Magic Resistance..." />
                  </div>

                  <div>
                    <label className="text-xs text-stone-500">Actions</label>
                    <textarea value={companion.actions || ''} onChange={(e) => updateCompanion(companion.id, 'actions', e.target.value)}
                      className="w-full bg-stone-900 rounded px-3 py-2 text-sm h-20 resize-none focus:outline-none" placeholder="Bite. +4 to hit, 1d6+2 piercing damage..." />
                  </div>

                  <div>
                    <label className="text-xs text-stone-500">Notes</label>
                    <textarea value={companion.notes || ''} onChange={(e) => updateCompanion(companion.id, 'notes', e.target.value)}
                      className="w-full bg-stone-900 rounded px-3 py-2 text-sm h-16 resize-none focus:outline-none" placeholder="Additional notes..." />
                  </div>

                  <div className="flex justify-end">
                    <button onClick={() => removeCompanion(companion.id)} className="px-3 py-1 rounded bg-red-900 hover:bg-red-800 text-xs text-red-200 flex items-center gap-1">
                      <Icons.Trash /> Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(character.companions || []).length === 0 && (
        <div className="text-center text-stone-500 py-8 border border-dashed border-stone-700 rounded-lg">
          No companions yet. Add familiars, animal companions, or mounts.
        </div>
      )}
    </div>
  );
}
