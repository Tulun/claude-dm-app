'use client';

import Icons from '../../../components/Icons';
import { Tooltip } from '../../../components/ui';
import { getClassLevel, isClass } from './utils';

const LinesIcon = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M4 6h16M4 10h16M4 14h10M4 18h7" />
  </svg>
);

/**
 * The contextual modal actions for a combatant (stat block / sheet /
 * inventory / spellbook / resources / wild shape / sorcerer / notes / quick
 * actions — whichever apply), as descriptors `{ key, label, icon, className }`
 * where `key` is a CardModals key. One list feeds both renderings:
 * `CardActionButtons` (icon row — Table rows, the tracker's Now card, enemy
 * cards) and `CardActionMenu` (the party card's ⋯ overflow menu).
 */
export function getCardActions(character, isEnemy, spellcastingInfo) {
  const actions = [];
  if (isEnemy) {
    actions.push({ key: 'statblock', label: 'View Stat Block', icon: LinesIcon, className: 'text-stone-400 hover:text-amber-300 hover:bg-amber-900/30' });
  } else {
    actions.push({ key: 'sheet', label: 'Character Sheet', icon: LinesIcon, className: 'text-stone-400 hover:text-emerald-300 hover:bg-emerald-900/30' });
    if (character.inventory?.length > 0) {
      actions.push({ key: 'inventory', label: 'Inventory', icon: Icons.Backpack, className: 'text-stone-400 hover:text-amber-300 hover:bg-amber-900/30' });
    }
    if (character.spells?.length > 0) {
      actions.push({ key: 'spells', label: 'Spellbook', icon: Icons.Spellbook, className: 'text-purple-400 hover:text-purple-300 hover:bg-purple-900/30' });
    }
    if ((character.resources?.length > 0) || (character.spellSlots && Object.keys(character.spellSlots).some(k => k.startsWith('level') && character.spellSlots[k]?.max > 0))) {
      actions.push({ key: 'resources', label: 'Resources', icon: Icons.Charges, className: 'text-amber-400 hover:bg-amber-900/30' });
    }
    if (getClassLevel(character, 'druid') >= 2) {
      actions.push({
        key: 'druid', label: 'Wild Shape', icon: PawIcon,
        className: character.wildShapeActive ? 'text-lime-400 bg-lime-900/30 hover:bg-lime-900/40' : 'text-lime-500 hover:text-lime-400 hover:bg-lime-900/30',
      });
    }
    if (isClass(character, 'sorcerer')) {
      actions.push({
        key: 'sorcerer', label: 'Sorcerer Features', icon: Icons.Flame,
        className: character.innateSorcery ? 'text-purple-400 bg-purple-900/30 hover:bg-purple-900/40' : 'text-purple-500 hover:text-purple-400 hover:bg-purple-900/30',
      });
    }
  }
  // Notes — free-text catch-all (conditions are separate chips)
  actions.push({
    key: 'notes', label: 'Combat Notes', icon: Icons.Scroll,
    className: character.combatNotes ? 'text-amber-400 hover:bg-amber-900/30 bg-amber-900/20' : 'text-stone-500 hover:text-amber-400 hover:bg-amber-900/30',
  });
  if (isEnemy && (character.actions?.length > 0 || character.legendaryActions?.length > 0 || spellcastingInfo.found)) {
    const legendary = character.legendaryActions?.length > 0;
    actions.push({
      key: 'actions', label: 'Quick Actions', icon: Icons.Sword, legendary,
      className: `flex items-center gap-1 ${legendary ? 'text-purple-400 hover:bg-purple-900/30 bg-purple-900/20' : 'text-red-400 hover:bg-red-900/30'}`,
    });
  }
  return actions;
}

function PawIcon() {
  return <span aria-hidden="true" className="text-lg leading-none">🐾</span>;
}

/**
 * Icon-row rendering of `getCardActions`. Shared by the Table-view rows, the
 * turn tracker's Now card and enemy combat cards; `onOpen(key)` receives a
 * CardModals key. Remove / expand / edit stay on the host.
 */
export default function CardActionButtons({ character, isEnemy, spellcastingInfo, onOpen }) {
  return (
    <>
      {getCardActions(character, isEnemy, spellcastingInfo).map(({ key, label, icon: Icon, className, legendary }) => (
        <Tooltip key={key} text={label}>
          <button
            aria-label={label}
            onClick={(e) => { e.stopPropagation(); onOpen(key); }}
            className={`p-2 rounded-lg transition-colors ${className}`}
          >
            {key === 'actions' ? <Icon /> : <Icon className="w-5 h-5" />}
            {legendary && <span className="text-xs">★</span>}
          </button>
        </Tooltip>
      ))}
    </>
  );
}
