// CR sorting helper
export const crToNumber = (cr) => {
  if (cr === '0') return 0;
  if (cr === '1/8') return 0.125;
  if (cr === '1/4') return 0.25;
  if (cr === '1/2') return 0.5;
  return parseFloat(cr) || 0;
};

// XP thresholds by level (2024 DMG) - per encounter
export const XP_THRESHOLDS = {
  1: { low: 50, moderate: 75, high: 100 },
  2: { low: 100, moderate: 150, high: 200 },
  3: { low: 150, moderate: 225, high: 400 },
  4: { low: 250, moderate: 375, high: 500 },
  5: { low: 500, moderate: 750, high: 1100 },
  6: { low: 600, moderate: 1000, high: 1400 },
  7: { low: 750, moderate: 1300, high: 1700 },
  8: { low: 1000, moderate: 1700, high: 2100 },
  9: { low: 1300, moderate: 2000, high: 2600 },
  10: { low: 1600, moderate: 2300, high: 3100 },
  11: { low: 1900, moderate: 2900, high: 4100 },
  12: { low: 2200, moderate: 3700, high: 4700 },
  13: { low: 2600, moderate: 4200, high: 5400 },
  14: { low: 2900, moderate: 4900, high: 6200 },
  15: { low: 3300, moderate: 5400, high: 7800 },
  16: { low: 3800, moderate: 6100, high: 9800 },
  17: { low: 4500, moderate: 7200, high: 11700 },
  18: { low: 5000, moderate: 8700, high: 14200 },
  19: { low: 5500, moderate: 10700, high: 17200 },
  20: { low: 6400, moderate: 13200, high: 22000 },
};

// 2014 DMG Daily XP Budget per character (for full adventuring day)
export const DAILY_XP_BUDGET_2014 = {
  1: 300, 2: 600, 3: 1200, 4: 1700, 5: 3500,
  6: 4000, 7: 5000, 8: 6000, 9: 7500, 10: 9000,
  11: 10500, 12: 11500, 13: 13500, 14: 15000, 15: 18000,
  16: 20000, 17: 25000, 18: 27000, 19: 30000, 20: 40000,
};

// Calculate XP budget for party
export const getDailyXPBudget = (partyLevel, partySize) => {
  const thresholds = XP_THRESHOLDS[partyLevel] || XP_THRESHOLDS[5];
  return {
    low: thresholds.low * partySize,
    moderate: thresholds.moderate * partySize,
    high: thresholds.high * partySize,
  };
};

// Get 2014 DMG daily budget
export const getDailyBudget2014 = (partyLevel, partySize) => {
  const perChar = DAILY_XP_BUDGET_2014[partyLevel] || DAILY_XP_BUDGET_2014[5];
  return perChar * partySize;
};