'use client';

import { useState } from 'react';
import Icons from '../../../components/Icons';

const COMMON_FEATS = [
  { name: 'Alert', description: 'You gain a +5 bonus to Initiative. You can\'t be Surprised while you are conscious. Other creatures don\'t gain Advantage on attack rolls against you as a result of being hidden from you.' },
  { name: 'Crossbow Expert', description: 'You ignore the Loading property of crossbows. Being within 5 ft of a hostile creature doesn\'t impose Disadvantage on your ranged attack rolls. When you use the Attack action and attack with a one-handed weapon, you can use a Bonus Action to attack with a hand crossbow you are holding.' },
  { name: 'Defensive Duelist', description: 'When you are wielding a Finesse weapon and another creature hits you with a melee attack, you can use your Reaction to add your Proficiency Bonus to your AC for that attack, potentially causing it to miss you.' },
  { name: 'Dual Wielder', description: 'You gain a +1 bonus to AC while you are wielding a separate melee weapon in each hand. You can use Two-Weapon Fighting even when the melee weapons you are wielding aren\'t Light. You can draw or stow two one-handed weapons when you would normally be able to draw or stow only one.' },
  { name: 'Eldritch Adept', description: 'You learn one Eldritch Invocation option of your choice from the Warlock class. If the invocation has a prerequisite, you can choose that invocation only if you\'re a Warlock.' },
  { name: 'Fey Touched', description: 'You learn Misty Step and one 1st-level Divination or Enchantment spell. You can cast each once per Long Rest without a spell slot. Your spellcasting ability is the one increased by this feat.' },
  { name: 'Great Weapon Master', description: 'When you score a Critical Hit with a melee weapon or reduce a creature to 0 HP with one, you can make one melee weapon attack as a Bonus Action. Before you make a melee attack with a Heavy weapon, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack\'s damage.' },
  { name: 'Lucky', description: 'You have 3 Luck Points. Whenever you make an attack roll, ability check, or saving throw, you can spend 1 Luck Point to roll an additional d20 and choose which d20 to use. You regain expended Luck Points when you finish a Long Rest.' },
  { name: 'Magic Initiate', description: 'You learn two cantrips and one 1st-level spell from a class spell list of your choice. You can cast the 1st-level spell once per Long Rest without a spell slot.' },
  { name: 'Mobile', description: 'Your speed increases by 10 ft. When you use Dash, difficult terrain doesn\'t cost extra movement. When you make a melee attack against a creature, you don\'t provoke Opportunity Attacks from that creature for the rest of the turn.' },
  { name: 'Observant', description: 'You have a +5 bonus to your passive Wisdom (Perception) and passive Intelligence (Investigation) scores. You can read lips if you can see the creature\'s mouth and it is speaking a language you know.' },
  { name: 'Polearm Master', description: 'When you take the Attack action and attack with only a Glaive, Halberd, Quarterstaff, or Spear, you can use a Bonus Action to make a melee attack with the opposite end (1d4 Bludgeoning). When a creature enters your reach, you can use your Reaction to make an Opportunity Attack with that weapon.' },
  { name: 'Resilient', description: 'Choose one ability score. You gain proficiency in saving throws using that ability.' },
  { name: 'Sentinel', description: 'When you hit a creature with an Opportunity Attack, the creature\'s speed becomes 0 for the rest of the turn. Creatures provoke Opportunity Attacks from you even if they take the Disengage action. When a creature within 5 ft makes an attack against a target other than you, you can use your Reaction to make a melee attack against the attacking creature.' },
  { name: 'Shadow Touched', description: 'You learn Invisibility and one 1st-level Illusion or Necromancy spell. You can cast each once per Long Rest without a spell slot. Your spellcasting ability is the one increased by this feat.' },
  { name: 'Sharpshooter', description: 'Attacking at long range doesn\'t impose Disadvantage on your ranged weapon attack rolls. Your ranged weapon attacks ignore Half and Three-Quarters Cover. Before you make an attack with a ranged weapon, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the attack\'s damage.' },
  { name: 'Shield Master', description: 'If you take the Attack action, you can use a Bonus Action to try to Shove a creature within 5 ft with your Shield. If you aren\'t Incapacitated, you can add your Shield\'s AC bonus to Dexterity saves against effects that target only you. If you succeed on the save, you can use your Reaction to take no damage (instead of half).' },
  { name: 'Skilled', description: 'You gain proficiency in any combination of three skills or tools of your choice.' },
  { name: 'Tavern Brawler', description: 'You are proficient with improvised weapons. Your unarmed strike uses a d4 for damage. When you hit with an unarmed strike or improvised weapon on your turn, you can use a Bonus Action to attempt to Grapple the target.' },
  { name: 'Tough', description: 'Your HP maximum increases by an amount equal to twice your level when you gain this feat. Whenever you gain a level thereafter, your HP maximum increases by an additional 2 HP.' },
  { name: 'War Caster', description: 'You have Advantage on Constitution saves to maintain Concentration on a spell. You can perform somatic components with weapons or a Shield in hand. When a creature provokes an Opportunity Attack from you, you can cast a spell at the creature instead of making an Opportunity Attack. The spell must have a casting time of 1 action and target only that creature.' },
];

export default function FeatsTab({ character, onUpdate }) {
  const feats = character.feats || [];
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  const addFeat = (feat) => {
    onUpdate('feats', [...feats, { id: Date.now(), ...feat }]);
  };

  const removeFeat = (id) => {
    onUpdate('feats', feats.filter(f => f.id !== id));
  };

  const updateFeat = (id, field, value) => {
    onUpdate('feats', feats.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const filteredFeats = COMMON_FEATS.filter(f => {
    if (!searchQuery) return true;
    return f.name.toLowerCase().includes(searchQuery.toLowerCase());
  }).filter(f => !feats.some(existing => existing.name === f.name));

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-stone-400">{feats.length} Feat{feats.length !== 1 ? 's' : ''}</h3>
        <button onClick={() => setShowAdd(true)} className="px-3 py-1 rounded bg-amber-800 hover:bg-amber-700 text-xs flex items-center gap-1">
          <Icons.Plus /> Add Feat
        </button>
      </div>

      {/* Current Feats */}
      {feats.length === 0 && !showAdd && (
        <div className="text-center text-stone-500 py-8">No feats yet. Click "Add Feat" to get started.</div>
      )}

      <div className="space-y-2">
        {feats.map(feat => (
          <div key={feat.id} className="bg-stone-800 rounded-lg p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-medium text-amber-300">{feat.name}</h4>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">{feat.description}</p>
                {feat.notes && <p className="text-xs text-stone-500 mt-1 italic">{feat.notes}</p>}
              </div>
              <button onClick={() => removeFeat(feat.id)} className="text-red-500/50 hover:text-red-400 text-sm shrink-0">×</button>
            </div>
            <div className="mt-2">
              <input 
                type="text" 
                value={feat.notes || ''} 
                onChange={(e) => updateFeat(feat.id, 'notes', e.target.value)}
                placeholder="Notes (e.g. chose WIS for Resilient)..."
                className="w-full bg-stone-900/50 border border-stone-700/50 rounded px-2 py-1 text-xs text-stone-400 focus:outline-none focus:border-amber-700/50"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add Feat Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-stone-900 border border-stone-700 rounded-xl p-4 w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-lg">Add Feat</h3>
              <button onClick={() => setShowAdd(false)} className="text-stone-400 hover:text-stone-200">×</button>
            </div>

            {/* Search */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feats..."
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-amber-600"
              autoFocus
            />

            {/* Feat List */}
            <div className="flex-1 overflow-y-auto space-y-1 mb-3 min-h-0">
              {filteredFeats.map(feat => (
                <button
                  key={feat.name}
                  onClick={() => { addFeat(feat); setShowAdd(false); setSearchQuery(''); }}
                  className="w-full text-left p-2 rounded-lg hover:bg-stone-800 transition-colors"
                >
                  <div className="font-medium text-sm text-amber-300">{feat.name}</div>
                  <div className="text-xs text-stone-500 line-clamp-2">{feat.description}</div>
                </button>
              ))}
              {filteredFeats.length === 0 && searchQuery && (
                <div className="text-center text-stone-500 py-4 text-sm">No matching feats</div>
              )}
            </div>

            {/* Custom Feat */}
            <div className="border-t border-stone-700 pt-3">
              <div className="text-xs text-stone-500 mb-2">Or add a custom feat:</div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Feat name"
                  className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-amber-600"
                />
                <textarea
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="Description..."
                  rows={2}
                  className="w-full bg-stone-800 border border-stone-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-amber-600 resize-none"
                />
                <button
                  onClick={() => {
                    if (customName.trim()) {
                      addFeat({ name: customName, description: customDesc });
                      setCustomName('');
                      setCustomDesc('');
                      setShowAdd(false);
                    }
                  }}
                  disabled={!customName.trim()}
                  className={`w-full py-1.5 rounded text-sm font-medium ${customName.trim() ? 'bg-amber-700 hover:bg-amber-600' : 'bg-stone-700 text-stone-500 cursor-not-allowed'}`}
                >
                  Add Custom Feat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
