'use client';

import { useState } from 'react';
import Icons from '../../components/Icons';

export default function SessionTab({ data, onSave }) {
  const [currentNotes, setCurrentNotes] = useState(data?.sessionNotes?.current || '');
  const [showArchived, setShowArchived] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState(null);

  const sessions = data?.sessionNotes?.sessions || [];

  // Auto-save current notes with debounce
  const handleNotesChange = (value) => {
    setCurrentNotes(value);
    if (saveTimeout) clearTimeout(saveTimeout);
    setSaveTimeout(setTimeout(() => {
      onSave({ sessionNotes: { ...data.sessionNotes, current: value } });
    }, 1000));
  };

  const archiveCurrentSession = () => {
    if (!currentNotes.trim()) return;
    const newSession = {
      id: `session-${Date.now()}`,
      date: new Date().toISOString(),
      notes: currentNotes
    };
    onSave({ 
      sessionNotes: { 
        current: '', 
        sessions: [newSession, ...sessions] 
      } 
    });
    setCurrentNotes('');
  };

  const deleteSession = (id) => {
    if (confirm('Delete this session?')) {
      onSave({ sessionNotes: { ...data.sessionNotes, sessions: sessions.filter(s => s.id !== id) } });
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Session */}
      <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
            <Icons.FileText className="w-5 h-5" />
            Current Session Notes
          </h3>
          <button
            onClick={archiveCurrentSession}
            disabled={!currentNotes.trim()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 disabled:bg-stone-700 disabled:text-stone-500 text-sm transition-colors"
          >
            <Icons.Download className="w-4 h-4" />
            Archive Session
          </button>
        </div>
        <textarea
          value={currentNotes}
          onChange={(e) => handleNotesChange(e.target.value)}
          rows={12}
          className="w-full bg-stone-900 border border-stone-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-mono text-sm"
          placeholder="Quick reference notes for the current session...

• Important NPCs present
• Key plot points to remember  
• Player decisions & consequences
• Combat initiative / HP tracking
• Loot to distribute
• Upcoming encounters"
        />
        <p className="text-xs text-stone-500 mt-2">Auto-saves as you type</p>
      </div>

      {/* Archived Sessions */}
      <div>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="flex items-center gap-2 text-stone-400 hover:text-stone-200 mb-3"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 transition-transform ${showArchived ? 'rotate-180' : ''}`}>
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
          Archived Sessions ({sessions.length})
        </button>

        {showArchived && (
          <div className="space-y-3">
            {sessions.map(session => (
              <div key={session.id} className="bg-stone-800/50 border border-stone-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-stone-400">
                    {new Date(session.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="p-1 rounded hover:bg-stone-700 text-stone-400 hover:text-red-400"
                  >
                    <Icons.Trash className="w-4 h-4" />
                  </button>
                </div>
                <pre className="text-sm whitespace-pre-wrap font-mono text-stone-300">{session.notes}</pre>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-stone-500 text-center py-8">No archived sessions yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
