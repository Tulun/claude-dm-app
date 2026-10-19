'use client';

import { useState, useEffect, useRef } from 'react';
import { defaultEnemyTemplates } from '../components/defaultData';
import Navbar from '../components/Navbar';
import EncounterPlanner from './EncounterPlanner';
import EncounterEditor from './EncounterEditor';
import EncounterList from './EncounterList';
import { generateId } from '../utils/generateId';
import { SAVE_ARM_DELAY_MS } from '../utils/timings';

export default function EncountersPage() {
  const [encounters, setEncounters] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  // Saving stays disabled until the initial load settles, so loading data
  // never echoes an unchanged copy back to the API.
  const saveEnabled = useRef(false);
  const [editingEncounter, setEditingEncounter] = useState(null);
  // Arrived via the combat page's Edit Encounter (?edit=<id>&from=combat):
  // the editor offers a way straight back.
  const [fromCombat, setFromCombat] = useState(false);
  // Latest unsaved list, so leaving the page (e.g. Return to Combat) inside
  // the save debounce still persists the edit.
  const pendingSave = useRef(null);
  
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
          const list = Array.isArray(data) ? data : [];
          setEncounters(list);
          // Deep link from /combat: open that encounter's editor directly.
          const params = new URLSearchParams(window.location.search);
          const target = params.get('edit') && list.find(e => e.id === params.get('edit'));
          if (target) {
            setEditingEncounter(target);
            setFromCombat(params.get('from') === 'combat');
          }
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
      // Same arm delay as every gated page (frontend-patterns §1); a 0ms
      // timer could fire before the load's effects ran and echo the list back.
      setTimeout(() => { saveEnabled.current = true; }, SAVE_ARM_DELAY_MS);
    };
    loadData();
  }, []);

  // Auto-save encounters
  useEffect(() => {
    if (!saveEnabled.current) return;
    pendingSave.current = encounters;
    const timeout = setTimeout(() => {
      pendingSave.current = null;
      fetch('/api/encounters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(encounters),
      }).catch(console.error);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [encounters]);

  // Flush a debounced save that hasn't fired yet when the page unmounts.
  useEffect(() => () => {
    if (!pendingSave.current) return;
    fetch('/api/encounters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pendingSave.current),
      keepalive: true,
    }).catch(console.error);
    pendingSave.current = null;
  }, []);

  const closeEditor = () => {
    setEditingEncounter(null);
    setFromCombat(false);
    // Drop ?edit= so a reload lands on the list, not back in the editor.
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname);
  };

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
      id: generateId('encounter'),
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
      id: generateId('encounter'),
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
        onClose={closeEditor}
        calculateEncounterStats={calculateEncounterStats}
        returnToCombat={fromCombat}
      />
    );
  }

  // Encounter List View
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-stone-100">
      <Navbar />

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
