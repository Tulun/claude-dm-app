// Default limited-use resources for a new character (2024 PHB): class
// features by class level, spell slots / Pact Magic, and a few species and
// feat uses. Rows become `character.resources` entries ({ id, name, current,
// max } + `recharge`, which the sheet ignores but keeps). Spell-slot names
// must match PartyGlance's SLOT_NAME ("1st Level Spell Slots") so the combat
// tracker can spend them.
//
// The /classes level tables (CLASS_DETAILS) are NOT used for these counts —
// several resource columns there are off (see SUGGESTIONS.md).

import { getModNum, getProfBonus } from '../../utils/rules';
import { byLevel, getSpellSlots, getPactMagic, isCasterClass } from '../../utils/spellcasting';
import { getOrdinalSuffix } from '../../utils/spellFormat';

const LR = 'Long Rest';
const SR = 'Short or Long Rest';

// Each entry: (classLevel, ctx) → [{ name, max, recharge }]; max 0 = omitted
const CLASS_RESOURCES = {
  Barbarian: (l) => [{ name: 'Rage', max: byLevel(l, [[1, 2], [3, 3], [6, 4], [12, 5], [17, 6]]), recharge: `${LR} (1 on Short Rest)` }],
  Bard: (l, ctx) => [{ name: 'Bardic Inspiration', max: Math.max(1, getModNum(ctx.scores.cha)), recharge: l >= 5 ? SR : LR }],
  Cleric: (l) => [
    { name: 'Channel Divinity', max: l >= 2 ? byLevel(l, [[2, 2], [6, 3], [18, 4]]) : 0, recharge: `${LR} (1 on Short Rest)` },
    { name: 'Divine Intervention', max: l >= 10 ? 1 : 0, recharge: LR },
  ],
  Druid: (l) => [{ name: 'Wild Shape', max: l >= 2 ? byLevel(l, [[2, 2], [6, 3], [17, 4]]) : 0, recharge: `${LR} (1 on Short Rest)` }],
  Fighter: (l) => [
    { name: 'Second Wind', max: byLevel(l, [[1, 2], [4, 3], [10, 4]]), recharge: `${LR} (1 on Short Rest)` },
    { name: 'Action Surge', max: l >= 2 ? byLevel(l, [[2, 1], [17, 2]]) : 0, recharge: SR },
    { name: 'Indomitable', max: l >= 9 ? byLevel(l, [[9, 1], [13, 2], [17, 3]]) : 0, recharge: LR },
  ],
  Monk: (l) => [{ name: 'Focus Points', max: l >= 2 ? l : 0, recharge: SR }],
  Paladin: (l) => [
    { name: 'Lay on Hands (HP pool)', max: 5 * l, recharge: LR },
    { name: 'Channel Divinity', max: l >= 3 ? byLevel(l, [[3, 2], [11, 3]]) : 0, recharge: `${LR} (1 on Short Rest)` },
  ],
  Ranger: (l) => [{ name: 'Favored Enemy (free Hunter\'s Mark)', max: byLevel(l, [[1, 2], [5, 3], [9, 4], [13, 5], [17, 6]]), recharge: LR }],
  Rogue: (l) => [{ name: 'Stroke of Luck', max: l >= 20 ? 1 : 0, recharge: SR }],
  Sorcerer: (l) => [
    { name: 'Sorcery Points', max: l >= 2 ? l : 0, recharge: LR },
    { name: 'Innate Sorcery', max: 2, recharge: LR },
  ],
  Warlock: (l) => [
    { name: 'Magical Cunning', max: l >= 2 ? 1 : 0, recharge: LR },
    ...(getPactMagic(l)?.arcanum || []).map(spellLevel => ({ name: `Mystic Arcanum (${spellLevel}${getOrdinalSuffix(spellLevel)} level)`, max: 1, recharge: LR })),
  ],
  Wizard: () => [{ name: 'Arcane Recovery', max: 1, recharge: LR }],
  Artificer: (l, ctx) => [{ name: 'Flash of Genius', max: l >= 7 ? Math.max(1, getModNum(ctx.scores.int)) : 0, recharge: LR }],
};

const SPECIES_RESOURCES = {
  Aasimar: (lvl) => [
    { name: 'Healing Hands', max: 1, recharge: LR },
    { name: 'Celestial Revelation', max: lvl >= 3 ? 1 : 0, recharge: LR },
  ],
  Dragonborn: (lvl, pb) => [
    { name: 'Breath Weapon', max: pb, recharge: LR },
    { name: 'Draconic Flight', max: lvl >= 5 ? 1 : 0, recharge: LR },
  ],
  Dwarf: (lvl, pb) => [{ name: 'Stonecunning', max: pb, recharge: LR }],
  Goliath: (lvl, pb, lineage) => [
    { name: lineage ? `Giant Ancestry: ${lineage}` : 'Giant Ancestry', max: pb, recharge: LR },
    { name: 'Large Form', max: lvl >= 5 ? 1 : 0, recharge: LR },
  ],
  Orc: (lvl, pb) => [
    { name: 'Adrenaline Rush', max: pb, recharge: SR },
    { name: 'Relentless Endurance', max: 1, recharge: LR },
  ],
};

const FEAT_RESOURCES = {
  Lucky: (pb) => ({ name: 'Luck Points', max: pb, recharge: LR }),
};

const slotName = (level) => `${level}${getOrdinalSuffix(level)} Level Spell Slots`;

// ctx: { classes: [{ name, level, subclass }], totalLevel, scores, species, lineage, feats }
// → [{ key, name, max, recharge, source }]
export const getDefaultResources = (ctx) => {
  const out = [];
  const pb = getProfBonus({ level: ctx.totalLevel });
  const push = (source, list) => {
    for (const r of list) if (r.max > 0) out.push({ key: `${source}:${r.name}`, source, ...r });
  };

  for (const cls of ctx.classes) push(cls.name, CLASS_RESOURCES[cls.name]?.(cls.level, ctx) || []);

  // Same-named class resources from two classes (Channel Divinity) stay apart
  const counts = {};
  for (const r of out) counts[r.name] = (counts[r.name] || 0) + 1;
  for (const r of out) if (counts[r.name] > 1) r.name = `${r.name} (${r.source})`;

  const slots = getSpellSlots(ctx.classes);
  for (const [level, max] of Object.entries(slots)) {
    out.push({ key: `slots:${level}`, source: 'Spellcasting', name: slotName(level), max, recharge: LR });
  }
  const warlock = ctx.classes.find(c => c.name === 'Warlock');
  const pact = getPactMagic(warlock?.level);
  if (pact) {
    // Alone, pact slots use the standard name so combat can spend them;
    // beside other slots they get their own row.
    const otherCaster = ctx.classes.some(c => c.name !== 'Warlock' && isCasterClass(c));
    const name = otherCaster ? `Pact Magic Slots (${pact.slotLevel}${getOrdinalSuffix(pact.slotLevel)} level)` : slotName(pact.slotLevel);
    out.push({ key: 'pact', source: 'Warlock', name, max: pact.slots, recharge: SR });
  }

  if (ctx.species) push(ctx.species, SPECIES_RESOURCES[ctx.species]?.(ctx.totalLevel, pb, ctx.lineage) || []);
  for (const feat of ctx.feats || []) if (FEAT_RESOURCES[feat]) push(feat, [FEAT_RESOURCES[feat](pb)]);
  return out;
};

// Defaults with the creator's edits applied: edits = { [key]: { name?, max?, removed? } },
// custom = [{ key, name, max }]
export const applyResourceEdits = (defaults, edits = {}, custom = []) => [
  ...defaults.map(r => ({ ...r, ...(edits[r.key] || {}) })),
  ...custom.map(r => ({ source: 'Custom', recharge: '', ...r })),
];
