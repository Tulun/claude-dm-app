'use client';

import { useState } from 'react';
import Icons from './Icons';

export const ResourceTracker = ({ resources, onChange }) => {
  const [newName, setNewName] = useState('');
  const [newMax, setNewMax] = useState('1');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValues, setEditValues] = useState({ current: '', max: '' });

  const startEditing = (index) => {
    setEditingIndex(index);
    setEditValues({ 
      current: String(resources[index].current), 
      max: String(resources[index].max) 
    });
  };

  const finishEditing = (index) => {
    const updated = [...resources];
    const currentNum = parseInt(editValues.current);
    const maxNum = parseInt(editValues.max);
    // Validate: use previous values if invalid, ensure max >= 1
    const finalMax = isNaN(maxNum) || maxNum < 1 ? updated[index].max : maxNum;
    const finalCurrent = isNaN(currentNum) ? updated[index].current : Math.max(0, currentNum);
    updated[index] = { ...updated[index], current: finalCurrent, max: finalMax };
    onChange(updated);
    setEditingIndex(null);
  };

  const updateResource = (index, field, value) => {
    const updated = [...resources];
    if (field === 'current' || field === 'max') {
      const num = parseInt(value);
      if (!isNaN(num)) {
        updated[index] = { ...updated[index], [field]: Math.max(0, num) };
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    onChange(updated);
  };

  const addResource = () => {
    if (!newName.trim()) return;
    const maxVal = parseInt(newMax);
    const finalMax = isNaN(maxVal) || maxVal < 1 ? 1 : maxVal;
    onChange([...resources, { name: newName, current: finalMax, max: finalMax }]);
    setNewName('');
    setNewMax('1');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-stone-400 flex items-center gap-1"><Icons.Sparkles /> Resources</label>
        {resources.length > 0 && (
          <button onClick={() => onChange(resources.map(r => ({ ...r, current: r.max })))} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
            <Icons.Refresh /> Reset All
          </button>
        )}
      </div>
      {resources.map((resource, i) => (
        <div key={i} className="bg-stone-800/50 rounded p-2">
          {editingIndex === i ? (
            <div className="space-y-2">
              <input 
                type="text" 
                value={resource.name} 
                onChange={(e) => updateResource(i, 'name', e.target.value)} 
                className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-500" 
                placeholder="Resource name"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-stone-400">Current:</label>
                <input 
                  type="text" 
                  value={editValues.current} 
                  onChange={(e) => setEditValues({ ...editValues, current: e.target.value })} 
                  className="w-16 bg-stone-900 border border-stone-600 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-amber-500" 
                />
                <label className="text-xs text-stone-400">Max:</label>
                <input 
                  type="text" 
                  value={editValues.max} 
                  onChange={(e) => setEditValues({ ...editValues, max: e.target.value })} 
                  className="w-16 bg-stone-900 border border-stone-600 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-amber-500" 
                />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => onChange(resources.filter((_, idx) => idx !== i))} className="px-2 py-1 rounded bg-red-900/50 hover:bg-red-800/50 text-red-300 text-xs">Delete</button>
                <button onClick={() => finishEditing(i)} className="px-2 py-1 rounded bg-amber-700 hover:bg-amber-600 text-xs">Done</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex-1 text-sm font-medium truncate">{resource.name}</span>
              <button onClick={() => updateResource(i, 'current', resource.current - 1)} className="w-6 h-6 rounded bg-red-900/50 hover:bg-red-800/50 text-red-300 text-sm">-</button>
              <span className="font-mono text-sm w-16 text-center">{resource.current}/{resource.max}</span>
              <button onClick={() => updateResource(i, 'current', Math.min(resource.max, resource.current + 1))} className="w-6 h-6 rounded bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-300 text-sm">+</button>
              <button onClick={() => startEditing(i)} className="w-6 h-6 rounded bg-stone-700/50 hover:bg-stone-600/50 text-stone-400 cursor-pointer hover:text-amber-400 transition-colors"><Icons.Edit /></button>
            </div>
          )}
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1">
        <input type="text" placeholder="New resource..." value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addResource()} className="flex-1 bg-stone-900/50 border border-stone-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-500" />
        <input type="text" value={newMax} onChange={(e) => setNewMax(e.target.value)} placeholder="Max" className="w-14 bg-stone-900/50 border border-stone-700 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-amber-500" />
        <button onClick={addResource} disabled={!newName.trim()} className="px-2 py-1 rounded bg-amber-800/50 hover:bg-amber-700/50 text-amber-300 disabled:opacity-50"><Icons.Plus /></button>
      </div>
    </div>
  );
};

export const ItemTracker = ({ items = [], onChange }) => {
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  const [editingIndex, setEditingIndex] = useState(null);

  const toggleExpanded = (index) => {
    setExpandedItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const addItem = () => {
    if (!newName.trim()) return;
    onChange([...items, { name: newName, description: newDesc, quantity: 1 }]);
    setNewName('');
    setNewDesc('');
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    if (field === 'quantity') {
      const num = parseInt(value);
      updated[index] = { ...updated[index], [field]: isNaN(num) ? 1 : Math.max(0, num) };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-stone-400 flex items-center gap-1"><Icons.Book /> Items</label>
      {items.map((item, i) => (
        <div key={i} className="bg-stone-800/50 rounded overflow-hidden">
          {editingIndex === i ? (
            <div className="p-2 space-y-2">
              <input 
                type="text" 
                value={item.name} 
                onChange={(e) => updateItem(i, 'name', e.target.value)} 
                className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-500" 
                placeholder="Item name"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-stone-400">Qty:</label>
                <input 
                  type="text" 
                  value={item.quantity} 
                  onChange={(e) => updateItem(i, 'quantity', e.target.value)} 
                  className="w-16 bg-stone-900 border border-stone-600 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-amber-500" 
                />
              </div>
              <textarea 
                value={item.description} 
                onChange={(e) => updateItem(i, 'description', e.target.value)} 
                className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-sm h-20 resize-none focus:outline-none focus:border-amber-500" 
                placeholder="Item description..."
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="px-2 py-1 rounded bg-red-900/50 hover:bg-red-800/50 text-red-300 text-xs">Delete</button>
                <button onClick={() => setEditingIndex(null)} className="px-2 py-1 rounded bg-amber-700 hover:bg-amber-600 text-xs">Done</button>
              </div>
            </div>
          ) : (
            <>
              <div 
                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-stone-700/30"
                onClick={() => item.description && toggleExpanded(i)}
              >
                {item.description && (
                  <span className="text-stone-500">
                    {expandedItems[i] ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
                  </span>
                )}
                <span className="flex-1 text-sm font-medium">{item.name}</span>
                {item.quantity > 1 && <span className="text-xs text-stone-400">x{item.quantity}</span>}
                <button onClick={(e) => { e.stopPropagation(); setEditingIndex(i); }} className="w-6 h-6 rounded bg-stone-700/50 hover:bg-stone-600/50 text-stone-400 cursor-pointer hover:text-amber-400 transition-colors"><Icons.Edit /></button>
              </div>
              {expandedItems[i] && item.description && (
                <div className="px-3 pb-2 text-xs text-stone-400 border-t border-stone-700/50 pt-2">
                  {item.description}
                </div>
              )}
            </>
          )}
        </div>
      ))}
      <div className="space-y-2 pt-1">
        <input type="text" placeholder="New item name..." value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-stone-900/50 border border-stone-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-500" />
        <textarea placeholder="Description (optional)..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full bg-stone-900/50 border border-stone-700 rounded px-2 py-1 text-sm h-16 resize-none focus:outline-none focus:border-amber-500" />
        <button onClick={addItem} disabled={!newName.trim()} className="w-full px-2 py-1 rounded bg-amber-800/50 hover:bg-amber-700/50 text-amber-300 disabled:opacity-50 text-sm flex items-center justify-center gap-1"><Icons.Plus /> Add Item</button>
      </div>
    </div>
  );
};

export const ActionTracker = ({ actions = [], onChange }) => {
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [expandedActions, setExpandedActions] = useState({});
  const [editingIndex, setEditingIndex] = useState(null);

  const toggleExpanded = (index) => {
    setExpandedActions(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const addAction = () => {
    if (!newName.trim()) return;
    onChange([...actions, { name: newName, description: newDesc }]);
    setNewName('');
    setNewDesc('');
  };

  const updateAction = (index, field, value) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-stone-400 flex items-center gap-1"><Icons.Sword /> Actions</label>
      {actions.map((action, i) => (
        <div key={i} className="bg-stone-800/50 rounded overflow-hidden">
          {editingIndex === i ? (
            <div className="p-2 space-y-2">
              <input 
                type="text" 
                value={action.name} 
                onChange={(e) => updateAction(i, 'name', e.target.value)} 
                className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-500" 
                placeholder="Action name"
              />
              <textarea 
                value={action.description} 
                onChange={(e) => updateAction(i, 'description', e.target.value)} 
                className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-sm h-20 resize-none focus:outline-none focus:border-amber-500" 
                placeholder="Action description (damage, effects, etc.)..."
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => onChange(actions.filter((_, idx) => idx !== i))} className="px-2 py-1 rounded bg-red-900/50 hover:bg-red-800/50 text-red-300 text-xs">Delete</button>
                <button onClick={() => setEditingIndex(null)} className="px-2 py-1 rounded bg-amber-700 hover:bg-amber-600 text-xs">Done</button>
              </div>
            </div>
          ) : (
            <>
              <div 
                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-stone-700/30"
                onClick={() => action.description && toggleExpanded(i)}
              >
                {action.description && (
                  <span className="text-stone-500">
                    {expandedActions[i] ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
                  </span>
                )}
                <span className="flex-1 text-sm font-medium text-red-300">{action.name}</span>
                <button onClick={(e) => { e.stopPropagation(); setEditingIndex(i); }} className="w-6 h-6 rounded bg-stone-700/50 hover:bg-stone-600/50 text-stone-400 cursor-pointer hover:text-amber-400 transition-colors"><Icons.Edit /></button>
              </div>
              {expandedActions[i] && action.description && (
                <div className="px-3 pb-2 text-xs text-stone-400 border-t border-stone-700/50 pt-2 whitespace-pre-wrap">
                  {action.description}
                </div>
              )}
            </>
          )}
        </div>
      ))}
      <div className="space-y-2 pt-1">
        <input type="text" placeholder="New action name..." value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-stone-900/50 border border-stone-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-500" />
        <textarea placeholder="Description (damage, range, effects...)..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full bg-stone-900/50 border border-stone-700 rounded px-2 py-1 text-sm h-16 resize-none focus:outline-none focus:border-amber-500" />
        <button onClick={addAction} disabled={!newName.trim()} className="w-full px-2 py-1 rounded bg-red-800/50 hover:bg-red-700/50 text-red-300 disabled:opacity-50 text-sm flex items-center justify-center gap-1"><Icons.Plus /> Add Action</button>
      </div>
    </div>
  );
};
