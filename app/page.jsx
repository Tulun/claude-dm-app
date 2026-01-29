'use client';

import React, { useState, useEffect } from 'react';

const defaultPartyData = [
  { id: 'party-1', name: 'Thorin Ironforge', class: 'Fighter', level: 5, ac: 18, maxHp: 52, currentHp: 52, initiative: 0, speed: 30, notes: 'Battlemaster. Shield Bearer.', resources: [{ name: 'Second Wind', current: 1, max: 1 }, { name: 'Action Surge', current: 1, max: 1 }, { name: 'Superiority Dice', current: 4, max: 4 }] },
  { id: 'party-2', name: 'Elara Moonwhisper', class: 'Wizard', level: 5, ac: 13, maxHp: 28, currentHp: 28, initiative: 0, speed: 30, notes: 'Evocation specialist. Low HP!', resources: [{ name: '1st Level Slots', current: 4, max: 4 }, { name: '2nd Level Slots', current: 3, max: 3 }, { name: '3rd Level Slots', current: 2, max: 2 }] },
  { id: 'party-3', name: 'Bramble Thornfoot', class: 'Rogue', level: 5, ac: 15, maxHp: 38, currentHp: 38, initiative: 0, speed: 35, notes: 'Arcane Trickster. Sneak attack 3d6.', resources: [{ name: '1st Level Slots', current: 3, max: 3 }] },
];

const defaultEnemyTemplates = [
  { id: 'tpl-1', name: 'Goblin', ac: 15, maxHp: 7, speed: 30, cr: '1/4', notes: 'Nimble Escape. Pack tactics.', isNpc: false },
  { id: 'tpl-2', name: 'Orc', ac: 13, maxHp: 15, speed: 30, cr: '1/2', notes: 'Aggressive. Greataxe +5 (1d12+3)', isNpc: false },
  { id: 'tpl-3', name: 'Skeleton', ac: 13, maxHp: 13, speed: 30, cr: '1/4', notes: 'Vulnerable to bludgeoning.', isNpc: false },
  { id: 'tpl-4', name: 'Zombie', ac: 8, maxHp: 22, speed: 20, cr: '1/4', notes: 'Undead Fortitude.', isNpc: false },
  { id: 'tpl-5', name: 'Wolf', ac: 13, maxHp: 11, speed: 40, cr: '1/4', notes: 'Pack Tactics. Keen Senses.', isNpc: false },
  { id: 'tpl-6', name: 'Bandit', ac: 12, maxHp: 11, speed: 30, cr: '1/8', notes: 'Scimitar +3, Light crossbow +3', isNpc: false },
  { id: 'tpl-7', name: 'Ogre', ac: 11, maxHp: 59, speed: 40, cr: '2', notes: 'Greatclub +6 (2d8+4)', isNpc: false },
  { id: 'tpl-8', name: 'Town Guard', ac: 16, maxHp: 11, speed: 30, cr: '1/8', notes: 'Spear +3 (1d6+1)', isNpc: true },
  { id: 'tpl-9', name: 'Commoner', ac: 10, maxHp: 4, speed: 30, cr: '0', notes: 'Club +2 (1d4)', isNpc: true },
];

const Icons = {
  Skull: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2C6.48 2 2 6.48 2 12c0 3.69 2.47 6.86 6 8.25V22h8v-1.75c3.53-1.39 6-4.56 6-8.25 0-5.52-4.48-10-10-10zm-2 15h-2v-2h2v2zm6 0h-2v-2h2v2zm-3-5c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>,
  Shield: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>,
  Heart: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
  Sword: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M6.92 5H5l8 8-1.41 1.41L3 6h2V4l10 10-1.41 1.41L6.92 5zM19.42 3L21 4.59l-8.92 8.92-1.41-1.41L19.42 3zM5.5 21l-2-2L12 10.5l2 2L5.5 21z"/></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>,
  ChevronDown: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>,
  ChevronUp: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"/></svg>,
  Dice: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 18c-.83 0-1.5-.67-1.5-1.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm0-9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6s1.5.67 1.5 1.5S17.33 9 16.5 9z"/></svg>,
  Download: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>,
  Upload: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>,
  Grip: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 opacity-50"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>,
  Boot: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/></svg>,
  Sparkles: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 3L10.5 7.5L6 9l4.5 1.5L12 15l1.5-4.5L18 9l-4.5-1.5L12 3zM5 12l-1.5 3L0 16.5l3.5 1.5L5 21l1.5-3L10 16.5 6.5 15 5 12zm14 0l-1.5 3-3.5 1.5 3.5 1.5L19 21l1.5-3 3.5-1.5-3.5-1.5L19 12z"/></svg>,
  Book: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>,
  Edit: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>,
  Refresh: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>,
};

const EditableField = ({ value, onChange, type = 'text', className = '', min, max, placeholder }) => {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleBlur = () => {
    setEditing(false);
    if (type === 'number') {
      let num = parseInt(tempValue) || 0;
      if (min !== undefined) num = Math.max(min, num);
      if (max !== undefined) num = Math.min(max, num);
      onChange(num);
    } else {
      onChange(tempValue);
    }
  };

  if (editing) {
    return (
      <input
        type={type}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
        className={`bg-stone-900/50 border border-amber-700/50 rounded px-2 py-1 focus:outline-none focus:border-amber-500 ${className}`}
        autoFocus
        min={min}
        max={max}
      />
    );
  }

  return (
    <span
      onClick={() => { setEditing(true); setTempValue(value); }}
      className={`cursor-pointer hover:bg-amber-900/30 rounded px-2 py-1 transition-colors ${className}`}
    >
      {value || placeholder || '—'}
    </span>
  );
};

const HpBar = ({ current, max, onChange }) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  let barColor = 'bg-emerald-600';
  if (percentage <= 50) barColor = 'bg-amber-500';
  if (percentage <= 25) barColor = 'bg-red-600';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-3 bg-stone-900 rounded-full overflow-hidden border border-stone-700">
        <div className={`h-full ${barColor} transition-all duration-300`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="flex items-center gap-1 text-sm font-mono">
        <EditableField value={current} onChange={(v) => onChange(v, max)} type="number" min={0} className="w-10 text-center text-sm" />
        <span className="text-stone-500">/</span>
        <EditableField value={max} onChange={(v) => onChange(Math.min(current, v), v)} type="number" min={1} className="w-10 text-center text-sm" />
      </div>
    </div>
  );
};

const ResourceTracker = ({ resources, onChange }) => {
  const [newName, setNewName] = useState('');
  const [newMax, setNewMax] = useState(1);

  const updateResource = (index, field, value) => {
    const updated = [...resources];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'max' && updated[index].current > value) updated[index].current = value;
    onChange(updated);
  };

  const addResource = () => {
    if (!newName.trim()) return;
    onChange([...resources, { name: newName, current: newMax, max: newMax }]);
    setNewName('');
    setNewMax(1);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-stone-400 flex items-center gap-1"><Icons.Sparkles /> Resources</label>
        {resources.length > 0 && (
          <button onClick={() => onChange(resources.map(r => ({ ...r, current: r.max })))} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
            <Icons.Refresh /> Reset
          </button>
        )}
      </div>
      {resources.map((resource, i) => (
        <div key={i} className="flex items-center gap-2 bg-stone-800/50 rounded p-2">
          <EditableField value={resource.name} onChange={(v) => updateResource(i, 'name', v)} className="flex-1 text-sm font-medium" />
          <button onClick={() => updateResource(i, 'current', Math.max(0, resource.current - 1))} className="w-6 h-6 rounded bg-red-900/50 hover:bg-red-800/50 text-red-300 text-sm">-</button>
          <span className="font-mono text-sm w-12 text-center">{resource.current}/{resource.max}</span>
          <button onClick={() => updateResource(i, 'current', Math.min(resource.max, resource.current + 1))} className="w-6 h-6 rounded bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-300 text-sm">+</button>
          <button onClick={() => onChange(resources.filter((_, idx) => idx !== i))} className="w-6 h-6 rounded bg-stone-700/50 hover:bg-stone-600/50 text-stone-400"><Icons.Trash /></button>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1">
        <input type="text" placeholder="New resource..." value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addResource()} className="flex-1 bg-stone-900/50 border border-stone-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-500" />
        <input type="number" value={newMax} onChange={(e) => setNewMax(Math.max(1, parseInt(e.target.value) || 1))} min={1} className="w-14 bg-stone-900/50 border border-stone-700 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-amber-500" />
        <button onClick={addResource} disabled={!newName.trim()} className="px-2 py-1 rounded bg-amber-800/50 hover:bg-amber-700/50 text-amber-300 disabled:opacity-50"><Icons.Plus /></button>
      </div>
    </div>
  );
};

const CharacterCard = ({ character, isEnemy, onUpdate, onRemove, expanded, onToggleExpand, showResources }) => {
  const isDead = character.currentHp <= 0;

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${isDead ? 'border-red-900/50 bg-stone-900/30 opacity-60' : isEnemy ? 'border-red-800/50 bg-gradient-to-br from-red-950/40 to-stone-900/60' : 'border-emerald-800/50 bg-gradient-to-br from-emerald-950/40 to-stone-900/60'}`}>
      <div className={`flex items-center justify-between p-3 cursor-pointer ${isEnemy ? 'hover:bg-red-900/20' : 'hover:bg-emerald-900/20'}`} onClick={onToggleExpand}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isEnemy ? 'bg-red-900/50' : 'bg-emerald-900/50'}`}>{isEnemy ? <Icons.Skull /> : <Icons.Shield />}</div>
          <div>
            <h3 className={`font-bold ${isDead ? 'line-through text-stone-500' : ''}`}>{character.name}</h3>
            <p className="text-xs text-stone-400">{character.class ? `${character.class} ${character.level}` : `CR ${character.cr}`}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm"><Icons.Shield /><span className="font-mono">{character.ac}</span></div>
          <div className="flex items-center gap-1 text-sm"><Icons.Heart /><span className={`font-mono ${isDead ? 'text-red-500' : ''}`}>{character.currentHp}/{character.maxHp}</span></div>
          {expanded ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
        </div>
      </div>

      {expanded && (
        <div className="p-4 pt-0 border-t border-stone-700/50 space-y-4">
          <div>
            <label className="text-xs text-stone-400 mb-1 block">Hit Points</label>
            <HpBar current={character.currentHp} max={character.maxHp} onChange={(curr, max) => onUpdate({ ...character, currentHp: curr, maxHp: max })} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[-10, -5, -1, 1, 5, 10].map((d) => (
              <button key={d} onClick={() => onUpdate({ ...character, currentHp: Math.max(0, Math.min(character.maxHp, character.currentHp + d)) })} className={`px-3 py-1 rounded text-sm font-mono ${d < 0 ? 'bg-red-900/50 hover:bg-red-800/50 text-red-300' : 'bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-300'}`}>
                {d > 0 ? '+' : ''}{d}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><label className="text-xs text-stone-400">Name</label><EditableField value={character.name} onChange={(v) => onUpdate({ ...character, name: v })} className="block w-full" /></div>
            <div><label className="text-xs text-stone-400">AC</label><EditableField value={character.ac} onChange={(v) => onUpdate({ ...character, ac: v })} type="number" min={0} className="block w-full" /></div>
            <div><label className="text-xs text-stone-400">Initiative</label><EditableField value={character.initiative} onChange={(v) => onUpdate({ ...character, initiative: v })} type="number" className="block w-full" /></div>
            <div><label className="text-xs text-stone-400">Speed</label><div className="flex items-center gap-1"><Icons.Boot /><EditableField value={character.speed} onChange={(v) => onUpdate({ ...character, speed: v })} type="number" min={0} className="w-16" /><span className="text-stone-500">ft</span></div></div>
          </div>
          <div><label className="text-xs text-stone-400">Notes</label><EditableField value={character.notes} onChange={(v) => onUpdate({ ...character, notes: v })} className="block w-full text-sm" placeholder="Click to add notes..." /></div>
          {showResources && <ResourceTracker resources={character.resources || []} onChange={(resources) => onUpdate({ ...character, resources })} />}
          <div className="flex justify-end pt-2 border-t border-stone-700/30">
            <button onClick={() => onRemove(character.id)} className="flex items-center gap-1 px-3 py-1 rounded text-sm bg-red-900/30 hover:bg-red-800/50 text-red-400"><Icons.Trash />{isEnemy ? 'Kill' : 'Remove'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

const InitiativeItem = ({ character, isEnemy, index, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, dragOverIndex }) => {
  const isDead = character.currentHp <= 0;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all ${isDead ? 'bg-stone-900/30 border border-stone-700/30 opacity-50' : isEnemy ? 'bg-red-950/30 border border-red-900/30 hover:border-red-700/50' : 'bg-emerald-950/30 border border-emerald-900/30 hover:border-emerald-700/50'} ${isDragging ? 'opacity-50' : ''} ${dragOverIndex === index ? 'border-amber-400 border-2' : ''}`}
    >
      <Icons.Grip />
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${isEnemy ? 'bg-red-900/50' : 'bg-emerald-900/50'}`}>{character.initiative}</div>
      <div className="flex-1 min-w-0">
        <div className={`font-medium truncate ${isDead ? 'line-through text-stone-500' : ''}`}>{character.name}</div>
        <div className="text-xs text-stone-400 flex items-center gap-2">
          <span className="flex items-center gap-1"><Icons.Shield /> {character.ac}</span>
          <span className={`flex items-center gap-1 ${isDead ? 'text-red-500' : ''}`}><Icons.Heart /> {character.currentHp}/{character.maxHp}</span>
        </div>
      </div>
    </div>
  );
};

const AddEnemyModal = ({ isOpen, onClose, onAdd, templates }) => {
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [filter, setFilter] = useState('all');

  if (!isOpen) return null;

  const filtered = templates.filter(t => filter === 'all' || (filter === 'enemies' ? !t.isNpc : t.isNpc));

  const handleAdd = () => {
    const template = templates.find(t => t.id === selected);
    if (!template) return;
    for (let i = 0; i < quantity; i++) {
      onAdd({ ...template, id: `enemy-${Date.now()}-${i}`, name: quantity > 1 ? `${template.name} ${i + 1}` : template.name, currentHp: template.maxHp, initiative: Math.floor(Math.random() * 20) + 1 });
    }
    onClose();
    setSelected(null);
    setQuantity(1);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-amber-800/50 rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-stone-700">
          <h2 className="text-xl font-bold text-amber-400">Add to Encounter</h2>
          <div className="flex gap-2 mt-3">
            {['all', 'enemies', 'npcs'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-lg text-sm capitalize ${filter === f ? 'bg-amber-700' : 'bg-stone-700 hover:bg-stone-600'}`}>{f}</button>
            ))}
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {filtered.map((t) => (
              <button key={t.id} onClick={() => setSelected(t.id)} className={`p-3 rounded-lg text-left ${selected === t.id ? (t.isNpc ? 'bg-emerald-800/50 border-2 border-emerald-500' : 'bg-red-800/50 border-2 border-red-500') : 'bg-stone-800 border border-stone-700 hover:border-stone-500'}`}>
                <div className="flex items-center gap-2">{t.isNpc ? <Icons.Shield /> : <Icons.Skull />}<span className="font-medium">{t.name}</span></div>
                <div className="text-xs text-stone-400 mt-1">CR {t.cr} • AC {t.ac} • HP {t.maxHp}</div>
              </button>
            ))}
          </div>
          {selected && (
            <div className="flex items-center gap-3 p-3 bg-stone-800 rounded-lg">
              <label>Quantity:</label>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600">-</button>
              <span className="w-8 text-center font-bold">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600">+</button>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-stone-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600">Cancel</button>
          <button onClick={handleAdd} disabled={!selected} className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"><Icons.Plus />Add</button>
        </div>
      </div>
    </div>
  );
};

const AddPartyModal = ({ isOpen, onClose, onAdd }) => {
  const [form, setForm] = useState({ name: '', class: 'Fighter', level: 1, ac: 10, maxHp: 10, speed: 30, notes: '', resources: [] });
  const classes = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard', 'Artificer', 'NPC'];

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!form.name) return;
    onAdd({ ...form, id: `party-${Date.now()}`, currentHp: form.maxHp, initiative: Math.floor(Math.random() * 20) + 1 });
    onClose();
    setForm({ name: '', class: 'Fighter', level: 1, ac: 10, maxHp: 10, speed: 30, notes: '', resources: [] });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-emerald-800/50 rounded-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-stone-700"><h2 className="text-xl font-bold text-emerald-400">Add Party Member</h2></div>
        <div className="p-4 space-y-4">
          <input type="text" placeholder="Character Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-2 focus:outline-none focus:border-emerald-500" />
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-stone-400">Class</label><select value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-2">{classes.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="text-xs text-stone-400">Level</label><input type="number" min={1} max={20} value={form.level} onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) || 1 })} className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-2" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-stone-400">AC</label><input type="number" value={form.ac} onChange={(e) => setForm({ ...form, ac: parseInt(e.target.value) || 10 })} className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-2" /></div>
            <div><label className="text-xs text-stone-400">Max HP</label><input type="number" value={form.maxHp} onChange={(e) => setForm({ ...form, maxHp: parseInt(e.target.value) || 10 })} className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-2" /></div>
            <div><label className="text-xs text-stone-400">Speed</label><input type="number" value={form.speed} onChange={(e) => setForm({ ...form, speed: parseInt(e.target.value) || 30 })} className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-2" /></div>
          </div>
          <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-2 h-20 resize-none" />
        </div>
        <div className="p-4 border-t border-stone-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600">Cancel</button>
          <button onClick={handleAdd} disabled={!form.name} className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"><Icons.Plus />Add</button>
        </div>
      </div>
    </div>
  );
};

const TemplateEditor = ({ templates, onUpdate, onDelete, onCreate }) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', ac: 10, maxHp: 10, speed: 30, cr: '1', notes: '', isNpc: false });
  const [filter, setFilter] = useState('all');

  const filtered = templates.filter(t => filter === 'all' || (filter === 'enemies' ? !t.isNpc : t.isNpc));

  const handleCreate = () => {
    if (!createForm.name.trim()) return;
    onCreate({ ...createForm, id: `tpl-${Date.now()}` });
    setCreateForm({ name: '', ac: 10, maxHp: 10, speed: 30, cr: '1', notes: '', isNpc: false });
    setShowCreate(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['all', 'enemies', 'npcs'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-lg text-sm capitalize ${filter === f ? 'bg-amber-700' : 'bg-stone-700 hover:bg-stone-600'}`}>{f}</button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600"><Icons.Plus />New Template</button>
      </div>

      {showCreate && (
        <div className="p-4 bg-stone-800 rounded-lg border border-amber-700/50 space-y-3">
          <h3 className="font-bold text-amber-400">Create New Template</h3>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Name" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="bg-stone-900 border border-stone-600 rounded px-3 py-2 focus:outline-none focus:border-amber-500" />
            <div className="flex items-center gap-2">
              <button onClick={() => setCreateForm({ ...createForm, isNpc: false })} className={`px-3 py-1 rounded text-sm ${!createForm.isNpc ? 'bg-red-700' : 'bg-stone-700'}`}>Enemy</button>
              <button onClick={() => setCreateForm({ ...createForm, isNpc: true })} className={`px-3 py-1 rounded text-sm ${createForm.isNpc ? 'bg-emerald-700' : 'bg-stone-700'}`}>NPC</button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div><label className="text-xs text-stone-400">AC</label><input type="number" value={createForm.ac} onChange={(e) => setCreateForm({ ...createForm, ac: parseInt(e.target.value) || 10 })} className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2" /></div>
            <div><label className="text-xs text-stone-400">HP</label><input type="number" value={createForm.maxHp} onChange={(e) => setCreateForm({ ...createForm, maxHp: parseInt(e.target.value) || 10 })} className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2" /></div>
            <div><label className="text-xs text-stone-400">Speed</label><input type="number" value={createForm.speed} onChange={(e) => setCreateForm({ ...createForm, speed: parseInt(e.target.value) || 30 })} className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2" /></div>
            <div><label className="text-xs text-stone-400">CR</label><input type="text" value={createForm.cr} onChange={(e) => setCreateForm({ ...createForm, cr: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2" /></div>
          </div>
          <textarea placeholder="Notes" value={createForm.notes} onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2 h-16 resize-none" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600">Cancel</button>
            <button onClick={handleCreate} disabled={!createForm.name.trim()} className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 disabled:opacity-50">Create</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((t) => (
          <div key={t.id} className={`p-3 rounded-lg border ${t.isNpc ? 'bg-emerald-950/30 border-emerald-900/50' : 'bg-red-950/30 border-red-900/50'}`}>
            {editingId === t.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="bg-stone-900 border border-stone-600 rounded px-3 py-2" />
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditForm({ ...editForm, isNpc: false })} className={`px-3 py-1 rounded text-sm ${!editForm.isNpc ? 'bg-red-700' : 'bg-stone-700'}`}>Enemy</button>
                    <button onClick={() => setEditForm({ ...editForm, isNpc: true })} className={`px-3 py-1 rounded text-sm ${editForm.isNpc ? 'bg-emerald-700' : 'bg-stone-700'}`}>NPC</button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div><label className="text-xs text-stone-400">AC</label><input type="number" value={editForm.ac} onChange={(e) => setEditForm({ ...editForm, ac: parseInt(e.target.value) || 10 })} className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2" /></div>
                  <div><label className="text-xs text-stone-400">HP</label><input type="number" value={editForm.maxHp} onChange={(e) => setEditForm({ ...editForm, maxHp: parseInt(e.target.value) || 10 })} className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2" /></div>
                  <div><label className="text-xs text-stone-400">Speed</label><input type="number" value={editForm.speed} onChange={(e) => setEditForm({ ...editForm, speed: parseInt(e.target.value) || 30 })} className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2" /></div>
                  <div><label className="text-xs text-stone-400">CR</label><input type="text" value={editForm.cr} onChange={(e) => setEditForm({ ...editForm, cr: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2" /></div>
                </div>
                <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2 h-16 resize-none" />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingId(null)} className="px-3 py-1 rounded bg-stone-700 hover:bg-stone-600 text-sm">Cancel</button>
                  <button onClick={() => { onUpdate(editForm); setEditingId(null); }} className="px-3 py-1 rounded bg-amber-700 hover:bg-amber-600 text-sm">Save</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${t.isNpc ? 'bg-emerald-900/50' : 'bg-red-900/50'}`}>{t.isNpc ? <Icons.Shield /> : <Icons.Skull />}</div>
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-stone-400">CR {t.cr} • AC {t.ac} • HP {t.maxHp} • {t.speed}ft</div>
                    {t.notes && <div className="text-xs text-stone-500 mt-1">{t.notes}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditingId(t.id); setEditForm({ ...t }); }} className="p-2 rounded bg-stone-700/50 hover:bg-stone-600/50"><Icons.Edit /></button>
                  <button onClick={() => onDelete(t.id)} className="p-2 rounded bg-red-900/30 hover:bg-red-800/50 text-red-400"><Icons.Trash /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function DMAdminTool() {
  const [activeTab, setActiveTab] = useState('combat');
  const [party, setParty] = useState(defaultPartyData);
  const [enemies, setEnemies] = useState([]);
  const [templates, setTemplates] = useState(defaultEnemyTemplates);
  const [expandedCards, setExpandedCards] = useState({});
  const [showAddEnemy, setShowAddEnemy] = useState(false);
  const [showAddParty, setShowAddParty] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [partyRes, templatesRes] = await Promise.all([
          fetch('/api/party'),
          fetch('/api/templates'),
        ]);
        
        if (partyRes.ok) {
          const partyData = await partyRes.json();
          if (partyData && Array.isArray(partyData)) {
            setParty(partyData);
          }
        }
        
        if (templatesRes.ok) {
          const templatesData = await templatesRes.json();
          if (templatesData && Array.isArray(templatesData)) {
            setTemplates(templatesData);
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  // Auto-save party when it changes (debounced, only after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    const timeout = setTimeout(() => {
      fetch('/api/party', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(party),
      }).then(() => {
        setSaveStatus('Party saved');
        setTimeout(() => setSaveStatus(''), 2000);
      }).catch(console.error);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [party, isLoaded]);

  // Auto-save templates when they change (debounced, only after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    const timeout = setTimeout(() => {
      fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templates),
      }).then(() => {
        setSaveStatus('Templates saved');
        setTimeout(() => setSaveStatus(''), 2000);
      }).catch(console.error);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [templates, isLoaded]);

  const reloadParty = async () => {
    try {
      const res = await fetch('/api/party');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data)) setParty(data);
        setSaveStatus('Party reloaded');
        setTimeout(() => setSaveStatus(''), 2000);
      }
    } catch (err) {
      console.error('Error reloading party:', err);
    }
  };

  const reloadTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data)) setTemplates(data);
        setSaveStatus('Templates reloaded');
        setTimeout(() => setSaveStatus(''), 2000);
      }
    } catch (err) {
      console.error('Error reloading templates:', err);
    }
  };

  const initiativeList = [...party, ...enemies].sort((a, b) => b.initiative - a.initiative);

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) return;
    const dragged = initiativeList[dragIndex];
    const target = initiativeList[dropIndex];
    const newInit = target.initiative + (dragIndex > dropIndex ? 0.5 : -0.5);
    if (party.some(p => p.id === dragged.id)) setParty(prev => prev.map(p => p.id === dragged.id ? { ...p, initiative: newInit } : p));
    else setEnemies(prev => prev.map(e => e.id === dragged.id ? { ...e, initiative: newInit } : e));
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100">
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      <header className="relative border-b border-amber-900/30 bg-stone-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg"><Icons.Dice /></div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">DM&apos;s Toolkit</h1>
                <p className="text-xs text-stone-400">5th Edition Combat Manager</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {saveStatus && <span className="text-xs text-amber-400 bg-amber-900/30 px-2 py-1 rounded">{saveStatus}</span>}
              <div className="flex gap-1 bg-stone-800 rounded-lg p-1">
                <button onClick={() => setActiveTab('combat')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'combat' ? 'bg-amber-700' : 'hover:bg-stone-700'}`}><Icons.Sword /> Combat</button>
                <button onClick={() => setActiveTab('templates')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'templates' ? 'bg-amber-700' : 'hover:bg-stone-700'}`}><Icons.Book /> Templates</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {activeTab === 'combat' ? (
        <main className="relative max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2"><Icons.Shield />Party & Allies</h2>
              <div className="flex gap-2">
                <button onClick={reloadParty} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-700/50 hover:bg-stone-600/50 text-xs"><Icons.Refresh />Reload</button>
                <button onClick={() => setParty(prev => prev.map(p => ({ ...p, resources: (p.resources || []).map(r => ({ ...r, current: r.max })) })))} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-700/50 hover:bg-stone-600/50 text-xs"><Icons.Refresh />Rest</button>
                <button onClick={() => setShowAddParty(true)} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-800/50 hover:bg-emerald-700/50 text-emerald-300 text-sm"><Icons.Plus />Add</button>
              </div>
            </div>
            {party.map(m => <CharacterCard key={m.id} character={m} isEnemy={false} onUpdate={(u) => setParty(prev => prev.map(p => p.id === u.id ? u : p))} onRemove={(id) => setParty(prev => prev.filter(p => p.id !== id))} expanded={expandedCards[m.id]} onToggleExpand={() => setExpandedCards(prev => ({ ...prev, [m.id]: !prev[m.id] }))} showResources />)}
            {!party.length && <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg">No party members yet.</div>}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2"><Icons.Sword />Initiative</h2>
              <button onClick={() => { setParty(prev => prev.map(p => ({ ...p, initiative: Math.floor(Math.random() * 20) + 1 }))); setEnemies(prev => prev.map(e => ({ ...e, initiative: Math.floor(Math.random() * 20) + 1 }))); }} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-800/50 hover:bg-amber-700/50 text-amber-300 text-sm"><Icons.Dice />Roll All</button>
            </div>
            <div className="space-y-2">
              {initiativeList.map((c, i) => <InitiativeItem key={c.id} character={c} isEnemy={enemies.some(e => e.id === c.id)} index={i} onDragStart={(e, idx) => { setDragIndex(idx); e.dataTransfer.effectAllowed = 'move'; }} onDragOver={(e, idx) => { e.preventDefault(); setDragOverIndex(idx); }} onDrop={handleDrop} onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }} isDragging={dragIndex === i} dragOverIndex={dragOverIndex} />)}
              {!initiativeList.length && <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg">Add combatants to begin!</div>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-red-400 flex items-center gap-2"><Icons.Skull />Enemies</h2>
              <div className="flex gap-2">
                {enemies.length > 0 && <button onClick={() => setEnemies([])} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-stone-700/50 hover:bg-stone-600/50 text-sm"><Icons.Trash />Clear</button>}
                <button onClick={() => setShowAddEnemy(true)} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-800/50 hover:bg-red-700/50 text-red-300 text-sm"><Icons.Plus />Add</button>
              </div>
            </div>
            {enemies.map(e => <CharacterCard key={e.id} character={e} isEnemy={!e.isNpc} onUpdate={(u) => setEnemies(prev => prev.map(x => x.id === u.id ? u : x))} onRemove={(id) => setEnemies(prev => prev.filter(x => x.id !== id))} expanded={expandedCards[e.id]} onToggleExpand={() => setExpandedCards(prev => ({ ...prev, [e.id]: !prev[e.id] }))} />)}
            {!enemies.length && <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg">No enemies yet.</div>}
          </div>
        </main>
      ) : (
        <main className="relative max-w-4xl mx-auto p-4">
          <div className="bg-stone-900/50 border border-stone-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2"><Icons.Book />Enemy & NPC Templates</h2>
              <button onClick={reloadTemplates} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-stone-700/50 hover:bg-stone-600/50 text-sm"><Icons.Refresh />Reload</button>
            </div>
            <p className="text-stone-400 text-sm mb-6">Create and manage reusable templates. Changes auto-save to <code className="bg-stone-800 px-1 rounded">data/templates.json</code></p>
            <TemplateEditor templates={templates} onUpdate={(u) => setTemplates(prev => prev.map(t => t.id === u.id ? u : t))} onDelete={(id) => setTemplates(prev => prev.filter(t => t.id !== id))} onCreate={(t) => setTemplates(prev => [...prev, t])} />
          </div>
        </main>
      )}

      <AddEnemyModal isOpen={showAddEnemy} onClose={() => setShowAddEnemy(false)} onAdd={(e) => setEnemies(prev => [...prev, e])} templates={templates} />
      <AddPartyModal isOpen={showAddParty} onClose={() => setShowAddParty(false)} onAdd={(m) => setParty(prev => [...prev, m])} />
    </div>
  );
}
