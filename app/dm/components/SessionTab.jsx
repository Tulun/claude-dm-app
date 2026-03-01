'use client';

import { useState, useEffect } from 'react';
import Icons from '../../components/Icons';

const DEFAULT_CARD_COLORS = [
  { bg: 'bg-amber-900/20', border: 'border-amber-700/50', text: 'text-amber-400' },
  { bg: 'bg-emerald-900/20', border: 'border-emerald-700/50', text: 'text-emerald-400' },
  { bg: 'bg-blue-900/20', border: 'border-blue-700/50', text: 'text-blue-400' },
  { bg: 'bg-purple-900/20', border: 'border-purple-700/50', text: 'text-purple-400' },
  { bg: 'bg-rose-900/20', border: 'border-rose-700/50', text: 'text-rose-400' },
  { bg: 'bg-cyan-900/20', border: 'border-cyan-700/50', text: 'text-cyan-400' },
  { bg: 'bg-orange-900/20', border: 'border-orange-700/50', text: 'text-orange-400' },
  { bg: 'bg-teal-900/20', border: 'border-teal-700/50', text: 'text-teal-400' },
];

const SUGGESTED_CARDS = [
  { title: 'Locations', icon: 'Map' },
  { title: 'Important NPCs', icon: 'Users' },
  { title: 'Plot Points', icon: 'BookOpen' },
  { title: 'Combat Notes', icon: 'Swords' },
  { title: 'Loot & Rewards', icon: 'Sparkles' },
  { title: 'Reminders', icon: 'Note' },
];

export default function SessionTab({ data, onSave }) {
  const [cards, setCards] = useState(data?.sessionNotes?.cards || []);
  const [expandedCard, setExpandedCard] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [showNewCard, setShowNewCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [saveTimeout, setSaveTimeout] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const sessions = data?.sessionNotes?.sessions || [];

  // Sync cards from data when it changes
  useEffect(() => {
    if (data?.sessionNotes?.cards) {
      setCards(data.sessionNotes.cards);
    }
  }, [data?.sessionNotes?.cards]);

  // Auto-save with debounce
  const saveCards = (updatedCards) => {
    setCards(updatedCards);
    if (saveTimeout) clearTimeout(saveTimeout);
    setSaveTimeout(setTimeout(() => {
      onSave({ sessionNotes: { ...data.sessionNotes, cards: updatedCards } });
    }, 800));
  };

  const addCard = (title) => {
    if (!title.trim()) return;
    const colorIndex = cards.length % DEFAULT_CARD_COLORS.length;
    const newCard = {
      id: `card-${Date.now()}`,
      title: title.trim(),
      content: '',
      colorIndex,
      createdAt: new Date().toISOString()
    };
    saveCards([...cards, newCard]);
    setNewCardTitle('');
    setShowNewCard(false);
    setExpandedCard(newCard.id);
    setEditingCard(newCard.id);
  };

  const updateCard = (id, updates) => {
    const updated = cards.map(c => c.id === id ? { ...c, ...updates } : c);
    saveCards(updated);
  };

  const deleteCard = (id) => {
    if (confirm('Delete this card?')) {
      saveCards(cards.filter(c => c.id !== id));
      if (expandedCard === id) setExpandedCard(null);
    }
  };

  const archiveAllCards = () => {
    if (cards.length === 0) return;
    if (!confirm('Archive all current cards? They will be saved with today\'s date.')) return;
    
    const newSession = {
      id: `session-${Date.now()}`,
      date: new Date().toISOString(),
      cards: [...cards]
    };
    
    onSave({ 
      sessionNotes: { 
        cards: [], 
        sessions: [newSession, ...sessions] 
      } 
    });
    setCards([]);
    setExpandedCard(null);
  };

  const deleteSession = (id) => {
    if (confirm('Delete this archived session?')) {
      onSave({ sessionNotes: { ...data.sessionNotes, sessions: sessions.filter(s => s.id !== id) } });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
            <Icons.FileText className="w-5 h-5" />
            Session Notes
          </h2>
          <p className="text-sm text-stone-400">Quick reference cards for the current session</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={archiveAllCards}
            disabled={cards.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 disabled:bg-stone-800 disabled:text-stone-600 text-sm transition-colors"
          >
            <Icons.Download className="w-4 h-4" />
            Archive Session
          </button>
          <button
            onClick={() => setShowNewCard(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-sm transition-colors"
          >
            <Icons.Plus className="w-4 h-4" />
            New Card
          </button>
        </div>
      </div>

      {/* New Card Form */}
      {showNewCard && (
        <div className="bg-stone-800/50 border border-stone-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Create New Card</h3>
            <button onClick={() => setShowNewCard(false)} className="text-stone-400 hover:text-white">&times;</button>
          </div>
          
          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-2 mb-3">
            {SUGGESTED_CARDS.map(suggestion => {
              const IconComp = Icons[suggestion.icon] || Icons.Note;
              return (
                <button
                  key={suggestion.title}
                  onClick={() => addCard(suggestion.title)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-700 hover:bg-stone-600 rounded-lg text-sm transition-colors"
                >
                  <IconComp className="w-3 h-3" />
                  {suggestion.title}
                </button>
              );
            })}
          </div>
          
          {/* Custom title */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCard(newCardTitle)}
              placeholder="Or enter custom title..."
              className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              autoFocus
            />
            <button
              onClick={() => addCard(newCardTitle)}
              disabled={!newCardTitle.trim()}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-600 disabled:bg-stone-700 rounded-lg text-sm transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      {cards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(card => {
            const colors = DEFAULT_CARD_COLORS[card.colorIndex % DEFAULT_CARD_COLORS.length];
            const isExpanded = expandedCard === card.id;
            const isEditing = editingCard === card.id;
            
            return (
              <div 
                key={card.id}
                className={`${colors.bg} ${colors.border} border rounded-xl overflow-hidden transition-all ${
                  isExpanded ? 'md:col-span-2 lg:col-span-3' : ''
                }`}
              >
                {/* Card Header */}
                <div 
                  className="p-4 cursor-pointer flex items-center justify-between"
                  onClick={() => {
                    if (!isEditing) {
                      setExpandedCard(isExpanded ? null : card.id);
                    }
                  }}
                >
                  <h3 className={`font-bold ${colors.text}`}>{card.title}</h3>
                  <div className="flex items-center gap-2">
                    {!isExpanded && card.content && (
                      <span className="text-xs text-stone-500">
                        {card.content.split('\n').filter(l => l.trim()).length} lines
                      </span>
                    )}
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setExpandedCard(card.id);
                        setEditingCard(isEditing ? null : card.id); 
                      }}
                      className="p-1.5 rounded hover:bg-stone-700/50 text-stone-400 hover:text-amber-400"
                    >
                      <Icons.Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }}
                      className="p-1.5 rounded hover:bg-stone-700/50 text-stone-400 hover:text-red-400"
                    >
                      <Icons.Trash className="w-4 h-4" />
                    </button>
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className={`w-5 h-5 text-stone-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                    </svg>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-stone-700/50">
                    {isEditing ? (
                      <div className="pt-3 space-y-3">
                        <input
                          type="text"
                          value={card.title}
                          onChange={(e) => updateCard(card.id, { title: e.target.value })}
                          className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                        <textarea
                          value={card.content || ''}
                          onChange={(e) => updateCard(card.id, { content: e.target.value })}
                          rows={8}
                          className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                          placeholder="Add your notes here..."
                          autoFocus
                        />
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-stone-500">Auto-saves as you type</p>
                          <button
                            onClick={() => setEditingCard(null)}
                            className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 rounded-lg text-sm"
                          >
                            Done Editing
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-3">
                        {card.content ? (
                          <pre className="whitespace-pre-wrap font-mono text-sm text-stone-300">{card.content}</pre>
                        ) : (
                          <p className="text-stone-500 text-sm italic">No content yet. Click edit to add notes.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-stone-500 bg-stone-800/30 rounded-xl border border-stone-700/50">
          <Icons.Note className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="mb-2">No session cards yet</p>
          <p className="text-sm mb-4">Create cards to organize your session notes</p>
          <button
            onClick={() => setShowNewCard(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded-lg text-sm text-amber-100 transition-colors"
          >
            <Icons.Plus className="w-4 h-4" />
            Create Your First Card
          </button>
        </div>
      )}

      {/* Archived Sessions */}
      <div className="border-t border-stone-700 pt-6">
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
          <div className="space-y-4">
            {sessions.map(session => (
              <div key={session.id} className="bg-stone-800/50 border border-stone-700 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-stone-700/50">
                  <span className="font-medium text-stone-300">
                    {new Date(session.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500">{session.cards?.length || 0} cards</span>
                    <button
                      onClick={() => deleteSession(session.id)}
                      className="p-1 rounded hover:bg-stone-700 text-stone-400 hover:text-red-400"
                    >
                      <Icons.Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(session.cards || []).map(card => {
                    const colors = DEFAULT_CARD_COLORS[card.colorIndex % DEFAULT_CARD_COLORS.length];
                    return (
                      <ArchivedCard key={card.id} card={card} colors={colors} />
                    );
                  })}
                  {/* Legacy support for old text-based sessions */}
                  {session.notes && !session.cards && (
                    <div className="col-span-full">
                      <pre className="text-sm whitespace-pre-wrap font-mono text-stone-400">{session.notes}</pre>
                    </div>
                  )}
                </div>
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

// Archived card component (read-only, collapsible)
function ArchivedCard({ card, colors }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className={`${colors.bg} ${colors.border} border rounded-lg overflow-hidden`}>
      <div 
        className="p-3 cursor-pointer flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <h4 className={`font-medium text-sm ${colors.text}`}>{card.title}</h4>
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`w-4 h-4 text-stone-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
        </svg>
      </div>
      {expanded && card.content && (
        <div className="px-3 pb-3 border-t border-stone-700/30">
          <pre className="pt-2 whitespace-pre-wrap font-mono text-xs text-stone-400">{card.content}</pre>
        </div>
      )}
    </div>
  );
}
