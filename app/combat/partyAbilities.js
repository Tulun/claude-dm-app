// Turn-time helpers for a party member's expanded This Turn panel: which
// spells they can cast right now, what each costs in the action economy, and
// which spell slot a cast spends. Slots themselves come from PartyGlance's
// `getResourcePools` (resources named "1st Level Spell Slot(s)" or the legacy
// `spellSlots` map) — don't re-parse them here.

import { getAllClasses } from '../utils/rules';

// Classes that prepare spells (vs. know them) — shared with SpellsModal.
export const PREPARED_CASTER_CLASSES = ['Cleric', 'Druid', 'Paladin', 'Wizard'];

export const getPreparedCasterInfo = (character) =>
  getAllClasses(character).find(c => PREPARED_CASTER_CLASSES.includes(c.name)) || null;

// "Action" / "1 action" → 'action'; "Bonus Action" / "1 bonus action" →
// 'bonus'; "Reaction, which you take when…" → 'reaction'; minutes / hours →
// null (not a combat-turn spell).
export const spellEconomy = (castTime = '') => {
  const t = String(castTime).toLowerCase();
  if (t.includes('reaction')) return 'reaction';
  if (t.includes('bonus')) return 'bonus';
  if (t.includes('action')) return 'action';
  return null;
};

// Spells castable this turn, grouped by economy slot and sorted cantrips
// first, then by level and name. Prepared casters only get prepared /
// always-prepared spells (cantrips always count); known casters get all.
export const getTurnSpells = (character) => {
  const out = { action: [], bonus: [], reaction: [] };
  const prepared = !!getPreparedCasterInfo(character);
  for (const spell of character?.spells || []) {
    if (!spell?.name) continue;
    const level = parseInt(spell.level) || 0;
    if (prepared && level > 0 && !spell.prepared && !spell.alwaysPrepared) continue;
    const slot = spellEconomy(spell.castTime || spell.castingTime);
    if (slot) out[slot].push({ ...spell, level });
  }
  for (const list of Object.values(out)) list.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  return out;
};

// The slot pool a leveled spell spends: the lowest level that is at least the
// spell's and still has a slot (upcast only when forced). null = nothing left.
export const pickSlotPool = (pools, level) =>
  pools
    .filter(p => p.isSlot && p.slotLevel >= level && p.current > 0)
    .sort((a, b) => a.slotLevel - b.slotLevel)[0] || null;
