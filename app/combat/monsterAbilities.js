// Stat-block helpers for the turn tracker's monster panel: what a creature
// can do on its turn, which abilities are limited-use, and how far it moves.
//
// Usage bookkeeping lives on the enemy object:
//   abilityUses: { [abilityName]: usedCount }  — X/Day, recharge, per-rest
//   perDay<N>Used / spellSlots<level>Used       — spellcasting (shared with
//                                                 the card's QuickActionsModal)

// "(3/Day)", "(1/Day each)" → per-day; "(Recharge 5-6)" / "(Recharge 6)" →
// recharge on a d6 roll ≥ min; "(Recharges after a Short or Long Rest)" →
// once per rest. null when the ability is unlimited.
export const parseUsage = (name = '') => {
  const perDay = /\((\d+)\s*\/\s*day(?:\s+each)?\)/i.exec(name);
  if (perDay) return { kind: 'perDay', max: Number(perDay[1]) };
  const recharge = /\(recharge\s+(\d)(?:\s*[-–]\s*6)?\)/i.exec(name);
  if (recharge) return { kind: 'recharge', max: 1, min: Number(recharge[1]) };
  if (/\(recharges?\s+after/i.test(name)) return { kind: 'rest', max: 1 };
  return null;
};

// Display label without the usage parenthetical: "Breath Weapons (Recharge 5-6)" → "Breath Weapons".
export const abilityLabel = (name = '') =>
  name.replace(/\s*\((?:\d+\s*\/\s*day[^)]*|recharges?[^)]*)\)/i, '').trim() || name;

// The economy slot an ability costs, by stat-block section.
export const ECONOMY_BY_SECTION = { actions: 'action', bonusActions: 'bonus', reactions: 'reaction', traits: null };

const SECTIONS = ['actions', 'bonusActions', 'reactions', 'traits'];

// Groups a creature's abilities for the tracker. Traits only appear when they
// are limited-use (e.g. Legendary Resistance) — passive traits aren't
// something you "use".
export const getMonsterAbilities = (creature) => {
  const out = { actions: [], bonusActions: [], reactions: [], limitedTraits: [] };
  if (!creature) return out;
  for (const section of SECTIONS) {
    for (const ability of creature[section] || []) {
      if (!ability?.name) continue;
      const entry = { ...ability, section, usage: parseUsage(ability.name) };
      if (section === 'traits') {
        if (entry.usage) out.limitedTraits.push(entry);
      } else {
        out[section].push(entry);
      }
    }
  }
  return out;
};

export const getAbilityUsed = (creature, name) => creature?.abilityUses?.[name] || 0;

// Every movement mode as display strings: 30 → ['30 ft'];
// "40, burrow 40, fly 80" → ['40 ft', 'burrow 40 ft', 'fly 80 ft'];
// "0, fly 50 ft. (hover)" → ['0 ft', 'fly 50 ft (hover)']. Missing → ['30 ft'].
export const formatSpeeds = (speed) => {
  if (typeof speed === 'number') return [`${speed} ft`];
  const parts = String(speed ?? '').split(',').map(p => p.trim()).filter(Boolean);
  if (!parts.length) return ['30 ft'];
  return parts.map(p => p.replace(/(\d+)\s*(?:ft\.?|feet)?/i, '$1 ft').replace(/\s+/g, ' ').trim());
};

// "Dex +6, Con +13" → { dex: 6, con: 13 }. Unlisted abilities are absent
// (the caller falls back to the plain modifier).
const SAVE_KEYS = { str: 'str', dex: 'dex', con: 'con', int: 'int', wis: 'wis', cha: 'cha' };
export const parseSavingThrows = (text) => {
  const out = {};
  for (const m of String(text ?? '').matchAll(/\b(str|dex|con|int|wis|cha)\w*\s*([+\-−]\s*\d+)/gi)) {
    out[SAVE_KEYS[m[1].toLowerCase()]] = Number(m[2].replace('−', '-').replace(/\s/g, ''));
  }
  return out;
};

// "Blindsight 60 ft. (blind beyond), Darkvision 120 ft., Passive Perception 24"
// → { passive: 24, senses: ['Blindsight 60 ft. (blind beyond)', 'Darkvision 120 ft.'] }
export const parseSenses = (text) => {
  const parts = String(text ?? '').split(',').map(s => s.trim()).filter(Boolean);
  let passive = null;
  const senses = [];
  for (const p of parts) {
    const m = /passive\s+perception\s+(\d+)/i.exec(p);
    if (m) passive = Number(m[1]);
    else senses.push(p);
  }
  return { passive, senses };
};

// A defenses line as chips. 2024 stat blocks fold condition immunities into
// `immunities` after a semicolon ("Fire; Charmed, Frightened"), so ';'
// separates groups; within a group, commas separate entries unless the group
// reads as one clause ("…from nonmagical attacks"), which stays whole.
export const splitDefenses = (text) =>
  String(text ?? '')
    .split(';')
    .map(g => g.trim())
    .filter(Boolean)
    .flatMap(g => (/\b(?:from|that|and)\b/i.test(g) ? [g] : g.split(',').map(s => s.trim()).filter(Boolean)));
