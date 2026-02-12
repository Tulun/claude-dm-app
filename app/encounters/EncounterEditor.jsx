'use client';

import { useState, useMemo } from 'react';
import Icons from '../components/Icons';
import { crToNumber } from './constants';

// CR values for filtering
const CR_OPTIONS = [
  { value: '0', label: '0' },
  { value: '1/8', label: '⅛' },
  { value: '1/4', label: '¼' },
  { value: '1/2', label: '½' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: '6', label: '6' },
  { value: '7', label: '7' },
  { value: '8', label: '8' },
  { value: '9', label: '9' },
  { value: '10', label: '10' },
  { value: '11', label: '11' },
  { value: '12', label: '12' },
  { value: '13', label: '13' },
  { value: '14', label: '14' },
  { value: '15', label: '15' },
  { value: '16', label: '16' },
  { value: '17', label: '17' },
  { value: '18', label: '18' },
  { value: '19', label: '19' },
  { value: '20', label: '20' },
  { value: '21', label: '21' },
  { value: '22', label: '22' },
  { value: '23', label: '23' },
  { value: '24', label: '24' },
  { value: '25', label: '25' },
  { value: '30', label: '30' },
];

const SIZE_OPTIONS = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];

const CREATURE_TYPE_OPTIONS = [
  'Aberration', 'Beast', 'Celestial', 'Construct', 'Dragon', 'Elemental',
  'Fey', 'Fiend', 'Giant', 'Humanoid', 'Monstrosity', 'Ooze', 'Plant', 'Undead'
];

// Multi-select dropdown component
const FilterDropdown = ({ label, options, selected, onToggle, onClear, colorClass = 'purple' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const colors = {
    purple: { bg: 'bg-purple-700', badge: 'bg-purple-900', button: 'bg-purple-600' },
    blue: { bg: 'bg-blue-700', badge: 'bg-blue-900', button: 'bg-blue-600' },
    green: { bg: 'bg-emerald-700', badge: 'bg-emerald-900', button: 'bg-emerald-600' },
  };
  const c = colors[colorClass] || colors.purple;

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${selected.length > 0 ? c.bg : 'bg-stone-800 hover:bg-stone-700'}`}
      >
        <span>{label}</span>
        {selected.length > 0 && (
          <span className={`${c.badge} px-1.5 py-0.5 rounded text-xs`}>{selected.length}</span>
        )}
        <Icons.ChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-stone-800 border border-stone-600 rounded-lg shadow-xl z-20 min-w-[200px] max-w-[280px]">
            <div className="p-2 border-b border-stone-700 flex justify-between items-center">
              <span className="text-xs text-stone-400">Select {label}</span>
              {selected.length > 0 && (
                <button onClick={() => { onClear(); }} className="text-xs text-red-400 hover:text-red-300">Clear</button>
              )}
            </div>
            <div className="p-2 flex flex-wrap gap-1 max-h-[200px] overflow-y-auto">
              {options.map(opt => {
                const value = typeof opt === 'object' ? opt.value : opt;
                const displayLabel = typeof opt === 'object' ? opt.label : opt;
                return (
                  <button
                    key={value}
                    onClick={() => onToggle(value)}
                    className={`px-2 py-1 rounded text-xs ${selected.includes(value) ? c.button : 'bg-stone-700 hover:bg-stone-600'}`}
                  >
                    {displayLabel}
                  </button>
                );
              })}
            </div>
            <div className="p-2 border-t border-stone-700">
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-full text-xs text-stone-400 hover:text-stone-200 py-1"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

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
  const [selectedCRs, setSelectedCRs] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedCreatureTypes, setSelectedCreatureTypes] = useState([]);

  // Get available creature types from templates
  const availableCreatureTypes = useMemo(() => {
    const types = new Set();
    (templates || []).forEach(t => {
      if (t.creatureType) {
        const baseType = t.creatureType.split(' ')[0].replace(/[()]/g, '');
        types.add(baseType);
      }
    });
    return CREATURE_TYPE_OPTIONS.filter(ct => types.has(ct));
  }, [templates]);

  const toggleFilter = (setter) => (value) => {
    setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const filteredTemplates = useMemo(() => {
    return templates
      .filter(t => !t.isNpc)
      .filter(t => selectedCRs.length === 0 || selectedCRs.includes(String(t.cr)))
      .filter(t => selectedSizes.length === 0 || selectedSizes.includes(t.size))
      .filter(t => {
        if (selectedCreatureTypes.length === 0) return true;
        if (!t.creatureType) return false;
        return selectedCreatureTypes.some(ct => t.creatureType.startsWith(ct) || t.creatureType.includes(ct));
      })
      .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => crToNumber(a.cr) - crToNumber(b.cr) || a.name.localeCompare(b.name));
  }, [templates, selectedCRs, selectedSizes, selectedCreatureTypes, searchTerm]);

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
    setSelectedCRs([]);
    setSelectedSizes([]);
    setSelectedCreatureTypes([]);
  };

  const cancelAddMonsters = () => {
    setSelectedMonsters({});
    setShowAddMonster(false);
    setSearchTerm('');
    setSelectedCRs([]);
    setSelectedSizes([]);
    setSelectedCreatureTypes([]);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCRs([]);
    setSelectedSizes([]);
    setSelectedCreatureTypes([]);
  };

  const hasFilters = searchTerm || selectedCRs.length > 0 || selectedSizes.length > 0 || selectedCreatureTypes.length > 0;

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
          <div className="bg-stone-900 border border-stone-700 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
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
              
              {/* Search */}
              <div className="mt-3 relative">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-stone-800 rounded-lg px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                  autoFocus
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <FilterDropdown
                  label="CR"
                  options={CR_OPTIONS}
                  selected={selectedCRs}
                  onToggle={toggleFilter(setSelectedCRs)}
                  onClear={() => setSelectedCRs([])}
                  colorClass="purple"
                />
                <FilterDropdown
                  label="Size"
                  options={SIZE_OPTIONS}
                  selected={selectedSizes}
                  onToggle={toggleFilter(setSelectedSizes)}
                  onClear={() => setSelectedSizes([])}
                  colorClass="blue"
                />
                <FilterDropdown
                  label="Type"
                  options={availableCreatureTypes}
                  selected={selectedCreatureTypes}
                  onToggle={toggleFilter(setSelectedCreatureTypes)}
                  onClear={() => setSelectedCreatureTypes([])}
                  colorClass="green"
                />
                {hasFilters && (
                  <button 
                    onClick={clearAllFilters}
                    className="px-2 py-1 rounded text-xs text-red-400 hover:text-red-300 hover:bg-red-900/30"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Active Filter Tags */}
              {hasFilters && (
                <div className="mt-2 flex flex-wrap gap-1 items-center">
                  {selectedCRs.map(cr => (
                    <span key={`cr-${cr}`} className="px-2 py-0.5 bg-purple-900/50 text-purple-300 rounded text-xs flex items-center gap-1">
                      CR {cr}
                      <button onClick={() => toggleFilter(setSelectedCRs)(cr)} className="hover:text-white">×</button>
                    </span>
                  ))}
                  {selectedSizes.map(size => (
                    <span key={`size-${size}`} className="px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded text-xs flex items-center gap-1">
                      {size}
                      <button onClick={() => toggleFilter(setSelectedSizes)(size)} className="hover:text-white">×</button>
                    </span>
                  ))}
                  {selectedCreatureTypes.map(ct => (
                    <span key={`ct-${ct}`} className="px-2 py-0.5 bg-emerald-900/50 text-emerald-300 rounded text-xs flex items-center gap-1">
                      {ct}
                      <button onClick={() => toggleFilter(setSelectedCreatureTypes)(ct)} className="hover:text-white">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Results Count */}
              <div className="text-xs text-stone-500 mb-2">
                {filteredTemplates.length} {filteredTemplates.length === 1 ? 'result' : 'results'}
                {hasFilters && ' (filtered)'}
              </div>
              
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
                        <div className="text-xs text-stone-500 truncate">
                          {template.size} {template.creatureType}
                        </div>
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
