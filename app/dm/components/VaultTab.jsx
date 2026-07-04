'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Icons from '../../components/Icons';
import VaultMarkdown from './VaultMarkdown';
import {
  groupNotes,
  sessionNotes,
  recentNotes,
  duplicateFolderSets,
  searchNotes,
  formatRelativeTime,
} from './vaultUtils';

// Campaign dashboard over the user's Obsidian vault. Strictly read-only:
// this tab never POSTs anywhere — notes are edited in Obsidian and re-read
// from disk on every fetch, so there is no saveEnabled gate to manage.
export default function VaultTab() {
  const [index, setIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [now, setNow] = useState(0);
  const [query, setQuery] = useState('');
  const [openNote, setOpenNote] = useState(null); // { path, name, dir, mtime, content }
  const [noteLoading, setNoteLoading] = useState(false);

  const loadIndex = useCallback(() => {
    fetch('/api/vault')
      .then(res => res.json())
      .then(data => {
        setIndex(data);
        setLoadError(data.error && data.configured === undefined ? data.error : '');
        setNow(Date.now());
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load vault:', err);
        setLoadError('Could not reach the vault API.');
        setLoading(false);
      });
  }, []);

  // Load on mount and re-scan whenever the window regains focus — the usual
  // flow is: edit in Obsidian, cmd-tab back here, and the dashboard is fresh.
  useEffect(() => {
    loadIndex();
    window.addEventListener('focus', loadIndex);
    return () => window.removeEventListener('focus', loadIndex);
  }, [loadIndex]);

  const openNotePath = useCallback((notePath) => {
    setNoteLoading(true);
    fetch(`/api/vault?path=${encodeURIComponent(notePath)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error('Failed to load note:', data.error);
          setOpenNote(null);
        } else {
          setOpenNote(data);
        }
        setNoteLoading(false);
      })
      .catch(err => {
        console.error('Failed to load note:', err);
        setNoteLoading(false);
      });
  }, []);

  const notes = index?.notes || [];
  const notesByName = useMemo(
    () => new Map(notes.map(n => [n.name.toLowerCase(), n.path])),
    [notes]
  );
  const groups = useMemo(() => groupNotes(notes), [notes]);
  const session = useMemo(() => sessionNotes(notes), [notes]);
  const recent = useMemo(() => recentNotes(notes), [notes]);
  const duplicates = useMemo(() => duplicateFolderSets(notes), [notes]);
  const searchResults = useMemo(() => searchNotes(notes, query), [notes, query]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icons.BookOpen className="w-10 h-10 animate-pulse text-amber-500" />
      </div>
    );
  }

  if (!index || index.configured === false || loadError) {
    return (
      <div className="bg-stone-900/70 border border-stone-700 rounded-lg p-6 max-w-2xl">
        <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2 mb-3">
          <Icons.BookOpen className="w-5 h-5" />
          Connect your Obsidian vault
        </h2>
        <p className="text-stone-300 mb-4">
          {index?.error || loadError || 'The vault could not be loaded.'}
        </p>
        <div className="bg-stone-950 border border-stone-800 rounded p-3 text-sm text-stone-400 font-mono">
          # .env.local<br />
          OBSIDIAN_VAULT_PATH=/path/to/your/vault
        </div>
        <p className="text-stone-500 text-sm mt-3">
          The vault is read-only from here — all editing stays in Obsidian.
        </p>
      </div>
    );
  }

  const noteRow = (note, { showDir = true } = {}) => (
    <button
      key={note.path}
      onClick={() => openNotePath(note.path)}
      className="w-full text-left px-3 py-2 rounded hover:bg-stone-800 transition-colors group"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-stone-200 group-hover:text-amber-300 font-medium truncate">{note.name}</span>
        <span className="text-stone-600 text-xs shrink-0">{formatRelativeTime(note.mtime, now)}</span>
      </div>
      {showDir && note.dir && note.dir !== note.folder && (
        <div className="text-stone-500 text-xs truncate">{note.dir}</div>
      )}
      {note.excerpt && <div className="text-stone-500 text-xs truncate">{note.excerpt}</div>}
    </button>
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-64">
          <Icons.Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Search ${notes.length} notes...`}
            className="w-full bg-stone-900 border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-600"
          />
        </div>
        <button
          onClick={loadIndex}
          className="flex items-center gap-2 px-3 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-stone-300 text-sm transition-colors"
          title="Re-scan the vault (also happens automatically when this window regains focus)"
        >
          <Icons.Refresh className="w-4 h-4" />
          Refresh
        </button>
        <span className="text-stone-600 text-xs">
          Read-only · edits happen in Obsidian
        </span>
      </div>

      {query.trim() ? (
        /* Search results */
        <div className="bg-stone-900/70 border border-stone-700 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wide mb-2">
            {searchResults.length} result{searchResults.length === 1 ? '' : 's'}
          </h2>
          {searchResults.map(note => noteRow(note))}
          {searchResults.length === 0 && (
            <p className="text-stone-500 text-sm px-3 py-2">Nothing matched.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {session.length > 0 && (
              <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-4">
                <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2 mb-2">
                  <Icons.Note className="w-5 h-5" />
                  Current Session
                </h2>
                <div className="space-y-1">
                  {session.map(note => noteRow(note, { showDir: false }))}
                </div>
              </div>
            )}

            {groups
              .filter(group => group.name !== 'Current Session')
              .map(group => (
                <div key={group.name} className="bg-stone-900/70 border border-stone-700 rounded-lg p-4">
                  <h2 className="text-lg font-bold text-stone-200 flex items-center gap-2 mb-2">
                    <Icons.FolderOpen className="w-5 h-5 text-amber-500" />
                    {group.name}
                    <span className="text-stone-600 text-sm font-normal">{group.notes.length}</span>
                  </h2>
                  <div className="space-y-1">
                    {group.notes.map(note => noteRow(note))}
                  </div>
                </div>
              ))}
          </div>

          {/* Side column */}
          <div className="space-y-6">
            <div className="bg-stone-900/70 border border-stone-700 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wide mb-2">
                Recently edited
              </h2>
              <div className="space-y-1">
                {recent.map(note => noteRow(note))}
              </div>
            </div>

            {duplicates.length > 0 && (
              <div className="bg-stone-900/70 border border-stone-800 rounded-lg p-4">
                <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-2">
                  Vault cleanup hint
                </h2>
                <p className="text-stone-500 text-xs mb-2">
                  These sections are split across duplicate folders in Obsidian
                  (merged here for display):
                </p>
                <ul className="text-stone-500 text-xs space-y-1">
                  {duplicates.map(dup => (
                    <li key={dup.name}>
                      <span className="text-stone-400">{dup.name}</span> ← {dup.sourceFolders.join(' + ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note reader modal */}
      {(openNote || noteLoading) && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setOpenNote(null)}
        >
          <div
            className="bg-stone-900 border border-stone-700 rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {noteLoading ? (
              <div className="p-10 flex justify-center">
                <Icons.FileText className="w-8 h-8 animate-pulse text-amber-500" />
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4 p-4 border-b border-stone-700">
                  <div>
                    <h2 className="text-xl font-bold text-amber-400">{openNote.name}</h2>
                    <p className="text-stone-500 text-xs mt-1">
                      {openNote.dir || 'vault root'} · edited {formatRelativeTime(openNote.mtime, now)}
                    </p>
                  </div>
                  <button
                    onClick={() => setOpenNote(null)}
                    className="text-stone-500 hover:text-stone-200 transition-colors"
                  >
                    <Icons.X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5 overflow-y-auto">
                  <VaultMarkdown
                    content={openNote.content}
                    notesByName={notesByName}
                    onOpenNote={openNotePath}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
