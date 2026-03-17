'use client';

import { useState, useMemo } from 'react';
import Icons from '../../../components/Icons';
import { Tooltip } from '../../../components/ui';
import { MAGIC_ITEMS, RARITY_COLORS, ITEM_CATEGORIES, RARITIES } from '../../../magic-items/magicItems';

const WEAPON_PROPERTIES = [
  { name: 'Ammunition', desc: 'Requires ammunition to fire. Drawing ammo is part of the attack.' },
  { name: 'Finesse', desc: 'Use STR or DEX for attack and damage rolls.' },
  { name: 'Heavy', desc: 'Small creatures have disadvantage on attacks.' },
  { name: 'Light', desc: 'Can engage in two-weapon fighting.' },
  { name: 'Loading', desc: 'Only one attack per action, bonus action, or reaction.' },
  { name: 'Range', desc: 'Can attack at a distance. Two numbers: normal/long range.' },
  { name: 'Reach', desc: 'Adds 5 ft to your reach when attacking.' },
  { name: 'Thrown', desc: 'Can be thrown for a ranged attack using same modifier.' },
  { name: 'Two-Handed', desc: 'Requires two hands to use.' },
  { name: 'Versatile', desc: 'Can be used with one or two hands (larger damage die).' },
  { name: 'Simple', desc: 'Simple weapon - most classes are proficient.' },
  { name: 'Martial', desc: 'Martial weapon - requires proficiency.' },
];

const WEAPON_MASTERIES = [
  { name: 'Cleave', desc: 'On hit, damage another creature within 5 ft (weapon damage dice only).' },
  { name: 'Graze', desc: 'On miss, deal damage equal to ability modifier used.' },
  { name: 'Nick', desc: 'Make extra attack with light weapon (no ability mod to damage).' },
  { name: 'Push', desc: 'On hit, push Large or smaller target 10 ft away.' },
  { name: 'Sap', desc: 'On hit, target has disadvantage on next attack before your next turn.' },
  { name: 'Slow', desc: 'On hit, reduce target speed by 10 ft until start of your next turn.' },
  { name: 'Topple', desc: 'On hit, target makes CON save (DC 8 + prof + mod) or falls prone.' },
  { name: 'Vex', desc: 'On hit, gain advantage on next attack against that target before end of next turn.' },
];

const ARMOR_PROPERTIES = [
  { name: 'Light', desc: 'Add full DEX modifier to AC. No STR requirement.' },
  { name: 'Medium', desc: 'Add DEX modifier to AC (max +2). May have STR requirement.' },
  { name: 'Heavy', desc: 'No DEX modifier to AC. Has STR requirement.' },
  { name: 'Shield', desc: '+2 AC bonus. Requires one free hand to use.' },
  { name: 'Stealth Disadv.', desc: 'Disadvantage on Stealth checks while wearing.' },
];

const PropButton = ({ prop, isSelected, onClick, color = 'amber' }) => {
  const colorClasses = {
    amber: isSelected ? 'bg-amber-800 text-amber-200 ring-1 ring-amber-600' : 'bg-stone-700 text-stone-400 hover:bg-stone-600',
    red: isSelected ? 'bg-red-800 text-red-200 ring-1 ring-red-600' : 'bg-stone-700 text-stone-400 hover:bg-stone-600',
    blue: isSelected ? 'bg-blue-800 text-blue-200 ring-1 ring-blue-600' : 'bg-stone-700 text-stone-400 hover:bg-stone-600',
    purple: isSelected ? 'bg-purple-800 text-purple-200 ring-1 ring-purple-600' : 'bg-stone-700 text-stone-400 hover:bg-stone-600',
  };
  return (
    <Tooltip text={prop.desc}>
      <button onClick={onClick} className={`px-1.5 py-0.5 rounded text-xs transition-colors cursor-pointer ${colorClasses[color]}`}>
        {prop.name}
      </button>
    </Tooltip>
  );
};

// ─── Delete Confirmation Modal ───────────────────────────────────

function DeleteConfirmModal({ itemName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]" onClick={onCancel}>
      <div className="bg-stone-800 border border-stone-700 rounded-xl p-5 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-stone-100 mb-2">Delete Item</h3>
        <p className="text-sm text-stone-400 mb-4">
          Are you sure you want to delete <span className="text-stone-200 font-medium">{itemName || 'this item'}</span>? This cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-sm">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-sm text-white">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Item Modal ──────────────────────────────────────────────

function AddItemModal({ onAdd, onClose }) {
  const [mode, setMode] = useState('search'); // 'search' or 'custom'
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [rarityFilter, setRarityFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  // Custom item fields
  const [customName, setCustomName] = useState('');
  const [customType, setCustomType] = useState('gear');

  const filteredItems = useMemo(() => {
    return MAGIC_ITEMS
      .filter(item => {
        if (categoryFilter && item.category !== categoryFilter) return false;
        if (rarityFilter && item.rarity !== rarityFilter) return false;
        if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [search, categoryFilter, rarityFilter]);

  const handleAddMagicItem = (magicItem) => {
    const itemType = magicItem.category === 'Weapon' ? 'weapon' : magicItem.category === 'Armor' ? 'armor' : 'gear';
    const newItem = {
      id: Date.now(),
      name: magicItem.name,
      quantity: 1,
      weight: '',
      description: magicItem.description,
      itemType,
      magicItemId: magicItem.id,
      rarity: magicItem.rarity,
      attunement: magicItem.attunement,
    };
    onAdd(newItem);
    onClose();
  };

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    const newItem = {
      id: Date.now(),
      name: customName.trim(),
      quantity: 1,
      weight: '',
      description: '',
      itemType: customType,
    };
    onAdd(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-stone-700 rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-stone-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-amber-400">Add Item</h2>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-200 p-1"><Icons.X /></button>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setMode('search')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'search' ? 'bg-amber-700 text-amber-100' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
              }`}
            >
              <span className="flex items-center gap-2"><Icons.Search /> Search Magic Items</span>
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'custom' ? 'bg-amber-700 text-amber-100' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
              }`}
            >
              <span className="flex items-center gap-2"><Icons.Plus /> Custom Item</span>
            </button>
          </div>

          {mode === 'search' && (
            <>
              <div className="relative mb-2">
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search magic items..."
                  className="w-full pl-10 pr-4 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm focus:outline-none focus:border-amber-700"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-stone-800 border border-stone-700 rounded-lg px-2 py-1 text-xs focus:outline-none">
                  <option value="">All Categories</option>
                  {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={rarityFilter} onChange={e => setRarityFilter(e.target.value)} className="bg-stone-800 border border-stone-700 rounded-lg px-2 py-1 text-xs focus:outline-none">
                  <option value="">All Rarities</option>
                  {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <span className="text-xs text-stone-500 self-center ml-auto">{filteredItems.length} items</span>
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {mode === 'search' ? (
            <div className="space-y-1">
              {filteredItems.map(item => {
                const rc = RARITY_COLORS[item.rarity] || RARITY_COLORS.Common;
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => setSelectedItem(isSelected ? null : item)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        isSelected ? 'bg-amber-900/30 ring-1 ring-amber-700/50' : 'hover:bg-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${rc.bg} ${rc.text}`}>
                          {item.rarity}
                        </span>
                        <span className="text-sm font-medium text-stone-200">{item.name}</span>
                        <span className="text-xs text-stone-500 ml-auto">{item.category}</span>
                        {item.attunement && <span className="text-[10px] text-amber-500">(A)</span>}
                      </div>
                    </button>
                    {isSelected && (
                      <div className="ml-3 mr-3 mb-2 p-3 bg-stone-800/50 rounded-lg border border-stone-700/50">
                        <p className="text-xs text-stone-400 leading-relaxed mb-3">{item.description}</p>
                        <button
                          onClick={() => handleAddMagicItem(item)}
                          className="px-4 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-sm text-white font-medium"
                        >
                          Add to Inventory
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-stone-500 text-sm">No magic items found.</div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-stone-400 mb-1">Item Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="e.g. Rope (50 ft), Healing Potion, +1 Longsword..."
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-700"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">Item Type</label>
                <div className="flex gap-2">
                  {[
                    { value: 'gear', label: 'Gear', icon: Icons.FolderOpen },
                    { value: 'weapon', label: 'Weapon', icon: Icons.Sword },
                    { value: 'armor', label: 'Armor', icon: Icons.Shield },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setCustomType(opt.value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                        customType === opt.value
                          ? opt.value === 'weapon' ? 'bg-red-800 text-red-200' : opt.value === 'armor' ? 'bg-blue-800 text-blue-200' : 'bg-amber-800 text-amber-200'
                          : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                      }`}
                    >
                      <opt.icon /> {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleAddCustom}
                disabled={!customName.trim()}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                  customName.trim()
                    ? 'bg-amber-700 hover:bg-amber-600 text-white'
                    : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                }`}
              >
                Add Custom Item
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main InventoryTab ───────────────────────────────────────────

export default function InventoryTab({ character, onUpdate }) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }

  const addItem = (newItem) => {
    onUpdate('inventory', [...(character.inventory || []), newItem]);
  };

  const updateItem = (id, field, value) => {
    onUpdate('inventory', character.inventory.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      onUpdate('inventory', character.inventory.filter(i => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  const setItemType = (id, type) => {
    const updates = { itemType: type };
    if (type !== 'weapon') { updates.damage = ''; updates.damageType = ''; updates.mastery = ''; updates.weaponProperties = []; }
    if (type !== 'armor') { updates.armorType = ''; updates.baseAC = ''; updates.stealthDisadv = false; updates.strRequired = ''; }
    onUpdate('inventory', character.inventory.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const toggleProperty = (id, propList, prop) => {
    const item = character.inventory.find(i => i.id === id);
    const current = item[propList] || [];
    const updated = current.includes(prop) ? current.filter(p => p !== prop) : [...current, prop];
    updateItem(id, propList, updated);
  };

  const handleDragStart = (e, index) => { setDraggedIndex(index); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e, index) => { e.preventDefault(); if (draggedIndex !== index) setDragOverIndex(index); };
  const handleDragLeave = () => setDragOverIndex(null);
  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) { setDraggedIndex(null); setDragOverIndex(null); return; }
    const updated = [...(character.inventory || [])];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, draggedItem);
    onUpdate('inventory', updated);
    setDraggedIndex(null); setDragOverIndex(null);
  };
  const handleDragEnd = () => { setDraggedIndex(null); setDragOverIndex(null); };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => setShowAddModal(true)} className="px-3 py-1 rounded bg-amber-800 hover:bg-amber-700 text-xs flex items-center gap-1">
          <Icons.Plus /> Add Item
        </button>
      </div>
      
      <div className="space-y-3">
        {(character.inventory || []).map((item, index) => {
          const isWeapon = item.itemType === 'weapon';
          const isArmor = item.itemType === 'armor';
          const rc = item.rarity ? (RARITY_COLORS[item.rarity] || {}) : {};
          
          return (
            <div key={item.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, index)} onDragEnd={handleDragEnd}
              className={`rounded-lg overflow-hidden transition-all ${draggedIndex === index ? 'opacity-50' : ''} ${dragOverIndex === index ? 'ring-2 ring-amber-400' : ''} ${item.equipped ? 'ring-2 ring-green-500/50' : ''} ${isWeapon ? 'bg-red-900/20 border border-red-800/50' : isArmor ? 'bg-blue-900/20 border border-blue-800/50' : 'bg-stone-800'}`}>
              <div className="p-3 flex items-start gap-3">
                <div className="cursor-grab active:cursor-grabbing text-stone-600 hover:text-stone-400 pt-1"><Icons.GripVertical /></div>
                
                <div className="flex flex-col gap-1 items-center">
                  <button onClick={() => setItemType(item.id, 'weapon')} className={`p-1.5 rounded ${isWeapon ? 'bg-red-800 text-red-200' : 'bg-stone-700 text-stone-400 hover:bg-stone-600'}`} title="Weapon"><Icons.Sword /></button>
                  <button onClick={() => setItemType(item.id, 'armor')} className={`p-1.5 rounded ${isArmor ? 'bg-blue-800 text-blue-200' : 'bg-stone-700 text-stone-400 hover:bg-stone-600'}`} title="Armor"><Icons.Shield /></button>
                  {(isArmor || isWeapon) && (
                    <button onClick={() => updateItem(item.id, 'equipped', !item.equipped)} className={`p-1 rounded text-[10px] font-bold ${item.equipped ? 'bg-green-700 text-green-200' : 'bg-stone-700 text-stone-500 hover:bg-stone-600'}`} title={item.equipped ? 'Equipped' : 'Click to equip'}>{item.equipped ? 'ON' : 'EQ'}</button>
                  )}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <input type="text" value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)} className="bg-transparent font-medium focus:outline-none flex-1" placeholder="Item name" />
                    {item.rarity && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${rc.bg || ''} ${rc.text || ''}`}>
                        {item.rarity}
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-stone-500">Qty:</span>
                      <input type="text" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} className="bg-stone-900 rounded px-2 py-0.5 w-12 text-center text-sm focus:outline-none" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-stone-500">Wt:</span>
                      <input type="text" value={item.weight || ''} onChange={(e) => updateItem(item.id, 'weight', e.target.value)} className="bg-transparent text-sm focus:outline-none w-16 text-stone-400" placeholder="1 lb" />
                    </div>
                    <button
                      onClick={() => setDeleteTarget({ id: item.id, name: item.name || 'Unnamed item' })}
                      className="text-red-500 hover:text-red-400 text-lg"
                    >×</button>
                  </div>

                  {isWeapon && (
                    <>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-red-400">{(item.weaponProperties || []).includes('Versatile') ? '1H Dmg:' : 'Damage:'}</span>
                          <input type="text" value={item.damage || ''} onChange={(e) => updateItem(item.id, 'damage', e.target.value)} className="bg-stone-900 border border-red-800/50 rounded px-2 py-0.5 w-16 text-center text-red-300 focus:outline-none" placeholder="1d8" />
                        </div>
                        {(item.weaponProperties || []).includes('Versatile') && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-red-400">2H Dmg:</span>
                            <input type="text" value={item.damage2h || ''} onChange={(e) => updateItem(item.id, 'damage2h', e.target.value)} className="bg-stone-900 border border-red-800/50 rounded px-2 py-0.5 w-16 text-center text-red-300 focus:outline-none" placeholder="1d10" />
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-red-400">Type:</span>
                          <select value={item.damageType || ''} onChange={(e) => updateItem(item.id, 'damageType', e.target.value)} className="bg-stone-900 border border-red-800/50 rounded px-2 py-0.5 text-sm text-red-300 focus:outline-none">
                            <option value="">--</option><option value="Bludgeoning">Bludgeoning</option><option value="Piercing">Piercing</option><option value="Slashing">Slashing</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-purple-400">Mastery:</span>
                          <select value={item.mastery || ''} onChange={(e) => updateItem(item.id, 'mastery', e.target.value)} className="bg-stone-900 border border-purple-800/50 rounded px-2 py-0.5 text-sm text-purple-300 focus:outline-none">
                            <option value="">None</option>
                            {WEAPON_MASTERIES.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-stone-500">Properties:</span>
                        {WEAPON_PROPERTIES.map(prop => <PropButton key={prop.name} prop={prop} isSelected={(item.weaponProperties || []).includes(prop.name)} onClick={() => toggleProperty(item.id, 'weaponProperties', prop.name)} color="amber" />)}
                      </div>
                      {item.mastery && <div className="text-xs text-purple-400 bg-purple-900/20 rounded px-2 py-1"><span className="font-medium">{item.mastery}:</span> {WEAPON_MASTERIES.find(m => m.name === item.mastery)?.desc}</div>}
                    </>
                  )}

                  {isArmor && (
                    <>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-blue-400">Base AC:</span>
                          <input type="text" value={item.baseAC || ''} onChange={(e) => updateItem(item.id, 'baseAC', e.target.value)} className="bg-stone-900 border border-blue-800/50 rounded px-2 py-0.5 w-14 text-center text-blue-300 focus:outline-none" placeholder="14" />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-blue-400">Type:</span>
                          <select value={item.armorType || ''} onChange={(e) => updateItem(item.id, 'armorType', e.target.value)} className="bg-stone-900 border border-blue-800/50 rounded px-2 py-0.5 text-sm text-blue-300 focus:outline-none">
                            <option value="">--</option><option value="Light">Light</option><option value="Medium">Medium</option><option value="Heavy">Heavy</option><option value="Shield">Shield</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-blue-400">STR Req:</span>
                          <input type="text" value={item.strRequired || ''} onChange={(e) => updateItem(item.id, 'strRequired', e.target.value)} className="bg-stone-900 border border-blue-800/50 rounded px-2 py-0.5 w-12 text-center text-blue-300 focus:outline-none" placeholder="13" />
                        </div>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" checked={item.stealthDisadv || false} onChange={(e) => updateItem(item.id, 'stealthDisadv', e.target.checked)} className="rounded bg-stone-700 border-blue-800" />
                          <span className="text-xs text-blue-400">Stealth Disadv.</span>
                        </label>
                      </div>
                      {item.armorType && <div className="text-xs text-blue-400 bg-blue-900/20 rounded px-2 py-1"><span className="font-medium">{item.armorType}:</span> {ARMOR_PROPERTIES.find(p => p.name === item.armorType)?.desc}</div>}
                    </>
                  )}

                  {!isWeapon && !isArmor && (
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={item.equipped || false} onChange={(e) => updateItem(item.id, 'equipped', e.target.checked)} className="rounded bg-stone-700" />
                        <span className="text-xs text-stone-400">Equipped</span>
                      </label>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-cyan-400">AC Bonus:</span>
                        <input type="text" value={item.acBonus || ''} onChange={(e) => updateItem(item.id, 'acBonus', e.target.value)} className="bg-stone-900 border border-cyan-800/50 rounded px-2 py-0.5 w-14 text-center text-cyan-300 focus:outline-none" placeholder="+1" />
                      </div>
                    </div>
                  )}

                  <input type="text" value={item.description || ''} onChange={(e) => updateItem(item.id, 'description', e.target.value)} className="w-full bg-transparent text-sm text-stone-400 focus:outline-none" placeholder="Description or notes..." />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {(character.inventory || []).length === 0 && <div className="text-center text-stone-500 py-8">No items yet. Click "Add Item" to get started.</div>}

      {/* Modals */}
      {showAddModal && <AddItemModal onAdd={addItem} onClose={() => setShowAddModal(false)} />}
      {deleteTarget && <DeleteConfirmModal itemName={deleteTarget.name} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}
