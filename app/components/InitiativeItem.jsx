'use client';

import { useState } from 'react';
import Icons from './Icons';

const InitiativeItem = ({ character, isEnemy, index, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, dragOverIndex, onUpdateInitiative }) => {
  const isDead = character.currentHp <= 0;
  const [editing, setEditing] = useState(false);
  const [initValue, setInitValue] = useState(String(character.initiative));

  const handleInitChange = (e) => {
    setInitValue(e.target.value);
  };

  const handleInitBlur = () => {
    setEditing(false);
    const num = parseFloat(initValue);
    if (!isNaN(num) && onUpdateInitiative) {
      onUpdateInitiative(character.id, num);
    } else {
      setInitValue(String(character.initiative));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    } else if (e.key === 'Escape') {
      setInitValue(String(character.initiative));
      setEditing(false);
    }
  };

  return (
    <div
      draggable={!editing}
      onDragStart={(e) => !editing && onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${!editing ? 'cursor-grab active:cursor-grabbing' : ''} ${isDead ? 'bg-stone-900/30 border border-stone-700/30 opacity-50' : isEnemy ? 'bg-red-950/30 border border-red-900/30 hover:border-red-700/50' : 'bg-emerald-950/30 border border-emerald-900/30 hover:border-emerald-700/50'} ${isDragging ? 'opacity-50' : ''} ${dragOverIndex === index ? 'border-amber-400 border-2' : ''}`}
    >
      <Icons.Grip />
      <div 
        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${isEnemy ? 'bg-red-900/50' : 'bg-emerald-900/50'} ${!editing ? 'cursor-pointer hover:ring-2 hover:ring-amber-500/50' : ''}`}
        onClick={() => !editing && setEditing(true)}
      >
        {editing ? (
          <input
            type="text"
            value={initValue}
            onChange={handleInitChange}
            onBlur={handleInitBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full h-full bg-transparent text-center font-bold focus:outline-none"
          />
        ) : (
          Math.floor(character.initiative) === character.initiative 
            ? character.initiative 
            : character.initiative.toFixed(1)
        )}
      </div>
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

export default InitiativeItem;
