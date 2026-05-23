import { fmtRp, fmt, fmtPct } from '../../lib/utils';

export default function TPProtocol({ results }) {
  if (!results) {
    return (
      <div className="card">
        <div className="card-title">TP Protocol & Runner Math</div>
        <div className="empty-state" style={{ padding: '24px' }}>
          Fill in the calculator to see TP protocol breakdown.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-title">TP Protocol & Runner Math</div>
      <div>
        <div className="step">
          <div className="step-n" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>T1</div>
          <span>
            TP1 (<b>{results.tp1Display}</b>): Jual 40% = <b>{fmt(results.tp1Shares)}</b> lot. Pindah SL ke Entry (Breakeven).
          </span>
        </div>
        <div className="step">
          <div className="step-n" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>T2</div>
          <span>
            TP2 (<b>{results.tp2Display}</b>): Jual 40% = <b>{fmt(results.tp2Shares)}</b> lot. Profit total terkunci: <b>{results.tp2Profit ? fmtRp(results.tp2Profit) : '—'}</b>
          </span>
        </div>
        <div className="step" style={{ marginBottom: 0 }}>
          <div className="step-n" style={{ background: 'var(--purple-bg)', color: 'var(--purple)' }}>RN</div>
          <span>
            Runner 20% = <b>{fmt(results.runnerShares)}</b> lot. Trail stop, biarkan jalan sampai trend patah.
          </span>
        </div>
      </div>
    </div>
  );
}
