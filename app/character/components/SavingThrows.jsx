'use client';

import Icons from '../../components/Icons';
import { STATS, formatMod, getSaveBonus } from './constants';

export default function SavingThrows({ character, onEditClick }) {
  const topRow = ['str', 'dex', 'con'];
  const bottomRow = ['int', 'wis', 'cha'];

  const SaveBox = ({ stat }) => {
    const saveProf = character.saveProficiencies?.[stat] || 0;
    return (
      <div className={`rounded p-2 text-center ${saveProf ? 'bg-emerald-900/30' : 'bg-stone-800'}`}>
        <div className="text-[10px] text-stone-500 uppercase">{stat}</div>
        <div className={`text-lg font-bold font-mono ${saveProf ? 'text-emerald-400' : ''}`}>
          {formatMod(getSaveBonus(character, stat))}
        </div>
        <div className={`text-[10px] ${saveProf ? 'text-emerald-400' : 'text-stone-600'}`}>
          {saveProf ? '●' : '○'}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-stone-900 rounded-lg overflow-hidden">
      <div className="p-2 border-b border-stone-700 flex items-center justify-between">
        <span className="text-xs text-stone-500 uppercase tracking-wide">Saving Throws</span>
        <button onClick={onEditClick} className="text-xs text-amber-400 hover:text-amber-300">
          <Icons.Edit />
        </button>
      </div>
      <div className="p-2 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          {topRow.map(stat => <SaveBox key={stat} stat={stat} />)}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {bottomRow.map(stat => <SaveBox key={stat} stat={stat} />)}
        </div>
      </div>
    </div>
  );
}
