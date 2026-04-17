'use client';

import { useState } from 'react';
import Icons from '../../components/Icons';
import { CLASSES, SUBCLASSES, getTotalLevel, formatClasses } from './constants';

export default function ClassEditor({ character, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  
  // Initialize classes array from legacy or existing data
  const getClasses = () => {
    if (character.classes?.length > 0) return character.classes;
    if (character.class) return [{ name: character.class, level: character.level || 1, subclass: character.subclass || '' }];
    return [];
  };

  const classes = getClasses();
  const totalLevel = getTotalLevel(character);

  const addClass = () => {
    const availableClasses = CLASSES.filter(c => !classes.find(existing => existing.name === c));
    if (availableClasses.length === 0) return;
    
    const newClasses = [...classes, { name: availableClasses[0], level: 1, subclass: '' }];
    onUpdate('classes', newClasses);
    // Clear legacy fields
    onUpdate('class', null);
    onUpdate('level', null);
    onUpdate('subclass', null);
  };

  const updateClass = (index, field, value) => {
    const newClasses = [...classes];
    if (field === 'level') {
      newClasses[index] = { ...newClasses[index], level: parseInt(value) || 1 };
    } else if (field === 'name') {
      // When changing class, reset subclass
      newClasses[index] = { ...newClasses[index], name: value, subclass: '' };
    } else {
      newClasses[index] = { ...newClasses[index], [field]: value };
    }
    onUpdate('classes', newClasses);
  };

  const removeClass = (index) => {
    const newClasses = classes.filter((_, i) => i !== index);
    onUpdate('classes', newClasses);
  };

  // Get subclass level requirement for a class
  const getSubclassLevel = (className) => {
    const subclasses = SUBCLASSES[className];
    if (!subclasses || subclasses.length === 0) return 3;
    return subclasses[0].level || 3;
  };

  if (!isEditing) {
    return (
      <button 
        onClick={() => setIsEditing(true)}
        className="px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 cursor-pointer transition-colors flex items-center gap-2 group"
      >
        <span className="text-sm text-stone-300 group-hover:text-amber-400">
          {formatClasses(character) || 'Add Class'}
        </span>
        <Icons.Edit />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setIsEditing(false)}>
      <div className="bg-stone-900 border border-stone-700 rounded-xl max-w-lg w-full m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-stone-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-amber-400">Classes & Subclasses</h2>
          <button onClick={() => setIsEditing(false)} className="text-stone-400 hover:text-white text-xl">×</button>
        </div>
        
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {classes.length === 0 && (
            <div className="text-center text-stone-500 py-4">No classes added yet</div>
          )}
          
          {classes.map((cls, i) => {
            const subclasses = SUBCLASSES[cls.name] || [];
            const subclassLevel = getSubclassLevel(cls.name);
            const canHaveSubclass = cls.level >= subclassLevel;
            
            return (
              <div key={i} className="bg-stone-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <select 
                    value={cls.name} 
                    onChange={(e) => updateClass(i, 'name', e.target.value)}
                    className="flex-1 bg-stone-700 border border-stone-600 rounded px-3 py-2 focus:outline-none focus:border-amber-500"
                  >
                    {CLASSES.map(c => (
                      <option key={c} value={c} disabled={classes.some((existing, idx) => idx !== i && existing.name === c)}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1">
                    <span className="text-stone-500 text-sm">Lv</span>
                    <input 
                      type="number" 
                      min="1" 
                      max="20"
                      value={cls.level} 
                      onChange={(e) => updateClass(i, 'level', e.target.value)}
                      className="w-14 bg-stone-700 border border-stone-600 rounded px-2 py-2 text-center focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <button 
                    onClick={() => removeClass(i)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors"
                  >
                    <Icons.Trash />
                  </button>
                </div>
                
                {/* Subclass selector */}
                {subclasses.length > 0 && (
                  <div className="flex items-center gap-2">
                    <select 
                      value={cls.subclass || ''} 
                      onChange={(e) => updateClass(i, 'subclass', e.target.value)}
                      disabled={!canHaveSubclass}
                      className={`flex-1 bg-stone-700 border border-stone-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-purple-500 ${!canHaveSubclass ? 'opacity-50 cursor-not-allowed' : ''} ${cls.subclass ? 'text-purple-300 border-purple-700' : 'text-stone-400'}`}
                    >
                      <option value="">
                        {canHaveSubclass ? '— Select Subclass —' : `Subclass at level ${subclassLevel}`}
                      </option>
                      {subclasses.map(sub => (
                        <option key={sub.name} value={sub.name}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Subclass description */}
                {cls.subclass && subclasses.find(s => s.name === cls.subclass) && (
                  <div className="text-xs text-purple-400 bg-purple-900/20 rounded px-2 py-1">
                    {subclasses.find(s => s.name === cls.subclass).description}
                  </div>
                )}
              </div>
            );
          })}
          
          <button 
            onClick={addClass}
            disabled={classes.length >= CLASSES.length}
            className="w-full py-2 rounded-lg bg-amber-900/30 hover:bg-amber-800/50 text-amber-400 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icons.Plus /> Add Class
          </button>
        </div>
        
        <div className="p-4 border-t border-stone-700 flex items-center justify-between">
          <span className="text-sm text-stone-400">
            Total Level: <span className="font-bold text-amber-400">{totalLevel}</span>
          </span>
          <button 
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
