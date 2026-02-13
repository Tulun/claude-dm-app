'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Icons from './components/Icons';
import { defaultPartyData, defaultEnemyTemplates } from './components/defaultData';
import CharacterCard from './components/CharacterCard';
import InitiativeItem from './components/InitiativeItem';
import { AddEnemyModal, AddPartyModal } from './components/Modals';
import TemplateEditor from './components/TemplateEditor';

// Calculate AC from equipped items
const getCalculatedAC = (character) => {
  const getModNum = (score) => Math.floor(((parseInt(score) || 10) - 10) / 2);
  const dexMod = getModNum(character.dex);
  const inventory = character.inventory || [];
  
  const equippedArmor = inventory.find(i => i.itemType === 'armor' && i.equipped && i.armorType !== 'Shield');
  const equippedShield = inventory.find(i => i.itemType === 'armor' && i.equipped && i.armorType === 'Shield');
  const acBonusItems = inventory.filter(i => i.equipped && i.acBonus && i.itemType !== 'armor');
  
  let baseAC = 10;
  let dexBonus = dexMod;
  let shieldBonus = 0;
  let itemBonuses = 0;
  let tempBonus = parseInt(character.tempAC) || 0;
  
  if (character.acEffect === 'mageArmor') {
    baseAC = 13;
  } else if (character.acEffect === 'barkskin') {
    if (10 + dexMod < 16) { baseAC = 16; dexBonus = 0; }
  } else if (character.acEffect === 'unarmoredDefense') {
    const conMod = getModNum(character.con);
    const wisMod = getModNum(character.wis);
    const classes = character.classes?.map(c => c.name.toLowerCase()) || [character.class?.toLowerCase()];
    if (classes.includes('barbarian')) baseAC = 10 + conMod;
    else if (classes.includes('monk')) baseAC = 10 + wisMod;
  } else if (character.acEffect === 'draconicResilience') {
    // Draconic Sorcerer: 10 + DEX + CHA
    const chaMod = getModNum(character.cha);
    baseAC = 10 + chaMod;
  } else if (equippedArmor) {
    baseAC = parseInt(equippedArmor.baseAC) || 10;
    if (equippedArmor.armorType === 'Medium') dexBonus = Math.min(2, dexMod);
    else if (equippedArmor.armorType === 'Heavy') dexBonus = 0;
  } else if (inventory.length === 0 && !character.acEffect) {
    // No inventory and no effect, fall back to manual AC field
    return character.ac || 10;
  }
  
  if (equippedShield) shieldBonus = parseInt(equippedShield.baseAC) || 2;
  acBonusItems.forEach(item => { itemBonuses += parseInt(item.acBonus) || 0; });
  
  return baseAC + dexBonus + shieldBonus + itemBonuses + tempBonus;
};

export default function DMAdminTool() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'combat');
  const [party, setParty] = useState(null); // Start with null to detect loading
  const [enemies, setEnemies] = useState([]);
  const [lairAction, setLairAction] = useState(null); // { initiative: 20, notes: '' }
  const [templates, setTemplates] = useState(null); // Start with null to detect loading
  const [expandedCards, setExpandedCards] = useState({});
  const [showAddEnemy, setShowAddEnemy] = useState(false);
  const [showAddParty, setShowAddParty] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [encounterLoaded, setEncounterLoaded] = useState(false);
  const [savedEncounters, setSavedEncounters] = useState([]);
  const [showLoadEncounter, setShowLoadEncounter] = useState(false);
  const [encounterToLoad, setEncounterToLoad] = useState(null);
  const encounterSaveEnabled = React.useRef(false);

  // Update tab when URL changes and reload data (in case edited on character page)
  useEffect(() => {
    if (tabFromUrl && ['combat', 'characters', 'templates'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
      // Reload data when returning from another page
      if (isLoaded) {
        fetch('/api/party').then(res => res.ok && res.json()).then(data => {
          if (data && Array.isArray(data)) setParty(data.length > 0 ? data : defaultPartyData);
        }).catch(console.error);
      }
    }
  }, [tabFromUrl]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [partyRes, templatesRes, encounterRes, encountersRes] = await Promise.all([
          fetch('/api/party'),
          fetch('/api/templates'),
          fetch('/api/encounter'),
          fetch('/api/encounters'),
        ]);
        
        if (partyRes.ok) {
          const partyData = await partyRes.json();
          // Use loaded data or fall back to defaults
          setParty(partyData && Array.isArray(partyData) && partyData.length > 0 ? partyData : defaultPartyData);
        } else {
          setParty(defaultPartyData);
        }
        
        if (templatesRes.ok) {
          const templatesData = await templatesRes.json();
          setTemplates(templatesData && Array.isArray(templatesData) && templatesData.length > 0 ? templatesData : defaultEnemyTemplates);
        } else {
          setTemplates(defaultEnemyTemplates);
        }

        if (encounterRes.ok) {
          const encounterData = await encounterRes.json();
          if (encounterData && Array.isArray(encounterData.enemies) && encounterData.enemies.length > 0) {
            setEnemies(encounterData.enemies);
          }
          if (encounterData && encounterData.lairAction) {
            setLairAction(encounterData.lairAction);
          }
        }

        if (encountersRes.ok) {
          const encountersData = await encountersRes.json();
          if (Array.isArray(encountersData)) {
            setSavedEncounters(encountersData);
          }
        }
        setEncounterLoaded(true);
        // Enable saving after a delay to ensure state has settled
        setTimeout(() => { encounterSaveEnabled.current = true; }, 500);
      } catch (err) {
        console.error('Error loading data:', err);
        // Fall back to defaults on error
        setParty(defaultPartyData);
        setTemplates(defaultEnemyTemplates);
        setEncounterLoaded(true);
        setTimeout(() => { encounterSaveEnabled.current = true; }, 500);
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

  // Auto-save encounter (enemies + lairAction) when it changes (debounced, only after initial load)
  useEffect(() => {
    // Only save if loading is complete and save is enabled
    if (!encounterSaveEnabled.current) return;
    
    const timeout = setTimeout(() => {
      fetch('/api/encounter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enemies, lairAction }),
      }).then(() => {
        setSaveStatus('Encounter saved');
        setTimeout(() => setSaveStatus(''), 2000);
      }).catch(console.error);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [enemies, lairAction]);

  const reloadParty = async () => {
    try {
      const res = await fetch('/api/party');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data) && data.length > 0) {
          setParty(data);
        } else {
          setParty(defaultPartyData);
        }
        setSaveStatus('Party reloaded');
        setTimeout(() => setSaveStatus(''), 2000);
      }
    } catch (err) {
      console.error('Error reloading party:', err);
    }
  };

  // Load a saved encounter into the current combat
  const loadEncounter = (encounter) => {
    if (!encounter || !templates) return;
    
    const newEnemies = [];
    encounter.monsters.forEach(monster => {
      const template = templates.find(t => t.id === monster.templateId);
      if (!template) return;
      
      for (let i = 0; i < monster.quantity; i++) {
        const suffix = monster.quantity > 1 ? ` ${i + 1}` : '';
        const displayName = monster.customName 
          ? (monster.quantity > 1 ? `${monster.customName}${suffix}` : monster.customName)
          : (monster.quantity > 1 ? `${monster.name}${suffix}` : monster.name);
        
        newEnemies.push({
          ...template,
          id: `enemy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: displayName,
          currentHp: template.maxHp,
          initiative: 0,
        });
      }
    });
    
    setEnemies(prev => [...prev, ...newEnemies]);
    setEncounterToLoad(null);
    setShowLoadEncounter(false);
    setSaveStatus(`Loaded: ${encounter.name}`);
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const reloadTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data) && data.length > 0) {
          setTemplates(data);
        } else {
          setTemplates(defaultEnemyTemplates);
        }
        setSaveStatus('Templates reloaded');
        setTimeout(() => setSaveStatus(''), 2000);
      }
    } catch (err) {
      console.error('Error reloading templates:', err);
    }
  };

  // Manual initiative order - stores IDs in display order
  const [initiativeOrder, setInitiativeOrder] = useState([]);
  
  // Extract active companions from party members that are marked for combat
  const partyCompanions = (party || []).flatMap(member => 
    (member.companions || [])
      .filter(c => c.active && c.inCombat)
      .map(c => ({
        ...c,
        id: `companion-${member.id}-${c.id}`,
        ownerId: member.id,
        ownerName: member.name,
        isCompanion: true,
        initiative: c.initiative || 0,
        currentHp: c.currentHp || c.maxHp || 1,
        maxHp: c.maxHp || 1,
      }))
  );
  
  // Build the initiative list based on manual order or default to all combatants
  const lairActionEntry = lairAction ? { 
    id: 'lair-action', 
    name: 'Lair Action', 
    initiative: lairAction.initiative, 
    isLairAction: true,
    notes: lairAction.notes 
  } : null;
  const allCombatants = [...(party || []), ...partyCompanions, ...enemies, ...(lairActionEntry ? [lairActionEntry] : [])];
  
  // If we have a manual order, use it (filtering out any removed combatants)
  // Then append any new combatants not yet in the order
  const orderedIds = initiativeOrder.filter(id => allCombatants.some(c => c.id === id) || id === 'lair-action');
  const newCombatantIds = allCombatants.filter(c => !orderedIds.includes(c.id)).map(c => c.id);
  const fullOrderIds = [...orderedIds, ...newCombatantIds];
  
  const fullInitiativeList = fullOrderIds.map(id => allCombatants.find(c => c.id === id)).filter(Boolean);

  // Sort by initiative values (including lair action)
  const sortByInitiative = () => {
    const sorted = [...allCombatants].sort((a, b) => b.initiative - a.initiative);
    setInitiativeOrder(sorted.map(c => c.id));
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) return;
    
    // Reorder without changing initiative values
    const currentOrder = fullOrderIds.length > 0 ? [...fullOrderIds] : allCombatants.map(c => c.id);
    const [draggedId] = currentOrder.splice(dragIndex, 1);
    currentOrder.splice(dropIndex, 0, draggedId);
    setInitiativeOrder(currentOrder);
    
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100">
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      <header className="relative border-b border-amber-900/30 bg-stone-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg"><Icons.Dice /></div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">DM&apos;s Toolkit</h1>
                <p className="text-xs text-stone-400">5th Edition Combat Manager</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              {saveStatus && <span className="text-xs text-amber-400 bg-amber-900/30 px-2 py-1 rounded">{saveStatus}</span>}
              <div className="flex gap-1 bg-stone-800 rounded-lg p-1">
                <button onClick={() => { setActiveTab('combat'); router.push('/'); }} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'combat' ? 'bg-amber-700' : 'hover:bg-stone-700'}`}><Icons.Sword /> Combat</button>
                <button onClick={() => { setActiveTab('characters'); router.push('/?tab=characters'); }} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'characters' ? 'bg-amber-700' : 'hover:bg-stone-700'}`}><Icons.Shield /> Characters</button>
                <Link href="/encounters" className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-stone-700"><Icons.Scroll /> Encounters</Link>
                <button onClick={() => { setActiveTab('templates'); router.push('/?tab=templates'); }} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${activeTab === 'templates' ? 'bg-amber-700' : 'hover:bg-stone-700'}`}><Icons.Book /> Templates</button>
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
                <button onClick={() => setParty(prev => (prev || []).map(p => ({ ...p, resources: (p.resources || []).map(r => ({ ...r, current: r.max })) })))} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-700/50 hover:bg-stone-600/50 text-xs"><Icons.Refresh />Rest</button>
                <button onClick={() => setShowAddParty(true)} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-800/50 hover:bg-emerald-700/50 text-emerald-300 text-sm"><Icons.Plus />Add</button>
              </div>
            </div>
            {!party ? (
              <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg animate-pulse">Loading party...</div>
            ) : party.length > 0 ? (
              party.map(m => <CharacterCard key={m.id} character={m} isEnemy={false} onUpdate={(u) => setParty(prev => prev.map(p => p.id === u.id ? u : p))} onRemove={(id) => setParty(prev => prev.filter(p => p.id !== id))} expanded={expandedCards[m.id]} onToggleExpand={() => setExpandedCards(prev => ({ ...prev, [m.id]: !prev[m.id] }))} showResources />)
            ) : (
              <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg">No party members yet.</div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2"><Icons.Sword />Initiative</h2>
              <button onClick={sortByInitiative} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-800/50 hover:bg-amber-700/50 text-amber-300 text-sm"><Icons.Refresh />Sort by Init</button>
            </div>
            <div className="space-y-2">
              {fullInitiativeList.map((c, i) => <InitiativeItem key={c.id} character={c} isEnemy={enemies.some(e => e.id === c.id)} isCompanion={c.isCompanion} isLairAction={c.isLairAction} index={i} onDragStart={(e, idx) => { setDragIndex(idx); e.dataTransfer.effectAllowed = 'move'; }} onDragOver={(e, idx) => { e.preventDefault(); setDragOverIndex(idx); }} onDrop={handleDrop} onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }} isDragging={dragIndex === i} dragOverIndex={dragOverIndex} onUpdateInitiative={(id, newInit) => { 
                if (id === 'lair-action') {
                  setLairAction(prev => ({ ...prev, initiative: newInit }));
                } else if (id.startsWith('companion-')) {
                  // Update companion initiative - extract owner and companion IDs
                  const parts = id.split('-');
                  const ownerId = parts[1];
                  const companionId = parseInt(parts[2]);
                  setParty(prev => prev.map(p => p.id === ownerId ? { 
                    ...p, 
                    companions: (p.companions || []).map(comp => comp.id === companionId ? { ...comp, initiative: newInit } : comp)
                  } : p));
                } else if ((party || []).some(p => p.id === id)) {
                  setParty(prev => prev.map(p => p.id === id ? { ...p, initiative: newInit } : p));
                } else {
                  setEnemies(prev => prev.map(e => e.id === id ? { ...e, initiative: newInit } : e));
                }
              }} onUpdateHp={c.isCompanion ? (id, hp) => {
                const parts = id.split('-');
                const ownerId = parts[1];
                const companionId = parseInt(parts[2]);
                setParty(prev => prev.map(p => p.id === ownerId ? {
                  ...p,
                  companions: (p.companions || []).map(comp => comp.id === companionId ? { ...comp, currentHp: hp } : comp)
                } : p));
              } : undefined} onUpdateLairNotes={c.isLairAction ? (notes) => setLairAction(prev => ({ ...prev, notes })) : undefined} onRemoveLairAction={c.isLairAction ? () => setLairAction(null) : undefined} />)}
              {!fullInitiativeList.length && <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg">Add combatants to begin!</div>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-red-400 flex items-center gap-2"><Icons.Skull />Enemies</h2>
                <div className="flex gap-2">
                  {(enemies.length > 0 || lairAction) && <button onClick={() => { setEnemies([]); setLairAction(null); fetch('/api/encounter', { method: 'DELETE' }); }} className="flex items-center gap-1 px-2 py-1 rounded text-stone-500 hover:text-stone-300 hover:bg-stone-700/50 text-sm"><Icons.Trash /></button>}
                  <button onClick={() => setShowAddEnemy(true)} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-800/50 hover:bg-red-700/50 text-red-300 text-sm"><Icons.Plus />Add</button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Link href="/encounters" className="text-stone-500 hover:text-stone-300">Manage Encounters →</Link>
                {savedEncounters.length > 0 && <>
                  <span className="text-stone-600">•</span>
                  <button onClick={() => setShowLoadEncounter(true)} className="text-amber-500 hover:text-amber-400">Load Saved</button>
                </>}
                {!lairAction && <>
                  <span className="text-stone-600">•</span>
                  <button onClick={() => setLairAction({ initiative: 20, notes: '' })} className="text-purple-400 hover:text-purple-300">+ Lair Action</button>
                </>}
              </div>
            </div>
            {enemies.map(e => <CharacterCard key={e.id} character={e} isEnemy={!e.isNpc} onUpdate={(u) => setEnemies(prev => prev.map(x => x.id === u.id ? u : x))} onRemove={(id) => setEnemies(prev => prev.filter(x => x.id !== id))} expanded={expandedCards[e.id]} onToggleExpand={() => setExpandedCards(prev => ({ ...prev, [e.id]: !prev[e.id] }))} />)}
            {!enemies.length && !lairAction && <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg">No enemies yet. <Link href="/encounters" className="text-amber-500 hover:text-amber-400">Create encounters</Link> to quickly add groups.</div>}
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
            {!party ? (
              <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg animate-pulse">Loading party...</div>
            ) : party.length > 0 ? (
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
                        <div className={`flex items-center gap-1 ${member.acEffect ? 'text-cyan-400' : 'text-stone-400'}`}><Icons.Shield /> {getCalculatedAC(member)}</div>
                        <div className="flex items-center gap-1 text-stone-400"><Icons.Heart /> {member.currentHp}/{member.maxHp}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg">No party members yet.</div>
            )}
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
            {!templates ? (
              <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg animate-pulse">Loading templates...</div>
            ) : (
              <TemplateEditor templates={templates} onUpdate={(u) => setTemplates(prev => prev.map(t => t.id === u.id ? u : t))} onDelete={(id) => setTemplates(prev => prev.filter(t => t.id !== id))} onCreate={(t) => setTemplates(prev => [...prev, t])} onImport={(t) => setTemplates(prev => [...prev, t])} />
            )}
          </div>
        </main>
      )}

      <AddEnemyModal isOpen={showAddEnemy} onClose={() => setShowAddEnemy(false)} onAdd={(e) => setEnemies(prev => [...prev, e])} templates={templates || []} />
      <AddPartyModal 
        isOpen={showAddParty} 
        onClose={() => setShowAddParty(false)} 
        onSave={(newMember) => {
          const newParty = [...(party || []), newMember];
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

      {/* Load Encounter Modal */}
      {showLoadEncounter && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => { setShowLoadEncounter(false); setEncounterToLoad(null); }}>
          <div className="bg-stone-900 border border-stone-700 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-stone-700">
              <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <Icons.FolderOpen /> Load Encounter
              </h2>
              <p className="text-sm text-stone-400 mt-1">
                {enemies.length > 0 ? 'Monsters will be added to your current encounter.' : 'Select an encounter to load.'}
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {savedEncounters.map(encounter => {
                const monsterCount = encounter.monsters.reduce((sum, m) => sum + m.quantity, 0);
                const totalXP = encounter.monsters.reduce((sum, m) => {
                  const template = (templates || []).find(t => t.id === m.templateId);
                  return sum + ((template?.xp || 0) * m.quantity);
                }, 0);
                
                return (
                  <button
                    key={encounter.id}
                    onClick={() => setEncounterToLoad(encounter)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      encounterToLoad?.id === encounter.id 
                        ? 'border-amber-500 bg-amber-900/30' 
                        : 'border-stone-700 bg-stone-800/50 hover:border-stone-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{encounter.name}</span>
                      <div className="flex items-center gap-3 text-sm text-stone-400">
                        <span>{monsterCount} creatures</span>
                        <span className="text-amber-400">{totalXP.toLocaleString()} XP</span>
                      </div>
                    </div>
                    {encounter.monsters.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {encounter.monsters.slice(0, 4).map(m => (
                          <span key={m.id} className="text-xs bg-stone-700/50 px-2 py-0.5 rounded">
                            {m.quantity > 1 && `${m.quantity}x `}{m.customName || m.name}
                          </span>
                        ))}
                        {encounter.monsters.length > 4 && (
                          <span className="text-xs text-stone-500">+{encounter.monsters.length - 4} more</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
              {savedEncounters.length === 0 && (
                <div className="text-center py-8 text-stone-500">
                  No saved encounters. <Link href="/encounters" className="text-amber-500 hover:text-amber-400">Create one</Link>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-stone-700 flex gap-2">
              <button
                onClick={() => { setShowLoadEncounter(false); setEncounterToLoad(null); }}
                className="flex-1 py-2 rounded-lg bg-stone-700 hover:bg-stone-600"
              >
                Cancel
              </button>
              <button
                onClick={() => encounterToLoad && loadEncounter(encounterToLoad)}
                disabled={!encounterToLoad}
                className={`flex-1 py-2 rounded-lg font-medium ${
                  encounterToLoad 
                    ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                    : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                }`}
              >
                {enemies.length > 0 ? 'Add to Combat' : 'Load Encounter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
