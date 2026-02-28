'use client';

import { useState, useMemo } from 'react';
import Icons from '../Icons';

export default function SpellsModal({ isOpen, onClose, character }) {
  const [expandedSpell, setExpandedSpell] = useState(null);
  const [levelFilter, setLevelFilter] = useState(null);

  const spells = character?.spells || [];
  
  // Group spells by level
  const spellsByLevel = useMemo(() => {
    const groups = {};
    spells.forEach(spell => {
      const level = parseInt(spell.level) || 0;
      if (!groups[level]) groups[level] = [];
      groups[level].push(spell);
    });
    return groups;
  }, [spells]);

  const levels = Object.keys(spellsByLevel).map(Number).sort((a, b) => a - b);
  
  // Filter spells if level filter is active
  const filteredSpells = levelFilter !== null 
    ? spells.filter(s => (parseInt(s.level) || 0) === levelFilter)
    : spells;

  if (!isOpen) return null;

  const getLevelLabel = (level) => {
    if (level === 0) return 'Cantrips';
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = level % 100;
    return `${level}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]} Level`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-stone-900 border border-stone-700 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-purple-400 flex items-center gap-2">
              <Icons.Sparkles />
              {character.name}'s Spells
            </h2>
            <p className="text-sm text-stone-400">{spells.length} spell{spells.length !== 1 ? 's' : ''} known</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        {/* Level Filter Tabs */}
        {levels.length > 1 && (
          <div className="px-4 pt-3 flex gap-1 flex-wrap">
            <button
              onClick={() => setLevelFilter(null)}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                levelFilter === null 
                  ? 'bg-purple-600 text-purple-100' 
                  : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
              }`}
            >
              All
            </button>
            {levels.map(level => (
              <button
                key={level}
                onClick={() => setLevelFilter(level)}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  levelFilter === level 
                    ? 'bg-purple-600 text-purple-100' 
                    : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                }`}
              >
                {level === 0 ? 'Cantrip' : `${level}${['st','nd','rd'][level-1] || 'th'}`}
              </button>
            ))}
          </div>
        )}

        {/* Spell List */}
        <div className="flex-1 overflow-y-auto p-4">
          {spells.length === 0 ? (
            <div className="text-center py-12 text-stone-500">
              <Icons.Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No spells assigned</p>
              <p className="text-xs mt-1">Add spells in the character editor</p>
            </div>
          ) : levelFilter !== null ? (
            // Flat list when filtering by level
            <div className="space-y-1">
              {filteredSpells.map(spell => (
                <SpellRow 
                  key={spell.id} 
                  spell={spell} 
                  expanded={expandedSpell === spell.id}
                  onToggle={() => setExpandedSpell(expandedSpell === spell.id ? null : spell.id)}
                />
              ))}
            </div>
          ) : (
            // Grouped by level
            <div className="space-y-4">
              {levels.map(level => (
                <div key={level}>
                  <h3 className="text-sm font-medium text-purple-400 mb-2 border-b border-stone-700/50 pb-1">
                    {getLevelLabel(level)}
                    <span className="text-stone-500 font-normal ml-2">({spellsByLevel[level].length})</span>
                  </h3>
                  <div className="space-y-1">
                    {spellsByLevel[level].map(spell => (
                      <SpellRow 
                        key={spell.id} 
                        spell={spell} 
                        expanded={expandedSpell === spell.id}
                        onToggle={() => setExpandedSpell(expandedSpell === spell.id ? null : spell.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SpellRow({ spell, expanded, onToggle }) {
  const hasDetails = spell.description || spell.components || spell.duration || spell.higherLevels;
  
  return (
    <div
      className={`border rounded-lg overflow-hidden transition-all ${
        expanded 
          ? 'border-purple-700/50 bg-purple-900/20' 
          : 'border-stone-700/50 bg-stone-800/30 hover:bg-stone-800/50'
      }`}
    >
      <div 
        className={`flex items-center gap-2 p-2 ${hasDetails ? 'cursor-pointer' : ''}`}
        onClick={() => hasDetails && onToggle()}
      >
        {/* Spell Name */}
        <span className="flex-1 font-medium text-amber-400 min-w-0 truncate">
          {spell.name}
        </span>

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
          <div className="text-stone-400 p-1 flex-shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            >
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
            </svg>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && hasDetails && (
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
}
