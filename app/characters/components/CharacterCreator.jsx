'use client';

// Character-creation stepper (Basics → Class → [Spells] → Background →
// Species → Abilities → Equipment → Resources → Details → Review; Spells shows
// only while a chosen class casts), modelled on the D&D Beyond
// builder. Rendered full-page by /characters/new for party members and DM
// NPCs. The draft → character conversion is pure:
// app/characters/creation/buildCharacter.js.

import { useEffect, useMemo, useRef, useState } from 'react';
import Icons from '../../components/Icons';
import { getModNum, formatMod } from '../../utils/rules';
import { STATS } from '../../character/components/constants';
import { getSteps, emptyDraft, buildCharacter, getStepIssues, canCreate } from '../creation/buildCharacter';
import { STEP_COMPONENTS } from './CreatorSteps';

const ACCENTS = {
  party: {
    title: 'text-emerald-400',
    border: 'border-emerald-800/50',
    focus: 'focus:border-emerald-600',
    cardOn: 'border-emerald-500 bg-emerald-900/30',
    chipOn: 'border-emerald-500 bg-emerald-800/60 text-emerald-100',
    stepOn: 'bg-emerald-700 text-white',
    primary: 'bg-emerald-700 hover:bg-emerald-600',
  },
  'dm-npc': {
    title: 'text-amber-400',
    border: 'border-amber-800/50',
    focus: 'focus:border-amber-600',
    cardOn: 'border-amber-500 bg-amber-900/30',
    chipOn: 'border-amber-500 bg-amber-800/60 text-amber-100',
    stepOn: 'bg-amber-700 text-white',
    primary: 'bg-amber-700 hover:bg-amber-600',
  },
};

// Live summary beside the steps (wide screens only)
function SummaryPanel({ preview, accent }) {
  const sub = preview.classes?.[0]?.subclass;
  return (
    <aside aria-label="Character summary" className={`hidden lg:block self-start sticky top-4 bg-stone-900/70 border ${accent.border} rounded-xl p-4 space-y-3`}>
      <div>
        <div className={`font-bold truncate ${accent.title}`}>{preview.name || 'Unnamed'}</div>
        <div className="text-xs text-stone-400">
          Level {preview.level} {preview.race}{' '}
          {preview.classes?.length > 1 ? preview.classes.map(c => `${c.name} ${c.level}`).join(' / ') : `${preview.class}${sub ? ` (${sub})` : ''}`}
        </div>
        {preview.background && <div className="text-xs text-stone-500">{preview.background}</div>}
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-center">
        {[['AC', preview.ac], ['HP', preview.maxHp], ['Speed', preview.speed]].map(([label, v]) => (
          <div key={label} className="bg-stone-800 rounded py-1.5"><div className="text-[10px] uppercase text-stone-500">{label}</div><div className="font-bold">{v}</div></div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-center">
        {STATS.map(s => (
          <div key={s} className="bg-stone-800/60 rounded py-1">
            <div className="text-[10px] uppercase text-stone-500">{s}</div>
            <div className="text-sm font-semibold">{preview[s]} <span className="text-xs text-stone-400 font-normal">{formatMod(getModNum(preview[s]))}</span></div>
          </div>
        ))}
      </div>
      <div className="text-xs text-stone-400">
        <span className="text-stone-500">Skills: </span>
        {Object.keys(preview.skillProficiencies).join(', ') || '—'}
      </div>
    </aside>
  );
}

export default function CharacterCreator({ kind = 'party', onCreate, onCancel, saving = false, error = '' }) {
  const accent = ACCENTS[kind] || ACCENTS.party;
  const [draft, setDraft] = useState(emptyDraft);
  const [stepId, setStepId] = useState('basics');
  const [spellLibrary, setSpellLibrary] = useState({ status: 'idle', spells: [] });
  const spellsRequested = useRef(false);
  const [visited, setVisited] = useState(() => new Set(['basics']));
  const [dirty, setDirty] = useState(false);

  const update = (patch) => { setDraft(prev => ({ ...prev, ...patch })); setDirty(true); };
  const issues = useMemo(() => getStepIssues(draft), [draft]);
  const preview = useMemo(() => buildCharacter(draft, kind), [draft, kind]);

  const steps = useMemo(() => getSteps(draft), [draft]);
  const hasSpellStep = steps.some(s => s.id === 'spells');
  // A step that disappears (Spells, when the last caster class goes) falls back to Class
  const found = steps.findIndex(s => s.id === stepId);
  const stepIndex = found >= 0 ? found : steps.findIndex(s => s.id === 'class');
  const step = steps[stepIndex];
  const StepBody = STEP_COMPONENTS[step.id];
  const isLast = stepIndex === steps.length - 1;

  // The spellbook loads once, the first time a caster class is chosen
  useEffect(() => {
    if (!hasSpellStep || spellsRequested.current) return;
    spellsRequested.current = true;
    fetch('/api/spells')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(data => setSpellLibrary({ status: 'ready', spells: Array.isArray(data) ? data : [] }))
      .catch(() => setSpellLibrary({ status: 'error', spells: [] }));
  }, [hasSpellStep]);
  const library = spellLibrary.status === 'idle' && hasSpellStep ? { status: 'loading', spells: [] } : spellLibrary;
  const ready = canCreate(draft) && !saving;

  const goTo = (id) => {
    setStepId(id);
    setVisited(prev => new Set(prev).add(id));
  };
  const goToIndex = (i) => goTo(steps[i].id);

  const cancel = () => {
    if (!dirty || window.confirm('Discard this character?')) onCancel();
  };

  const create = () => {
    if (!canCreate(draft)) { goTo('basics'); return; }
    onCreate(buildCharacter(draft, kind));
  };

  const title = kind === 'dm-npc' ? 'New DM NPC' : 'New Party Member';

  return (
    <div className="space-y-4">
      {/* Header + stepper */}
      <div className="flex items-center justify-between gap-3">
        <h1 className={`text-2xl font-bold flex items-center gap-2 ${accent.title}`}>
          {kind === 'dm-npc' ? <Icons.Crown /> : <Icons.Shield />}
          {title}
          {draft.name && <span className="text-stone-400 font-normal text-base">— {draft.name}</span>}
        </h1>
        <button type="button" onClick={cancel} className="px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-sm text-stone-300">Cancel</button>
      </div>

      <nav aria-label="Steps" className="bg-stone-900/50 border border-stone-700/50 rounded-xl p-2">
        <ol className="flex gap-1 overflow-x-auto">
          {steps.map((s, i) => {
            const current = i === stepIndex;
            const seen = visited.has(s.id);
            const state = issues[s.id].length && seen ? 'open' : seen && s.id !== 'review' ? 'done' : 'todo';
            return (
              <li key={s.id} className="flex-1 min-w-[5rem]">
                <button type="button" onClick={() => goToIndex(i)} aria-current={current ? 'step' : undefined}
                  className={`w-full flex flex-col items-center gap-0.5 px-1 py-2 rounded-lg text-xs ${current ? accent.stepOn : 'text-stone-400 hover:bg-stone-800'}`}>
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-bold ${
                    current ? 'bg-black/25' : state === 'done' ? 'bg-emerald-900/60 text-emerald-300' : state === 'open' ? 'bg-amber-900/60 text-amber-300' : 'bg-stone-800'}`}>
                    {state === 'done' && !current ? <Icons.Check className="w-3.5 h-3.5" /> : state === 'open' && !current ? '!' : i + 1}
                  </span>
                  {s.label}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_17rem] gap-4">
        <section aria-label={step.label} className="bg-stone-900/50 border border-stone-700/50 rounded-xl flex flex-col">
          <div className="px-5 pt-4 pb-1">
            <h2 className="text-lg font-semibold text-stone-100">{step.label}</h2>
          </div>
          <div className="px-5 py-3 flex-1">
            <StepBody draft={draft} update={update} accent={accent} kind={kind} preview={preview} issues={issues} goTo={goTo} spellLibrary={library} />
            {step.id !== 'review' && issues[step.id].length > 0 && visited.has(step.id) && (
              <ul className="mt-4 space-y-0.5">
                {issues[step.id].map((i, n) => (
                  <li key={n} className={`text-xs ${i.blocking ? 'text-red-400' : 'text-amber-400/80'}`}>• {i.message}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-stone-800 flex items-center gap-2 sticky bottom-0 bg-stone-900 rounded-b-xl">
            <button type="button" onClick={() => goToIndex(stepIndex - 1)} disabled={stepIndex === 0}
              className="px-4 py-2 rounded bg-stone-700 hover:bg-stone-600 text-sm disabled:opacity-40">Back</button>
            <div className="flex-1 text-center text-xs text-stone-500">
              {error ? <span role="alert" className="text-red-400">{error}</span> : `Step ${stepIndex + 1} of ${steps.length}`}
            </div>
            {!isLast && (
              <button type="button" onClick={create} disabled={!ready}
                title={canCreate(draft) ? 'Create with the choices so far' : 'Enter a name first'}
                className="px-4 py-2 rounded bg-stone-700 hover:bg-stone-600 text-sm disabled:opacity-40">Create now</button>
            )}
            {isLast ? (
              <button type="button" onClick={create} disabled={!ready} className={`px-5 py-2 rounded text-sm font-medium disabled:opacity-40 ${accent.primary}`}>
                {saving ? 'Saving…' : kind === 'dm-npc' ? 'Create NPC' : 'Create Character'}
              </button>
            ) : (
              <button type="button" onClick={() => goToIndex(stepIndex + 1)} className={`px-5 py-2 rounded text-sm font-medium ${accent.primary}`}>
                Next: {steps[stepIndex + 1].label}
              </button>
            )}
          </div>
        </section>

        <SummaryPanel preview={preview} accent={accent} />
      </div>
    </div>
  );
}
