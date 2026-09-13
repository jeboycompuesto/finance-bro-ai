// 03 Guided questions → 04a Scenarios → 04b Recommendation

function Crumbs({ right }) {
  const { go } = useStore();
  return (
    <div className="crumbs">
      <span><button onClick={() => go("home")}>Home</button> / Analyses / NYC team activities + equipment</span>
      {right && <span>{right}</span>}
    </div>
  );
}

function QuestionsScreen() {
  const { state, set, go } = useStore();
  const a = state.analysis;
  const [tried, setTried] = useState(false);
  const burn = COMPANY.monthlyOutflows - COMPANY.monthlyReceipts;
  const reserve = a.reserve ?? state.goals.reserve;
  const rangeBad = a.setupRange && (a.setupRange.low == null || a.setupRange.high == null || a.setupRange.low > a.setupRange.high);
  const required = [rangeBad ? null : a.setup, a.teamCost, a.newReceipts, reserve];
  const answered = required.filter((v) => v != null).length;
  const complete = answered === required.length;
  const upd = (fn) => set((s) => fn(s.analysis));

  const build = () => {
    setTried(true);
    if (!complete) return;
    set((s) => { s.analysis.testSetup = s.analysis.setup; if (s.analysis.status === "none") s.analysis.status = "draft"; });
    go("scenarios");
  };

  return (
    <>
      <TopBar />
      <main className="page">
        <Crumbs />
        <Stepper current={2} />
        <QuestionBanner />
        <div className="grid-main rail-left">
          <section className="card pad stack" style={{ gap: 6 }} aria-label="From your accounts">
            <div className="row-between"><h2 className="h2">From your accounts</h2><Prov kind="actual" /></div>
            <span className="small muted">We already know these. You don’t need to type them.</span>
            <div className="divider-list" style={{ marginTop: 6 }}>
              <div className="kv"><span className="k">Opening cash</span><span className="v">{fmtMoney(COMPANY.openingCash)}</span></div>
              <div className="kv"><span className="k">Monthly receipts (avg.)</span><span className="v">{fmtMoney(COMPANY.monthlyReceipts)}</span></div>
              <div className="kv"><span className="k">Monthly outflows (avg.)</span><span className="v">{fmtMoney(COMPANY.monthlyOutflows)}</span></div>
              <div className="kv"><span className="k">Net burn</span><span className="v">{fmtMoney(burn)} / mo</span></div>
              <div className="kv"><span className="k">Runway today</span><span className="v">{fmtMonths(COMPANY.openingCash / burn)}</span></div>
            </div>
            <div className="panel small muted" style={{ marginTop: 8 }}>
              Sources: Rho Checking ••4821 · Chase Savings ••9930 (Plaid) · QuickBooks · last 6 months · synced 2 min ago
            </div>
          </section>

          <section className="card pad stack" style={{ gap: 18 }} aria-label="What we need from you">
            <div className="brody-question-intro">
              <Brody pose="thinking" className="brody-question-art" />
              <div className="stack" style={{ gap: 6, flex: 1 }}>
              <h2 className="h2">What we need from you</h2>
              <span className={"small " + (complete ? "muted" : "")} style={{ color: complete ? undefined : "var(--crit)" }}>
                {complete ? "All 4 required answered" : `${answered} of 4 required answered`}
              </span>
              </div>
            </div>
            <span className="small muted" style={{ marginTop: -10 }}>Only the inputs this question needs. Your bank data can’t see the future.</span>

            <div className="field">
              <div className="row-between"><label className="field-label" htmlFor="q-setup">One-time NYC setup (activities + equipment)</label><Prov kind="assumption" /></div>
              <Seg label="Setup amount type" value={a.setupRange ? "range" : "one"}
                onChange={(v) => upd((x) => {
                  if (v === "range" && !x.setupRange) x.setupRange = { low: Math.min(35000, x.setup ?? 35000), high: x.setup ?? 60000 };
                  if (v === "one") x.setupRange = null;
                  if (x.setupRange) x.setup = x.setupRange.high;
                })}
                options={[{ value: "one", label: "One amount" }, { value: "range", label: "Not sure — a range" }]} />
              <div className="row wrap">
                {a.setupRange ? (
                  <>
                    <div style={{ flex: 1, minWidth: 140 }}><MoneyInput id="q-setup" ariaLabel="Lowest likely setup" value={a.setupRange.low} invalid={tried && rangeBad} onChange={(v) => upd((x) => { x.setupRange.low = v; })} /></div>
                    <span className="muted">to</span>
                    <div style={{ flex: 1, minWidth: 140 }}><MoneyInput ariaLabel="Highest likely setup" value={a.setupRange.high} invalid={tried && rangeBad} onChange={(v) => upd((x) => { x.setupRange.high = v; x.setup = v; })} /></div>
                  </>
                ) : (
                  <div style={{ flex: 1, minWidth: 180 }}><MoneyInput id="q-setup" value={a.setup} invalid={tried && a.setup == null} onChange={(v) => upd((x) => { x.setup = v; })} /></div>
                )}
                <select className="select" style={{ width: 170 }} aria-label="When setup is paid" value={a.setupMonth} onChange={(e) => upd((x) => { x.setupMonth = Number(e.target.value); })}>
                  {SETUP_TIMING.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <span className="help" style={tried && (a.setup == null || rangeBad) ? { color: "var(--crit)" } : undefined}>
                {tried && rangeBad
                  ? "Enter both ends of the range, low first."
                  : tried && a.setup == null
                    ? "Enter your planned setup cost — we won’t guess it."
                    : a.setupRange
                      ? "We test the high end and tell you how much of the range is safe."
                      : "Not sure? Switch to a range."}
              </span>
            </div>

            <div className="field">
              <div className="row-between"><label className="field-label" htmlFor="q-team">Ongoing NYC team costs, per month</label><Prov kind="assumption" /></div>
              <div className="row wrap">
                <div style={{ flex: 1, minWidth: 180 }}><MoneyInput id="q-team" value={a.teamCost} invalid={tried && a.teamCost == null} onChange={(v) => upd((x) => { x.teamCost = v; })} /></div>
                <select className="select" style={{ width: 170 }} aria-label="When team costs start" value={a.teamStart} onChange={(e) => upd((x) => { x.teamStart = Number(e.target.value); })}>
                  {TEAM_TIMING.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <span className="help">Team activities, workspace, travel.</span>
            </div>

            <div className="field">
              <div className="row-between"><label className="field-label" htmlFor="q-rec">New monthly receipts from NYC</label><Prov kind="assumption" /></div>
              <div className="row wrap">
                <div style={{ flex: 1, minWidth: 180 }}><MoneyInput id="q-rec" value={a.newReceipts} invalid={tried && a.newReceipts == null} onChange={(v) => upd((x) => { x.newReceipts = v; })} /></div>
                <label className="small muted" htmlFor="q-start">Cash arrives from</label>
                <select id="q-start" className="select" style={{ width: 130 }} value={a.receiptsStart} onChange={(e) => upd((x) => { x.receiptsStart = Number(e.target.value); })}>
                  {[1, 2, 3, 4, 5, 6].map((m) => <option key={m} value={m}>Month {m}</option>)}
                </select>
              </div>
              <span className="help">When does cash actually land in the bank — not when deals close? The downside assumes half, a month later.</span>
            </div>

            <div className="field">
              <div className="row-between"><label className="field-label" htmlFor="q-reserve">Minimum cash reserve</label><Prov kind="goal" /></div>
              <MoneyInput id="q-reserve" value={reserve} onChange={(v) => upd((x) => { x.reserve = v; })} />
              <span className="help">Set during setup. Change it here for this analysis only.</span>
            </div>

            <div className="panel stack" style={{ gap: 10, border: "1px dashed var(--rule-strong)", background: "transparent" }}>
              <div className="row-between"><span className="field-label">Any new funding in the next 12 months?</span><span className="tag">Optional</span></div>
              <Seg label="New funding" value={a.funding} onChange={(v) => upd((x) => { x.funding = x.funding === v ? null : v; })}
                options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes — add a raise" }, { value: "unsure", label: "Not sure" }]} />
              {a.funding === "yes" && <span className="help">Raise modeling is coming soon. For now scenarios assume no new funding and tell you when to start raising.</span>}
            </div>
          </section>
        </div>
        <div className="footer-bar">
          <button className="btn btn-ghost" onClick={() => go("home")}>← Back to Home</button>
          <div className="row">
            {tried && !complete && <span className="small" style={{ color: "var(--crit)" }}>Fill the highlighted fields to build scenarios.</span>}
            <button className="btn btn-primary btn-lg" onClick={build}>Build scenarios →</button>
          </div>
        </div>
      </main>
    </>
  );
}
