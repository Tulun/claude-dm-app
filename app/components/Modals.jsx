'use client';

import { useState, useMemo } from 'react';
import Icons from './Icons';

// Common CR values for filtering
const CR_OPTIONS = [
  { value: '0', label: 'CR 0' },
  { value: '1/8', label: 'CR 1/8' },
  { value: '1/4', label: 'CR 1/4' },
  { value: '1/2', label: 'CR 1/2' },
  { value: '1', label: 'CR 1' },
  { value: '2', label: 'CR 2' },
  { value: '3', label: 'CR 3' },
  { value: '4', label: 'CR 4' },
  { value: '5', label: 'CR 5' },
  { value: '6', label: 'CR 6' },
  { value: '7', label: 'CR 7' },
  { value: '8', label: 'CR 8' },
  { value: '9', label: 'CR 9' },
  { value: '10', label: 'CR 10' },
  { value: '11+', label: 'CR 11+' },
];

export const AddEnemyModal = ({ isOpen, onClose, onAdd, templates }) => {
  const [selectedMonsters, setSelectedMonsters] = useState({}); // { templateId: quantity }
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCRs, setSelectedCRs] = useState([]);
  const [showCRDropdown, setShowCRDropdown] = useState(false);

  const matchesCR = (templateCR) => {
    if (selectedCRs.length === 0) return true;
    const crStr = String(templateCR);
    
    // Handle 11+ case
    if (selectedCRs.includes('11+')) {
      const numCR = parseFloat(crStr);
      if (!isNaN(numCR) && numCR >= 11) return true;
    }
    
    return selectedCRs.includes(crStr);
  };

  const filtered = useMemo(() => {
    return (templates || []).filter(t => {
      // Type filter
      if (typeFilter === 'enemies' && t.isNpc) return false;
      if (typeFilter === 'npcs' && !t.isNpc) return false;
      
      // Search filter
      if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      // CR filter
      if (!matchesCR(t.cr)) return false;
      
      return true;
    });
  }, [templates, typeFilter, searchQuery, selectedCRs]);

  if (!isOpen) return null;

  const toggleCR = (cr) => {
    setSelectedCRs(prev => 
      prev.includes(cr) ? prev.filter(c => c !== cr) : [...prev, cr]
    );
  };

  const clearCRFilter = () => setSelectedCRs([]);

  const toggleMonster = (templateId) => {
    setSelectedMonsters(prev => {
      const newSelection = { ...prev };
      if (newSelection[templateId]) {
        delete newSelection[templateId];
      } else {
        newSelection[templateId] = 1;
      }
      return newSelection;
    });
  };

  const updateQuantity = (templateId, delta) => {
    setSelectedMonsters(prev => {
      const current = prev[templateId] || 0;
      const newQty = Math.max(1, current + delta);
      return { ...prev, [templateId]: newQty };
    });
  };

  const selectedCount = Object.values(selectedMonsters).reduce((sum, qty) => sum + qty, 0);
  const selectedTypes = Object.keys(selectedMonsters).length;

  const handleAdd = () => {
    Object.entries(selectedMonsters).forEach(([templateId, quantity]) => {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;
      for (let i = 0; i < quantity; i++) {
        onAdd({ 
          ...template, 
          id: `enemy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
          name: quantity > 1 ? `${template.name} ${i + 1}` : template.name, 
          currentHp: template.maxHp, 
          initiative: Math.floor(Math.random() * 20) + 1 
        });
      }
    });
    handleClose();
  };

  const handleClose = () => {
    onClose();
    setSelectedMonsters({});
    setSearchQuery('');
    setSelectedCRs([]);
    setShowCRDropdown(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-stone-900 border border-amber-800/50 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => { e.stopPropagation(); setShowCRDropdown(false); }}>
        <div className="p-4 border-b border-stone-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-amber-400">Add to Encounter</h2>
            {selectedTypes > 0 && (
              <span className="text-sm bg-red-900/50 text-red-300 px-2 py-1 rounded">
                {selectedCount} creature{selectedCount !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          
          {/* Search Input */}
          <div className="mt-3 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2 pl-10 text-sm focus:outline-none focus:border-amber-600"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300">×</button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            {/* Type Filter */}
            <div className="flex gap-1">
              {['all', 'enemies', 'npcs'].map((f) => (
                <button key={f} onClick={() => setTypeFilter(f)} className={`px-3 py-1 rounded-lg text-sm capitalize ${typeFilter === f ? 'bg-amber-700' : 'bg-stone-700 hover:bg-stone-600'}`}>{f}</button>
              ))}
            </div>

            {/* CR Filter Dropdown */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setShowCRDropdown(!showCRDropdown)}
                className={`px-3 py-1 rounded-lg text-sm flex items-center gap-2 ${selectedCRs.length > 0 ? 'bg-purple-700' : 'bg-stone-700 hover:bg-stone-600'}`}
              >
                <span>CR Filter</span>
                {selectedCRs.length > 0 && (
                  <span className="bg-purple-900 px-1.5 py-0.5 rounded text-xs">{selectedCRs.length}</span>
                )}
                <span className={`transition-transform ${showCRDropdown ? 'rotate-180' : ''}`}>▼</span>
              </button>
              
              {showCRDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-stone-800 border border-stone-600 rounded-lg shadow-xl z-10 min-w-[200px]">
                  <div className="p-2 border-b border-stone-700 flex justify-between items-center">
                    <span className="text-xs text-stone-400">Select Challenge Ratings</span>
                    {selectedCRs.length > 0 && (
                      <button onClick={clearCRFilter} className="text-xs text-red-400 hover:text-red-300">Clear</button>
                    )}
                  </div>
                  <div className="p-2 grid grid-cols-3 gap-1 max-h-48 overflow-y-auto">
                    {CR_OPTIONS.map(cr => (
                      <button
                        key={cr.value}
                        onClick={() => toggleCR(cr.value)}
                        className={`px-2 py-1 rounded text-xs ${selectedCRs.includes(cr.value) ? 'bg-purple-600' : 'bg-stone-700 hover:bg-stone-600'}`}
                      >
                        {cr.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Selected CR Tags */}
          <div className="mt-2 min-h-[28px] flex flex-wrap gap-1 items-center">
            {selectedCRs.length > 0 ? selectedCRs.map(cr => (
              <span key={cr} className="px-2 py-0.5 bg-purple-900/50 text-purple-300 rounded text-xs flex items-center gap-1">
                CR {cr}
                <button onClick={() => toggleCR(cr)} className="hover:text-white">×</button>
              </span>
            )) : (
              <span className="text-xs text-stone-600">No CR filter applied</span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Results Count */}
          <div className="text-xs text-stone-500 mb-2">
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
            {(searchQuery || selectedCRs.length > 0) && ' (filtered)'}
          </div>

          {/* Template Grid - Multi-select */}
          <div className="grid grid-cols-2 gap-2">
            {filtered.length > 0 ? filtered.map((t) => {
              const isSelected = selectedMonsters[t.id] !== undefined;
              const quantity = selectedMonsters[t.id] || 0;
              
              return (
                <div 
                  key={t.id} 
                  className={`rounded-lg text-left transition-colors ${
                    isSelected 
                      ? (t.isNpc ? 'bg-emerald-900/40 border-2 border-emerald-500' : 'bg-red-900/40 border-2 border-red-500')
                      : 'bg-stone-800 border border-stone-700 hover:border-stone-500'
                  }`}
                >
                  <button 
                    onClick={() => toggleMonster(t.id)} 
                    className="w-full p-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      {t.isNpc ? <Icons.Shield /> : <Icons.Skull />}
                      <span className="font-medium">{t.name}</span>
                      {isSelected && <span className="ml-auto text-xs bg-green-900/50 text-green-300 px-1.5 py-0.5 rounded">✓</span>}
                    </div>
                    <div className="text-xs text-stone-400 mt-1">CR {t.cr} • AC {t.ac} • HP {t.maxHp}</div>
                  </button>
                  
                  {isSelected && (
                    <div className="flex items-center justify-center gap-2 px-3 pb-3 pt-1 border-t border-stone-700/50">
                      <button
                        onClick={(e) => { e.stopPropagation(); updateQuantity(t.id, -1); }}
                        className="w-7 h-7 rounded bg-stone-700 hover:bg-stone-600 flex items-center justify-center text-sm"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-mono">{quantity}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); updateQuantity(t.id, 1); }}
                        className="w-7 h-7 rounded bg-stone-700 hover:bg-stone-600 flex items-center justify-center text-sm"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="col-span-2 text-center py-8 text-stone-500">
                No templates match your filters.
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-stone-700 flex justify-end gap-3">
          <button onClick={handleClose} className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600">Cancel</button>
          <button 
            onClick={handleAdd} 
            disabled={selectedTypes === 0} 
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              selectedTypes > 0 
                ? 'bg-amber-700 hover:bg-amber-600' 
                : 'bg-stone-700 text-stone-500 cursor-not-allowed'
            }`}
          >
            <Icons.Plus />
            {selectedCount > 0 ? `Add ${selectedCount} Creature${selectedCount !== 1 ? 's' : ''}` : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AddPartyModal = ({ isOpen, onClose, onSave }) => {
  const [form, setForm] = useState({ 
    name: '', class: 'Fighter', level: '1', ac: '10', maxHp: '10', speed: '30', notes: '', resources: [],
    str: '10', dex: '10', con: '10', int: '10', wis: '10', cha: '10', spellStat: ''
  });
  const classes = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard', 'Artificer', 'NPC'];

  if (!isOpen) return null;

  const parseNum = (val, fallback) => {
    const num = parseInt(val);
    return isNaN(num) ? fallback : num;
  };

  const getMod = (score) => {
    const num = parseNum(score, 10);
    const mod = Math.floor((num - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const handleSave = () => {
    if (!form.name) return;
    const newMember = { 
      ...form, 
      id: `party-${Date.now()}`, 
      level: parseNum(form.level, 1),
      ac: parseNum(form.ac, 10),
      maxHp: parseNum(form.maxHp, 10),
      speed: parseNum(form.speed, 30),
      str: parseNum(form.str, 10),
      dex: parseNum(form.dex, 10),
      con: parseNum(form.con, 10),
      int: parseNum(form.int, 10),
      wis: parseNum(form.wis, 10),
      cha: parseNum(form.cha, 10),
      spellStat: form.spellStat || null,
      currentHp: parseNum(form.maxHp, 10), 
      initiative: Math.floor(Math.random() * 20) + 1 
    };
    onSave(newMember);
    onClose();
    setForm({ 
      name: '', class: 'Fighter', level: '1', ac: '10', maxHp: '10', speed: '30', notes: '', resources: [],
      str: '10', dex: '10', con: '10', int: '10', wis: '10', cha: '10', spellStat: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-emerald-800/50 rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-stone-700"><h2 className="text-xl font-bold text-emerald-400">Add Party Member</h2></div>
        <div className="p-4 space-y-4">
          <input type="text" placeholder="Character Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-2 focus:outline-none focus:border-emerald-500" />
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-stone-400">Class</label><select value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-2">{classes.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="text-xs text-stone-400">Level</label><input type="text" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-2" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-stone-400">AC</label><input type="text" value={form.ac} onChange={(e) => setForm({ ...form, ac: e.target.value })} className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-2" /></div>
            <div><label className="text-xs text-stone-400">Max HP</label><input type="text" value={form.maxHp} onChange={(e) => setForm({ ...form, maxHp: e.target.value })} className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-2" /></div>
            <div><label className="text-xs text-stone-400">Speed</label><input type="text" value={form.speed} onChange={(e) => setForm({ ...form, speed: e.target.value })} className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-2" /></div>
          </div>
          <div className="grid grid-cols-6 gap-2">
            <div><label className="text-xs text-stone-400">STR</label><input type="text" value={form.str} onChange={(e) => setForm({ ...form, str: e.target.value })} className="w-full bg-stone-800 border border-stone-600 rounded px-2 py-1 text-center text-sm" /><div className="text-xs text-center text-stone-500">{getMod(form.str)}</div></div>
            <div><label className="text-xs text-stone-400">DEX</label><input type="text" value={form.dex} onChange={(e) => setForm({ ...form, dex: e.target.value })} className="w-full bg-stone-800 border border-stone-600 rounded px-2 py-1 text-center text-sm" /><div className="text-xs text-center text-stone-500">{getMod(form.dex)}</div></div>
            <div><label className="text-xs text-stone-400">CON</label><input type="text" value={form.con} onChange={(e) => setForm({ ...form, con: e.target.value })} className="w-full bg-stone-800 border border-stone-600 rounded px-2 py-1 text-center text-sm" /><div className="text-xs text-center text-stone-500">{getMod(form.con)}</div></div>
            <div><label className="text-xs text-stone-400">INT</label><input type="text" value={form.int} onChange={(e) => setForm({ ...form, int: e.target.value })} className="w-full bg-stone-800 border border-stone-600 rounded px-2 py-1 text-center text-sm" /><div className="text-xs text-center text-stone-500">{getMod(form.int)}</div></div>
            <div><label className="text-xs text-stone-400">WIS</label><input type="text" value={form.wis} onChange={(e) => setForm({ ...form, wis: e.target.value })} className="w-full bg-stone-800 border border-stone-600 rounded px-2 py-1 text-center text-sm" /><div className="text-xs text-center text-stone-500">{getMod(form.wis)}</div></div>
            <div><label className="text-xs text-stone-400">CHA</label><input type="text" value={form.cha} onChange={(e) => setForm({ ...form, cha: e.target.value })} className="w-full bg-stone-800 border border-stone-600 rounded px-2 py-1 text-center text-sm" /><div className="text-xs text-center text-stone-500">{getMod(form.cha)}</div></div>
          </div>
          <div>
            <label className="text-xs text-stone-400">Spellcasting Stat</label>
            <select value={form.spellStat} onChange={(e) => setForm({ ...form, spellStat: e.target.value })} className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-2">
              <option value="">None</option>
              <option value="int">Intelligence</option>
              <option value="wis">Wisdom</option>
              <option value="cha">Charisma</option>
            </select>
          </div>
          <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-2 h-20 resize-none" />
        </div>
        <div className="p-4 border-t border-stone-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600">Cancel</button>
          <button onClick={handleSave} disabled={!form.name} className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"><Icons.Download />Save</button>
        </div>
      </div>
    </div>
  );
};
