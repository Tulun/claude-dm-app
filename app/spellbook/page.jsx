'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import Icons from '../components/Icons';

const SCHOOLS = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'];
const CLASSES = ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'];
const LEVELS = ['Cantrip', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];

const EMPTY_SPELL = {
  name: '',
  level: 0,
  school: 'Evocation',
  castingTime: '1 action',
  range: '60 feet',
  components: 'V, S',
  duration: 'Instantaneous',
  classes: [],
  description: '',
  higherLevels: '',
  concentration: false,
  ritual: false,
  source: "Player's Handbook (2024)",
  sourceShort: 'PHB 2024',
  sourceUrl: ''
};

export default function SpellbookPage() {
  const [spells, setSpells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [expandedSpell, setExpandedSpell] = useState(null);
  const [editingSpell, setEditingSpell] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  
  // New spell creation
  const [showNewSpellForm, setShowNewSpellForm] = useState(false);
  const [newSpell, setNewSpell] = useState({ ...EMPTY_SPELL });
  
  // Import from image
  const [showImportModal, setShowImportModal] = useState(false);

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

  const saveSpell = async (spell) => {
    try {
      const res = await fetch('/api/spells', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spell)
      });
      if (!res.ok) throw new Error('Failed to save');
      
      const savedSpell = await res.json();
      
      // Update or add to local state
      setSpells(prev => {
        const exists = prev.some(s => s.id === savedSpell.id);
        if (exists) {
          return prev.map(s => s.id === savedSpell.id ? savedSpell : s);
        } else {
          return [...prev, savedSpell];
        }
      });
      
      setEditingSpell(null);
      setSaveStatus('Saved!');
      setTimeout(() => setSaveStatus(''), 2000);
      return savedSpell;
    } catch (err) {
      console.error('Failed to save spell:', err);
      setSaveStatus('Failed to save');
      setTimeout(() => setSaveStatus(''), 3000);
      return null;
    }
  };

  const createNewSpell = async () => {
    if (!newSpell.name.trim()) {
      setSaveStatus('Name required');
      setTimeout(() => setSaveStatus(''), 2000);
      return;
    }
    
    const spellToSave = {
      ...newSpell,
      id: `spell-${newSpell.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`
    };
    
    const saved = await saveSpell(spellToSave);
    if (saved) {
      setNewSpell({ ...EMPTY_SPELL });
      setShowNewSpellForm(false);
      setExpandedSpell(saved.id);
    }
  };

  const handleImportSpell = async (spell) => {
    const saved = await saveSpell(spell);
    if (saved) {
      setShowImportModal(false);
      setExpandedSpell(saved.id);
    }
  };

  const filteredSpells = useMemo(() => {
    return spells.filter(spell => {
      if (search && !spell.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (selectedSchools.length > 0 && !selectedSchools.includes(spell.school)) {
        return false;
      }
      if (selectedClasses.length > 0 && !spell.classes?.some(c => selectedClasses.includes(c))) {
        return false;
      }
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
              <Link href="/?tab=characters" className="px-4 py-2 rounded-lg text-stone-300 hover:bg-stone-800 transition-colors">Characters</Link>
              <Link href="/encounters" className="px-4 py-2 rounded-lg text-stone-300 hover:bg-stone-800 transition-colors">Encounters</Link>
              <Link href="/templates" className="px-4 py-2 rounded-lg text-stone-300 hover:bg-stone-800 transition-colors">Templates</Link>
              <Link href="/spellbook" className="px-4 py-2 rounded-lg bg-amber-700 text-amber-100 transition-colors">Spellbook</Link>
              <Link href="/dm" className="px-4 py-2 rounded-lg text-stone-300 hover:bg-stone-800 transition-colors">DM</Link>
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
          <div className="flex items-center gap-3">
            {saveStatus && (
              <span className={`text-sm px-3 py-1 rounded ${saveStatus === 'Saved!' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                {saveStatus}
              </span>
            )}
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 transition-colors"
            >
              <Icons.Image />
              Import from Image
            </button>
            <button
              onClick={() => setShowNewSpellForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 transition-colors"
            >
              <Icons.Plus />
              New Spell
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 transition-colors"
            >
              <Icons.Filter />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
        </div>

        {/* New Spell Form */}
        {showNewSpellForm && (
          <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-emerald-400">Create New Spell</h2>
              <button onClick={() => setShowNewSpellForm(false)} className="text-stone-400 hover:text-white text-xl">&times;</button>
            </div>
            <SpellForm 
              spell={newSpell} 
              onChange={setNewSpell} 
              onSave={createNewSpell}
              onCancel={() => setShowNewSpellForm(false)}
              saveLabel="Create Spell"
            />
          </div>
        )}

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
                expanded={expandedSpell === spell.id}
                editing={editingSpell === spell.id}
                onToggle={() => setExpandedSpell(expandedSpell === spell.id ? null : spell.id)}
                onEdit={() => setEditingSpell(spell.id)}
                onSave={saveSpell}
                onCancel={() => setEditingSpell(null)}
              />
            ))
          )}
        </div>
      </div>

      {/* Import from Image Modal */}
      <ImportSpellModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportSpell}
        existingSpells={spells}
      />
    </div>
  );
}

// Reusable spell form component
function SpellForm({ spell, onChange, onSave, onCancel, saveLabel = "Save Changes" }) {
  const updateField = (field, value) => {
    onChange({ ...spell, [field]: value });
  };

  const toggleClass = (cls) => {
    const classes = spell.classes || [];
    if (classes.includes(cls)) {
      updateField('classes', classes.filter(c => c !== cls));
    } else {
      updateField('classes', [...classes, cls]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Basic Info Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-stone-500 block mb-1">Name *</label>
          <input
            type="text"
            value={spell.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="Spell name"
          />
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Level</label>
          <select
            value={spell.level}
            onChange={(e) => updateField('level', parseInt(e.target.value))}
            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            {[0,1,2,3,4,5,6,7,8,9].map(l => (
              <option key={l} value={l}>{l === 0 ? 'Cantrip' : l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">School</label>
          <select
            value={spell.school}
            onChange={(e) => updateField('school', e.target.value)}
            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            {SCHOOLS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={spell.concentration || false}
              onChange={(e) => updateField('concentration', e.target.checked)}
              className="rounded"
            />
            Concentration
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={spell.ritual || false}
              onChange={(e) => updateField('ritual', e.target.checked)}
              className="rounded"
            />
            Ritual
          </label>
        </div>
      </div>

      {/* Classes */}
      <div>
        <label className="text-xs text-stone-500 block mb-1">Classes</label>
        <div className="flex flex-wrap gap-1">
          {CLASSES.map(cls => (
            <button
              key={cls}
              type="button"
              onClick={() => toggleClass(cls)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                spell.classes?.includes(cls)
                  ? 'bg-emerald-600 text-emerald-100'
                  : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      {/* Spell Properties */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-stone-500 block mb-1">Casting Time</label>
          <input
            type="text"
            value={spell.castingTime || ''}
            onChange={(e) => updateField('castingTime', e.target.value)}
            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="1 action"
          />
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Range</label>
          <input
            type="text"
            value={spell.range || ''}
            onChange={(e) => updateField('range', e.target.value)}
            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="60 feet"
          />
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Components</label>
          <input
            type="text"
            value={spell.components || ''}
            onChange={(e) => updateField('components', e.target.value)}
            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="V, S, M"
          />
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Duration</label>
          <input
            type="text"
            value={spell.duration || ''}
            onChange={(e) => updateField('duration', e.target.value)}
            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="Instantaneous"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs text-stone-500 block mb-1">Description</label>
        <textarea
          value={spell.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          rows={6}
          className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          placeholder="Describe what the spell does..."
        />
      </div>

      {/* Higher Levels */}
      <div>
        <label className="text-xs text-stone-500 block mb-1">
          {spell.level === 0 ? 'Cantrip Upgrade' : 'At Higher Levels'}
        </label>
        <textarea
          value={spell.higherLevels || ''}
          onChange={(e) => updateField('higherLevels', e.target.value)}
          rows={2}
          className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          placeholder="Optional: describe scaling effects..."
        />
      </div>

      {/* Source Information */}
      <div className="border-t border-stone-700 pt-4">
        <label className="text-xs text-stone-400 uppercase tracking-wide mb-2 block">Source Information</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-stone-500 block mb-1">Source Book</label>
            <input
              type="text"
              value={spell.source || ''}
              onChange={(e) => updateField('source', e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              placeholder="Player's Handbook (2024)"
            />
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1">Short Name</label>
            <input
              type="text"
              value={spell.sourceShort || ''}
              onChange={(e) => updateField('sourceShort', e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              placeholder="PHB 2024"
            />
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1">Reference URL</label>
            <input
              type="text"
              value={spell.sourceUrl || ''}
              onChange={(e) => updateField('sourceUrl', e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 transition-colors text-sm flex items-center gap-2"
        >
          <Icons.Check className="w-4 h-4" /> {saveLabel}
        </button>
      </div>
    </div>
  );
}

// Import from Image Modal
function ImportSpellModal({ isOpen, onClose, onImport, existingSpells }) {
  const [isDragging, setIsDragging] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedSpell, setParsedSpell] = useState(null);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedSpell, setEditedSpell] = useState(null);
  const fileInputRef = useRef(null);

  // Check for existing spell with same name
  const existingMatch = useMemo(() => {
    if (parsedSpell && existingSpells?.length > 0) {
      return existingSpells.find(s => 
        s.name.toLowerCase().trim() === parsedSpell.name.toLowerCase().trim()
      );
    }
    return null;
  }, [parsedSpell, existingSpells]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processImage(file);
    }
  };

  const processImage = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setImagePreview(base64);
      const base64Data = base64.split(',')[1];
      setImage({ data: base64Data, mediaType: file.type });
      setError(null);
      setParsedSpell(null);
      setEditedSpell(null);
      setEditMode(false);
    };
    reader.readAsDataURL(file);
  };

  const handleParse = async () => {
    if (!image) return;
    
    setIsParsing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/parse-spell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: image.data, mediaType: image.mediaType }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setParsedSpell(data.spell);
        setEditedSpell(data.spell);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = (updateExisting = false) => {
    const spellToImport = editMode ? editedSpell : parsedSpell;
    if (spellToImport) {
      if (updateExisting && existingMatch) {
        // Keep the existing spell's ID
        onImport({ ...spellToImport, id: existingMatch.id });
      } else {
        onImport(spellToImport);
      }
      resetModal();
    }
  };

  const resetModal = () => {
    setImage(null);
    setImagePreview(null);
    setParsedSpell(null);
    setEditedSpell(null);
    setError(null);
    setEditMode(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div 
        className="bg-stone-900 border border-stone-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-purple-400 flex items-center gap-2">
              <Icons.Image />
              Import Spell from Image
            </h2>
            <p className="text-sm text-stone-400">Upload a screenshot of a spell description</p>
          </div>
          <button onClick={handleClose} className="text-stone-400 hover:text-white text-2xl">&times;</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!parsedSpell ? (
            /* Upload Area */
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragging 
                    ? 'border-purple-500 bg-purple-900/20' 
                    : 'border-stone-600 hover:border-purple-500 hover:bg-stone-800/50'
                }`}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Spell preview" className="max-h-64 mx-auto rounded-lg" />
                ) : (
                  <>
                    <Icons.Upload className="w-12 h-12 mx-auto mb-4 text-stone-500" />
                    <p className="text-stone-400">Drag and drop an image here, or click to select</p>
                    <p className="text-sm text-stone-500 mt-2">Supports PNG, JPG, WebP</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {imagePreview && (
                <div className="flex justify-center gap-3">
                  <button
                    onClick={resetModal}
                    className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleParse}
                    disabled={isParsing}
                    className="px-6 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 disabled:bg-stone-700 transition-colors flex items-center gap-2"
                  >
                    {isParsing ? (
                      <>
                        <Icons.Sparkles className="w-4 h-4 animate-spin" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <Icons.Wand className="w-4 h-4" />
                        Parse Spell
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Parsed Spell Preview/Edit */
            <div className="space-y-4">
              {existingMatch && (
                <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3 flex items-start gap-3">
                  <Icons.Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-400 font-medium">Spell already exists</p>
                    <p className="text-sm text-amber-300/80">
                      A spell named "{existingMatch.name}" already exists. You can update it or create a new entry.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-amber-400">{editMode ? 'Edit Spell' : 'Parsed Spell'}</h3>
                {!editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-2 px-3 py-1 rounded bg-stone-700 hover:bg-stone-600 text-sm"
                  >
                    <Icons.Edit className="w-4 h-4" /> Edit
                  </button>
                )}
              </div>

              {editMode ? (
                <SpellForm
                  spell={editedSpell}
                  onChange={setEditedSpell}
                  onSave={() => handleImport(false)}
                  onCancel={() => setEditMode(false)}
                  saveLabel="Import Spell"
                />
              ) : (
                /* Preview */
                <div className="bg-stone-800/50 border border-stone-700 rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="text-xl font-bold text-purple-400">{parsedSpell.name}</h4>
                    <p className="text-stone-400 italic">
                      {parsedSpell.school} {parsedSpell.level === 0 ? 'cantrip' : `level ${parsedSpell.level}`}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><span className="text-stone-500">Casting Time:</span> {parsedSpell.castingTime}</p>
                    <p><span className="text-stone-500">Range:</span> {parsedSpell.range}</p>
                    <p><span className="text-stone-500">Components:</span> {parsedSpell.components}</p>
                    <p><span className="text-stone-500">Duration:</span> {parsedSpell.duration}</p>
                  </div>
                  <p className="text-sm"><span className="text-stone-500">Classes:</span> {parsedSpell.classes?.join(', ') || 'None'}</p>
                  <div className="flex gap-2">
                    {parsedSpell.concentration && <span className="px-2 py-1 bg-amber-900/30 text-amber-400 rounded text-xs">Concentration</span>}
                    {parsedSpell.ritual && <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs">Ritual</span>}
                  </div>
                  <p className="text-stone-300 text-sm whitespace-pre-wrap">{parsedSpell.description}</p>
                  {parsedSpell.higherLevels && (
                    <p className="text-sm">
                      <span className="text-amber-400 font-medium">{parsedSpell.level === 0 ? 'Cantrip Upgrade.' : 'At Higher Levels.'}</span>{' '}
                      {parsedSpell.higherLevels}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {parsedSpell && !editMode && (
          <div className="p-4 border-t border-stone-700 flex justify-end gap-3">
            <button
              onClick={resetModal}
              className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 transition-colors"
            >
              Parse Another
            </button>
            {existingMatch && (
              <button
                onClick={() => handleImport(true)}
                className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 transition-colors"
              >
                Update Existing
              </button>
            )}
            <button
              onClick={() => handleImport(false)}
              className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 transition-colors flex items-center gap-2"
            >
              <Icons.Plus className="w-4 h-4" />
              {existingMatch ? 'Create New' : 'Import Spell'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SpellCard({ spell, expanded, editing, onToggle, onEdit, onSave, onCancel }) {
  const [editedSpell, setEditedSpell] = useState(spell);
  
  useEffect(() => {
    setEditedSpell(spell);
  }, [spell, editing]);

  const levelText = spell.level === 0 
    ? 'Cantrip' 
    : `${spell.level}${getOrdinalSuffix(spell.level)}-level`;
  
  const schoolColor = getSchoolColor(spell.school);

  const handleSave = () => {
    onSave(editedSpell);
  };

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${expanded ? 'border-amber-700/50 bg-stone-800/80' : 'border-stone-700/50 bg-stone-800/30 hover:bg-stone-800/50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onToggle}
          className="flex items-center gap-4 flex-1 text-left"
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${schoolColor.bg}`}>
            <Icons.Sparkles className={schoolColor.text} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-amber-400">{spell.name}</h3>
            <p className="text-sm text-stone-400">
              {spell.school} {levelText} ({spell.classes?.join(', ') || 'No classes'})
            </p>
          </div>
        </button>
        <div className="flex items-center gap-3">
          {spell.concentration && (
            <span className="px-2 py-1 bg-amber-900/30 text-amber-400 rounded text-xs">Concentration</span>
          )}
          {spell.ritual && (
            <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs">Ritual</span>
          )}
          {expanded && !editing && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-2 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-amber-900/30 transition-colors"
              title="Edit Spell"
            >
              <Icons.Edit className="w-4 h-4" />
            </button>
          )}
          <button onClick={onToggle}>
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className={`w-5 h-5 text-stone-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
            >
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-stone-700/50">
          {editing ? (
            <div className="pt-4">
              <SpellForm
                spell={editedSpell}
                onChange={setEditedSpell}
                onSave={handleSave}
                onCancel={onCancel}
              />
            </div>
          ) : (
            <div className="pt-4 spell-content">
              <div className="mb-4">
                <h2 className="text-2xl font-bold italic text-purple-400">{spell.name}</h2>
                <p className="text-stone-400 italic">{spell.school} {levelText} ({spell.classes?.join(', ') || 'No classes'})</p>
              </div>
              <div className="space-y-1 mb-4">
                <p><span className="font-bold">Casting Time:</span> {spell.castingTime}</p>
                <p><span className="font-bold">Range:</span> {spell.range}</p>
                <p><span className="font-bold">Components:</span> {spell.components}</p>
                <p><span className="font-bold">Duration:</span> {spell.duration}</p>
              </div>
              <div className="space-y-3 text-stone-200">
                {(spell.description || '').split('\n\n').map((paragraph, i) => (
                  <p key={i} dangerouslySetInnerHTML={{ __html: formatSpellText(paragraph) }} />
                ))}
              </div>
              {spell.higherLevels && (
                <p className="mt-4">
                  <span className="font-bold italic text-amber-400">
                    {spell.level === 0 ? 'Cantrip Upgrade.' : 'At Higher Levels.'}
                  </span>{' '}
                  {spell.higherLevels}
                </p>
              )}
              {/* Source Info */}
              {(spell.source || spell.sourceUrl) && (
                <div className="mt-4 pt-3 border-t border-stone-700/50 flex items-center justify-between text-sm">
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
          )}
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
  return text
    .replace(/\b(Sphere|Cube|Cone|Line|Cylinder|Emanation)\b/g, '<span class="text-purple-400 font-semibold">$1</span>')
    .replace(/\b(\d+d\d+)\b/g, '<span class="font-mono text-amber-300">$1</span>')
    .replace(/\b(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\b/g, '<span class="font-semibold">$1</span>')
    .replace(/\b(saving throw|attack roll)\b/gi, '<span class="font-semibold">$1</span>');
}
