'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Icons from '../../components/Icons';
import { Tooltip } from '../../components/ui';
import { parseSpellcasting } from './CharacterCard/spellcastingParser';
import CardActionButtons from './CharacterCard/CardActionButtons';
import CardModals from './CharacterCard/CardModals';
import { getMod, getSpellSaveDC, formatClassList, getActiveWildShapeForm, getCardBaseAC, getCardDisplayAC } from './CharacterCard/utils';
import { formatSpeeds } from '../monsterAbilities';

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

/**
 * Click-to-edit number cell. `onCommit(rawText)` fires on Enter/blur;
 * Escape cancels. Commit semantics (validation, clamping) stay with the
 * caller so they mirror CharacterCard's badges exactly.
 */
function InlineEdit({ label, initial, onCommit, className, title, disabled, children }) {
  const [draft, setDraft] = useState(null);
  if (draft !== null) {
    const commit = () => { onCommit(draft); setDraft(null); };
    return (
      <input
        type="text"
        aria-label={label}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          else if (e.key === 'Escape') setDraft(null);
        }}
        className="w-12 text-center bg-stone-900 border border-amber-500 rounded px-1 py-0.5 font-mono text-sm focus:outline-none"
        autoFocus
        placeholder="0"
      />
    );
  }
  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); setDraft(initial); }}
      className={`px-1.5 py-0.5 rounded font-mono transition-colors ${disabled ? 'cursor-default' : 'hover:bg-stone-700/60 cursor-pointer'} ${className || ''}`}
    >
      {children}
    </button>
  );
}

/**
 * One combatant as a table row. Memoized like CharacterCard — the page must
 * pass stable useCallback handlers (frontend-patterns §2). Every edit goes
 * through the same `onUpdate` the card uses, so auto-save is unchanged, and
 * the modal buttons are the shared CardActionButtons/CardModals pair.
 */
const CombatantRow = ({ character, isEnemy, onUpdate, onRemove, templates }) => {
  const [activeModal, setActiveModal] = useState(null);
  const closeModal = () => setActiveModal(null);

  const isDead = character.currentHp <= 0;
  const tempHp = character.tempHp || 0;
  const tempAC = character.tempAC || 0;
  const wildShapeForm = getActiveWildShapeForm(character);
  const baseAC = getCardBaseAC(character);
  const displayAC = getCardDisplayAC(character);
  const spellcastingInfo = parseSpellcasting(character);
  // Party: computed from spellStat; enemies: the stat block's stated DC
  const spellDC = getSpellSaveDC(character) ?? spellcastingInfo.dc;
  const speeds = formatSpeeds(wildShapeForm?.speed ?? character.speed);
  const characterType = character.class ? 'party' : 'template';
  const hpPct = character.maxHp > 0 ? Math.max(0, Math.min(100, (character.currentHp / character.maxHp) * 100)) : 0;
  const hpColor = hpPct > 50 ? 'bg-emerald-500' : hpPct > 25 ? 'bg-amber-500' : 'bg-red-500';

  const rowTint = isDead
    ? 'opacity-60'
    : isEnemy
      ? (character.isNpc ? 'hover:bg-teal-950/30' : 'hover:bg-red-950/30')
      : 'hover:bg-emerald-950/30';

  return (
    <tr data-testid={`combatant-row-${character.id}`} className={`border-t border-stone-800 ${rowTint}`}>
      <td className="px-2 py-1.5">
        <div className={`font-semibold leading-tight ${isDead ? 'line-through text-stone-500' : ''}`}>
          {character.name}
          {wildShapeForm && <span className="ml-1 text-xs font-normal text-lime-400">🐾 {wildShapeForm.name}</span>}
        </div>
        <div className="text-xs text-stone-400">
          {formatClassList(character) || (character.cr ? `CR ${character.cr}` : '')}
        </div>
      </td>
      <td className="px-1 py-1.5 text-center font-mono text-stone-300">{character.initiative ?? '—'}</td>
      <td className="px-1 py-1.5 text-center">
        <InlineEdit
          label={`Temp AC for ${character.name}`}
          initial={String(tempAC || '')}
          disabled={!!wildShapeForm}
          onCommit={(v) => { const n = parseInt(v); onUpdate({ ...character, tempAC: isNaN(n) ? 0 : Math.max(0, n) }); }}
          title={wildShapeForm ? `Wild Shape: ${wildShapeForm.name} AC` : tempAC > 0 ? `Base ${baseAC} + ${tempAC} temp bonus` : 'Click to add temp AC bonus'}
          className={wildShapeForm ? 'text-lime-400' : tempAC > 0 ? 'text-amber-400' : character.acEffect ? 'text-cyan-400' : 'text-stone-200'}
        >
          {displayAC}
        </InlineEdit>
      </td>
      <td className="px-1 py-1.5 whitespace-nowrap">
        <div className="flex items-center gap-1">
          <InlineEdit
            label={`Current HP for ${character.name}`}
            initial={String(character.currentHp ?? '')}
            onCommit={(v) => { const n = parseInt(v); if (!isNaN(n) && n >= 0) onUpdate({ ...character, currentHp: n }); }}
            title="Click to edit HP"
            className={isDead ? 'text-red-400' : 'text-stone-100'}
          >
            {character.currentHp}
          </InlineEdit>
          <span className="text-stone-500">/</span>
          <span className="font-mono text-stone-400">{character.maxHp}</span>
        </div>
        <div className="mx-1.5 mt-0.5 h-1 rounded bg-stone-800 overflow-hidden">
          <div className={`h-full ${hpColor}`} style={{ width: `${hpPct}%` }} />
        </div>
      </td>
      <td className="px-1 py-1.5 text-center">
        <InlineEdit
          label={`Temp HP for ${character.name}`}
          initial={String(tempHp)}
          onCommit={(v) => { const n = parseInt(v); if (!isNaN(n) && n >= 0) onUpdate({ ...character, tempHp: n }); }}
          title="Click to add/edit Temporary HP"
          className={tempHp > 0 ? 'text-cyan-400' : 'text-stone-600'}
        >
          {tempHp > 0 ? `+${tempHp}` : '—'}
        </InlineEdit>
      </td>
      <td className="px-1 py-1.5 text-center font-mono text-purple-400">{spellDC || <span className="text-stone-600">—</span>}</td>
      <td className="px-1 py-1.5 text-center text-xs text-stone-300 whitespace-nowrap" title={speeds.join(' · ')}>
        {speeds[0]}{speeds.length > 1 && <span className="text-stone-500"> +{speeds.length - 1}</span>}
      </td>
      {ABILITIES.map(key => {
        // Wild shape swaps in the beast's physical scores (matches the card)
        const usesBeastStat = wildShapeForm && ['str', 'dex', 'con'].includes(key);
        const score = usesBeastStat ? (wildShapeForm[key] || 10) : (character[key] || 10);
        return (
          <td key={key} className={`px-1 py-1.5 text-center ${usesBeastStat ? 'text-lime-400' : ''}`}>
            <span className="font-mono text-sm">{score}</span>
            <span className={`ml-1 text-xs ${usesBeastStat ? 'text-lime-400/70' : 'text-stone-400'}`}>{getMod(score)}</span>
          </td>
        );
      })}
      <td className="px-1 py-1">
        <div className="flex items-center justify-end [&_button]:p-1.5 [&_a]:p-1.5">
          <CardActionButtons character={character} isEnemy={isEnemy} spellcastingInfo={spellcastingInfo} onOpen={setActiveModal} />
          {isEnemy ? (
            onRemove && (
              <Tooltip text="Remove from Combat">
                <button
                  aria-label="Remove from Combat"
                  onClick={(e) => { e.stopPropagation(); setActiveModal('delete'); }}
                  className="rounded-lg text-stone-500 hover:text-red-400 hover:bg-red-900/30 transition-colors"
                >
                  <Icons.Trash />
                </button>
              </Tooltip>
            )
          ) : (
            <Tooltip text="Edit Character">
              <Link
                aria-label="Edit Character"
                href={`/character?id=${character.id}&type=${characterType}`}
                className="rounded-lg transition-colors hover:bg-emerald-900/30 text-stone-400 hover:text-emerald-400 inline-flex"
              >
                <Icons.Edit />
              </Link>
            </Tooltip>
          )}
        </div>
        <CardModals
          activeModal={activeModal}
          onClose={closeModal}
          character={character}
          isEnemy={isEnemy}
          onUpdate={onUpdate}
          onRemove={onRemove}
          templates={templates}
          displayAC={displayAC}
          spellcastingInfo={spellcastingInfo}
        />
      </td>
    </tr>
  );
};

const MemoRow = React.memo(CombatantRow);

/**
 * Compact table view of party members or enemies — the alternative to the
 * CharacterCard grid on /combat (toggled by the page's Cards/Table switch).
 */
export default function CombatantTable({ combatants, isEnemy, onUpdate, onRemove, templates }) {
  const accent = isEnemy ? 'border-red-800/50 from-red-950/30' : 'border-emerald-800/50 from-emerald-950/30';
  return (
    <div className={`border rounded-lg overflow-x-auto bg-gradient-to-br to-stone-900/60 ${accent}`}>
      <table className="w-full text-sm" aria-label={isEnemy ? 'Enemies table' : 'Party table'}>
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-stone-500">
            <th className="px-2 py-1.5 text-left font-medium">{isEnemy ? 'Enemy' : 'Name'}</th>
            <th className="px-1 py-1.5 font-medium">Init</th>
            <th className="px-1 py-1.5 font-medium">AC</th>
            <th className="px-1 py-1.5 text-left font-medium">HP</th>
            <th className="px-1 py-1.5 font-medium">THP</th>
            <th className="px-1 py-1.5 font-medium">DC</th>
            <th className="px-1 py-1.5 font-medium">Speed</th>
            {ABILITIES.map(a => <th key={a} className="px-1 py-1.5 font-medium">{a}</th>)}
            <th className="px-1 py-1.5"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {combatants.map(c => (
            <MemoRow key={c.id} character={c} isEnemy={isEnemy} onUpdate={onUpdate} onRemove={onRemove} templates={templates} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
