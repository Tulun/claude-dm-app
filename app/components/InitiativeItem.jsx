'use client';

import Icons from './Icons';

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

export default InitiativeItem;
