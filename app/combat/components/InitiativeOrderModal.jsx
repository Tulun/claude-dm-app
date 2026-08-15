'use client';

import Icons from '../../components/Icons';
import Modal from '../../components/Modal';
import InitiativeItem from './InitiativeItem';

/**
 * Manage Order: the editing surface for the initiative list (sort by rolled
 * initiative, drag to rearrange, edit initiative values / companion HP / lair
 * notes). The main column stays a read-only turn display so the DM can't
 * knock the order around mid-combat by accident.
 */
export default function InitiativeOrderModal({
  isOpen,
  onClose,
  list,
  enemyIds,
  activeIndex,
  nextIndex,
  combatActive,
  onSort,
  drag,
  dragIndex,
  dragOverIndex,
  onUpdateInitiative,
  onUpdateHp,
  onUpdateLairNotes,
  onRemoveLairAction,
  onSelectTurn,
}) {
  if (!isOpen) return null;

  return (
    <Modal onClose={onClose}>
      <div className="bg-stone-900 border border-stone-700 rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="p-4 border-b border-stone-700 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <Icons.GripVertical /> Initiative Order
            </h2>
            <p className="text-sm text-stone-400 mt-1">
              Drag to rearrange, click a number to edit it{combatActive ? ', click a name to jump the turn pointer' : ''}.
            </p>
          </div>
          <button
            onClick={onSort}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-800/50 hover:bg-amber-700/50 text-amber-300 text-sm shrink-0"
          >
            <Icons.Refresh />Sort by Init
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {list.map((c, i) => (
            <InitiativeItem
              key={c.id}
              character={c}
              isEnemy={enemyIds.has(c.id)}
              isCompanion={c.isCompanion}
              isLairAction={c.isLairAction}
              index={i}
              drag={drag}
              isDragging={dragIndex === i}
              isDragOver={dragOverIndex === i}
              isActive={combatActive && activeIndex === i}
              isNext={combatActive && nextIndex === i}
              onSelect={combatActive ? onSelectTurn : undefined}
              onUpdateInitiative={onUpdateInitiative}
              onUpdateHp={c.isCompanion ? onUpdateHp : undefined}
              onUpdateLairNotes={c.isLairAction ? onUpdateLairNotes : undefined}
              onRemoveLairAction={c.isLairAction ? onRemoveLairAction : undefined}
            />
          ))}
          {!list.length && (
            <div className="text-center py-8 text-stone-500">Add combatants to begin!</div>
          )}
        </div>

        <div className="p-4 border-t border-stone-700">
          <button onClick={onClose} className="w-full py-2 rounded-lg bg-stone-700 hover:bg-stone-600">
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
