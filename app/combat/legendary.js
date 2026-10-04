// Legendary-action bookkeeping shared by the turn tracker and the enemy
// card's Quick Actions modal. Spent actions live on the enemy as
// `legendaryActionsUsed` and refresh at the start of that creature's turn.

export const LEGENDARY_ACTIONS_PER_ROUND = 3;

// "Wing Attack (Costs 2 Actions)" / "Heal Self (3 Actions)" → 2 / 3; else 1.
export const getLegendaryCost = (action) => {
  const match = /\((?:costs\s+)?(\d+)\s+actions?\)/i.exec(action?.name || '');
  return match ? Number(match[1]) : 1;
};

// Clicking pip i toggles it: a spent pip un-spends back to i, a fresh pip
// spends up through i.
export const toggledLegendaryUsed = (used, i) => (i < used ? i : i + 1);
