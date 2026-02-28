'use client';

import { useState } from 'react';
import Icons from '../../components/Icons';
import { CHARACTER_TYPES, EMPTY_CHARACTER } from './constants';

export default function CharacterForm({ character, onSave, onCancel }) {
  const [form, setForm] = useState(character || { ...EMPTY_CHARACTER });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="bg-stone-800/50 border border-stone-700 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-amber-400">{character ? 'Edit Character' : 'New Character'}</h3>
        <button onClick={onCancel} className="text-stone-400 hover:text-white text-xl">&times;</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="col-span-2">
          <label className="text-xs text-stone-500 block mb-1">Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="Character name"
          />
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Type</label>
          <select
            value={form.type}
            onChange={(e) => update('type', e.target.value)}
            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            {CHARACTER_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Role</label>
          <input
            type="text"
            value={form.role}
            onChange={(e) => update('role', e.target.value)}
            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="e.g., Tavern keeper"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-stone-500 block mb-1">Appearance</label>
          <textarea
            value={form.appearance}
            onChange={(e) => update('appearance', e.target.value)}
            rows={2}
            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="Physical description..."
          />
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Personality</label>
          <textarea
            value={form.personality}
            onChange={(e) => update('personality', e.target.value)}
            rows={2}
            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="Traits, quirks, mannerisms..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-stone-500 block mb-1">Motivation</label>
          <textarea
            value={form.motivation}
            onChange={(e) => update('motivation', e.target.value)}
            rows={2}
            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="What do they want? Why?"
          />
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Secrets</label>
          <textarea
            value={form.secrets}
            onChange={(e) => update('secrets', e.target.value)}
            rows={2}
            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="Hidden information..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-stone-500 block mb-1">Stats/Combat</label>
          <textarea
            value={form.stats}
            onChange={(e) => update('stats', e.target.value)}
            rows={2}
            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="AC, HP, attacks, etc..."
          />
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Special Abilities</label>
          <textarea
            value={form.abilities}
            onChange={(e) => update('abilities', e.target.value)}
            rows={2}
            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="Class features, spells, etc..."
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-stone-500 block mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          rows={3}
          className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          placeholder="Additional notes, relationships, plot hooks..."
        />
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600">
          Cancel
        </button>
        <button 
          onClick={() => form.name && onSave(form)}
          className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 flex items-center gap-2"
        >
          <Icons.Check className="w-4 h-4" />
          {character ? 'Save Changes' : 'Create Character'}
        </button>
      </div>
    </div>
  );
}
