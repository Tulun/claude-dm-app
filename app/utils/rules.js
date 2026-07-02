// Canonical 5e rules math — single source of truth for ability modifiers,
// proficiency bonus, and spellcasting DCs. Import from here instead of
// redefining these helpers locally.

export const getModNum = (score) => {
  const num = parseInt(score) || 10;
  return Math.floor((num - 10) / 2);
};

export const formatMod = (mod) => (mod >= 0 ? `+${mod}` : `${mod}`);

// Formatted modifier string, e.g. "+3" / "-1"
export const getMod = (score) => formatMod(getModNum(score));

// Total character level from the multiclass array, falling back to the legacy level field
export const getTotalLevel = (character) => {
  if (character?.classes?.length > 0) {
    return character.classes.reduce((sum, c) => sum + (parseInt(c.level) || 0), 0);
  }
  return parseInt(character?.level) || 0;
};

// Proficiency bonus: character level (multiclass-aware) first, then monster CR (full table to CR 30)
export const getProfBonus = (character) => {
  const totalLevel = getTotalLevel(character);
  if (totalLevel > 0) return Math.floor((totalLevel - 1) / 4) + 2;
  if (character?.cr) {
    const cr = character.cr;
    if (['0', '1/8', '1/4', '1/2'].includes(cr)) return 2;
    const crNum = parseInt(cr) || 1;
    if (crNum <= 4) return 2;
    if (crNum <= 8) return 3;
    if (crNum <= 12) return 4;
    if (crNum <= 16) return 5;
    if (crNum <= 20) return 6;
    if (crNum <= 24) return 7;
    if (crNum <= 28) return 8;
    return 9;
  }
  return 2;
};

const spellStatScore = (character) => {
  const statMap = { str: character.str, dex: character.dex, con: character.con, int: character.int, wis: character.wis, cha: character.cha };
  return statMap[character.spellStat];
};

export const getSpellSaveDC = (character) => {
  if (!character.spellStat) return null;
  let dc = 8 + getProfBonus(character) + getModNum(spellStatScore(character));
  // Add +1 for Innate Sorcery if active (Sorcerer feature)
  if (character.innateSorcery) dc += 1;
  return dc;
};

export const getSpellAttackBonus = (character) => {
  if (!character.spellStat) return null;
  const bonus = getProfBonus(character) + getModNum(spellStatScore(character));
  return formatMod(bonus);
};
