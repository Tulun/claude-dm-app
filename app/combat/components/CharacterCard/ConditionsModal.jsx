'use client';

import Icons from '../../../components/Icons';
import Modal from '../../../components/Modal';
import {
  CONDITIONS, CONDITION_TONES, END_OF_NEXT_TURN, getConditions, getExhaustionLevel, hasCondition,
  toggledConditions, withConditionDuration, withExhaustionLevel,
} from '../../conditions';

/**
 * Condition picker: every click applies immediately through `onUpdate` (no
 * Save step), so toggling on and off is one click each. Exhaustion gets a
 * level stepper instead of a toggle. Active conditions (bar Exhaustion) get
 * an optional duration — rounds or "until end of next turn" — that the combat
 * page ticks down as turns start (see tickConditionsAtTurnStart).
 */
export default function ConditionsModal({ isOpen, onClose, character, onUpdate }) {
  if (!isOpen) return null;
  const set = (conditions) => onUpdate({ ...character, conditions });
  const exhaustion = getExhaustionLevel(character);
  const anyActive = CONDITIONS.some(c => hasCondition(character, c.name));
  const timeable = getConditions(character).filter(c => c.name !== 'Exhaustion');
  const setDuration = (name, duration) => set(withConditionDuration(character, name, duration));

  return (
    <Modal onClose={onClose}>
      <div className="bg-stone-900 border border-amber-800/50 rounded-xl w-full max-w-lg overflow-hidden">
        <div className="p-4 border-b border-stone-700 bg-gradient-to-r from-amber-950/50 to-stone-900 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-amber-400">Conditions</h2>
            <p className="text-xs text-stone-400 mt-0.5">{character.name} — click to toggle</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-stone-400 hover:text-stone-200"><Icons.X /></button>
        </div>

        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CONDITIONS.filter(c => c.name !== 'Exhaustion').map(c => {
            const on = hasCondition(character, c.name);
            return (
              <button
                key={c.name}
                type="button"
                aria-pressed={on}
                title={c.summary}
                onClick={() => set(toggledConditions(character, c.name))}
                className={`px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                  on ? `${CONDITION_TONES[c.tone]} font-semibold` : 'border-stone-700 bg-stone-800/60 text-stone-400 hover:text-stone-200 hover:border-stone-500'
                }`}
              >
                {on && '✓ '}{c.name}
              </button>
            );
          })}
        </div>

        {timeable.length > 0 && (
          <div className="px-4 pb-4 space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-widest text-stone-500">Duration</div>
            {timeable.map(c => {
              const mode = c.rounds > 0 ? 'rounds' : c.until ? 'eont' : 'none';
              return (
                <div key={c.name} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-stone-300">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <select
                      aria-label={`${c.name} duration`}
                      value={mode}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDuration(c.name, v === 'rounds' ? 1 : v === 'eont' ? END_OF_NEXT_TURN : null);
                      }}
                      className="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-200"
                    >
                      <option value="none">No duration</option>
                      <option value="rounds">Rounds</option>
                      <option value="eont">Until end of next turn</option>
                    </select>
                    {mode === 'rounds' && (
                      <input
                        type="number"
                        min={1}
                        aria-label={`${c.name} rounds`}
                        value={c.rounds}
                        onChange={(e) => { if (Number(e.target.value) >= 1) setDuration(c.name, e.target.value); }}
                        className="w-14 bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-200 font-mono"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="px-4 pb-4">
          <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${exhaustion ? CONDITION_TONES.exhaustion : 'border-stone-700 bg-stone-800/60 text-stone-400'}`}>
            <span className="text-sm" title={CONDITIONS.find(c => c.name === 'Exhaustion').summary}>Exhaustion</span>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Decrease exhaustion" disabled={!exhaustion} onClick={() => set(withExhaustionLevel(character, exhaustion - 1))} className="w-7 h-7 rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-40">−</button>
              <span className="w-6 text-center font-mono" data-testid="exhaustion-level">{exhaustion}</span>
              <button type="button" aria-label="Increase exhaustion" disabled={exhaustion >= 6} onClick={() => set(withExhaustionLevel(character, exhaustion + 1))} className="w-7 h-7 rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-40">+</button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-stone-700 flex justify-between">
          <button
            type="button"
            disabled={!anyActive}
            onClick={() => set([])}
            className="px-3 py-2 rounded-lg text-stone-400 hover:text-red-400 hover:bg-red-900/20 text-sm disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-stone-400"
          >
            Clear all
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm">Done</button>
        </div>
      </div>
    </Modal>
  );
}
