'use client';

import Icons from '../../../components/Icons';

export default function SpellsTab({ character, onUpdate }) {
  const addSpell = () => {
    const newSpell = { id: Date.now(), name: '', level: 0, school: '', castTime: '1 action', range: '', duration: '', description: '' };
    onUpdate('spells', [...(character.spells || []), newSpell]);
  };

  const updateSpell = (id, field, value) => {
    onUpdate('spells', character.spells.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSpell = (id) => {
    onUpdate('spells', character.spells.filter(s => s.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-stone-500">Spellcasting: </span>
            <select value={character.spellStat || ''} onChange={(e) => onUpdate('spellStat', e.target.value || null)}
              className="bg-stone-800 rounded px-2 py-1 text-sm">
              <option value="">None</option>
              <option value="int">INT</option>
              <option value="wis">WIS</option>
              <option value="cha">CHA</option>
            </select>
          </div>
        </div>
        <button onClick={addSpell} className="px-3 py-1 rounded bg-purple-800 hover:bg-purple-700 text-xs flex items-center gap-1">
          <Icons.Plus /> Add Spell
        </button>
      </div>
      
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-stone-500 border-b border-stone-700">
            <th className="pb-2 font-medium">Spell</th>
            <th className="pb-2 font-medium w-16">Level</th>
            <th className="pb-2 font-medium w-24">Cast Time</th>
            <th className="pb-2 font-medium w-24">Range</th>
            <th className="pb-2 font-medium">Description</th>
            <th className="pb-2 w-8"></th>
          </tr>
        </thead>
        <tbody>
          {(character.spells || []).map(spell => (
            <tr key={spell.id} className="border-b border-stone-800 hover:bg-stone-800/50">
              <td className="py-2">
                <input type="text" value={spell.name} onChange={(e) => updateSpell(spell.id, 'name', e.target.value)}
                  className="bg-transparent focus:outline-none w-full font-medium" placeholder="Spell name" />
              </td>
              <td>
                <input type="text" value={spell.level} onChange={(e) => updateSpell(spell.id, 'level', e.target.value)}
                  className="bg-stone-800 rounded px-2 py-1 w-12 text-center focus:outline-none" placeholder="0" />
              </td>
              <td>
                <input type="text" value={spell.castTime} onChange={(e) => updateSpell(spell.id, 'castTime', e.target.value)}
                  className="bg-transparent focus:outline-none w-full" placeholder="1 action" />
              </td>
              <td>
                <input type="text" value={spell.range} onChange={(e) => updateSpell(spell.id, 'range', e.target.value)}
                  className="bg-transparent focus:outline-none w-full" placeholder="60 ft." />
              </td>
              <td>
                <input type="text" value={spell.description} onChange={(e) => updateSpell(spell.id, 'description', e.target.value)}
                  className="bg-transparent focus:outline-none w-full text-stone-400" placeholder="Description..." />
              </td>
              <td>
                <button onClick={() => removeSpell(spell.id)} className="text-red-500 hover:text-red-400">×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(character.spells || []).length === 0 && <div className="text-center text-stone-500 py-8">No spells yet.</div>}
    </div>
  );
}
