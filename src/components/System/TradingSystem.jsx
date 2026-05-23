export default function TradingSystem() {
  return (
    <div>
      <div className="grid-2">
        <div className="card">
          <div className="card-title">1. Pre-Market & Algo Bot Stack</div>
          <ul className="system-list">
            <li><span><b>Macro Check:</b> Look at NIKKEI & KOSPI. If red → passive → wait for rebound. If green → can go aggressive.</span></li>
            <li><span><b>Bot Score:</b> Must be ≥ 80. Below 75 is an instant fail. Do not rationalize.</span></li>
            <li><span><b>Stage:</b> Must be EARLY_SETUP or EARLY_CONFIRM.</span></li>
            <li><span><b style={{ color: 'var(--danger)' }}>Asing (Foreign):</b> Must be BUYING or Neutral. SELLING = INSTANT SKIP.</span></li>
            <li><span><b>Bandarmology:</b> Broker summary must show green buy acc. Bandar must be stuck at higher price. AVOID distribution stocks.</span></li>
            <li><span><b>YP Position:</b> YP must NOT be dominant buyer.</span></li>
            <li><span><b>Divergence:</b> Look for bullish divergence on charts.</span></li>
            <li><span><b>IHSG Rotation:</b> Look at current IHSG rotation flows.</span></li>
          </ul>
        </div>

        <div className="card">
          <div className="card-title">2. Execution & Psychology</div>
          <ul className="system-list">
            <li><span><b>Trading Hours:</b> 1-2 hours only. 08:30 – 10:30 ish.</span></li>
            <li><span><b>Red Days / Gap Down:</b> 2-3% profit is more than enough. Scalping cuan.</span></li>
            <li><span><b>Risk Management:</b> Stop loss on 2%. Reduce sizing position to avoid volatility.</span></li>
            <li><span><b>Rule 1:</b> Loss is a lesson.</span></li>
            <li><span><b>Rule 2:</b> Follow system, but loss is still a win.</span></li>
            <li><span><b>Rule 3:</b> NO Revenge trade.</span></li>
            <li><span><b>Rule 4:</b> Discipline in your life. Have fun. Check your energy levels.</span></li>
            <li><span><b>Rule 5:</b> No entering at peak. Do not move stop loss.</span></li>
            <li><span><b>Rule 6:</b> Don't trade unplanned trades. Cut loss is love. No trade is best choice.</span></li>
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="card-title">3. Sector Rotation Playbook</div>
        <div className="table-responsive">
          <table className="system-table">
            <thead>
              <tr>
                <th>Rotation Type</th>
                <th>How to Identify Early</th>
                <th>Entry Window</th>
                <th>Exit Signal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>Conglomerate Chain</b></td>
                <td>First group pumps with AK/CC acc.</td>
                <td>Identify next group before pump.</td>
                <td>YP becomes dominant (distribution).</td>
              </tr>
              <tr>
                <td><b>MBG Beneficiary</b></td>
                <td>Govt contract news / disbursement.</td>
                <td>Food/Logistics on day of news.</td>
                <td>Volume drops back to average.</td>
              </tr>
              <tr>
                <td><b>Commodity Spike</b></td>
                <td>Global price move &gt;3% overnight.</td>
                <td>MEDC, ADRO type on open.</td>
                <td>Commodity price reverses.</td>
              </tr>
              <tr>
                <td><b>Defensive Rotation</b></td>
                <td>IHSG red 3+ days, high fear.</td>
                <td>TLKM, Consumer staples on dip.</td>
                <td>IHSG stabilizes, risk-on returns.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
