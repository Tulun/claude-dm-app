'use client';

import { useState, useEffect } from 'react';
import Icons from '../Icons';

const NotesModal = ({ isOpen, character, onUpdate, onClose }) => {
  const [notesText, setNotesText] = useState(character.combatNotes || '');

  // Sync with character combatNotes when modal opens
  useEffect(() => {
    if (isOpen) {
      setNotesText(character.combatNotes || '');
    }
  }, [isOpen, character.combatNotes]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-amber-800/50 rounded-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-stone-700 bg-gradient-to-r from-amber-950/50 to-stone-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <Icons.Scroll className="w-5 h-5" /> Combat Notes
            </h2>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-200">
              <Icons.X />
            </button>
          </div>
          <p className="text-xs text-stone-400 mt-1">{character.name} - Conditions, status effects, etc.</p>
        </div>
        <div className="p-4">
          <textarea
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            placeholder="Prone, Poisoned, Concentrating on spell, Hidden behind pillar..."
            className="w-full h-32 bg-stone-800 border border-stone-700 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-600 resize-none"
            autoFocus
          />
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs text-stone-500">Quick add:</span>
            {['Prone', 'Poisoned', 'Frightened', 'Stunned', 'Restrained', 'Blinded', 'Concentrating'].map(condition => (
              <button
                key={condition}
                onClick={() => setNotesText(prev => prev ? `${prev}, ${condition}` : condition)}
                className="text-xs px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-amber-400"
              >
                {condition}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-stone-700 flex justify-between">
          <button 
            onClick={() => setNotesText('')}
            className="px-3 py-2 rounded-lg text-stone-400 hover:text-red-400 hover:bg-red-900/20 text-sm"
          >
            Clear
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-sm">
              Cancel
            </button>
            <button 
              onClick={() => { onUpdate({ ...character, combatNotes: notesText }); onClose(); }}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesModal;
