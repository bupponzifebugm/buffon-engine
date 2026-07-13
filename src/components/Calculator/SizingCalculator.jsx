import { useState, useEffect, useCallback, useMemo } from 'react';
import { fmtRp, fmt, fmtPct } from '../../lib/utils';
import { RISK_PCT, MAX_CAP_PCT, IDR_SIZING } from '../../lib/constants';

export default function SizingCalculator({ 
  capital, 
  tierConfig, 
  onOpenAddModal, 
  onResultsChange,
  todaysGate,
  cooldownTimeLeft,
  ugmStatus
}) {
  const [calcMode, setCalcMode] = useState('new'); // 'new' | 'add' | 'dca'
  const [existingLots, setExistingLots] = useState('');
  const [existingEntry, setExistingEntry] = useState('');
  const [ticker, setTicker] = useState('');
  const [entry, setEntry] = useState('');
  const [slPct, setSlPct] = useState('5');
  const [sl, setSl] = useState('');
  const [tp1Pct, setTp1Pct] = useState('7.5');
  const [tp1, setTp1] = useState('');
  const [tp2Pct, setTp2Pct] = useState('18');
  const [tp2, setTp2] = useState('');

  // DCA Mode States
  const [dcaCapital, setDcaCapital] = useState(capital || '5000000');
  const [dcaSl, setDcaSl] = useState('3200');
  const [dcaTp, setDcaTp] = useState('5600');
  const [dcaDps, setDcaDps] = useState('466');
  const [dcaBasePrice, setDcaBasePrice] = useState('3950');
  const [dcaStepType, setDcaStepType] = useState('rp'); // 'rp' | 'pct'
  const [dcaStepVal, setDcaStepVal] = useState('100');
  const [dcaPrices, setDcaPrices] = useState(['3950', '3850', '3750', '3650', '3550', '3400']);

  // Sync DCA Capital when parent capital updates
  useEffect(() => {
    if (capital) {
      setDcaCapital(capital);
    }
  }, [capital]);

  const applyDcaStep = useCallback(() => {
    const base = parseFloat(dcaBasePrice) || 0;
    const step = parseFloat(dcaStepVal) || 0;
    if (!base) return;

    const newPrices = [String(base)];
    let current = base;
    for (let i = 1; i < 6; i++) {
      if (dcaStepType === 'pct') {
        current = current * (1 - step / 100);
      } else {
        current = current - step;
      }
      newPrices.push(String(Math.round(current)));
    }
    setDcaPrices(newPrices);
  }, [dcaBasePrice, dcaStepVal, dcaStepType]);

  const handlePriceChange = (index, val) => {
    setDcaPrices(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const dcaResults = useMemo(() => {
    const modal = parseFloat(dcaCapital) || 0;
    const slVal = parseFloat(dcaSl) || 0;
    const tpVal = parseFloat(dcaTp) || 0;
    const dps = parseFloat(dcaDps) || 0;
    const ALLOC_PCTS = [0.05, 0.08, 0.13, 0.20, 0.24, 0.30];

    const rows = [];
    let cumLots = 0;
    let cumCost = 0;

    for (let i = 0; i < 6; i++) {
      const price = parseFloat(dcaPrices[i]) || 0;
      const allocPct = ALLOC_PCTS[i];
      const allocRp = modal * allocPct;
      
      let lots = 0;
      if (price > 0) {
        lots = Math.floor(allocRp / (price * 100));
      }
      
      const shares = lots * 100;
      cumLots += lots;
      cumCost += shares * price;

      const avgCost = cumLots > 0 ? cumCost / (cumLots * 100) : price;

      // Float L1: drop relative to L1 price
      const l1Price = parseFloat(dcaPrices[0]) || 0;
      const floatL1Pct = l1Price > 0 ? ((price - l1Price) / l1Price) * 100 : 0;
      const l1Lots = Math.floor((modal * ALLOC_PCTS[0]) / (l1Price * 100));
      const floatL1Rp = l1Lots > 0 ? (price - l1Price) * l1Lots * 100 : 0;

      // Float Port.: drop of portfolio average cost relative to current price
      const floatPortPct = avgCost > 0 ? ((price - avgCost) / avgCost) * 100 : 0;
      const floatPortRp = (price - avgCost) * cumLots * 100;

      const yieldDps = price > 0 ? (dps / price) * 100 : 0;
      const upsideTp = avgCost > 0 ? ((tpVal - avgCost) / avgCost) * 100 : 0;
      const jikaSl = avgCost > 0 ? ((slVal - avgCost) / avgCost) * 100 : 0;

      rows.push({
        level: `L${i + 1}`,
        price,
        allocPct,
        allocRp,
        lots,
        floatL1Pct,
        floatL1Rp,
        floatPortPct,
        floatPortRp,
        avgCost,
        yieldDps,
        upsideTp,
        jikaSl
      });
    }

    const fullyLoadedAvgCost = rows[5].avgCost;
    const divYieldAtAvg = fullyLoadedAvgCost > 0 ? (dps / fullyLoadedAvgCost) * 100 : 0;
    
    // Max floating portfolio loss at SL
    const finalCumLots = cumLots;
    const finalCumShares = finalCumLots * 100;
    const maxLossRp = (slVal - fullyLoadedAvgCost) * finalCumShares;
    const maxLossPctOfModal = modal > 0 ? (maxLossRp / modal) * 100 : 0;

    // L1 worst case at SL
    const l1Price = parseFloat(dcaPrices[0]) || 0;
    const floatL1WorstPct = l1Price > 0 ? ((slVal - l1Price) / l1Price) * 100 : 0;

    // Upside to TP2 from fully loaded average cost
    const finalUpsidePct = fullyLoadedAvgCost > 0 ? ((tpVal - fullyLoadedAvgCost) / fullyLoadedAvgCost) * 100 : 0;

    return {
      rows,
      fullyLoadedAvgCost,
      divYieldAtAvg,
      maxLossRp,
      maxLossPctOfModal,
      floatL1WorstPct,
      finalUpsidePct,
      totalLots: cumLots
    };
  }, [dcaCapital, dcaSl, dcaTp, dcaDps, dcaPrices]);

  // Results
  const [results, setResults] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);

  // Sync SL/TP from percentage when entry changes
  const syncFromEntry = useCallback(() => {
    const e = parseFloat(entry) || 0;
    if (!e) return;

    const slP = parseFloat(slPct) || 0;
    const tp1P = parseFloat(tp1Pct) || 0;
    const tp2P = parseFloat(tp2Pct) || 0;

    if (slP) setSl(String(Math.round(e - (e * slP / 100))));
    if (tp1P) setTp1(String(Math.round(e + (e * tp1P / 100))));
    if (tp2P) setTp2(String(Math.round(e + (e * tp2P / 100))));
  }, [entry, slPct, tp1Pct, tp2Pct]);

  useEffect(() => {
    syncFromEntry();
  }, [entry, syncFromEntry]);

  // Calculate price from percentage
  function calcPriceFromPct(type, pctValue) {
    const e = parseFloat(entry) || 0;
    const pct = parseFloat(pctValue) || 0;
    if (!e) return;

    if (type === 'sl') {
      setSlPct(pctValue);
      setSl(String(Math.round(e - (e * pct / 100))));
    } else if (type === 'tp1') {
      setTp1Pct(pctValue);
      setTp1(String(Math.round(e + (e * pct / 100))));
    } else if (type === 'tp2') {
      setTp2Pct(pctValue);
      setTp2(String(Math.round(e + (e * pct / 100))));
    }
  }

  // Calculate percentage from price
  function calcPctFromPrice(type, priceValue) {
    const e = parseFloat(entry) || 0;
    const price = parseFloat(priceValue) || 0;
    if (!e || !price) return;

    if (type === 'sl') {
      setSl(priceValue);
      setSlPct((((e - price) / e) * 100).toFixed(2));
    } else if (type === 'tp1') {
      setTp1(priceValue);
      setTp1Pct((((price - e) / e) * 100).toFixed(2));
    } else if (type === 'tp2') {
      setTp2(priceValue);
      setTp2Pct((((price - e) / e) * 100).toFixed(2));
    }
  }

  // Determine active sizing tier based on USD/IDR from Morning Gate
  const activeSizingTier = useMemo(() => {
    if (!todaysGate?.usd_idr_rate) return null;
    const rate = todaysGate.usd_idr_rate;
    return IDR_SIZING.find(tier => rate >= tier.min && rate <= tier.max) || IDR_SIZING[3];
  }, [todaysGate]);

  const maxCapPct = activeSizingTier ? activeSizingTier.maxCapPct : MAX_CAP_PCT;

  const [customCapital, setCustomCapital] = useState(capital);
  const [customRiskPct, setCustomRiskPct] = useState(0);

  useEffect(() => {
    setCustomCapital(capital);
  }, [capital]);

  useEffect(() => {
    const defaultRisk = activeSizingTier ? activeSizingTier.riskPct : tierConfig.riskPct;
    setCustomRiskPct(defaultRisk);
  }, [activeSizingTier, tierConfig.riskPct]);

  // Main sizing calculation
  useEffect(() => {
    const cap = parseFloat(customCapital) || 0;
    const currentRisk = parseFloat(customRiskPct) || 0;
    const e = parseFloat(entry) || 0;
    const s = parseFloat(sl) || 0;
    const t1 = parseFloat(tp1) || 0;
    const t2 = parseFloat(tp2) || 0;

    if (!e || !s || s >= e) {
      setResults(null);
      setAlertInfo(null);
      if (onResultsChange) {
        onResultsChange(null);
      }
      return;
    }

    let remainingRiskBudget = cap * (currentRisk / 100);
    const maxPosValue = cap * maxCapPct;
    let existingPosValue = 0;
    let existingRisk = 0;
    const extShares = (parseFloat(existingLots) || 0) * 100;
    const extEntry = parseFloat(existingEntry) || 0;

    if (calcMode === 'add') {
      existingPosValue = extShares * extEntry;
      // Existing risk based on NEW SL
      existingRisk = extShares * (extEntry - s);
      remainingRiskBudget -= existingRisk;
    }

    const diff = e - s;
    const slPercent = (diff / e) * 100;

    let rawShares = 0;
    if (remainingRiskBudget > 0) {
      rawShares = remainingRiskBudget / diff;
    }

    const posValUncapped = Math.floor(rawShares / 100) * 100 * e;
    const maxAllowedNewPosVal = Math.max(0, maxPosValue - existingPosValue);
    
    let cappedShares = 0;
    if (remainingRiskBudget > 0 && maxAllowedNewPosVal > 0) {
      cappedShares = Math.floor(Math.min(posValUncapped, maxAllowedNewPosVal) / e / 100) * 100;
    }

    const finalNewPosVal = cappedShares * e;

    let rr = '—';
    if (t2 > e && s < e) rr = ((t2 - e) / diff).toFixed(2) + ':1';

    let totalShares = cappedShares;
    let totalMaxLoss = cappedShares * diff;
    let totalPosVal = finalNewPosVal;
    let avgPrice = e;

    if (calcMode === 'add') {
      totalShares = cappedShares + extShares;
      totalPosVal = finalNewPosVal + existingPosValue;
      if (totalShares > 0) {
        avgPrice = totalPosVal / totalShares;
      }
      totalMaxLoss = (cappedShares * (e - s)) + existingRisk;
    }

    const t1Shares = Math.floor(totalShares * 0.40 / 100) * 100;
    const t2Shares = t1Shares;
    const runnerShares = totalShares - (t1Shares * 2);

    const calculatedResults = {
      maxLoss: totalMaxLoss,
      shares: totalShares,
      lots: cappedShares / 100, // Show the amount of new lots to add!
      totalLots: totalShares / 100,
      avgPrice,
      posVal: totalPosVal,
      posValPct: (totalPosVal / cap) * 100,
      rr,
      tp1Display: t1 ? `${fmtRp(t1)} (+${fmtPct(((t1 - avgPrice) / avgPrice) * 100)})` : '—',
      tp1Shares: t1Shares,
      tp2Display: t2 ? `${fmtRp(t2)} (+${fmtPct(((t2 - avgPrice) / avgPrice) * 100)})` : '—',
      tp2Shares: t2Shares,
      tp2Profit: t2 ? (t1Shares * (t1 - avgPrice)) + (t2Shares * (t2 - avgPrice)) : 0,
      runnerShares,
    };

    setResults(calculatedResults);
    if (onResultsChange) {
      onResultsChange(calculatedResults);
    }

    // Alert logic
    let warningMsg = '';
    let warningType = 'success';

    if (todaysGate?.focus_score && todaysGate.focus_score <= 7) {
      warningType = 'warning';
      warningMsg = `⚠️ Low Focus today (${todaysGate.focus_score}/10). Trade defensively with 1 position cap. `;
    }

    if (slPercent < 2.5) {
      setAlertInfo({
        type: 'warning',
        text: warningMsg + `⚠ SL terlalu ketat (${slPercent.toFixed(1)}%). Widen SL or accept noise risk.`,
      });
    } else if (calcMode === 'add' && remainingRiskBudget <= 0) {
      setAlertInfo({
        type: 'danger',
        text: warningMsg + `🚫 Cannot add. Existing risk (${fmtRp(existingRisk)}) exceeds your risk budget of ${fmtRp(cap * (currentRisk / 100))}. Trail your SL higher first!`,
      });
    } else if (posValUncapped > maxAllowedNewPosVal) {
      setAlertInfo({
        type: 'danger',
        text: warningMsg + `🚫 Max Position Cap Hit. Sizing scaled down to ${fmt(cappedShares / 100)} lots (${(maxCapPct * 100).toFixed(0)}% Cap total).`,
      });
    } else {
      setAlertInfo({
        type: warningType,
        text: warningMsg || `✓ System compliant. Total risk is ${fmtRp(totalMaxLoss)}.`,
      });
    }
  }, [entry, sl, tp1, tp2, customCapital, customRiskPct, maxCapPct, onResultsChange, todaysGate, calcMode, existingLots, existingEntry]);

  function handleAddToTracker() {
    if (cooldownTimeLeft > 0) {
      alert('Cannot log trades during revenge cooldown lockout.');
      return;
    }
    if (ugmStatus?.isObservationMode) {
      alert(`Cannot execute trades: ${ugmStatus.currentClass || 'UGM block active'}`);
      return;
    }
    if (!results || !ticker) {
      alert('Please fill in ticker and calculate sizing first.');
      return;
    }
    onOpenAddModal({
      ticker: ticker.toUpperCase(),
      lots: results.lots,
      entry_price: parseFloat(entry) || 0,
      sl_price: parseFloat(sl) || 0,
      tp1_price: parseFloat(tp1) || 0,
      tp2_price: parseFloat(tp2) || 0,
    });
  }

  const isLocked = cooldownTimeLeft > 0 || ugmStatus?.isObservationMode;

  return (
    <div className="card">
      <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Position Sizing Calculator</span>
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-primary)', padding: '4px', borderRadius: '4px' }}>
          <button 
            onClick={() => setCalcMode('new')} 
            style={{ 
              background: calcMode === 'new' ? 'var(--surface)' : 'transparent',
              color: calcMode === 'new' ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: 11
            }}
          >New Trade</button>
          <button 
            onClick={() => setCalcMode('add')} 
            style={{ 
              background: calcMode === 'add' ? 'var(--surface)' : 'transparent',
              color: calcMode === 'add' ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: 11
            }}
          >Add to Position</button>
          <button 
            onClick={() => setCalcMode('dca')} 
            style={{ 
              background: calcMode === 'dca' ? 'var(--surface)' : 'transparent',
              color: calcMode === 'dca' ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: 11
            }}
          >DCA Simulator</button>
        </div>
      </div>

      {calcMode !== 'dca' ? (
        <>
          <div className="field-row">
            <div className="field">
              <label>Modal Active (Rp)</label>
              <input
                type="number"
                value={customCapital}
                onChange={e => setCustomCapital(e.target.value)}
                style={{ fontWeight: 700 }}
              />
            </div>
            <div className="field">
              <label>Risk per trade (%)</label>
              <input
                type="number"
                value={customRiskPct}
                onChange={e => setCustomRiskPct(e.target.value)}
                step="0.1"
                style={{ fontWeight: 700 }}
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Ticker</label>
              <input
                type="text"
                value={ticker}
                onChange={e => setTicker(e.target.value.toUpperCase())}
                placeholder="BREN"
                maxLength={6}
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div className="field">
              <label>{calcMode === 'add' ? 'New Add Entry (Rp)' : 'Harga Entry (Rp)'}</label>
              <input
                type="number"
                value={entry}
                onChange={e => setEntry(e.target.value)}
                placeholder="0"
                step="1"
              />
            </div>
          </div>

          {calcMode === 'add' && (
            <div className="field-row" style={{ marginTop: 12, marginBottom: 12, padding: 12, background: 'rgba(var(--accent-rgb), 0.05)', border: '1px solid var(--border)', borderRadius: 4 }}>
              <div className="field">
                <label>Existing Lots</label>
                <input
                  type="number"
                  value={existingLots}
                  onChange={e => setExistingLots(e.target.value)}
                  placeholder="e.g. 50"
                />
              </div>
              <div className="field">
                <label>Existing Avg Entry (Rp)</label>
                <input
                  type="number"
                  value={existingEntry}
                  onChange={e => setExistingEntry(e.target.value)}
                  placeholder="e.g. 1000"
                />
              </div>
            </div>
          )}

          <div className="field-row">
            <div className="field">
              <label>Stop Loss (SL)</label>
              <div className="input-group">
                <input
                  type="number"
                  value={slPct}
                  onChange={e => calcPriceFromPct('sl', e.target.value)}
                  placeholder="%"
                  step="0.5"
                />
                <input
                  type="number"
                  value={sl}
                  onChange={e => calcPctFromPrice('sl', e.target.value)}
                  placeholder="Rp"
                  step="1"
                />
              </div>
            </div>
            <div className="field">
              <label>Target 1 (TP1)</label>
              <div className="input-group">
                <input
                  type="number"
                  value={tp1Pct}
                  onChange={e => calcPriceFromPct('tp1', e.target.value)}
                  placeholder="%"
                  step="0.5"
                />
                <input
                  type="number"
                  value={tp1}
                  onChange={e => calcPctFromPrice('tp1', e.target.value)}
                  placeholder="Rp"
                  step="1"
                />
              </div>
            </div>
          </div>

          <div className="field">
            <label>Target 2 (TP2)</label>
            <div className="input-group">
              <input
                type="number"
                value={tp2Pct}
                onChange={e => calcPriceFromPct('tp2', e.target.value)}
                placeholder="%"
                step="0.5"
              />
              <input
                type="number"
                value={tp2}
                onChange={e => calcPctFromPrice('tp2', e.target.value)}
                placeholder="Rp"
                step="1"
              />
            </div>
          </div>

          {results && (
            <>
              <div className="result-grid">
                <div className="result-box danger">
                  <div className="result-label">Total Max Rugi</div>
                  <div className="result-val">{fmtRp(results.maxLoss)}</div>
                  <div className="result-sub">
                    {(parseFloat(customRiskPct) || 0).toFixed(2)}% Modal 
                  </div>
                </div>
                <div className="result-box success">
                  <div className="result-label">{calcMode === 'add' ? 'Lots to Add' : 'Jumlah Saham'}</div>
                  <div className="result-val">{fmt(results.lots)}</div>
                  <div className="result-sub">{calcMode === 'add' ? `Total Pos: ${fmt(results.totalLots)} Lot` : 'Lot (dibulatkan)'}</div>
                </div>
                <div className="result-box">
                  <div className="result-label">Total Nilai Posisi</div>
                  <div className="result-val">{fmtRp(results.posVal)}</div>
                  <div className="result-sub">{fmtPct(results.posValPct)} Modal</div>
                </div>
                <div className="result-box">
                  <div className="result-label">{calcMode === 'add' ? 'New Avg Entry' : 'R:R Ratio'}</div>
                  <div className="result-val">{calcMode === 'add' ? fmtRp(results.avgPrice) : results.rr}</div>
                  <div className="result-sub">{calcMode === 'add' ? 'Avg of existing + new' : 'Reward vs Risk'}</div>
                </div>
              </div>

              {alertInfo && (
                <div className={`calc-alert ${alertInfo.type}`}>
                  {alertInfo.text}
                </div>
              )}
            </>
          )}

          <button 
            className="btn" 
            onClick={handleAddToTracker}
            disabled={isLocked}
            style={{
              background: isLocked ? 'var(--bg-secondary)' : 'var(--accent)',
              border: isLocked ? '1px solid var(--border)' : '1px solid var(--accent)',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              opacity: isLocked ? 0.6 : 1,
              marginTop: 16
            }}
          >
            {cooldownTimeLeft > 0 
              ? `🔒 Revenge Lockout (${Math.floor(cooldownTimeLeft / 60)}m ${cooldownTimeLeft % 60}s)` 
              : ugmStatus?.isObservationMode 
                ? `🔒 ${ugmStatus.currentClass || 'UGM Block active'}`
                : '+ Log Position to Tracker'}
          </button>
        </>
      ) : (
        /* DCA Mode UI */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
          
          {/* Header Tagline */}
          <div style={{ paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PRZ DCA LADDER — 6 LEVEL + FLOATING LOSS + DIVIDEND YIELD
            </span>
          </div>

          {/* DCA Level Target Config Bar */}
          <div style={{ 
            background: 'var(--bg-secondary)', 
            border: '1px solid var(--border)', 
            borderRadius: '8px', 
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '16px'
          }}>
            <div className="field">
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SL INVALIDASI</label>
              <input 
                type="number" 
                value={dcaSl} 
                onChange={e => setDcaSl(e.target.value)} 
                style={{ fontWeight: 'bold', color: 'var(--danger)', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '6px' }}
              />
            </div>
            <div className="field">
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>TP TARGET PRICE</label>
              <input 
                type="number" 
                value={dcaTp} 
                onChange={e => setDcaTp(e.target.value)} 
                style={{ fontWeight: 'bold', color: 'var(--success)', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '6px' }}
              />
            </div>
            <div className="field">
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>DIVIDEND PER SHARE (DPS)</label>
              <input 
                type="number" 
                value={dcaDps} 
                onChange={e => setDcaDps(e.target.value)} 
                style={{ fontWeight: 'bold', color: '#a855f7', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '6px' }}
              />
            </div>
          </div>

          {/* Auto Step Generator Row */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '12px 16px',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>L1 Price</span>
                <input 
                  type="number" 
                  value={dcaBasePrice} 
                  onChange={e => setDcaBasePrice(e.target.value)} 
                  style={{ width: '100px', padding: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Step Value</span>
                <input 
                  type="number" 
                  value={dcaStepVal} 
                  onChange={e => setDcaStepVal(e.target.value)} 
                  style={{ width: '80px', padding: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Step Unit</span>
                <select 
                  value={dcaStepType} 
                  onChange={e => setDcaStepType(e.target.value)} 
                  style={{ padding: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)' }}
                >
                  <option value="rp">Rupiah (Rp)</option>
                  <option value="pct">Percent (%)</option>
                </select>
              </div>
            </div>

            <button 
              className="btn" 
              onClick={applyDcaStep}
              style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', width: 'auto', margin: 0 }}
            >
              ⚡ Apply Step
            </button>
          </div>

          {/* Dynamic Mentor Sizing Recommendation box */}
          {parseFloat(dcaDps) > 0 && dcaResults.rows[5]?.price > 0 && (
            <div style={{ 
              background: 'rgba(34, 197, 94, 0.05)', 
              border: '1px solid rgba(34, 197, 94, 0.2)', 
              borderRadius: '8px', 
              padding: '12px 16px',
              fontSize: '13px',
              lineHeight: '1.6',
              color: 'var(--text-primary)'
            }}>
              💡 <strong>Keunikan DCA:</strong> Di setiap level, kamu tidak hanya membeli di harga lebih murah — kamu juga <strong>lock-in dividend yield yang lebih tinggi</strong>. Di L6 ({fmtRp(dcaResults.rows[5].price)}), yield DPS menjadi <strong>{dcaResults.rows[5].yieldDps.toFixed(1)}%</strong>. Ini adalah dividend accumulation play, bukan hanya capital gain.
            </div>
          )}

          {/* Capital Input Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total modal DCA (Rp)</span>
            <input 
              type="number" 
              value={dcaCapital} 
              onChange={e => setDcaCapital(e.target.value)} 
              style={{ 
                padding: '8px 12px', 
                fontSize: '16px', 
                fontWeight: 'bold', 
                background: 'var(--bg-secondary)', 
                border: '1px solid var(--border)', 
                borderRadius: '6px', 
                color: 'var(--text-primary)',
                width: '180px'
              }}
            />
          </div>

          {/* Interactive Ladder Table */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px' }}>Level</th>
                  <th style={{ padding: '12px' }}>Harga</th>
                  <th style={{ padding: '12px' }}>Alokasi</th>
                  <th style={{ padding: '12px' }}>Jumlah</th>
                  <th style={{ padding: '12px' }}>Lot</th>
                  <th style={{ padding: '12px' }}>Float L1</th>
                  <th style={{ padding: '12px' }}>Float Port.</th>
                  <th style={{ padding: '12px' }}>Avg Cost</th>
                  <th style={{ padding: '12px' }}>Yield DPS</th>
                  <th style={{ padding: '12px' }}>Upside TP</th>
                  <th style={{ padding: '12px' }}>Jika SL</th>
                </tr>
              </thead>
              <tbody>
                {dcaResults.rows.map((row, idx) => (
                  <tr key={row.level} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        background: 'rgba(37,99,235,0.1)', 
                        color: 'var(--accent)', 
                        fontWeight: 'bold',
                        fontSize: '11px'
                      }}>
                        {row.level}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Rp</span>
                        <input 
                          type="number" 
                          value={dcaPrices[idx]} 
                          onChange={e => handlePriceChange(idx, e.target.value)} 
                          style={{ 
                            width: '80px', 
                            padding: '4px 6px', 
                            background: 'var(--bg-primary)', 
                            border: '1px solid var(--border)', 
                            borderRadius: '4px', 
                            color: 'var(--text-primary)',
                            textAlign: 'right',
                            fontWeight: 'bold'
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ 
                          height: '6px', 
                          borderRadius: '3px', 
                          background: idx === 5 ? 'var(--success)' : 'var(--accent)',
                          width: `${row.allocPct * 100}px` 
                        }} />
                        <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{(row.allocPct * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>{fmtRp(row.allocRp)}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{row.lots > 0 ? `${row.lots} lot` : '—'}</td>
                    <td style={{ padding: '12px' }}>
                      {idx === 0 ? (
                        <span style={{ color: 'var(--text-secondary)' }}>entry</span>
                      ) : (
                        <div>
                          <div style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{row.floatL1Pct.toFixed(1)}%</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{fmtRp(row.floatL1Rp)}</div>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {idx === 0 ? (
                        <span style={{ color: 'var(--text-secondary)' }}>—</span>
                      ) : (
                        <div>
                          <div style={{ color: row.floatPortPct < 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 'bold' }}>
                            {row.floatPortPct.toFixed(1)}%
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{fmtRp(row.floatPortRp)}</div>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{fmtRp(row.avgCost)}</td>
                    <td style={{ padding: '12px', color: '#a855f7' }}>{row.yieldDps > 0 ? `${row.yieldDps.toFixed(1)}%` : '—'}</td>
                    <td style={{ padding: '12px', color: 'var(--success)', fontWeight: 'bold' }}>+{row.upsideTp.toFixed(1)}%</td>
                    <td style={{ padding: '12px', color: 'var(--danger)' }}>{row.jikaSl.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* DCA Summary Dashboard Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px' 
          }}>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>AVG COST (PENUH TERISI)</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{fmtRp(dcaResults.fullyLoadedAvgCost)}</div>
            </div>
            
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>DIV YIELD DI AVG COST</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#a855f7' }}>{dcaResults.divYieldAtAvg.toFixed(1)}%</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>DPS Rp {dcaDps} / avg cost</div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>MAX FLOATING PORTFOLIO</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--danger)' }}>{dcaResults.maxLossPctOfModal.toFixed(1)}%</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Jika harga ke SL {dcaSl}</div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>FLOATING L1 WORST CASE</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--danger)' }}>{dcaResults.floatL1WorstPct.toFixed(1)}%</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Posisi L1 jika SL {dcaSl}</div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>UPSIDE KE TP DARI AVG</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--success)' }}>+{dcaResults.finalUpsidePct.toFixed(1)}%</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Upside ke TP {dcaTp}</div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
