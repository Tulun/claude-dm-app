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
  
  // Daily tracker state
  const [dailyEncounters, setDailyEncounters] = useState([]);
  const [partySize, setPartySize] = useState(4);
  const [partyLevel, setPartyLevel] = useState(5);
  const [calcMode, setCalcMode] = useState('2024');

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
  const createNewEncounter = () => {
    const newEncounter = {
      id: `encounter-${Date.now()}`,
      name: 'New Encounter',
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
      <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur border-b border-stone-700/50 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold">
              <span className="text-2xl">⚔️</span>
              <span className="text-amber-400">DM</span>
              <span className="text-stone-400">Tool</span>
            </Link>
            <span className="text-stone-600">|</span>
            <h1 className="text-lg font-semibold text-stone-300">Encounters</h1>
          </div>
          <Link href="/" className="text-stone-400 hover:text-stone-200 text-sm">
            ← Back to Combat
          </Link>
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
