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
  const [ticker, setTicker] = useState('');
  const [entry, setEntry] = useState('');
  const [slPct, setSlPct] = useState('5');
  const [sl, setSl] = useState('');
  const [tp1Pct, setTp1Pct] = useState('7.5');
  const [tp1, setTp1] = useState('');
  const [tp2Pct, setTp2Pct] = useState('18');
  const [tp2, setTp2] = useState('');

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

    const maxLoss = cap * (currentRisk / 100);
    const maxPosValue = cap * maxCapPct;
    const diff = e - s;
    const slPercent = (diff / e) * 100;

    const rawShares = maxLoss / diff;
    const posValUncapped = Math.floor(rawShares / 100) * 100 * e;
    const cappedLots = Math.floor(Math.min(posValUncapped, maxPosValue) / e / 100) * 100;
    const finalPosVal = cappedLots * e;

    let rr = '—';
    if (t2 > e && s < e) rr = ((t2 - e) / diff).toFixed(2) + ':1';

    const t1Shares = Math.floor(cappedLots * 0.40 / 100) * 100;
    const t2Shares = t1Shares;
    const runnerShares = cappedLots - (t1Shares * 2);

    const calculatedResults = {
      maxLoss: cappedLots * diff,
      shares: cappedLots,
      posVal: finalPosVal,
      posValPct: (finalPosVal / cap) * 100,
      rr,
      tp1Display: t1 ? `${fmtRp(t1)} (+${fmtPct(((t1 - e) / e) * 100)})` : '—',
      tp1Shares: t1Shares,
      tp2Display: t2 ? `${fmtRp(t2)} (+${fmtPct(((t2 - e) / e) * 100)})` : '—',
      tp2Shares: t2Shares,
      tp2Profit: t2 ? (t1Shares * (t1 - e)) + (t2Shares * (t2 - e)) : 0,
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
    } else if (posValUncapped > maxPosValue) {
      setAlertInfo({
        type: 'danger',
        text: warningMsg + `🚫 Max Position Cap Hit. Sizing scaled down to ${fmt(cappedLots)} lots (${(maxCapPct * 100).toFixed(0)}% Cap).`,
      });
    } else {
      setAlertInfo({
        type: warningType,
        text: warningMsg || `✓ System compliant. Exact risk is ${fmtRp(cappedLots * diff)}.`,
      });
    }
  }, [entry, sl, tp1, tp2, customCapital, customRiskPct, maxCapPct, onResultsChange, todaysGate]);

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
      lots: results.shares,
      entry_price: parseFloat(entry) || 0,
      sl_price: parseFloat(sl) || 0,
      tp1_price: parseFloat(tp1) || 0,
      tp2_price: parseFloat(tp2) || 0,
    });
  }

  const isLocked = cooldownTimeLeft > 0 || ugmStatus?.isObservationMode;

  return (
    <div className="card">
      <div className="card-title">Position Sizing Calculator</div>

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
          <label>Harga Entry (Rp)</label>
          <input
            type="number"
            value={entry}
            onChange={e => setEntry(e.target.value)}
            placeholder="0"
            step="1"
          />
        </div>
      </div>

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
              <div className="result-label">Max Rugi</div>
              <div className="result-val">{fmtRp(results.maxLoss)}</div>
              <div className="result-sub">
                {(parseFloat(customRiskPct) || 0).toFixed(2)}% Modal 
              </div>
            </div>
            <div className="result-box success">
              <div className="result-label">Jumlah Saham</div>
              <div className="result-val">{fmt(results.shares)}</div>
              <div className="result-sub">Lot (dibulatkan)</div>
            </div>
            <div className="result-box">
              <div className="result-label">Nilai Posisi</div>
              <div className="result-val">{fmtRp(results.posVal)}</div>
              <div className="result-sub">{fmtPct(results.posValPct)} Modal</div>
            </div>
            <div className="result-box">
              <div className="result-label">R:R Ratio</div>
              <div className="result-val">{results.rr}</div>
              <div className="result-sub">Reward vs Risk</div>
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
    </div>
  );
}
