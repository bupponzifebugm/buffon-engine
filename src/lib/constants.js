// ─── RISK PARAMETERS ───
export const RISK_PCT = 0.5;       // 0.5% risk per trade (Survival Mode)
export const MAX_CAP_PCT = 0.25;   // 25% max position cap

// ─── CAPITAL TIER SYSTEM (Thesis v3.1) ───
export const TIERS = {
  survival_10m: {
    label: 'Survival Mode',
    capital: 10_000_000,
    riskPct: 0.5,
    maxLoss: 50_000,
    maxPosCap: 2_500_000,
    dailyLimit: 200_000,
    dailyLimitPct: 2,
    weeklyLimitPct: 3,
    monthlyLimitPct: 7,
    consecutiveStopLimit: 2,
    requiredStreak: 0,
    badge: 'SURVIVAL',
    badgeColor: 'danger',
  },
  step1_15m: {
    label: 'Step 1',
    capital: 15_000_000,
    riskPct: 0.5,
    maxLoss: 75_000,
    maxPosCap: 3_750_000,
    dailyLimit: 300_000,
    dailyLimitPct: 2,
    weeklyLimitPct: 3,
    monthlyLimitPct: 7,
    consecutiveStopLimit: 2,
    requiredStreak: 10,
    badge: 'STEP 1',
    badgeColor: 'warning',
  },
  step2_20m: {
    label: 'Step 2',
    capital: 20_000_000,
    riskPct: 0.5,
    maxLoss: 100_000,
    maxPosCap: 5_000_000,
    dailyLimit: 400_000,
    dailyLimitPct: 2,
    weeklyLimitPct: 3,
    monthlyLimitPct: 7,
    consecutiveStopLimit: 2,
    requiredStreak: 20,
    badge: 'STEP 2',
    badgeColor: 'purple',
  },
  full_25m: {
    label: 'Full Deployment',
    capital: 25_000_000,
    riskPct: 0.5,
    maxLoss: 125_000,
    maxPosCap: 6_250_000,
    dailyLimit: 500_000,
    dailyLimitPct: 2,
    weeklyLimitPct: 3,
    monthlyLimitPct: 7,
    consecutiveStopLimit: 2,
    requiredStreak: 30,
    badge: 'FULL DEPLOY',
    badgeColor: 'success',
  },
};

// Ordered list for upgrade path lookups
export const TIER_ORDER = ['survival_10m', 'step1_15m', 'step2_20m', 'full_25m'];

// ─── DAILY QUOTES ───
export const DAILY_QUOTES = [
  { text: "Cut loss is love.", author: "Buffon's Trading Psychology Rule #8" },
  { text: "Follow the system, but loss is still a win.", author: "Buffon's Trading Psychology Rule #2" },
  { text: "No entering at peak. Do not move stop loss.", author: "Buffon's Trading Psychology Rules #5 & #7" },
  { text: "Don't trade unplanned trades. No trade is best choice.", author: "Buffon's Trading Psychology Rules #9 & #11" },
  { text: "The diligent earn wealth, but the hasty only experience poverty.", author: "Proverbs 21:5" },
  { text: "Divide your investments among many places, for you do not know what risks might lie ahead.", author: "Ecclesiastes 11:2" },
  { text: "There is a time to go long, a time to go short, and a time to go fishing.", author: "Jesse Livermore" },
  { text: "If you cannot control your emotions, you cannot control your money.", author: "Warren Buffett" },
  { text: "Victorious warriors win first and then go to war, while defeated warriors go to war first and then seek to win.", author: "Sun Tzu" },
  { text: "Every trade is just one out of a thousand. It has no special meaning. Execute the system.", author: "Mark Douglas" },
  { text: "The most important rule of trading is to play great defense, not great offense.", author: "Paul Tudor Jones" },
  { text: "Losses are the tuition you pay for learning how to trade. Don't pay tuition twice for the same lesson.", author: "Trading Proverb" },
  { text: "You don't stop when you're tired. You stop when you're done. Protect the streak.", author: "David Goggins" },
  { text: "The market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett" },
  { text: "Amateurs focus on how much they can make. Professionals focus on how much they could lose.", author: "Unknown" },
  { text: "A peak is only a peak after it reverses. Do not chase.", author: "System Mandate" },
  { text: "Revenge trading is paying the market twice for your own mistake.", author: "Trading Proverb" },
  { text: "Discipline in your life translates directly to discipline in your trading.", author: "Buffon's Trading Psychology Rule #4" },
  { text: "Let your winners run, but trail your stop to protect your capital.", author: "System Mandate" },
  { text: "2-3% profit is more than enough on gap downs or red days.", author: "Buffon's Rule #6" },
];

// ─── STATUS CONFIGS ───
export const STATUS_CONFIG = {
  open:   { label: 'Open',     className: 'st-open' },
  tp1:    { label: 'TP1 Hit',  className: 'st-tp1' },
  closed: { label: 'Closed',   className: 'st-closed' },
  sl:     { label: 'SL Hit',   className: 'st-sl' },
};
