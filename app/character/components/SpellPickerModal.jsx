'use client';

import { useState, useEffect, useMemo } from 'react';
import Icons from '../../components/Icons';

const SCHOOLS = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'];
const CLASSES = ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'];
const LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function SpellPickerModal({ isOpen, onClose, onAddSpells, characterSpells = [], characterClasses = [] }) {
  const [allSpells, setAllSpells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSpells, setSelectedSpells] = useState([]);
  const [expandedSpell, setExpandedSpell] = useState(null);

  // Get spell IDs already on character
  const existingSpellIds = useMemo(() => {
    return new Set(characterSpells.map(s => s.sourceId || s.name.toLowerCase()));
  }, [characterSpells]);

  // Load spells from API
  useEffect(() => {
    if (!isOpen) return;
    
    setLoading(true);
    fetch('/api/spells')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllSpells(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load spells:', err);
        setLoading(false);
      });
  }, [isOpen]);

  // Auto-select class filter if character has one spellcasting class
  useEffect(() => {
    if (characterClasses.length === 1 && CLASSES.includes(characterClasses[0])) {
      setSelectedClass(characterClasses[0]);
    }
  }, [characterClasses]);

  const filteredSpells = useMemo(() => {
    return allSpells.filter(spell => {
      if (search && !spell.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (selectedLevel !== null && spell.level !== selectedLevel) {
        return false;
      }
      if (selectedSchool && spell.school !== selectedSchool) {
        return false;
      }
      if (selectedClass && !spell.classes.includes(selectedClass)) {
        return false;
      }
      return true;
    });
  }, [allSpells, search, selectedLevel, selectedSchool, selectedClass]);

  const toggleSpellSelection = (spell) => {
    setSelectedSpells(prev => {
      const isSelected = prev.some(s => s.id === spell.id);
      if (isSelected) {
        return prev.filter(s => s.id !== spell.id);
      } else {
        return [...prev, spell];
      }
    });
  };

  const handleAddSpells = () => {
    // Convert spellbook spells to character spell format
    const spellsToAdd = selectedSpells.map(spell => ({
      id: Date.now() + Math.random(), // Unique ID for character's spell list
      sourceId: spell.id, // Reference to spellbook spell
      name: spell.name,
      level: spell.level,
      school: spell.school,
      castTime: spell.castingTime,
      range: spell.range,
      components: spell.components,
      duration: spell.duration,
      description: spell.description,
      higherLevels: spell.higherLevels,
      concentration: spell.concentration,
      ritual: spell.ritual
    }));
    
    onAddSpells(spellsToAdd);
    setSelectedSpells([]);
    onClose();
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedLevel(null);
    setSelectedSchool(null);
    setSelectedClass(null);
  };

  const getLevelLabel = (level) => {
    if (level === 0) return 'Cantrip';
    return `${level}${getOrdinalSuffix(level)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-stone-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-amber-400">Add Spells from Spellbook</h2>
            <p className="text-sm text-stone-400">
              {selectedSpells.length > 0 
                ? `${selectedSpells.length} spell${selectedSpells.length > 1 ? 's' : ''} selected`
                : 'Select spells to add to your character'}
            </p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white text-2xl">×</button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-stone-700 space-y-3">
          {/* Search */}
          <div className="relative">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search spells..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-800 border border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-3">
            {/* Level Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500">Level:</span>
              <div className="flex gap-1">
                {LEVELS.map(level => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      selectedLevel === level
                        ? 'bg-purple-600 text-purple-100'
                        : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                    }`}
                  >
                    {level === 0 ? 'C' : level}
                  </button>
                ))}
              </div>
            </div>

            {/* School Filter */}
            <select
              value={selectedSchool || ''}
              onChange={(e) => setSelectedSchool(e.target.value || null)}
              className="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm focus:outline-none"
            >
              <option value="">All Schools</option>
              {SCHOOLS.map(school => (
                <option key={school} value={school}>{school}</option>
              ))}
            </select>

            {/* Class Filter */}
            <select
              value={selectedClass || ''}
              onChange={(e) => setSelectedClass(e.target.value || null)}
              className="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm focus:outline-none"
            >
              <option value="">All Classes</option>
              {CLASSES.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>

            {(search || selectedLevel !== null || selectedSchool || selectedClass) && (
              <button
                onClick={clearFilters}
                className="text-xs text-stone-400 hover:text-stone-200"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Spell List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-12 text-stone-500">
              <Icons.Sparkles className="w-8 h-8 mx-auto mb-2 animate-pulse" />
              <p>Loading spells...</p>
            </div>
          ) : filteredSpells.length === 0 ? (
            <div className="text-center py-12 text-stone-500">
              <p>No spells found matching your filters</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredSpells.map(spell => {
                const isSelected = selectedSpells.some(s => s.id === spell.id);
                const alreadyHas = existingSpellIds.has(spell.id) || existingSpellIds.has(spell.name.toLowerCase());
                const isExpanded = expandedSpell === spell.id;
                
                return (
                  <div
                    key={spell.id}
                    className={`border rounded-lg overflow-hidden transition-all ${
                      alreadyHas 
                        ? 'border-stone-700/30 bg-stone-800/20 opacity-50'
                        : isSelected 
                          ? 'border-purple-600 bg-purple-900/20' 
                          : 'border-stone-700/50 bg-stone-800/30 hover:bg-stone-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 p-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => !alreadyHas && toggleSpellSelection(spell)}
                        disabled={alreadyHas}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          alreadyHas
                            ? 'border-stone-600 bg-stone-700 cursor-not-allowed'
                            : isSelected
                              ? 'border-purple-500 bg-purple-600'
                              : 'border-stone-500 hover:border-purple-500'
                        }`}
                      >
                        {(isSelected || alreadyHas) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      {/* Spell Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-amber-400">{spell.name}</span>
                          {spell.concentration && (
                            <span className="px-1.5 py-0.5 bg-amber-900/30 text-amber-400 rounded text-[10px]">C</span>
                          )}
                          {spell.ritual && (
                            <span className="px-1.5 py-0.5 bg-blue-900/30 text-blue-400 rounded text-[10px]">R</span>
                          )}
                          {alreadyHas && (
                            <span className="px-1.5 py-0.5 bg-stone-700 text-stone-400 rounded text-[10px]">Known</span>
                          )}
                        </div>
                        <p className="text-xs text-stone-400">
                          {getLevelLabel(spell.level)} {spell.school} • {spell.castingTime} • {spell.range}
                        </p>
                      </div>

                      {/* Expand Button */}
                      <button
                        onClick={() => setExpandedSpell(isExpanded ? null : spell.id)}
                        className="text-stone-400 hover:text-white p-1"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        >
                          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                        </svg>
                      </button>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0 border-t border-stone-700/50 mt-0">
                        <div className="pt-3 space-y-2 text-sm">
                          <p className="text-stone-400">
                            <span className="text-stone-500">Components:</span> {spell.components}
                          </p>
                          <p className="text-stone-400">
                            <span className="text-stone-500">Duration:</span> {spell.duration}
                          </p>
                          <p className="text-stone-300">{spell.description}</p>
                          {spell.higherLevels && (
                            <p className="text-stone-400">
                              <span className="text-amber-400 font-medium">
                                {spell.level === 0 ? 'Cantrip Upgrade.' : 'At Higher Levels.'}
                              </span>{' '}
                              {spell.higherLevels}
                            </p>
                          )}
                          <p className="text-xs text-stone-500">
                            Classes: {spell.classes.join(', ')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-700 flex items-center justify-between">
          <p className="text-sm text-stone-400">
            Showing {filteredSpells.length} of {allSpells.length} spells
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSpells}
              disabled={selectedSpells.length === 0}
              className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 disabled:bg-stone-700 disabled:text-stone-500 transition-colors flex items-center gap-2"
            >
              <Icons.Plus className="w-4 h-4" />
              Add {selectedSpells.length > 0 ? selectedSpells.length : ''} Spell{selectedSpells.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getOrdinalSuffix(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
