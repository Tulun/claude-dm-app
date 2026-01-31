'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icons from './Icons';
import { EditableField, HpBar } from './ui';
import { ResourceTracker, ItemTracker, ActionTracker } from './Trackers';

const CharacterCard = ({ character, isEnemy, onUpdate, onRemove, expanded, onToggleExpand, showResources }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isDead = character.currentHp <= 0;
  const hasStats = character.str || character.dex || character.con || character.int || character.wis || character.cha;
  const characterType = character.class ? 'party' : 'template';

  const getMod = (score) => {
    const num = parseInt(score) || 10;
    const mod = Math.floor((num - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const getModNum = (score) => {
    const num = parseInt(score) || 10;
    return Math.floor((num - 10) / 2);
  };

  // Calculate proficiency bonus based on level or CR
  const getProfBonus = () => {
    if (character.level) {
      const lvl = parseInt(character.level) || 1;
      return Math.floor((lvl - 1) / 4) + 2;
    }
    if (character.cr) {
      const cr = character.cr;
      if (cr === '0' || cr === '1/8' || cr === '1/4' || cr === '1/2') return 2;
      const crNum = parseInt(cr) || 1;
      if (crNum <= 4) return 2;
      if (crNum <= 8) return 3;
      if (crNum <= 12) return 4;
      if (crNum <= 16) return 5;
      if (crNum <= 20) return 6;
      if (crNum <= 24) return 7;
      if (crNum <= 28) return 8;
      return 9;
    }
    return 2;
  };

  // Calculate spell save DC: 8 + proficiency + spellcasting mod
  const getSpellSaveDC = () => {
    if (!character.spellStat) return null;
    const statMap = { str: character.str, dex: character.dex, con: character.con, int: character.int, wis: character.wis, cha: character.cha };
    const mod = getModNum(statMap[character.spellStat]);
    return 8 + getProfBonus() + mod;
  };

  const getSpellAttackBonus = () => {
    if (!character.spellStat) return null;
    const statMap = { str: character.str, dex: character.dex, con: character.con, int: character.int, wis: character.wis, cha: character.cha };
    const mod = getModNum(statMap[character.spellStat]);
    const bonus = getProfBonus() + mod;
    return bonus >= 0 ? `+${bonus}` : `${bonus}`;
  };

  const spellDC = getSpellSaveDC();
  const spellAttack = getSpellAttackBonus();

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${isDead ? 'border-red-900/50 bg-stone-900/30 opacity-60' : isEnemy ? 'border-red-800/50 bg-gradient-to-br from-red-950/40 to-stone-900/60' : 'border-emerald-800/50 bg-gradient-to-br from-emerald-950/40 to-stone-900/60'}`}>
      <div className={`flex items-center justify-between p-3 cursor-pointer ${isEnemy ? 'hover:bg-red-900/20' : 'hover:bg-emerald-900/20'}`} onClick={onToggleExpand}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isEnemy ? 'bg-red-900/50' : 'bg-emerald-900/50'}`}>{isEnemy ? <Icons.Skull /> : <Icons.Shield />}</div>
          <div>
            <h3 className={`font-bold ${isDead ? 'line-through text-stone-500' : ''}`}>{character.name}</h3>
            <p className="text-xs text-stone-400">{character.class ? `${character.class} ${character.level}` : `CR ${character.cr}`}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm"><Icons.Shield /><span className="font-mono">{character.ac}</span></div>
          <div className="flex items-center gap-1 text-sm"><Icons.Heart /><span className={`font-mono ${isDead ? 'text-red-500' : ''}`}>{character.currentHp}/{character.maxHp}</span></div>
          {spellDC && <div className="flex items-center gap-1 text-sm text-purple-400"><Icons.Sparkles /><span className="font-mono">{spellDC}</span></div>}
          {expanded ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
        </div>
      </div>

      {/* Quick stats bar - always visible when collapsed and has stats */}
      {!expanded && hasStats && (
        <div className="px-3 pb-2 grid grid-cols-6 gap-1 text-center text-xs border-t border-stone-700/30 pt-2">
          <div><span className="text-stone-600">STR</span> <span className="text-stone-400">{getMod(character.str)}</span></div>
          <div><span className="text-stone-600">DEX</span> <span className="text-stone-400">{getMod(character.dex)}</span></div>
          <div><span className="text-stone-600">CON</span> <span className="text-stone-400">{getMod(character.con)}</span></div>
          <div><span className="text-stone-600">INT</span> <span className="text-stone-400">{getMod(character.int)}</span></div>
          <div><span className="text-stone-600">WIS</span> <span className="text-stone-400">{getMod(character.wis)}</span></div>
          <div><span className="text-stone-600">CHA</span> <span className="text-stone-400">{getMod(character.cha)}</span></div>
        </div>
      )}

      {/* Quick actions preview - always visible when collapsed and has actions */}
      {!expanded && character.actions?.length > 0 && (
        <div className={`px-3 pb-2 text-xs ${hasStats ? '' : 'border-t border-stone-700/30 pt-2'}`}>
          <div className="flex flex-wrap gap-1">
            {character.actions.map((action, i) => (
              <span key={i} className="bg-red-900/30 text-red-300 px-2 py-0.5 rounded">{action.name}</span>
            ))}
          </div>
        </div>
      )}

      {expanded && (
        <div className="p-4 pt-0 border-t border-stone-700/50 space-y-4">
          <div>
            <label className="text-xs text-stone-400 mb-1 block">Hit Points</label>
            <HpBar current={character.currentHp} max={character.maxHp} onChange={(curr, max) => onUpdate({ ...character, currentHp: curr, maxHp: max })} />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><label className="text-xs text-stone-400">Name</label><EditableField value={character.name} onChange={(v) => onUpdate({ ...character, name: v })} className="block w-full" /></div>
            <div><label className="text-xs text-stone-400">AC</label><EditableField value={character.ac} onChange={(v) => onUpdate({ ...character, ac: v })} type="number" min={0} className="block w-full" /></div>
            <div><label className="text-xs text-stone-400">Initiative</label><EditableField value={character.initiative} onChange={(v) => onUpdate({ ...character, initiative: v })} type="number" className="block w-full" /></div>
            <div><label className="text-xs text-stone-400">Speed</label><div className="flex items-center gap-1"><Icons.Boot /><EditableField value={character.speed} onChange={(v) => onUpdate({ ...character, speed: v })} type="number" min={0} className="w-16" /><span className="text-stone-500">ft</span></div></div>
          </div>
          {/* Editable ability scores */}
          <div className="grid grid-cols-6 gap-2 text-center text-xs bg-stone-800/50 rounded p-2">
            <div>
              <span className="text-stone-500">STR</span>
              <EditableField value={character.str || 10} onChange={(v) => onUpdate({ ...character, str: v })} type="number" className="w-full text-center" />
              <div className="text-stone-500">{getMod(character.str)}</div>
            </div>
            <div>
              <span className="text-stone-500">DEX</span>
              <EditableField value={character.dex || 10} onChange={(v) => onUpdate({ ...character, dex: v })} type="number" className="w-full text-center" />
              <div className="text-stone-500">{getMod(character.dex)}</div>
            </div>
            <div>
              <span className="text-stone-500">CON</span>
              <EditableField value={character.con || 10} onChange={(v) => onUpdate({ ...character, con: v })} type="number" className="w-full text-center" />
              <div className="text-stone-500">{getMod(character.con)}</div>
            </div>
            <div>
              <span className="text-stone-500">INT</span>
              <EditableField value={character.int || 10} onChange={(v) => onUpdate({ ...character, int: v })} type="number" className="w-full text-center" />
              <div className="text-stone-500">{getMod(character.int)}</div>
            </div>
            <div>
              <span className="text-stone-500">WIS</span>
              <EditableField value={character.wis || 10} onChange={(v) => onUpdate({ ...character, wis: v })} type="number" className="w-full text-center" />
              <div className="text-stone-500">{getMod(character.wis)}</div>
            </div>
            <div>
              <span className="text-stone-500">CHA</span>
              <EditableField value={character.cha || 10} onChange={(v) => onUpdate({ ...character, cha: v })} type="number" className="w-full text-center" />
              <div className="text-stone-500">{getMod(character.cha)}</div>
            </div>
          </div>
          {/* Spellcasting section */}
          <div className="flex items-center gap-3 text-sm">
            <div>
              <label className="text-xs text-stone-400">Spellcasting Stat</label>
              <select 
                value={character.spellStat || ''} 
                onChange={(e) => onUpdate({ ...character, spellStat: e.target.value || null })}
                className="block w-full bg-stone-900/50 border border-stone-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="">None</option>
                <option value="int">Intelligence</option>
                <option value="wis">Wisdom</option>
                <option value="cha">Charisma</option>
              </select>
            </div>
            {spellDC && (
              <>
                <div className="text-center">
                  <label className="text-xs text-stone-400">Spell DC</label>
                  <div className="font-mono text-purple-400 text-lg">{spellDC}</div>
                </div>
                <div className="text-center">
                  <label className="text-xs text-stone-400">Spell Atk</label>
                  <div className="font-mono text-purple-400 text-lg">{spellAttack}</div>
                </div>
                <div className="text-center">
                  <label className="text-xs text-stone-400">Prof</label>
                  <div className="font-mono text-stone-400 text-lg">+{getProfBonus()}</div>
                </div>
              </>
            )}
          </div>
          <div><label className="text-xs text-stone-400">Notes</label><EditableField value={character.notes} onChange={(v) => onUpdate({ ...character, notes: v })} className="block w-full text-sm" placeholder="Click to add notes..." /></div>
          {showResources && <ResourceTracker resources={character.resources || []} onChange={(resources) => onUpdate({ ...character, resources })} />}
          {showResources && <ItemTracker items={character.items || []} onChange={(items) => onUpdate({ ...character, items })} />}
          <ActionTracker actions={character.actions || []} onChange={(actions) => onUpdate({ ...character, actions })} />
          <div className="flex justify-between items-center pt-2 border-t border-stone-700/30">
            <Link 
              href={`/character?id=${character.id}&type=${characterType}`}
              className="flex items-center gap-1 px-3 py-1 rounded text-sm bg-amber-900/30 hover:bg-amber-800/50 text-amber-400"
            >
              <Icons.Edit /> Full Page
            </Link>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-stone-400">Are you sure?</span>
                <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1 rounded text-sm bg-stone-700 hover:bg-stone-600">Cancel</button>
                <button onClick={() => onRemove(character.id)} className="px-3 py-1 rounded text-sm bg-red-700 hover:bg-red-600 text-white">Yes, {isEnemy ? 'Kill' : 'Remove'}</button>
              </div>
            ) : (
              <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1 px-3 py-1 rounded text-sm bg-red-900/30 hover:bg-red-800/50 text-red-400"><Icons.Trash />{isEnemy ? 'Kill' : 'Remove'}</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterCard;
