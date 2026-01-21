import React, { useState, useEffect, useCallback } from 'react';

// Sample data structure
const defaultPartyData = [
  { id: 'party-1', name: 'Thorin Ironforge', class: 'Fighter', level: 5, ac: 18, maxHp: 52, currentHp: 52, initiative: 0, speed: 30, notes: 'Battlemaster. Shield Bearer.' },
  { id: 'party-2', name: 'Elara Moonwhisper', class: 'Wizard', level: 5, ac: 13, maxHp: 28, currentHp: 28, initiative: 0, speed: 30, notes: 'Evocation specialist. Low HP!' },
  { id: 'party-3', name: 'Bramble Thornfoot', class: 'Rogue', level: 5, ac: 15, maxHp: 38, currentHp: 38, initiative: 0, speed: 35, notes: 'Arcane Trickster. Sneak attack 3d6.' },
];

const enemyTemplates = [
  { name: 'Goblin', ac: 15, maxHp: 7, speed: 30, cr: '1/4', notes: 'Nimble Escape. Pack tactics.' },
  { name: 'Orc', ac: 13, maxHp: 15, speed: 30, cr: '1/2', notes: 'Aggressive. Greataxe +5 (1d12+3)' },
  { name: 'Skeleton', ac: 13, maxHp: 13, speed: 30, cr: '1/4', notes: 'Vulnerable to bludgeoning.' },
  { name: 'Zombie', ac: 8, maxHp: 22, speed: 20, cr: '1/4', notes: 'Undead Fortitude.' },
  { name: 'Wolf', ac: 13, maxHp: 11, speed: 40, cr: '1/4', notes: 'Pack Tactics. Keen Senses.' },
  { name: 'Bandit', ac: 12, maxHp: 11, speed: 30, cr: '1/8', notes: 'Scimitar +3, Light crossbow +3' },
  { name: 'Bandit Captain', ac: 15, maxHp: 65, speed: 30, cr: '2', notes: 'Multiattack (3). Parry reaction.' },
  { name: 'Ogre', ac: 11, maxHp: 59, speed: 40, cr: '2', notes: 'Greatclub +6 (2d8+4)' },
  { name: 'Owlbear', ac: 13, maxHp: 59, speed: 40, cr: '3', notes: 'Multiattack. Keen Sight/Smell.' },
  { name: 'Custom...', ac: 10, maxHp: 10, speed: 30, cr: '?', notes: '' },
];

// Icons as inline SVGs for the fantasy theme
const Icons = {
  Skull: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 3.69 2.47 6.86 6 8.25V22h8v-1.75c3.53-1.39 6-4.56 6-8.25 0-5.52-4.48-10-10-10zm-2 15h-2v-2h2v2zm6 0h-2v-2h2v2zm-3-5c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
    </svg>
  ),
  Heart: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  ),
  Sword: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M6.92 5H5l8 8-1.41 1.41L3 6h2V4l10 10-1.41 1.41L6.92 5zM19.42 3L21 4.59l-8.92 8.92-1.41-1.41L19.42 3zM5.5 21l-2-2L12 10.5l2 2L5.5 21z"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
    </svg>
  ),
  ChevronUp: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"/>
    </svg>
  ),
  Dice: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 18c-.83 0-1.5-.67-1.5-1.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm0-9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6s1.5.67 1.5 1.5S17.33 9 16.5 9z"/>
    </svg>
  ),
  Save: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
    </svg>
  ),
  Upload: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
    </svg>
  ),
  Grip: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 opacity-50">
      <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
    </svg>
  ),
  Boot: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/>
    </svg>
  ),
};

// Editable field component
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    } else if (e.key === 'Escape') {
      setTempValue(value);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <input
        type={type}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`bg-stone-900/50 border border-amber-700/50 rounded px-2 py-1 focus:outline-none focus:border-amber-500 ${className}`}
        autoFocus
        min={min}
        max={max}
        placeholder={placeholder}
      />
    );
  }

  return (
    <span
      onClick={() => { setEditing(true); setTempValue(value); }}
      className={`cursor-pointer hover:bg-amber-900/30 rounded px-2 py-1 transition-colors ${className}`}
      title="Click to edit"
    >
      {value || placeholder || '—'}
    </span>
  );
};

// HP Bar component
const HpBar = ({ current, max, onChange }) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  let barColor = 'bg-emerald-600';
  if (percentage <= 50) barColor = 'bg-amber-500';
  if (percentage <= 25) barColor = 'bg-red-600';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-3 bg-stone-900 rounded-full overflow-hidden border border-stone-700">
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex items-center gap-1 text-sm font-mono">
        <EditableField
          value={current}
          onChange={(v) => onChange(v, max)}
          type="number"
          min={0}
          max={max}
          className="w-10 text-center text-sm"
        />
        <span className="text-stone-500">/</span>
        <EditableField
          value={max}
          onChange={(v) => onChange(current > v ? v : current, v)}
          type="number"
          min={1}
          className="w-10 text-center text-sm"
        />
      </div>
    </div>
  );
};

// Character Card component
const CharacterCard = ({ character, isEnemy, onUpdate, onRemove, expanded, onToggleExpand }) => {
  const isDead = character.currentHp <= 0;

  return (
    <div
      className={`relative border rounded-lg overflow-hidden transition-all duration-300 ${
        isDead
          ? 'border-red-900/50 bg-stone-900/30 opacity-60'
          : isEnemy
          ? 'border-red-800/50 bg-gradient-to-br from-red-950/40 to-stone-900/60'
          : 'border-emerald-800/50 bg-gradient-to-br from-emerald-950/40 to-stone-900/60'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-3 cursor-pointer ${
          isEnemy ? 'hover:bg-red-900/20' : 'hover:bg-emerald-900/20'
        }`}
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isEnemy ? 'bg-red-900/50' : 'bg-emerald-900/50'}`}>
            {isEnemy ? <Icons.Skull /> : <Icons.Shield />}
          </div>
          <div>
            <h3 className={`font-bold ${isDead ? 'line-through text-stone-500' : ''}`}>
              {character.name}
            </h3>
            <p className="text-xs text-stone-400">
              {character.class ? `${character.class} ${character.level}` : `CR ${character.cr}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm">
            <Icons.Shield />
            <span className="font-mono">{character.ac}</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Icons.Heart />
            <span className={`font-mono ${isDead ? 'text-red-500' : ''}`}>
              {character.currentHp}/{character.maxHp}
            </span>
          </div>
          {expanded ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-4 pt-0 border-t border-stone-700/50 space-y-4">
          {/* HP Bar */}
          <div>
            <label className="text-xs text-stone-400 mb-1 block">Hit Points</label>
            <HpBar
              current={character.currentHp}
              max={character.maxHp}
              onChange={(curr, max) => onUpdate({ ...character, currentHp: curr, maxHp: max })}
            />
          </div>

          {/* Quick HP buttons */}
          <div className="flex gap-2 flex-wrap">
            {[-10, -5, -1, 1, 5, 10].map((delta) => (
              <button
                key={delta}
                onClick={() => onUpdate({
                  ...character,
                  currentHp: Math.max(0, Math.min(character.maxHp, character.currentHp + delta))
                })}
                className={`px-3 py-1 rounded text-sm font-mono transition-colors ${
                  delta < 0
                    ? 'bg-red-900/50 hover:bg-red-800/50 text-red-300'
                    : 'bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-300'
                }`}
              >
                {delta > 0 ? '+' : ''}{delta}
              </button>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="text-xs text-stone-400">Name</label>
              <EditableField
                value={character.name}
                onChange={(v) => onUpdate({ ...character, name: v })}
                className="block w-full"
              />
            </div>
            <div>
              <label className="text-xs text-stone-400">AC</label>
              <EditableField
                value={character.ac}
                onChange={(v) => onUpdate({ ...character, ac: v })}
                type="number"
                min={0}
                className="block w-full"
              />
            </div>
            <div>
              <label className="text-xs text-stone-400">Initiative</label>
              <EditableField
                value={character.initiative}
                onChange={(v) => onUpdate({ ...character, initiative: v })}
                type="number"
                className="block w-full"
              />
            </div>
            <div>
              <label className="text-xs text-stone-400">Speed</label>
              <div className="flex items-center gap-1">
                <Icons.Boot />
                <EditableField
                  value={character.speed}
                  onChange={(v) => onUpdate({ ...character, speed: v })}
                  type="number"
                  min={0}
                  className="w-16"
                />
                <span className="text-stone-500">ft</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-stone-400">Notes</label>
            <EditableField
              value={character.notes}
              onChange={(v) => onUpdate({ ...character, notes: v })}
              className="block w-full text-sm"
              placeholder="Click to add notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-2 border-t border-stone-700/30">
            <button
              onClick={() => onRemove(character.id)}
              className="flex items-center gap-1 px-3 py-1 rounded text-sm bg-red-900/30 hover:bg-red-800/50 text-red-400 transition-colors"
            >
              <Icons.Trash />
              {isEnemy ? 'Kill' : 'Remove'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Initiative Item component
const InitiativeItem = ({
  character,
  isEnemy,
  isActive,
  index,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  dragOverIndex,
}) => {
  const isDead = character.currentHp <= 0;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200 ${
        isActive
          ? 'bg-amber-900/50 border-2 border-amber-500 shadow-lg shadow-amber-900/30'
          : isDead
          ? 'bg-stone-900/30 border border-stone-700/30 opacity-50'
          : isEnemy
          ? 'bg-red-950/30 border border-red-900/30 hover:border-red-700/50'
          : 'bg-emerald-950/30 border border-emerald-900/30 hover:border-emerald-700/50'
      } ${isDragging ? 'opacity-50' : ''} ${dragOverIndex === index ? 'border-amber-400 border-2' : ''}`}
    >
      <Icons.Grip />
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
        isEnemy ? 'bg-red-900/50' : 'bg-emerald-900/50'
      }`}>
        {character.initiative}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-medium truncate ${isDead ? 'line-through text-stone-500' : ''}`}>
          {character.name}
        </div>
        <div className="text-xs text-stone-400 flex items-center gap-2">
          <span className="flex items-center gap-1">
            <Icons.Shield /> {character.ac}
          </span>
          <span className={`flex items-center gap-1 ${isDead ? 'text-red-500' : ''}`}>
            <Icons.Heart /> {character.currentHp}/{character.maxHp}
          </span>
        </div>
      </div>
      {isActive && (
        <div className="px-2 py-1 bg-amber-600 text-amber-950 text-xs font-bold rounded uppercase tracking-wide">
          Active
        </div>
      )}
    </div>
  );
};

// Add Enemy Modal
const AddEnemyModal = ({ isOpen, onClose, onAdd }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [customEnemy, setCustomEnemy] = useState({
    name: '',
    ac: 10,
    maxHp: 10,
    speed: 30,
    cr: '?',
    notes: '',
  });

  if (!isOpen) return null;

  const handleAdd = () => {
    const template = selectedTemplate === 'Custom...' ? customEnemy : enemyTemplates.find(t => t.name === selectedTemplate);
    if (!template) return;

    for (let i = 0; i < quantity; i++) {
      onAdd({
        ...template,
        id: `enemy-${Date.now()}-${i}`,
        name: quantity > 1 ? `${template.name} ${i + 1}` : template.name,
        currentHp: template.maxHp,
        initiative: Math.floor(Math.random() * 20) + 1,
      });
    }
    onClose();
    setSelectedTemplate(null);
    setQuantity(1);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-stone-900 border border-amber-800/50 rounded-xl max-w-md w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-stone-700">
          <h2 className="text-xl font-bold text-amber-400">Add Enemies</h2>
        </div>
        <div className="p-4 space-y-4">
          {/* Template Selection */}
          <div className="grid grid-cols-2 gap-2">
            {enemyTemplates.map((template) => (
              <button
                key={template.name}
                onClick={() => setSelectedTemplate(template.name)}
                className={`p-3 rounded-lg text-left transition-all ${
                  selectedTemplate === template.name
                    ? 'bg-red-800/50 border-2 border-red-500'
                    : 'bg-stone-800 border border-stone-700 hover:border-red-700'
                }`}
              >
                <div className="font-medium">{template.name}</div>
                <div className="text-xs text-stone-400">
                  CR {template.cr} • AC {template.ac} • HP {template.maxHp}
                </div>
              </button>
            ))}
          </div>

          {/* Custom enemy form */}
          {selectedTemplate === 'Custom...' && (
            <div className="space-y-3 p-3 bg-stone-800 rounded-lg border border-stone-700">
              <input
                type="text"
                placeholder="Enemy Name"
                value={customEnemy.name}
                onChange={(e) => setCustomEnemy({ ...customEnemy, name: e.target.value })}
                className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2 focus:outline-none focus:border-amber-500"
              />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-stone-400">AC</label>
                  <input
                    type="number"
                    value={customEnemy.ac}
                    onChange={(e) => setCustomEnemy({ ...customEnemy, ac: parseInt(e.target.value) || 10 })}
                    className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-400">HP</label>
                  <input
                    type="number"
                    value={customEnemy.maxHp}
                    onChange={(e) => setCustomEnemy({ ...customEnemy, maxHp: parseInt(e.target.value) || 10 })}
                    className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-400">Speed</label>
                  <input
                    type="number"
                    value={customEnemy.speed}
                    onChange={(e) => setCustomEnemy({ ...customEnemy, speed: parseInt(e.target.value) || 30 })}
                    className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <textarea
                placeholder="Notes..."
                value={customEnemy.notes}
                onChange={(e) => setCustomEnemy({ ...customEnemy, notes: e.target.value })}
                className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2 focus:outline-none focus:border-amber-500 h-20 resize-none"
              />
            </div>
          )}

          {/* Quantity */}
          {selectedTemplate && (
            <div className="flex items-center gap-3">
              <label className="text-stone-300">Quantity:</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600 flex items-center justify-center"
                >
                  -
                </button>
                <span className="w-8 text-center font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600 flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-stone-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedTemplate || (selectedTemplate === 'Custom...' && !customEnemy.name)}
            className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Icons.Plus />
            Add {quantity > 1 ? `${quantity} Enemies` : 'Enemy'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Add Party Member Modal
const AddPartyMemberModal = ({ isOpen, onClose, onAdd }) => {
  const [member, setMember] = useState({
    name: '',
    class: 'Fighter',
    level: 1,
    ac: 10,
    maxHp: 10,
    speed: 30,
    notes: '',
  });

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!member.name) return;
    onAdd({
      ...member,
      id: `party-${Date.now()}`,
      currentHp: member.maxHp,
      initiative: Math.floor(Math.random() * 20) + 1,
    });
    onClose();
    setMember({
      name: '',
      class: 'Fighter',
      level: 1,
      ac: 10,
      maxHp: 10,
      speed: 30,
      notes: '',
    });
  };

  const classes = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard', 'NPC'];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-stone-900 border border-emerald-800/50 rounded-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-stone-700">
          <h2 className="text-xl font-bold text-emerald-400">Add Party Member / NPC</h2>
        </div>
        <div className="p-4 space-y-4">
          <input
            type="text"
            placeholder="Character Name"
            value={member.name}
            onChange={(e) => setMember({ ...member, name: e.target.value })}
            className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-2 focus:outline-none focus:border-emerald-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-400">Class</label>
              <select
                value={member.class}
                onChange={(e) => setMember({ ...member, class: e.target.value })}
                className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-2 focus:outline-none focus:border-emerald-500"
              >
                {classes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-stone-400">Level</label>
              <input
                type="number"
                min={1}
                max={20}
                value={member.level}
                onChange={(e) => setMember({ ...member, level: parseInt(e.target.value) || 1 })}
                className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-stone-400">AC</label>
              <input
                type="number"
                value={member.ac}
                onChange={(e) => setMember({ ...member, ac: parseInt(e.target.value) || 10 })}
                className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-stone-400">Max HP</label>
              <input
                type="number"
                value={member.maxHp}
                onChange={(e) => setMember({ ...member, maxHp: parseInt(e.target.value) || 10 })}
                className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-stone-400">Speed</label>
              <input
                type="number"
                value={member.speed}
                onChange={(e) => setMember({ ...member, speed: parseInt(e.target.value) || 30 })}
                className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <textarea
            placeholder="Notes (abilities, conditions, etc.)"
            value={member.notes}
            onChange={(e) => setMember({ ...member, notes: e.target.value })}
            className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-2 focus:outline-none focus:border-emerald-500 h-20 resize-none"
          />
        </div>
        <div className="p-4 border-t border-stone-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!member.name}
            className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Icons.Plus />
            Add Member
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
export default function DMAdminTool() {
  const [party, setParty] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [expandedCards, setExpandedCards] = useState({});
  const [showAddEnemy, setShowAddEnemy] = useState(false);
  const [showAddParty, setShowAddParty] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Load saved data on mount
  useEffect(() => {
    try {
      const savedParty = localStorage.getItem('dm-tool-party');
      if (savedParty) {
        setParty(JSON.parse(savedParty));
      } else {
        setParty(defaultPartyData);
      }
    } catch {
      setParty(defaultPartyData);
    }
  }, []);

  // Save party data whenever it changes
  useEffect(() => {
    if (party.length > 0) {
      try {
        localStorage.setItem('dm-tool-party', JSON.stringify(party));
      } catch (err) {
        console.error('Failed to save party data:', err);
      }
    }
  }, [party]);

  // Combined initiative list
  const initiativeList = [...party, ...enemies].sort((a, b) => b.initiative - a.initiative);

  // Toggle card expansion
  const toggleExpand = (id) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Update party member
  const updatePartyMember = (updated) => {
    setParty((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  // Remove party member
  const removePartyMember = (id) => {
    setParty((prev) => prev.filter((p) => p.id !== id));
  };

  // Add party member
  const addPartyMember = (member) => {
    setParty((prev) => [...prev, member]);
  };

  // Update enemy
  const updateEnemy = (updated) => {
    setEnemies((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  // Remove enemy
  const removeEnemy = (id) => {
    setEnemies((prev) => prev.filter((e) => e.id !== id));
  };

  // Add enemy
  const addEnemy = (enemy) => {
    setEnemies((prev) => [...prev, enemy]);
  };

  // Clear all enemies
  const clearEnemies = () => {
    setEnemies([]);
    setCurrentTurn(0);
  };

  // Roll all initiatives
  const rollAllInitiatives = () => {
    setParty((prev) => prev.map((p) => ({ ...p, initiative: Math.floor(Math.random() * 20) + 1 })));
    setEnemies((prev) => prev.map((e) => ({ ...e, initiative: Math.floor(Math.random() * 20) + 1 })));
    setCurrentTurn(0);
  };

  // Next turn
  const nextTurn = () => {
    const aliveCount = initiativeList.filter((c) => c.currentHp > 0).length;
    if (aliveCount === 0) return;

    let next = (currentTurn + 1) % initiativeList.length;
    while (initiativeList[next]?.currentHp <= 0 && aliveCount > 0) {
      next = (next + 1) % initiativeList.length;
    }
    setCurrentTurn(next);
  };

  // Previous turn
  const prevTurn = () => {
    const aliveCount = initiativeList.filter((c) => c.currentHp > 0).length;
    if (aliveCount === 0) return;

    let prev = (currentTurn - 1 + initiativeList.length) % initiativeList.length;
    while (initiativeList[prev]?.currentHp <= 0 && aliveCount > 0) {
      prev = (prev - 1 + initiativeList.length) % initiativeList.length;
    }
    setCurrentTurn(prev);
  };

  // Drag and drop handlers for initiative reordering
  const handleDragStart = (e, index) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) return;

    const draggedChar = initiativeList[dragIndex];
    const targetChar = initiativeList[dropIndex];

    // Swap initiatives to reorder
    const newInitiative = targetChar.initiative + (dragIndex > dropIndex ? 0.5 : -0.5);

    if (party.some((p) => p.id === draggedChar.id)) {
      updatePartyMember({ ...draggedChar, initiative: newInitiative });
    } else {
      updateEnemy({ ...draggedChar, initiative: newInitiative });
    }

    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // Export data
  const exportData = () => {
    const data = { party, enemies, currentTurn };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dm-encounter-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import data
  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.party) setParty(data.party);
        if (data.enemies) setEnemies(data.enemies);
        if (typeof data.currentTurn === 'number') setCurrentTurn(data.currentTurn);
      } catch (err) {
        console.error('Failed to import data:', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100">
      {/* Background texture */}
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }} />

      {/* Header */}
      <header className="relative border-b border-amber-900/30 bg-stone-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg">
                <Icons.Dice />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                  DM's Toolkit
                </h1>
                <p className="text-xs text-stone-400">5th Edition Combat Manager</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 cursor-pointer transition-colors text-sm">
                <Icons.Upload />
                Import
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 transition-colors text-sm"
              >
                <Icons.Download />
                Export
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Party Box (Left) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
              <Icons.Shield />
              Party & Allies
            </h2>
            <button
              onClick={() => setShowAddParty(true)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-800/50 hover:bg-emerald-700/50 text-emerald-300 text-sm transition-colors"
            >
              <Icons.Plus />
              Add
            </button>
          </div>
          <div className="space-y-3">
            {party.map((member) => (
              <CharacterCard
                key={member.id}
                character={member}
                isEnemy={false}
                onUpdate={updatePartyMember}
                onRemove={removePartyMember}
                expanded={expandedCards[member.id]}
                onToggleExpand={() => toggleExpand(member.id)}
              />
            ))}
            {party.length === 0 && (
              <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg">
                No party members yet. Add some heroes!
              </div>
            )}
          </div>
        </div>

        {/* Initiative Tracker (Center) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <Icons.Sword />
              Initiative Order
            </h2>
            <button
              onClick={rollAllInitiatives}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-800/50 hover:bg-amber-700/50 text-amber-300 text-sm transition-colors"
            >
              <Icons.Dice />
              Roll All
            </button>
          </div>

          {/* Turn Controls */}
          <div className="flex items-center justify-center gap-3 p-3 bg-stone-800/50 rounded-lg border border-stone-700/50">
            <button
              onClick={prevTurn}
              className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 transition-colors"
            >
              ← Prev
            </button>
            <div className="px-4 py-2 font-bold text-amber-400">
              Round {Math.floor(currentTurn / Math.max(1, initiativeList.length)) + 1}
            </div>
            <button
              onClick={nextTurn}
              className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 transition-colors"
            >
              Next →
            </button>
          </div>

          {/* Initiative List */}
          <div className="space-y-2">
            {initiativeList.map((character, index) => (
              <InitiativeItem
                key={character.id}
                character={character}
                isEnemy={enemies.some((e) => e.id === character.id)}
                isActive={index === currentTurn}
                index={index}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                isDragging={dragIndex === index}
                dragOverIndex={dragOverIndex}
              />
            ))}
            {initiativeList.length === 0 && (
              <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg">
                Add party members and enemies to begin combat!
              </div>
            )}
          </div>
        </div>

        {/* Enemies Box (Right) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
              <Icons.Skull />
              Enemies
            </h2>
            <div className="flex items-center gap-2">
              {enemies.length > 0 && (
                <button
                  onClick={clearEnemies}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-stone-700/50 hover:bg-stone-600/50 text-stone-300 text-sm transition-colors"
                >
                  <Icons.Trash />
                  Clear
                </button>
              )}
              <button
                onClick={() => setShowAddEnemy(true)}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-800/50 hover:bg-red-700/50 text-red-300 text-sm transition-colors"
              >
                <Icons.Plus />
                Add
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {enemies.map((enemy) => (
              <CharacterCard
                key={enemy.id}
                character={enemy}
                isEnemy={true}
                onUpdate={updateEnemy}
                onRemove={removeEnemy}
                expanded={expandedCards[enemy.id]}
                onToggleExpand={() => toggleExpand(enemy.id)}
              />
            ))}
            {enemies.length === 0 && (
              <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg">
                No enemies in encounter. Time to spawn some foes!
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <AddEnemyModal
        isOpen={showAddEnemy}
        onClose={() => setShowAddEnemy(false)}
        onAdd={addEnemy}
      />
      <AddPartyMemberModal
        isOpen={showAddParty}
        onClose={() => setShowAddParty(false)}
        onAdd={addPartyMember}
      />
    </div>
  );
}