'use client';

import { useState } from 'react';
import Icons from '../../../components/Icons';

const InventoryModal = ({ isOpen, character, onUpdate, onClose }) => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [filter, setFilter] = useState('all');

  if (!isOpen) return null;

  const inventory = character.inventory || [];
  
  const toggleExpanded = (index) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleEquipped = (index) => {
    const updated = [...inventory];
    updated[index] = { ...updated[index], equipped: !updated[index].equipped };
    onUpdate({ ...character, inventory: updated });
  };

  const toggleAttuned = (index) => {
    const updated = [...inventory];
    updated[index] = { ...updated[index], attuned: !updated[index].attuned };
    onUpdate({ ...character, inventory: updated });
  };

  const getItemTypeIcon = (item) => {
    if (item.itemType === 'weapon') return '⚔️';
    if (item.itemType === 'armor') return '🛡️';
    if (item.itemType === 'potion') return '🧪';
    if (item.itemType === 'scroll') return '📜';
    if (item.itemType === 'wand' || item.itemType === 'rod' || item.itemType === 'staff') return '✨';
    if (item.itemType === 'ring') return '💍';
    if (item.itemType === 'wondrous') return '🌟';
    return '📦';
  };

  const getItemTypeColor = (item) => {
    if (item.itemType === 'weapon') return 'text-red-400';
    if (item.itemType === 'armor') return 'text-blue-400';
    if (item.itemType === 'potion') return 'text-green-400';
    if (item.itemType === 'scroll') return 'text-amber-400';
    if (item.itemType === 'wand' || item.itemType === 'rod' || item.itemType === 'staff') return 'text-purple-400';
    if (item.itemType === 'ring') return 'text-pink-400';
    if (item.itemType === 'wondrous') return 'text-cyan-400';
    return 'text-stone-400';
  };

  const getRarityColor = (rarity) => {
    if (!rarity) return 'border-stone-700';
    const r = rarity.toLowerCase();
    if (r === 'common') return 'border-stone-500';
    if (r === 'uncommon') return 'border-green-600';
    if (r === 'rare') return 'border-blue-600';
    if (r === 'very rare') return 'border-purple-600';
    if (r === 'legendary') return 'border-amber-500';
    if (r === 'artifact') return 'border-red-500';
    return 'border-stone-700';
  };

  const filteredInventory = inventory.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'equipped') return item.equipped;
    if (filter === 'weapons') return item.itemType === 'weapon';
    if (filter === 'armor') return item.itemType === 'armor';
    if (filter === 'magic') return item.rarity && item.rarity.toLowerCase() !== 'common';
    return true;
  });

  const attunedCount = inventory.filter(i => i.attuned).length;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-amber-800/50 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-stone-700 bg-gradient-to-r from-amber-950/50 to-stone-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-900/50">
                <Icons.Book />
              </div>
              <div>
                <h2 className="text-lg font-bold text-amber-400">{character.name}'s Inventory</h2>
                <p className="text-xs text-stone-400">
                  {inventory.length} item{inventory.length !== 1 ? 's' : ''} • 
                  {attunedCount}/3 attuned
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-200">
              <Icons.X />
            </button>
          </div>
          
          {/* Filters */}
          <div className="flex gap-1 mt-3 flex-wrap">
            {['all', 'equipped', 'weapons', 'armor', 'magic'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs capitalize ${filter === f ? 'bg-amber-700 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredInventory.length === 0 ? (
            <div className="text-center py-8 text-stone-500">
              {inventory.length === 0 ? 'No items in inventory' : 'No items match the current filter'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredInventory.map((item, i) => {
                const originalIndex = inventory.indexOf(item);
                const isExpanded = expandedItems.has(originalIndex);
                
                return (
                  <div 
                    key={originalIndex}
                    className={`border-l-4 ${getRarityColor(item.rarity)} bg-stone-800/50 rounded-r-lg overflow-hidden`}
                  >
                    {/* Item Header */}
                    <div 
                      className="p-3 flex items-center gap-3 cursor-pointer hover:bg-stone-700/30"
                      onClick={() => toggleExpanded(originalIndex)}
                    >
                      <span className="text-xl">{getItemTypeIcon(item)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${getItemTypeColor(item)}`}>{item.name}</span>
                          {item.rarity && item.rarity.toLowerCase() !== 'common' && (
                            <span className="text-xs text-stone-500">({item.rarity})</span>
                          )}
                          {item.requiresAttunement && (
                            <span className="text-xs text-purple-400">⚡ Attunement</span>
                          )}
                        </div>
                        {item.itemType === 'weapon' && item.damage && (
                          <div className="text-xs text-stone-500">{item.damage} {item.damageType}</div>
                        )}
                        {item.itemType === 'armor' && (
                          <div className="text-xs text-stone-500">
                            {item.armorType} {item.armorType !== 'Shield' ? 'Armor' : ''} • AC {item.baseAC}
                            {item.armorType === 'Shield' && ' bonus'}
                          </div>
                        )}
                      </div>
                      
                      {/* Quick toggles */}
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        {item.requiresAttunement && (
                          <button
                            onClick={() => toggleAttuned(originalIndex)}
                            className={`px-2 py-1 rounded text-xs transition-colors ${item.attuned ? 'bg-purple-700 text-purple-100' : 'bg-stone-700 text-stone-400 hover:bg-stone-600'}`}
                            title={item.attuned ? 'Attuned' : 'Not Attuned'}
                          >
                            ⚡
                          </button>
                        )}
                        <button
                          onClick={() => toggleEquipped(originalIndex)}
                          className={`px-2 py-1 rounded text-xs transition-colors ${item.equipped ? 'bg-emerald-700 text-emerald-100' : 'bg-stone-700 text-stone-400 hover:bg-stone-600'}`}
                        >
                          {item.equipped ? 'Equipped' : 'Equip'}
                        </button>
                      </div>
                      
                      <svg 
                        viewBox="0 0 24 24" 
                        fill="currentColor" 
                        className={`w-5 h-5 text-stone-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      >
                        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                      </svg>
                    </div>
                    
                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-stone-700/50">
                        <div className="pt-3 space-y-2">
                          {/* Item properties */}
                          {item.properties && (
                            <div className="flex flex-wrap gap-1">
                              {(Array.isArray(item.properties) ? item.properties : item.properties.split(',')).map((prop, pi) => (
                                <span key={pi} className="px-2 py-0.5 bg-stone-700 rounded text-xs text-stone-300">
                                  {prop.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Description */}
                          {item.description ? (
                            <p className="text-sm text-stone-300 leading-relaxed">{item.description}</p>
                          ) : (
                            <p className="text-sm text-stone-500 italic">No description available</p>
                          )}
                          
                          {/* Additional stats */}
                          <div className="flex flex-wrap gap-4 text-xs text-stone-500 pt-2">
                            {item.weight && <span>Weight: {item.weight} lb</span>}
                            {item.value && <span>Value: {item.value}</span>}
                            {item.quantity > 1 && <span>Quantity: {item.quantity}</span>}
                            {item.acBonus && <span>AC Bonus: +{item.acBonus}</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-700 flex justify-between items-center">
          <div className="text-xs text-stone-500">
            Click an item to see details
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryModal;
