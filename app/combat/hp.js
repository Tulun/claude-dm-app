// Hit-point bookkeeping for combatants (5e): temp HP absorbs damage first,
// HP never drops below 0, healing caps at maxHp and never restores temp HP.
// Each returns the updated combatant, or the SAME object when nothing changes
// (so list setters can bail out with `prev`).

const toAmount = (amount) => {
  const n = parseInt(amount);
  return Number.isNaN(n) || n <= 0 ? 0 : n;
};

export const applyDamage = (combatant, amount) => {
  const dmg = toAmount(amount);
  if (!dmg) return combatant;
  const tempHp = combatant.tempHp || 0;
  const absorbed = Math.min(tempHp, dmg);
  const currentHp = Math.max(0, (combatant.currentHp || 0) - (dmg - absorbed));
  if (absorbed === 0 && currentHp === combatant.currentHp) return combatant;
  return { ...combatant, tempHp: tempHp - absorbed, currentHp };
};

export const applyHealing = (combatant, amount) => {
  const heal = toAmount(amount);
  if (!heal) return combatant;
  const current = combatant.currentHp || 0;
  const max = parseInt(combatant.maxHp);
  const currentHp = Number.isNaN(max) ? current + heal : Math.max(current, Math.min(max, current + heal));
  if (currentHp === combatant.currentHp) return combatant;
  return { ...combatant, currentHp };
};
