'use client';

import { useState, useMemo } from 'react';
import Icons from '../../components/Icons';
import ImportMonsterModal from './ImportMonsterModal';

// CR ordered list for range filter
const CR_LIST = ['0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '30'];

const CR_LABELS = { '0': '0', '1/8': '⅛', '1/4': '¼', '1/2': '½' };

const crToNumber = (cr) => {
  if (cr === '1/8') return 0.125;
  if (cr === '1/4') return 0.25;
  if (cr === '1/2') return 0.5;
  return parseFloat(cr) || 0;
};

const crLabel = (cr) => CR_LABELS[cr] || cr;

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
        className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${selected.length > 0 ? c.bg : 'bg-stone-700 hover:bg-stone-600'}`}
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

// CR Range Filter component
const CRRangeFilter = ({ minCR, maxCR, onChange, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);
  const minIdx = minCR !== null ? CR_LIST.indexOf(minCR) : 0;
  const maxIdx = maxCR !== null ? CR_LIST.indexOf(maxCR) : CR_LIST.length - 1;
  const isActive = minCR !== null || maxCR !== null;
  
  const handleMin = (idx) => {
    const newMin = CR_LIST[idx];
    const effectiveMax = maxCR || CR_LIST[CR_LIST.length - 1];
    if (crToNumber(newMin) > crToNumber(effectiveMax)) {
      onChange(newMin, newMin);
    } else {
      onChange(newMin, maxCR);
    }
  };
  
  const handleMax = (idx) => {
    const newMax = CR_LIST[idx];
    const effectiveMin = minCR || CR_LIST[0];
    if (crToNumber(newMax) < crToNumber(effectiveMin)) {
      onChange(newMax, newMax);
    } else {
      onChange(minCR, newMax);
    }
  };

  const displayLabel = isActive
    ? `CR ${crLabel(minCR || '0')}–${crLabel(maxCR || '30')}`
    : 'CR';

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${isActive ? 'bg-purple-700' : 'bg-stone-800 hover:bg-stone-700'}`}
      >
        <span>{displayLabel}</span>
        {isActive && (
          <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="text-xs hover:text-white">×</button>
        )}
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-stone-800 border border-stone-600 rounded-lg shadow-xl z-20 p-3 w-[280px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-stone-400">CR Range</span>
              {isActive && (
                <button onClick={() => { onClear(); }} className="text-xs text-red-400 hover:text-red-300">Clear</button>
              )}
            </div>
            
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <label className="text-[10px] text-stone-500 uppercase mb-1 block">Min</label>
                <select
                  value={minIdx}
                  onChange={(e) => handleMin(parseInt(e.target.value))}
                  className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-purple-600"
                >
                  {CR_LIST.map((cr, i) => (
                    <option key={cr} value={i}>{crLabel(cr)}</option>
                  ))}
                </select>
              </div>
              <span className="text-stone-500 pt-4">–</span>
              <div className="flex-1">
                <label className="text-[10px] text-stone-500 uppercase mb-1 block">Max</label>
                <select
                  value={maxIdx}
                  onChange={(e) => handleMax(parseInt(e.target.value))}
                  className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-purple-600"
                >
                  {CR_LIST.map((cr, i) => (
                    <option key={cr} value={i}>{crLabel(cr)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick presets */}
            <div className="flex flex-wrap gap-1">
              {[
                { label: 'Low (0–4)', min: '0', max: '4' },
                { label: 'Mid (5–10)', min: '5', max: '10' },
                { label: 'High (11–16)', min: '11', max: '16' },
                { label: 'Epic (17–30)', min: '17', max: '30' },
              ].map(p => (
                <button
                  key={p.label}
                  onClick={() => onChange(p.min, p.max)}
                  className="px-2 py-1 rounded text-xs bg-stone-700 hover:bg-stone-600"
                >
                  {p.label}
                </button>
              ))}
            </div>
            
            <div className="mt-2 pt-2 border-t border-stone-700">
              <button onClick={() => setIsOpen(false)} className="w-full text-xs text-stone-400 hover:text-stone-200 py-1">Done</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Reusable editor for traits/actions/reactions/legendary actions
const StatBlockListEditor = ({ items = [], onChange, label, color = 'red' }) => {
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const addItem = () => {
    if (!newName.trim()) return;
    onChange([...items, { name: newName, description: newDesc }]);
    setNewName('');
    setNewDesc('');
  };

  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const colorClasses = {
    red: 'text-red-300 bg-red-800/50 hover:bg-red-700/50 border-red-700',
    amber: 'text-amber-300 bg-amber-800/50 hover:bg-amber-700/50 border-amber-700',
    purple: 'text-purple-300 bg-purple-800/50 hover:bg-purple-700/50 border-purple-700',
    cyan: 'text-cyan-300 bg-cyan-800/50 hover:bg-cyan-700/50 border-cyan-700',
  };

  return (
    <div className="space-y-2">
      <label className={`text-xs ${colorClasses[color].split(' ')[0]} flex items-center gap-1`}>{label}</label>
      {items.map((item, i) => (
        <div key={i} className="bg-stone-900/50 rounded p-2 space-y-2">
          <div className="flex items-center gap-2">
            <input type="text" value={item.name} onChange={(e) => updateItem(i, 'name', e.target.value)} 
              className="flex-1 bg-stone-800 border border-stone-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-500" placeholder="Name" />
            <button onClick={() => removeItem(i)} className="w-6 h-6 rounded bg-red-900/50 hover:bg-red-800/50 text-red-300"><Icons.Trash /></button>
          </div>
          <textarea value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} 
            className="w-full bg-stone-800 border border-stone-600 rounded px-2 py-1 text-sm h-16 resize-none focus:outline-none focus:border-amber-500" placeholder="Description..." />
        </div>
      ))}
      <div className="space-y-2 pt-1 border-t border-stone-700/50">
        <input type="text" placeholder="New name..." value={newName} onChange={(e) => setNewName(e.target.value)} 
          className="w-full bg-stone-900/50 border border-stone-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-500" />
        <textarea placeholder="Description..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} 
          className="w-full bg-stone-900/50 border border-stone-700 rounded px-2 py-1 text-sm h-12 resize-none focus:outline-none focus:border-amber-500" />
        <button onClick={addItem} disabled={!newName.trim()} 
          className={`w-full px-2 py-1 rounded ${colorClasses[color]} disabled:opacity-50 text-sm flex items-center justify-center gap-1`}>
          <Icons.Plus /> Add {label.replace(':', '')}
        </button>
      </div>
    </div>
  );
};

// Display component for stat block section
const StatBlockSection = ({ title, items, color = 'red' }) => {
  if (!items || items.length === 0) return null;
  const textColor = { red: 'text-red-400', amber: 'text-amber-400', purple: 'text-purple-400', cyan: 'text-cyan-400' }[color];
  const nameColor = { red: 'text-red-300', amber: 'text-amber-300', purple: 'text-purple-300', cyan: 'text-cyan-300' }[color];
  
  return (
    <div className="space-y-1">
      <div className={`text-xs ${textColor} font-bold border-b border-stone-700 pb-1`}>{title}</div>
      {items.map((item, i) => (
        <div key={i} className="text-xs">
          <span className={`${nameColor} font-semibold italic`}>{item.name}.</span>{' '}
          <span className="text-stone-300">{item.description}</span>
        </div>
      ))}
    </div>
  );
};

const TemplateEditor = ({ templates, onUpdate, onDelete, onCreate, onImport }) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [createForm, setCreateForm] = useState({ 
    name: '', type: 'Medium Humanoid', ac: '10', maxHp: '10', hitDice: '1d8', speed: '30', cr: '1', 
    xp: '200', profBonus: '2', notes: '', isNpc: false,
    str: '10', dex: '10', con: '10', int: '10', wis: '10', cha: '10',
    senses: '', languages: '', vulnerabilities: '', resistances: '', immunities: '',
    traits: [], actions: [], reactions: [], legendaryActions: []
  });
  const [filter, setFilter] = useState('all');
  const [expandedTemplates, setExpandedTemplates] = useState({});
  const [sourceFilter, setSourceFilter] = useState('default'); // 'default', 'conflux', 'custom'
  const [confluxTemplates, setConfluxTemplates] = useState([]);
  const [confluxLoading, setConfluxLoading] = useState(false);
  const [confluxLoaded, setConfluxLoaded] = useState(false);
  
  // New filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [crMin, setCrMin] = useState(null);
  const [crMax, setCrMax] = useState(null);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedCreatureTypes, setSelectedCreatureTypes] = useState([]);

  // Load Conflux creatures on demand
  const loadConflux = () => {
    if (confluxLoaded) return;
    setConfluxLoading(true);
    fetch('/api/templates?source=conflux')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setConfluxTemplates(data);
        setConfluxLoaded(true);
        setConfluxLoading(false);
      })
      .catch(() => setConfluxLoading(false));
  };

  // Switch source filter
  const handleSourceChange = (src) => {
    setSourceFilter(src);
    if (src === 'conflux') loadConflux();
  };

  // Get the active template list based on source filter
  const activeTemplates = sourceFilter === 'conflux' ? confluxTemplates : templates;

  // Get available creature types from active templates
  const availableCreatureTypes = useMemo(() => {
    const types = new Set();
    (activeTemplates || []).forEach(t => {
      if (t.creatureType) {
        const baseType = t.creatureType.split(' ')[0].replace(/[()]/g, '');
        types.add(baseType);
      }
    });
    return CREATURE_TYPE_OPTIONS.filter(ct => types.has(ct));
  }, [activeTemplates]);

  const toggleFilter = (setter) => (value) => {
    setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const filtered = useMemo(() => {
    return (activeTemplates || []).filter(t => {
      // Type filter (NPC vs Enemy)
      if (filter === 'enemies' && t.isNpc) return false;
      if (filter === 'npcs' && !t.isNpc) return false;
      
      // Source sub-filter for default view
      if (sourceFilter === 'custom' && t.id?.startsWith('mm-')) return false;
      if (sourceFilter === 'default' && t.source === 'custom') return false;
      
      // Search filter
      if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      // CR range filter
      if (crMin !== null || crMax !== null) {
        const crNum = crToNumber(String(t.cr));
        if (crMin !== null && crNum < crToNumber(crMin)) return false;
        if (crMax !== null && crNum > crToNumber(crMax)) return false;
      }
      
      // Size filter
      if (selectedSizes.length > 0 && !selectedSizes.includes(t.size)) return false;
      
      // Creature type filter
      if (selectedCreatureTypes.length > 0) {
        if (!t.creatureType) return false;
        const matches = selectedCreatureTypes.some(ct => 
          t.creatureType.startsWith(ct) || t.creatureType.includes(ct)
        );
        if (!matches) return false;
      }
      
      return true;
    });
  }, [activeTemplates, filter, sourceFilter, searchQuery, crMin, crMax, selectedSizes, selectedCreatureTypes]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setCrMin(null);
    setCrMax(null);
    setSelectedSizes([]);
    setSelectedCreatureTypes([]);
    setFilter('all');
    setSourceFilter('default');
  };

  const hasFilters = searchQuery || crMin !== null || crMax !== null || selectedSizes.length > 0 || selectedCreatureTypes.length > 0 || filter !== 'all' || sourceFilter !== 'default';

  const parseNum = (val, fallback) => { const num = parseInt(val); return isNaN(num) ? fallback : num; };
  const getMod = (score) => { const mod = Math.floor((parseNum(score, 10) - 10) / 2); return mod >= 0 ? `+${mod}` : `${mod}`; };

  const handleCreate = () => {
    if (!createForm.name.trim()) return;
    onCreate({ 
      ...createForm, 
      id: `tpl-${Date.now()}`,
      ac: parseNum(createForm.ac, 10),
      maxHp: parseNum(createForm.maxHp, 10),
      profBonus: parseNum(createForm.profBonus, 2),
      str: parseNum(createForm.str, 10), dex: parseNum(createForm.dex, 10), con: parseNum(createForm.con, 10),
      int: parseNum(createForm.int, 10), wis: parseNum(createForm.wis, 10), cha: parseNum(createForm.cha, 10),
    });
    setCreateForm({ name: '', type: 'Medium Humanoid', ac: '10', maxHp: '10', hitDice: '1d8', speed: '30', cr: '1', 
      xp: '200', profBonus: '2', notes: '', isNpc: false, str: '10', dex: '10', con: '10', int: '10', wis: '10', cha: '10',
      senses: '', languages: '', vulnerabilities: '', resistances: '', immunities: '', traits: [], actions: [], reactions: [], legendaryActions: [] });
    setShowCreate(false);
  };

  const handleSaveEdit = () => {
    onUpdate({ 
      ...editForm, 
      ac: parseNum(editForm.ac, 10), maxHp: parseNum(editForm.maxHp, 10), profBonus: parseNum(editForm.profBonus, 2),
      str: parseNum(editForm.str, 10), dex: parseNum(editForm.dex, 10), con: parseNum(editForm.con, 10),
      int: parseNum(editForm.int, 10), wis: parseNum(editForm.wis, 10), cha: parseNum(editForm.cha, 10),
    });
    setEditingId(null);
  };

  const toggleExpanded = (id) => setExpandedTemplates(prev => ({ ...prev, [id]: !prev[id] }));

  // Edit form component (reused for create and edit)
  const renderEditForm = (form, setForm, onSave, onCancel) => (
    <div className="p-3 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-stone-400">Name</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} 
            className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2" placeholder="Creature name" />
        </div>
        <div>
          <label className="text-xs text-stone-400">Type</label>
          <input type="text" value={form.type || ''} onChange={(e) => setForm({ ...form, type: e.target.value })} 
            className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2" placeholder="Medium Humanoid" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setForm({ ...form, isNpc: false })} className={`px-3 py-1 rounded text-sm ${!form.isNpc ? 'bg-red-700' : 'bg-stone-700'}`}>Enemy</button>
        <button onClick={() => setForm({ ...form, isNpc: true })} className={`px-3 py-1 rounded text-sm ${form.isNpc ? 'bg-emerald-700' : 'bg-stone-700'}`}>NPC</button>
      </div>
      <div className="grid grid-cols-5 gap-2">
        <div><label className="text-xs text-stone-400">AC</label><input type="text" value={form.ac} onChange={(e) => setForm({ ...form, ac: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-center" /></div>
        <div><label className="text-xs text-stone-400">HP</label><input type="text" value={form.maxHp} onChange={(e) => setForm({ ...form, maxHp: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-center" /></div>
        <div><label className="text-xs text-stone-400">Hit Dice</label><input type="text" value={form.hitDice || ''} onChange={(e) => setForm({ ...form, hitDice: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-center" placeholder="2d8+4" /></div>
        <div><label className="text-xs text-stone-400">Speed</label><input type="text" value={form.speed} onChange={(e) => setForm({ ...form, speed: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-center" /></div>
        <div><label className="text-xs text-stone-400">CR</label><input type="text" value={form.cr} onChange={(e) => setForm({ ...form, cr: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-center" /></div>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(stat => (
          <div key={stat}>
            <label className="text-xs text-stone-400 uppercase">{stat}</label>
            <input type="text" value={form[stat] || '10'} onChange={(e) => setForm({ ...form, [stat]: e.target.value })} 
              className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-center text-sm" />
            <div className="text-xs text-center text-stone-500">{getMod(form[stat] || '10')}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-stone-400">Senses</label><input type="text" value={form.senses || ''} onChange={(e) => setForm({ ...form, senses: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-sm" placeholder="Darkvision 60 ft., Passive Perception 12" /></div>
        <div><label className="text-xs text-stone-400">Languages</label><input type="text" value={form.languages || ''} onChange={(e) => setForm({ ...form, languages: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-sm" placeholder="Common, Goblin" /></div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div><label className="text-xs text-yellow-400">Vulnerabilities</label><input type="text" value={form.vulnerabilities || ''} onChange={(e) => setForm({ ...form, vulnerabilities: e.target.value })} className="w-full bg-stone-900 border border-yellow-800/50 rounded px-2 py-1 text-sm" /></div>
        <div><label className="text-xs text-blue-400">Resistances</label><input type="text" value={form.resistances || ''} onChange={(e) => setForm({ ...form, resistances: e.target.value })} className="w-full bg-stone-900 border border-blue-800/50 rounded px-2 py-1 text-sm" /></div>
        <div><label className="text-xs text-green-400">Immunities</label><input type="text" value={form.immunities || ''} onChange={(e) => setForm({ ...form, immunities: e.target.value })} className="w-full bg-stone-900 border border-green-800/50 rounded px-2 py-1 text-sm" /></div>
      </div>
      <div><label className="text-xs text-stone-400">Notes</label><textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 h-12 resize-none text-sm" /></div>
      
      <StatBlockListEditor items={form.traits || []} onChange={(traits) => setForm({ ...form, traits })} label="Traits:" color="amber" />
      <StatBlockListEditor items={form.actions || []} onChange={(actions) => setForm({ ...form, actions })} label="Actions:" color="red" />
      <StatBlockListEditor items={form.reactions || []} onChange={(reactions) => setForm({ ...form, reactions })} label="Reactions:" color="cyan" />
      <StatBlockListEditor items={form.legendaryActions || []} onChange={(legendaryActions) => setForm({ ...form, legendaryActions })} label="Legendary Actions:" color="purple" />
      
      <div className="flex justify-end gap-2 pt-2 border-t border-stone-700">
        <button onClick={onCancel} className="px-3 py-1 rounded bg-stone-700 hover:bg-stone-600 text-sm">Cancel</button>
        <button onClick={onSave} className="px-3 py-1 rounded bg-amber-700 hover:bg-amber-600 text-sm">Save</button>
      </div>
    </div>
  );

  // Full-screen Create New Template view
  if (showCreate) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
            <Icons.Plus /> Create New Template
          </h2>
          <button 
            onClick={() => {
              setShowCreate(false);
              setCreateForm({ 
                name: '', type: 'Medium Humanoid', ac: '10', maxHp: '10', hitDice: '1d8', speed: '30', cr: '1', 
                xp: '200', profBonus: '2', notes: '', isNpc: false,
                str: '10', dex: '10', con: '10', int: '10', wis: '10', cha: '10',
                senses: '', languages: '', vulnerabilities: '', resistances: '', immunities: '',
                traits: [], actions: [], reactions: [], legendaryActions: []
              });
            }} 
            className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 flex items-center gap-2"
          >
            <Icons.X /> Cancel
          </button>
        </div>
        <div className="border border-emerald-700 rounded-lg bg-stone-900/50">
          {renderEditForm(createForm, setCreateForm, handleCreate, () => setShowCreate(false))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search templates by name..."
          className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2 pl-10 text-sm focus:outline-none focus:border-amber-600"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300">×</button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Source Filter */}
        <div className="flex gap-1">
          {[
            { key: 'default', label: 'Monster Manual' },
            { key: 'conflux', label: 'Conflux' },
            { key: 'custom', label: 'Custom' },
          ].map(s => (
            <button key={s.key} onClick={() => handleSourceChange(s.key)}
              className={`px-3 py-1.5 rounded-lg text-sm ${sourceFilter === s.key ? 'bg-amber-700' : 'bg-stone-700 hover:bg-stone-600'}`}>
              {s.label}{s.key === 'conflux' && confluxLoading ? '...' : ''}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-stone-700" />

        {/* Type Filter */}
        <div className="flex gap-1">
          {['all', 'enemies', 'npcs'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm capitalize ${filter === f ? 'bg-amber-700' : 'bg-stone-700 hover:bg-stone-600'}`}>{f}</button>
          ))}
        </div>

        <div className="w-px h-6 bg-stone-700" />

        {/* CR Range Filter */}
        <CRRangeFilter
          minCR={crMin}
          maxCR={crMax}
          onChange={(min, max) => { setCrMin(min); setCrMax(max); }}
          onClear={() => { setCrMin(null); setCrMax(null); }}
        />

        {/* Size Filter */}
        <FilterDropdown
          label="Size"
          options={SIZE_OPTIONS}
          selected={selectedSizes}
          onToggle={toggleFilter(setSelectedSizes)}
          onClear={() => setSelectedSizes([])}
          colorClass="blue"
        />

        {/* Creature Type Filter */}
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

        <div className="flex-1" />

        {onImport && (
          <button onClick={() => setShowImport(true)} className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-sm flex items-center gap-1">
            <Icons.Image /> Import from Image
          </button>
        )}

        <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-sm flex items-center gap-1">
          <Icons.Plus /> New Template
        </button>
      </div>

      {/* Active Filter Tags */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1 items-center">
          {(crMin !== null || crMax !== null) && (
            <span className="px-2 py-0.5 bg-purple-900/50 text-purple-300 rounded text-xs flex items-center gap-1">
              CR {crLabel(crMin || '0')}–{crLabel(crMax || '30')}
              <button onClick={() => { setCrMin(null); setCrMax(null); }} className="hover:text-white">×</button>
            </span>
          )}
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

      <div className="text-xs text-stone-500">
        {filtered.length} template{filtered.length !== 1 ? 's' : ''}
        {filtered.length !== activeTemplates.length && ` (filtered from ${activeTemplates.length})`}
      </div>

      <div className="space-y-2">
        {filtered.map((t) => (
          <div key={t.id} className={`rounded-lg border ${t.isNpc ? 'bg-emerald-950/30 border-emerald-900/50' : 'bg-red-950/30 border-red-900/50'}`}>
            {editingId === t.id ? (
              renderEditForm(editForm, setEditForm, handleSaveEdit, () => setEditingId(null))
            ) : (
              <>
                <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-stone-800/30" onClick={() => toggleExpanded(t.id)}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${t.isNpc ? 'bg-emerald-900/50' : 'bg-red-900/50'}`}>{t.isNpc ? <Icons.Shield /> : <Icons.Skull />}</div>
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-stone-400">
                        {(t.size || t.creatureType) && <span className="italic">{t.size} {t.creatureType} • </span>}
                        CR {t.cr} • AC {t.ac} • HP {t.maxHp}{t.hitDice && ` (${t.hitDice})`} • {t.speed}{typeof t.speed === 'number' ? ' ft.' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.legendaryActions?.length > 0 && <span className="text-xs text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded">Legendary</span>}
                    {t.traits?.length > 0 && <span className="text-xs text-amber-400">{t.traits.length} trait{t.traits.length > 1 ? 's' : ''}</span>}
                    {t.actions?.length > 0 && <span className="text-xs text-red-400">{t.actions.length} action{t.actions.length > 1 ? 's' : ''}</span>}
                    <button onClick={(e) => { e.stopPropagation(); setEditingId(t.id); setEditForm({ ...t }); }} className="p-2 rounded bg-stone-700/50 hover:bg-stone-600/50"><Icons.Edit /></button>
                    {deleteConfirmId === t.id ? (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }} className="px-2 py-1 rounded bg-stone-700 text-xs">Cancel</button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(t.id); setDeleteConfirmId(null); }} className="px-2 py-1 rounded bg-red-700 text-xs">Delete</button>
                      </>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(t.id); }} className="p-2 rounded bg-red-900/30 hover:bg-red-800/50 text-red-400"><Icons.Trash /></button>
                    )}
                    {expandedTemplates[t.id] ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
                  </div>
                </div>
                
                {expandedTemplates[t.id] && (
                  <div className="px-3 pb-3 border-t border-stone-700/50 pt-3 space-y-3">
                    {/* Ability Scores */}
                    <div className="grid grid-cols-6 gap-2 text-center text-xs bg-stone-900/30 rounded p-2">
                      {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(stat => (
                        <div key={stat}>
                          <span className="text-stone-500 uppercase font-bold">{stat}</span>
                          <div className="font-mono text-stone-200">{t[stat] || 10}</div>
                          <div className="text-stone-400">{getMod(t[stat] || 10)}</div>
                        </div>
                      ))}
                    </div>

                    {/* Defenses */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      {t.vulnerabilities && <div><span className="text-yellow-500 font-semibold">Vulnerabilities:</span> <span className="text-yellow-300">{t.vulnerabilities}</span></div>}
                      {t.resistances && <div><span className="text-blue-500 font-semibold">Resistances:</span> <span className="text-blue-300">{t.resistances}</span></div>}
                      {t.immunities && <div><span className="text-green-500 font-semibold">Immunities:</span> <span className="text-green-300">{t.immunities}</span></div>}
                    </div>

                    {/* Senses & Languages */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      {t.senses && <div><span className="text-stone-500 font-semibold">Senses:</span> <span className="text-stone-300">{t.senses}</span></div>}
                      {t.languages && <div><span className="text-stone-500 font-semibold">Languages:</span> <span className="text-stone-300">{t.languages}</span></div>}
                      {t.profBonus && <div><span className="text-stone-500 font-semibold">Prof Bonus:</span> <span className="text-stone-300">+{t.profBonus}</span></div>}
                      {t.xp && <div><span className="text-stone-500 font-semibold">XP:</span> <span className="text-stone-300">{t.xp}</span></div>}
                    </div>

                    {/* Traits */}
                    <StatBlockSection title="Traits" items={t.traits} color="amber" />
                    
                    {/* Actions */}
                    <StatBlockSection title="Actions" items={t.actions} color="red" />
                    
                    {/* Reactions */}
                    <StatBlockSection title="Reactions" items={t.reactions} color="cyan" />
                    
                    {/* Legendary Actions */}
                    <StatBlockSection title="Legendary Actions" items={t.legendaryActions} color="purple" />

                    {/* Notes */}
                    {t.notes && (
                      <div className="text-xs text-stone-400 italic bg-stone-900/30 rounded p-2">{t.notes}</div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Import Monster Modal */}
      {onImport && (
        <ImportMonsterModal
          isOpen={showImport}
          onClose={() => setShowImport(false)}
          templates={templates}
          onImport={(monster) => {
            onImport(monster);
            setShowImport(false);
          }}
          onUpdate={(monster) => {
            onUpdate(monster);
            setShowImport(false);
          }}
        />
      )}
    </div>
  );
};

export default TemplateEditor;
