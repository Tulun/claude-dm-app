'use client';

import { BACKGROUNDS } from '../constants';

export default function BackgroundTab({ character, onUpdate }) {
  const selectedBackground = BACKGROUNDS.find(b => b.name === character.background);

  const handleBackgroundChange = (backgroundName) => {
    onUpdate('background', backgroundName);
  };

  return (
    <div className="space-y-6">
      {/* Background Selection */}
      <div className="bg-stone-800 rounded-lg p-4">
        <h3 className="text-sm font-bold text-amber-400 mb-3">Background (2024)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-stone-500">Select Background</label>
            <select 
              value={character.background || ''} 
              onChange={(e) => handleBackgroundChange(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="">-- Select --</option>
              {BACKGROUNDS.map(bg => (
                <option key={bg.name} value={bg.name}>{bg.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-stone-500">Or Custom</label>
            <input 
              type="text" 
              value={character.background || ''} 
              onChange={(e) => onUpdate('background', e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 focus:outline-none focus:border-amber-500" 
              placeholder="Type custom background..." 
            />
          </div>
        </div>
        
        {selectedBackground && (
          <div className="mt-3 p-3 bg-stone-900 rounded-lg space-y-2">
            <div>
              <span className="text-xs text-stone-500">Skill Proficiencies: </span>
              <span className="text-sm text-blue-400 font-medium">{selectedBackground.skills.join(', ')}</span>
              <span className="text-xs text-stone-600 ml-2">(auto-applied)</span>
            </div>
            <div>
              <span className="text-xs text-stone-500">Origin Feat: </span>
              <span className="text-sm text-purple-400">{selectedBackground.feat}</span>
            </div>
            <div>
              <span className="text-xs text-stone-500">Ability Score Options: </span>
              <span className="text-xs text-amber-400">{selectedBackground.abilities.join(', ')}</span>
              <span className="text-xs text-stone-600 ml-2">(+2/+1 or +1/+1/+1)</span>
            </div>
          </div>
        )}
      </div>

      {/* Character Details */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-stone-500">Race / Species</label>
          <input type="text" value={character.race || ''} onChange={(e) => onUpdate('race', e.target.value)}
            className="w-full bg-stone-800 rounded px-3 py-2 focus:outline-none" placeholder="e.g., Human, Elf..." />
        </div>
        <div>
          <label className="text-xs text-stone-500">Alignment</label>
          <input type="text" value={character.alignment || ''} onChange={(e) => onUpdate('alignment', e.target.value)}
            className="w-full bg-stone-800 rounded px-3 py-2 focus:outline-none" placeholder="e.g., Neutral Good" />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-stone-500">Languages</label>
          <input type="text" value={character.languages || ''} onChange={(e) => onUpdate('languages', e.target.value)}
            className="w-full bg-stone-800 rounded px-3 py-2 focus:outline-none" placeholder="Common, Elvish..." />
        </div>
      </div>

      {/* Personality */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-stone-400">Personality</h3>
        <div>
          <label className="text-xs text-stone-500">Personality Traits</label>
          <textarea value={character.personality || ''} onChange={(e) => onUpdate('personality', e.target.value)}
            className="w-full bg-stone-800 rounded px-3 py-2 h-20 resize-none focus:outline-none" placeholder="Personality traits..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-stone-500">Ideals</label>
            <textarea value={character.ideals || ''} onChange={(e) => onUpdate('ideals', e.target.value)}
              className="w-full bg-stone-800 rounded px-3 py-2 h-16 resize-none focus:outline-none" placeholder="Ideals..." />
          </div>
          <div>
            <label className="text-xs text-stone-500">Bonds</label>
            <textarea value={character.bonds || ''} onChange={(e) => onUpdate('bonds', e.target.value)}
              className="w-full bg-stone-800 rounded px-3 py-2 h-16 resize-none focus:outline-none" placeholder="Bonds..." />
          </div>
        </div>
        <div>
          <label className="text-xs text-stone-500">Flaws</label>
          <textarea value={character.flaws || ''} onChange={(e) => onUpdate('flaws', e.target.value)}
            className="w-full bg-stone-800 rounded px-3 py-2 h-16 resize-none focus:outline-none" placeholder="Flaws..." />
        </div>
      </div>
    </div>
  );
}
