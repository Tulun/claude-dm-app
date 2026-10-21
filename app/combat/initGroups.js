import { baseName } from './enemyNames';

// Group initiative: enemies of one name family ("Goblin Boss 1", "Goblin
// Boss 2") share one initiative value — setting any member's sets them all.
// `ownInit: true` splits an enemy off onto its own value; clearing it rejoins
// the family's value. Separate turns remain (each member is still its own
// combatant in the order); only the number is shared.

const sameGroup = (a, b) => !a.ownInit && !b.ownInit && baseName(a.name) === baseName(b.name);

// Members sharing `enemy`'s initiative, itself included.
export const initGroupOf = (enemies, enemy) =>
  enemy.ownInit ? [enemy] : enemies.filter(e => sameGroup(e, enemy));

// The ids `id`'s initiative edit applies to.
const groupIds = (enemies, id) => {
  const enemy = enemies.find(e => e.id === id);
  return new Set(enemy ? initGroupOf(enemies, enemy).map(e => e.id) : []);
};

const withInitiative = (enemies, ids, initiative) => {
  const next = enemies.map(e => (ids.has(e.id) && e.initiative !== initiative ? { ...e, initiative } : e));
  return next.some((e, i) => e !== enemies[i]) ? next : enemies;
};

// Set one enemy's initiative (and its group's). Same array when nothing changed.
export const setEnemyInitiative = (enemies, id, initiative) =>
  withInitiative(enemies, groupIds(enemies, id), initiative);

// Every grouped family takes its first member's value — run on each add path
// and on load (after numberEnemies) so newcomers join their family's turn.
export const shareGroupInitiative = (enemies) => {
  let next = enemies;
  const seen = new Set();
  for (const e of enemies) {
    if (e.ownInit) continue;
    const base = baseName(e.name);
    if (seen.has(base)) continue;
    seen.add(base);
    next = withInitiative(next, groupIds(next, e.id), e.initiative);
  }
  return next;
};

// Split an enemy onto its own initiative (keeps its current value), or rejoin
// it to its family's shared value.
export const setOwnInitiative = (enemies, id, own) => {
  const i = enemies.findIndex(e => e.id === id);
  if (i < 0 || !!enemies[i].ownInit === own) return enemies;
  const { ownInit: _dropped, ...rest } = enemies[i];
  const updated = own ? { ...enemies[i], ownInit: true } : rest;
  const next = enemies.map((e, j) => (j === i ? updated : e));
  if (own) return next;
  const groupmate = next.find(e => e.id !== id && sameGroup(e, updated));
  return groupmate ? setEnemyInitiative(next, groupmate.id, groupmate.initiative) : next;
};
