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
import ConfidentLog from './components/Confident/ConfidentLog';

// Constants
import { TIERS } from './lib/constants';

function App() {
  const { user, profile, loading: authLoading, signIn, signUp, signOut, updateProfile } = useAuth();
  const { positions, dailyPnl, weeklyPnl, monthlyPnl, addPosition, deletePosition, clearPositions } = usePositions(user);
  const { challengeData, cleanStreak, currentTierKey, updateTrade, loading: challengeLoading } = useChallenge(user);
  const { todaysGate, isGateCompleted, submitGate, loading: gateLoading } = useMorningGate(user);
  const { notes, activeNote, createNote, openNote, updateNote, deleteNote, uploadImage } = useJournal(user);
  const { mistakes, addMistake, deleteMistake, totalTuition, mostCommonMistake } = useMistakes(user);
  const { receipts: confidentReceipts, addReceipt: addConfidentReceipt, deleteReceipt: deleteConfidentReceipt } = useConfidentReceipts(user);

  const [activeTab, setActiveTab] = useState('tab-execute');
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('buffon_dark_mode') === 'true';
  });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalPrefill, setAddModalPrefill] = useState(null);
  const [calcResults, setCalcResults] = useState(null);

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
    await addPosition(posData);
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

  async function handleAddConfidentReceipt(receiptData) {
    await addConfidentReceipt(receiptData);
  }

  async function handleDeleteConfidentReceipt(id) {
    await deleteConfidentReceipt(id);
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
          <AlertCenter
            todaysGate={todaysGate}
            cleanStreak={cleanStreak}
            currentTierKey={currentTierKey}
            dailyPnl={dailyPnl}
            weeklyPnl={weeklyPnl}
            monthlyPnl={monthlyPnl}
            tierConfig={tierConfig}
            positions={positions}
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
          <AnalyticsDashboard positions={positions} />
        </div>

        {/* === RISK & DRAWDOWN TAB === */}
        <div className={`tab-content${activeTab === 'tab-risk' ? ' active' : ''}`}>
          <PositionsTable
            positions={positions}
            onDeletePosition={handleDeletePosition}
            onClearPositions={handleClearPositions}
          />
        </div>

        {/* === TRADING SYSTEM TAB === */}
        <div className={`tab-content${activeTab === 'tab-system' ? ' active' : ''}`}>
          <TradingSystem />
        </div>

        {/* === MISTAKE RECEIPTS TAB === */}
        <div className={`tab-content${activeTab === 'tab-mistakes' ? ' active' : ''}`}>
          <MistakesLog
            mistakes={mistakes}
            onAddMistake={handleAddMistake}
            onDeleteMistake={handleDeleteMistake}
          />
        </div>

        {/* === CONFIDENT RECEIPTS TAB === */}
        <div className={`tab-content${activeTab === 'tab-confident' ? ' active' : ''}`}>
          <ConfidentLog
            receipts={confidentReceipts}
            onAddReceipt={handleAddConfidentReceipt}
            onDeleteReceipt={handleDeleteConfidentReceipt}
            onUploadImage={uploadImage}
          />
        </div>

        {/* === MINDSET & LESSONS TAB === */}
        <div className={`tab-content${activeTab === 'tab-mindset' ? ' active' : ''}`}>
          <MindsetPanel />
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
      />
    </div>
  );
}

export default App;
