'use client';

import { useEffect, useState } from 'react';

// Per-viewer preference for the This Turn panel (compact chips vs. everything
// in full) — browser-local, never persisted to the encounter. One key for
// monsters and party members, so the panel keeps its shape across turns.
// Every access in try/catch (private windows / blocked storage).
export const EXPANDED_KEY = 'dm-combat-abilities-expanded';

export function useExpandedPref() {
  const [expanded, setExpanded] = useState(false);
  // Restore after mount (localStorage is unavailable during SSR)
  useEffect(() => {
    try { if (localStorage.getItem(EXPANDED_KEY) === '1') setExpanded(true); } catch { /* storage blocked */ }
  }, []);
  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    try { localStorage.setItem(EXPANDED_KEY, next ? '1' : '0'); } catch { /* storage blocked */ }
  };
  return [expanded, toggle];
}

export default function ExpandToggle({ expanded, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      title={expanded ? 'Show abilities as compact chips' : 'Show every ability in full'}
      className="ml-auto shrink-0 px-2 py-0.5 rounded border border-stone-700 text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-200 hover:border-stone-500"
    >
      {expanded ? 'Collapse ▴' : 'Expand ▾'}
    </button>
  );
}
