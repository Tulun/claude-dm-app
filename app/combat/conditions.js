// 5e (2024) conditions as structured combatant state.
//
// Stored on the combatant itself (party member → party.json, enemy →
// encounter.json) as `conditions: [{ name }, { name: 'Exhaustion', level }]`,
// in the order they were applied. Free-text `combatNotes` is separate — it's
// the catch-all for anything that isn't a condition.

// `tone` picks the chip color: severe = can't act, buff = Concentrating.
export const CONDITIONS = [
  { name: 'Blinded', tone: 'debuff', summary: "Can't see; attacks against it have advantage, its attacks have disadvantage." },
  { name: 'Charmed', tone: 'debuff', summary: "Can't attack the charmer; the charmer has advantage on social checks against it." },
  { name: 'Deafened', tone: 'debuff', summary: "Can't hear; fails checks that rely on hearing." },
  { name: 'Exhaustion', tone: 'exhaustion', summary: 'Each level: −2 to d20 tests and −5 ft speed. Level 6 is death.', maxLevel: 6 },
  { name: 'Frightened', tone: 'debuff', summary: "Disadvantage on checks and attacks while the source is in sight; can't move closer to it." },
  { name: 'Grappled', tone: 'debuff', summary: 'Speed 0; disadvantage on attacks against anyone but the grappler.' },
  { name: 'Incapacitated', tone: 'severe', summary: "No actions, bonus actions or reactions; concentration breaks; can't speak." },
  { name: 'Invisible', tone: 'stealth', summary: "Can't be seen; its attacks have advantage, attacks against it have disadvantage." },
  { name: 'Paralyzed', tone: 'severe', summary: 'Incapacitated, speed 0; fails STR/DEX saves; hits within 5 ft are crits.' },
  { name: 'Petrified', tone: 'severe', summary: 'Turned to stone: incapacitated, resistant to all damage, fails STR/DEX saves.' },
  { name: 'Poisoned', tone: 'debuff', summary: 'Disadvantage on attack rolls and ability checks.' },
  { name: 'Prone', tone: 'debuff', summary: 'Crawl or spend half speed to stand; melee attacks against it have advantage, ranged have disadvantage.' },
  { name: 'Restrained', tone: 'debuff', summary: 'Speed 0; disadvantage on attacks and DEX saves; attacks against it have advantage.' },
  { name: 'Stunned', tone: 'severe', summary: 'Incapacitated; fails STR/DEX saves; attacks against it have advantage.' },
  { name: 'Unconscious', tone: 'severe', summary: 'Incapacitated and prone, drops what it holds; fails STR/DEX saves; hits within 5 ft are crits.' },
  { name: 'Concentrating', tone: 'buff', summary: 'Maintaining a concentration spell — damage forces a CON save (DC 10 or half damage, max 30).' },
];

const BY_NAME = new Map(CONDITIONS.map(c => [c.name, c]));
export const getConditionInfo = (name) => BY_NAME.get(name) || null;

export const CONDITION_TONES = {
  debuff: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
  severe: 'bg-red-900/50 text-red-300 border-red-700/60',
  exhaustion: 'bg-orange-900/40 text-orange-300 border-orange-700/50',
  stealth: 'bg-cyan-900/40 text-cyan-300 border-cyan-700/50',
  buff: 'bg-purple-900/40 text-purple-300 border-purple-700/50',
};

// Tolerates missing/legacy shapes (bare strings) so old data never crashes.
export const getConditions = (combatant) =>
  (Array.isArray(combatant?.conditions) ? combatant.conditions : [])
    .map(c => (typeof c === 'string' ? { name: c } : c))
    .filter(c => c && c.name);

export const hasCondition = (combatant, name) => getConditions(combatant).some(c => c.name === name);

export const conditionLabel = (c) => (c.name === 'Exhaustion' && c.level ? `Exhaustion ${c.level}` : c.name);

// Each helper returns the combatant's NEW conditions array.
export const withoutCondition = (combatant, name) => getConditions(combatant).filter(c => c.name !== name);

export const toggledConditions = (combatant, name) => {
  if (hasCondition(combatant, name)) return withoutCondition(combatant, name);
  return [...getConditions(combatant), name === 'Exhaustion' ? { name, level: 1 } : { name }];
};

// Level 0 removes Exhaustion; clamped to 0..6. Keeps its position in the list.
export const withExhaustionLevel = (combatant, level) => {
  const next = Math.max(0, Math.min(BY_NAME.get('Exhaustion').maxLevel, level));
  const current = getConditions(combatant);
  if (next === 0) return current.filter(c => c.name !== 'Exhaustion');
  if (!current.some(c => c.name === 'Exhaustion')) return [...current, { name: 'Exhaustion', level: next }];
  return current.map(c => (c.name === 'Exhaustion' ? { ...c, level: next } : c));
};

export const getExhaustionLevel = (combatant) =>
  getConditions(combatant).find(c => c.name === 'Exhaustion')?.level || 0;

// ---- Durations -------------------------------------------------------------
// Optional, on the entry itself. Untimed entries carry neither key and are
// never touched by the turn ticks below.
//   { name, rounds: N }                 — counts down at the START of the
//                                         bearer's turn; removed when it hits 0
//                                         (so rounds: 1 lasts until their next
//                                         turn begins).
//   { name, until: 'endOfNextTurn' }    — becomes 'endOfThisTurn' when the
//   { name, until: 'endOfThisTurn' }      bearer's next turn starts, and is
//                                         removed when that turn ends.
export const END_OF_NEXT_TURN = 'endOfNextTurn';
export const END_OF_THIS_TURN = 'endOfThisTurn';

// Conditions that usually offer a save at the end of the bearer's turn
// (spells/effects vary — this only drives a reminder, never automation).
export const SAVE_AT_END_OF_TURN = ['Frightened', 'Paralyzed', 'Stunned', 'Restrained', 'Charmed', 'Poisoned'];

const isTimed = (c) => c.rounds > 0 || c.until === END_OF_NEXT_TURN || c.until === END_OF_THIS_TURN;

// Short chip suffix: "3r", "next turn", "this turn" — '' when untimed.
export const durationLabel = (c) => {
  if (c.rounds > 0) return `${c.rounds}r`;
  if (c.until === END_OF_NEXT_TURN) return 'next turn';
  if (c.until === END_OF_THIS_TURN) return 'this turn';
  return '';
};

export const durationTitle = (c) => {
  if (c.rounds > 0) return `${c.rounds} round${c.rounds === 1 ? '' : 's'} left (ticks at the start of its turn)`;
  if (c.until === END_OF_NEXT_TURN) return 'Until the end of its next turn';
  if (c.until === END_OF_THIS_TURN) return 'Ends at the end of this turn';
  return '';
};

// `duration`: null (untimed), a positive round count, or END_OF_NEXT_TURN.
// Exhaustion is level-based and never takes a duration. Missing name = no-op.
export const withConditionDuration = (combatant, name, duration) => {
  const current = getConditions(combatant);
  if (name === 'Exhaustion' || !current.some(c => c.name === name)) return current;
  return current.map(c => {
    if (c.name !== name) return c;
    const { rounds: _r, until: _u, ...rest } = c;
    if (duration === END_OF_NEXT_TURN) return { ...rest, until: END_OF_NEXT_TURN };
    const rounds = Math.floor(Number(duration));
    return rounds > 0 ? { ...rest, rounds } : rest;
  });
};

// Turn START for this combatant. Returns { conditions, expired } where
// `expired` lists the labels removed; `conditions` is the SAME array as the
// stored one (identity preserved) when nothing timed changed, so callers can
// bail out with `prev`.
export const tickConditionsAtTurnStart = (combatant) => {
  const stored = combatant?.conditions;
  const current = getConditions(combatant);
  if (!current.some(isTimed)) return { conditions: stored, expired: [] };
  const expired = [];
  const conditions = [];
  for (const c of current) {
    if (c.rounds > 0) {
      if (c.rounds - 1 <= 0) expired.push(conditionLabel(c));
      else conditions.push({ ...c, rounds: c.rounds - 1 });
    } else if (c.until === END_OF_NEXT_TURN) {
      conditions.push({ ...c, until: END_OF_THIS_TURN });
    } else {
      conditions.push(c);
    }
  }
  return { conditions, expired };
};

// Turn END for this combatant: drops 'endOfThisTurn' entries. Same return
// contract as tickConditionsAtTurnStart.
export const expireConditionsAtTurnEnd = (combatant) => {
  const stored = combatant?.conditions;
  const current = getConditions(combatant);
  const expired = current.filter(c => c.until === END_OF_THIS_TURN).map(conditionLabel);
  if (!expired.length) return { conditions: stored, expired };
  return { conditions: current.filter(c => c.until !== END_OF_THIS_TURN), expired };
};

// Active conditions on this combatant that usually allow an end-of-turn save.
export const endOfTurnSaveConditions = (combatant) =>
  getConditions(combatant).filter(c => SAVE_AT_END_OF_TURN.includes(c.name)).map(c => c.name);

// Applies a turn change to one combatant record: `endingId`'s turn ends, then
// `startingId`'s turn starts (the same id when only one combatant is in the
// order). Returns { combatant, expired } — `combatant` is the SAME object when
// nothing changed, so list setters can bail out with `prev`.
export const applyTurnChange = (combatant, endingId, startingId) => {
  let next = combatant;
  const expired = [];
  if (combatant.id === endingId) {
    const r = expireConditionsAtTurnEnd(next);
    if (r.expired.length) { next = { ...next, conditions: r.conditions }; expired.push(...r.expired); }
  }
  if (combatant.id === startingId) {
    const r = tickConditionsAtTurnStart(next);
    if (r.conditions !== next.conditions) next = { ...next, conditions: r.conditions };
    expired.push(...r.expired);
  }
  return { combatant: next, expired };
};
