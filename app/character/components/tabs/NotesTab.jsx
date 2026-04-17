'use client';

export default function NotesTab({ character, onUpdate }) {
  return (
    <div>
      <textarea value={character.notes || ''} onChange={(e) => onUpdate('notes', e.target.value)}
        className="w-full bg-stone-800 rounded px-4 py-3 h-[450px] resize-none focus:outline-none"
        placeholder="Session notes, character backstory, goals, etc..." />
    </div>
  );
}
