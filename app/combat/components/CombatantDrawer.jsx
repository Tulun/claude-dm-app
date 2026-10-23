'use client';

import { memo, useState } from 'react';
import useNavbarBottom from '../../hooks/useNavbarBottom';
import Icons from '../../components/Icons';
import { applyDamage, applyHealing } from '../hp';
import { formatSpeeds } from '../monsterAbilities';
import { getSaveBonus } from '../../character/components/constants';
import { formatMod } from '../../utils/rules';
import ConditionChips from './ConditionChips';
import LegendaryPips from './LegendaryPips';
import PartyLoadout from './PartyLoadout';
import PartyGlance from './CharacterCard/PartyGlance';
import CardActionButtons from './CharacterCard/CardActionButtons';
import CardModals from './CharacterCard/CardModals';
import { parseSpellcasting } from './CharacterCard/spellcastingParser';
import {
  getMod, getProfBonus, getSpellSaveDC, getSpellAttackBonus, formatClassList,
  getActiveWildShapeForm, getCardDisplayAC,
} from './CharacterCard/utils';

// Same colour language as the turn tracker: emerald = party, red = enemies,
// purple = companions / lair.
const KIND_STYLES = {
  party: { border: 'border-emerald-700/60', bg: 'bg-emerald-950/60', text: 'text-emerald-300' },
  companion: { border: 'border-purple-700/60', bg: 'bg-purple-950/60', text: 'text-purple-300' },
  enemy: { border: 'border-red-700/60', bg: 'bg-red-950/60', text: 'text-red-300' },
  lair: { border: 'border-purple-700/60', bg: 'bg-purple-950/60', text: 'text-purple-300' },
};

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

// Stat-block entry lists, in stat-block order. Rendered for any combatant
// that carries them (companions often have actions too).
const ENTRY_SECTIONS = [
  { key: 'traits', title: 'Traits', heading: 'text-amber-400', box: 'bg-stone-800/50 border-stone-700/40', name: 'text-amber-300' },
  { key: 'actions', title: 'Actions', heading: 'text-red-400', box: 'bg-red-950/30 border-red-900/30', name: 'text-red-300' },
  { key: 'bonusActions', title: 'Bonus Actions', heading: 'text-orange-400', box: 'bg-orange-950/30 border-orange-900/30', name: 'text-orange-300' },
  { key: 'reactions', title: 'Reactions', heading: 'text-cyan-400', box: 'bg-cyan-950/30 border-cyan-900/30', name: 'text-cyan-300' },
  { key: 'legendaryActions', title: 'Legendary Actions', heading: 'text-purple-400', box: 'bg-purple-950/30 border-purple-900/30', name: 'text-purple-300' },
];

// Free-text stat-block lines (monster templates store these as strings).
const DETAIL_LINES = [
  ['savingThrows', 'Saving Throws'],
  ['skills', 'Skills'],
  ['vulnerabilities', 'Vulnerabilities'],
  ['resistances', 'Resistances'],
  ['immunities', 'Immunities'],
  ['conditionImmunities', 'Condition Immunities'],
  ['senses', 'Senses'],
  ['languages', 'Languages'],
];

const Section = ({ title, className = 'text-stone-400', right, children }) => (
  <section className="space-y-1.5">
    <div className="flex items-center justify-between gap-2">
      <h3 className={`text-[11px] font-bold uppercase tracking-widest ${className}`}>{title}</h3>
      {right}
    </div>
    {children}
  </section>
);

const Stat = ({ label, children, className = '' }) => (
  <div className={`rounded-lg bg-stone-800/60 px-2.5 py-1.5 text-center ${className}`}>
    <div className="text-[10px] uppercase tracking-wider text-stone-500">{label}</div>
    <div className="font-mono font-semibold text-stone-100">{children}</div>
  </div>
);

// Damage / heal by amount (THP absorbs damage first — app/combat/hp.js) and a
// direct temp-HP field. Enter in the amount field = Damage; the THP field
// commits on Enter or blur, ignoring blank / negative input.
const HpPanel = ({ combatant, onUpdate }) => {
  const [amount, setAmount] = useState('');
  const [thp, setThp] = useState(null); // null = not editing, show stored value
  const max = combatant.maxHp || 1;
  const tempHp = combatant.tempHp || 0;
  const pct = Math.max(0, Math.min(100, (combatant.currentHp / max) * 100));
  const barColor = pct <= 25 ? 'bg-red-600' : pct <= 50 ? 'bg-amber-500' : 'bg-emerald-600';
  const down = combatant.currentHp <= 0;

  const apply = (fn) => {
    const next = fn(combatant, amount);
    if (next !== combatant) onUpdate(next);
    setAmount('');
  };
  const commitThp = () => {
    const n = parseInt(thp);
    if (!isNaN(n) && n >= 0 && n !== tempHp) onUpdate({ ...combatant, tempHp: n });
    setThp(null);
  };

  return (
    <div className="space-y-2" data-testid="drawer-hp">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <Icons.Heart />
          <span className={`text-2xl font-mono font-bold ${down ? 'text-red-400' : ''}`}>{combatant.currentHp}</span>
          {tempHp > 0 && <span className="font-mono text-cyan-400">+{tempHp}</span>}
          <span className="text-stone-500">/ {combatant.maxHp}</span>
          {down && <span className="ml-1 text-xs font-medium uppercase tracking-wide text-red-500">Down</span>}
        </div>
        {onUpdate && (
          <label className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-cyan-500">
            THP
            <input
              type="text"
              inputMode="numeric"
              aria-label={`Temp HP for ${combatant.name}`}
              value={thp ?? String(tempHp)}
              onFocus={(e) => { setThp(String(tempHp)); e.target.select(); }}
              onChange={(e) => setThp(e.target.value)}
              onBlur={commitThp}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.target.blur();
                else if (e.key === 'Escape') { setThp(null); e.preventDefault(); }
              }}
              className="w-12 text-center bg-stone-900 border border-cyan-700/60 rounded px-1 py-0.5 font-mono text-sm text-cyan-300 focus:outline-none focus:border-cyan-400"
            />
          </label>
        )}
      </div>
      <div className="h-2 rounded-full bg-stone-800 overflow-hidden">
        <div className={`h-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      {onUpdate && (
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            inputMode="numeric"
            aria-label={`Damage or healing for ${combatant.name}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') apply(applyDamage); }}
            placeholder="amount"
            className="w-20 text-center bg-stone-950 border border-stone-600 rounded px-1 py-1 font-mono text-sm focus:outline-none focus:border-amber-500"
          />
          <button onClick={() => apply(applyDamage)} className="px-3 py-1 rounded bg-red-800 hover:bg-red-700 text-white text-xs font-medium" title={tempHp > 0 ? 'Temp HP absorbs damage first (Enter)' : 'Apply damage (Enter)'}>
            Damage
          </button>
          <button onClick={() => apply(applyHealing)} className="px-3 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-medium" title="Heal (up to max HP)">
            Heal
          </button>
        </div>
      )}
    </div>
  );
};

const AbilityGrid = ({ combatant, isParty, wildShapeForm }) => (
  <div className="grid grid-cols-6 gap-1 text-center">
    {ABILITIES.map(key => {
      const beast = wildShapeForm && ['str', 'dex', 'con'].includes(key);
      const score = beast ? (wildShapeForm[key] || 10) : (combatant[key] || 10);
      const saveProf = isParty && (combatant.saveProficiencies?.[key] || 0) >= 1;
      return (
        <div key={key} className={`rounded p-1 ${beast ? 'bg-lime-900/40' : 'bg-stone-800/60'} ${saveProf ? 'ring-1 ring-emerald-600/50' : ''}`} data-testid={`drawer-ability-${key}`}>
          <div className="text-[10px] uppercase text-stone-500">{key} <span className="font-mono">{score}</span></div>
          <div className={`font-bold leading-tight ${beast ? 'text-lime-400' : ''}`}>{getMod(score)}</div>
          {isParty && (
            <div className={`text-[10px] ${saveProf ? 'text-emerald-400 font-semibold' : 'text-stone-500'}`}>
              save {formatMod(getSaveBonus({ ...combatant, [key]: score }, key))}
            </div>
          )}
        </div>
      );
    })}
  </div>
);

/**
 * The combat page's slide-over detail drawer: everything about ONE combatant
 * that the cards and the tracker's Now card can't fit — HP with damage/heal,
 * the full stat block, party saves / resources / loadout / features, notes.
 * It is NOT a modal (no backdrop), so the turn tracker stays usable beside it.
 * The page owns which combatant it shows (`following` = whoever's turn it is,
 * else pinned to one id) — see frontend-patterns §2.5. Card modals opened
 * from here render through CardModals, tied to the id they opened for.
 */
// The sticky Navbar is z-50 (same layer as Modal), so the drawer starts
// below it instead of out-ranking it — card modals opened from the drawer
// must still cover the drawer (`useNavbarBottom`).

const CombatantDrawer = ({ combatant, kind, isCurrent, following, canFollow, onToggleFollow, onClose, onUpdate, onSetLegendaryUsed, templates }) => {
  const [modal, setModal] = useState(null); // { id, key }
  const top = useNavbarBottom();
  if (!combatant) return null;

  const style = KIND_STYLES[kind] || KIND_STYLES.party;
  const isParty = kind === 'party';
  const isEnemy = kind === 'enemy';
  const hasCardModals = isParty || isEnemy;
  const isLair = kind === 'lair';
  const wildShapeForm = isParty ? getActiveWildShapeForm(combatant) : null;
  const spellcastingInfo = hasCardModals ? parseSpellcasting(combatant) : null;
  const displayAC = hasCardModals ? getCardDisplayAC(combatant) : (combatant.ac || 10);
  const spellDC = getSpellSaveDC(combatant);
  const spellAttack = getSpellAttackBonus(combatant);
  const openModal = (key) => setModal({ id: combatant.id, key });

  const subtitle = isLair
    ? null
    : isParty
      ? formatClassList(combatant)
      : kind === 'companion'
        ? `${combatant.ownerName ? `${combatant.ownerName}'s ` : ''}${combatant.form || 'companion'}`
        : [[combatant.size, combatant.creatureType].filter(Boolean).join(' '), combatant.cr != null && `CR ${combatant.cr}`].filter(Boolean).join(' · ');

  const details = DETAIL_LINES.filter(([key]) => combatant[key]);
  const features = isParty ? (combatant.features || []).filter(f => f?.name) : [];

  return (
    <>
      <aside
        role="complementary"
        aria-label={`Details: ${combatant.name}`}
        style={{ top }}
        className={`fixed bottom-0 right-0 z-40 w-full sm:w-[26rem] flex flex-col border-l-2 ${style.border} bg-stone-950/95 backdrop-blur-sm shadow-2xl shadow-black/60`}
      >
        <header className={`p-4 border-b ${style.border} ${style.bg}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                {isCurrent && <span className="text-amber-400">Now</span>}
                <span className="text-stone-500">{following ? 'Following turn' : 'Pinned'}</span>
              </div>
              <h2 className={`text-2xl font-bold truncate ${style.text}`}>
                {combatant.name}
                {wildShapeForm && <span className="ml-2 text-sm font-normal text-lime-400">🐾 {wildShapeForm.name}</span>}
              </h2>
              {subtitle && <div className="text-xs text-stone-400">{subtitle}</div>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {(following || canFollow) && (
                <button
                  onClick={onToggleFollow}
                  aria-pressed={!following}
                  title={following ? `Pin the drawer to ${combatant.name}` : 'Follow whoever’s turn it is'}
                  className={`px-2 py-1 rounded border text-xs font-medium ${
                    following
                      ? 'border-stone-600 text-stone-300 hover:border-amber-600 hover:text-amber-300'
                      : 'border-amber-600/70 bg-amber-950/50 text-amber-300 hover:border-amber-400'
                  }`}
                >
                  {following ? 'Pin' : 'Follow turn'}
                </button>
              )}
              <button onClick={onClose} aria-label="Close details" className="p-1.5 rounded text-stone-400 hover:text-stone-100 hover:bg-stone-800">
                <Icons.X />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {isLair ? (
            <p className="text-sm text-stone-300 whitespace-pre-wrap">{combatant.notes || <span className="italic text-stone-500">No description yet.</span>}</p>
          ) : (
            <>
              <HpPanel key={combatant.id} combatant={combatant} onUpdate={onUpdate} />

              <div className="grid grid-cols-4 gap-1.5">
                <Stat label="AC" className={combatant.tempAC > 0 ? 'ring-1 ring-amber-500/60' : combatant.acEffect ? 'ring-1 ring-cyan-500/50' : ''}>{displayAC}</Stat>
                <Stat label="Init">{combatant.initiative ?? '—'}</Stat>
                <Stat label="Prof">{formatMod(getProfBonus(combatant))}</Stat>
                {spellDC ? <Stat label="Spell DC" className="text-purple-300">{spellDC}{spellAttack != null && <span className="text-xs text-stone-400"> / {spellAttack}</span>}</Stat> : <Stat label="Hit Dice">{combatant.hitDice || '—'}</Stat>}
              </div>
              <div className="text-xs text-stone-400" data-testid="drawer-speed">
                <span className="text-stone-500">Speed </span>{formatSpeeds(wildShapeForm?.speed ?? combatant.speed).join(' · ')}
              </div>

              {hasCardModals && (
                <>
                  <ConditionChips character={combatant} onUpdate={onUpdate} onOpen={openModal} />
                  <div className="flex flex-wrap items-center gap-0.5 -ml-2">
                    <CardActionButtons character={combatant} isEnemy={isEnemy} spellcastingInfo={spellcastingInfo} onOpen={openModal} />
                  </div>
                </>
              )}

              <Section title="Abilities">
                <AbilityGrid combatant={combatant} isParty={isParty} wildShapeForm={wildShapeForm} />
              </Section>

              {details.length > 0 && (
                <Section title="Defenses & Senses">
                  <dl className="text-xs space-y-1">
                    {details.map(([key, label]) => (
                      <div key={key}>
                        <dt className="inline font-semibold text-stone-400">{label} </dt>
                        <dd className={`inline ${key === 'vulnerabilities' ? 'text-red-300' : 'text-stone-200'}`}>{combatant[key]}</dd>
                      </div>
                    ))}
                  </dl>
                </Section>
              )}

              {isParty && (
                <Section title="Resources & Passives">
                  <PartyGlance character={combatant} wildShapeForm={wildShapeForm} onUpdate={onUpdate} onOpen={openModal} />
                </Section>
              )}
              {isParty && (combatant.inventory || []).some(i => i?.equipped) && (
                <Section title="Equipped">
                  <PartyLoadout character={combatant} />
                </Section>
              )}

              {ENTRY_SECTIONS.map(s => {
                const entries = combatant[s.key] || [];
                if (!entries.length) return null;
                const pips = s.key === 'legendaryActions' && isEnemy && onSetLegendaryUsed
                  ? <LegendaryPips creature={combatant} onSetUsed={onSetLegendaryUsed} />
                  : null;
                return (
                  <Section key={s.key} title={s.title} className={s.heading} right={pips}>
                    <div className="space-y-1.5">
                      {entries.map((e, i) => (
                        <div key={e.name || i} className={`text-xs rounded border p-2 ${s.box}`}>
                          <span className={`font-semibold italic ${s.name}`}>{e.name}.</span>{' '}
                          <span className="text-stone-300 whitespace-pre-wrap">{e.description}</span>
                        </div>
                      ))}
                    </div>
                  </Section>
                );
              })}

              {isEnemy && spellcastingInfo?.found && spellcastingInfo.spellList && (
                <Section title="Spellcasting" className="text-purple-400">
                  <p className="text-xs text-stone-300 whitespace-pre-wrap">{spellcastingInfo.spellList}</p>
                </Section>
              )}

              {features.length > 0 && (
                <Section title="Features">
                  <div className="space-y-1">
                    {features.map((f, i) => (
                      <details key={f.id || i} className="rounded bg-stone-800/50 px-2 py-1 text-xs">
                        <summary className="cursor-pointer font-medium text-stone-200">{f.name}</summary>
                        {f.description && <p className="mt-1 text-stone-400 whitespace-pre-wrap">{f.description}</p>}
                      </details>
                    ))}
                  </div>
                </Section>
              )}

              {(combatant.combatNotes || hasCardModals) && (
                <Section
                  title="Combat Notes"
                  className="text-amber-400"
                  right={hasCardModals && (
                    <button onClick={() => openModal('notes')} className="text-xs text-amber-400 hover:text-amber-300">Edit</button>
                  )}
                >
                  <p className="text-xs text-stone-300 whitespace-pre-wrap">{combatant.combatNotes || <span className="italic text-stone-500">None.</span>}</p>
                </Section>
              )}
              {isEnemy && combatant.notes && (
                <p className="text-xs italic text-stone-500 whitespace-pre-wrap">{combatant.notes}</p>
              )}
            </>
          )}
        </div>
      </aside>
      {hasCardModals && modal?.id === combatant.id && (
        <CardModals
          activeModal={modal.key}
          onClose={() => setModal(null)}
          character={combatant}
          isEnemy={isEnemy}
          onUpdate={onUpdate}
          templates={templates}
          displayAC={displayAC}
          spellcastingInfo={spellcastingInfo}
        />
      )}
    </>
  );
};

export default memo(CombatantDrawer);
