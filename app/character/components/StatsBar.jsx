'use client';

import { useState } from 'react';
import { HpBar } from '../../components/ui';
import { STATS, getMod, formatMod, getProfBonus, getSpellDC, getSpellAttack, calculateAC, AC_EFFECTS } from './constants';

export default function StatsBar({ character, isParty, onUpdate }) {
  const profBonus = getProfBonus(character);
  const spellDC = getSpellDC(character);
  const spellAttack = getSpellAttack(character);
  const acCalc = calculateAC(character);
  const [showACTooltip, setShowACTooltip] = useState(false);

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
          {/* AC with calculation */}
          <div 
            className="bg-stone-800 rounded p-2 text-center w-20 relative cursor-help"
            onMouseEnter={() => setShowACTooltip(true)}
            onMouseLeave={() => setShowACTooltip(false)}
          >
            <div className="text-[10px] text-stone-500 flex items-center justify-center gap-1">
              AC
              {acCalc.stealthDisadv && <span className="text-orange-400" title="Stealth Disadvantage">⊘</span>}
            </div>
            <div className={`text-xl font-bold ${acCalc.effect ? 'text-cyan-400' : ''}`}>
              {character.acOverride || acCalc.total}
            </div>
            {acCalc.strWarning && (
              <div className="text-[9px] text-orange-400">!</div>
            )}
            
            {/* AC Tooltip */}
            {showACTooltip && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-stone-800 border border-stone-600 rounded-lg p-3 text-left z-50 shadow-xl">
                <div className="text-xs font-bold text-stone-300 mb-2">AC Calculation</div>
                <div className="space-y-1 text-xs">
                  {acCalc.breakdown.map((line, i) => (
                    <div key={i} className="text-stone-400">{line}</div>
                  ))}
                  <div className="border-t border-stone-600 pt-1 mt-1 font-bold text-stone-200">
                    Total: {acCalc.total}
                  </div>
                </div>
                {acCalc.strWarning && (
                  <div className="mt-2 text-orange-400 text-xs">{acCalc.strWarning}</div>
                )}
                {acCalc.stealthDisadv && (
                  <div className="mt-1 text-orange-400 text-xs">Disadvantage on Stealth</div>
                )}
                {!acCalc.hasEquippedArmor && !acCalc.effect && (
                  <div className="mt-2 text-stone-500 text-xs italic">
                    Equip armor in Inventory tab
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Temp AC / Effect */}
          <div className="bg-stone-800 rounded p-2 text-center w-24">
            <div className="text-[10px] text-stone-500">AC Effect</div>
            <select 
              value={character.acEffect || ''} 
              onChange={(e) => onUpdate('acEffect', e.target.value || null)}
              className="w-full bg-transparent text-xs text-center focus:outline-none text-cyan-400 cursor-pointer"
            >
              {AC_EFFECTS.map(effect => (
                <option key={effect.id} value={effect.id} className="bg-stone-800 text-stone-200">
                  {effect.name}
                </option>
              ))}
            </select>
          </div>

          {/* Temp AC bonus */}
          <div className="bg-stone-800 rounded p-2 text-center w-16">
            <div className="text-[10px] text-stone-500">Temp</div>
            <input 
              type="text" 
              value={character.tempAC || ''} 
              onChange={(e) => onUpdate('tempAC', e.target.value)}
              placeholder="+0"
              className="w-full bg-transparent text-lg font-bold text-center focus:outline-none text-cyan-400 placeholder-stone-600" 
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
