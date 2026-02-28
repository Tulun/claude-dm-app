'use client';

import { useState } from 'react';
import Icons from '../../components/Icons';
import { CHARACTER_TYPES } from './constants';

export default function CharacterCard({ character, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const typeInfo = CHARACTER_TYPES.find(t => t.value === character.type) || CHARACTER_TYPES[0];
  
  const colorClasses = {
    teal: 'border-teal-700/50 bg-teal-950/30',
    blue: 'border-blue-700/50 bg-blue-950/30',
    red: 'border-red-700/50 bg-red-950/30',
    purple: 'border-purple-700/50 bg-purple-950/30'
  };

  const badgeClasses = {
    teal: 'bg-teal-900/50 text-teal-400',
    blue: 'bg-blue-900/50 text-blue-400',
    red: 'bg-red-900/50 text-red-400',
    purple: 'bg-purple-900/50 text-purple-400'
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${colorClasses[typeInfo.color] || 'border-stone-700'}`}>
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div>
            <span className={`text-xs px-2 py-0.5 rounded ${badgeClasses[typeInfo.color]} mb-1 inline-block`}>
              {typeInfo.label}
            </span>
            <h3 className="font-bold text-lg text-amber-400">{character.name}</h3>
            {character.role && <p className="text-sm text-stone-400">{character.role}</p>}
          </div>
          <div className="flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 rounded hover:bg-stone-700/50 text-stone-400 hover:text-amber-400"
            >
              <Icons.Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 rounded hover:bg-stone-700/50 text-stone-400 hover:text-red-400"
            >
              <Icons.Trash className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-stone-700/50 pt-3">
          {character.appearance && (
            <div><span className="text-stone-500 text-xs">Appearance:</span> <span className="text-sm">{character.appearance}</span></div>
          )}
          {character.personality && (
            <div><span className="text-stone-500 text-xs">Personality:</span> <span className="text-sm">{character.personality}</span></div>
          )}
          {character.motivation && (
            <div><span className="text-stone-500 text-xs">Motivation:</span> <span className="text-sm">{character.motivation}</span></div>
          )}
          {character.secrets && (
            <div className="bg-red-950/30 border border-red-900/30 rounded p-2">
              <span className="text-red-400 text-xs">🔒 Secrets:</span> <span className="text-sm">{character.secrets}</span>
            </div>
          )}
          {character.stats && (
            <div><span className="text-stone-500 text-xs">Stats:</span> <span className="text-sm font-mono">{character.stats}</span></div>
          )}
          {character.abilities && (
            <div><span className="text-stone-500 text-xs">Abilities:</span> <span className="text-sm">{character.abilities}</span></div>
          )}
          {character.notes && (
            <div className="text-sm text-stone-300 whitespace-pre-wrap">{character.notes}</div>
          )}
        </div>
      )}
    </div>
  );
}
