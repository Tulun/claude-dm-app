'use client';

import { useState } from 'react';
import Icons from '../../components/Icons';
import { WORLD_CATEGORIES } from './constants';
import WorldItemForm from './WorldItemForm';
import WorldItemCard from './WorldItemCard';

export default function WorldTab({ data, onSave }) {
  const [activeCategory, setActiveCategory] = useState('places');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [search, setSearch] = useState('');

  const world = data?.world || {};
  const items = world[activeCategory] || [];
  
  const filteredItems = items.filter(item => 
    !search || item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (item) => {
    let updated;
    if (editingItem) {
      updated = items.map(i => i.id === item.id ? item : i);
    } else {
      updated = [...items, { ...item, id: `${activeCategory}-${Date.now()}` }];
    }
    onSave({ world: { ...world, [activeCategory]: updated } });
    setShowForm(false);
    setEditingItem(null);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this entry?')) {
      onSave({ world: { ...world, [activeCategory]: items.filter(i => i.id !== id) } });
    }
  };

  const category = WORLD_CATEGORIES.find(c => c.key === activeCategory);
  const IconComponent = Icons[category?.icon] || Icons.Globe;

  const tabColors = {
    emerald: { active: 'bg-emerald-700 text-emerald-100', inactive: 'bg-stone-800 text-stone-300 hover:bg-stone-700' },
    teal: { active: 'bg-teal-700 text-teal-100', inactive: 'bg-stone-800 text-stone-300 hover:bg-stone-700' },
    amber: { active: 'bg-amber-700 text-amber-100', inactive: 'bg-stone-800 text-stone-300 hover:bg-stone-700' },
    purple: { active: 'bg-purple-700 text-purple-100', inactive: 'bg-stone-800 text-stone-300 hover:bg-stone-700' },
    red: { active: 'bg-red-700 text-red-100', inactive: 'bg-stone-800 text-stone-300 hover:bg-stone-700' },
    blue: { active: 'bg-blue-700 text-blue-100', inactive: 'bg-stone-800 text-stone-300 hover:bg-stone-700' }
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
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap">
        {WORLD_CATEGORIES.map(cat => {
          const CatIcon = Icons[cat.icon] || Icons.Globe;
          const isActive = activeCategory === cat.key;
          const colors = tabColors[cat.color] || tabColors.amber;
          
          return (
            <button
              key={cat.key}
              onClick={() => { setActiveCategory(cat.key); setShowForm(false); setEditingItem(null); }}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${isActive ? colors.active : colors.inactive}`}
            >
              <CatIcon className="w-4 h-4" />
              {cat.label}
              <span className="text-xs opacity-70">({(world[cat.key] || []).length})</span>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 w-4 h-4" />
          <input
            type="text"
            placeholder={`Search ${category?.label.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 w-64"
          />
        </div>
        <button
          onClick={() => { setEditingItem(null); setShowForm(true); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${btnColors[category?.color]} transition-colors`}
        >
          <Icons.Plus /> Add {category?.label.slice(0, -1)}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <WorldItemForm 
          item={editingItem}
          category={activeCategory}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingItem(null); }}
        />
      )}

      {/* Items List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => (
          <WorldItemCard 
            key={item.id}
            item={item}
            category={activeCategory}
            onEdit={() => { setEditingItem(item); setShowForm(true); }}
            onDelete={() => handleDelete(item.id)}
          />
        ))}
        {filteredItems.length === 0 && (
          <div className="col-span-full text-center py-12 text-stone-500">
            <IconComponent className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No {category?.label.toLowerCase()} yet</p>
            <p className="text-sm">Add world-building content for your campaign</p>
          </div>
        )}
      </div>
    </div>
  );
}
