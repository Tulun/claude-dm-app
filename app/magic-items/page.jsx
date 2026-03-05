'use client';

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { MAGIC_ITEMS, ITEM_CATEGORIES, RARITIES, CLASSES, RARITY_COLORS, RARITY_VALUES, searchItems, sortItems } from './magicItems';

export default function MagicItemsPage() {
  const [items, setItems] = useState([]);
  const [customItems, setCustomItems] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [rarityFilter, setRarityFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All');
  const [attunementFilter, setAttunementFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Load custom items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('customMagicItems');
    if (saved) setCustomItems(JSON.parse(saved));
  }, []);

  // Save custom items
  useEffect(() => {
    localStorage.setItem('customMagicItems', JSON.stringify(customItems));
  }, [customItems]);

  // Filter and sort items
  useEffect(() => {
    const allItems = [...MAGIC_ITEMS, ...customItems];
    let filtered = searchItems(search, {
      category: categoryFilter,
      rarity: rarityFilter,
      classReq: classFilter,
      attunement: attunementFilter === 'yes' ? true : attunementFilter === 'no' ? false : undefined
    });
    // Include custom items in search
    if (customItems.length > 0) {
      const customFiltered = customItems.filter(item => {
        if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.description.toLowerCase().includes(search.toLowerCase())) return false;
        if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
        if (rarityFilter !== 'All' && item.rarity !== rarityFilter) return false;
        if (classFilter !== 'All' && item.classes && !item.classes.includes(classFilter)) return false;
        if (attunementFilter === 'yes' && !item.attunement) return false;
        if (attunementFilter === 'no' && item.attunement) return false;
        return true;
      });
      filtered = [...filtered.filter(i => !i.custom), ...customFiltered];
    }
    const sorted = sortItems(filtered, sortBy, sortDir);
    setItems(sorted);
  }, [search, categoryFilter, rarityFilter, classFilter, attunementFilter, sortBy, sortDir, customItems]);

  const addCustomItem = (item) => {
    const newItem = { ...item, id: `custom-${Date.now()}`, custom: true };
    setCustomItems([...customItems, newItem]);
    setShowAddModal(false);
  };

  const updateCustomItem = (item) => {
    setCustomItems(customItems.map(i => i.id === item.id ? item : i));
    setEditingItem(null);
  };

  const deleteCustomItem = (id) => {
    if (confirm('Delete this custom item?')) {
      setCustomItems(customItems.filter(i => i.id !== id));
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('asc'); }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <Navbar />

      <div className="max-w-7xl mx-auto p-4">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-amber-400">Magic Item Glossary</h1>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-sm font-medium">
            + Add Custom Item
          </button>
        </div>
        {/* Filters */}
        <div className="bg-stone-900 rounded-lg p-4 mb-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="flex-1 min-w-[200px] bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-600"
            />
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2">
              <option value="All">All Categories</option>
              {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)} className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2">
              <option value="All">All Rarities</option>
              {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2">
              <option value="All">All Classes</option>
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={attunementFilter} onChange={(e) => setAttunementFilter(e.target.value)} className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2">
              <option value="all">Attunement: Any</option>
              <option value="yes">Requires Attunement</option>
              <option value="no">No Attunement</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-stone-500">Sort by:</span>
            {['name', 'rarity', 'category'].map(field => (
              <button key={field} onClick={() => toggleSort(field)} className={`px-3 py-1 rounded ${sortBy === field ? 'bg-amber-700 text-white' : 'bg-stone-700 text-stone-300 hover:bg-stone-600'}`}>
                {field.charAt(0).toUpperCase() + field.slice(1)} {sortBy === field && (sortDir === 'asc' ? '↑' : '↓')}
              </button>
            ))}
            <span className="ml-auto text-stone-500">{items.length} items</span>
          </div>
        </div>

        {/* Rarity Value Reference */}
        <div className="bg-stone-900/50 rounded-lg p-3 mb-4 flex flex-wrap gap-4 text-xs">
          <span className="text-stone-500">Base Values:</span>
          {RARITIES.filter(r => RARITY_VALUES[r]).map(r => (
            <span key={r} className={RARITY_COLORS[r].text}>
              {r}: {RARITY_VALUES[r].toLocaleString()} GP
            </span>
          ))}
          <span className="text-red-400">Artifact: Priceless</span>
        </div>

        {/* Items List */}
        <div className="space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-12 text-stone-500">No items found matching your criteria.</div>
          ) : (
            items.map(item => {
              const colors = RARITY_COLORS[item.rarity] || RARITY_COLORS['Common'];
              // Build subtitle like "Armor (Any Medium or Heavy), Uncommon"
              let subtitle = item.category;
              if (item.weaponType) subtitle = `Weapon (${item.weaponType})`;
              else if (item.armorType) subtitle = `Armor (${item.armorType})`;
              subtitle += `, ${item.rarity}`;
              if (item.attunement) {
                subtitle += item.classes ? ` (Requires Attunement by ${item.classes.join(', ')})` : ' (Requires Attunement)';
              }
              
              return (
                <div key={item.id} className="border-b border-amber-800/30 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className={`text-lg font-bold italic ${colors.text}`}>
                        {item.name}
                        {item.custom && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-cyan-900/50 text-cyan-400 not-italic">Custom</span>}
                        {item.cursed && <span className="ml-2 text-xs text-red-400 not-italic">⚠ Cursed</span>}
                      </h3>
                      <p className="text-sm text-stone-400 italic">{subtitle}</p>
                    </div>
                    {item.custom && (
                      <div className="flex gap-2">
                        <button onClick={() => setEditingItem(item)} className="px-2 py-1 rounded text-xs bg-stone-700 hover:bg-stone-600">Edit</button>
                        <button onClick={() => deleteCustomItem(item.id)} className="px-2 py-1 rounded text-xs bg-red-900/50 hover:bg-red-800/50 text-red-400">Delete</button>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 h-px bg-gradient-to-r from-amber-600 to-transparent w-full"></div>
                  <p className="mt-3 text-stone-300 leading-relaxed">{item.description}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingItem) && (
        <ItemModal
          item={editingItem}
          onSave={editingItem ? updateCustomItem : addCustomItem}
          onClose={() => { setShowAddModal(false); setEditingItem(null); }}
        />
      )}
    </div>
  );
}

function ItemModal({ item, onSave, onClose }) {
  const [form, setForm] = useState(item || {
    name: '', category: 'Wondrous', rarity: 'Common', attunement: false,
    requirements: '', description: '', weaponType: '', armorType: '', cursed: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('Name is required');
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-amber-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <h2 className="text-lg font-bold text-amber-400">{item ? 'Edit Item' : 'Add Custom Item'}</h2>
          
          <div>
            <label className="text-xs text-stone-500">Name *</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 mt-1" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-500">Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 mt-1">
                {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-stone-500">Rarity</label>
              <select value={form.rarity} onChange={e => setForm({...form, rarity: e.target.value})} className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 mt-1">
                {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.attunement} onChange={e => setForm({...form, attunement: e.target.checked})} className="rounded" />
              <span className="text-sm">Requires Attunement</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.cursed} onChange={e => setForm({...form, cursed: e.target.checked})} className="rounded" />
              <span className="text-sm text-red-400">Cursed</span>
            </label>
          </div>

          {form.attunement && (
            <div>
              <label className="text-xs text-stone-500">Attunement Requirements (optional)</label>
              <input type="text" value={form.requirements} onChange={e => setForm({...form, requirements: e.target.value})} placeholder="e.g., Spellcaster, Paladin" className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 mt-1" />
            </div>
          )}

          {form.category === 'Weapon' && (
            <div>
              <label className="text-xs text-stone-500">Weapon Type</label>
              <input type="text" value={form.weaponType} onChange={e => setForm({...form, weaponType: e.target.value})} placeholder="e.g., Any Sword, Longbow" className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 mt-1" />
            </div>
          )}

          {form.category === 'Armor' && (
            <div>
              <label className="text-xs text-stone-500">Armor Type</label>
              <input type="text" value={form.armorType} onChange={e => setForm({...form, armorType: e.target.value})} placeholder="e.g., Plate, Medium or Heavy" className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 mt-1" />
            </div>
          )}

          <div>
            <label className="text-xs text-stone-500">Description *</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={4} className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 mt-1 resize-none" required />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg bg-stone-700 hover:bg-stone-600">Cancel</button>
            <button type="submit" className="flex-1 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 font-medium">Save Item</button>
          </div>
        </form>
      </div>
    </div>
  );
}
