'use client';

import Icons from '../../../components/Icons';
import { Tooltip } from '../../../components/ui';
import { getClassLevel, isClass } from './utils';

/**
 * The contextual modal buttons for a combatant (stat block / sheet /
 * inventory / spells / resources / wild shape / sorcerer / notes / quick
 * actions — whichever apply). Shared by the combat CharacterCard header and
 * the turn tracker's Now card; `onOpen(key)` receives a CardModals key.
 * Remove / expand / edit stay on the card itself.
 */
export default function CardActionButtons({ character, isEnemy, spellcastingInfo, onOpen }) {
  const isDruid = () => getClassLevel(character, 'druid') >= 2;
  const isSorcerer = () => isClass(character, 'sorcerer');

  return (
    <>
      {/* Stat Block Button - for enemies/NPCs */}
      {isEnemy && (
        <Tooltip text="View Stat Block">
          <button
            aria-label="View Stat Block"
            onClick={(e) => { e.stopPropagation(); onOpen('statblock'); }}
            className="p-2 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-amber-900/30 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M4 6h16M4 10h16M4 14h10M4 18h7" />
            </svg>
          </button>
        </Tooltip>
      )}
      {/* Character Sheet Button - for party members */}
      {!isEnemy && (
        <Tooltip text="Character Sheet">
          <button
            aria-label="Character Sheet"
            onClick={(e) => { e.stopPropagation(); onOpen('sheet'); }}
            className="p-2 rounded-lg text-stone-400 hover:text-emerald-300 hover:bg-emerald-900/30 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M4 6h16M4 10h16M4 14h10M4 18h7" />
            </svg>
          </button>
        </Tooltip>
      )}
      {/* Inventory Button - for party members */}
      {!isEnemy && character.inventory?.length > 0 && (
        <Tooltip text="Inventory">
          <button
            aria-label="Inventory"
            onClick={(e) => { e.stopPropagation(); onOpen('inventory'); }}
            className="p-2 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-amber-900/30 transition-colors"
          >
            <Icons.Book />
          </button>
        </Tooltip>
      )}
      {/* Spells Button - for party members with spells */}
      {!isEnemy && character.spells?.length > 0 && (
        <Tooltip text="Spells">
          <button
            aria-label="Spells"
            onClick={(e) => { e.stopPropagation(); onOpen('spells'); }}
            className="p-2 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-900/30 transition-colors"
          >
            <Icons.Sparkles />
          </button>
        </Tooltip>
      )}
      {/* Quick Resources Button - for party members */}
      {!isEnemy && ((character.resources?.length > 0) || (character.spellSlots && Object.keys(character.spellSlots).some(k => k.startsWith('level') && character.spellSlots[k]?.max > 0))) && (
        <Tooltip text="Quick Resources">
          <button
            aria-label="Quick Resources"
            onClick={(e) => { e.stopPropagation(); onOpen('resources'); }}
            className="p-2 rounded-lg text-amber-400 hover:bg-amber-900/30 transition-colors"
          >
            <Icons.Sparkles />
          </button>
        </Tooltip>
      )}
      {/* Druid Wild Shape Button */}
      {!isEnemy && isDruid() && (
        <Tooltip text="Wild Shape">
          <button
            aria-label="Wild Shape"
            onClick={(e) => { e.stopPropagation(); onOpen('druid'); }}
            className={`p-2 rounded-lg transition-colors ${
              character.wildShapeActive 
                ? 'text-lime-400 bg-lime-900/30 hover:bg-lime-900/40' 
                : 'text-lime-500 hover:text-lime-400 hover:bg-lime-900/30'
            }`}
          >
            <span className="text-lg">🐾</span>
          </button>
        </Tooltip>
      )}
      {/* Sorcerer Features Button */}
      {!isEnemy && isSorcerer() && (
        <Tooltip text="Sorcerer Features">
          <button
            aria-label="Sorcerer Features"
            onClick={(e) => { e.stopPropagation(); onOpen('sorcerer'); }}
            className={`p-2 rounded-lg transition-colors ${
              character.innateSorcery 
                ? 'text-purple-400 bg-purple-900/30 hover:bg-purple-900/40' 
                : 'text-purple-500 hover:text-purple-400 hover:bg-purple-900/30'
            }`}
          >
            <Icons.Flame className="w-5 h-5" />
          </button>
        </Tooltip>
      )}
      {/* Notes Button */}
      {isEnemy && (
        <Tooltip text="Combat Notes">
          <button
            aria-label="Combat Notes"
            onClick={(e) => { e.stopPropagation(); onOpen('notes'); }}
            className={`p-2 rounded-lg transition-colors ${character.combatNotes ? 'text-amber-400 hover:bg-amber-900/30 bg-amber-900/20' : 'text-stone-500 hover:text-amber-400 hover:bg-amber-900/30'}`}
          >
            <Icons.Scroll className="w-5 h-5" />
          </button>
        </Tooltip>
      )}
      {/* Quick Actions Button */}
      {isEnemy && (character.actions?.length > 0 || character.legendaryActions?.length > 0 || spellcastingInfo.found) && (
        <Tooltip text="Quick Actions">
          <button
            aria-label="Quick Actions"
            onClick={(e) => { e.stopPropagation(); onOpen('actions'); }}
            className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${character.legendaryActions?.length > 0 ? 'text-purple-400 hover:bg-purple-900/30 bg-purple-900/20' : 'text-red-400 hover:bg-red-900/30'}`}
          >
            <Icons.Sword />
            {character.legendaryActions?.length > 0 && <span className="text-xs">★</span>}
          </button>
        </Tooltip>
      )}
    </>
  );
}
