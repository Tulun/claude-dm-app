'use client';

import { useState } from 'react';
import Icons from '../../../components/Icons';

const formatInit = (init) => {
  if (init === undefined || init === null || init === '') return '—';
  return Math.floor(init) === init ? init : Number(init).toFixed(1);
};

/**
 * Card stats-row initiative chip: click to edit in place (Enter or clicking
 * away commits, Escape cancels; blank/invalid is ignored). `sharedWith` > 0
 * shows a link icon — the value is shared with that many same-named enemies
 * (group initiative, see app/combat/initGroups.js), so an edit moves them all.
 */
export default function InitChip({ character, onUpdateInitiative, sharedWith = 0 }) {
  const [draft, setDraft] = useState(null); // null = not editing
  const commit = () => {
    const n = parseFloat(draft);
    if (!isNaN(n)) onUpdateInitiative(character.id, n);
    setDraft(null);
  };
  const title = sharedWith > 0
    ? `Initiative — shared with ${sharedWith} other${sharedWith > 1 ? 's' : ''} of the same name. Click to edit.`
    : 'Initiative — click to edit';

  if (draft !== null) {
    return (
      <div className="relative">
        <div className="fixed inset-0 z-40" onClick={commit} />
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm z-50 relative bg-amber-950/40">
          <input
            type="text"
            inputMode="decimal"
            aria-label={`Initiative for ${character.name}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              else if (e.key === 'Escape') setDraft(null);
            }}
            onFocus={(e) => e.target.select()}
            autoFocus
            className="w-10 text-center bg-stone-900 border border-amber-500 rounded px-1 py-0.5 font-mono focus:outline-none"
          />
          <span className="text-xs text-stone-500">Init</span>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setDraft(String(character.initiative ?? '')); }}
      title={title}
      aria-label={`Initiative ${formatInit(character.initiative)} for ${character.name}${sharedWith > 0 ? ' (shared)' : ''}`}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 transition-colors"
    >
      <span className="font-mono font-medium">{formatInit(character.initiative)}</span>
      <span className="text-xs text-amber-600">Init</span>
      {sharedWith > 0 && <span className="text-amber-500"><Icons.Link className="w-3.5 h-3.5" /></span>}
    </button>
  );
}
