'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Icons from '../components/Icons';
import { defaultEnemyTemplates } from '../components/defaultData';

// CR sorting helper
const crToNumber = (cr) => {
  if (cr === '0') return 0;
  if (cr === '1/8') return 0.125;
  if (cr === '1/4') return 0.25;
  if (cr === '1/2') return 0.5;
  return parseFloat(cr) || 0;
};

export default function EncountersPage() {
  const [encounters, setEncounters] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [encountersLoaded, setEncountersLoaded] = useState(false);
  const [editingEncounter, setEditingEncounter] = useState(null); // null = list view, object = editing
  const [showAddMonster, setShowAddMonster] = useState(false);
  const [selectedMonsters, setSelectedMonsters] = useState({}); // { templateId: quantity }
  const [searchTerm, setSearchTerm] = useState('');
  const [crFilter, setCrFilter] = useState('all');
  const [showCrDropdown, setShowCrDropdown] = useState(false);
  const crDropdownRef = useRef(null);

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
      // Set encountersLoaded after a tick to ensure state has updated
      setTimeout(() => setEncountersLoaded(true), 0);
    };
    loadData();
  }, []);

  // Auto-save encounters (only after initial load complete)
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

  // Close CR dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (crDropdownRef.current && !crDropdownRef.current.contains(e.target)) {
        setShowCrDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get unique CRs from templates
  const availableCRs = [...new Set(templates.map(t => t.cr))].sort((a, b) => crToNumber(a) - crToNumber(b));

  // Filter templates
  const filteredTemplates = templates
    .filter(t => !t.isNpc)
    .filter(t => crFilter === 'all' || t.cr === crFilter)
    .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => crToNumber(a.cr) - crToNumber(b.cr) || a.name.localeCompare(b.name));

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

  const deleteEncounter = (id) => {
    setEncounters(prev => prev.filter(e => e.id !== id));
  };

  const updateEncounter = (updated) => {
    setEncounters(prev => prev.map(e => e.id === updated.id ? updated : e));
    setEditingEncounter(updated);
  };

  const toggleMonsterSelection = (template) => {
    setSelectedMonsters(prev => {
      const newSelection = { ...prev };
      if (newSelection[template.id]) {
        delete newSelection[template.id];
      } else {
        newSelection[template.id] = 1;
      }
      return newSelection;
    });
  };

  const updateSelectedQuantity = (templateId, delta) => {
    setSelectedMonsters(prev => {
      const current = prev[templateId] || 0;
      const newQty = Math.max(1, current + delta);
      return { ...prev, [templateId]: newQty };
    });
  };

  const confirmAddMonsters = () => {
    if (!editingEncounter) return;
    
    const newMonsters = Object.entries(selectedMonsters).map(([templateId, quantity]) => {
      const template = templates.find(t => t.id === templateId);
      if (!template) return null;
      return {
        id: `${template.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        templateId: template.id,
        name: template.name,
        customName: '',
        quantity,
      };
    }).filter(Boolean);

    const updated = {
      ...editingEncounter,
      monsters: [...editingEncounter.monsters, ...newMonsters],
    };
    updateEncounter(updated);
    setSelectedMonsters({});
    setShowAddMonster(false);
    setSearchTerm('');
    setCrFilter('all');
  };

  const cancelAddMonsters = () => {
    setSelectedMonsters({});
    setShowAddMonster(false);
    setSearchTerm('');
    setCrFilter('all');
  };

  const selectedCount = Object.values(selectedMonsters).reduce((sum, qty) => sum + qty, 0);
  const selectedTemplateCount = Object.keys(selectedMonsters).length;

  const updateMonster = (monsterId, changes) => {
    if (!editingEncounter) return;
    const updated = {
      ...editingEncounter,
      monsters: editingEncounter.monsters.map(m => 
        m.id === monsterId ? { ...m, ...changes } : m
      ),
    };
    updateEncounter(updated);
  };

  const removeMonster = (monsterId) => {
    if (!editingEncounter) return;
    const updated = {
      ...editingEncounter,
      monsters: editingEncounter.monsters.filter(m => m.id !== monsterId),
    };
    updateEncounter(updated);
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

  // Calculate total CR/XP for an encounter
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

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-stone-100 flex items-center justify-center">
        <div className="text-stone-400">Loading...</div>
      </div>
    );
  }

  // Encounter Editor View
  if (editingEncounter) {
    const stats = calculateEncounterStats(editingEncounter);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-stone-100">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur border-b border-stone-700/50 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setEditingEncounter(null)}
                className="flex items-center gap-1 text-stone-400 hover:text-stone-200 pr-4 border-r border-stone-700"
              >
                <Icons.ChevronDown className="rotate-90" /> Back
              </button>
              <input
                type="text"
                value={editingEncounter.name}
                onChange={(e) => updateEncounter({ ...editingEncounter, name: e.target.value })}
                className="bg-transparent text-xl font-bold text-amber-400 border-b border-transparent hover:border-stone-600 focus:border-amber-500 focus:outline-none px-1"
              />
            </div>
            <div className="flex items-center gap-4 text-sm text-stone-400">
              <span>{stats.monsterCount} creatures</span>
              <span className="text-amber-400">{stats.totalXP.toLocaleString()} XP</span>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-4 space-y-4">
          {/* Monster List */}
          <div className="bg-stone-900/50 border border-stone-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
                <Icons.Skull /> Monsters
              </h2>
              <button
                onClick={() => setShowAddMonster(true)}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-800/50 hover:bg-red-700/50 text-red-300 text-sm"
              >
                <Icons.Plus /> Add Monster
              </button>
            </div>

            {editingEncounter.monsters.length === 0 ? (
              <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg">
                No monsters yet. Click "Add Monster" to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {editingEncounter.monsters.map(monster => {
                  const template = templates.find(t => t.id === monster.templateId);
                  return (
                    <div key={monster.id} className="bg-stone-800/50 rounded-lg p-3 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-red-900/50 text-red-300 px-1.5 py-0.5 rounded">
                            CR {template?.cr || '?'}
                          </span>
                          <span className="font-medium">{monster.name}</span>
                        </div>
                        <input
                          type="text"
                          value={monster.customName}
                          onChange={(e) => updateMonster(monster.id, { customName: e.target.value })}
                          placeholder="Custom name (optional)"
                          className="mt-1 w-full bg-stone-700/50 rounded px-2 py-1 text-sm placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateMonster(monster.id, { quantity: Math.max(1, monster.quantity - 1) })}
                          className="w-7 h-7 rounded bg-stone-700 hover:bg-stone-600 flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-mono">{monster.quantity}</span>
                        <button
                          onClick={() => updateMonster(monster.id, { quantity: monster.quantity + 1 })}
                          className="w-7 h-7 rounded bg-stone-700 hover:bg-stone-600 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeMonster(monster.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* Add Monster Modal - Multi-select */}
        {showAddMonster && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={cancelAddMonsters}>
            <div className="bg-stone-900 border border-stone-700 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-stone-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
                    <Icons.Skull /> Add Monsters
                  </h2>
                  {selectedTemplateCount > 0 && (
                    <span className="text-sm bg-red-900/50 text-red-300 px-2 py-1 rounded">
                      {selectedCount} creature{selectedCount !== 1 ? 's' : ''} selected
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    placeholder="Search monsters..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-stone-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                    autoFocus
                  />
                  <div className="relative" ref={crDropdownRef}>
                    <button
                      onClick={() => setShowCrDropdown(!showCrDropdown)}
                      className="bg-stone-800 rounded-lg px-3 py-2 text-sm flex items-center gap-2 min-w-[100px]"
                    >
                      CR: {crFilter === 'all' ? 'All' : crFilter}
                      <Icons.ChevronDown />
                    </button>
                    {showCrDropdown && (
                      <div className="absolute top-full mt-1 right-0 bg-stone-800 border border-stone-600 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto min-w-[100px]">
                        <button
                          onClick={() => { setCrFilter('all'); setShowCrDropdown(false); }}
                          className={`w-full px-3 py-1.5 text-left text-sm hover:bg-stone-700 ${crFilter === 'all' ? 'text-amber-400' : ''}`}
                        >
                          All
                        </button>
                        {availableCRs.map(cr => (
                          <button
                            key={cr}
                            onClick={() => { setCrFilter(cr); setShowCrDropdown(false); }}
                            className={`w-full px-3 py-1.5 text-left text-sm hover:bg-stone-700 ${crFilter === cr ? 'text-amber-400' : ''}`}
                          >
                            CR {cr}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredTemplates.map(template => {
                    const isSelected = selectedMonsters[template.id] !== undefined;
                    const quantity = selectedMonsters[template.id] || 0;
                    
                    return (
                      <div
                        key={template.id}
                        className={`relative border rounded-lg p-2 transition-colors ${
                          isSelected 
                            ? 'bg-red-900/30 border-red-500' 
                            : 'bg-stone-800/50 border-stone-700 hover:border-stone-600'
                        }`}
                      >
                        <button
                          onClick={() => toggleMonsterSelection(template)}
                          className="w-full text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-red-900/50 text-red-300 px-1.5 py-0.5 rounded">
                              CR {template.cr}
                            </span>
                            {isSelected && (
                              <span className="text-xs bg-green-900/50 text-green-300 px-1.5 py-0.5 rounded">
                                ✓
                              </span>
                            )}
                          </div>
                          <div className="font-medium text-sm mt-1 truncate">{template.name}</div>
                          <div className="text-xs text-stone-500 truncate">{template.type}</div>
                        </button>
                        
                        {isSelected && (
                          <div className="flex items-center justify-center gap-1 mt-2 pt-2 border-t border-stone-700">
                            <button
                              onClick={(e) => { e.stopPropagation(); updateSelectedQuantity(template.id, -1); }}
                              className="w-6 h-6 rounded bg-stone-700 hover:bg-stone-600 flex items-center justify-center text-sm"
                            >
                              −
                            </button>
                            <span className="w-8 text-center font-mono text-sm">{quantity}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); updateSelectedQuantity(template.id, 1); }}
                              className="w-6 h-6 rounded bg-stone-700 hover:bg-stone-600 flex items-center justify-center text-sm"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {filteredTemplates.length === 0 && (
                  <div className="text-center py-8 text-stone-500">No monsters found.</div>
                )}
              </div>
              <div className="p-4 border-t border-stone-700 flex gap-2">
                <button
                  onClick={cancelAddMonsters}
                  className="flex-1 py-2 rounded-lg bg-stone-700 hover:bg-stone-600"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAddMonsters}
                  disabled={selectedTemplateCount === 0}
                  className={`flex-1 py-2 rounded-lg font-medium ${
                    selectedTemplateCount > 0
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  Add {selectedCount > 0 ? `${selectedCount} Creature${selectedCount !== 1 ? 's' : ''}` : 'Monsters'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Encounter List View
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-stone-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur border-b border-stone-700/50 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
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

      <main className="max-w-4xl mx-auto p-4">
        <div className="bg-stone-900/50 border border-stone-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-amber-400">Saved Encounters</h2>
            <button
              onClick={createNewEncounter}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium"
            >
              <Icons.Plus /> New Encounter
            </button>
          </div>

          {encounters.length === 0 ? (
            <div className="text-center py-12 text-stone-500 border border-dashed border-stone-700 rounded-lg">
              <Icons.Scroll className="mx-auto mb-3 w-12 h-12 opacity-50" />
              <p>No saved encounters yet.</p>
              <p className="text-sm mt-1">Create an encounter to pre-plan your combats!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {encounters.map(encounter => {
                const stats = calculateEncounterStats(encounter);
                return (
                  <div
                    key={encounter.id}
                    className="bg-stone-800/50 border border-stone-700/50 rounded-lg p-4 hover:border-stone-600 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{encounter.name}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-stone-400">
                          <span>{stats.monsterCount} creatures</span>
                          <span className="text-amber-400">{stats.totalXP.toLocaleString()} XP</span>
                        </div>
                        {encounter.monsters.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {encounter.monsters.slice(0, 5).map(m => (
                              <span key={m.id} className="text-xs bg-stone-700/50 px-2 py-0.5 rounded">
                                {m.quantity > 1 && `${m.quantity}x `}{m.customName || m.name}
                              </span>
                            ))}
                            {encounter.monsters.length > 5 && (
                              <span className="text-xs text-stone-500">+{encounter.monsters.length - 5} more</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingEncounter(encounter)}
                          className="p-2 rounded hover:bg-stone-700 text-amber-400"
                          title="Edit"
                        >
                          <Icons.Edit />
                        </button>
                        <button
                          onClick={() => duplicateEncounter(encounter)}
                          className="p-2 rounded hover:bg-stone-700 text-stone-400"
                          title="Duplicate"
                        >
                          <Icons.Copy />
                        </button>
                        <button
                          onClick={() => deleteEncounter(encounter.id)}
                          className="p-2 rounded hover:bg-stone-700 text-red-400"
                          title="Delete"
                        >
                          <Icons.Trash />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
