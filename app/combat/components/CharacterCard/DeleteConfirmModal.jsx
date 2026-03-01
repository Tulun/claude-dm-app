'use client';

import Icons from '../../../components/Icons';

const DeleteConfirmModal = ({ isOpen, onClose, character, isEnemy, onRemove }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-stone-900 border border-stone-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-full ${isEnemy ? 'bg-red-900/50' : 'bg-emerald-900/50'}`}>
            {isEnemy ? <Icons.Skull /> : <Icons.Shield />}
          </div>
          <div>
            <h3 className="text-lg font-bold">{isEnemy ? 'Kill' : 'Remove'} {character.name}?</h3>
            <p className="text-sm text-stone-400">
              {isEnemy ? 'This will remove the enemy from combat.' : 'This will remove the party member.'}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-stone-700 hover:bg-stone-600 text-sm">Cancel</button>
          <button onClick={() => { onRemove(character.id); onClose(); }} className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm flex items-center gap-2">
            <Icons.Trash /> Yes, {isEnemy ? 'Kill' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
