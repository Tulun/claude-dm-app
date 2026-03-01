'use client';

import { useState, useMemo } from 'react';
import Icons from '../Icons';

// Classes that prepare spells (vs known spells)
const PREPARED_CASTER_CLASSES = ['Cleric', 'Druid', 'Paladin', 'Wizard'];

// Check if character is a prepared caster and get their caster class info
function getPreparedCasterInfo(character) {
  const classes = [];
  if (character.classes) {
    character.classes.forEach(c => classes.push({ name: c.name, level: c.level }));
  } else if (character.class) {
    classes.push({ name: character.class, level: character.level || 1 });
  }
  
  const preparedClass = classes.find(c => PREPARED_CASTER_CLASSES.includes(c.name));
  return preparedClass || null;
}

// Calculate max prepared spells
function calculateMaxPrepared(character, casterInfo) {
  if (!casterInfo) return null;
  
  const getMod = (score) => Math.floor(((parseInt(score) || 10) - 10) / 2);
  const level = parseInt(casterInfo.level) || 1;
  
  let maxPrepared = 0;
  
  switch (casterInfo.name) {
    case 'Druid':
    case 'Cleric':
      maxPrepared = level + getMod(character.wis);
      break;
    case 'Paladin':
      maxPrepared = Math.floor(level / 2) + getMod(character.cha);
      break;
    case 'Wizard':
      maxPrepared = level + getMod(character.int);
      break;
    default:
      return null;
  }
  
  return Math.max(1, maxPrepared);
}

export default function SpellsModal({ isOpen, onClose, character }) {
  const [expandedSpell, setExpandedSpell] = useState(null);
  const [levelFilter, setLevelFilter] = useState(null);
  const [showPreparedOnly, setShowPreparedOnly] = useState(true);

  const allSpells = character?.spells || [];
  const casterInfo = getPreparedCasterInfo(character);
  const preparedCaster = casterInfo !== null;
  const maxPrepared = calculateMaxPrepared(character, casterInfo);
  
  // For prepared casters, filter by prepared status (cantrips and always-prepared always show)
  const spells = useMemo(() => {
    if (!preparedCaster || !showPreparedOnly) return allSpells;
    return allSpells.filter(s => s.prepared || s.alwaysPrepared || parseInt(s.level) === 0);
  }, [allSpells, preparedCaster, showPreparedOnly]);

  // Count stats (exclude always-prepared from the count against max)
  const preparedCount = allSpells.filter(s => s.prepared && parseInt(s.level) > 0 && !s.alwaysPrepared).length;
  const alwaysPreparedCount = allSpells.filter(s => s.alwaysPrepared && parseInt(s.level) > 0).length;
  
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
        <div className="p-4 border-b border-stone-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-purple-400 flex items-center gap-2">
                <Icons.Sparkles />
                {character.name}'s Spells
              </h2>
              <p className="text-sm text-stone-400">
                {preparedCaster && maxPrepared ? (
                  <>
                    <span className={preparedCount > maxPrepared ? 'text-red-400' : 'text-emerald-400'}>
                      {preparedCount} prepared
                    </span>
                    <span className="text-stone-500"> / </span>
                    <span className="text-amber-400">{maxPrepared} max</span>
                    {alwaysPreparedCount > 0 && (
                      <span className="text-cyan-400 ml-2">+ {alwaysPreparedCount} always</span>
                    )}
                    {preparedCount > maxPrepared && (
                      <span className="text-red-400 ml-1">(over!)</span>
                    )}
                  </>
                ) : (
                  <>{allSpells.length} spell{allSpells.length !== 1 ? 's' : ''} known</>
                )}
              </p>
            </div>
            <button onClick={onClose} className="text-stone-400 hover:text-white text-2xl leading-none">&times;</button>
          </div>

          {/* Prepared Toggle for prepared casters */}
          {preparedCaster && allSpells.length > 0 && (
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => setShowPreparedOnly(true)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  showPreparedOnly 
                    ? 'bg-emerald-700 text-emerald-100' 
                    : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                }`}
              >
                <Icons.Check className="w-3 h-3" />
                Prepared Only
              </button>
              <button
                onClick={() => setShowPreparedOnly(false)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  !showPreparedOnly 
                    ? 'bg-purple-700 text-purple-100' 
                    : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                }`}
              >
                All Spells
              </button>
            </div>
          )}
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
              {preparedCaster && showPreparedOnly && allSpells.length > 0 ? (
                <>
                  <p>No spells prepared</p>
                  <p className="text-xs mt-1">
                    <button 
                      onClick={() => setShowPreparedOnly(false)}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      Show all {allSpells.length} spells
                    </button>
                  </p>
                </>
              ) : (
                <>
                  <p>No spells assigned</p>
                  <p className="text-xs mt-1">Add spells in the character editor</p>
                </>
              )}
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
                  showPreparedBadge={preparedCaster && !showPreparedOnly}
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
                        showPreparedBadge={preparedCaster && !showPreparedOnly && parseInt(spell.level) > 0}
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

function SpellRow({ spell, expanded, onToggle, showPreparedBadge }) {
  const hasDetails = spell.description || spell.components || spell.duration;
  
  return (
    <div
      className={`border rounded-lg overflow-hidden transition-all ${
        expanded 
          ? 'border-purple-700/50 bg-stone-800/80' 
          : spell.alwaysPrepared
            ? 'border-cyan-700/50 bg-cyan-950/20'
            : 'border-stone-700/50 bg-stone-800/30 hover:bg-stone-800/50'
      }`}
    >
      <div 
        className="flex items-center gap-2 p-2 cursor-pointer"
        onClick={() => hasDetails && onToggle()}
      >
        {/* Prepared Badge */}
        {showPreparedBadge && (
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
            spell.alwaysPrepared ? 'bg-cyan-500' : spell.prepared ? 'bg-emerald-500' : 'bg-stone-600'
          }`} title={spell.alwaysPrepared ? 'Always Prepared' : spell.prepared ? 'Prepared' : 'Not prepared'} />
        )}

        {/* Spell Name */}
        <span className={`flex-1 font-medium min-w-0 truncate ${
          spell.alwaysPrepared ? 'text-cyan-400' : showPreparedBadge && !spell.prepared ? 'text-stone-500' : 'text-amber-400'
        }`}>
          {spell.name}
        </span>

        {/* Tags */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {spell.alwaysPrepared && (
            <span className="px-1.5 py-0.5 bg-cyan-900/30 text-cyan-400 rounded text-[10px]" title="Always Prepared">A</span>
          )}
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
            {/* Source Info */}
            {(spell.source || spell.sourceUrl) && (
              <div className="pt-2 border-t border-stone-700/50 flex items-center justify-between">
                <span className="text-stone-500">
                  Source: <span className="text-stone-400">{spell.sourceShort || spell.source || 'Unknown'}</span>
                </span>
                {spell.sourceUrl && (
                  <a 
                    href={spell.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Source ↗
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
