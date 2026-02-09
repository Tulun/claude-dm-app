'use client';

import { useState } from 'react';
import Icons from '../../../components/Icons';
import { Tooltip } from '../../../components/ui';

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

export default function InventoryTab({ character, onUpdate }) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const addItem = () => {
    const newItem = { id: Date.now(), name: '', quantity: 1, weight: '', description: '', itemType: 'gear' };
    onUpdate('inventory', [...(character.inventory || []), newItem]);
  };

  const updateItem = (id, field, value) => {
    onUpdate('inventory', character.inventory.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeItem = (id) => {
    onUpdate('inventory', character.inventory.filter(i => i.id !== id));
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
        <button onClick={addItem} className="px-3 py-1 rounded bg-amber-800 hover:bg-amber-700 text-xs flex items-center gap-1">
          <Icons.Plus /> Add Item
        </button>
      </div>
      
      <div className="space-y-3">
        {(character.inventory || []).map((item, index) => {
          const isWeapon = item.itemType === 'weapon';
          const isArmor = item.itemType === 'armor';
          
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
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-stone-500">Qty:</span>
                      <input type="text" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} className="bg-stone-900 rounded px-2 py-0.5 w-12 text-center text-sm focus:outline-none" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-stone-500">Wt:</span>
                      <input type="text" value={item.weight || ''} onChange={(e) => updateItem(item.id, 'weight', e.target.value)} className="bg-transparent text-sm focus:outline-none w-16 text-stone-400" placeholder="1 lb" />
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-400 text-lg">×</button>
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
      {(character.inventory || []).length === 0 && <div className="text-center text-stone-500 py-8">No items yet.</div>}
    </div>
  );
}
