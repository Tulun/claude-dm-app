'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Icons from '../components/Icons';

const SCHOOLS = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'];
const CLASSES = ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'];
const LEVELS = ['Cantrip', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];

export default function SpellbookPage() {
  const [spells, setSpells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [expandedSpell, setExpandedSpell] = useState(null);
  const [showFilters, setShowFilters] = useState(true);

  // Load spells from API
  useEffect(() => {
    fetch('/api/spells')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch spells');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setSpells(data);
        } else {
          console.error('Invalid spells data:', data);
          setSpells([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load spells:', err);
        setSpells([]);
        setLoading(false);
      });
  }, []);

  const filteredSpells = useMemo(() => {
    return spells.filter(spell => {
      // Search filter
      if (search && !spell.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      // School filter
      if (selectedSchools.length > 0 && !selectedSchools.includes(spell.school)) {
        return false;
      }
      // Class filter
      if (selectedClasses.length > 0 && !spell.classes.some(c => selectedClasses.includes(c))) {
        return false;
      }
      // Level filter
      if (selectedLevels.length > 0) {
        const levelLabel = spell.level === 0 ? 'Cantrip' : `${spell.level}${getOrdinalSuffix(spell.level)}`;
        if (!selectedLevels.includes(levelLabel)) {
          return false;
        }
      }
      return true;
    });
  }, [spells, search, selectedSchools, selectedClasses, selectedLevels]);

  const toggleFilter = (value, selected, setSelected) => {
    if (selected.includes(value)) {
      setSelected(selected.filter(v => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedSchools([]);
    setSelectedClasses([]);
    setSelectedLevels([]);
  };

  const hasActiveFilters = search || selectedSchools.length > 0 || selectedClasses.length > 0 || selectedLevels.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100">
      {/* Navigation */}
      <nav className="border-b border-amber-900/30 bg-stone-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800">
                <Icons.Sword />
              </div>
              <div>
                <h1 className="text-xl font-bold text-amber-400">DM's Toolkit</h1>
                <p className="text-xs text-stone-400">Spellbook</p>
              </div>
            </Link>
            <div className="flex gap-2">
              <Link href="/" className="px-4 py-2 rounded-lg text-stone-300 hover:bg-stone-800 transition-colors">Combat</Link>
              <Link href="/characters" className="px-4 py-2 rounded-lg text-stone-300 hover:bg-stone-800 transition-colors">Characters</Link>
              <Link href="/encounters" className="px-4 py-2 rounded-lg text-stone-300 hover:bg-stone-800 transition-colors">Encounters</Link>
              <Link href="/templates" className="px-4 py-2 rounded-lg text-stone-300 hover:bg-stone-800 transition-colors">Templates</Link>
              <Link href="/spellbook" className="px-4 py-2 rounded-lg bg-amber-700 text-amber-100 transition-colors">Spellbook</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-amber-400">Spellbook</h1>
            <p className="text-stone-400">{filteredSpells.length} spells {hasActiveFilters && `(filtered from ${spells.length})`}</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 transition-colors"
          >
            <Icons.Filter />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Search and Filters */}
        {showFilters && (
          <div className="bg-stone-800/50 border border-stone-700 rounded-xl p-4 mb-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                placeholder="Search spells by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-stone-900 border border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-stone-100 placeholder-stone-500"
              />
            </div>

            {/* Filter Sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Level Filter */}
              <div>
                <label className="text-xs text-stone-400 uppercase tracking-wide mb-2 block">Spell Level</label>
                <div className="flex flex-wrap gap-1">
                  {LEVELS.map(level => (
                    <button
                      key={level}
                      onClick={() => toggleFilter(level, selectedLevels, setSelectedLevels)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        selectedLevels.includes(level)
                          ? 'bg-purple-600 text-purple-100'
                          : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* School Filter */}
              <div>
                <label className="text-xs text-stone-400 uppercase tracking-wide mb-2 block">School</label>
                <div className="flex flex-wrap gap-1">
                  {SCHOOLS.map(school => (
                    <button
                      key={school}
                      onClick={() => toggleFilter(school, selectedSchools, setSelectedSchools)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        selectedSchools.includes(school)
                          ? 'bg-blue-600 text-blue-100'
                          : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                      }`}
                    >
                      {school}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class Filter */}
              <div>
                <label className="text-xs text-stone-400 uppercase tracking-wide mb-2 block">Class</label>
                <div className="flex flex-wrap gap-1">
                  {CLASSES.map(cls => (
                    <button
                      key={cls}
                      onClick={() => toggleFilter(cls, selectedClasses, setSelectedClasses)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        selectedClasses.includes(cls)
                          ? 'bg-emerald-600 text-emerald-100'
                          : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Filters & Clear */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-2 border-t border-stone-700">
                <div className="flex flex-wrap gap-2">
                  {selectedLevels.map(level => (
                    <span key={level} className="px-2 py-1 bg-purple-900/50 text-purple-300 rounded text-xs flex items-center gap-1">
                      {level}
                      <button onClick={() => toggleFilter(level, selectedLevels, setSelectedLevels)} className="hover:text-white">×</button>
                    </span>
                  ))}
                  {selectedSchools.map(school => (
                    <span key={school} className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs flex items-center gap-1">
                      {school}
                      <button onClick={() => toggleFilter(school, selectedSchools, setSelectedSchools)} className="hover:text-white">×</button>
                    </span>
                  ))}
                  {selectedClasses.map(cls => (
                    <span key={cls} className="px-2 py-1 bg-emerald-900/50 text-emerald-300 rounded text-xs flex items-center gap-1">
                      {cls}
                      <button onClick={() => toggleFilter(cls, selectedClasses, setSelectedClasses)} className="hover:text-white">×</button>
                    </span>
                  ))}
                </div>
                <button
                  onClick={clearFilters}
                  className="text-sm text-stone-400 hover:text-stone-200 transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        )}

        {/* Spell List */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-12 text-stone-500">
              <Icons.Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
              <p>Loading spells...</p>
            </div>
          ) : filteredSpells.length === 0 ? (
            <div className="text-center py-12 text-stone-500">
              <Icons.Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No spells found matching your filters</p>
            </div>
          ) : (
            filteredSpells.map(spell => (
              <SpellCard
                key={spell.id || spell.name}
                spell={spell}
                expanded={expandedSpell === spell.name}
                onToggle={() => setExpandedSpell(expandedSpell === spell.name ? null : spell.name)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SpellCard({ spell, expanded, onToggle }) {
  const levelText = spell.level === 0 
    ? 'Cantrip' 
    : `${spell.level}${getOrdinalSuffix(spell.level)}-level`;
  
  const schoolColor = getSchoolColor(spell.school);

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${expanded ? 'border-amber-700/50 bg-stone-800/80' : 'border-stone-700/50 bg-stone-800/30 hover:bg-stone-800/50'}`}>
      {/* Header - always visible */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${schoolColor.bg}`}>
            <Icons.Sparkles className={schoolColor.text} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-amber-400">{spell.name}</h3>
            <p className="text-sm text-stone-400">
              {spell.school} {levelText} ({spell.classes.join(', ')})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {spell.concentration && (
            <span className="px-2 py-1 bg-amber-900/30 text-amber-400 rounded text-xs">Concentration</span>
          )}
          {spell.ritual && (
            <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs">Ritual</span>
          )}
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={`w-5 h-5 text-stone-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-stone-700/50">
          <div className="pt-4 spell-content">
            {/* Spell Header */}
            <div className="mb-4">
              <h2 className="text-2xl font-bold italic text-purple-400">{spell.name}</h2>
              <p className="text-stone-400 italic">{spell.school} {levelText} ({spell.classes.join(', ')})</p>
            </div>

            {/* Spell Properties */}
            <div className="space-y-1 mb-4">
              <p><span className="font-bold">Casting Time:</span> {spell.castingTime}</p>
              <p><span className="font-bold">Range:</span> {spell.range}</p>
              <p><span className="font-bold">Components:</span> {spell.components}</p>
              <p><span className="font-bold">Duration:</span> {spell.duration}</p>
            </div>

            {/* Description */}
            <div className="space-y-3 text-stone-200">
              {spell.description.split('\n\n').map((paragraph, i) => (
                <p key={i} dangerouslySetInnerHTML={{ __html: formatSpellText(paragraph) }} />
              ))}
            </div>

            {/* At Higher Levels / Cantrip Upgrade */}
            {spell.higherLevels && (
              <p className="mt-4">
                <span className="font-bold italic text-amber-400">
                  {spell.level === 0 ? 'Cantrip Upgrade.' : 'At Higher Levels.'}
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

function getOrdinalSuffix(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function getSchoolColor(school) {
  const colors = {
    'Abjuration': { bg: 'bg-blue-900/50', text: 'text-blue-400' },
    'Conjuration': { bg: 'bg-amber-900/50', text: 'text-amber-400' },
    'Divination': { bg: 'bg-cyan-900/50', text: 'text-cyan-400' },
    'Enchantment': { bg: 'bg-pink-900/50', text: 'text-pink-400' },
    'Evocation': { bg: 'bg-red-900/50', text: 'text-red-400' },
    'Illusion': { bg: 'bg-purple-900/50', text: 'text-purple-400' },
    'Necromancy': { bg: 'bg-emerald-900/50', text: 'text-emerald-400' },
    'Transmutation': { bg: 'bg-orange-900/50', text: 'text-orange-400' },
  };
  return colors[school] || { bg: 'bg-stone-700', text: 'text-stone-400' };
}

function formatSpellText(text) {
  // Bold key terms
  return text
    .replace(/\b(Sphere|Cube|Cone|Line|Cylinder|Emanation)\b/g, '<span class="text-purple-400 font-semibold">$1</span>')
    .replace(/\b(\d+d\d+)\b/g, '<span class="font-mono text-amber-300">$1</span>')
    .replace(/\b(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\b/g, '<span class="font-semibold">$1</span>')
    .replace(/\b(saving throw|attack roll)\b/gi, '<span class="font-semibold">$1</span>');
}
