'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Icons from './components/Icons';
import { defaultPartyData, defaultEnemyTemplates } from './components/defaultData';
import CharacterCard from './components/CharacterCard';
import InitiativeItem from './components/InitiativeItem';
import { AddEnemyModal, AddPartyModal } from './components/Modals';
import TemplateEditor from './components/TemplateEditor';

export default function DMAdminTool() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'combat');
  const [party, setParty] = useState(defaultPartyData);
  const [enemies, setEnemies] = useState([]);
  const [templates, setTemplates] = useState(defaultEnemyTemplates);
  const [expandedCards, setExpandedCards] = useState({});
  const [showAddEnemy, setShowAddEnemy] = useState(false);
  const [showAddParty, setShowAddParty] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Update tab when URL changes
  useEffect(() => {
    if (tabFromUrl && ['combat', 'characters', 'templates'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading data from API...');
        const [partyRes, templatesRes] = await Promise.all([
          fetch('/api/party'),
          fetch('/api/templates'),
        ]);
        
        console.log('Party response status:', partyRes.status);
        if (partyRes.ok) {
          const partyData = await partyRes.json();
          console.log('Party data loaded:', partyData);
          if (partyData && Array.isArray(partyData) && partyData.length > 0) {
            setParty(partyData);
          }
        }
        
        console.log('Templates response status:', templatesRes.status);
        if (templatesRes.ok) {
          const templatesData = await templatesRes.json();
          console.log('Templates data loaded:', templatesData);
          if (templatesData && Array.isArray(templatesData) && templatesData.length > 0) {
            setTemplates(templatesData);
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  // Auto-save party when it changes (debounced, only after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    const timeout = setTimeout(() => {
      fetch('/api/party', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(party),
      }).then(() => {
        setSaveStatus('Party saved');
        setTimeout(() => setSaveStatus(''), 2000);
      }).catch(console.error);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [party, isLoaded]);

  // Auto-save templates when they change (debounced, only after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    const timeout = setTimeout(() => {
      fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templates),
      }).then(() => {
        setSaveStatus('Templates saved');
        setTimeout(() => setSaveStatus(''), 2000);
      }).catch(console.error);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [templates, isLoaded]);

  const reloadParty = async () => {
    try {
      const res = await fetch('/api/party');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data)) setParty(data);
        setSaveStatus('Party reloaded');
        setTimeout(() => setSaveStatus(''), 2000);
      }
    } catch (err) {
      console.error('Error reloading party:', err);
    }
  };

  const reloadTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data)) setTemplates(data);
        setSaveStatus('Templates reloaded');
        setTimeout(() => setSaveStatus(''), 2000);
      }
    } catch (err) {
      console.error('Error reloading templates:', err);
    }
  };

  const initiativeList = [...party, ...enemies].sort((a, b) => b.initiative - a.initiative);

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) return;
    const dragged = initiativeList[dragIndex];
    const target = initiativeList[dropIndex];
    const newInit = target.initiative + (dragIndex > dropIndex ? 0.5 : -0.5);
    if (party.some(p => p.id === dragged.id)) setParty(prev => prev.map(p => p.id === dragged.id ? { ...p, initiative: newInit } : p));
    else setEnemies(prev => prev.map(e => e.id === dragged.id ? { ...e, initiative: newInit } : e));
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100">
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      <header className="relative border-b border-amber-900/30 bg-stone-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg"><Icons.Dice /></div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">DM&apos;s Toolkit</h1>
                <p className="text-xs text-stone-400">5th Edition Combat Manager</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {saveStatus && <span className="text-xs text-amber-400 bg-amber-900/30 px-2 py-1 rounded">{saveStatus}</span>}
              <div className="flex gap-1 bg-stone-800 rounded-lg p-1">
                <button onClick={() => setActiveTab('combat')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'combat' ? 'bg-amber-700' : 'hover:bg-stone-700'}`}><Icons.Sword /> Combat</button>
                <button onClick={() => setActiveTab('characters')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'characters' ? 'bg-amber-700' : 'hover:bg-stone-700'}`}><Icons.Shield /> Characters</button>
                <button onClick={() => setActiveTab('templates')} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'templates' ? 'bg-amber-700' : 'hover:bg-stone-700'}`}><Icons.Book /> Templates</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {activeTab === 'combat' ? (
        <main className="relative max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2"><Icons.Shield />Party & Allies</h2>
              <div className="flex gap-2">
                <button onClick={reloadParty} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-700/50 hover:bg-stone-600/50 text-xs"><Icons.Refresh />Reload</button>
                <button onClick={() => setParty(prev => prev.map(p => ({ ...p, resources: (p.resources || []).map(r => ({ ...r, current: r.max })) })))} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-700/50 hover:bg-stone-600/50 text-xs"><Icons.Refresh />Rest</button>
                <button onClick={() => setShowAddParty(true)} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-800/50 hover:bg-emerald-700/50 text-emerald-300 text-sm"><Icons.Plus />Add</button>
              </div>
            </div>
            {party.map(m => <CharacterCard key={m.id} character={m} isEnemy={false} onUpdate={(u) => setParty(prev => prev.map(p => p.id === u.id ? u : p))} onRemove={(id) => setParty(prev => prev.filter(p => p.id !== id))} expanded={expandedCards[m.id]} onToggleExpand={() => setExpandedCards(prev => ({ ...prev, [m.id]: !prev[m.id] }))} showResources />)}
            {!party.length && <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg">No party members yet.</div>}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2"><Icons.Sword />Initiative</h2>
              <button onClick={() => { setParty(prev => prev.map(p => ({ ...p, initiative: Math.floor(Math.random() * 20) + 1 }))); setEnemies(prev => prev.map(e => ({ ...e, initiative: Math.floor(Math.random() * 20) + 1 }))); }} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-800/50 hover:bg-amber-700/50 text-amber-300 text-sm"><Icons.Dice />Roll All</button>
            </div>
            <div className="space-y-2">
              {initiativeList.map((c, i) => <InitiativeItem key={c.id} character={c} isEnemy={enemies.some(e => e.id === c.id)} index={i} onDragStart={(e, idx) => { setDragIndex(idx); e.dataTransfer.effectAllowed = 'move'; }} onDragOver={(e, idx) => { e.preventDefault(); setDragOverIndex(idx); }} onDrop={handleDrop} onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }} isDragging={dragIndex === i} dragOverIndex={dragOverIndex} onUpdateInitiative={(id, newInit) => { if (party.some(p => p.id === id)) setParty(prev => prev.map(p => p.id === id ? { ...p, initiative: newInit } : p)); else setEnemies(prev => prev.map(e => e.id === id ? { ...e, initiative: newInit } : e)); }} />)}
              {!initiativeList.length && <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg">Add combatants to begin!</div>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-red-400 flex items-center gap-2"><Icons.Skull />Enemies</h2>
              <div className="flex gap-2">
                {enemies.length > 0 && <button onClick={() => setEnemies([])} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-stone-700/50 hover:bg-stone-600/50 text-sm"><Icons.Trash />Clear</button>}
                <button onClick={() => setShowAddEnemy(true)} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-800/50 hover:bg-red-700/50 text-red-300 text-sm"><Icons.Plus />Add</button>
              </div>
            </div>
            {enemies.map(e => <CharacterCard key={e.id} character={e} isEnemy={!e.isNpc} onUpdate={(u) => setEnemies(prev => prev.map(x => x.id === u.id ? u : x))} onRemove={(id) => setEnemies(prev => prev.filter(x => x.id !== id))} expanded={expandedCards[e.id]} onToggleExpand={() => setExpandedCards(prev => ({ ...prev, [e.id]: !prev[e.id] }))} />)}
            {!enemies.length && <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg">No enemies yet.</div>}
          </div>
        </main>
      ) : activeTab === 'characters' ? (
        <main className="relative max-w-4xl mx-auto p-4">
          <div className="bg-stone-900/50 border border-stone-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2"><Icons.Shield /> Party Members</h2>
              <div className="flex gap-2">
                <button onClick={reloadParty} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-stone-700/50 hover:bg-stone-600/50 text-sm"><Icons.Refresh />Reload</button>
                <button onClick={() => setShowAddParty(true)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-800/50 hover:bg-emerald-700/50 text-emerald-300 text-sm"><Icons.Plus />Add</button>
              </div>
            </div>
            <p className="text-stone-400 text-sm mb-6">Click on a character to view and edit their full details.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {party.map(member => (
                <Link 
                  key={member.id} 
                  href={`/character?id=${member.id}&type=party`}
                  className="block p-4 rounded-lg border border-emerald-800/50 bg-gradient-to-br from-emerald-950/40 to-stone-900/60 hover:border-emerald-600/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-900/50"><Icons.Shield /></div>
                    <div className="flex-1">
                      <h3 className="font-bold">{member.name}</h3>
                      <p className="text-xs text-stone-400">{member.class} {member.level}</p>
                    </div>
                    <div className="text-right text-sm">
                      <div className="flex items-center gap-1 text-stone-400"><Icons.Shield /> {member.ac}</div>
                      <div className="flex items-center gap-1 text-stone-400"><Icons.Heart /> {member.currentHp}/{member.maxHp}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {!party.length && <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg">No party members yet.</div>}
          </div>
        </main>
      ) : (
        <main className="relative max-w-4xl mx-auto p-4">
          <div className="bg-stone-900/50 border border-stone-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2"><Icons.Book />Enemy & NPC Templates</h2>
              <button onClick={reloadTemplates} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-stone-700/50 hover:bg-stone-600/50 text-sm"><Icons.Refresh />Reload</button>
            </div>
            <p className="text-stone-400 text-sm mb-6">Create and manage reusable templates. Changes auto-save to <code className="bg-stone-800 px-1 rounded">data/templates.json</code></p>
            <TemplateEditor templates={templates} onUpdate={(u) => setTemplates(prev => prev.map(t => t.id === u.id ? u : t))} onDelete={(id) => setTemplates(prev => prev.filter(t => t.id !== id))} onCreate={(t) => setTemplates(prev => [...prev, t])} />
          </div>
        </main>
      )}

      <AddEnemyModal isOpen={showAddEnemy} onClose={() => setShowAddEnemy(false)} onAdd={(e) => setEnemies(prev => [...prev, e])} templates={templates} />
      <AddPartyModal 
        isOpen={showAddParty} 
        onClose={() => setShowAddParty(false)} 
        onSave={(newMember) => {
          const newParty = [...party, newMember];
          setParty(newParty);
          // Immediately save to file
          fetch('/api/party', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newParty),
          }).then(() => {
            setSaveStatus('Party saved');
            setTimeout(() => setSaveStatus(''), 2000);
          }).catch(console.error);
        }} 
      />
    </div>
  );
}
