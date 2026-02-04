'use client';

import { useState } from 'react';
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
  } else if (equippedArmor) {
    baseAC = parseInt(equippedArmor.baseAC) || 10;
    if (equippedArmor.armorType === 'Medium') {
      dexBonus = Math.min(2, dexMod);
    } else if (equippedArmor.armorType === 'Heavy') {
      dexBonus = 0;
    }
  }
  
  if (equippedShield) {
    shieldBonus = parseInt(equippedShield.baseAC) || 2;
  }
  
  acBonusItems.forEach(item => {
    itemBonuses += parseInt(item.acBonus) || 0;
  });
  
  return baseAC + dexBonus + shieldBonus + itemBonuses + tempBonus;
};

const InitiativeItem = ({ character, isEnemy, index, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, dragOverIndex, onUpdateInitiative }) => {
  const isDead = character.currentHp <= 0;
  const [editing, setEditing] = useState(false);
  const [initValue, setInitValue] = useState(String(character.initiative));

  // Calculate AC - use calculated value, fall back to manual ac field for enemies/NPCs without inventory
  const displayAC = character.inventory?.length > 0 ? getCalculatedAC(character) : (character.ac || 10);

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
          <span className={`flex items-center gap-1 ${character.acEffect ? 'text-cyan-400' : ''}`}><Icons.Shield /> {displayAC}</span>
          <span className={`flex items-center gap-1 ${isDead ? 'text-red-500' : ''}`}><Icons.Heart /> {character.currentHp}/{character.maxHp}</span>
        </div>
      </div>
    </div>
  );
};

export default InitiativeItem;
