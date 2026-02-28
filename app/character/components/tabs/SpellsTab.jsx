'use client';

import { useState } from 'react';
import Icons from '../../../components/Icons';
import SpellPickerModal from '../SpellPickerModal';

export default function SpellsTab({ character, onUpdate }) {
  const [showSpellPicker, setShowSpellPicker] = useState(false);
  const [expandedSpell, setExpandedSpell] = useState(null);

  const addSpell = () => {
    const newSpell = { id: Date.now(), name: '', level: 0, school: '', castTime: '1 action', range: '', duration: '', description: '' };
    onUpdate('spells', [...(character.spells || []), newSpell]);
  };

  const addSpellsFromPicker = (spells) => {
    onUpdate('spells', [...(character.spells || []), ...spells]);
  };

  const updateSpell = (id, field, value) => {
    onUpdate('spells', character.spells.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSpell = (id) => {
    onUpdate('spells', character.spells.filter(s => s.id !== id));
  };

  // Get character's classes for filtering
  const characterClasses = [];
  if (character.class) characterClasses.push(character.class);
  if (character.multiclassClass) characterClasses.push(character.multiclassClass);

  const getLevelLabel = (level) => {
    if (level === 0 || level === '0') return 'Cantrip';
    const num = parseInt(level);
    if (isNaN(num)) return level;
    return `${num}${getOrdinalSuffix(num)}`;
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
        {(character.spells || []).length === 0 ? (
          <div className="text-center text-stone-500 py-8">
            <Icons.Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No spells yet.</p>
            <p className="text-xs mt-1">Browse the spellbook or add custom spells</p>
          </div>
        ) : (
          // Group spells by level
          Object.entries(
            (character.spells || []).reduce((groups, spell) => {
              const level = parseInt(spell.level) || 0;
              if (!groups[level]) groups[level] = [];
              groups[level].push(spell);
              return groups;
            }, {})
          )
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([level, spells]) => (
              <div key={level} className="mb-4">
                <h3 className="text-sm font-medium text-purple-400 mb-2 border-b border-stone-700 pb-1">
                  {level === '0' ? 'Cantrips' : `${getLevelLabel(level)} Level`}
                </h3>
                <div className="space-y-1">
                  {spells.map(spell => {
                    const isExpanded = expandedSpell === spell.id;
                    const hasDetails = spell.description || spell.components || spell.duration;
                    
                    return (
                      <div
                        key={spell.id}
                        className={`border rounded-lg overflow-hidden transition-all ${
                          isExpanded 
                            ? 'border-purple-700/50 bg-stone-800/80' 
                            : 'border-stone-700/50 bg-stone-800/30 hover:bg-stone-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 p-2">
                          {/* Spell Name */}
                          {spell.sourceId ? (
                            // From spellbook - show as text
                            <span className="flex-1 font-medium text-amber-400 min-w-0 truncate">
                              {spell.name}
                            </span>
                          ) : (
                            // Custom spell - editable
                            <input
                              type="text"
                              value={spell.name}
                              onChange={(e) => updateSpell(spell.id, 'name', e.target.value)}
                              className="flex-1 bg-transparent focus:outline-none font-medium text-amber-400 min-w-0"
                              placeholder="Spell name"
                            />
                          )}

                          {/* Tags */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {spell.concentration && (
                              <span className="px-1.5 py-0.5 bg-amber-900/30 text-amber-400 rounded text-[10px]" title="Concentration">C</span>
                            )}
                            {spell.ritual && (
                              <span className="px-1.5 py-0.5 bg-blue-900/30 text-blue-400 rounded text-[10px]" title="Ritual">R</span>
                            )}
                          </div>

                          {/* Cast Time */}
                          <span className="text-xs text-stone-400 w-20 text-center flex-shrink-0">
                            {spell.castTime || spell.castingTime || '—'}
                          </span>

                          {/* Range */}
                          <span className="text-xs text-stone-400 w-16 text-center flex-shrink-0">
                            {spell.range || '—'}
                          </span>

                          {/* Expand/Collapse */}
                          {hasDetails && (
                            <button
                              onClick={() => setExpandedSpell(isExpanded ? null : spell.id)}
                              className="text-stone-400 hover:text-white p-1 flex-shrink-0"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              >
                                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                              </svg>
                            </button>
                          )}

                          {/* Remove */}
                          <button
                            onClick={() => removeSpell(spell.id)}
                            className="text-red-500 hover:text-red-400 p-1 flex-shrink-0"
                          >
                            <Icons.Trash className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && hasDetails && (
                          <div className="px-3 pb-3 border-t border-stone-700/50">
                            <div className="pt-3 space-y-2 text-sm">
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
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
        )}
      </div>

      {/* Spell Picker Modal */}
      <SpellPickerModal
        isOpen={showSpellPicker}
        onClose={() => setShowSpellPicker(false)}
        onAddSpells={addSpellsFromPicker}
        characterSpells={character.spells || []}
        characterClasses={characterClasses}
      />
    </div>
  );
}

function getOrdinalSuffix(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
