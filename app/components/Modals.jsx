'use client';

import { useState } from 'react';
import Icons from './Icons';

export const AddEnemyModal = ({ isOpen, onClose, onAdd, templates }) => {
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [filter, setFilter] = useState('all');

  if (!isOpen) return null;

  const filtered = templates.filter(t => filter === 'all' || (filter === 'enemies' ? !t.isNpc : t.isNpc));

  const handleAdd = () => {
    const template = templates.find(t => t.id === selected);
    if (!template) return;
    for (let i = 0; i < quantity; i++) {
      onAdd({ ...template, id: `enemy-${Date.now()}-${i}`, name: quantity > 1 ? `${template.name} ${i + 1}` : template.name, currentHp: template.maxHp, initiative: Math.floor(Math.random() * 20) + 1 });
    }
    onClose();
    setSelected(null);
    setQuantity(1);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-900 border border-amber-800/50 rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-stone-700">
          <h2 className="text-xl font-bold text-amber-400">Add to Encounter</h2>
          <div className="flex gap-2 mt-3">
            {['all', 'enemies', 'npcs'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-lg text-sm capitalize ${filter === f ? 'bg-amber-700' : 'bg-stone-700 hover:bg-stone-600'}`}>{f}</button>
            ))}
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {filtered.map((t) => (
              <button key={t.id} onClick={() => setSelected(t.id)} className={`p-3 rounded-lg text-left ${selected === t.id ? (t.isNpc ? 'bg-emerald-800/50 border-2 border-emerald-500' : 'bg-red-800/50 border-2 border-red-500') : 'bg-stone-800 border border-stone-700 hover:border-stone-500'}`}>
                <div className="flex items-center gap-2">{t.isNpc ? <Icons.Shield /> : <Icons.Skull />}<span className="font-medium">{t.name}</span></div>
                <div className="text-xs text-stone-400 mt-1">CR {t.cr} • AC {t.ac} • HP {t.maxHp}</div>
              </button>
            ))}
          </div>
          {selected && (
            <div className="flex items-center gap-3 p-3 bg-stone-800 rounded-lg">
              <label>Quantity:</label>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600">-</button>
              <span className="w-8 text-center font-bold">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600">+</button>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-stone-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600">Cancel</button>
          <button onClick={handleAdd} disabled={!selected} className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"><Icons.Plus />Add</button>
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
