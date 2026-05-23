/**
 * Number & currency formatters for Indonesian Rupiah
 */
export function fmt(n) {
  return Math.round(n).toLocaleString('id-ID');
}

export function fmtRp(n) {
  return 'Rp ' + fmt(n);
}

export function fmtPct(n) {
  return n.toFixed(1) + '%';
}

/**
 * Get the day of year (1-366) for daily quote rotation
 */
export function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Count consecutive clean trades (win=1 or loss=2).
 * Violation (3) resets streak. Empty (0) stops counting.
 */
export function getCleanStreak(challengeData) {
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const s = challengeData[i];
    if (s === 1 || s === 2) streak++;
    else if (s === 3) streak = 0;
    else if (s === 0) break;
  }
  return streak;
}

/**
 * Determine tier key based on clean streak count
 */
export function getTierKeyFromStreak(streak) {
  if (streak >= 30) return 'full_25m';
  if (streak >= 20) return 'step2_20m';
  if (streak >= 10) return 'step1_15m';
  return 'survival_10m';
}

/**
 * Get today's date as YYYY-MM-DD string (local timezone)
 */
export function getTodayString() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

/**
 * Get start of current week (Monday) as YYYY-MM-DD
 */
export function getWeekStartString() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.getFullYear() + '-' +
    String(monday.getMonth() + 1).padStart(2, '0') + '-' +
    String(monday.getDate()).padStart(2, '0');
}

/**
 * Get start of current month as YYYY-MM-DD
 */
export function getMonthStartString() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-01';
}

/**
 * Format a date string to Indonesian locale
 */
export function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}
