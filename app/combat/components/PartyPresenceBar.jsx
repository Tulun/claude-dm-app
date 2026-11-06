'use client';

// "Who's in this fight" strip above the party table/cards. One chip per party
// member: present members are emerald, absent ones (split party, missing
// player) are greyed and struck through. Clicking toggles — the member stays
// in party.json either way; only initiative and the combat views skip them.
export default function PartyPresenceBar({ party, absentSet, onToggle }) {
  const absentCount = party.filter(p => absentSet.has(p.id)).length;
  return (
    <div className="flex items-center gap-2 flex-wrap text-xs" role="group" aria-label="In this fight">
      <span className="text-stone-500">In this fight:</span>
      {party.map(m => {
        const absent = absentSet.has(m.id);
        return (
          <button
            key={m.id}
            type="button"
            aria-pressed={!absent}
            onClick={() => onToggle(m.id)}
            title={absent ? `${m.name} is sitting out — click to bring them back` : `Click to have ${m.name} sit this fight out`}
            className={`px-2 py-0.5 rounded-full border transition-colors ${absent
              ? 'border-stone-700 bg-stone-900/40 text-stone-500 line-through hover:text-stone-300'
              : 'border-emerald-700/60 bg-emerald-900/30 text-emerald-300 hover:border-emerald-500'}`}
          >
            {m.name}
          </button>
        );
      })}
      {absentCount > 0 && <span className="text-stone-500">({absentCount} sitting out)</span>}
    </div>
  );
}
