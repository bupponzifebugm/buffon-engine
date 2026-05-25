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
  open:    { label: 'Open',     className: 'st-open' },
  tp1:     { label: 'TP1 Hit',  className: 'st-tp1' },
  closed:  { label: 'Closed',   className: 'st-closed' },
  sl:      { label: 'SL Hit',   className: 'st-sl' },
  pending: { label: 'Pending',  className: 'st-pending' },
};

// ─── IDR SIZING TIERS (Thesis v3.1) ───
export const IDR_SIZING = [
  { min: 17500, max: Infinity, label: 'SURVIVAL', riskPct: 0.5, maxCapPct: 0.25 },
  { min: 17000, max: 17500, label: 'HIGH RISK', riskPct: 0.75, maxCapPct: 0.30 },
  { min: 16500, max: 17000, label: 'ELEVATED', riskPct: 0.85, maxCapPct: 0.35 },
  { min: 0, max: 16500, label: 'FAVORABLE', riskPct: 1.0, maxCapPct: 0.40 },
];

// ─── 12 BIGGEST LOSS PATTERNS ───
export const MISTAKE_TYPES = [
  'Revenge trading after any loss',
  'Trading red/news days without waiting 1 hour',
  'Buying at pucuk (chasing entries)',
  'SL not placed immediately after fill',
  'SL too thin (inside daily noise)',
  'Averaging down when thesis goes wrong',
  'Following AlgoTrade without own conviction',
  'Position size too large',
  'Choosing wrong ticker in right sector',
  'Mixing Ajaib invest with Stockbit scalp',
  'Comparing to others / FOMO entries',
  'Not moving SL to breakeven after TP1',
];

// ─── EMOTION TAGS ───
export const EMOTIONS = [
  { value: 'calm', label: 'Calm 😌', color: 'success' },
  { value: 'focused', label: 'Focused 🎯', color: 'success' },
  { value: 'fomo', label: 'FOMO 😰', color: 'danger' },
  { value: 'greedy', label: 'Greedy 🤑', color: 'warning' },
  { value: 'fearful', label: 'Fearful 😨', color: 'danger' },
  { value: 'impatient', label: 'Impatient 😤', color: 'warning' },
  { value: 'bored', label: 'Bored 😴', color: 'purple' },
  { value: 'revenge', label: 'Revenge 🔥', color: 'danger' },
];

// ─── UNFUCK UR MINDSET — 4 CORE SHIFTS ───
export const MINDSET_SHIFTS = [
  {
    title: '1. Detach and Extend the Timeline',
    points: [
      'Detach from initial losses. The losses are where we grow.',
      'See every single loss as a lesson, not a verdict.',
      'If I hadn\'t taken that loss, I wouldn\'t have learned anything from it.',
      'Mistakes are good things AS LONG as we grow from them.',
      'Everyone sucks at a skill they\'re trying to learn.',
      'Room for improvement. Be more efficient. Taking those shots.',
    ],
  },
  {
    title: '2. Stop Being a Bitch',
    points: [
      'There is no improvement if u kept crying at ur losses.',
      'What has happened has happened. Stop looking at the past.',
      'Every body has problems. Stop complaining. Stop pointing fingers.',
      '"This is the position I\'m in. How can I make this better?"',
      'You are the person that determines your future.',
      'Take action. Take the blame. Drop ego. Change the trajectory of your life.',
    ],
  },
  {
    title: '3. Stop Seeking Perfectionism (It\'s Procrastination)',
    points: [
      '99% of people have massive dreams, waiting for the perfect timing to start.',
      'It never lines up. There will always be problems.',
      'Start today. Start imperfect. Start now.',
      '"I wish I started earlier" — don\'t let that be you.',
      'Perfectionism in trading = waiting for perfect setup = missing valid setups = no learning.',
    ],
  },
  {
    title: '4. Build Trading Habits = Build Life Habits',
    points: [
      'Trading reflects who you are in life.',
      'If not discipline in ur life → how would u expect to be consistent in trading?',
      'Build discipline. Start building it in EVERY single aspect of life.',
      'Consistent in my life in every single aspect.',
      'Unconscious behaviour. Start building it now.',
      'We need to be fully in line with everything we want to do within trading.',
    ],
  },
];

// ─── THE 13 LESSONS ───
export const THIRTEEN_LESSONS = [
  { number: 1, title: 'EXPLAIN YOUR EDGE IN 5 MINUTES', description: 'Why does this strategy make money? Who\'s on the other side losing it? What are they doing wrong that you\'re doing right? If you can\'t answer these in 5 min → you don\'t have an edge yet.' },
  { number: 2, title: 'TRADING TAKES TIME', description: '3-4 years to know if you\'re any good. Reset your expectations and the journey becomes manageable. Timothy Ronald: 10 years. You: 7 months. Do the math.' },
  { number: 3, title: 'COMFORT AND RETURNS ARE INVERSELY RELATED', description: 'Less comfort = higher returns. High comfort = low returns. That\'s part of the game, not a sign something is wrong. Embrace the discomfort.' },
  { number: 4, title: 'PROCESS BEATS OUTCOMES', description: 'Good trade + win = edge working ✅\nGood process + loss = this is fine, variance ✅\nBad process + win = DANGEROUS. Most dangerous outcome. ⚠️\nBad process + loss = stop doing this immediately ❌' },
  { number: 5, title: 'ONE STRATEGY IS UNSTABLE', description: 'A portfolio is a business. Collection of uncorrelated strategies running. Future: diversify beyond intraday IHSG scalping.' },
  { number: 6, title: 'A MARGINAL TRADER IS ALWAYS IMPROVING', description: 'Not perfect. Not profitable yet. Just improving, every single day. Document. Review. Iterate. That IS the work.' },
  { number: 7, title: 'POSITION SIZE KILLS MORE ACCOUNTS THAN BAD ENTRIES', description: '1% risk per trade. This is the rule. Survival mode: 0.5% risk. IDR is the modifier. More accounts blown from oversizing than from bad analysis.' },
  { number: 8, title: 'DRAWDOWNS ARE THE COST OF BEING IN THE GAME', description: 'Every strategy has a worst day. Every trader has a worst month. The question is not whether you\'ll draw down. It\'s whether you survive it. April 2026 cost: Rp 238,000. That was tuition. Worth it.' },
  { number: 9, title: 'OVERFITTING IS THE ENEMY', description: 'When you tune your strategy so perfectly to past data it has no predictive power. Don\'t optimize for April 2026 conditions. Stay adaptive.' },
  { number: 10, title: 'EDGES DECAY ALWAYS', description: 'Have to adapt and find new ones. AlgoTrade bot evolving → stay on top of new data sources. What works today may not work in 12 months. Keep researching.' },
  { number: 11, title: 'DEPLOYED BEATS A BEAUTIFUL BACKTEST', description: 'Just get it live. Do it anyway. Live markets teach things no idea ever will. You are already deployed. Keep going.' },
  { number: 12, title: 'TRADING IS A RESEARCH GAME', description: 'You\'re a researcher who occasionally hits buttons. Find edge → test → deploy → monitor → iterate. Be a researcher. That mindset shift changes everything.' },
  { number: 13, title: 'AUTOMATE EARLIER THAN YOU THINK YOU SHOULD', description: 'Consistent execution. Emotional detachment. Multiple strategies. Somewhere along the way it actually starts working. Doesn\'t depend on mood.' },
];

// ─── MINDSET QUOTES (FROM HANDWRITTEN NOTEBOOK) ───
export const MINDSET_QUOTES = [
  'We are not getting rich in seconds, in days, in months. But in years.',
  'Trade so you can still trade another day.',
  'Cut loss adalah self love.',
  'Root cause of all execution problems: fuzzy definition of valid.',
  'TP1 does not mean take profit. It means make the trade free.',
  'The system already wins if executed. The only variable that breaks it is you.',
  'Timothy Ronald did 10 years. I am 7 months in.',
  'Comparison kills execution. Their timeline is not mine.',
  'Dropped out of med school. Gap year. Felt like a failure. Got into UGM. This is the same journey.',
  'If u not discipline in ur life, how would u expect to be consistent in trading?',
  'Bad process + win = most dangerous outcome.',
  'Deployed beats a beautiful backtest. Just get it live.',
  'Trading is a research game. You\'re a researcher who occasionally hits buttons.',
  'HE WHO KNOWS WHEN TO FIGHT AND WHEN NOT TO FIGHT, WILL BE VICTORIOUS. — Sun Tzu',
  'And for my final mission is to prove to myself that I can truly make my delusions a reality.',
  'SL hit = plan executed = that is a WIN.',
];

// ─── DAILY OPERATING CHECKLIST (10 STEPS) ───
export const DAILY_CHECKLIST = [
  'Focus score 7+? Below 7 = close app, no trade.',
  'USD/IDR rate checked? Determine today\'s risk % from IDR table.',
  'Wall Street green/mixed? All red = defensive only.',
  'Overnight news clear? Bad news = wait 1hr after 09:00.',
  '2 tickers pre-planned with entry/SL/TP written from last night?',
  'Lot size calculated from formula?',
  'Orderbook readable for target ticker?',
  'Bot signal still valid, not extended (not already +10%+)?',
  'SL placed IMMEDIATELY after fill?',
  'TP1 hit: sold 40% AND moved SL to breakeven? (both, not one)',
];

// ─── ALGOTRADE BOT PRIORITY STACK (10 RULES) ───
export const BOT_STACK_RULES = [
  { rule: 'Score ≥ 80', detail: 'Skip if < 75, no exceptions.' },
  { rule: 'Stage: EARLY_SETUP or EARLY_CONFIRM', detail: 'LATE / EXTENDED / DISTRIBUTION = skip.' },
  { rule: 'Asing: BUYING or Neutral', detail: 'SELLING = skip always.' },
  { rule: 'Bandar net %: positive', detail: '+0.1% of market cap minimum.' },
  { rule: 'Top buyers: AK, CC, XL, OD, MU', detail: 'MG dominant alone = warning.' },
  { rule: 'YP not in top 3 buyers', detail: 'YP #1 = retail late signal = skip.' },
  { rule: 'Buyer count < Seller count but net buy', detail: '= Accumulation signal.' },
  { rule: 'Volume: 2x+ above 5-day average', detail: 'Confirms institutional interest.' },
  { rule: 'Flow score: 60+', detail: 'If shown by bot.' },
  { rule: 'Bot SL: 4-7% below entry', detail: 'Tighter than 2.5% = skip.' },
];

// ─── LIFE DISCIPLINE REMINDERS ───
export const LIFE_REMINDERS = [
  'Target sleep 11:30 PM, wake 08:00 AM. Fasting 17/7. Life discipline = trading discipline.',
  'Timothy Ronald did 10 years. You are 7 months in. Respect the timeline.',
  'Active trading window: 08:30 – 10:30 WIB. Hard close 09:30 class days, 11:00 free days.',
  'Monday blocked (workshop 7:30 AM) → observation only. No trading.',
  'UGM Economics student first, trader second. Never let trading affect academics.',
  'Discipline in your life = discipline in trading. Build it in every single aspect.',
];

// ─── MISTAKE SOLUTIONS ───
export const MISTAKE_SOLUTIONS = {
  'Revenge trading after any loss': 'Walk away immediately. Revenge position 2 is ALWAYS worse than position 1.',
  'Trading red/news days without waiting 1 hour': 'Hands off keyboard until 09:30. Let the morning noise settle.',
  'Buying at pucuk (chasing entries)': 'If you missed the entry zone, move on. Another setup will come.',
  'SL not placed immediately after fill': 'Stop loss must be placed the exact second the entry order fills. No exceptions.',
  'SL too thin (inside daily noise)': 'Use the bot ATR SL (4-7%). Do not tighten it manually.',
  'Averaging down when thesis goes wrong': 'NEVER average down a loser. Cut loss is self-love.',
  'Following AlgoTrade without own conviction': 'Bot is a filter, not a command. Verify orderbook and logic first.',
  'Position size too large': 'Check the IDR sizing tier before sizing. Max risk 1%.',
  'Choosing wrong ticker in right sector': 'Check broker summary for AK/CC accumulation to confirm the leader.',
  'Mixing Ajaib invest with Stockbit scalp': 'Stockbit = Intraday. Ajaib = Invest. Separate worlds. Do not mix them.',
  'Comparing to others / FOMO entries': 'Their timeline is not yours. Delete social media during trading hours.',
  'Not moving SL to breakeven after TP1': 'Once 40% is sold at TP1, SL moves to breakeven immediately.',
  // Specific entries from notebook
  'Hesitate and miss entry': 'Pre-set a limit order before the level hits.',
  'Panic and exit early': 'The "only one reason to exit early" rule: Price closes a full candle below your Stop level. Not a wick.',
  'Move or ignore Stop loss': 'Hard stop in the platform - not in your head. Put stop losses.',
  'Enter unplanned trades': 'The 30-second test before any unplanned entry: "Can I explain in one sentence why I pre-planned this entry?" If you can\'t - don\'t enter.',
};

// ─── VALORANT-STYLE RANK SYSTEM ───
export const RANKS = [
  { key: 'iron',      label: 'Iron',      minRR: 0,    maxRR: 99,   icon: '⬛', color: '#6B655A' },
  { key: 'bronze',    label: 'Bronze',    minRR: 100,  maxRR: 199,  icon: '🟫', color: '#A0724E' },
  { key: 'silver',    label: 'Silver',    minRR: 200,  maxRR: 349,  icon: '⬜', color: '#9C9689' },
  { key: 'gold',      label: 'Gold',      minRR: 350,  maxRR: 499,  icon: '🟨', color: '#B07D35' },
  { key: 'platinum',  label: 'Platinum',  minRR: 500,  maxRR: 699,  icon: '💠', color: '#5EA8A0' },
  { key: 'diamond',   label: 'Diamond',   minRR: 700,  maxRR: 899,  icon: '💎', color: '#7A9FCC' },
  { key: 'ascendant', label: 'Ascendant', minRR: 900,  maxRR: 1199, icon: '🔷', color: '#467A57' },
  { key: 'immortal',  label: 'Immortal',  minRR: 1200, maxRR: 1599, icon: '🔴', color: '#D45D5D' },
  { key: 'radiant',   label: 'Radiant',   minRR: 1600, maxRR: Infinity, icon: '👑', color: '#E0936F' },
];

export function getRankFromRR(rr) {
  const safeRR = Math.max(0, rr);
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (safeRR >= RANKS[i].minRR) return RANKS[i];
  }
  return RANKS[0];
}

export function getNextRank(currentRank) {
  const idx = RANKS.findIndex(r => r.key === currentRank.key);
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
}

// RR Award Rules (Valorant-style: Process > Outcome)
export const RR_RULES = {
  GOOD_PROCESS_WIN:  { rr: 25,  label: 'Match MVP', desc: 'Good process + Win' },
  GOOD_PROCESS_LOSS: { rr: -5,  label: 'Honorable Defeat', desc: 'Good process + Loss' },
  BAD_PROCESS_WIN:   { rr: 5,   label: 'Lucky Round', desc: 'Bad process + Win' },
  BAD_PROCESS_LOSS:  { rr: -30, label: 'Tilted', desc: 'Bad process + Loss' },
};

export function calcRR(processScore, pnl) {
  const isGoodProcess = processScore >= 66; // 2/3 or 3/3 checks = good
  const isWin = pnl > 0;
  if (isGoodProcess && isWin) return RR_RULES.GOOD_PROCESS_WIN;
  if (isGoodProcess && !isWin) return RR_RULES.GOOD_PROCESS_LOSS;
  if (!isGoodProcess && isWin) return RR_RULES.BAD_PROCESS_WIN;
  return RR_RULES.BAD_PROCESS_LOSS;
}

// ─── ACHIEVEMENT BADGES ───
export const ACHIEVEMENTS = [
  {
    key: 'radiant_execution',
    icon: '🎯',
    label: 'Radiant Execution',
    desc: '5 consecutive trades with 100% Process Score',
    check: (positions) => {
      const recent = positions.slice(0, 5);
      return recent.length >= 5 && recent.every(p => p.process_score === 100);
    },
  },
  {
    key: 'thrifty',
    icon: '🧊',
    label: 'Thrifty',
    desc: 'Win +2R on a Survival Mode day',
    check: (positions) => {
      return positions.some(p => {
        const riskRp = (p.entry_price && p.sl_price && p.lots && p.entry_price > p.sl_price)
          ? (p.entry_price - p.sl_price) * p.lots * 100 : 0;
        return riskRp > 0 && p.pnl > 0 && (p.pnl / riskRp) >= 2;
      });
    },
  },
  {
    key: 'flawless',
    icon: '🛡️',
    label: 'Flawless',
    desc: 'Zero violations for 7+ consecutive trades',
    check: (positions) => {
      const recent = positions.slice(0, 7);
      return recent.length >= 7 && recent.every(p => !p.is_violation);
    },
  },
  {
    key: 'iron_wall',
    icon: '🏰',
    label: 'The Iron Wall',
    desc: 'Hit SL exactly on 3 trades (perfect risk control)',
    check: (positions) => {
      const slHits = positions.filter(p => p.status === 'sl' && p.process_score >= 66);
      return slHits.length >= 3;
    },
  },
  {
    key: 'hawks_patience',
    icon: '🦅',
    label: "Hawk's Patience",
    desc: 'Survive a full trading day with 0 trades logged',
    check: () => false, // This is tracked via special flag, checked by date
  },
  {
    key: 'sniper',
    icon: '🎯',
    label: 'The Sniper',
    desc: 'Hit TP2 with 100% Process Score',
    check: (positions) => {
      return positions.some(p => p.status === 'closed' && p.pnl > 0 && p.process_score === 100);
    },
  },
  {
    key: 'comeback_king',
    icon: '⚔️',
    label: 'Comeback King',
    desc: 'Recover from -3R drawdown to positive',
    check: (positions) => {
      let cumulativeR = 0;
      let wasDown3 = false;
      const sorted = [...positions].reverse();
      for (const p of sorted) {
        const riskRp = (p.entry_price && p.sl_price && p.lots && p.entry_price > p.sl_price)
          ? (p.entry_price - p.sl_price) * p.lots * 100 : 0;
        if (riskRp > 0 && p.pnl) {
          cumulativeR += p.pnl / riskRp;
          if (cumulativeR <= -3) wasDown3 = true;
          if (wasDown3 && cumulativeR > 0) return true;
        }
      }
      return false;
    },
  },
  {
    key: 'first_blood',
    icon: '🩸',
    label: 'First Blood',
    desc: 'Log your very first trade',
    check: (positions) => positions.length >= 1,
  },
];

// ─── JOURNAL TEMPLATES ───
export const JOURNAL_TEMPLATES = [
  {
    label: 'Morning Prep',
    content: `<h1>Morning Prep: \${date}</h1>
<h2>1. Macro & Market Regime</h2>
<ul><li><strong>USD/IDR:</strong> </li><li><strong>Wall Street Close:</strong> </li><li><strong>IHSG Bias:</strong> </li></ul>
<h2>2. Bot Stack & Watchlist</h2>
<ul><li><strong>Ticker 1:</strong> (Score: , Stage: , Plan: )</li><li><strong>Ticker 2:</strong> (Score: , Stage: , Plan: )</li></ul>
<h2>3. Mental Check</h2>
<p>Focus score: /10. <em>(Remember: IDR determines max risk today).</em></p>`
  },
  {
    label: 'Post-Market Review',
    content: `<h1>Post-Market Review: \${date}</h1>
<h2>1. Daily Stats</h2>
<ul><li><strong>PnL:</strong> Rp </li><li><strong>Trades taken:</strong> </li><li><strong>Win/Loss:</strong> </li></ul>
<h2>2. Did I follow the system?</h2>
<p>(Be brutally honest. Did you hit the daily checklist?)</p>
<h2>3. Biggest Mistake Today</h2>
<p>(What went wrong? Why?)</p>
<h2>4. Key Lesson for Tomorrow</h2>
<p>(...)</p>`
  }
];

// ─── SENIOR BADDIE DUO PARTNER DIALOGUES ───
export const DUO_DIALOGUES = {
  idle: [
    "I'm watching your sizing. Don't make me tap the sign.",
    "Bored? Go study for UGM. Don't force a trade just to feel something.",
    "Patience pays. Literally. Wait for the A+ setup."
  ],
  win_good_process: [
    "Flawless execution. Knew you had it in you.",
    "That's how we print. Clean process, clean profit.",
    "Textbook setup. Don't get arrogant though, reset for the next one."
  ],
  win_bad_process: [
    "You got lucky. Lucky process is poison. Fix your entries.",
    "We made money, but that was sloppy. Don't do that again.",
    "I'll take the green, but your execution was a mess. Focus."
  ],
  loss_good_process: [
    "Finally cut that loss? Good boy. That's how we protect capital.",
    "Good process, bad variance. Shake it off, the system works.",
    "Losses are just business expenses. You followed the rules, I'm proud."
  ],
  loss_bad_process: [
    "What was that? We literally talked about this.",
    "Revenge trading? Really? Step away from the keyboard.",
    "That was entirely avoidable. Stop chasing. Reset your mind."
  ],
  eco_round: [
    "Taking an Eco Round? Smart move. Just focus on form, I've got your back.",
    "Half size, full focus. Let's build that confidence back up."
  ],
  ult_ready: [
    "Ultimate is charged. Find a high conviction setup and let's pop it.",
    "You've been playing clean. Time to cash in on that Ult."
  ],
  cooldown: [
    "You're in timeout. Go drink some water. Do not touch the buy button."
  ]
};

// ─── GAMIFICATION THRESHOLDS ───
export const GAMIFICATION_CONFIG = {
  SHIELD_MAX: 100,
  SHIELD_INCREMENT: 20,
  ULT_MAX: 6,
  XP_PER_CHECK: 10, // XP gained per process checkbox
  FIRST_WIN_BONUS: 10
};
