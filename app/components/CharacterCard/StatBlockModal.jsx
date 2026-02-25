'use client';

import Icons from '../Icons';

const StatBlockModal = ({ isOpen, onClose, character }) => {
  if (!isOpen || !character) return null;

  const getMod = (score) => {
    const mod = Math.floor((parseInt(score || 10) - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const stats = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const statLabels = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[#fdf1dc] text-[#58180d] rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative">
          <button 
            onClick={onClose} 
            className="absolute top-2 right-2 text-[#58180d]/50 hover:text-[#58180d] z-10"
          >
            <Icons.X />
          </button>
          
          <div className="p-4 pb-2 border-b-2 border-[#c9ad6a]">
            <h1 className="text-2xl font-bold font-serif tracking-wide text-[#58180d] uppercase">
              {character.name}
            </h1>
            <p className="text-sm italic text-[#58180d]/80">
              {character.size} {character.creatureType || 'creature'}
              {character.cr && <span className="float-right font-bold not-italic">CR {character.cr}</span>}
            </p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
          {/* Basic Stats */}
          <div className="space-y-1 border-b border-[#c9ad6a] pb-3">
            <div className="flex justify-between">
              <span><span className="font-bold text-[#58180d]">AC</span> {character.ac || 10}{character.notes?.includes('Armor') ? ` (${character.notes.split('.')[0]})` : ''}</span>
              {character.initiative !== undefined && (
                <span><span className="font-bold text-[#58180d]">Initiative</span> {getMod(character.dex)} ({10 + Math.floor((parseInt(character.dex || 10) - 10) / 2)})</span>
              )}
            </div>
            <div>
              <span className="font-bold text-[#58180d]">HP</span> {character.maxHp || character.currentHp}{character.hitDice ? ` (${character.hitDice})` : ''}
            </div>
            <div>
              <span className="font-bold text-[#58180d]">Speed</span> {character.speed || 30} ft.
            </div>
          </div>

          {/* Ability Scores */}
          <div className="grid grid-cols-6 gap-1 text-center border-b border-[#c9ad6a] pb-3">
            {stats.map(stat => (
              <div key={stat}>
                <div className="text-xs font-bold text-[#58180d]">{statLabels[stat]}</div>
                <div className="font-bold">{character[stat] || 10}</div>
                <div className="text-xs text-[#58180d]/70">{getMod(character[stat])}</div>
              </div>
            ))}
          </div>

          {/* Secondary Stats */}
          <div className="space-y-1 text-xs border-b border-[#c9ad6a] pb-3">
            {character.savingThrows && (
              <div><span className="font-bold text-[#58180d]">Saving Throws</span> {character.savingThrows}</div>
            )}
            {character.skills && (
              <div><span className="font-bold text-[#58180d]">Skills</span> {character.skills}</div>
            )}
            {character.vulnerabilities && (
              <div><span className="font-bold text-[#58180d]">Vulnerabilities</span> <span className="text-red-700">{character.vulnerabilities}</span></div>
            )}
            {character.resistances && (
              <div><span className="font-bold text-[#58180d]">Resistances</span> {character.resistances}</div>
            )}
            {character.immunities && (
              <div><span className="font-bold text-[#58180d]">Immunities</span> {character.immunities}</div>
            )}
            {character.senses && (
              <div><span className="font-bold text-[#58180d]">Senses</span> {character.senses}</div>
            )}
            {character.languages && (
              <div><span className="font-bold text-[#58180d]">Languages</span> {character.languages}</div>
            )}
            <div className="flex justify-between">
              {character.xp && <span><span className="font-bold text-[#58180d]">XP</span> {character.xp}</span>}
              {character.profBonus && <span><span className="font-bold text-[#58180d]">Proficiency Bonus</span> +{character.profBonus}</span>}
            </div>
          </div>

          {/* Traits */}
          {character.traits?.length > 0 && (
            <div className="border-b border-[#c9ad6a] pb-3">
              <h3 className="text-lg font-serif font-bold text-[#58180d] border-b border-[#c9ad6a] mb-2">Traits</h3>
              <div className="space-y-2">
                {character.traits.map((trait, i) => (
                  <div key={i}>
                    <span className="font-bold italic">{trait.name}.</span>{' '}
                    <span className="text-[#1a1a1a]">{trait.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {character.actions?.length > 0 && (
            <div className="border-b border-[#c9ad6a] pb-3">
              <h3 className="text-lg font-serif font-bold text-[#58180d] border-b border-[#c9ad6a] mb-2">Actions</h3>
              <div className="space-y-2">
                {character.actions.map((action, i) => (
                  <div key={i}>
                    <span className="font-bold italic">{action.name}.</span>{' '}
                    <span className="text-[#1a1a1a]">{action.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bonus Actions */}
          {character.bonusActions?.length > 0 && (
            <div className="border-b border-[#c9ad6a] pb-3">
              <h3 className="text-lg font-serif font-bold text-[#58180d] border-b border-[#c9ad6a] mb-2">Bonus Actions</h3>
              <div className="space-y-2">
                {character.bonusActions.map((action, i) => (
                  <div key={i}>
                    <span className="font-bold italic">{action.name}.</span>{' '}
                    <span className="text-[#1a1a1a]">{action.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reactions */}
          {character.reactions?.length > 0 && (
            <div className="border-b border-[#c9ad6a] pb-3">
              <h3 className="text-lg font-serif font-bold text-[#58180d] border-b border-[#c9ad6a] mb-2">Reactions</h3>
              <div className="space-y-2">
                {character.reactions.map((reaction, i) => (
                  <div key={i}>
                    <span className="font-bold italic">{reaction.name}.</span>{' '}
                    <span className="text-[#1a1a1a]">{reaction.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legendary Actions */}
          {character.legendaryActions?.length > 0 && (
            <div className="pb-2">
              <h3 className="text-lg font-serif font-bold text-[#58180d] border-b border-[#c9ad6a] mb-2">Legendary Actions</h3>
              <p className="text-xs italic mb-2 text-[#58180d]/80">
                The {character.name.toLowerCase()} can take 3 legendary actions, choosing from the options below. Only one legendary action can be used at a time and only at the end of another creature's turn. The {character.name.toLowerCase()} regains spent legendary actions at the start of its turn.
              </p>
              <div className="space-y-2">
                {character.legendaryActions.map((action, i) => (
                  <div key={i}>
                    <span className="font-bold italic">{action.name}.</span>{' '}
                    <span className="text-[#1a1a1a]">{action.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {character.notes && !character.notes.startsWith('Prone') && !character.notes.startsWith('Poisoned') && (
            <div className="text-xs italic text-[#58180d]/70 border-t border-[#c9ad6a] pt-2">
              {character.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatBlockModal;
