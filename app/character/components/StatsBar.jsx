'use client';

import { HpBar } from '../../components/ui';
import { STATS, getMod, formatMod, getProfBonus, getSpellDC, getSpellAttack } from './constants';

export default function StatsBar({ character, isParty, onUpdate }) {
  const profBonus = getProfBonus(character);
  const spellDC = getSpellDC(character);
  const spellAttack = getSpellAttack(character);

  return (
    <div className="bg-stone-900 rounded-lg p-4">
      <div className="flex items-center gap-6">
        {/* HP (if party) */}
        {isParty && (
          <div className="w-48">
            <HpBar 
              current={character.currentHp} 
              max={character.maxHp} 
              onChange={(c, m) => { onUpdate('currentHp', c); onUpdate('maxHp', m); }} 
            />
          </div>
        )}
        
        {/* AC, Speed, Init */}
        <div className="flex gap-2">
          <div className="bg-stone-800 rounded p-2 text-center w-16">
            <div className="text-[10px] text-stone-500">AC</div>
            <input 
              type="text" 
              value={character.ac || ''} 
              onChange={(e) => onUpdate('ac', parseInt(e.target.value) || 10)}
              className="w-full bg-transparent text-xl font-bold text-center focus:outline-none" 
            />
          </div>
          <div className="bg-stone-800 rounded p-2 text-center w-16">
            <div className="text-[10px] text-stone-500">Speed</div>
            <input 
              type="text" 
              value={character.speed || ''} 
              onChange={(e) => onUpdate('speed', parseInt(e.target.value) || 30)}
              className="w-full bg-transparent text-xl font-bold text-center focus:outline-none" 
            />
          </div>
          <div className="bg-stone-800 rounded p-2 text-center w-16">
            <div className="text-[10px] text-stone-500">Init</div>
            <div className="text-xl font-bold">{formatMod(getMod(character.dex))}</div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-12 w-px bg-stone-700"></div>
        
        {/* Ability Scores - Horizontal */}
        <div className="flex gap-2">
          {STATS.map(stat => {
            const statMod = getMod(character[stat]);
            return (
              <div key={stat} className="bg-stone-800 rounded p-2 text-center w-16">
                <div className="text-[10px] text-stone-500 uppercase">{stat}</div>
                <input 
                  type="text" 
                  value={character[stat] || 10} 
                  onChange={(e) => onUpdate(stat, parseInt(e.target.value) || 10)}
                  className="w-full bg-transparent text-xl font-bold text-center focus:outline-none" 
                />
                <div className="text-sm text-stone-400 font-mono">{formatMod(statMod)}</div>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-12 w-px bg-stone-700"></div>

        {/* Prof Bonus & Spellcasting */}
        <div className="flex gap-2">
          <div className="bg-amber-900/30 rounded p-2 text-center w-16">
            <div className="text-[10px] text-stone-500">Prof</div>
            <div className="text-xl font-bold text-amber-400">+{profBonus}</div>
          </div>
          {spellDC && (
            <>
              <div className="bg-purple-900/30 rounded p-2 text-center w-16">
                <div className="text-[10px] text-stone-500">Spell DC</div>
                <div className="text-xl font-bold text-purple-400">{spellDC}</div>
              </div>
              <div className="bg-purple-900/30 rounded p-2 text-center w-16">
                <div className="text-[10px] text-stone-500">Spell Atk</div>
                <div className="text-xl font-bold text-purple-400">{formatMod(spellAttack)}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
