'use client';

import { useState, useEffect } from 'react';

export default function ResourceRow({ resource, onUpdate, onRemove }) {
  const [editCurrent, setEditCurrent] = useState(String(resource.current));
  const [editMax, setEditMax] = useState(String(resource.max));
  const [isEditingCurrent, setIsEditingCurrent] = useState(false);
  const [isEditingMax, setIsEditingMax] = useState(false);

  // Sync local state when resource changes externally (e.g., +/- buttons)
  useEffect(() => {
    if (!isEditingCurrent) setEditCurrent(String(resource.current));
  }, [resource.current, isEditingCurrent]);
  
  useEffect(() => {
    if (!isEditingMax) setEditMax(String(resource.max));
  }, [resource.max, isEditingMax]);

  const handleCurrentBlur = () => {
    setIsEditingCurrent(false);
    const num = parseInt(editCurrent);
    if (!isNaN(num)) {
      const validMax = Math.max(1, resource.max);
      onUpdate('current', Math.max(0, Math.min(validMax, num)));
    } else {
      setEditCurrent(String(resource.current));
    }
  };

  const handleMaxBlur = () => {
    setIsEditingMax(false);
    const num = parseInt(editMax);
    if (!isNaN(num) && num >= 1) {
      onUpdate('max', num);
      if (resource.current > num) {
        onUpdate('current', num);
      }
    } else {
      setEditMax(String(resource.max));
    }
  };

  const handleKeyDown = (e, onBlur) => {
    if (e.key === 'Enter') onBlur();
    if (e.key === 'Escape') {
      setEditCurrent(String(resource.current));
      setEditMax(String(resource.max));
      setIsEditingCurrent(false);
      setIsEditingMax(false);
    }
  };

  return (
    <div className="bg-stone-800 rounded-lg p-3 flex items-center gap-4">
      <input 
        type="text" 
        value={resource.name} 
        onChange={(e) => onUpdate('name', e.target.value)}
        className="flex-1 bg-transparent font-medium focus:outline-none" 
        placeholder="Resource name (e.g., Wild Shape, Rage, Spell Slots)" 
      />
      <div className="flex items-center gap-2">
        <button 
          onClick={() => onUpdate('current', Math.max(0, resource.current - 1))}
          className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600 text-lg"
        >−</button>
        <div className="flex items-center gap-1">
          <input 
            type="text" 
            value={editCurrent} 
            onChange={(e) => setEditCurrent(e.target.value)}
            onFocus={() => setIsEditingCurrent(true)}
            onBlur={handleCurrentBlur}
            onKeyDown={(e) => handleKeyDown(e, handleCurrentBlur)}
            className="w-12 bg-stone-700 rounded px-2 py-1 text-center font-mono text-lg focus:outline-none focus:ring-1 focus:ring-amber-500" 
          />
          <span className="text-stone-500">/</span>
          <input 
            type="text" 
            value={editMax} 
            onChange={(e) => setEditMax(e.target.value)}
            onFocus={() => setIsEditingMax(true)}
            onBlur={handleMaxBlur}
            onKeyDown={(e) => handleKeyDown(e, handleMaxBlur)}
            className="w-12 bg-stone-700 rounded px-2 py-1 text-center font-mono text-lg focus:outline-none focus:ring-1 focus:ring-amber-500" 
          />
        </div>
        <button 
          onClick={() => onUpdate('current', Math.min(resource.max, resource.current + 1))}
          className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600 text-lg"
        >+</button>
        <button 
          onClick={() => onUpdate('current', resource.max)}
          className="px-2 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-xs"
        >Reset</button>
        <button onClick={onRemove} className="text-red-500 hover:text-red-400 text-lg">×</button>
      </div>
    </div>
  );
}
