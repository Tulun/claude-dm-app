'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icons from '../components/Icons';
import CharactersTab from './components/CharactersTab';
import WorldTab from './components/WorldTab';
import SessionTab from './components/SessionTab';

export default function DMPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('session');
  const [saveStatus, setSaveStatus] = useState('');

  // Load DM data
  useEffect(() => {
    fetch('/api/dm')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load DM data:', err);
        setLoading(false);
      });
  }, []);

  const saveData = async (updates) => {
    try {
      const res = await fetch('/api/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to save');
      const saved = await res.json();
      setData(saved);
      setSaveStatus('Saved!');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error('Failed to save:', err);
      setSaveStatus('Failed to save');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100 flex items-center justify-center">
        <Icons.Crown className="w-12 h-12 animate-pulse text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100">
      {/* Navigation */}
      <nav className="border-b border-amber-900/30 bg-stone-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800">
                <Icons.Crown className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-amber-400">DM's Toolkit</h1>
                <p className="text-xs text-stone-400">Dungeon Master</p>
              </div>
            </Link>
            <div className="flex gap-2">
              <Link href="/" className="px-4 py-2 rounded-lg text-stone-300 hover:bg-stone-800 transition-colors">Combat</Link>
              <Link href="/?tab=characters" className="px-4 py-2 rounded-lg text-stone-300 hover:bg-stone-800 transition-colors">Characters</Link>
              <Link href="/encounters" className="px-4 py-2 rounded-lg text-stone-300 hover:bg-stone-800 transition-colors">Encounters</Link>
              <Link href="/templates" className="px-4 py-2 rounded-lg text-stone-300 hover:bg-stone-800 transition-colors">Templates</Link>
              <Link href="/spellbook" className="px-4 py-2 rounded-lg text-stone-300 hover:bg-stone-800 transition-colors">Spellbook</Link>
              <Link href="/dm" className="px-4 py-2 rounded-lg bg-amber-700 text-amber-100 transition-colors">DM</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-amber-400 flex items-center gap-3">
              <Icons.Crown className="w-8 h-8" />
              Dungeon Master
            </h1>
            <p className="text-stone-400">Your campaign management hub</p>
          </div>
          {saveStatus && (
            <span className={`text-sm px-3 py-1 rounded ${saveStatus === 'Saved!' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
              {saveStatus}
            </span>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-stone-700 pb-2">
          <button
            onClick={() => setActiveTab('characters')}
            className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition-colors ${
              activeTab === 'characters' 
                ? 'bg-stone-800 text-amber-400 border-b-2 border-amber-500' 
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Icons.Users className="w-4 h-4" />
            Characters
          </button>
          <button
            onClick={() => setActiveTab('world')}
            className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition-colors ${
              activeTab === 'world' 
                ? 'bg-stone-800 text-amber-400 border-b-2 border-amber-500' 
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Icons.Globe className="w-4 h-4" />
            World
          </button>
          <button
            onClick={() => setActiveTab('session')}
            className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition-colors ${
              activeTab === 'session' 
                ? 'bg-stone-800 text-amber-400 border-b-2 border-amber-500' 
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Icons.Note className="w-4 h-4" />
            Session Notes
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'characters' && (
          <CharactersTab data={data} onSave={saveData} />
        )}
        {activeTab === 'world' && (
          <WorldTab data={data} onSave={saveData} />
        )}
        {activeTab === 'session' && (
          <SessionTab data={data} onSave={saveData} />
        )}
      </div>
    </div>
  );
}
