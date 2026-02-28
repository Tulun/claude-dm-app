'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { defaultEnemyTemplates } from '../components/defaultData';
import EncounterPlanner from './EncounterPlanner';
import EncounterEditor from './EncounterEditor';
import EncounterList from './EncounterList';

export default function EncountersPage() {
  const [encounters, setEncounters] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [encountersLoaded, setEncountersLoaded] = useState(false);
  const [editingEncounter, setEditingEncounter] = useState(null);
  
  // Daily tracker state - initialize from localStorage
  const [dailyEncounters, setDailyEncounters] = useState([]);
  const [partySize, setPartySize] = useState(4);
  const [partyLevel, setPartyLevel] = useState(5);
  const [calcMode, setCalcMode] = useState('2024');
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load party settings from localStorage on mount
  useEffect(() => {
    try {
      const savedPartySize = localStorage.getItem('dm-toolkit-party-size');
      const savedPartyLevel = localStorage.getItem('dm-toolkit-party-level');
      const savedCalcMode = localStorage.getItem('dm-toolkit-calc-mode');
      
      if (savedPartySize) setPartySize(parseInt(savedPartySize) || 4);
      if (savedPartyLevel) setPartyLevel(parseInt(savedPartyLevel) || 5);
      if (savedCalcMode) setCalcMode(savedCalcMode);
    } catch (e) {
      console.error('Error loading party settings:', e);
    }
    setSettingsLoaded(true);
  }, []);

  // Save party settings to localStorage when they change
  useEffect(() => {
    if (!settingsLoaded) return;
    try {
      localStorage.setItem('dm-toolkit-party-size', String(partySize));
      localStorage.setItem('dm-toolkit-party-level', String(partyLevel));
      localStorage.setItem('dm-toolkit-calc-mode', calcMode);
    } catch (e) {
      console.error('Error saving party settings:', e);
    }
  }, [partySize, partyLevel, calcMode, settingsLoaded]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [encountersRes, templatesRes] = await Promise.all([
          fetch('/api/encounters'),
          fetch('/api/templates'),
        ]);
        
        if (encountersRes.ok) {
          const data = await encountersRes.json();
          setEncounters(Array.isArray(data) ? data : []);
        }
        
        if (templatesRes.ok) {
          const data = await templatesRes.json();
          setTemplates(data && Array.isArray(data) && data.length > 0 ? data : defaultEnemyTemplates);
        } else {
          setTemplates(defaultEnemyTemplates);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setTemplates(defaultEnemyTemplates);
      }
      setIsLoaded(true);
      setTimeout(() => setEncountersLoaded(true), 0);
    };
    loadData();
  }, []);

  // Auto-save encounters
  useEffect(() => {
    if (!encountersLoaded) return;
    const timeout = setTimeout(() => {
      fetch('/api/encounters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(encounters),
      }).catch(console.error);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [encounters, encountersLoaded]);

  // Calculate encounter stats
  const calculateEncounterStats = (encounter) => {
    let totalXP = 0;
    let monsterCount = 0;
    encounter.monsters.forEach(m => {
      const template = templates.find(t => t.id === m.templateId);
      if (template) {
        totalXP += (template.xp || 0) * m.quantity;
        monsterCount += m.quantity;
      }
    });
    return { totalXP, monsterCount };
  };

  // Encounter CRUD
  const createNewEncounter = (name = 'New Encounter') => {
    const newEncounter = {
      id: `encounter-${Date.now()}`,
      name: name,
      monsters: [],
      createdAt: new Date().toISOString(),
    };
    setEncounters(prev => [...prev, newEncounter]);
    setEditingEncounter(newEncounter);
  };

  const updateEncounter = (updated) => {
    setEncounters(prev => prev.map(e => e.id === updated.id ? updated : e));
    setEditingEncounter(updated);
  };

  const deleteEncounter = (id) => {
    setEncounters(prev => prev.filter(e => e.id !== id));
  };

  const duplicateEncounter = (encounter) => {
    const newEncounter = {
      ...encounter,
      id: `encounter-${Date.now()}`,
      name: `${encounter.name} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    setEncounters(prev => [...prev, newEncounter]);
  };

  // Daily tracker
  const addToDaily = (encounterId) => {
    setDailyEncounters(prev => [...prev, encounterId]);
  };

  const removeFromDaily = (index) => {
    setDailyEncounters(prev => prev.filter((_, i) => i !== index));
  };

  const clearDaily = () => {
    setDailyEncounters([]);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-stone-100 flex items-center justify-center">
        <div className="text-stone-400">Loading...</div>
      </div>
    );
  }

  // Encounter Editor View
  if (editingEncounter) {
    return (
      <EncounterEditor
        encounter={editingEncounter}
        templates={templates}
        onUpdate={updateEncounter}
        onClose={() => setEditingEncounter(null)}
        calculateEncounterStats={calculateEncounterStats}
      />
    );
  }

  // Encounter List View
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-stone-100">
      {/* Header */}
      <header className="relative border-b border-amber-900/30 bg-stone-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                  <rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" />
                  <rect x="2" y="14" width="8" height="8" rx="1" /><rect x="14" y="14" width="8" height="8" rx="1" />
                  <circle cx="6" cy="6" r="1" fill="currentColor" /><circle cx="18" cy="6" r="1" fill="currentColor" />
                  <circle cx="6" cy="18" r="1" fill="currentColor" /><circle cx="18" cy="18" r="1" fill="currentColor" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">DM&apos;s Toolkit</h1>
                <p className="text-xs text-stone-400">5th Edition Combat Manager</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex gap-1 bg-stone-800 rounded-lg p-1">
                <Link href="/" className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-stone-700">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M15 21l6-6" /></svg>
                  Combat
                </Link>
                <Link href="/?tab=characters" className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-stone-700">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  Characters
                </Link>
                <span className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-amber-700">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>
                  Encounters
                </span>
                <Link href="/?tab=templates" className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-stone-700">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                  Templates
                </Link>
                <Link href="/spellbook" className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-stone-700">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 3L10.5 7.5L6 9l4.5 1.5L12 15l1.5-4.5L18 9l-4.5-1.5L12 3zM5 12l-1.5 3L0 16.5l3.5 1.5L5 21l1.5-3L10 16.5 6.5 15 5 12zm14 0l-1.5 3-3.5 1.5 3.5 1.5L19 21l1.5-3 3.5-1.5-3.5-1.5L19 12z"/></svg>
                  Spellbook
                </Link>
                <Link href="/dm" className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-stone-700">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg>
                  DM
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <div className="flex gap-4">
          <EncounterPlanner
            partySize={partySize}
            setPartySize={setPartySize}
            partyLevel={partyLevel}
            setPartyLevel={setPartyLevel}
            calcMode={calcMode}
            setCalcMode={setCalcMode}
            dailyEncounters={dailyEncounters}
            encounters={encounters}
            calculateEncounterStats={calculateEncounterStats}
            removeFromDaily={removeFromDaily}
            clearDaily={clearDaily}
          />

          <EncounterList
            encounters={encounters}
            partySize={partySize}
            partyLevel={partyLevel}
            calcMode={calcMode}
            calculateEncounterStats={calculateEncounterStats}
            onEdit={setEditingEncounter}
            onDuplicate={duplicateEncounter}
            onDelete={deleteEncounter}
            onAddToDaily={addToDaily}
            onCreate={createNewEncounter}
          />
        </div>
      </main>
    </div>
  );
}
