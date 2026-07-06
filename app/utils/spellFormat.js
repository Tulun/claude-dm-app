// Shared spell display formatters — previously copied into SpellsModal,
// SpellPickerModal, and SpellsTab.

// Abbreviate casting time for compact display
export function abbreviateCastTime(castTime) {
  if (!castTime) return '—';
  const lower = castTime.toLowerCase();
  if (lower.startsWith('reaction')) return 'Reaction';
  if (lower.startsWith('bonus action')) return 'Bonus';
  if (lower === '1 action') return 'Action';
  if (lower.includes('minute')) return castTime.match(/\d+\s*min/i)?.[0] || castTime;
  if (lower.includes('hour')) return castTime.match(/\d+\s*h(ou)?r/i)?.[0] || castTime;
  return castTime;
}

export function getOrdinalSuffix(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// 0 → 'Cantrip', 3 → '3rd'; unparseable input is returned as-is.
// Callers compose display variants (e.g. `${getLevelLabel(level)} Level`).
export function getLevelLabel(level) {
  if (level === 0 || level === '0') return 'Cantrip';
  const num = parseInt(level);
  if (isNaN(num)) return level;
  return `${num}${getOrdinalSuffix(num)}`;
}
