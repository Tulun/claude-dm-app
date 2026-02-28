'use client';

import { useState } from 'react';
import Icons from '../../components/Icons';
import { CHARACTER_TYPES } from './constants';
import CharacterForm from './CharacterForm';
import CharacterCard from './CharacterCard';

export default function CharactersTab({ data, onSave }) {
  const [showForm, setShowForm] = useState(false);
  const [editingChar, setEditingChar] = useState(null);
  const [filterType, setFilterType] = useState(null);
  const [search, setSearch] = useState('');

  const characters = data?.characters || [];
  
  const filteredCharacters = characters.filter(c => {
    if (filterType && c.type !== filterType) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSave = (char) => {
    let updated;
    if (editingChar) {
      updated = characters.map(c => c.id === char.id ? char : c);
    } else {
      updated = [...characters, { ...char, id: `char-${Date.now()}` }];
    }
    onSave({ characters: updated });
    setShowForm(false);
    setEditingChar(null);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this character?')) {
      onSave({ characters: characters.filter(c => c.id !== id) });
    }
  };

  const filterBtnClass = (type, color) => {
    if (filterType === type) {
      const activeColors = {
        teal: 'bg-teal-700 text-teal-100',
        blue: 'bg-blue-700 text-blue-100',
        red: 'bg-red-700 text-red-100',
        purple: 'bg-purple-700 text-purple-100'
      };
      return activeColors[color] || 'bg-amber-700 text-amber-100';
    }
    return 'bg-stone-700 text-stone-300 hover:bg-stone-600';
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search characters..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 w-64"
            />
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setFilterType(null)}
              className={`px-3 py-1 rounded text-xs ${!filterType ? 'bg-amber-700 text-amber-100' : 'bg-stone-700 text-stone-300 hover:bg-stone-600'}`}
            >
              All
            </button>
            {CHARACTER_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setFilterType(filterType === t.value ? null : t.value)}
                className={`px-3 py-1 rounded text-xs ${filterBtnClass(t.value, t.color)}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => { setEditingChar(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 transition-colors"
        >
          <Icons.Plus /> New Character
        </button>
      </div>

      {/* Character Form */}
      {showForm && (
        <CharacterForm 
          character={editingChar}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingChar(null); }}
        />
      )}

      {/* Character List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCharacters.map(char => (
          <CharacterCard 
            key={char.id} 
            character={char}
            onEdit={() => { setEditingChar(char); setShowForm(true); }}
            onDelete={() => handleDelete(char.id)}
          />
        ))}
        {filteredCharacters.length === 0 && (
          <div className="col-span-full text-center py-12 text-stone-500">
            <Icons.Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No characters yet</p>
            <p className="text-sm">Create NPCs, DMNPCs, or BBEGs for your campaign</p>
          </div>
        )}
      </div>
    </div>
  );
}
