'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { ITEM_CATEGORIES, RARITIES, CLASSES, RARITY_COLORS, RARITY_VALUES, searchItems, sortItems } from './magicItems';

export default function MagicItemsPage() {
  const [allItems, setAllItems] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [rarityFilter, setRarityFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All');
  const [attunementFilter, setAttunementFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [expandedLetters, setExpandedLetters] = useState({});

  // Load all items from API
  useEffect(() => {
    fetch('/api/magic-items')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAllItems(data);
        setLoading(false);
      })
      .catch(err => { console.error('Failed to load magic items:', err); setLoading(false); });
  }, []);

  // Filter and sort items
  useEffect(() => {
    let filtered = searchItems(search, {
      category: categoryFilter,
      rarity: rarityFilter,
      classReq: classFilter,
      attunement: attunementFilter === 'yes' ? true : attunementFilter === 'no' ? false : undefined
    }, allItems);
    const sorted = sortItems(filtered, 'name', 'asc');
    setItems(sorted);
  }, [search, categoryFilter, rarityFilter, classFilter, attunementFilter, allItems]);

  // Group items by first letter
  const groupedItems = items.reduce((acc, item) => {
    const letter = item.name[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(item);
    return acc;
  }, {});

  const alphabet = Object.keys(groupedItems).sort();

  const saveItem = async (item) => {
    try {
      const res = await fetch('/api/magic-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const saved = await res.json();
        setAllItems(prev => {
          const idx = prev.findIndex(i => i.id === saved.id);
          if (idx >= 0) return prev.map(i => i.id === saved.id ? saved : i);
          return [...prev, saved];
        });
      }
    } catch (err) {
      console.error('Failed to save magic item:', err);
    }
    setShowAddModal(false);
    setEditingItem(null);
  };

  const deleteItem = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      const res = await fetch(`/api/magic-items?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAllItems(prev => prev.filter(i => i.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete magic item:', err);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('All');
    setRarityFilter('All');
    setClassFilter('All');
    setAttunementFilter('all');
  };

  const hasActiveFilters = search || categoryFilter !== 'All' || rarityFilter !== 'All' || classFilter !== 'All' || attunementFilter !== 'all';

  const toggleLetter = (letter) => {
    setExpandedLetters(prev => ({ ...prev, [letter]: !prev[letter] }));
  };

  const scrollToItem = (itemId) => {
    const element = document.getElementById(`item-${itemId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  };

  return (
    <div className="h-screen bg-stone-950 text-stone-100 flex flex-col overflow-hidden">
      <Navbar />

      {/* Fixed Filter Bar */}
      <div className="flex-shrink-0 bg-stone-900 border-b border-stone-800 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search magic items..."
            className="flex-1 min-w-[200px] bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-600"
          />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm">
            <option value="All">All Types</option>
            {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)} className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm">
            <option value="All">All Rarities</option>
            {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm">
            <option value="All">All Classes</option>
            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={attunementFilter} onChange={(e) => setAttunementFilter(e.target.value)} className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm">
            <option value="all">Attunement: Any</option>
            <option value="yes">Required</option>
            <option value="no">Not Required</option>
          </select>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="px-3 py-2 rounded-lg text-xs bg-red-900/30 text-red-400 hover:bg-red-900/50">
              Clear
            </button>
          )}
          <button onClick={() => setShowAddModal(true)} className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-sm font-medium">
            + Custom
          </button>
          <span className="text-stone-500 text-sm">{items.length} items</span>
        </div>
      </div>

      {/* Main Layout - Both panels scroll independently */}
      <div className="flex flex-1 min-h-0">
        {/* A-Z Sidebar */}
        <aside className="w-72 flex-shrink-0 bg-stone-900 border-r border-stone-800 overflow-y-auto pb-8">
          {/* Sidebar Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-amber-700 to-amber-800 px-4 py-2">
            <h2 className="font-bold text-white">Magic Items A–Z</h2>
          </div>
          
          {/* Letter Groups */}
          <div>
            {alphabet.length === 0 ? (
              <div className="p-4 text-stone-500 text-sm">No items match your filters</div>
            ) : (
              alphabet.map(letter => (
                <div key={letter}>
                  {/* Letter Header */}
                  <button
                    onClick={() => toggleLetter(letter)}
                    className="w-full flex items-center justify-between px-4 py-2 bg-stone-800/50 hover:bg-stone-800 text-amber-400 font-medium border-b border-stone-800"
                  >
                    <span>Magic Items ({letter})</span>
                    <span className="text-stone-500">
                      {expandedLetters[letter] ? '▼' : '›'}
                    </span>
                  </button>
                  
                  {/* Items under this letter */}
                  {expandedLetters[letter] && (
                    <div className="bg-stone-950">
                      {groupedItems[letter].map(item => (
                        <button
                          key={item.id}
                          onClick={() => scrollToItem(item.id)}
                          className="w-full text-left px-6 py-2 text-sm border-b border-stone-900 flex items-center justify-between text-stone-300 hover:bg-stone-800 hover:text-white"
                        >
                          <span>{item.name}</span>
                          <span className="text-stone-600">›</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main Content - Infinite Scroll */}
        <main className="flex-1 overflow-y-auto bg-stone-950 p-6">
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-stone-500">
              <div className="text-center">
                <p className="text-lg">No items found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8">
              {alphabet.map(letter => (
                <section key={letter} id={`section-${letter}`}>
                  {/* Letter Header */}
                  <h2 className="text-lg font-bold text-amber-400 border-b border-amber-800/50 pb-2 mb-4">
                    Magic Items ({letter})
                  </h2>
                  
                  {/* Items */}
                  <div className="space-y-6">
                    {groupedItems[letter].map(item => (
                      <ItemCard 
                        key={item.id} 
                        item={item} 
                        onEdit={() => setEditingItem(item)}
                        onDelete={() => deleteItem(item.id)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingItem) && (
        <ItemModal
          item={editingItem}
          onSave={saveItem}
          onClose={() => { setShowAddModal(false); setEditingItem(null); }}
        />
      )}
    </div>
  );
}

function ItemCard({ item, onEdit, onDelete }) {
  const colors = RARITY_COLORS[item.rarity] || RARITY_COLORS['Common'];
  
  let subtitle = item.category;
  if (item.weaponType) subtitle = `Weapon (${item.weaponType})`;
  else if (item.armorType) subtitle = `Armor (${item.armorType})`;
  subtitle += `, ${item.rarity}`;
  if (item.attunement) {
    subtitle += item.classes ? ` (Requires Attunement by ${item.classes.join(', ')})` : ' (Requires Attunement)';
  }
  
  return (
    <article id={`item-${item.id}`} className="pb-5 border-b border-stone-800">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className={`text-xl font-bold italic ${colors.text}`}>
            {item.name}
          </h3>
          <p className="text-sm text-stone-400 italic">{subtitle}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={onEdit} className="px-2 py-1 rounded text-xs bg-stone-700 hover:bg-stone-600">Edit</button>
          <button onClick={onDelete} className="px-2 py-1 rounded text-xs bg-red-900/50 hover:bg-red-800/50 text-red-400">Delete</button>
        </div>
      </div>
      
      {item.cursed && (
        <div className="flex gap-2 mt-1">
          <span className="text-xs px-2 py-0.5 rounded bg-red-900/50 text-red-400">⚠ Cursed</span>
        </div>
      )}
      
      <div className="mt-2 h-px bg-gradient-to-r from-amber-600/60 to-transparent"></div>
      
      <p className="mt-3 text-stone-300 leading-relaxed">{item.description}</p>
    </article>
  );
}

function ItemModal({ item, onSave, onClose }) {
  const [form, setForm] = useState(item || {
    name: '', category: 'Wondrous', rarity: 'Common', attunement: false,
    classes: [], description: '', weaponType: '', armorType: '', cursed: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('Name is required');
    if (!form.description.trim()) return alert('Description is required');
    onSave(form);
  };

  const toggleClass = (cls) => {
    const classes = form.classes || [];
    if (classes.includes(cls)) {
      setForm({ ...form, classes: classes.filter(c => c !== cls) });
    } else {
      setForm({ ...form, classes: [...classes, cls] });
    }
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
              <label className="text-xs text-stone-500">Class Requirements (optional)</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {CLASSES.map(cls => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => toggleClass(cls)}
                    className={`px-2 py-1 rounded text-xs ${(form.classes || []).includes(cls) ? 'bg-amber-700 text-white' : 'bg-stone-700 text-stone-400'}`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.category === 'Weapon' && (
            <div>
              <label className="text-xs text-stone-500">Weapon Type</label>
              <input type="text" value={form.weaponType || ''} onChange={e => setForm({...form, weaponType: e.target.value})} placeholder="e.g., Any Sword, Longbow" className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 mt-1" />
            </div>
          )}

          {form.category === 'Armor' && (
            <div>
              <label className="text-xs text-stone-500">Armor Type</label>
              <input type="text" value={form.armorType || ''} onChange={e => setForm({...form, armorType: e.target.value})} placeholder="e.g., Plate, Medium or Heavy" className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-2 mt-1" />
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
