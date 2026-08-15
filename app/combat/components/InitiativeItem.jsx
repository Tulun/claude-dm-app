'use client';

import { memo, useState, useRef } from 'react';
import Icons from '../../components/Icons';
import { getEquipmentAC } from '../../utils/acCalculation';
import { getMod } from '../../utils/rules';

// Initiative view AC: temp AC included, but no armor-name parsing;
// null means "no equipment info — show the stored AC instead".
const getCalculatedAC = (character) => getEquipmentAC(character, { parseArmorNames: false });

// `drag` is the stable handlers bundle from useDragReorder ({ onDragStart,
// onDragOver, onDrop, onDragEnd }); isDragging/isDragOver are per-row booleans
// so only the affected rows re-render during a drag. Rows are only draggable
// where `drag` is supplied — the main initiative column omits it (reordering
// lives in the Manage Order modal) and passes `onSelect` instead, which makes
// the row a click target for "jump the turn pointer here".
const InitiativeItem = ({ character, isEnemy, isCompanion, isLairAction, index, drag, isDragging, isDragOver, isActive, isNext, onSelect, onUpdateInitiative, onUpdateHp, onUpdateLairNotes, onRemoveLairAction }) => {
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

  // Drag is opt-in (Manage Order modal); the main column gets click-to-jump instead.
  const canDrag = !!drag && !editing && !editingHp && !editingNotes;
  const dragProps = drag
    ? {
        draggable: canDrag,
        onDragStart: (e) => canDrag && drag.onDragStart(e, index),
        onDragOver: (e) => drag.onDragOver(e, index),
        onDrop: (e) => drag.onDrop(e, index),
        onDragEnd: drag.onDragEnd,
      }
    : {};
  const selectProps = onSelect
    ? { onClick: () => onSelect(index), title: 'Jump the turn pointer here' }
    : {};
  // Turn-pointer emphasis: the active row is unmistakable, the next row is a hint.
  const turnClass = isActive
    ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-900/20'
    : isNext
      ? 'ring-1 ring-amber-700/40'
      : '';
  const turnBadge = isActive ? (
    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 shrink-0">Now</span>
  ) : isNext ? (
    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 shrink-0">Next</span>
  ) : null;
  const cursorClass = canDrag ? 'cursor-grab active:cursor-grabbing' : onSelect ? 'cursor-pointer' : '';

  // Lair Action special rendering
  if (isLairAction) {
    return (
      <div
        {...dragProps}
        {...selectProps}
        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${cursorClass}
          bg-purple-950/40 border border-purple-700/50 hover:border-purple-500/50
          ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'border-amber-400 border-2' : ''} ${turnClass}`}
      >
        {drag && <Icons.Grip />}
        <div 
          className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg bg-purple-800/50 shrink-0
            ${!editing ? 'cursor-pointer hover:ring-2 hover:ring-purple-400/50' : ''}`}
          onClick={(e) => { e.stopPropagation(); if (!editing) setEditing(true); }}
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
              onClick={(e) => { e.stopPropagation(); setEditingNotes(true); }}
            >
              {character.notes || <span className="italic text-stone-500">Click to add description...</span>}
            </div>
          )}
        </div>
        {turnBadge}
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
      {...dragProps}
      {...selectProps}
      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${cursorClass} ${
        isDead ? 'bg-stone-900/30 border border-stone-700/30 opacity-50' :
        isCompanion ? 'bg-purple-950/30 border border-purple-900/30 hover:border-purple-700/50' :
        isEnemy ? 'bg-red-950/30 border border-red-900/30 hover:border-red-700/50' :
        'bg-emerald-950/30 border border-emerald-900/30 hover:border-emerald-700/50'
      } ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'border-amber-400 border-2' : ''} ${turnClass}`}
    >
      {drag && <Icons.Grip />}
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shrink-0 ${
          isCompanion ? 'bg-purple-900/50' : isEnemy ? 'bg-red-900/50' : 'bg-emerald-900/50'
        } ${!editing ? 'cursor-pointer hover:ring-2 hover:ring-amber-500/50' : ''}`}
        onClick={(e) => { e.stopPropagation(); if (!editing) setEditing(true); }}
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
          {character.dex != null && <span className="text-stone-500">{`DEX ${getMod(character.dex)}`}</span>}
          {isCompanion && onUpdateHp ? (
            <span
              className={`flex items-center gap-1 cursor-pointer hover:text-purple-300 ${isDead ? 'text-red-500' : ''}`}
              onClick={(e) => { e.stopPropagation(); if (!editingHp) setEditingHp(true); }}
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
      {turnBadge}
    </div>
  );
};

export default memo(InitiativeItem);
