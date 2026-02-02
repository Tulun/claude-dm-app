'use client';

import { useState } from 'react';
import Icons from './Icons';

const TemplateActionEditor = ({ actions = [], onChange }) => {
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const addAction = () => {
    if (!newName.trim()) return;
    onChange([...actions, { name: newName, description: newDesc }]);
    setNewName('');
    setNewDesc('');
  };

  const removeAction = (index) => {
    onChange(actions.filter((_, i) => i !== index));
  };

  const updateAction = (index, field, value) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-stone-400 flex items-center gap-1"><Icons.Sword /> Actions</label>
      {actions.map((action, i) => (
        <div key={i} className="bg-stone-900/50 rounded p-2 space-y-2">
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={action.name} 
              onChange={(e) => updateAction(i, 'name', e.target.value)} 
              className="flex-1 bg-stone-800 border border-stone-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-500" 
              placeholder="Action name"
            />
            <button onClick={() => removeAction(i)} className="w-6 h-6 rounded bg-red-900/50 hover:bg-red-800/50 text-red-300"><Icons.Trash /></button>
          </div>
          <textarea 
            value={action.description} 
            onChange={(e) => updateAction(i, 'description', e.target.value)} 
            className="w-full bg-stone-800 border border-stone-600 rounded px-2 py-1 text-sm h-16 resize-none focus:outline-none focus:border-amber-500" 
            placeholder="Description..."
          />
        </div>
      ))}
      <div className="space-y-2 pt-1 border-t border-stone-700/50">
        <input type="text" placeholder="New action name..." value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-stone-900/50 border border-stone-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-500" />
        <textarea placeholder="Description..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full bg-stone-900/50 border border-stone-700 rounded px-2 py-1 text-sm h-12 resize-none focus:outline-none focus:border-amber-500" />
        <button onClick={addAction} disabled={!newName.trim()} className="w-full px-2 py-1 rounded bg-red-800/50 hover:bg-red-700/50 text-red-300 disabled:opacity-50 text-sm flex items-center justify-center gap-1"><Icons.Plus /> Add Action</button>
      </div>
    </div>
  );
};

const TemplateEditor = ({ templates, onUpdate, onDelete, onCreate }) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [createForm, setCreateForm] = useState({ 
    name: '', ac: '10', maxHp: '10', speed: '30', cr: '1', notes: '', isNpc: false,
    str: '10', dex: '10', con: '10', int: '10', wis: '10', cha: '10',
    spellStat: '',
    actions: []
  });
  const [filter, setFilter] = useState('all');
  const [expandedTemplates, setExpandedTemplates] = useState({});

  const filtered = templates.filter(t => filter === 'all' || (filter === 'enemies' ? !t.isNpc : t.isNpc));

  const parseNum = (val, fallback) => {
    const num = parseInt(val);
    return isNaN(num) ? fallback : num;
  };

  const getMod = (score) => {
    const num = parseNum(score, 10);
    const mod = Math.floor((num - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const getSpellDC = (form) => {
    if (!form.spellStat) return null;
    const cr = form.cr || '1';
    let profBonus = 2;
    if (cr !== '0' && cr !== '1/8' && cr !== '1/4' && cr !== '1/2') {
      const crNum = parseInt(cr) || 1;
      if (crNum <= 4) profBonus = 2;
      else if (crNum <= 8) profBonus = 3;
      else if (crNum <= 12) profBonus = 4;
      else if (crNum <= 16) profBonus = 5;
      else if (crNum <= 20) profBonus = 6;
      else if (crNum <= 24) profBonus = 7;
      else if (crNum <= 28) profBonus = 8;
      else profBonus = 9;
    }
    const statMap = { str: form.str, dex: form.dex, con: form.con, int: form.int, wis: form.wis, cha: form.cha };
    const mod = Math.floor((parseNum(statMap[form.spellStat], 10) - 10) / 2);
    return 8 + profBonus + mod;
  };

  const handleCreate = () => {
    if (!createForm.name.trim()) return;
    onCreate({ 
      ...createForm, 
      id: `tpl-${Date.now()}`,
      ac: parseNum(createForm.ac, 10),
      maxHp: parseNum(createForm.maxHp, 10),
      speed: parseNum(createForm.speed, 30),
      str: parseNum(createForm.str, 10),
      dex: parseNum(createForm.dex, 10),
      con: parseNum(createForm.con, 10),
      int: parseNum(createForm.int, 10),
      wis: parseNum(createForm.wis, 10),
      cha: parseNum(createForm.cha, 10),
      spellStat: createForm.spellStat || null,
    });
    setCreateForm({ 
      name: '', ac: '10', maxHp: '10', speed: '30', cr: '1', notes: '', isNpc: false,
      str: '10', dex: '10', con: '10', int: '10', wis: '10', cha: '10',
      spellStat: '',
      actions: []
    });
    setShowCreate(false);
  };

  const handleSaveEdit = () => {
    onUpdate({
      ...editForm,
      ac: parseNum(editForm.ac, 10),
      maxHp: parseNum(editForm.maxHp, 10),
      speed: parseNum(editForm.speed, 30),
      str: parseNum(editForm.str, 10),
      dex: parseNum(editForm.dex, 10),
      con: parseNum(editForm.con, 10),
      int: parseNum(editForm.int, 10),
      wis: parseNum(editForm.wis, 10),
      cha: parseNum(editForm.cha, 10),
      spellStat: editForm.spellStat || null,
    });
    setEditingId(null);
  };

  const toggleExpanded = (id) => {
    setExpandedTemplates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['all', 'enemies', 'npcs'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-lg text-sm capitalize ${filter === f ? 'bg-amber-700' : 'bg-stone-700 hover:bg-stone-600'}`}>{f}</button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600"><Icons.Plus />New Template</button>
      </div>

      {showCreate && (
        <div className="p-4 bg-stone-800 rounded-lg border border-amber-700/50 space-y-3">
          <h3 className="font-bold text-amber-400">Create New Template</h3>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Name" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="bg-stone-900 border border-stone-600 rounded px-3 py-2 focus:outline-none focus:border-amber-500" />
            <div className="flex items-center gap-2">
              <button onClick={() => setCreateForm({ ...createForm, isNpc: false })} className={`px-3 py-1 rounded text-sm ${!createForm.isNpc ? 'bg-red-700' : 'bg-stone-700'}`}>Enemy</button>
              <button onClick={() => setCreateForm({ ...createForm, isNpc: true })} className={`px-3 py-1 rounded text-sm ${createForm.isNpc ? 'bg-emerald-700' : 'bg-stone-700'}`}>NPC</button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div><label className="text-xs text-stone-400">AC</label><input type="text" value={createForm.ac} onChange={(e) => setCreateForm({ ...createForm, ac: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2" /></div>
            <div><label className="text-xs text-stone-400">HP</label><input type="text" value={createForm.maxHp} onChange={(e) => setCreateForm({ ...createForm, maxHp: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2" /></div>
            <div><label className="text-xs text-stone-400">Speed</label><input type="text" value={createForm.speed} onChange={(e) => setCreateForm({ ...createForm, speed: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2" /></div>
            <div><label className="text-xs text-stone-400">CR</label><input type="text" value={createForm.cr} onChange={(e) => setCreateForm({ ...createForm, cr: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2" /></div>
          </div>
          <div className="grid grid-cols-6 gap-2">
            <div><label className="text-xs text-stone-400">STR</label><input type="text" value={createForm.str} onChange={(e) => setCreateForm({ ...createForm, str: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-center text-sm" /><div className="text-xs text-center text-stone-500">{getMod(createForm.str)}</div></div>
            <div><label className="text-xs text-stone-400">DEX</label><input type="text" value={createForm.dex} onChange={(e) => setCreateForm({ ...createForm, dex: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-center text-sm" /><div className="text-xs text-center text-stone-500">{getMod(createForm.dex)}</div></div>
            <div><label className="text-xs text-stone-400">CON</label><input type="text" value={createForm.con} onChange={(e) => setCreateForm({ ...createForm, con: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-center text-sm" /><div className="text-xs text-center text-stone-500">{getMod(createForm.con)}</div></div>
            <div><label className="text-xs text-stone-400">INT</label><input type="text" value={createForm.int} onChange={(e) => setCreateForm({ ...createForm, int: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-center text-sm" /><div className="text-xs text-center text-stone-500">{getMod(createForm.int)}</div></div>
            <div><label className="text-xs text-stone-400">WIS</label><input type="text" value={createForm.wis} onChange={(e) => setCreateForm({ ...createForm, wis: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-center text-sm" /><div className="text-xs text-center text-stone-500">{getMod(createForm.wis)}</div></div>
            <div><label className="text-xs text-stone-400">CHA</label><input type="text" value={createForm.cha} onChange={(e) => setCreateForm({ ...createForm, cha: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-center text-sm" /><div className="text-xs text-center text-stone-500">{getMod(createForm.cha)}</div></div>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <label className="text-xs text-stone-400">Spellcasting</label>
              <select value={createForm.spellStat || ''} onChange={(e) => setCreateForm({ ...createForm, spellStat: e.target.value })} className="block bg-stone-900 border border-stone-600 rounded px-3 py-2 text-sm">
                <option value="">None</option>
                <option value="int">INT</option>
                <option value="wis">WIS</option>
                <option value="cha">CHA</option>
              </select>
            </div>
            {createForm.spellStat && (
              <div className="text-center">
                <label className="text-xs text-stone-400">Spell DC</label>
                <div className="font-mono text-purple-400 text-lg">{getSpellDC(createForm)}</div>
              </div>
            )}
          </div>
          <textarea placeholder="Notes" value={createForm.notes} onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2 h-16 resize-none" />
          <TemplateActionEditor actions={createForm.actions || []} onChange={(actions) => setCreateForm({ ...createForm, actions })} />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600">Cancel</button>
            <button onClick={handleCreate} disabled={!createForm.name.trim()} className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 disabled:opacity-50">Create</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((t) => (
          <div key={t.id} className={`rounded-lg border ${t.isNpc ? 'bg-emerald-950/30 border-emerald-900/50' : 'bg-red-950/30 border-red-900/50'}`}>
            {editingId === t.id ? (
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="bg-stone-900 border border-stone-600 rounded px-3 py-2" />
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditForm({ ...editForm, isNpc: false })} className={`px-3 py-1 rounded text-sm ${!editForm.isNpc ? 'bg-red-700' : 'bg-stone-700'}`}>Enemy</button>
                    <button onClick={() => setEditForm({ ...editForm, isNpc: true })} className={`px-3 py-1 rounded text-sm ${editForm.isNpc ? 'bg-emerald-700' : 'bg-stone-700'}`}>NPC</button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div><label className="text-xs text-stone-400">AC</label><input type="text" value={editForm.ac} onChange={(e) => setEditForm({ ...editForm, ac: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2" /></div>
                  <div><label className="text-xs text-stone-400">HP</label><input type="text" value={editForm.maxHp} onChange={(e) => setEditForm({ ...editForm, maxHp: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2" /></div>
                  <div><label className="text-xs text-stone-400">Speed</label><input type="text" value={editForm.speed} onChange={(e) => setEditForm({ ...editForm, speed: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2" /></div>
                  <div><label className="text-xs text-stone-400">CR</label><input type="text" value={editForm.cr} onChange={(e) => setEditForm({ ...editForm, cr: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2" /></div>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  <div><label className="text-xs text-stone-400">STR</label><input type="text" value={editForm.str || '10'} onChange={(e) => setEditForm({ ...editForm, str: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-center text-sm" /><div className="text-xs text-center text-stone-500">{getMod(editForm.str || '10')}</div></div>
                  <div><label className="text-xs text-stone-400">DEX</label><input type="text" value={editForm.dex || '10'} onChange={(e) => setEditForm({ ...editForm, dex: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-center text-sm" /><div className="text-xs text-center text-stone-500">{getMod(editForm.dex || '10')}</div></div>
                  <div><label className="text-xs text-stone-400">CON</label><input type="text" value={editForm.con || '10'} onChange={(e) => setEditForm({ ...editForm, con: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-center text-sm" /><div className="text-xs text-center text-stone-500">{getMod(editForm.con || '10')}</div></div>
                  <div><label className="text-xs text-stone-400">INT</label><input type="text" value={editForm.int || '10'} onChange={(e) => setEditForm({ ...editForm, int: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-center text-sm" /><div className="text-xs text-center text-stone-500">{getMod(editForm.int || '10')}</div></div>
                  <div><label className="text-xs text-stone-400">WIS</label><input type="text" value={editForm.wis || '10'} onChange={(e) => setEditForm({ ...editForm, wis: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-center text-sm" /><div className="text-xs text-center text-stone-500">{getMod(editForm.wis || '10')}</div></div>
                  <div><label className="text-xs text-stone-400">CHA</label><input type="text" value={editForm.cha || '10'} onChange={(e) => setEditForm({ ...editForm, cha: e.target.value })} className="w-full bg-stone-900 border border-stone-600 rounded px-2 py-1 text-center text-sm" /><div className="text-xs text-center text-stone-500">{getMod(editForm.cha || '10')}</div></div>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <label className="text-xs text-stone-400">Spellcasting</label>
                    <select value={editForm.spellStat || ''} onChange={(e) => setEditForm({ ...editForm, spellStat: e.target.value })} className="block bg-stone-900 border border-stone-600 rounded px-3 py-2 text-sm">
                      <option value="">None</option>
                      <option value="int">INT</option>
                      <option value="wis">WIS</option>
                      <option value="cha">CHA</option>
                    </select>
                  </div>
                  {editForm.spellStat && (
                    <div className="text-center">
                      <label className="text-xs text-stone-400">Spell DC</label>
                      <div className="font-mono text-purple-400 text-lg">{getSpellDC(editForm)}</div>
                    </div>
                  )}
                </div>
                <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Notes" className="w-full bg-stone-900 border border-stone-600 rounded px-3 py-2 h-16 resize-none" />
                <TemplateActionEditor actions={editForm.actions || []} onChange={(actions) => setEditForm({ ...editForm, actions })} />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingId(null)} className="px-3 py-1 rounded bg-stone-700 hover:bg-stone-600 text-sm">Cancel</button>
                  <button onClick={handleSaveEdit} className="px-3 py-1 rounded bg-amber-700 hover:bg-amber-600 text-sm">Save</button>
                </div>
              </div>
            ) : (
              <>
                <div 
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-stone-800/30"
                  onClick={() => toggleExpanded(t.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${t.isNpc ? 'bg-emerald-900/50' : 'bg-red-900/50'}`}>{t.isNpc ? <Icons.Shield /> : <Icons.Skull />}</div>
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-stone-400">CR {t.cr} • AC {t.ac} • HP {t.maxHp} • {t.speed}ft</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(t.actions?.length > 0) && <span className="text-xs text-red-400">{t.actions.length} action{t.actions.length > 1 ? 's' : ''}</span>}
                    <button onClick={(e) => { e.stopPropagation(); setEditingId(t.id); setEditForm({ ...t }); }} className="p-2 rounded bg-stone-700/50 hover:bg-stone-600/50 cursor-pointer hover:text-amber-400 transition-colors"><Icons.Edit /></button>
                    {deleteConfirmId === t.id ? (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }} className="px-2 py-1 rounded bg-stone-700 hover:bg-stone-600 text-xs">Cancel</button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(t.id); setDeleteConfirmId(null); }} className="px-2 py-1 rounded bg-red-700 hover:bg-red-600 text-white text-xs">Delete</button>
                      </>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(t.id); }} className="p-2 rounded bg-red-900/30 hover:bg-red-800/50 text-red-400"><Icons.Trash /></button>
                    )}
                    {expandedTemplates[t.id] ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
                  </div>
                </div>
                {expandedTemplates[t.id] && (
                  <div className="px-3 pb-3 border-t border-stone-700/50 pt-2 space-y-2">
                    {(t.str || t.dex || t.con || t.int || t.wis || t.cha) && (
                      <div className="grid grid-cols-6 gap-2 text-center text-xs">
                        <div><span className="text-stone-500">STR</span><div className="font-mono">{t.str || 10} ({getMod(t.str || 10)})</div></div>
                        <div><span className="text-stone-500">DEX</span><div className="font-mono">{t.dex || 10} ({getMod(t.dex || 10)})</div></div>
                        <div><span className="text-stone-500">CON</span><div className="font-mono">{t.con || 10} ({getMod(t.con || 10)})</div></div>
                        <div><span className="text-stone-500">INT</span><div className="font-mono">{t.int || 10} ({getMod(t.int || 10)})</div></div>
                        <div><span className="text-stone-500">WIS</span><div className="font-mono">{t.wis || 10} ({getMod(t.wis || 10)})</div></div>
                        <div><span className="text-stone-500">CHA</span><div className="font-mono">{t.cha || 10} ({getMod(t.cha || 10)})</div></div>
                      </div>
                    )}
                    {t.spellStat && (
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-purple-400"><Icons.Sparkles /> Spellcasting ({t.spellStat.toUpperCase()})</span>
                        <span className="text-purple-300">DC {getSpellDC(t)}</span>
                      </div>
                    )}
                    {t.notes && <div className="text-xs text-stone-400">{t.notes}</div>}
                    {t.actions?.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs text-stone-500 font-medium">Actions:</div>
                        {t.actions.map((action, i) => (
                          <div key={i} className="text-xs bg-stone-900/50 rounded p-2">
                            <span className="text-red-300 font-medium">{action.name}.</span> {action.description}
                          </div>
                        ))}
                      </div>
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
