'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icons from '../components/Icons';
import Modal from '../components/Modal';
import Navbar from '../components/Navbar';
import { defaultPartyData, defaultEnemyTemplates } from '../components/defaultData';
import CharacterCard from './components/CharacterCard';
import TurnTracker from './components/TurnTracker';
import InitiativeOrderModal from './components/InitiativeOrderModal';
import LegendaryActionModal from './components/LegendaryActionModal';
import { AddEnemyModal, AddPartyModal } from './components/Modals';
import { getCalculatedAC } from '../utils/acCalculation';
import { generateId } from '../utils/generateId';
import { useDragReorder } from './useDragReorder';
import { useToast } from '../hooks/useToast';
import { SAVE_ARM_DELAY_MS, SAVE_DEBOUNCE_MS } from '../utils/timings';

const EMPTY_TEMPLATES = [];

export default function CombatPage() {
  const router = useRouter();
  const [party, setParty] = useState(null); // Start with null to detect loading
  const [enemies, setEnemies] = useState([]);
  const [lairAction, setLairAction] = useState(null); // { initiative: 20, notes: '' }
  const [templates, setTemplates] = useState(null); // Start with null to detect loading
  const [expandedCards, setExpandedCards] = useState({});
  const [showAddEnemy, setShowAddEnemy] = useState(false);
  const [showAddParty, setShowAddParty] = useState(false);
  const [saveStatus, showToast] = useToast();
  const [savedEncounters, setSavedEncounters] = useState([]);
  const [showLoadEncounter, setShowLoadEncounter] = useState(false);
  const [encounterToLoad, setEncounterToLoad] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showLegendaryModal, setShowLegendaryModal] = useState(false);
  // Turn tracker. `turn` keeps BOTH the position and who was standing there,
  // so the pointer can follow its combatant when the order is re-sorted and
  // fall back to the position when that combatant is removed.
  const [combatActive, setCombatActive] = useState(false);
  const [round, setRound] = useState(1);
  const [turn, setTurn] = useState({ index: 0, id: null });
  // A legendary action OVERLAYS the pointer instead of moving it: { id, name, label }.
  const [interrupt, setInterrupt] = useState(null);
  // Manual initiative order - stores IDs in display order
  const [initiativeOrder, setInitiativeOrder] = useState([]);
  // Saving stays disabled until the initial load settles, so loading data
  // never echoes an unchanged copy back to the API.
  const saveEnabled = React.useRef(false);

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
          if (encounterData && Array.isArray(encounterData.initiativeOrder)) {
            setInitiativeOrder(encounterData.initiativeOrder);
          }
          if (encounterData && typeof encounterData.round === 'number') {
            setRound(encounterData.round);
          }
          if (encounterData && typeof encounterData.turnIndex === 'number') {
            setTurn({ index: encounterData.turnIndex, id: encounterData.turnId || null });
          }
          if (encounterData && encounterData.combatActive) {
            setCombatActive(true);
          }
          if (encounterData && encounterData.interrupt) {
            setInterrupt(encounterData.interrupt);
          }
        }

        if (encountersRes.ok) {
          const encountersData = await encountersRes.json();
          if (Array.isArray(encountersData)) {
            setSavedEncounters(encountersData);
          }
        }

        // Enable saving after a delay to ensure state has settled
        setTimeout(() => { saveEnabled.current = true; }, SAVE_ARM_DELAY_MS);
      } catch (err) {
        console.error('Error loading data:', err);
        // Fall back to defaults on error
        setParty(defaultPartyData);
        setTemplates(defaultEnemyTemplates);
        setTimeout(() => { saveEnabled.current = true; }, SAVE_ARM_DELAY_MS);
      }
    };
    loadData();
  }, []);

  // Auto-save party when it changes (debounced, only after initial load)
  useEffect(() => {
    if (!saveEnabled.current) return;
    const timeout = setTimeout(() => {
      fetch('/api/party', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(party),
      }).then(() => {
        showToast('Party saved');
      }).catch(console.error);
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [party]);

  // Auto-save templates when they change (debounced, only after initial load)
  useEffect(() => {
    if (!saveEnabled.current) return;
    const timeout = setTimeout(() => {
      fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templates),
      }).then(() => {
        showToast('Templates saved');
      }).catch(console.error);
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [templates]);

  // Auto-save encounter (enemies + lairAction + initiative/turn state) when it
  // changes (debounced, only after initial load)
  useEffect(() => {
    // Only save if loading is complete and save is enabled
    if (!saveEnabled.current) return;

    const timeout = setTimeout(() => {
      fetch('/api/encounter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enemies,
          lairAction,
          initiativeOrder,
          combatActive,
          round,
          turnIndex: turn.index,
          turnId: turn.id,
          interrupt,
        }),
      }).then(() => {
        showToast('Encounter saved');
      }).catch(console.error);
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [enemies, lairAction, initiativeOrder, combatActive, round, turn, interrupt]);

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
        showToast('Party reloaded');
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
          id: generateId('enemy'),
          name: displayName,
          currentHp: template.maxHp,
          initiative: 0,
        });
      }
    });
    
    setEnemies(prev => [...prev, ...newEnemies]);
    setEncounterToLoad(null);
    setShowLoadEncounter(false);
    showToast(`Loaded: ${encounter.name}`);
  };



  // Extract active companions from party members that are marked for combat
  const partyCompanions = useMemo(() => (party || []).flatMap(member =>
    (member.companions || [])
      .filter(c => c.active && c.inCombat)
      .map(c => ({
        ...c,
        id: `companion-${member.id}-${c.id}`,
        originalId: c.id,
        ownerId: member.id,
        ownerName: member.name,
        isCompanion: true,
        initiative: c.initiative || 0,
        currentHp: c.currentHp || c.maxHp || 1,
        maxHp: c.maxHp || 1,
      }))
  ), [party]);

  // Build the initiative list based on manual order or default to all combatants
  const allCombatants = useMemo(() => {
    const lairActionEntry = lairAction ? {
      id: 'lair-action',
      name: 'Lair Action',
      initiative: lairAction.initiative,
      isLairAction: true,
      notes: lairAction.notes
    } : null;
    return [...(party || []), ...partyCompanions, ...enemies, ...(lairActionEntry ? [lairActionEntry] : [])];
  }, [party, partyCompanions, enemies, lairAction]);

  // If we have a manual order, use it (filtering out any removed combatants)
  // Then append any new combatants not yet in the order
  const fullOrderIds = useMemo(() => {
    const orderedIds = initiativeOrder.filter(id => allCombatants.some(c => c.id === id) || id === 'lair-action');
    const newCombatantIds = allCombatants.filter(c => !orderedIds.includes(c.id)).map(c => c.id);
    return [...orderedIds, ...newCombatantIds];
  }, [initiativeOrder, allCombatants]);

  const fullInitiativeList = useMemo(() => {
    const byId = new Map(allCombatants.map(c => [c.id, c]));
    return fullOrderIds.map(id => byId.get(id)).filter(Boolean);
  }, [fullOrderIds, allCombatants]);

  const enemyIds = useMemo(() => new Set(enemies.map(e => e.id)), [enemies]);

  // Sort by initiative values (including lair action)
  const sortByInitiative = () => {
    const sorted = [...allCombatants].sort((a, b) => b.initiative - a.initiative);
    setInitiativeOrder(sorted.map(c => c.id));
  };

  // ---- Turn tracker -------------------------------------------------------
  // Where the pointer actually sits. `turn` records BOTH the position and who
  // was standing there, so the pointer follows its combatant across a re-sort
  // and falls back to the position when that combatant leaves the fight.
  // Derived rather than stored: a stale pointer can never survive a reorder.
  const activeIndex = useMemo(() => {
    if (!combatActive || fullInitiativeList.length === 0) return -1;
    if (turn.id) {
      const followed = fullInitiativeList.findIndex(c => c.id === turn.id);
      if (followed >= 0) return followed;
    }
    return Math.min(Math.max(turn.index, 0), fullInitiativeList.length - 1);
  }, [combatActive, fullInitiativeList, turn]);

  // nextIndex feeds the order modal's NEXT badge; the tracker derives its own
  // upcoming chips from `list` + `activeIndex`.
  const nextIndex = activeIndex >= 0 ? (activeIndex + 1) % fullInitiativeList.length : -1;
  const currentCombatant = activeIndex >= 0 ? fullInitiativeList[activeIndex] : null;

  const kindOf = useCallback((c) => {
    if (!c) return 'party';
    if (c.isLairAction) return 'lair';
    if (c.isCompanion) return 'companion';
    return enemyIds.has(c.id) ? 'enemy' : 'party';
  }, [enemyIds]);

  // The turn handlers read the live list/pointer through refs so they can stay
  // identity-stable — `goToTurn` is a prop on the memoized InitiativeItem rows,
  // and a fresh closure per render would silently kill their React.memo.
  const listRef = React.useRef(fullInitiativeList);
  const activeIndexRef = React.useRef(activeIndex);
  useEffect(() => { listRef.current = fullInitiativeList; }, [fullInitiativeList]);
  useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);

  // Every deliberate pointer move goes through here so index and id stay in
  // sync (the `activeIndex` derivation above trusts that pairing).
  const goToTurn = useCallback((index) => {
    const list = listRef.current;
    if (!list.length) return;
    const wrapped = ((index % list.length) + list.length) % list.length;
    setInterrupt(null);
    setTurn({ index: wrapped, id: list[wrapped].id });
  }, []);

  const startCombat = useCallback(() => {
    if (!listRef.current.length) return;
    setCombatActive(true);
    setRound(1);
    goToTurn(0);
  }, [goToTurn]);

  const endCombat = useCallback(() => {
    setCombatActive(false);
    setInterrupt(null);
    setRound(1);
    setTurn({ index: 0, id: null });
  }, []);

  const nextTurn = useCallback(() => {
    const list = listRef.current;
    const i = activeIndexRef.current;
    if (!list.length || i < 0) return;
    if (i + 1 >= list.length) setRound(r => r + 1);
    goToTurn(i + 1);
  }, [goToTurn]);

  const prevTurn = useCallback(() => {
    const list = listRef.current;
    const i = activeIndexRef.current;
    if (!list.length || i < 0) return;
    if (i - 1 < 0) setRound(r => Math.max(1, r - 1));
    goToTurn(i - 1);
  }, [goToTurn]);

  const openLegendary = useCallback(() => setShowLegendaryModal(true), []);
  const resumeTurn = useCallback(() => setInterrupt(null), []);
  const startInterrupt = useCallback((creature) => {
    setInterrupt({ id: creature.id, name: creature.name, label: 'Legendary Action' });
    setShowLegendaryModal(false);
  }, []);

  const interruptCreature = useMemo(
    () => (interrupt ? allCombatants.find(c => c.id === interrupt.id) || null : null),
    [interrupt, allCombatants]
  );

  const clearEncounter = () => {
    setEnemies([]);
    setLairAction(null);
    endCombat();
    fetch('/api/encounter', { method: 'DELETE' });
  };

  // Reorder without changing initiative values (drag state lives in useDragReorder)
  const reorderInitiative = useCallback((fromIndex, toIndex) => {
    const currentOrder = fullOrderIds.length > 0 ? [...fullOrderIds] : allCombatants.map(c => c.id);
    const [draggedId] = currentOrder.splice(fromIndex, 1);
    currentOrder.splice(toIndex, 0, draggedId);
    setInitiativeOrder(currentOrder);
  }, [fullOrderIds, allCombatants]);

  const { dragIndex, dragOverIndex, dragHandlers } = useDragReorder(reorderInitiative);

  // Stable handlers so React.memo on CharacterCard / InitiativeItem can skip
  // re-renders. All use functional setState; list setters bail out (return
  // prev) when nothing matched so no-op updates don't trigger saves.
  const updatePartyMember = useCallback((u) => setParty(prev => {
    if (!prev) return prev;
    const next = prev.map(p => p.id === u.id ? u : p);
    return next.some((p, i) => p !== prev[i]) ? next : prev;
  }), []);
  const removePartyMember = useCallback((id) => setParty(prev => prev ? prev.filter(p => p.id !== id) : prev), []);
  const updateEnemy = useCallback((u) => setEnemies(prev => {
    const next = prev.map(x => x.id === u.id ? u : x);
    return next.some((x, i) => x !== prev[i]) ? next : prev;
  }), []);
  const removeEnemy = useCallback((id) => setEnemies(prev => prev.filter(x => x.id !== id)), []);
  const toggleExpand = useCallback((id) => setExpandedCards(prev => ({ ...prev, [id]: !prev[id] })), []);
  const addEnemy = useCallback((e) => setEnemies(prev => [...prev, e]), []);
  const addPartyMember = useCallback((m) => setParty(prev => [...(prev || []), m]), []);

  const updateCompanion = useCallback((companionId, changes) => {
    setParty(prev => {
      if (!prev) return prev;
      const next = prev.map(p => {
        const companions = p.companions || [];
        const updated = companions.map(comp => `companion-${p.id}-${comp.id}` === companionId ? { ...comp, ...changes } : comp);
        return updated.some((c, i) => c !== companions[i]) ? { ...p, companions: updated } : p;
      });
      return next.some((p, i) => p !== prev[i]) ? next : prev;
    });
  }, []);

  const updateInitiative = useCallback((id, newInit) => {
    if (id === 'lair-action') {
      setLairAction(prev => ({ ...prev, initiative: newInit }));
      return;
    }
    if (id.startsWith('companion-')) {
      updateCompanion(id, { initiative: newInit });
      return;
    }
    // Update whichever list holds the id; the other setter bails out untouched
    setParty(prev => {
      if (!prev) return prev;
      const next = prev.map(p => p.id === id ? { ...p, initiative: newInit } : p);
      return next.some((p, i) => p !== prev[i]) ? next : prev;
    });
    setEnemies(prev => {
      const next = prev.map(x => x.id === id ? { ...x, initiative: newInit } : x);
      return next.some((x, i) => x !== prev[i]) ? next : prev;
    });
  }, [updateCompanion]);

  const updateCompanionHp = useCallback((id, hp) => updateCompanion(id, { currentHp: hp }), [updateCompanion]);
  const updateLairNotes = useCallback((notes) => setLairAction(prev => ({ ...prev, notes })), []);
  const removeLairAction = useCallback(() => setLairAction(null), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100">
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      <Navbar saveStatus={saveStatus} />

      <main className="relative max-w-7xl mx-auto p-4 space-y-4">
          {/* Initiative bar: full-width tracker above the columns. The full
              order lives in the Manage Order modal so the table view stays
              uncluttered. */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2"><Icons.Sword />Initiative</h2>
              <button onClick={() => setShowOrderModal(true)} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-800/50 hover:bg-amber-700/50 text-amber-300 text-sm"><Icons.GripVertical />Manage Order</button>
            </div>

            <TurnTracker
              combatActive={combatActive}
              round={round}
              turnNumber={activeIndex + 1}
              turnCount={fullInitiativeList.length}
              current={currentCombatant}
              currentKind={kindOf(currentCombatant)}
              list={fullInitiativeList}
              activeIndex={activeIndex}
              kindOf={kindOf}
              onJumpTo={goToTurn}
              interrupt={interrupt}
              interruptCreature={interruptCreature}
              onStart={startCombat}
              onEndCombat={endCombat}
              onNextTurn={nextTurn}
              onPrevTurn={prevTurn}
              onOpenLegendary={openLegendary}
              onResume={resumeTurn}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-4 lg:col-span-2">
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
              // Two card columns on desktop so more of the party is visible
              // without scrolling; rows stretch so side-by-side cards line up
              // (cards get the `stretch` prop to pin their stat bars).
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {party.map(m => <CharacterCard key={m.id} character={m} isEnemy={false} onUpdate={updatePartyMember} onRemove={removePartyMember} expanded={expandedCards[m.id]} onToggleExpand={toggleExpand} showResources templates={templates || EMPTY_TEMPLATES} stretch />)}
              </div>
            ) : (
              <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg">No party members yet.</div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-red-400 flex items-center gap-2"><Icons.Skull />Enemies</h2>
                <div className="flex gap-2">
                  {(enemies.length > 0 || lairAction) && <button onClick={clearEncounter} title="Clear encounter" className="flex items-center gap-1 px-2 py-1 rounded text-stone-500 hover:text-stone-300 hover:bg-stone-700/50 text-sm"><Icons.Trash /></button>}
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
            {enemies.map(e => <CharacterCard key={e.id} character={e} isEnemy={true} onUpdate={updateEnemy} onRemove={removeEnemy} />)}
            {!enemies.length && !lairAction && <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg">No enemies yet. <Link href="/encounters" className="text-amber-500 hover:text-amber-400">Create encounters</Link> to quickly add groups.</div>}
          </div>
          </div>
        </main>

      <AddEnemyModal isOpen={showAddEnemy} onClose={() => setShowAddEnemy(false)} onAdd={addEnemy} templates={templates || EMPTY_TEMPLATES} />
      <AddPartyModal isOpen={showAddParty} onClose={() => setShowAddParty(false)} onSave={addPartyMember} />

      <InitiativeOrderModal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        list={fullInitiativeList}
        enemyIds={enemyIds}
        activeIndex={activeIndex}
        nextIndex={nextIndex}
        combatActive={combatActive}
        onSort={sortByInitiative}
        drag={dragHandlers}
        dragIndex={dragIndex}
        dragOverIndex={dragOverIndex}
        onUpdateInitiative={updateInitiative}
        onUpdateHp={updateCompanionHp}
        onUpdateLairNotes={updateLairNotes}
        onRemoveLairAction={removeLairAction}
        onSelectTurn={goToTurn}
      />

      <LegendaryActionModal
        isOpen={showLegendaryModal}
        onClose={() => setShowLegendaryModal(false)}
        creatures={enemies}
        onSelect={startInterrupt}
      />

      {/* Load Encounter Modal */}
      {showLoadEncounter && (
        <Modal onClose={() => { setShowLoadEncounter(false); setEncounterToLoad(null); }}>
          <div className="bg-stone-900 border border-stone-700 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col">
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
        </Modal>
      )}
    </div>
  );
}
