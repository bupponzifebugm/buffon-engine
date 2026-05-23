import { useState, useEffect } from 'react';
import { getTodayString } from '../../lib/utils';

export default function AddTradeModal({ isOpen, onClose, onSave, prefill }) {
  const [ticker, setTicker] = useState(prefill?.ticker || '');
  const [lots, setLots] = useState(prefill?.lots || '');
  const [entryPrice, setEntryPrice] = useState(prefill?.entry_price || '');
  const [slPrice, setSlPrice] = useState(prefill?.sl_price || '');
  const [tp1Price, setTp1Price] = useState(prefill?.tp1_price || '');
  const [tp2Price, setTp2Price] = useState(prefill?.tp2_price || '');
  const [status, setStatus] = useState('open');
  const [exitPrice, setExitPrice] = useState('');

  // Reset form when prefill changes
  useEffect(() => {
    if (prefill) {
      setTicker(prefill.ticker || '');
      setLots(prefill.lots || '');
      setEntryPrice(prefill.entry_price || '');
      setSlPrice(prefill.sl_price || '');
      setTp1Price(prefill.tp1_price || '');
      setTp2Price(prefill.tp2_price || '');
      setStatus('open');
      setExitPrice('');
    } else {
      setTicker('');
      setLots('');
      setEntryPrice('');
      setSlPrice('');
      setTp1Price('');
      setTp2Price('');
      setStatus('open');
      setExitPrice('');
    }
  }, [prefill]);

  if (!isOpen) return null;

  function handleSave() {
    const t = ticker.trim().toUpperCase();
    const l = parseInt(lots) || 0;
    const e = parseFloat(entryPrice) || 0;
    const s = parseFloat(slPrice) || 0;

    if (!t || !l || !e || !s) {
      alert('Lengkapi Ticker, Lot, Entry, dan SL.');
      return;
    }

    const t1 = parseFloat(tp1Price) || 0;
    const t2 = parseFloat(tp2Price) || 0;
    const ex = parseFloat(exitPrice) || 0;

    let pnl = 0;
    if (status === 'closed' && ex) pnl = (ex - e) * l * 100;
    else if (status === 'sl') pnl = (s - e) * l * 100;
    else if (status === 'tp1') pnl = (t1 - e) * (l * 0.4) * 100;

    onSave({
      ticker: t,
      lots: l,
      entry_price: e,
      sl_price: s,
      tp1_price: t1,
      tp2_price: t2,
      exit_price: ex,
      status,
      pnl: Math.round(pnl),
      trade_date: getTodayString(),
    });

    onClose();
  }

  const showExit = status === 'closed' || status === 'sl';

  return (
    <div className={`modal-overlay${isOpen ? ' open' : ''}`} onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Log Trade</h3>

        <div className="field">
          <label>Ticker</label>
          <input
            type="text"
            value={ticker}
            onChange={e => setTicker(e.target.value.toUpperCase())}
            style={{ textTransform: 'uppercase' }}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label>Lot masuk</label>
            <input type="number" value={lots} onChange={e => setLots(e.target.value)} />
          </div>
          <div className="field">
            <label>Harga masuk (Rp)</label>
            <input type="number" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Stop Loss (Rp)</label>
            <input type="number" value={slPrice} onChange={e => setSlPrice(e.target.value)} />
          </div>
          <div className="field">
            <label>TP1 (Rp)</label>
            <input type="number" value={tp1Price} onChange={e => setTp1Price(e.target.value)} />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>TP2 (Rp)</label>
            <input type="number" value={tp2Price} onChange={e => setTp2Price(e.target.value)} />
          </div>
          <div className="field">
            <label>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="open">Open (SL Active)</option>
              <option value="tp1">TP1 Hit (SL @ BE)</option>
              <option value="closed">Closed (TP2 / Manual)</option>
              <option value="sl">SL Hit</option>
            </select>
          </div>
        </div>

        {showExit && (
          <div className="field">
            <label>Harga Exit Akhir (Rp)</label>
            <input type="number" value={exitPrice} onChange={e => setExitPrice(e.target.value)} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button className="btn secondary" onClick={onClose} style={{ marginTop: 0 }}>Batal</button>
          <button className="btn" onClick={handleSave} style={{ marginTop: 0 }}>Simpan Posisi</button>
        </div>
      </div>
    </div>
  );
}
