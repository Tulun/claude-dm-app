'use client';

import LimitedUses from '../LimitedUses';
import { getLimitedPools } from '../../limitedUses';
import { formatSpeeds, parseSenses, splitDefenses } from '../../monsterAbilities';

// Damage / condition defenses, in the order a DM checks them mid-hit.
const DEFENSES = [
  { key: 'vulnerabilities', label: 'Vuln', chip: 'bg-red-900/40 text-red-200 border-red-700/50' },
  { key: 'resistances', label: 'Resist', chip: 'bg-amber-900/30 text-amber-200 border-amber-700/40' },
  { key: 'immunities', label: 'Immune', chip: 'bg-stone-700/50 text-stone-200 border-stone-600/60' },
  { key: 'conditionImmunities', label: 'Immune', chip: 'bg-stone-700/50 text-stone-200 border-stone-600/60' },
];

/**
 * Enemy card at-a-glance block, the monster counterpart of PartyGlance:
 * limited-use pips (legendary actions, X/Day / recharge / per-rest
 * abilities, per-day spells, spell slots — `getLimitedPools`, the same pools
 * the tracker's Limited row shows), then senses with passive Perception,
 * speeds and defenses chips.
 */
export default function EnemyGlance({ character, spellcastingInfo, onUpdate }) {
  const pools = getLimitedPools(character, spellcastingInfo, { legendary: true });
  const { passive, senses } = parseSenses(character.senses);
  const speeds = formatSpeeds(character.speed);
  const defenses = DEFENSES
    .map(d => ({ ...d, items: splitDefenses(character[d.key]) }))
    .filter(d => d.items.length);

  return (
    <div className="mt-2 space-y-1.5">
      {pools.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1" aria-label="Limited uses">
          <LimitedUses pools={pools} onUpdate={onUpdate} compact />
        </div>
      )}
      <div className="flex items-start gap-2">
        <div className="w-36 shrink-0 rounded bg-stone-800/50 px-2 py-1" aria-label="Senses">
          <div className="text-[10px] uppercase tracking-wider text-stone-500">Senses</div>
          <div className="flex justify-between text-xs" data-testid="enemy-passive-perception">
            <span className="text-stone-400">Passive Perc.</span>
            <span className="font-mono font-semibold text-stone-100">{passive ?? '—'}</span>
          </div>
          {senses.map(s => (
            <div key={s} className="text-[11px] text-stone-300 truncate" title={s}>{s}</div>
          ))}
        </div>
        <div className="min-w-0 flex-1 space-y-1 text-xs">
          <div className="rounded bg-stone-800/50 px-2 py-1">
            <div className="text-[10px] uppercase tracking-wider text-stone-500">Speed</div>
            <div className="font-mono text-stone-100" data-testid="enemy-speed">{speeds.join(' · ')}</div>
          </div>
          {defenses.map(d => (
            <div key={d.key} className="flex flex-wrap items-center gap-1" data-testid={`defense-${d.key}`}>
              <span className="text-[10px] uppercase tracking-wider text-stone-500 mr-0.5">{d.label}</span>
              {d.items.map(item => (
                <span key={item} className={`px-1.5 py-0.5 rounded border text-[11px] ${d.chip}`}>{item}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
