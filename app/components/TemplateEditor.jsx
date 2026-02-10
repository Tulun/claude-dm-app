'use client';

import { useState } from 'react';
import Icons from './Icons';

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

const TemplateEditor = ({ templates, onUpdate, onDelete, onCreate }) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showCreate, setShowCreate] = useState(false);
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

  const filtered = templates.filter(t => filter === 'all' || (filter === 'enemies' ? !t.isNpc : t.isNpc));

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['all', 'enemies', 'npcs'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded text-sm capitalize ${filter === f ? 'bg-amber-700' : 'bg-stone-700 hover:bg-stone-600'}`}>{f}</button>
          ))}
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-sm flex items-center gap-1">
          {showCreate ? <Icons.X /> : <Icons.Plus />} {showCreate ? 'Cancel' : 'New Template'}
        </button>
      </div>

      {showCreate && (
        <div className="border border-emerald-700 rounded-lg bg-stone-900/50">
          {renderEditForm(createForm, setCreateForm, handleCreate, () => setShowCreate(false))}
        </div>
      )}

      <div className="text-xs text-stone-500">{filtered.length} template{filtered.length !== 1 ? 's' : ''}</div>

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
                        {t.type && <span className="italic">{t.type} • </span>}
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
    </div>
  );
};

export default TemplateEditor;
