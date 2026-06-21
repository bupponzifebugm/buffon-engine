import { useState, useEffect, useCallback } from 'react';
import './App.css';

// Hooks
import { useAuth } from './hooks/useAuth';
import { usePositions } from './hooks/usePositions';
import { useChallenge } from './hooks/useChallenge';
import { useMorningGate } from './hooks/useMorningGate';
import { useJournal } from './hooks/useJournal';
import { useMistakes } from './hooks/useMistakes';
import { useConfidentReceipts } from './hooks/useConfidentReceipts';

// Components
import AuthGate from './components/Auth/AuthGate';
import Header from './components/Layout/Header';
import TabNav from './components/Layout/TabNav';
import MorningGate from './components/MorningGate/MorningGate';
import DuoPartner from './components/Dashboard/DuoPartner';
import AlertCenter from './components/Dashboard/AlertCenter';
import DrawdownMonitor from './components/Drawdown/DrawdownMonitor';
import SizingCalculator from './components/Calculator/SizingCalculator';
import TPProtocol from './components/Calculator/TPProtocol';
import ChallengeTracker from './components/Challenge/ChallengeTracker';
import PositionsTable from './components/Positions/PositionsTable';
import AddTradeModal from './components/Positions/AddTradeModal';
import TradingSystem from './components/System/TradingSystem';
import MistakesLog from './components/Mistakes/MistakesLog';
import MindsetPanel from './components/Mindset/MindsetPanel';
import Journal from './components/Journal/Journal';
import DailyQuote from './components/Quotes/DailyQuote';
import AnalyticsDashboard from './components/Dashboard/AnalyticsDashboard';
import CardGallery from './components/Cards/CardGallery';
import ConfidentLog from './components/Confident/ConfidentLog';
import TradingCoach from './components/Chat/TradingCoach';

// Constants
import { TIERS } from './lib/constants';

function App() {
  const { user, profile, loading: authLoading, signIn, signUp, signOut, updateProfile, updateGamificationState } = useAuth();
  const { positions, dailyPnl, weeklyPnl, monthlyPnl, addPosition, deletePosition, clearPositions, updatePosition } = usePositions(user, profile, updateGamificationState);
  const { challengeData, cleanStreak, currentTierKey, updateTrade, loading: challengeLoading } = useChallenge(user);
  const { todaysGate, isGateCompleted, submitGate, loading: gateLoading } = useMorningGate(user);
  const { notes, activeNote, createNote, openNote, updateNote, deleteNote, uploadImage } = useJournal(user);
  const { mistakes, addMistake, deleteMistake, updateMistake, totalTuition, mostCommonMistake } = useMistakes(user);
  const { receipts: confidentReceipts, addReceipt: addConfidentReceipt, deleteReceipt: deleteConfidentReceipt, updateReceipt: updateConfidentReceipt } = useConfidentReceipts(user);

  const [activeTab, setActiveTab] = useState('tab-execute');
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('buffon_dark_mode') === 'true';
  });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalPrefill, setAddModalPrefill] = useState(null);
  const [calcResults, setCalcResults] = useState(null);

  // Cooldown Lockout state & timer
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);
  const [ugmStatus, setUgmStatus] = useState({ isObservationMode: false, currentClass: null });

  // Cooldown Lockout check
  useEffect(() => {
    if (!positions || positions.length === 0) {
      setCooldownTimeLeft(0);
      return;
    }

    const lastOffendingTrade = positions
      .filter(p => p.pnl < 0 || p.is_violation)
      .sort((a, b) => new Date(b.created_at || b.id) - new Date(a.created_at || a.id))[0];

    if (!lastOffendingTrade) {
      setCooldownTimeLeft(0);
      return;
    }

    const tradeTime = new Date(lastOffendingTrade.created_at || lastOffendingTrade.id);
    const checkCooldown = () => {
      const diffMs = new Date() - tradeTime;
      const cooldownPeriodMs = 60 * 60 * 1000; // 1 hour cooldown
      const remainingMs = cooldownPeriodMs - diffMs;
      if (remainingMs > 0) {
        setCooldownTimeLeft(Math.ceil(remainingMs / 1000));
      } else {
        setCooldownTimeLeft(0);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [positions]);

  // Academic Calendar & Holiday check
  const checkUgmAcademics = useCallback(() => {
    if (!profile) return { isObservationMode: false, currentClass: null };
    const schedule = profile.class_schedule || [];
    const holidays = profile.observed_holidays || [];

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA');
    if (holidays.includes(dateStr)) {
      return { isObservationMode: true, currentClass: 'Observed active holiday' };
    }

    const day = now.getDay(); // 0 = Sunday, 1 = Monday...
    const hours = now.getHours().toString().padStart(2, '0');
    const mins = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${hours}:${mins}`;

    const activeClass = schedule.find(c => {
      return parseInt(c.day) === day && currentTimeStr >= c.start && currentTimeStr <= c.end;
    });

    if (activeClass) {
      return { isObservationMode: true, currentClass: activeClass.name };
    }

    if (day === 0 || day === 6) {
      return { isObservationMode: true, currentClass: 'Weekend Market Closed' };
    }

    return { isObservationMode: false, currentClass: null };
  }, [profile]);

  useEffect(() => {
    const interval = setInterval(() => {
      setUgmStatus(checkUgmAcademics());
    }, 15000);

    setUgmStatus(checkUgmAcademics());
    return () => clearInterval(interval);
  }, [checkUgmAcademics]);

  // Get current tier config
  const tierConfig = TIERS[currentTierKey] || TIERS.survival_10m;
  const capital = tierConfig.capital;

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('buffon_dark_mode', isDark.toString());
  }, [isDark]);

  // Update profile tier when challenge progress changes
  useEffect(() => {
    if (profile && profile.current_tier !== currentTierKey) {
      updateProfile({ current_tier: currentTierKey, active_capital: tierConfig.capital });
    }
  }, [currentTierKey]);

  function handleToggleDark() {
    setIsDark(prev => !prev);
  }

  function handleOpenAddModal(prefill) {
    setAddModalPrefill(prefill);
    setAddModalOpen(true);
  }

  function handleCloseAddModal() {
    setAddModalOpen(false);
    setAddModalPrefill(null);
  }

  async function handleSavePosition(posData) {
    if (addModalPrefill && addModalPrefill.id) {
      const isClosing = (addModalPrefill.status === 'open' || addModalPrefill.status === 'pending') && 
                        (posData.status !== 'open' && posData.status !== 'pending' && posData.status !== 'withdrawn');
      await updatePosition(addModalPrefill.id, posData, isClosing);
    } else {
      await addPosition(posData);
    }
  }

  function handleEditPosition(pos) {
    setAddModalPrefill(pos);
    setAddModalOpen(true);
  }

  async function handleDeletePosition(id) {
    await deletePosition(id);
  }

  async function handleClearPositions() {
    if (confirm('Hapus seluruh riwayat posisi?')) {
      await clearPositions();
    }
  }

  async function handleSubmitGate(gateData) {
    await submitGate(gateData.focus_score, gateData.usd_idr_rate, gateData.macro_env);
  }

  async function handleUpdateTrade(index, status) {
    await updateTrade(index, status);
  }

  async function handleAddMistake(mistakeData) {
    await addMistake(mistakeData);
  }

  async function handleDeleteMistake(id) {
    await deleteMistake(id);
  }

  async function handleUpdateMistake(id, updates) {
    await updateMistake(id, updates);
  }

  async function handleAddConfidentReceipt(receiptData) {
    await addConfidentReceipt(receiptData);
  }

  async function handleDeleteConfidentReceipt(id) {
    await deleteConfidentReceipt(id);
  }

  async function handleUpdateConfidentReceipt(id, updates) {
    await updateConfidentReceipt(id, updates);
  }

  // Auth loading screen
  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
          Loading Execution Engine...
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <AuthGate onSignIn={signIn} onSignUp={signUp} />;
  }

  // Morning Gate
  if (!gateLoading && !isGateCompleted) {
    return <MorningGate onSubmit={handleSubmitGate} isCompleted={false} />;
  }

  return (
    <div>
      <Header
        profile={profile}
        tierConfig={tierConfig}
        onToggleDark={handleToggleDark}
        isDark={isDark}
        onSignOut={signOut}
      />

      <div className="container">
        <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* === EXECUTION ENGINE TAB === */}
        <div className={`tab-content${activeTab === 'tab-execute' ? ' active' : ''}`}>
          <DuoPartner 
            positions={positions} 
            gamificationState={profile?.gamification_state} 
            cooldownTimeLeft={cooldownTimeLeft} 
            ugmStatus={ugmStatus} 
          />
          <AlertCenter
            todaysGate={todaysGate}
            cleanStreak={cleanStreak}
            currentTierKey={currentTierKey}
            dailyPnl={dailyPnl}
            weeklyPnl={weeklyPnl}
            monthlyPnl={monthlyPnl}
            tierConfig={tierConfig}
            positions={positions}
            cooldownTimeLeft={cooldownTimeLeft}
            ugmStatus={ugmStatus}
          />

          <DrawdownMonitor
            capital={capital}
            dailyPnl={dailyPnl}
            weeklyPnl={weeklyPnl}
            monthlyPnl={monthlyPnl}
            tierConfig={tierConfig}
          />

          <div className="grid-2">
            <SizingCalculator
              capital={capital}
              tierConfig={tierConfig}
              onOpenAddModal={handleOpenAddModal}
              onResultsChange={setCalcResults}
              todaysGate={todaysGate}
              cooldownTimeLeft={cooldownTimeLeft}
              ugmStatus={ugmStatus}
            />
            <div>
              <TPProtocol results={calcResults} />
              {!challengeLoading && (
                <ChallengeTracker
                  challengeData={challengeData}
                  cleanStreak={cleanStreak}
                  currentTierKey={currentTierKey}
                  onUpdateTrade={handleUpdateTrade}
                />
              )}
            </div>
          </div>
        </div>

        {/* === ANALYTICS & HEATMAP TAB === */}
        <div className={`tab-content${activeTab === 'tab-analytics' ? ' active' : ''}`}>
          <AnalyticsDashboard 
            positions={positions} 
            cleanStreak={cleanStreak}
            currentTierKey={currentTierKey}
            gamificationState={profile?.gamification_state}
            updateGamificationState={updateGamificationState}
          />
        </div>

        {/* === HALL OF FAME TAB === */}
        <div className={`tab-content${activeTab === 'tab-cards' ? ' active' : ''}`}>
          {activeTab === 'tab-cards' && <CardGallery positions={positions} />}
        </div>

        {/* === RISK & DRAWDOWN TAB === */}
        <div className={`tab-content${activeTab === 'tab-risk' ? ' active' : ''}`}>
          <PositionsTable
            positions={positions}
            onEditPosition={handleEditPosition}
            onDeletePosition={handleDeletePosition}
            onClearPositions={handleClearPositions}
          />
        </div>

        {/* === TRADING SYSTEM TAB === */}
        <div className={`tab-content${activeTab === 'tab-system' ? ' active' : ''}`}>
          <TradingSystem />
        </div>

        {/* === GROWTH INSIGHTS TAB === */}
        <div className={`tab-content${activeTab === 'tab-mistakes' ? ' active' : ''}`}>
          <MistakesLog
            mistakes={mistakes}
            onAddMistake={handleAddMistake}
            onDeleteMistake={handleDeleteMistake}
            onUpdateMistake={handleUpdateMistake}
            onUploadImage={uploadImage}
          />
        </div>

        {/* === CONFIDENT RECEIPTS TAB === */}
        <div className={`tab-content${activeTab === 'tab-confident' ? ' active' : ''}`}>
          <ConfidentLog
            receipts={confidentReceipts}
            onAddReceipt={handleAddConfidentReceipt}
            onDeleteReceipt={handleDeleteConfidentReceipt}
            onUpdateReceipt={handleUpdateConfidentReceipt}
            onUploadImage={uploadImage}
          />
        </div>

        {/* === MINDSET & LESSONS TAB === */}
        <div className={`tab-content${activeTab === 'tab-mindset' ? ' active' : ''}`}>
          <MindsetPanel profile={profile} onUpdateProfile={updateProfile} />
        </div>

        {/* === JOURNAL TAB === */}
        <div className={`tab-content${activeTab === 'tab-journal' ? ' active' : ''}`}>
          <Journal
            notes={notes}
            activeNote={activeNote}
            onCreateNote={createNote}
            onOpenNote={openNote}
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
            onUploadImage={uploadImage}
          />
        </div>

        {/* === DAILY QUOTE TAB === */}
        <div className={`tab-content${activeTab === 'tab-quotes' ? ' active' : ''}`}>
          <DailyQuote />
        </div>
      </div>

      {/* Add Trade Modal */}
      <AddTradeModal
        isOpen={addModalOpen}
        onClose={handleCloseAddModal}
        onSave={handleSavePosition}
        prefill={addModalPrefill}
        gamificationState={profile?.gamification_state}
      />

      {/* AI Trading Coach Drawer */}
      <TradingCoach
        profile={profile}
        positions={positions}
        todaysGate={todaysGate}
        cleanStreak={cleanStreak}
        tierConfig={tierConfig}
        dailyPnl={dailyPnl}
        weeklyPnl={weeklyPnl}
        ugmStatus={ugmStatus}
      />
    </div>
  );
}

export default App;
