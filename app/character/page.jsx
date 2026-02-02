'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Icons from '../components/Icons';
import { HpBar } from '../components/ui';

const SKILLS = [
  { name: 'Acrobatics', stat: 'dex' }, { name: 'Animal Handling', stat: 'wis' }, { name: 'Arcana', stat: 'int' },
  { name: 'Athletics', stat: 'str' }, { name: 'Deception', stat: 'cha' }, { name: 'History', stat: 'int' },
  { name: 'Insight', stat: 'wis' }, { name: 'Intimidation', stat: 'cha' }, { name: 'Investigation', stat: 'int' },
  { name: 'Medicine', stat: 'wis' }, { name: 'Nature', stat: 'int' }, { name: 'Perception', stat: 'wis' },
  { name: 'Performance', stat: 'cha' }, { name: 'Persuasion', stat: 'cha' }, { name: 'Religion', stat: 'int' },
  { name: 'Sleight of Hand', stat: 'dex' }, { name: 'Stealth', stat: 'dex' }, { name: 'Survival', stat: 'wis' },
];

// Resource row with local editing state for better UX
const ResourceRow = ({ resource, onUpdate, onRemove }) => {
  const [editCurrent, setEditCurrent] = useState(String(resource.current));
  const [editMax, setEditMax] = useState(String(resource.max));
  const [isEditingCurrent, setIsEditingCurrent] = useState(false);
  const [isEditingMax, setIsEditingMax] = useState(false);

  // Sync local state when resource changes externally (e.g., +/- buttons)
  useEffect(() => {
    if (!isEditingCurrent) setEditCurrent(String(resource.current));
  }, [resource.current, isEditingCurrent]);
  
  useEffect(() => {
    if (!isEditingMax) setEditMax(String(resource.max));
  }, [resource.max, isEditingMax]);

  const handleCurrentBlur = () => {
    setIsEditingCurrent(false);
    const num = parseInt(editCurrent);
    if (!isNaN(num)) {
      const validMax = Math.max(1, resource.max);
      onUpdate('current', Math.max(0, Math.min(validMax, num)));
    } else {
      setEditCurrent(String(resource.current));
    }
  };

  const handleMaxBlur = () => {
    setIsEditingMax(false);
    const num = parseInt(editMax);
    if (!isNaN(num) && num >= 1) {
      onUpdate('max', num);
      // Also adjust current if it exceeds new max
      if (resource.current > num) {
        onUpdate('current', num);
      }
    } else {
      setEditMax(String(resource.max));
    }
  };

  const handleKeyDown = (e, onBlur) => {
    if (e.key === 'Enter') onBlur();
    if (e.key === 'Escape') {
      setEditCurrent(String(resource.current));
      setEditMax(String(resource.max));
      setIsEditingCurrent(false);
      setIsEditingMax(false);
    }
  };

  return (
    <div className="bg-stone-800 rounded-lg p-3 flex items-center gap-4">
      <input 
        type="text" 
        value={resource.name} 
        onChange={(e) => onUpdate('name', e.target.value)}
        className="flex-1 bg-transparent font-medium focus:outline-none" 
        placeholder="Resource name (e.g., Wild Shape, Rage, Spell Slots)" 
      />
      <div className="flex items-center gap-2">
        <button 
          onClick={() => onUpdate('current', Math.max(0, resource.current - 1))}
          className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600 text-lg"
        >−</button>
        <div className="flex items-center gap-1">
          <input 
            type="text" 
            value={editCurrent} 
            onChange={(e) => setEditCurrent(e.target.value)}
            onFocus={() => setIsEditingCurrent(true)}
            onBlur={handleCurrentBlur}
            onKeyDown={(e) => handleKeyDown(e, handleCurrentBlur)}
            className="w-12 bg-stone-700 rounded px-2 py-1 text-center font-mono text-lg focus:outline-none focus:ring-1 focus:ring-amber-500" 
          />
          <span className="text-stone-500">/</span>
          <input 
            type="text" 
            value={editMax} 
            onChange={(e) => setEditMax(e.target.value)}
            onFocus={() => setIsEditingMax(true)}
            onBlur={handleMaxBlur}
            onKeyDown={(e) => handleKeyDown(e, handleMaxBlur)}
            className="w-12 bg-stone-700 rounded px-2 py-1 text-center font-mono text-lg focus:outline-none focus:ring-1 focus:ring-amber-500" 
          />
        </div>
        <button 
          onClick={() => onUpdate('current', Math.min(resource.max, resource.current + 1))}
          className="w-8 h-8 rounded bg-stone-700 hover:bg-stone-600 text-lg"
        >+</button>
        <button 
          onClick={() => onUpdate('current', resource.max)}
          className="px-2 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-xs"
        >Reset</button>
        <button onClick={onRemove} className="text-red-500 hover:text-red-400 text-lg">×</button>
      </div>
    </div>
  );
};

export default function CharacterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const type = searchParams.get('type');
  
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('resources');
  const [showProfModal, setShowProfModal] = useState(false);

  useEffect(() => {
    const loadCharacter = async () => {
      if (!id || !type) { setLoading(false); return; }
      try {
        const endpoint = type === 'party' ? '/api/party' : '/api/templates';
        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          const found = data.find(c => c.id === id);
          if (found) {
            if (!found.skillProficiencies) found.skillProficiencies = {};
            if (!found.saveProficiencies) found.saveProficiencies = {};
            if (!found.features) found.features = [];
            if (!found.spells) found.spells = [];
            if (!found.inventory) found.inventory = [];
            setCharacter(found);
          }
        }
      } catch (err) { console.error('Error loading character:', err); }
      setLoading(false);
    };
    loadCharacter();
  }, [id, type]);

  const updateField = (field, value) => {
    setCharacter(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const saveCharacter = async () => {
    if (!character) return;
    try {
      const endpoint = type === 'party' ? '/api/party' : '/api/templates';
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        const updated = data.map(c => c.id === character.id ? character : c);
        await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
        setSaveStatus('Saved!');
        setHasChanges(false);
        setTimeout(() => setSaveStatus(''), 2000);
      }
    } catch (err) { console.error('Error saving:', err); setSaveStatus('Error'); }
  };

  useEffect(() => {
    if (!hasChanges || !character) return;
    const timeout = setTimeout(saveCharacter, 1500);
    return () => clearTimeout(timeout);
  }, [character, hasChanges]);

  const getMod = (score) => Math.floor(((parseInt(score) || 10) - 10) / 2);
  const formatMod = (mod) => mod >= 0 ? `+${mod}` : `${mod}`;
  const getProfBonus = () => {
    if (character?.level) return Math.floor((parseInt(character.level) - 1) / 4) + 2;
    if (character?.cr) {
      const cr = character.cr;
      if (['0', '1/8', '1/4', '1/2'].includes(cr)) return 2;
      const crNum = parseInt(cr) || 1;
      return crNum <= 4 ? 2 : crNum <= 8 ? 3 : crNum <= 12 ? 4 : crNum <= 16 ? 5 : crNum <= 20 ? 6 : 7;
    }
    return 2;
  };
  const getSkillBonus = (skill) => getMod(character[skill.stat]) + ((character.skillProficiencies?.[skill.name] || 0) * getProfBonus());
  const getSaveBonus = (stat) => getMod(character[stat]) + ((character.saveProficiencies?.[stat] || 0) * getProfBonus());
  const setSkillProf = (name, value) => updateField('skillProficiencies', { ...character.skillProficiencies, [name]: value });
  const setSaveProf = (stat, value) => updateField('saveProficiencies', { ...character.saveProficiencies, [stat]: value });
  const getSpellDC = () => character?.spellStat ? 8 + getProfBonus() + getMod(character[character.spellStat]) : null;
  const getSpellAttack = () => character?.spellStat ? getProfBonus() + getMod(character[character.spellStat]) : null;

  // Feature helpers
  const addFeature = () => {
    const newFeature = { id: Date.now(), name: '', description: '', source: '' };
    updateField('features', [...(character.features || []), newFeature]);
  };
  const updateFeature = (id, field, value) => {
    updateField('features', character.features.map(f => f.id === id ? { ...f, [field]: value } : f));
  };
  const removeFeature = (id) => updateField('features', character.features.filter(f => f.id !== id));

  // Resource helpers
  const addResource = () => {
    const newResource = { id: Date.now(), name: '', current: 1, max: 1 };
    updateField('resources', [...(character.resources || []), newResource]);
  };
  const updateResource = (index, field, value) => {
    const updated = [...(character.resources || [])];
    updated[index] = { ...updated[index], [field]: value };
    updateField('resources', updated);
  };
  const removeResource = (index) => {
    const updated = [...(character.resources || [])];
    updated.splice(index, 1);
    updateField('resources', updated);
  };

  // Inventory helpers
  const addItem = () => {
    const newItem = { id: Date.now(), name: '', quantity: 1, weight: '', description: '' };
    updateField('inventory', [...(character.inventory || []), newItem]);
  };
  const updateItem = (id, field, value) => {
    updateField('inventory', character.inventory.map(i => i.id === id ? { ...i, [field]: value } : i));
  };
  const removeItem = (id) => updateField('inventory', character.inventory.filter(i => i.id !== id));

  // Spell helpers
  const addSpell = () => {
    const newSpell = { id: Date.now(), name: '', level: 0, school: '', castTime: '1 action', range: '', duration: '', description: '' };
    updateField('spells', [...(character.spells || []), newSpell]);
  };
  const updateSpell = (id, field, value) => {
    updateField('spells', character.spells.map(s => s.id === id ? { ...s, [field]: value } : s));
  };
  const removeSpell = (id) => updateField('spells', character.spells.filter(s => s.id !== id));

  if (loading) return <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center">Loading...</div>;
  if (!character) return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-stone-400 mb-4">Character not found</div>
        <button onClick={() => router.back()} className="px-4 py-2 bg-amber-700 rounded-lg">Back</button>
      </div>
    </div>
  );

  const isParty = type === 'party';
  const profBonus = getProfBonus();
  const spellDC = getSpellDC();
  const spellAttack = getSpellAttack();

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Proficiency Modal */}
      {showProfModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowProfModal(false)}>
          <div className="bg-stone-900 border border-stone-700 rounded-xl max-w-3xl w-full max-h-[85vh] overflow-auto m-4" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-stone-700 flex items-center justify-between sticky top-0 bg-stone-900 z-10">
              <h2 className="text-lg font-bold text-amber-400">Proficiencies, Skills & Advantages</h2>
              <button onClick={() => setShowProfModal(false)} className="text-stone-400 hover:text-white text-xl">×</button>
            </div>
            
            <div className="p-4 space-y-6">
              {/* Saving Throws */}
              <div>
                <h3 className="text-sm font-bold text-stone-400 mb-3 uppercase tracking-wide">Saving Throws</h3>
                <div className="grid grid-cols-6 gap-2">
                  {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(stat => {
                    const prof = character.saveProficiencies?.[stat] || 0;
                    return (
                      <div 
                        key={stat} 
                        onClick={() => setSaveProf(stat, prof ? 0 : 1)}
                        className={`rounded p-3 cursor-pointer text-center transition-colors ${prof ? 'bg-emerald-900/40 border border-emerald-700/50' : 'bg-stone-800 hover:bg-stone-700'}`}
                      >
                        <div className="text-xs text-stone-500 uppercase">{stat}</div>
                        <div className={`text-lg font-bold ${prof ? 'text-emerald-400' : ''}`}>{formatMod(getSaveBonus(stat))}</div>
                        <div className="text-xs text-stone-500">{prof ? '● Prof' : '○'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Skills - D&D Beyond Style */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wide">Skills</h3>
                  <div className="text-xs text-stone-500">Click row to cycle: ○ → ● → ◆</div>
                </div>
                <div className="bg-stone-800 rounded-lg overflow-hidden">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-stone-500 uppercase border-b border-stone-700">
                    <div className="col-span-1">Prof</div>
                    <div className="col-span-2">Mod</div>
                    <div className="col-span-7">Skill</div>
                    <div className="col-span-2 text-right">Bonus</div>
                  </div>
                  {/* Skill Rows */}
                  <div className="divide-y divide-stone-700/50">
                    {SKILLS.map(skill => {
                      const prof = character.skillProficiencies?.[skill.name] || 0;
                      const bonus = getSkillBonus(skill);
                      return (
                        <div 
                          key={skill.name} 
                          onClick={() => setSkillProf(skill.name, (prof + 1) % 3)}
                          className={`grid grid-cols-12 gap-2 px-3 py-2 cursor-pointer transition-colors hover:bg-stone-700/50 ${prof > 0 ? 'bg-stone-750' : ''}`}
                        >
                          <div className="col-span-1">
                            <span className={prof === 2 ? 'text-amber-400' : prof === 1 ? 'text-emerald-400' : 'text-stone-600'}>
                              {prof === 2 ? '●' : prof === 1 ? '●' : '○'}
                            </span>
                          </div>
                          <div className="col-span-2 text-stone-500 uppercase text-sm font-medium">{skill.stat}</div>
                          <div className={`col-span-7 ${prof > 0 ? 'font-medium' : 'text-stone-300'}`}>{skill.name}</div>
                          <div className={`col-span-2 text-right font-mono ${prof === 2 ? 'text-amber-400 font-bold' : prof === 1 ? 'text-emerald-400 font-bold' : 'text-stone-400'}`}>
                            <span className="inline-block border border-stone-600 rounded px-2 py-0.5 min-w-[3rem]">
                              {bonus >= 0 ? '+' : ''}{bonus}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Advantages & Resistances */}
              <div>
                <h3 className="text-sm font-bold text-stone-400 mb-3 uppercase tracking-wide">Advantages & Resistances</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(character.advantages || []).map((adv, i) => (
                    <span 
                      key={i} 
                      className="bg-blue-900/40 text-blue-300 rounded px-3 py-1.5 text-sm flex items-center gap-2"
                    >
                      {adv}
                      <button 
                        onClick={() => updateField('advantages', character.advantages.filter((_, idx) => idx !== i))}
                        className="text-blue-400 hover:text-blue-200"
                      >×</button>
                    </span>
                  ))}
                  {(character.advantages || []).length === 0 && (
                    <span className="text-sm text-stone-500 italic">None added yet</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 bg-stone-800 border border-stone-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    onChange={(e) => {
                      if (e.target.value) {
                        const current = character.advantages || [];
                        if (!current.includes(e.target.value)) {
                          updateField('advantages', [...current, e.target.value]);
                        }
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">Add from list...</option>
                    <optgroup label="Saving Throw Advantages">
                      <option value="Adv. on STR saves">Adv. on STR saves</option>
                      <option value="Adv. on DEX saves">Adv. on DEX saves</option>
                      <option value="Adv. on CON saves">Adv. on CON saves</option>
                      <option value="Adv. on INT saves">Adv. on INT saves</option>
                      <option value="Adv. on WIS saves">Adv. on WIS saves</option>
                      <option value="Adv. on CHA saves">Adv. on CHA saves</option>
                    </optgroup>
                    <optgroup label="Condition Advantages">
                      <option value="Adv. vs Charmed">Adv. vs Charmed</option>
                      <option value="Adv. vs Frightened">Adv. vs Frightened</option>
                      <option value="Adv. vs Paralyzed">Adv. vs Paralyzed</option>
                      <option value="Adv. vs Poisoned">Adv. vs Poisoned</option>
                      <option value="Adv. vs Stunned">Adv. vs Stunned</option>
                      <option value="Adv. vs Sleep">Adv. vs Sleep</option>
                      <option value="Immune to Charmed">Immune to Charmed</option>
                      <option value="Immune to Frightened">Immune to Frightened</option>
                      <option value="Immune to Sleep">Immune to Sleep</option>
                    </optgroup>
                    <optgroup label="Damage Resistances">
                      <option value="Resist Poison">Resist Poison</option>
                      <option value="Resist Fire">Resist Fire</option>
                      <option value="Resist Cold">Resist Cold</option>
                      <option value="Resist Lightning">Resist Lightning</option>
                      <option value="Resist Necrotic">Resist Necrotic</option>
                      <option value="Resist Radiant">Resist Radiant</option>
                      <option value="Resist Bludgeoning">Resist Bludgeoning</option>
                      <option value="Resist Piercing">Resist Piercing</option>
                      <option value="Resist Slashing">Resist Slashing</option>
                    </optgroup>
                    <optgroup label="Other">
                      <option value="Adv. vs Magic">Adv. vs Magic</option>
                      <option value="Adv. on Concentration">Adv. on Concentration</option>
                      <option value="Adv. on Death Saves">Adv. on Death Saves</option>
                      <option value="Darkvision 60ft">Darkvision 60ft</option>
                      <option value="Darkvision 120ft">Darkvision 120ft</option>
                    </optgroup>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Or type custom..."
                    className="flex-1 bg-stone-800 border border-stone-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        const current = character.advantages || [];
                        if (!current.includes(e.target.value.trim())) {
                          updateField('advantages', [...current, e.target.value.trim()]);
                        }
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-stone-700 text-xs text-stone-500 sticky bottom-0 bg-stone-900">
              ○ = No proficiency | ● = Proficient (+{profBonus}) | ◆ = Expertise (+{profBonus * 2})
            </div>
          </div>
        </div>
      )}

      {/* Compact Header */}
      <header className="border-b border-stone-800 bg-stone-900 sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1.5 rounded bg-stone-800 hover:bg-stone-700">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
            </button>
            <div className={`p-1.5 rounded ${isParty ? 'bg-emerald-900/50' : 'bg-red-900/50'}`}>
              {isParty ? <Icons.Shield /> : <Icons.Skull />}
            </div>
            <div>
              <input type="text" value={character.name || ''} onChange={(e) => updateField('name', e.target.value)}
                className="bg-transparent text-lg font-bold focus:outline-none border-b border-transparent hover:border-stone-600 focus:border-amber-500" />
              <span className="text-xs text-stone-500 ml-2">{character.class ? `${character.class} ${character.level}` : `CR ${character.cr}`}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saveStatus && <span className="text-xs text-amber-400">{saveStatus}</span>}
            <button onClick={saveCharacter} className="px-3 py-1 bg-amber-700 hover:bg-amber-600 rounded text-sm">Save</button>
          </div>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto p-4 space-y-4">
        
        {/* Top Stats Bar - Horizontal */}
        <div className="bg-stone-900 rounded-lg p-4">
          <div className="flex items-center gap-6">
            {/* HP (if party) */}
            {isParty && (
              <div className="w-48">
                <HpBar current={character.currentHp} max={character.maxHp} onChange={(c, m) => { updateField('currentHp', c); updateField('maxHp', m); }} />
              </div>
            )}
            
            {/* AC, Speed, Init */}
            <div className="flex gap-2">
              <div className="bg-stone-800 rounded p-2 text-center w-16">
                <div className="text-[10px] text-stone-500">AC</div>
                <input type="text" value={character.ac || ''} onChange={(e) => updateField('ac', parseInt(e.target.value) || 10)}
                  className="w-full bg-transparent text-xl font-bold text-center focus:outline-none" />
              </div>
              <div className="bg-stone-800 rounded p-2 text-center w-16">
                <div className="text-[10px] text-stone-500">Speed</div>
                <input type="text" value={character.speed || ''} onChange={(e) => updateField('speed', parseInt(e.target.value) || 30)}
                  className="w-full bg-transparent text-xl font-bold text-center focus:outline-none" />
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
              {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(stat => {
                const statMod = getMod(character[stat]);
                return (
                  <div key={stat} className="bg-stone-800 rounded p-2 text-center w-16">
                    <div className="text-[10px] text-stone-500 uppercase">{stat}</div>
                    <input type="text" value={character[stat] || 10} onChange={(e) => updateField(stat, parseInt(e.target.value) || 10)}
                      className="w-full bg-transparent text-xl font-bold text-center focus:outline-none" />
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

        <div className="grid grid-cols-12 gap-4">
          
          {/* Left Column - Saves & Senses (2 cols) */}
          <div className="col-span-2 space-y-3">
            {/* Saving Throws Box */}
            <div className="bg-stone-900 rounded-lg overflow-hidden">
              <div className="p-2 border-b border-stone-700 text-center">
                <span className="text-xs text-stone-500 uppercase tracking-wide">Saving Throws</span>
              </div>
              <div className="p-2 space-y-1">
                {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(stat => {
                  const saveProf = character.saveProficiencies?.[stat] || 0;
                  return (
                    <div key={stat} className="flex items-center px-2 py-1 rounded hover:bg-stone-800/50">
                      <span className={`w-4 ${saveProf ? 'text-emerald-400' : 'text-stone-600'}`}>{saveProf ? '●' : '○'}</span>
                      <span className="text-sm text-stone-400 uppercase flex-1">{stat}</span>
                      <span className={`font-mono text-sm ${saveProf ? 'text-emerald-400' : 'text-stone-400'}`}>{formatMod(getSaveBonus(stat))}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Passive Senses */}
            <div className="bg-stone-900 rounded-lg overflow-hidden">
              <div className="p-2 border-b border-stone-700 text-center">
                <span className="text-xs text-stone-500 uppercase tracking-wide">Senses</span>
              </div>
              <div className="p-2 space-y-1">
                <div className="flex items-center px-2 py-1 bg-stone-800 rounded">
                  <span className="text-lg font-bold w-8">{10 + getSkillBonus(SKILLS.find(s => s.name === 'Perception'))}</span>
                  <span className="text-xs text-stone-400 uppercase">Passive Perception</span>
                </div>
                <div className="flex items-center px-2 py-1 bg-stone-800 rounded">
                  <span className="text-lg font-bold w-8">{10 + getSkillBonus(SKILLS.find(s => s.name === 'Investigation'))}</span>
                  <span className="text-xs text-stone-400 uppercase">Passive Investigation</span>
                </div>
                <div className="flex items-center px-2 py-1 bg-stone-800 rounded">
                  <span className="text-lg font-bold w-8">{10 + getSkillBonus(SKILLS.find(s => s.name === 'Insight'))}</span>
                  <span className="text-xs text-stone-400 uppercase">Passive Insight</span>
                </div>
              </div>
            </div>

            {/* Advantages (if any) */}
            {(character.advantages || []).length > 0 && (
              <div className="bg-stone-900 rounded-lg overflow-hidden">
                <div className="p-2 border-b border-stone-700 text-center">
                  <span className="text-xs text-stone-500 uppercase tracking-wide">Advantages</span>
                </div>
                <div className="p-2 flex flex-wrap gap-1">
                  {character.advantages.map((adv, i) => (
                    <span key={i} className="bg-blue-900/40 text-blue-300 rounded px-2 py-0.5 text-xs">{adv}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Skills Column (2 cols) */}
          <div className="col-span-2">
            <div className="bg-stone-900 rounded-lg overflow-hidden">
              <div className="p-2 border-b border-stone-700 flex items-center justify-between">
                <span className="text-xs text-stone-500 uppercase tracking-wide">Skills</span>
                <button onClick={() => setShowProfModal(true)} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
                  <Icons.Edit />
                </button>
              </div>
              
              {/* Skills Header */}
              <div className="grid grid-cols-12 gap-1 px-2 py-1 text-[10px] text-stone-500 uppercase border-b border-stone-800">
                <div className="col-span-1">P</div>
                <div className="col-span-2">Mod</div>
                <div className="col-span-7">Skill</div>
                <div className="col-span-2 text-right">+/-</div>
              </div>
              
              {/* Skills List */}
              <div className="divide-y divide-stone-800/50">
                {SKILLS.map(skill => {
                  const prof = character.skillProficiencies?.[skill.name] || 0;
                  const bonus = getSkillBonus(skill);
                  return (
                    <div key={skill.name} className="grid grid-cols-12 gap-1 px-2 py-1.5 hover:bg-stone-800/30 items-center">
                      <div className="col-span-1">
                        <span className={prof === 2 ? 'text-amber-400' : prof === 1 ? 'text-emerald-400' : 'text-stone-600'}>
                          {prof > 0 ? '●' : '○'}
                        </span>
                      </div>
                      <div className="col-span-2 text-[10px] text-stone-500 uppercase font-medium">{skill.stat}</div>
                      <div className={`col-span-7 text-sm truncate ${prof > 0 ? 'text-stone-200' : 'text-stone-400'}`}>{skill.name}</div>
                      <div className={`col-span-2 text-right font-mono text-sm ${prof === 2 ? 'text-amber-400' : prof === 1 ? 'text-emerald-400' : 'text-stone-400'}`}>
                        <span className="inline-block border border-stone-700 rounded px-1.5 min-w-[2rem] text-center">
                          {bonus >= 0 ? '+' : ''}{bonus}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content Area (8 cols) */}
          <div className="col-span-8">
            {/* Tab Navigation */}
            <div className="flex gap-1 mb-3 border-b border-stone-800 pb-2">
              {['resources', 'inventory', 'spells', 'features', 'background', 'notes'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-t text-sm font-medium capitalize ${activeTab === tab ? 'bg-stone-800 text-amber-400' : 'text-stone-400 hover:text-stone-200'}`}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-stone-900 rounded-lg p-4 min-h-[500px]">

              {/* RESOURCES TAB */}
              {activeTab === 'resources' && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm text-stone-400">Track spell slots, abilities, wild shapes, and other limited-use resources.</p>
                    <button onClick={addResource} className="px-3 py-1 rounded bg-amber-800 hover:bg-amber-700 text-xs flex items-center gap-1">
                      <Icons.Plus /> Add Resource
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {(character.resources || []).map((resource, i) => (
                      <ResourceRow 
                        key={resource.id || i} 
                        resource={resource} 
                        onUpdate={(field, value) => updateResource(i, field, value)}
                        onRemove={() => removeResource(i)}
                      />
                    ))}
                  </div>
                  {(character.resources || []).length === 0 && <div className="text-center text-stone-500 py-8">No resources yet. Add things like spell slots, wild shapes, rage uses, etc.</div>}
                </div>
              )}

              {/* INVENTORY TAB */}
              {activeTab === 'inventory' && (
                <div>
                  <div className="flex justify-end mb-3">
                    <button onClick={addItem} className="px-3 py-1 rounded bg-amber-800 hover:bg-amber-700 text-xs flex items-center gap-1">
                      <Icons.Plus /> Add Item
                    </button>
                  </div>
                  
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-stone-500 border-b border-stone-700">
                        <th className="pb-2 font-medium">Item</th>
                        <th className="pb-2 font-medium w-16">Qty</th>
                        <th className="pb-2 font-medium w-20">Weight</th>
                        <th className="pb-2 font-medium">Description</th>
                        <th className="pb-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(character.inventory || []).map(item => (
                        <tr key={item.id} className="border-b border-stone-800 hover:bg-stone-800/50">
                          <td className="py-2">
                            <input type="text" value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                              className="bg-transparent focus:outline-none w-full" placeholder="Item name" />
                          </td>
                          <td>
                            <input type="text" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                              className="bg-stone-800 rounded px-2 py-1 w-12 text-center focus:outline-none" />
                          </td>
                          <td>
                            <input type="text" value={item.weight} onChange={(e) => updateItem(item.id, 'weight', e.target.value)}
                              className="bg-transparent focus:outline-none w-full text-center" placeholder="1 lb" />
                          </td>
                          <td>
                            <input type="text" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                              className="bg-transparent focus:outline-none w-full text-stone-400" placeholder="Description..." />
                          </td>
                          <td>
                            <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-400">×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(character.inventory || []).length === 0 && <div className="text-center text-stone-500 py-8">No items yet.</div>}
                </div>
              )}

              {/* SPELLS TAB */}
              {activeTab === 'spells' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="text-stone-500">Spellcasting: </span>
                        <select value={character.spellStat || ''} onChange={(e) => updateField('spellStat', e.target.value || null)}
                          className="bg-stone-800 rounded px-2 py-1 text-sm">
                          <option value="">None</option>
                          <option value="int">INT</option>
                          <option value="wis">WIS</option>
                          <option value="cha">CHA</option>
                        </select>
                      </div>
                      {spellDC && <span className="text-purple-400 text-sm">DC {spellDC} | Attack {formatMod(spellAttack)}</span>}
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
              )}

              {/* FEATURES TAB */}
              {activeTab === 'features' && (
                <div>
                  <div className="flex justify-end mb-3">
                    <button onClick={addFeature} className="px-3 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-xs flex items-center gap-1">
                      <Icons.Plus /> Add Feature
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {(character.features || []).map(feature => (
                      <div key={feature.id} className="bg-stone-800 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <input type="text" value={feature.name} onChange={(e) => updateFeature(feature.id, 'name', e.target.value)}
                            className="bg-transparent font-bold focus:outline-none flex-1" placeholder="Feature name" />
                          <input type="text" value={feature.source} onChange={(e) => updateFeature(feature.id, 'source', e.target.value)}
                            className="bg-stone-700 rounded px-2 py-0.5 text-xs text-stone-400 w-32 focus:outline-none" placeholder="Source" />
                          <button onClick={() => removeFeature(feature.id)} className="text-red-500 hover:text-red-400">×</button>
                        </div>
                        <textarea value={feature.description} onChange={(e) => updateFeature(feature.id, 'description', e.target.value)}
                          className="w-full bg-transparent text-sm text-stone-300 focus:outline-none resize-none" rows={2} placeholder="Description..." />
                      </div>
                    ))}
                  </div>
                  {(character.features || []).length === 0 && <div className="text-center text-stone-500 py-8">No features yet.</div>}
                </div>
              )}

              {/* BACKGROUND TAB */}
              {activeTab === 'background' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-stone-500">Background</label>
                    <input type="text" value={character.background || ''} onChange={(e) => updateField('background', e.target.value)}
                      className="w-full bg-stone-800 rounded px-3 py-2 focus:outline-none" placeholder="e.g., Soldier, Sage..." />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500">Race</label>
                    <input type="text" value={character.race || ''} onChange={(e) => updateField('race', e.target.value)}
                      className="w-full bg-stone-800 rounded px-3 py-2 focus:outline-none" placeholder="e.g., Human, Elf..." />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500">Alignment</label>
                    <input type="text" value={character.alignment || ''} onChange={(e) => updateField('alignment', e.target.value)}
                      className="w-full bg-stone-800 rounded px-3 py-2 focus:outline-none" placeholder="e.g., Neutral Good" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500">Languages</label>
                    <input type="text" value={character.languages || ''} onChange={(e) => updateField('languages', e.target.value)}
                      className="w-full bg-stone-800 rounded px-3 py-2 focus:outline-none" placeholder="Common, Elvish..." />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-stone-500">Personality Traits</label>
                    <textarea value={character.personality || ''} onChange={(e) => updateField('personality', e.target.value)}
                      className="w-full bg-stone-800 rounded px-3 py-2 h-20 resize-none focus:outline-none" placeholder="Personality traits..." />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500">Ideals</label>
                    <textarea value={character.ideals || ''} onChange={(e) => updateField('ideals', e.target.value)}
                      className="w-full bg-stone-800 rounded px-3 py-2 h-16 resize-none focus:outline-none" placeholder="Ideals..." />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500">Bonds</label>
                    <textarea value={character.bonds || ''} onChange={(e) => updateField('bonds', e.target.value)}
                      className="w-full bg-stone-800 rounded px-3 py-2 h-16 resize-none focus:outline-none" placeholder="Bonds..." />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-stone-500">Flaws</label>
                    <textarea value={character.flaws || ''} onChange={(e) => updateField('flaws', e.target.value)}
                      className="w-full bg-stone-800 rounded px-3 py-2 h-16 resize-none focus:outline-none" placeholder="Flaws..." />
                  </div>
                </div>
              )}

              {/* NOTES TAB */}
              {activeTab === 'notes' && (
                <div>
                  <textarea value={character.notes || ''} onChange={(e) => updateField('notes', e.target.value)}
                    className="w-full bg-stone-800 rounded px-4 py-3 h-[450px] resize-none focus:outline-none"
                    placeholder="Session notes, character backstory, goals, etc..." />
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
