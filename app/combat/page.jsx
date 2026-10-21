'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icons from '../components/Icons';
import Modal from '../components/Modal';
import Navbar from '../components/Navbar';
import { defaultPartyData, defaultEnemyTemplates } from '../components/defaultData';
import CharacterCard from './components/CharacterCard';
import CombatantTable from './components/CombatantTable';
import TurnTracker from './components/TurnTracker';
import InitiativeItem from './components/InitiativeItem';
import CombatantDrawer from './components/CombatantDrawer';
import InitiativeOrderModal from './components/InitiativeOrderModal';
import LegendaryActionModal from './components/LegendaryActionModal';
import { FRESH_USAGE } from './components/TurnEconomy';
import { AddEnemyModal, AddPartyModal } from './components/Modals';
import { getCalculatedAC } from '../utils/acCalculation';
import { generateId } from '../utils/generateId';
import { compareInitiative } from '../utils/rules';
import { readLairActions, newLairAction, lairActionName } from '../utils/lairActions';
import { useDragReorder } from './useDragReorder';
import { useToast } from '../hooks/useToast';
import { SAVE_ARM_DELAY_MS, SAVE_DEBOUNCE_MS } from '../utils/timings';
import { applyTurnChange, endOfTurnSaveConditions } from './conditions';
import { duplicateEnemy } from './duplicate';
import { numberEnemies } from './enemyNames';

const EMPTY_TEMPLATES = [];
// Enemies encounter-bar buttons: bordered so they read as buttons, colored
// per the combat palette (amber = load, purple = lair, red = enemies).
const BAR_BASE = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors';
const BAR_BUTTON = {
  neutral: `${BAR_BASE} border-stone-700 bg-stone-800/60 text-stone-300 hover:border-stone-500 hover:text-stone-100`,
  amber: `${BAR_BASE} border-amber-700/60 bg-amber-900/30 text-amber-300 hover:border-amber-500 hover:text-amber-200`,
  purple: `${BAR_BASE} border-purple-700/60 bg-purple-900/30 text-purple-300 hover:border-purple-500 hover:text-purple-200`,
  red: `${BAR_BASE} border-red-700/60 bg-red-800/50 text-red-200 hover:bg-red-700/50`,
  danger: `${BAR_BASE} border-stone-700 bg-transparent text-stone-400 hover:border-red-700 hover:text-red-300`,
};
// Per-viewer UI preference (Party / Enemies / Table tab) — browser-local, never persisted
// to the encounter.
const VIEW_MODE_KEY = 'dm-combat-view-mode';

export default function CombatPage() {
  const router = useRouter();
  const [party, setParty] = useState(null); // Start with null to detect loading
  const [enemies, setEnemies] = useState([]);
  const [lairActions, setLairActions] = useState([]); // [{ id, initiative, notes }] — see app/utils/lairActions.js
  const [templates, setTemplates] = useState(null); // Start with null to detect loading
  // Detail drawer: null = closed; { follow: true } tracks whoever's turn it
  // is, { id, follow: false } is pinned to one combatant. Transient — not saved.
  const [inspect, setInspect] = useState(null);
  const [viewMode, setViewMode] = useState('party'); // 'party' | 'enemies' | 'table'
  const [showAddEnemy, setShowAddEnemy] = useState(false);
  const [showAddParty, setShowAddParty] = useState(false);
  const [saveStatus, showToast] = useToast();
  const [savedEncounters, setSavedEncounters] = useState([]);
  const [showLoadEncounter, setShowLoadEncounter] = useState(false);
  const [encounterToLoad, setEncounterToLoad] = useState(null);
  // Which saved encounter (from /api/encounters) the current enemies came
  // from: { id, name } or null. Persisted with the encounter; the header shows
  // the library's current name for that id and links to its editor.
  const [loadedEncounter, setLoadedEncounter] = useState(null);
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
  // Reactions spent this round, keyed by combatant id ({ [id]: true }). Kept
  // in the encounter (not on party/companion records) and cleared for a
  // combatant when their turn starts.
  const [reactionsUsed, setReactionsUsed] = useState({});
  // Action / bonus action spent by whoever's turn it is:
  // { id, action, bonus }. Reset when a turn starts; ignored when
  // `id` isn't the current combatant (e.g. after stepping Back).
  const [turnUsage, setTurnUsage] = useState(null);
  // Transient turn-start reminder (NOT persisted): timed conditions that just
  // expired + the new combatant's conditions that usually allow an end-of-turn
  // save. { id, expired: [{ name, labels }], saves: [name] } or null.
  const [turnReminder, setTurnReminder] = useState(null);
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
            setEnemies(numberEnemies(encounterData.enemies));
          }
          const savedLairs = readLairActions(encounterData);
          if (savedLairs.length) setLairActions(savedLairs);
          if (encounterData && encounterData.loadedEncounter?.id) {
            setLoadedEncounter(encounterData.loadedEncounter);
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
          if (encounterData && encounterData.reactionsUsed && typeof encounterData.reactionsUsed === 'object') {
            setReactionsUsed(encounterData.reactionsUsed);
          }
          if (encounterData && encounterData.turnUsage && typeof encounterData.turnUsage === 'object') {
            setTurnUsage(encounterData.turnUsage);
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

  // Auto-save encounter (enemies + lairActions + initiative/turn state) when it
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
          lairActions,
          loadedEncounter,
          initiativeOrder,
          combatActive,
          round,
          turnIndex: turn.index,
          turnId: turn.id,
          interrupt,
          reactionsUsed,
          turnUsage,
        }),
      }).then(() => {
        showToast('Encounter saved');
      }).catch(console.error);
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [enemies, lairActions, loadedEncounter, initiativeOrder, combatActive, round, turn, interrupt, reactionsUsed, turnUsage]);

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

  // Load a saved encounter into the current combat. 'add' appends its
  // monsters and lair actions; 'replace' swaps out every enemy and lair
  // action. Party and turn state are kept.
  const loadEncounter = (encounter, mode = 'add') => {
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
    
    const replacing = mode === 'replace' || enemies.length === 0;
    // Fresh ids: loading the same encounter twice must not collide.
    const savedLairs = readLairActions(encounter).map(l => ({ ...l, id: newLairAction().id }));
    if (replacing) {
      setEnemies(numberEnemies(newEnemies));
      setLairActions(savedLairs);
      setLoadedEncounter({ id: encounter.id, name: encounter.name });
    } else {
      setEnemies(prev => numberEnemies([...prev, ...newEnemies]));
      if (savedLairs.length) setLairActions(prev => [...prev, ...savedLairs]);
      setLoadedEncounter(prev => prev || { id: encounter.id, name: encounter.name });
    }
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
  // Own memo so the Enemies section's lair cards (memoized InitiativeItems)
  // get stable objects. The lair action's own id is its combatant id.
  const lairActionEntries = useMemo(() => lairActions.map((l, i) => ({
    id: l.id,
    name: lairActionName(i, lairActions.length),
    initiative: l.initiative,
    isLairAction: true,
    notes: l.notes
  })), [lairActions]);

  const allCombatants = useMemo(
    () => [...(party || []), ...partyCompanions, ...enemies, ...lairActionEntries],
    [party, partyCompanions, enemies, lairActionEntries]
  );

  // If we have a manual order, use it (filtering out any removed combatants)
  // Then append any new combatants not yet in the order
  const fullOrderIds = useMemo(() => {
    const orderedIds = initiativeOrder.filter(id => allCombatants.some(c => c.id === id));
    const newCombatantIds = allCombatants.filter(c => !orderedIds.includes(c.id)).map(c => c.id);
    return [...orderedIds, ...newCombatantIds];
  }, [initiativeOrder, allCombatants]);

  const fullInitiativeList = useMemo(() => {
    const byId = new Map(allCombatants.map(c => [c.id, c]));
    return fullOrderIds.map(id => byId.get(id)).filter(Boolean);
  }, [fullOrderIds, allCombatants]);

  // The loaded encounter as the library knows it now (renames show up; a
  // deleted encounter keeps its stored name but loses the Edit link).
  const loadedEncounterInfo = useMemo(() => {
    if (!loadedEncounter) return null;
    const saved = savedEncounters.find(e => e.id === loadedEncounter.id);
    return { id: loadedEncounter.id, name: saved?.name || loadedEncounter.name, exists: !!saved };
  }, [loadedEncounter, savedEncounters]);

  const enemyIds = useMemo(() => new Set(enemies.map(e => e.id)), [enemies]);

  // Sort by initiative values (including lair action); ties broken by DEX —
  // see compareInitiative in app/utils/rules.js
  const sortByInitiative = () => {
    const sorted = [...allCombatants].sort(compareInitiative);
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
  // sync (the `activeIndex` derivation above trusts that pairing). Landing on
  // a combatant starts their turn: their reaction and legendary actions
  // refresh. Only Back passes `refresh = false` — rewinding isn't a new turn.
  const goToTurn = useCallback((index, refresh = true) => {
    const list = listRef.current;
    if (!list.length) return;
    const wrapped = ((index % list.length) + list.length) % list.length;
    const id = list[wrapped].id;
    setInterrupt(null);
    setTurn({ index: wrapped, id });
    setTurnReminder(null);
    if (!refresh) return;
    // Timed conditions: the outgoing combatant's turn ends, the landed-on
    // combatant's turn starts (helpers in ./conditions). The reminder is built
    // from the current snapshot; the setters re-apply the same pure step.
    const endingId = activeIndexRef.current >= 0 ? list[activeIndexRef.current]?.id : null;
    const affected = list.filter(c => !c.isCompanion && !c.isLairAction && (c.id === endingId || c.id === id));
    const expired = affected
      .map(c => ({ name: c.name, labels: applyTurnChange(c, endingId, id).expired }))
      .filter(e => e.labels.length);
    const landed = list[wrapped];
    const saves = landed.isCompanion || landed.isLairAction
      ? []
      : endOfTurnSaveConditions(applyTurnChange(landed, endingId, id).combatant);
    if (expired.length || saves.length) setTurnReminder({ id, expired, saves });
    const tick = (prev) => {
      if (!prev) return prev;
      const next = prev.map(x => applyTurnChange(x, endingId, id).combatant);
      return next.some((x, i) => x !== prev[i]) ? next : prev;
    };
    setParty(tick);
    setEnemies(tick);
    setTurnUsage({ id, ...FRESH_USAGE });
    setReactionsUsed(prev => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setEnemies(prev => {
      const next = prev.map(x => x.id === id && x.legendaryActionsUsed ? { ...x, legendaryActionsUsed: 0 } : x);
      return next.some((x, i) => x !== prev[i]) ? next : prev;
    });
  }, []);

  const clearReactions = useCallback(() => setReactionsUsed(prev => (Object.keys(prev).length ? {} : prev)), []);

  const startCombat = useCallback(() => {
    if (!listRef.current.length) return;
    setCombatActive(true);
    setRound(1);
    clearReactions();
    setEnemies(prev => {
      const next = prev.map(x => x.legendaryActionsUsed ? { ...x, legendaryActionsUsed: 0 } : x);
      return next.some((x, i) => x !== prev[i]) ? next : prev;
    });
    goToTurn(0);
  }, [goToTurn, clearReactions]);

  const endCombat = useCallback(() => {
    setCombatActive(false);
    setInterrupt(null);
    setRound(1);
    setTurn({ index: 0, id: null });
    setTurnUsage(null);
    setTurnReminder(null);
    // A drawer following the turn has nothing left to follow; pinned stays.
    setInspect(prev => (prev?.follow ? null : prev));
    clearReactions();
  }, [clearReactions]);

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
    goToTurn(i - 1, false);
  }, [goToTurn]);

  const openLegendary = useCallback(() => setShowLegendaryModal(true), []);
  const resumeTurn = useCallback(() => setInterrupt(null), []);
  const dismissReminder = useCallback(() => setTurnReminder(null), []);
  const startInterrupt = useCallback((creature) => {
    setInterrupt({ id: creature.id, name: creature.name, label: 'Legendary Action' });
    setShowLegendaryModal(false);
  }, []);

  const toggleReaction = useCallback((id) => setReactionsUsed(prev => {
    const next = { ...prev };
    if (next[id]) delete next[id];
    else next[id] = true;
    return next;
  }), []);

  // Edits the current combatant's turn usage; a stale entry (someone else's
  // turn) starts over from fresh.
  const updateTurnUsage = useCallback((changes) => {
    const id = listRef.current[activeIndexRef.current]?.id;
    if (!id) return;
    setTurnUsage(prev => ({ ...(prev?.id === id ? prev : { id, ...FRESH_USAGE }), ...changes }));
  }, []);

  // A monster ability's Use button spends the matching economy slot.
  const spendSlot = useCallback((slot) => {
    const id = listRef.current[activeIndexRef.current]?.id;
    if (!id) return;
    if (slot === 'reaction') setReactionsUsed(prev => (prev[id] ? prev : { ...prev, [id]: true }));
    else updateTurnUsage({ [slot]: true });
  }, [updateTurnUsage]);

  const setLegendaryUsed = useCallback((id, used) => setEnemies(prev => {
    const next = prev.map(x => x.id === id && (x.legendaryActionsUsed || 0) !== used ? { ...x, legendaryActionsUsed: used } : x);
    return next.some((x, i) => x !== prev[i]) ? next : prev;
  }), []);

  // Legendary creatures still in the fight get a pip row on the tracker.
  const legendaryCreatures = useMemo(
    () => enemies.filter(e => e.legendaryActions?.length > 0 && e.currentHp > 0),
    [enemies]
  );

  const openOrder = useCallback(() => setShowOrderModal(true), []);

  const interruptCreature = useMemo(
    () => (interrupt ? allCombatants.find(c => c.id === interrupt.id) || null : null),
    [interrupt, allCombatants]
  );

  const clearEncounter = () => {
    setEnemies([]);
    setLairActions([]);
    setLoadedEncounter(null);
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
  // The copy lands right after its original, in the card list and (when a
  // manual order exists) in the initiative order. Id is minted up front so the
  // updaters stay pure.
  const duplicateEnemyById = useCallback((id) => {
    const copyId = generateId('enemy');
    setEnemies(prev => {
      const i = prev.findIndex(x => x.id === id);
      if (i < 0 || prev.some(x => x.id === copyId)) return prev;
      return numberEnemies([...prev.slice(0, i + 1), duplicateEnemy(prev[i], copyId), ...prev.slice(i + 1)]);
    });
    setInitiativeOrder(prev => {
      const i = prev.indexOf(id);
      if (i < 0 || prev.includes(copyId)) return prev;
      return [...prev.slice(0, i + 1), copyId, ...prev.slice(i + 1)];
    });
  }, []);
  const addEnemy = useCallback((e) => setEnemies(prev => numberEnemies([...prev, e])), []);
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

  const updateLair = useCallback((id, changes) => setLairActions(prev => {
    const next = prev.map(l => l.id === id ? { ...l, ...changes } : l);
    return next.some((l, i) => l !== prev[i]) ? next : prev;
  }), []);

  const updateInitiative = useCallback((id, newInit) => {
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
    updateLair(id, { initiative: newInit });
  }, [updateCompanion, updateLair]);

  const updateCompanionHp = useCallback((id, hp) => updateCompanion(id, { currentHp: hp }), [updateCompanion]);
  // The drawer edits a whole (derived) companion object; only HP fields go
  // back to the owner's record — ownerName / composite id must not.
  const updateCompanionVitals = useCallback((c) => updateCompanion(c.id, { currentHp: c.currentHp, tempHp: c.tempHp || 0 }), [updateCompanion]);

  // Detail drawer openers (all stable — they're props on memoized cards/rows)
  const inspectCombatant = useCallback((id) => setInspect({ id, follow: false }), []);
  const inspectCurrent = useCallback(() => setInspect({ id: null, follow: true }), []);
  const inspectFromOrder = useCallback((id) => { setShowOrderModal(false); setInspect({ id, follow: false }); }, []);
  const closeInspect = useCallback(() => setInspect(null), []);
  // Pin = lock onto whoever is current right now; Follow = track the turn.
  const toggleInspectFollow = useCallback(() => setInspect(prev => {
    if (!prev) return prev;
    if (!prev.follow) return { id: null, follow: true };
    const current = listRef.current[activeIndexRef.current];
    return current ? { id: current.id, follow: false } : prev;
  }), []);
  const updateLairNotes = useCallback((id, notes) => updateLair(id, { notes }), [updateLair]);
  const removeLairAction = useCallback((id) => setLairActions(prev => prev.filter(l => l.id !== id)), []);

  // Who the detail drawer shows: the current combatant while following,
  // else the pinned id (gone from the fight → the drawer hides).
  const inspected = useMemo(() => {
    if (!inspect) return null;
    if (inspect.follow) return currentCombatant;
    return allCombatants.find(c => c.id === inspect.id) || null;
  }, [inspect, currentCombatant, allCombatants]);
  const inspectedKind = kindOf(inspected);
  const inspectedUpdate = inspectedKind === 'party' ? updatePartyMember
    : inspectedKind === 'enemy' ? updateEnemy
    : inspectedKind === 'companion' ? updateCompanionVitals
    : null;

  // Restore the viewer's tab after mount (localStorage is unavailable during
  // SSR and can throw in private windows). 'cards' is the pre-tabs value.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_MODE_KEY);
      if (saved === 'enemies' || saved === 'table') setViewMode(saved);
    } catch { /* storage blocked — keep the default */ }
  }, []);
  const changeViewMode = useCallback((mode) => {
    setViewMode(mode);
    try { localStorage.setItem(VIEW_MODE_KEY, mode); } catch { /* storage blocked */ }
  }, []);
  const isTable = viewMode === 'table';
  const showParty = viewMode !== 'enemies';
  const showEnemies = viewMode !== 'party';
  const viewTabs = [
    { id: 'party', label: 'Party & Allies', icon: <Icons.Shield />, count: party?.length, active: 'text-emerald-400 border-emerald-500' },
    { id: 'enemies', label: 'Enemies', icon: <Icons.Skull />, count: enemies.length, active: 'text-red-400 border-red-500' },
    { id: 'table', label: 'Table', icon: <Icons.Filter />, active: 'text-amber-400 border-amber-500' },
  ];

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
              <button onClick={openOrder} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-800/50 hover:bg-amber-700/50 text-amber-300 text-sm"><Icons.GripVertical />Manage Order</button>
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
              onOpenOrder={openOrder}
              legendaryCreatures={legendaryCreatures}
              onSetLegendaryUsed={setLegendaryUsed}
              turnUsage={turnUsage?.id === currentCombatant?.id ? turnUsage : null}
              reactionsUsed={reactionsUsed}
              onUpdateTurnUsage={updateTurnUsage}
              onToggleReaction={toggleReaction}
              onSpendSlot={spendSlot}
              onUpdateEnemy={updateEnemy}
              onUpdateParty={updatePartyMember}
              templates={templates || EMPTY_TEMPLATES}
              interrupt={interrupt}
              interruptCreature={interruptCreature}
              onStart={startCombat}
              onEndCombat={endCombat}
              onNextTurn={nextTurn}
              onPrevTurn={prevTurn}
              onOpenLegendary={openLegendary}
              onResume={resumeTurn}
              reminder={turnReminder?.id === currentCombatant?.id ? turnReminder : null}
              onDismissReminder={dismissReminder}
              onInspect={inspectCombatant}
              onInspectCurrent={inspectCurrent}
            />
          </div>

          {/* Combatant tabs: Party & Allies cards | Enemies cards | Table
              (both tables stacked full width). Choice is per-viewer
              localStorage. */}
          <div>
          <div role="tablist" aria-label="Combatant view" className="flex gap-1 border-b border-stone-800 mb-4">
            {viewTabs.map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={viewMode === tab.id}
                onClick={() => changeViewMode(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 -mb-px border-b-2 text-sm font-semibold transition-colors ${viewMode === tab.id ? tab.active : 'border-transparent text-stone-500 hover:text-stone-300'}`}
              >
                {tab.icon}{tab.label}
                {tab.count > 0 && <span className="text-xs font-mono px-1.5 rounded bg-stone-800 text-stone-400">{tab.count}</span>}
              </button>
            ))}
          </div>
          <div className="space-y-6">
          {showParty && (
          <section aria-label="Party & Allies" className="space-y-4">
            <div className="flex items-center justify-between">
              {isTable ? <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2"><Icons.Shield />Party & Allies</h2> : <span />}
              <div className="flex gap-2">
                <button onClick={reloadParty} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-700/50 hover:bg-stone-600/50 text-xs"><Icons.Refresh />Reload</button>
                <button onClick={() => setParty(prev => (prev || []).map(p => ({ ...p, resources: (p.resources || []).map(r => ({ ...r, current: r.max })) })))} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-700/50 hover:bg-stone-600/50 text-xs"><Icons.Refresh />Rest</button>
                <button onClick={() => setShowAddParty(true)} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-800/50 hover:bg-emerald-700/50 text-emerald-300 text-sm"><Icons.Plus />Add</button>
              </div>
            </div>
            {!party ? (
              <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg animate-pulse">Loading party...</div>
            ) : party.length > 0 ? (
              isTable ? (
                <CombatantTable combatants={party} isEnemy={false} onUpdate={updatePartyMember} onRemove={removePartyMember} templates={templates || EMPTY_TEMPLATES} />
              ) : (
              // Full-width tab: up to three card columns; rows stretch so
              // side-by-side cards line up (`stretch` pins their stat bars).
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {party.map(m => <CharacterCard key={m.id} character={m} isEnemy={false} onUpdate={updatePartyMember} onRemove={removePartyMember} onInspect={inspectCombatant} showResources templates={templates || EMPTY_TEMPLATES} stretch />)}
              </div>
              )
            ) : (
              <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg">No party members yet.</div>
            )}
          </section>
          )}

          {showEnemies && (
          <section aria-label="Enemies" className="space-y-4">
            {isTable && <h2 className="text-lg font-bold text-red-400 flex items-center gap-2"><Icons.Skull />Enemies</h2>}
            {/* Encounter bar: which saved encounter is loaded (the name links
                to its editor) + Load Encounter. */}
            <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl border border-stone-800 bg-stone-900/50 px-3 py-2">
              <div className="min-w-0" data-testid="encounter-name">
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Encounter</div>
                {loadedEncounterInfo?.exists ? (
                  <Link
                    href={`/encounters?edit=${encodeURIComponent(loadedEncounterInfo.id)}&from=combat`}
                    title="Edit this encounter"
                    className="block font-semibold truncate max-w-[320px] text-red-300 hover:text-red-200 hover:underline underline-offset-2"
                  >
                    {loadedEncounterInfo.name}
                  </Link>
                ) : (
                  <div className={`font-semibold truncate max-w-[320px] ${loadedEncounterInfo ? 'text-red-300' : 'text-stone-500 italic'}`}>
                    {loadedEncounterInfo?.name || (enemies.length || lairActions.length ? 'Unsaved encounter' : 'None loaded')}
                  </div>
                )}
              </div>
              <button onClick={() => setShowLoadEncounter(true)} className={BAR_BUTTON.amber}>
                <Icons.FolderOpen />Load Encounter
              </button>
            </div>
            {/* Actions bar: changes to the current fight. */}
            <div role="toolbar" aria-label="Encounter actions" className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                {(enemies.length > 0 || lairActions.length > 0) && (
                  <button onClick={clearEncounter} title="Clear encounter" aria-label="Clear encounter" className={BAR_BUTTON.danger}>
                    <Icons.Trash />Clear
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setLairActions(prev => [...prev, newLairAction()])} className={BAR_BUTTON.purple}>
                  <Icons.Sparkles />Add Lair Action
                </button>
                <button onClick={() => setShowAddEnemy(true)} className={BAR_BUTTON.red}><Icons.Plus />Add Monster</button>
              </div>
            </div>
            {isTable
              ? enemies.length > 0 && <CombatantTable combatants={enemies} isEnemy onUpdate={updateEnemy} onRemove={removeEnemy} templates={templates || EMPTY_TEMPLATES} />
              : enemies.length > 0 && (
                // items-start: enemy cards must NOT stretch (frontend-patterns §2.5)
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
                  {enemies.map(e => <CharacterCard key={e.id} character={e} isEnemy={true} onUpdate={updateEnemy} onRemove={removeEnemy} onDuplicate={duplicateEnemyById} onInspect={inspectCombatant} />)}
                </div>
              )}
            {/* Lair actions also live here (not only in Manage Order), so
                adding one visibly lands somewhere: initiative, notes, remove. */}
            {lairActionEntries.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 items-start">
                {lairActionEntries.map(entry => (
                  <InitiativeItem
                    key={entry.id}
                    character={entry}
                    isLairAction
                    onUpdateInitiative={updateInitiative}
                    onUpdateLairNotes={updateLairNotes}
                    onRemoveLairAction={removeLairAction}
                  />
                ))}
              </div>
            )}
            {!enemies.length && !lairActions.length && <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg">No enemies yet. <Link href="/encounters" className="text-amber-500 hover:text-amber-400">Create encounters</Link> to quickly add groups.</div>}
          </section>
          )}
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
        round={round}
        reactionsUsed={reactionsUsed}
        onToggleReaction={toggleReaction}
        onInspect={inspectFromOrder}
      />

      <CombatantDrawer
        key={inspected?.id || 'none'}
        combatant={inspected}
        kind={inspectedKind}
        isCurrent={!!inspected && inspected.id === currentCombatant?.id}
        following={!!inspect?.follow}
        canFollow={combatActive}
        onToggleFollow={toggleInspectFollow}
        onClose={closeInspect}
        onUpdate={inspectedUpdate}
        onSetLegendaryUsed={setLegendaryUsed}
        templates={templates || EMPTY_TEMPLATES}
      />

      <LegendaryActionModal
        isOpen={showLegendaryModal}
        onClose={() => setShowLegendaryModal(false)}
        creatures={enemies}
        onSelect={startInterrupt}
        onSetLegendaryUsed={setLegendaryUsed}
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
                {enemies.length > 0 ? 'Add its monsters to the current fight, or replace the current enemies.' : 'Select an encounter to load.'}
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {savedEncounters.map(encounter => {
                const monsterCount = encounter.monsters.reduce((sum, m) => sum + m.quantity, 0);
                const totalXP = encounter.monsters.reduce((sum, m) => {
                  const template = (templates || []).find(t => t.id === m.templateId);
                  return sum + ((template?.xp || 0) * m.quantity);
                }, 0);
                const lairCount = readLairActions(encounter).length;
                
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
                        {lairCount > 0 && (
                          <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded">
                            {lairCount > 1 ? `${lairCount} lair actions` : 'Lair action'}
                          </span>
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
              {enemies.length > 0 && (
                <button
                  onClick={() => encounterToLoad && loadEncounter(encounterToLoad, 'replace')}
                  disabled={!encounterToLoad}
                  title="Remove the current enemies and lair actions, then load this encounter"
                  className={`flex-1 py-2 rounded-lg font-medium ${
                    encounterToLoad
                      ? 'bg-red-800/70 hover:bg-red-700/70 text-red-100'
                      : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  Replace Enemies
                </button>
              )}
              <button
                onClick={() => encounterToLoad && loadEncounter(encounterToLoad, 'add')}
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
