// Every limited-use pool on a monster, in one shape, for the turn tracker's
// Limited row AND the enemy card's glance block — so both always agree.
// Each pool: { id, label, pipLabel, total, used, note, title, set(used) → creature }.
//   - legendary actions (opt-in): `legendaryActionsUsed`, 3 per round
//   - X/Day, recharge and per-rest abilities: `abilityUses[name]`
//   - per-day spells / spell slots: `perDay<N>Used` / `spellSlots<level>Used`

import { LEGENDARY_ACTIONS_PER_ROUND } from './legendary';
import { abilityLabel, getAbilityUsed, getMonsterAbilities } from './monsterAbilities';

const ABILITY_SECTIONS = ['actions', 'bonusActions', 'reactions'];

export function getLimitedPools(creature, spells, { legendary = false } = {}) {
  if (!creature) return [];
  const pools = [];
  const setField = (field) => (used) => ({ ...creature, [field]: used });

  if (legendary && creature.legendaryActions?.length > 0) {
    pools.push({
      id: 'legendary', label: 'Legendary', pipLabel: 'Legendary actions',
      total: LEGENDARY_ACTIONS_PER_ROUND, used: creature.legendaryActionsUsed || 0,
      note: '/round', set: setField('legendaryActionsUsed'),
    });
  }

  const abilities = getMonsterAbilities(creature);
  const limited = [...abilities.limitedTraits, ...ABILITY_SECTIONS.flatMap(s => abilities[s]).filter(a => a.usage)];
  for (const a of limited) {
    const label = abilityLabel(a.name);
    pools.push({
      id: `${a.section}:${a.name}`, label, pipLabel: label,
      total: a.usage.max, used: getAbilityUsed(creature, a.name),
      note: a.usage.kind === 'recharge' ? `Recharge ${a.usage.min === 6 ? '6' : `${a.usage.min}+`}` : a.usage.kind === 'rest' ? '/rest' : null,
      title: a.description,
      set: (used) => ({ ...creature, abilityUses: { ...(creature.abilityUses || {}), [a.name]: used } }),
    });
  }

  for (const [count, list] of Object.entries(spells?.perDay || {})) {
    const field = `perDay${count}Used`;
    pools.push({
      id: field, label: `${count}/Day spells`, pipLabel: `${count}/Day spells`,
      total: Number(count), used: creature[field] || 0, title: list.join(', '), set: setField(field),
    });
  }
  for (const [level, data] of Object.entries(spells?.slots || {})) {
    const field = `spellSlots${level}Used`;
    pools.push({
      id: field, label: level, pipLabel: `${level}-level slots`, isSlot: true,
      total: data.slots, used: creature[field] || 0, title: data.spells.join(', '), set: setField(field),
    });
  }
  return pools;
}
