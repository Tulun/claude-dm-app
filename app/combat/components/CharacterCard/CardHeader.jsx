'use client';

import { useState } from 'react';
import Icons from '../../../components/Icons';

const CardHeader = ({ 
  character, 
  isEnemy, 
  isDead,
  displayAC,
  spellDC,
  spellcastingInfo,
  expanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  onShowQuickActions,
  onShowNotes,
}) => {
  const [showHpEditor, setShowHpEditor] = useState(false);
  const [hpValue, setHpValue] = useState(String(character.currentHp));

  return (
    <div className="p-3">
      {/* Top row: Icon, Name, and action buttons */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-2 rounded-lg ${isEnemy ? 'bg-red-900/50' : 'bg-emerald-900/50'}`}>
            {isEnemy ? <Icons.Skull /> : <Icons.Shield />}
          </div>
          <div>
            <h3 className={`font-bold text-lg ${isDead ? 'line-through text-stone-500' : ''}`}>{character.name}</h3>
            <p className="text-xs text-stone-400">
              {character.classes?.length > 0 
                ? character.classes.map(c => `${c.name} ${c.level}`).join(' / ')
                : character.class 
                  ? `${character.class} ${character.level || 1}` 
                  : character.cr 
                    ? `CR ${character.cr}`
                    : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Notes Button */}
          {isEnemy && (
            <button 
              onClick={(e) => { e.stopPropagation(); onShowNotes(); }}
              className={`p-2 rounded-lg transition-colors ${
                character.notes 
                  ? 'text-amber-400 hover:bg-amber-900/30 bg-amber-900/20' 
                  : 'text-stone-500 hover:text-amber-400 hover:bg-amber-900/30'
              }`}
              title="Combat Notes"
            >
              <Icons.Scroll className="w-5 h-5" />
            </button>
          )}
          {/* Quick Actions Button */}
          {isEnemy && (character.actions?.length > 0 || character.legendaryActions?.length > 0 || spellcastingInfo?.found) && (
            <button 
              onClick={(e) => { e.stopPropagation(); onShowQuickActions(); }}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
                character.legendaryActions?.length > 0 
                  ? 'text-purple-400 hover:bg-purple-900/30 bg-purple-900/20' 
                  : 'text-red-400 hover:bg-red-900/30'
              }`}
              title="Quick Actions"
            >
              <Icons.Sword />
              {character.legendaryActions?.length > 0 && <span className="text-xs">★</span>}
            </button>
          )}
          {/* Delete Button */}
          {isEnemy && onRemove && (
            <button 
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="p-2 rounded-lg text-stone-500 hover:text-red-400 hover:bg-red-900/30 transition-colors"
              title="Remove from combat"
            >
              <Icons.Trash />
            </button>
          )}
          {/* Expand Arrow */}
          <button 
            onClick={onToggleExpand}
            className={`p-2 rounded-lg transition-colors ${isEnemy ? 'hover:bg-red-900/30' : 'hover:bg-emerald-900/30'}`}
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Stats row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* AC Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${character.acEffect ? 'bg-cyan-900/30 text-cyan-400' : 'bg-stone-800/60 text-stone-300'}`}>
          <Icons.Shield />
          <span className="font-mono font-medium">{displayAC}</span>
          <span className="text-xs text-stone-500">AC</span>
        </div>
        
        {/* HP Badge - Editable */}
        <div className="relative">
          {showHpEditor ? (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowHpEditor(false)} />
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm z-50 relative ${isDead ? 'bg-red-900/40' : 'bg-stone-800/60'}`}>
                <Icons.Heart />
                <input
                  type="text"
                  value={hpValue}
                  onChange={(e) => setHpValue(e.target.value)}
                  onBlur={() => {
                    const num = parseInt(hpValue);
                    if (!isNaN(num) && num >= 0) onUpdate({ ...character, currentHp: num });
                    setShowHpEditor(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const num = parseInt(hpValue);
                      if (!isNaN(num) && num >= 0) onUpdate({ ...character, currentHp: num });
                      setShowHpEditor(false);
                    } else if (e.key === 'Escape') {
                      setShowHpEditor(false);
                    }
                  }}
                  className="w-12 text-center bg-stone-900 border border-amber-500 rounded px-1 py-0.5 font-mono focus:outline-none"
                  autoFocus
                />
                <span className="text-stone-500">/</span>
                <span className="font-mono text-stone-400">{character.maxHp}</span>
                <span className="text-xs text-stone-500">HP</span>
              </div>
            </>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setHpValue(String(character.currentHp)); setShowHpEditor(true); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${
                isDead ? 'bg-red-900/40 text-red-400 hover:bg-red-900/50' : 'bg-stone-800/60 text-stone-300 hover:bg-stone-700/60'
              }`}
              title="Click to edit HP"
            >
              <Icons.Heart />
              <span className={`font-mono font-medium ${isDead ? 'text-red-400' : ''}`}>{character.currentHp}</span>
              <span className="text-stone-500">/</span>
              <span className="font-mono text-stone-400">{character.maxHp}</span>
              <span className="text-xs text-stone-500">HP</span>
            </button>
          )}
        </div>
        
        {/* Spell DC Badge */}
        {spellDC && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-purple-900/30 text-purple-400">
            <Icons.Sparkles />
            <span className="font-mono font-medium">{spellDC}</span>
            <span className="text-xs text-purple-500">DC</span>
          </div>
        )}
        
        {/* Notes Badge */}
        {isEnemy && character.notes && (
          <div 
            onClick={(e) => { e.stopPropagation(); onShowNotes(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-amber-900/30 text-amber-400 cursor-pointer hover:bg-amber-900/40"
            title={character.notes}
          >
            <Icons.Scroll className="w-4 h-4" />
            <span className="text-xs max-w-[100px] truncate">{character.notes}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardHeader;
