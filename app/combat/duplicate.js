import { generateId } from '../utils/generateId';

// Per-fight state on an enemy (see dm-app-map's /api/encounter entry). A
// duplicate keeps the stat block, name and initiative but starts fresh: full
// HP, no conditions, notes, temp AC/HP or spent uses. Numbering the copy is
// numberEnemies' job (./enemyNames.js), run by the caller on the new list.
const FIGHT_STATE_KEYS = ['tempHp', 'tempAC', 'acEffect', 'conditions', 'combatNotes', 'legendaryActionsUsed', 'abilityUses'];
const SPENT_COUNTER = /^(perDay\d+|spellSlots\d+)Used$/;

export const duplicateEnemy = (enemy, id = generateId('enemy')) => {
  const copy = { ...enemy, id, currentHp: enemy.maxHp };
  for (const key of Object.keys(copy)) {
    if (FIGHT_STATE_KEYS.includes(key) || SPENT_COUNTER.test(key)) delete copy[key];
  }
  return copy;
};
