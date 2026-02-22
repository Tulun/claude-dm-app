'use client';

import { useState, useRef } from 'react';
import Icons from './Icons';

// Calculate AC from equipped items (same logic as CharacterCard)
const getCalculatedAC = (character) => {
  const getModNum = (score) => Math.floor(((parseInt(score) || 10) - 10) / 2);
  const dexMod = getModNum(character.dex);
  const inventory = character.inventory || [];
  
  const equippedArmor = inventory.find(i => i.itemType === 'armor' && i.equipped && i.armorType !== 'Shield');
  const equippedShield = inventory.find(i => i.itemType === 'armor' && i.equipped && i.armorType === 'Shield');
  const acBonusItems = inventory.filter(i => i.equipped && i.acBonus && i.itemType !== 'armor');
  
  let baseAC = 10;
  let dexBonus = dexMod;
  let shieldBonus = 0;
  let itemBonuses = 0;
  let tempBonus = parseInt(character.tempAC) || 0;
  
  // Check temp effects
  if (character.acEffect === 'mageArmor') {
    baseAC = 13;
  } else if (character.acEffect === 'barkskin') {
    const naturalCalc = 10 + dexMod;
    if (naturalCalc < 16) {
      baseAC = 16;
      dexBonus = 0;
    }
  } else if (character.acEffect === 'unarmoredDefense') {
    const conMod = getModNum(character.con);
    const wisMod = getModNum(character.wis);
    const classes = character.classes?.map(c => c.name.toLowerCase()) || [character.class?.toLowerCase()];
    if (classes.includes('barbarian')) {
      baseAC = 10 + conMod;
    } else if (classes.includes('monk')) {
      baseAC = 10 + wisMod;
    }
  } else if (character.acEffect === 'draconicResilience') {
    const chaMod = getModNum(character.cha);
    baseAC = 10 + chaMod;
  } else if (equippedArmor) {
    baseAC = parseInt(equippedArmor.baseAC) || 10;
    if (equippedArmor.armorType === 'Medium') {
      dexBonus = Math.min(2, dexMod);
    } else if (equippedArmor.armorType === 'Heavy') {
      dexBonus = 0;
    }
  } else if (inventory.length === 0 && !character.acEffect) {
    return null;
  }
  
  if (equippedShield) {
    shieldBonus = parseInt(equippedShield.baseAC) || 2;
  }
  
  acBonusItems.forEach(item => {
    itemBonuses += parseInt(item.acBonus) || 0;
  });
  
  return baseAC + dexBonus + shieldBonus + itemBonuses + tempBonus;
};

const InitiativeItem = ({ character, isEnemy, isCompanion, isLairAction, index, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, dragOverIndex, onUpdateInitiative, onUpdateHp, onUpdateLairNotes, onRemoveLairAction }) => {
  const isDead = !isLairAction && character.currentHp <= 0;
  const [editing, setEditing] = useState(false);
  const [editingHp, setEditingHp] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(character.notes || '');
  
  // Use refs for input values to avoid stale state issues
  const initInputRef = useRef(null);
  const hpInputRef = useRef(null);

  // Calculate AC
  const calculatedAC = getCalculatedAC(character);
  const displayAC = calculatedAC !== null ? calculatedAC : (character.ac || 10);

  // Format initiative for display
  const formatInit = (init) => {
    if (init === undefined || init === null) return '—';
    return Math.floor(init) === init ? init : init.toFixed(1);
  };

  const handleInitBlur = () => {
    setEditing(false);
    const num = parseFloat(initInputRef.current?.value);
    if (!isNaN(num) && onUpdateInitiative) {
      onUpdateInitiative(character.id, num);
    }
  };

  const handleInitKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    } else if (e.key === 'Escape') {
      setEditing(false);
    }
  };

  const handleHpBlur = () => {
    setEditingHp(false);
    const num = parseInt(hpInputRef.current?.value);
    if (!isNaN(num) && onUpdateHp) {
      onUpdateHp(character.id, Math.max(0, num));
    }
  };

  const handleHpKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    } else if (e.key === 'Escape') {
      setEditingHp(false);
    }
  };

  const handleNotesBlur = () => {
    setEditingNotes(false);
    if (onUpdateLairNotes) {
      onUpdateLairNotes(notesValue);
    }
  };

  // Lair Action special rendering
  if (isLairAction) {
    return (
      <div
        draggable={!editing && !editingNotes}
        onDragStart={(e) => !editing && !editingNotes && onDragStart(e, index)}
        onDragOver={(e) => onDragOver(e, index)}
        onDrop={(e) => onDrop(e, index)}
        onDragEnd={onDragEnd}
        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${!editing && !editingNotes ? 'cursor-grab active:cursor-grabbing' : ''} 
          bg-purple-950/40 border border-purple-700/50 hover:border-purple-500/50
          ${isDragging ? 'opacity-50' : ''} ${dragOverIndex === index ? 'border-amber-400 border-2' : ''}`}
      >
        <Icons.Grip />
        <div 
          className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg bg-purple-800/50
            ${!editing ? 'cursor-pointer hover:ring-2 hover:ring-purple-400/50' : ''}`}
          onClick={() => !editing && setEditing(true)}
        >
          {editing ? (
            <input
              ref={initInputRef}
              type="text"
              defaultValue={character.initiative || 0}
              onBlur={handleInitBlur}
              onKeyDown={handleInitKeyDown}
              autoFocus
              className="w-full h-full bg-transparent text-center font-bold focus:outline-none"
            />
          ) : (
            formatInit(character.initiative)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-purple-300 flex items-center gap-2">
            <Icons.Sparkles /> Lair Action
          </div>
          {editingNotes ? (
            <input
              type="text"
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              onBlur={handleNotesBlur}
              onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { setNotesValue(character.notes || ''); setEditingNotes(false); } }}
              autoFocus
              placeholder="Describe the lair action..."
              className="w-full text-sm bg-purple-900/30 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 placeholder-stone-500"
            />
          ) : (
            <div 
              className="text-xs text-stone-400 cursor-pointer hover:text-purple-300 truncate"
              onClick={() => setEditingNotes(true)}
            >
              {character.notes || <span className="italic text-stone-500">Click to add description...</span>}
            </div>
          )}
        </div>
        {onRemoveLairAction && (
          <button 
            onClick={onRemoveLairAction}
            className="p-1 text-stone-500 hover:text-red-400 transition-colors"
          >
            <Icons.Trash />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      draggable={!editing && !editingHp}
      onDragStart={(e) => !editing && !editingHp && onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${!editing && !editingHp ? 'cursor-grab active:cursor-grabbing' : ''} ${
        isDead ? 'bg-stone-900/30 border border-stone-700/30 opacity-50' : 
        isCompanion ? 'bg-purple-950/30 border border-purple-900/30 hover:border-purple-700/50' :
        isEnemy ? 'bg-red-950/30 border border-red-900/30 hover:border-red-700/50' : 
        'bg-emerald-950/30 border border-emerald-900/30 hover:border-emerald-700/50'
      } ${isDragging ? 'opacity-50' : ''} ${dragOverIndex === index ? 'border-amber-400 border-2' : ''}`}
    >
      <Icons.Grip />
      <div 
        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
          isCompanion ? 'bg-purple-900/50' : isEnemy ? 'bg-red-900/50' : 'bg-emerald-900/50'
        } ${!editing ? 'cursor-pointer hover:ring-2 hover:ring-amber-500/50' : ''}`}
        onClick={() => !editing && setEditing(true)}
      >
        {editing ? (
          <input
            ref={initInputRef}
            type="text"
            defaultValue={character.initiative || 0}
            onBlur={handleInitBlur}
            onKeyDown={handleInitKeyDown}
            autoFocus
            className="w-full h-full bg-transparent text-center font-bold focus:outline-none"
          />
        ) : (
          formatInit(character.initiative)
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-medium truncate ${isDead ? 'line-through text-stone-500' : ''}`}>
          {character.name}
          {isCompanion && character.ownerName && (
            <span className="text-xs text-purple-400 ml-2">({character.ownerName}'s {character.form || 'companion'})</span>
          )}
        </div>
        <div className="text-xs text-stone-400 flex items-center gap-2">
          <span className={`flex items-center gap-1 ${character.acEffect ? 'text-cyan-400' : ''}`}><Icons.Shield /> {displayAC}</span>
          {isCompanion && onUpdateHp ? (
            <span 
              className={`flex items-center gap-1 cursor-pointer hover:text-purple-300 ${isDead ? 'text-red-500' : ''}`}
              onClick={() => !editingHp && setEditingHp(true)}
            >
              <Icons.Heart />
              {editingHp ? (
                <input
                  ref={hpInputRef}
                  type="number"
                  defaultValue={character.currentHp}
                  onBlur={handleHpBlur}
                  onKeyDown={handleHpKeyDown}
                  autoFocus
                  className="w-12 bg-transparent text-center focus:outline-none"
                />
              ) : character.currentHp}
              /{character.maxHp}
            </span>
          ) : (
            <span className={`flex items-center gap-1 ${isDead ? 'text-red-500' : ''}`}><Icons.Heart /> {character.currentHp}/{character.maxHp}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default InitiativeItem;
