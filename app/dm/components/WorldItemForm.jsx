'use client';

import { useState } from 'react';
import Icons from '../../components/Icons';
import { WORLD_CATEGORIES, EMPTY_WORLD_ITEM, WORLD_PLACEHOLDERS } from './constants';

export default function WorldItemForm({ item, category, onSave, onCancel }) {
  const [form, setForm] = useState(item || { ...EMPTY_WORLD_ITEM });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const cat = WORLD_CATEGORIES.find(c => c.key === category);
  const ph = WORLD_PLACEHOLDERS[category] || WORLD_PLACEHOLDERS.lore;

  const bgColors = {
    emerald: 'bg-emerald-950/30 border-emerald-700/50',
    teal: 'bg-teal-950/30 border-teal-700/50',
    amber: 'bg-amber-950/30 border-amber-700/50',
    purple: 'bg-purple-950/30 border-purple-700/50',
    red: 'bg-red-950/30 border-red-700/50',
    blue: 'bg-blue-950/30 border-blue-700/50'
  };

  const btnColors = {
    emerald: 'bg-emerald-700 hover:bg-emerald-600',
    teal: 'bg-teal-700 hover:bg-teal-600',
    amber: 'bg-amber-700 hover:bg-amber-600',
    purple: 'bg-purple-700 hover:bg-purple-600',
    red: 'bg-red-700 hover:bg-red-600',
    blue: 'bg-blue-700 hover:bg-blue-600'
  };

  return (
    <div className={`${bgColors[cat?.color]} border rounded-xl p-4 space-y-4`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-amber-400">
          {item ? 'Edit' : 'New'} {cat?.label.slice(0, -1)}
        </h3>
        <button onClick={onCancel} className="text-stone-400 hover:text-white text-xl">&times;</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-stone-500 block mb-1">Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="Name"
          />
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Tags</label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => update('tags', e.target.value)}
            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="e.g., important, arc-1, mystery"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-stone-500 block mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          rows={2}
          className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          placeholder={ph.description}
        />
      </div>

      <div>
        <label className="text-xs text-stone-500 block mb-1">Details</label>
        <textarea
          value={form.details}
          onChange={(e) => update('details', e.target.value)}
          rows={4}
          className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          placeholder={ph.details}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-stone-500 block mb-1">Connections</label>
          <textarea
            value={form.connections}
            onChange={(e) => update('connections', e.target.value)}
            rows={2}
            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="Links to other people, places, events..."
          />
        </div>
        <div>
          <label className="text-xs text-stone-500 block mb-1">Secrets (DM only)</label>
          <textarea
            value={form.secrets}
            onChange={(e) => update('secrets', e.target.value)}
            rows={2}
            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="Hidden information..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600">
          Cancel
        </button>
        <button 
          onClick={() => form.name && onSave(form)}
          className={`px-4 py-2 rounded-lg ${btnColors[cat?.color]} flex items-center gap-2`}
        >
          <Icons.Check className="w-4 h-4" />
          {item ? 'Save Changes' : 'Create'}
        </button>
      </div>
    </div>
  );
}
