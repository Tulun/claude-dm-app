'use client';

import { useState, useEffect, useRef } from 'react';
import Icons from '../components/Icons';
import { crToNumber } from './constants';

const EncounterEditor = ({
  encounter,
  templates,
  onUpdate,
  onClose,
  calculateEncounterStats,
}) => {
  const [showAddMonster, setShowAddMonster] = useState(false);
  const [selectedMonsters, setSelectedMonsters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [crFilter, setCrFilter] = useState('all');
  const [showCrDropdown, setShowCrDropdown] = useState(false);
  const crDropdownRef = useRef(null);

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

  const availableCRs = [...new Set(templates.map(t => t.cr))].sort((a, b) => crToNumber(a) - crToNumber(b));

  const filteredTemplates = templates
    .filter(t => !t.isNpc)
    .filter(t => crFilter === 'all' || t.cr === crFilter)
    .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => crToNumber(a.cr) - crToNumber(b.cr) || a.name.localeCompare(b.name));

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
    setSelectedMonsters(prev => ({
      ...prev,
      [templateId]: Math.max(1, (prev[templateId] || 0) + delta)
    }));
  };

  const confirmAddMonsters = () => {
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

    onUpdate({
      ...encounter,
      monsters: [...encounter.monsters, ...newMonsters],
    });
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

  const updateMonster = (monsterId, changes) => {
    onUpdate({
      ...encounter,
      monsters: encounter.monsters.map(m => 
        m.id === monsterId ? { ...m, ...changes } : m
      ),
    });
  };

  const removeMonster = (monsterId) => {
    onUpdate({
      ...encounter,
      monsters: encounter.monsters.filter(m => m.id !== monsterId),
    });
  };

  const selectedCount = Object.values(selectedMonsters).reduce((sum, qty) => sum + qty, 0);
  const selectedTemplateCount = Object.keys(selectedMonsters).length;
  const stats = calculateEncounterStats(encounter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-stone-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur border-b border-stone-700/50 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={onClose}
              className="flex items-center gap-1 text-stone-400 hover:text-stone-200 pr-4 border-r border-stone-700"
            >
              <Icons.ChevronDown className="rotate-90" /> Back
            </button>
            <input
              type="text"
              value={encounter.name}
              onChange={(e) => onUpdate({ ...encounter, name: e.target.value })}
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

          {encounter.monsters.length === 0 ? (
            <div className="text-center py-8 text-stone-500 border border-dashed border-stone-700 rounded-lg">
              No monsters yet. Click "Add Monster" to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {encounter.monsters.map(monster => {
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
                      >−</button>
                      <span className="w-8 text-center font-mono">{monster.quantity}</span>
                      <button
                        onClick={() => updateMonster(monster.id, { quantity: monster.quantity + 1 })}
                        className="w-7 h-7 rounded bg-stone-700 hover:bg-stone-600 flex items-center justify-center"
                      >+</button>
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

      {/* Add Monster Modal */}
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
                            <span className="text-xs bg-green-900/50 text-green-300 px-1.5 py-0.5 rounded">✓</span>
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
                          >−</button>
                          <span className="w-8 text-center font-mono text-sm">{quantity}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); updateSelectedQuantity(template.id, 1); }}
                            className="w-6 h-6 rounded bg-stone-700 hover:bg-stone-600 flex items-center justify-center text-sm"
                          >+</button>
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
};

export default EncounterEditor;
