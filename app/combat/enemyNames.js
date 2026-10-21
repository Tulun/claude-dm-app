// Enemy names must be unique within a fight so the DM can track them ("which
// Goblin Boss took the hit?"). Every add path (Add Monster, Load Encounter,
// Duplicate) and the initial load runs the list through numberEnemies.

// "Goblin Boss 2" → "Goblin Boss"
export const baseName = (name) => String(name || 'Monster').replace(/\s+\d+$/, '');
const numberOf = (name) => {
  const m = /\s+(\d+)$/.exec(String(name || ''));
  return m ? Number(m[1]) : null;
};

// Any name family (same base name) with more than one member gets every
// member numbered: members that already hold a unique number keep it; the
// rest (unnumbered, or a number already taken) get the lowest free numbers in
// list order — so a lone "Ogre" joined by another "Ogre" becomes Ogre 1 / Ogre 2.
// Returns the same array when nothing changes (keeps auto-save quiet).
export const numberEnemies = (enemies) => {
  const families = new Map();
  enemies.forEach((e, i) => {
    const base = baseName(e.name);
    if (!families.has(base)) families.set(base, []);
    families.get(base).push(i);
  });

  const names = enemies.map(e => e.name);
  for (const [base, indexes] of families) {
    if (indexes.length < 2) continue;
    const used = new Set();
    const needsNumber = [];
    for (const i of indexes) {
      const n = numberOf(enemies[i].name);
      if (n !== null && !used.has(n)) used.add(n);
      else needsNumber.push(i);
    }
    let next = 1;
    for (const i of needsNumber) {
      while (used.has(next)) next++;
      used.add(next);
      names[i] = `${base} ${next}`;
    }
  }

  return names.some((n, i) => n !== enemies[i].name)
    ? enemies.map((e, i) => (names[i] === e.name ? e : { ...e, name: names[i] }))
    : enemies;
};
