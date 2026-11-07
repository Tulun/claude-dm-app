// Canonical 2024 spellcasting progression: spell slots (single- and
// multiclass), Pact Magic, cantrips known, prepared-spell counts, and the
// spellbook → character spell-instance conversion. Used by the character
// creator (app/characters/creation) and the sheet's SpellPickerModal.
// See the rules-math skill.

import { generateId } from './generateId';

// How each class contributes to caster level. Fighter/Rogue only cast through
// a subclass (SUBCLASS_CASTERS).
export const CASTER_TYPE = {
  Bard: 'full', Cleric: 'full', Druid: 'full', Sorcerer: 'full', Wizard: 'full',
  Paladin: 'half', Ranger: 'half', Artificer: 'half',
  Warlock: 'pact',
};
export const SUBCLASS_CASTERS = {
  'Eldritch Knight': { type: 'third', list: 'Wizard', ability: 'int' },
  'Arcane Trickster': { type: 'third', list: 'Wizard', ability: 'int' },
};

export const SPELLCASTING_ABILITY = {
  Artificer: 'int', Bard: 'cha', Cleric: 'wis', Druid: 'wis', Paladin: 'cha',
  Ranger: 'wis', Sorcerer: 'cha', Warlock: 'cha', Wizard: 'int',
};

// Multiclass Spellcaster table: caster level → slots per spell level 1–9
const SLOTS_BY_CASTER_LEVEL = [
  [],
  [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2],
  [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

// Value from a [[minLevel, value], …] threshold list (ascending)
export const byLevel = (level, thresholds) => {
  let value = thresholds[0][1];
  for (const [min, v] of thresholds) if (level >= min) value = v;
  return value;
};

const casterTypeOf = ({ name, subclass }) => CASTER_TYPE[name] || SUBCLASS_CASTERS[subclass]?.type || null;

export const isCasterClass = (cls) => casterTypeOf(cls) !== null;

// Spell list a class picks from (Eldritch Knight → Wizard)
export const spellListFor = ({ name, subclass }) =>
  CASTER_TYPE[name] ? name : SUBCLASS_CASTERS[subclass]?.list || null;

export const spellcastingAbilityFor = ({ name, subclass }) =>
  SPELLCASTING_ABILITY[name] || SUBCLASS_CASTERS[subclass]?.ability || null;

// Caster level for the shared slot table. A lone half/third caster rounds up
// (that reproduces the Paladin / Eldritch Knight class tables); multiclassed,
// half casters round up and third casters round down (2024 PHB).
export const getCasterLevel = (classes) => {
  const casters = classes.filter(c => ['full', 'half', 'third'].includes(casterTypeOf(c)));
  if (casters.length === 1) {
    const [c] = casters;
    const type = casterTypeOf(c);
    return type === 'full' ? c.level : type === 'half' ? Math.ceil(c.level / 2) : Math.ceil(c.level / 3);
  }
  return casters.reduce((sum, c) => {
    const type = casterTypeOf(c);
    if (type === 'full') return sum + c.level;
    if (type === 'half') return sum + Math.ceil(c.level / 2);
    return sum + Math.floor(c.level / 3);
  }, 0);
};

// { 1: 4, 2: 3, … } from the shared table (Pact Magic excluded)
export const getSpellSlots = (classes) => {
  const row = SLOTS_BY_CASTER_LEVEL[Math.min(20, getCasterLevel(classes))] || [];
  return Object.fromEntries(row.map((n, i) => [i + 1, n]));
};

export const getPactMagic = (warlockLevel) => {
  if (!warlockLevel) return null;
  return {
    slots: byLevel(warlockLevel, [[1, 1], [2, 2], [11, 3], [17, 4]]),
    slotLevel: Math.min(5, Math.ceil(warlockLevel / 2)),
    arcanum: [[11, 6], [13, 7], [15, 8], [17, 9]].filter(([lvl]) => warlockLevel >= lvl).map(([, spell]) => spell),
  };
};

const CANTRIPS = {
  Bard: [[1, 2], [4, 3], [10, 4]],
  Cleric: [[1, 3], [4, 4], [10, 5]],
  Druid: [[1, 2], [4, 3], [10, 4]],
  Sorcerer: [[1, 4], [4, 5], [10, 6]],
  Warlock: [[1, 2], [4, 3], [10, 4]],
  Wizard: [[1, 3], [4, 4], [10, 5]],
  Artificer: [[1, 2], [10, 3], [14, 4]],
  third: [[3, 2], [10, 3]],
};

// Prepared spells by class level (index 0 = level 1)
const FULL_PREPARED = [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22];
const HALF_PREPARED = [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15];
const PREPARED = {
  Bard: FULL_PREPARED,
  Cleric: FULL_PREPARED,
  Druid: FULL_PREPARED,
  Sorcerer: [2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  Wizard: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 19, 21, 22, 23, 24, 25],
  Warlock: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
  Paladin: HALF_PREPARED,
  Ranger: HALF_PREPARED,
  Artificer: HALF_PREPARED,
  third: [0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13],
};

// What one class (at its own level) may pick: cantrips, prepared spells, and
// the highest spell level it can prepare. null for non-casters.
export const getSpellcastingLimits = (cls) => {
  const type = casterTypeOf(cls);
  if (!type) return null;
  const level = Math.min(20, Math.max(1, cls.level || 1));
  const key = type === 'third' ? 'third' : cls.name;
  const cantripTable = CANTRIPS[key];
  const cantrips = cantripTable && level >= cantripTable[0][0] ? byLevel(level, cantripTable) : 0;
  const prepared = PREPARED[key]?.[level - 1] || 0;
  let maxSpellLevel;
  if (type === 'pact') maxSpellLevel = getPactMagic(level).slotLevel;
  else {
    const slots = getSpellSlots([{ ...cls, level }]);
    maxSpellLevel = Math.max(0, ...Object.keys(slots).map(Number));
  }
  return { list: spellListFor(cls), cantrips, prepared, maxSpellLevel, ability: spellcastingAbilityFor(cls) };
};

// Spellbook entry (data/spells.json) → spell instance on a character
// (castingTime → castTime; see dm-app-map § spell field split).
export const toCharacterSpell = (spell, extra = {}) => ({
  id: generateId('spell'),
  sourceId: spell.id,
  name: spell.name,
  level: spell.level,
  school: spell.school,
  castTime: spell.castingTime || spell.castTime,
  range: spell.range,
  components: spell.components,
  duration: spell.duration,
  description: spell.description,
  higherLevels: spell.higherLevels,
  concentration: spell.concentration,
  ritual: spell.ritual,
  ...extra,
});
