'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Icons from '../components/Icons';
import { EditableField, HpBar } from '../components/ui';
import { ResourceTracker, ItemTracker, ActionTracker } from '../components/Trackers';

export default function CharacterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const type = searchParams.get('type'); // 'party' or 'template'
  
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Load character data
  useEffect(() => {
    const loadCharacter = async () => {
      if (!id || !type) {
        setLoading(false);
        return;
      }
      
      try {
        const endpoint = type === 'party' ? '/api/party' : '/api/templates';
        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          const found = data.find(c => c.id === id);
          if (found) {
            setCharacter(found);
          }
        }
      } catch (err) {
        console.error('Error loading character:', err);
      }
      setLoading(false);
    };
    loadCharacter();
  }, [id, type]);

  // Update character field
  const updateField = (field, value) => {
    setCharacter(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Save character
  const saveCharacter = async () => {
    if (!character) return;
    
    try {
      const endpoint = type === 'party' ? '/api/party' : '/api/templates';
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        const updated = data.map(c => c.id === character.id ? character : c);
        
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
        
        setSaveStatus('Saved!');
        setHasChanges(false);
        setTimeout(() => setSaveStatus(''), 2000);
      }
    } catch (err) {
      console.error('Error saving character:', err);
      setSaveStatus('Error saving');
    }
  };

  // Auto-save after changes (debounced)
  useEffect(() => {
    if (!hasChanges || !character) return;
    const timeout = setTimeout(saveCharacter, 1500);
    return () => clearTimeout(timeout);
  }, [character, hasChanges]);

  const getMod = (score) => {
    const num = parseInt(score) || 10;
    const mod = Math.floor((num - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const getModNum = (score) => {
    const num = parseInt(score) || 10;
    return Math.floor((num - 10) / 2);
  };

  const getProfBonus = () => {
    if (character?.level) {
      const lvl = parseInt(character.level) || 1;
      return Math.floor((lvl - 1) / 4) + 2;
    }
    if (character?.cr) {
      const cr = character.cr;
      if (cr === '0' || cr === '1/8' || cr === '1/4' || cr === '1/2') return 2;
      const crNum = parseInt(cr) || 1;
      if (crNum <= 4) return 2;
      if (crNum <= 8) return 3;
      if (crNum <= 12) return 4;
      if (crNum <= 16) return 5;
      if (crNum <= 20) return 6;
      return 7;
    }
    return 2;
  };

  const getSpellSaveDC = () => {
    if (!character?.spellStat) return null;
    const statMap = { str: character.str, dex: character.dex, con: character.con, int: character.int, wis: character.wis, cha: character.cha };
    const mod = getModNum(statMap[character.spellStat]);
    return 8 + getProfBonus() + mod;
  };

  const getSpellAttackBonus = () => {
    if (!character?.spellStat) return null;
    const statMap = { str: character.str, dex: character.dex, con: character.con, int: character.int, wis: character.wis, cha: character.cha };
    const mod = getModNum(statMap[character.spellStat]);
    const bonus = getProfBonus() + mod;
    return bonus >= 0 ? `+${bonus}` : `${bonus}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100 flex items-center justify-center">
        <div className="text-stone-400">Loading...</div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-stone-400 mb-4">Character not found</div>
          <button onClick={() => router.push('/')} className="px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded-lg">
            Back to Combat
          </button>
        </div>
      </div>
    );
  }

  const isParty = type === 'party';
  const spellDC = getSpellSaveDC();
  const spellAttack = getSpellAttackBonus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-100">
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* Header */}
      <header className="relative border-b border-amber-900/30 bg-stone-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/')} className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
              </button>
              <div className={`p-3 rounded-lg ${isParty ? 'bg-emerald-900/50' : 'bg-red-900/50'}`}>
                {isParty ? <Icons.Shield /> : <Icons.Skull />}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{character.name}</h1>
                <p className="text-sm text-stone-400">
                  {character.class ? `${character.class} ${character.level}` : `CR ${character.cr}`}
                  {character.isNpc && ' • NPC'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {saveStatus && <span className="text-xs text-amber-400 bg-amber-900/30 px-2 py-1 rounded">{saveStatus}</span>}
              {hasChanges && <span className="text-xs text-stone-500">Unsaved changes...</span>}
              <button onClick={saveCharacter} className="px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded-lg flex items-center gap-2">
                <Icons.Download /> Save
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-4xl mx-auto p-4 space-y-6">
        
        {/* Basic Info Card */}
        <div className="bg-stone-900/50 border border-stone-700/50 rounded-xl p-6">
          <h2 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
            <Icons.Edit /> Basic Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs text-stone-400 block mb-1">Name</label>
              <input 
                type="text" 
                value={character.name || ''} 
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full bg-stone-800 border border-stone-600 rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
              />
            </div>
            
            {isParty ? (
              <>
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Class</label>
                  <input 
                    type="text" 
                    value={character.class || ''} 
                    onChange={(e) => updateField('class', e.target.value)}
                    className="w-full bg-stone-800 border border-stone-600 rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Level</label>
                  <input 
                    type="text" 
                    value={character.level || ''} 
                    onChange={(e) => updateField('level', parseInt(e.target.value) || 1)}
                    className="w-full bg-stone-800 border border-stone-600 rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Challenge Rating</label>
                  <input 
                    type="text" 
                    value={character.cr || ''} 
                    onChange={(e) => updateField('cr', e.target.value)}
                    className="w-full bg-stone-800 border border-stone-600 rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-400 block mb-1">Type</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateField('isNpc', false)} 
                      className={`flex-1 px-4 py-2 rounded-lg ${!character.isNpc ? 'bg-red-700' : 'bg-stone-700 hover:bg-stone-600'}`}
                    >
                      Enemy
                    </button>
                    <button 
                      onClick={() => updateField('isNpc', true)} 
                      className={`flex-1 px-4 py-2 rounded-lg ${character.isNpc ? 'bg-emerald-700' : 'bg-stone-700 hover:bg-stone-600'}`}
                    >
                      NPC
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Combat Stats Card */}
        <div className="bg-stone-900/50 border border-stone-700/50 rounded-xl p-6">
          <h2 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
            <Icons.Sword /> Combat Stats
          </h2>
          
          {isParty && (
            <div className="mb-6">
              <label className="text-xs text-stone-400 block mb-2">Hit Points</label>
              <HpBar 
                current={character.currentHp} 
                max={character.maxHp} 
                onChange={(curr, max) => { updateField('currentHp', curr); updateField('maxHp', max); }} 
              />
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-stone-800/50 rounded-lg p-4 text-center">
              <label className="text-xs text-stone-400 block mb-1">Armor Class</label>
              <input 
                type="text" 
                value={character.ac || ''} 
                onChange={(e) => updateField('ac', parseInt(e.target.value) || 10)}
                className="w-full bg-transparent text-3xl font-bold text-center focus:outline-none"
              />
            </div>
            
            {!isParty && (
              <div className="bg-stone-800/50 rounded-lg p-4 text-center">
                <label className="text-xs text-stone-400 block mb-1">Hit Points</label>
                <input 
                  type="text" 
                  value={character.maxHp || ''} 
                  onChange={(e) => updateField('maxHp', parseInt(e.target.value) || 1)}
                  className="w-full bg-transparent text-3xl font-bold text-center focus:outline-none"
                />
              </div>
            )}
            
            <div className="bg-stone-800/50 rounded-lg p-4 text-center">
              <label className="text-xs text-stone-400 block mb-1">Speed</label>
              <div className="flex items-center justify-center gap-1">
                <input 
                  type="text" 
                  value={character.speed || ''} 
                  onChange={(e) => updateField('speed', parseInt(e.target.value) || 30)}
                  className="w-16 bg-transparent text-3xl font-bold text-center focus:outline-none"
                />
                <span className="text-stone-500">ft</span>
              </div>
            </div>
            
            <div className="bg-stone-800/50 rounded-lg p-4 text-center">
              <label className="text-xs text-stone-400 block mb-1">Proficiency</label>
              <div className="text-3xl font-bold">+{getProfBonus()}</div>
            </div>
          </div>
        </div>

        {/* Ability Scores Card */}
        <div className="bg-stone-900/50 border border-stone-700/50 rounded-xl p-6">
          <h2 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
            <Icons.Dice /> Ability Scores
          </h2>
          
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(stat => (
              <div key={stat} className="bg-stone-800/50 rounded-lg p-4 text-center">
                <label className="text-xs text-stone-400 block mb-1">{stat.toUpperCase()}</label>
                <input 
                  type="text" 
                  value={character[stat] || 10} 
                  onChange={(e) => updateField(stat, parseInt(e.target.value) || 10)}
                  className="w-full bg-transparent text-2xl font-bold text-center focus:outline-none"
                />
                <div className="text-lg text-stone-400">{getMod(character[stat])}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Spellcasting Card */}
        <div className="bg-stone-900/50 border border-stone-700/50 rounded-xl p-6">
          <h2 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
            <Icons.Sparkles /> Spellcasting
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-stone-400 block mb-1">Spellcasting Ability</label>
              <select 
                value={character.spellStat || ''} 
                onChange={(e) => updateField('spellStat', e.target.value || null)}
                className="w-full bg-stone-800 border border-stone-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
              >
                <option value="">None</option>
                <option value="int">Intelligence</option>
                <option value="wis">Wisdom</option>
                <option value="cha">Charisma</option>
              </select>
            </div>
            
            {spellDC && (
              <>
                <div className="bg-purple-900/30 rounded-lg p-4 text-center">
                  <label className="text-xs text-stone-400 block mb-1">Spell Save DC</label>
                  <div className="text-3xl font-bold text-purple-400">{spellDC}</div>
                </div>
                <div className="bg-purple-900/30 rounded-lg p-4 text-center">
                  <label className="text-xs text-stone-400 block mb-1">Spell Attack</label>
                  <div className="text-3xl font-bold text-purple-400">{spellAttack}</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Resources (Party only) */}
        {isParty && (
          <div className="bg-stone-900/50 border border-stone-700/50 rounded-xl p-6">
            <h2 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
              <Icons.Sparkles /> Resources
            </h2>
            <ResourceTracker 
              resources={character.resources || []} 
              onChange={(resources) => updateField('resources', resources)} 
            />
          </div>
        )}

        {/* Items (Party only) */}
        {isParty && (
          <div className="bg-stone-900/50 border border-stone-700/50 rounded-xl p-6">
            <h2 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
              <Icons.Book /> Items & Equipment
            </h2>
            <ItemTracker 
              items={character.items || []} 
              onChange={(items) => updateField('items', items)} 
            />
          </div>
        )}

        {/* Actions */}
        <div className="bg-stone-900/50 border border-stone-700/50 rounded-xl p-6">
          <h2 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
            <Icons.Sword /> Actions & Abilities
          </h2>
          <ActionTracker 
            actions={character.actions || []} 
            onChange={(actions) => updateField('actions', actions)} 
          />
        </div>

        {/* Notes */}
        <div className="bg-stone-900/50 border border-stone-700/50 rounded-xl p-6">
          <h2 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
            <Icons.Book /> Notes
          </h2>
          <textarea 
            value={character.notes || ''} 
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Add notes about this character..."
            className="w-full bg-stone-800 border border-stone-600 rounded-lg px-4 py-3 h-32 resize-none focus:outline-none focus:border-amber-500"
          />
        </div>

      </main>
    </div>
  );
}
