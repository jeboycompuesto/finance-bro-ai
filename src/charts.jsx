// Charts: hand-built SVG so every mark, tick and label comes from one scale.

const SERIES_STYLE = {
  focus: { stroke: "var(--accent)", strokeWidth: 3, dash: null },
  dash: { stroke: "var(--ink-2)", strokeWidth: 2, dash: "9 6" },
  dot: { stroke: "var(--ink-2)", strokeWidth: 2, dash: "2 5" },
  muted: { stroke: "var(--chart-muted)", strokeWidth: 2, dash: null },
  alt: { stroke: "var(--warn)", strokeWidth: 2, dash: "14 5 3 5" },
};

// Points for a series, stopping where cash reaches zero (with the exact crossing).
function seriesPoints(cash) {
  const pts = [];
  for (let m = 0; m < cash.length; m++) {
    if (cash[m] >= 0) { pts.push([m, cash[m]]); continue; }
    const prev = cash[m - 1];
    if (m > 0 && prev > 0) pts.push([m - 1 + prev / (prev - cash[m]), 0]);
    break;
  }
  return pts;
}

function LegendSwatch({ variant }) {
  const s = SERIES_STYLE[variant];
  return (
    <svg width="26" height="8" aria-hidden="true">
      <line x1="1" y1="4" x2="25" y2="4" style={{ stroke: s.stroke, strokeWidth: s.strokeWidth, strokeDasharray: s.dash || "none", strokeLinecap: "round" }} />
    </svg>
  );
}

function CashChart({ series, reserve, height = 300, width = 760, marker, showLegend = true, ariaLabel }) {
  const W = width, H = height;
  const pad = { l: 58, r: 16, t: 16, b: 30 };
  const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;
  const maxVal = Math.max(reserve || 0, ...series.flatMap((s) => s.cash));
  const yMax = Math.max(100000, Math.ceil(maxVal / 100000) * 100000);
  const x = (m) => pad.l + (m / HORIZON) * plotW;
  const y = (v) => pad.t + (1 - v / yMax) * plotH;
  const ticks = [];
  for (let v = 0; v <= yMax; v += yMax > 600000 ? 200000 : 100000) ticks.push(v);

  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);
  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    const m = Math.round(((mx - pad.l) / plotW) * HORIZON);
    setHover(Math.max(0, Math.min(HORIZON, m)));
  };

  const focus = series.find((s) => s.variant === "focus");
  const focusPts = focus ? seriesPoints(focus.cash) : [];
  const focusEnd = focusPts[focusPts.length - 1];

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="chart-wrap">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={ariaLabel || "Month-end cash projection"}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          {ticks.map((v) => (
            <g key={v}>
              <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} style={{ stroke: "var(--chart-grid)", strokeWidth: 1 }} />
              <text x={pad.l - 10} y={y(v) + 4} textAnchor="end" style={{ fill: "var(--muted)", fontSize: 12, fontFamily: "var(--font-mono)" }}>
                {v === 0 ? "$0" : fmtK(v)}
              </text>
            </g>
          ))}
          {[0, 3, 6, 9, 12].map((m) => (
            <text key={m} x={x(m)} y={H - 8} textAnchor="middle" style={{ fill: "var(--muted)", fontSize: 12, fontFamily: "var(--font-mono)" }}>
              M{m}
            </text>
          ))}
          {reserve != null && (
            <g>
              <line x1={pad.l} x2={W - pad.r} y1={y(reserve)} y2={y(reserve)} style={{ stroke: "var(--ink)", strokeWidth: 1.25, strokeDasharray: "4 4" }} />
              <text x={W - pad.r} y={y(reserve) - 7} textAnchor="end" style={{ fill: "var(--ink)", fontSize: 12, fontWeight: 600 }}>
                Reserve floor {fmtK(reserve)}
              </text>
            </g>
          )}
          {series.filter((s) => s.variant !== "focus").concat(focus ? [focus] : []).map((s) => {
            const st = SERIES_STYLE[s.variant];
            const d = seriesPoints(s.cash).map(([m, v], i) => `${i ? "L" : "M"}${x(m).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
            return (
              <path key={s.id} d={d} fill="none" style={{ stroke: st.stroke, strokeWidth: st.strokeWidth, strokeDasharray: st.dash || "none", strokeLinecap: "round", strokeLinejoin: "round" }} />
            );
          })}
          {focusEnd && (
            <circle cx={x(focusEnd[0])} cy={y(focusEnd[1])} r="5" style={{ fill: "var(--accent)", stroke: "var(--surface)", strokeWidth: 2 }} />
          )}
          {marker && (
            <g>
              <circle cx={x(marker.month)} cy={y(marker.value)} r="6" style={{ fill: "var(--surface)", stroke: "var(--crit)", strokeWidth: 2.5 }} />
              <text x={x(marker.month) - 12} y={y(marker.value) + 22} textAnchor="end" style={{ fill: "var(--crit)", fontSize: 12, fontWeight: 600 }}>
                {marker.label}
              </text>
            </g>
          )}
          {hover != null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} style={{ stroke: "var(--rule-strong)", strokeWidth: 1 }} />
              {series.map((s) =>
                s.cash[hover] != null && s.cash[hover] >= 0 ? (
                  <circle key={s.id} cx={x(hover)} cy={y(s.cash[hover])} r="4.5" style={{ fill: SERIES_STYLE[s.variant].stroke, stroke: "var(--surface)", strokeWidth: 2 }} />
                ) : null
              )}
            </g>
          )}
          <rect x={pad.l} y={pad.t} width={plotW} height={plotH} fill="transparent" />
        </svg>
        {hover != null && (
          <div
            className="chart-tip"
            style={{
              left: `calc(${(x(hover) / W) * 100}% ${hover > 7 ? "- 206px" : "+ 14px"})`,
              top: 8,
            }}
          >
            <div className="eyebrow" style={{ marginBottom: 6 }}>End of Month {hover}</div>
            {series.map((s) => (
              <div className="tip-row" key={s.id}>
                <span className="row" style={{ gap: 6 }}><LegendSwatch variant={s.variant} /> {s.short || s.label}</span>
                <span className="strong">{s.cash[hover] < 0 ? "Out of cash" : fmtK(s.cash[hover])}</span>
              </div>
            ))}
            {reserve != null && (
              <div className="tip-row muted" style={{ marginTop: 4 }}>
                <span>Reserve floor</span><span>{fmtK(reserve)}</span>
              </div>
            )}
          </div>
        )}
      </div>
      {showLegend && series.length > 1 && (
        <div className="legend">
          {series.map((s) => (
            <span className="legend-item" key={s.id}><LegendSwatch variant={s.variant} /> {s.label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// "See calculation" / "View lineage": the month-by-month math and where every input comes from.
function CalculationModal({ onClose, initialTab = "months" }) {
  const { state, model } = useStore();
  const a = state.analysis;
  const [tab, setTab] = useState(initialTab);
  const options = [
    { id: "rec-down", label: `Downside · ${fmtK(model.chosen)} setup (recommended)`, r: model.rec.downside },
    { id: "rec-base", label: `Base · ${fmtK(model.chosen)} setup`, r: model.rec.base },
    { id: "plan-down", label: `Downside · ${fmtK(a.setup)} setup (your plan)`, r: model.plan.downside },
    { id: "plan-base", label: `Base · ${fmtK(a.setup)} setup (your plan)`, r: model.plan.base },
    { id: "none", label: "No expansion", r: model.none },
  ];
  const [pick, setPick] = useState("rec-down");
  const scenario = options.find((o) => o.id === pick);
  const sum = (key) => scenario.r.rows.reduce((t, row) => t + row[key], 0);

  const lineage = [
    { input: "Opening cash", value: fmtMoney(COMPANY.openingCash), kind: "actual", source: "Rho Checking ••4821 + Chase Savings ••9930 (via Plaid) · balances at last sync, 2 min ago" },
    { input: "Monthly receipts", value: fmtMoney(COMPANY.monthlyReceipts), kind: "actual", source: `Average of 6 months of deposits, excluding ${COMPANY.uncategorizedDeposits} transfers and loans · QuickBooks categories` },
    { input: "Monthly outflows", value: fmtMoney(COMPANY.monthlyOutflows), kind: "actual", source: "Average of 6 months of payments across all connected accounts" },
    { input: "NYC setup", value: `${fmtMoney(a.setup)} ${setupWhen(a.setupMonth)}`, kind: "assumption", source: a.setupRange ? `Entered as a range ${fmtK(a.setupRange.low)}–${fmtK(a.setupRange.high)}; plan uses the high end` : "Entered on Guided questions" },
    { input: "NYC team costs", value: `${fmtMoney(a.teamCost)}/mo from Month ${a.teamStart}`, kind: "assumption", source: "Entered on Guided questions" },
    { input: "New NYC receipts", value: `${fmtMoney(a.newReceipts)}/mo from Month ${a.receiptsStart}`, kind: "assumption", source: "Entered on Guided questions · downside halves it and starts a month later" },
    { input: "Cash reserve", value: fmtMoney(model.reserve), kind: a.reserve == null ? "goal" : "assumption", source: a.reserve == null ? "Your goals (set during setup)" : "Changed for this analysis only" },
    { input: "Reserve protected through", value: `Month ${PROTECT_THROUGH}`, kind: "assumption", source: `Policy: keep the floor while a raise (~${RAISE_LEAD_MONTHS} months) comes together` },
  ];

  return (
    <Modal title="How this is calculated" onClose={onClose} wide>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "months"} onClick={() => setTab("months")}>Month by month</button>
        <button role="tab" aria-selected={tab === "lineage"} onClick={() => setTab("lineage")}>Where each number comes from</button>
      </div>
      {tab === "months" ? (
        <>
          <div className="row wrap">
            <label className="small muted" htmlFor="calc-scenario">Scenario</label>
            <select id="calc-scenario" className="select" style={{ maxWidth: 380 }} value={pick} onChange={(e) => setPick(e.target.value)}>
              {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
          <div className="panel small" style={{ fontFamily: "var(--font-mono)" }}>
            Ending cash = starting cash + receipts + NYC receipts − costs − NYC team − setup
          </div>
          <div className="table-wrap">
            <table className="data calc">
              <thead>
                <tr>
                  <th>Month</th><th>Starting cash</th><th>Receipts</th><th>NYC receipts</th><th>Costs</th><th>NYC team</th><th>Setup</th><th>Ending cash</th>
                </tr>
              </thead>
              <tbody>
                {scenario.r.rows.map((row) => (
                  <tr key={row.m} className={row.m > 0 && row.end < model.reserve ? "below" : ""}>
                    <td className="first">M{row.m}</td>
                    <td>{fmtK(row.start)}</td>
                    <td>{row.m ? "+" + fmtK(row.receipts) : "—"}</td>
                    <td>{row.newRec ? "+" + fmtK(row.newRec) : "—"}</td>
                    <td>{row.m ? "−" + fmtK(row.outflows) : "—"}</td>
                    <td>{row.extra ? "−" + fmtK(row.extra) : "—"}</td>
                    <td>{row.setup ? "−" + fmtK(row.setup) : "—"}</td>
                    <td className="strong">{fmtK(row.end)}{row.m > 0 && row.end < model.reserve ? " ▼" : ""}</td>
                  </tr>
                ))}
                <tr className="total">
                  <td>12-month total</td><td></td>
                  <td>+{fmtK(sum("receipts"))}</td><td>+{fmtK(sum("newRec"))}</td><td>−{fmtK(sum("outflows"))}</td><td>−{fmtK(sum("extra"))}</td><td>−{fmtK(sum("setup"))}</td>
                  <td>{fmtK(scenario.r.cash[HORIZON])}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="row-between wrap small muted">
            <span>▼ below your {fmtK(model.reserve)} reserve · Runway (cash to $0): {fmtMonths(scenario.r.runway)}</span>
            <span className="row" style={{ gap: 6 }}><Prov kind="actual" /> receipts, costs · <Prov kind="assumption" /> NYC columns</span>
          </div>
        </>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Input</th><th>Value</th><th>Type</th><th>Source</th></tr></thead>
            <tbody>
              {lineage.map((l) => (
                <tr key={l.input}>
                  <td className="first">{l.input}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{l.value}</td>
                  <td><Prov kind={l.kind} /></td>
                  <td className="small muted" style={{ minWidth: 280 }}>{l.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="small muted" style={{ margin: 0 }}>
        The calculation engine computes every number. AI only writes the explanations, and they’re filled from these results. Version {a.version}.
      </p>
    </Modal>
  );
}

function SpendBars({ drivers }) {
  const max = Math.max(...drivers.map((d) => d.amount));
  const total = drivers.reduce((a, d) => a + d.amount, 0);
  return (
    <div className="bars" role="list">
      {drivers.map((d) => (
        <div className="bar-row" role="listitem" key={d.label}>
          <span>{d.label}</span>
          <div className="bar-track" aria-hidden="true"><div className="bar-fill" style={{ width: `${(d.amount / max) * 100}%` }} /></div>
          <span className="val">{fmtK(d.amount)} <span className="muted small" style={{ fontWeight: 400 }}>{Math.round((d.amount / total) * 100)}%</span></span>
        </div>
      ))}
    </div>
  );
}

function Progress({ pct, tone, marker }) {
  return (
    <div className={"progress " + (tone || "")} role="progressbar" aria-valuenow={Math.round(pct * 100)} aria-valuemin="0" aria-valuemax="100">
      <span style={{ width: `${pct * 100}%` }} />
      {marker != null && <span className="marker" style={{ left: `calc(${marker * 100}% - 2px)` }} title="Reserve floor" />}
    </div>
  );
}
