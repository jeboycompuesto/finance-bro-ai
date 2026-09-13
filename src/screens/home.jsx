// 02 Home and 02b Recommendations

const TOOL_CHARGES = [
  { name: "Notion", category: "Docs & wiki", amount: 420 },
  { name: "Coda", category: "Docs & wiki", amount: 380 },
  { name: "Confluence", category: "Docs & wiki", amount: 300 },
];
const OVERDUE = [
  { name: "Acme Health", amount: 11000, days: 52 },
  { name: "Birch & Co", amount: 7000, days: 47 },
];

function isNycQuestion(text) {
  return /nyc|new york|expan|city|team activit|afford/i.test(text);
}

function SyncBanner() {
  const { state, set, go, toast } = useStore();
  const [retrying, setRetrying] = useState(false);
  if (state.syncIssue !== "failed") return null;
  const retry = () => {
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      set((s) => { s.syncIssue = null; });
      toast("Rho synced — numbers are up to date");
    }, 1300);
  };
  return (
    <div className="banner banner-crit" role="alert">
      <div className="stack" style={{ gap: 2 }}>
        <span className="strong">Rho hasn’t synced for 3 hours</span>
        <span className="small">Numbers below use Rho data up to 9:02 AM. They’re labeled stale until the next sync.</span>
      </div>
      <div className="row wrap">
        <button className="btn btn-primary btn-sm" onClick={retry} disabled={retrying}>{retrying ? "Syncing…" : "Retry sync"}</button>
        <button className="btn btn-secondary btn-sm" onClick={() => go("connect", { manage: true })}>Reconnect Rho</button>
        <button className="btn btn-quiet btn-sm" onClick={() => set((s) => { s.syncIssue = "accepted"; })}>Continue with last sync</button>
      </div>
    </div>
  );
}

function reviewRow(state) {
  const v = state.validation;
  if (v.stage !== "ready") return null;
  const decided = Object.keys(v.decisions).length;
  if (v.savedVersion) return { tag: `Reviewed · ${v.savedVersion.approved} approved, ${v.savedVersion.rejected} rejected`, tone: "tag-good", when: "Today" };
  return { tag: `In review · 4 findings, ${decided} resolved`, tone: "tag-warn", when: "Today" };
}

function HomeScreen() {
  const { state, set, go, toast, model } = useStore();
  const [ask, setAsk] = useState("");
  const [asking, setAsking] = useState(false);
  const recs = buildRecommendations(state, model);
  const goals = goalMetrics(state, model);
  const done = state.analysis.status === "done";

  const startNyc = () => {
    set((s) => { if (s.analysis.status === "none") s.analysis.status = "draft"; });
    go("questions");
  };
  const submit = (text) => {
    const q = (text ?? ask).trim();
    if (!q) return;
    if (isNycQuestion(q)) return startNyc();
    toast("This demo models the NYC team decision. Other questions are coming soon.", { label: "Try NYC", run: startNyc });
  };

  return (
    <>
      <TopBar />
      <main className="page home-page">
        <SyncBanner />
        {state.welcome === "show" && (
          <section className="brody-welcome" aria-label="Setup complete">
            <div className="stack" style={{ gap: 6, flex: 1 }}>
              <span className="eyebrow">Setup complete</span>
              <h2 className="h2">Setup done. Nice.</h2>
              <p className="small" style={{ margin: 0 }}>Your workspace and goals are set. Let’s think through your next move.</p>
            </div>
            <div className="row wrap">
              <button className="btn btn-primary" onClick={() => { set((s) => { s.welcome = "dismissed"; }); startNyc(); }}>Try the NYC question →</button>
              <button className="btn btn-quiet" onClick={() => set((s) => { s.welcome = "dismissed"; })}>Dismiss</button>
            </div>
          </section>
        )}
        <div className="page-head overview-head">
          <div><span className="eyebrow">{COMPANY.name} <span className="workspace-dot">/</span> Financial workspace</span>
            <h1 className="h1">A clearer view of what’s next.</h1>
          </div>
          <span className="workspace-note">Sample company <span aria-hidden="true">·</span> {COMPANY.stage} stage</span>
        </div>

        <section className="overview-metrics" aria-label="Business snapshot">
          {[
            ["Cash available", fmtK(COMPANY.openingCash), state.syncIssue ? "From your last sync" : "Across your accounts"],
            ["Monthly net burn", fmtK(model.netBurnToday), "Outflows less receipts"],
            ["Current runway", fmtMonths(model.none.runway), "Before new plans"],
            ["Monthly receipts", fmtK(COMPANY.monthlyReceipts), "From connected accounts"],
          ].map(([label, value, note]) => <div className="overview-metric" key={label}>
            <span className="small muted">{label}</span><span className="metric-value">{value}</span><span className="metric-note">{note}</span>
          </div>)}
        </section>

        <section className="decision-intro" aria-label="Ask">
          <div className="decision-copy">
            <span className="eyebrow">From question to a considered decision</span>
            <h2 className="display">Make your next move<br />with the full picture.</h2>
            <p className="lede">Explore a decision, see the trade-offs, and understand what your cash can support.</p>
            <form className="big-ask" onSubmit={(e) => { e.preventDefault(); submit(); }}>
              <input value={ask} onChange={(e) => setAsk(e.target.value)} onFocus={() => setAsking(true)} onBlur={() => setAsking(false)} placeholder="Can we fund a NYC team?" aria-label="Ask a business question" />
              <button className="btn btn-primary" type="submit">Ask <span aria-hidden="true">↗</span></button>
            </form>
            <div className="decision-starter"><span className="small muted">Try a question</span><button onClick={startNyc}>Can we fund a NYC team? <span aria-hidden="true">↗</span></button></div>
          </div>
          <div className="brody-home-scene">
            <Brody pose={asking || ask.trim() ? "thinking" : state.welcome === "show" ? "celebrate" : "welcome"} className="brody-home-art" />
            <div className="brody-caption"><span className="brody-name">Brody</span><span>{asking || ask.trim() ? "Let’s think it through." : state.welcome === "show" ? "All set. Nice work." : "Big plans? Let’s take a look."}</span></div>
          </div>
        </section>
        <div className="decision-tools">
          <details className="decision-library">
            <summary>Explore decision areas <span className="small muted">10 areas</span></summary>
            <div className="decision-areas">
              {DECISION_AREAS.map((d) => <button key={d.id} className="area-tile" onClick={() => { setAsk(d.prompt); submit(d.prompt); }}>
                <span className="t">{d.label}</span><span className="p">{d.prompt}</span>
              </button>)}
            </div>
          </details>
          <div className="model-shortcut"><span className="small muted">Already have a financial model?</span><button className="btn btn-ghost btn-sm" onClick={() => go("validate")}>Review a model ↗</button></div>
        </div>

        <section className="home-recommendations stack" style={{ gap: 16 }} aria-label="Recommendations">
          <div className="row-between wrap">
            <div className="stack" style={{ gap: 2 }}>
              <span className="eyebrow">Recommendations for your business</span>
              <h2 className="h2">Worth your attention <span className="section-count">{recs.length}</span></h2>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => go("recs")}>View recommendations →</button>
          </div>
          <div className="grid-3">
            {recs.slice(0, 3).map((r) => (
              <button key={r.id} className={"recommendation-preview stack" + (r.impact === "High" ? " priority" : "")} onClick={() => go("recs")}>
                <span className="row-between"><span className="eyebrow">{r.category}</span><span className={"tag " + (r.impact === "High" ? "tag-dark" : "")}>{r.impact}</span></span>
                <span className="h3">{r.title}</span>
                <span className="small muted rec-metric">{r.metric}<span aria-hidden="true">↗</span></span>
              </button>
            ))}
          </div>
        </section>

        <div className="stack" style={{ gap: 10 }}>
          <span className="eyebrow">Your business right now</span>
          <div className="grid-2" style={{ alignItems: "start" }}>
            <section className="card pad stack" style={{ gap: 10 }} aria-label="Cash outlook">
              <div className="row-between">
                <h2 className="h3">Cash outlook</h2>
                {state.syncIssue ? <span className="tag tag-warn">Stale · data to 9:02 AM</span> : <Prov kind="actual" />}
              </div>
              <div className="row" style={{ alignItems: "baseline", gap: 10 }}>
                <span className="big-number">{fmtMonths(model.none.runway)}</span>
                <span className="small muted">of runway today</span>
              </div>
              <span className="small muted">{fmtK(COMPANY.openingCash)} cash ÷ {fmtK(model.netBurnToday)} monthly net burn · before new plans</span>
              <CashChart
                height={240}
                width={520}
                reserve={state.goals.selected.reserve ? state.goals.reserve : null}
                series={[
                  { id: "today", label: "Expected · today’s burn", short: "Expected", cash: model.none.cash, variant: "focus" },
                  { id: "down", label: `Downside · receipts −${OUTLOOK_SWING * 100}%`, short: "Downside", cash: model.outlook.downside.cash, variant: "dash" },
                  { id: "best", label: `Best case · receipts +${OUTLOOK_SWING * 100}%`, short: "Best case", cash: model.outlook.best.cash, variant: "dot" },
                ]}
                ariaLabel="Cash over the next 12 months: expected, downside and best case"
              />
            </section>
            <section className="card pad stack" style={{ gap: 12 }} aria-label="Where your money goes">
              <div className="row-between">
                <h2 className="h3">Where your money goes</h2>
                <span className="small muted num">{fmtK(COMPANY.monthlyOutflows)} / month</span>
              </div>
              <SpendBars drivers={COMPANY.costDrivers} />
              <span className="small muted">Source: QuickBooks categories · last 6 months</span>
            </section>
          </div>
        </div>

        {goals.length > 0 && (
          <div className="stack" style={{ gap: 10 }}>
            <div className="row-between">
              <span className="eyebrow">Your goals · what you’re setting money aside for</span>
              <button className="btn btn-ghost btn-sm" onClick={() => go("goals", { manage: true })}>Edit goals →</button>
            </div>
            <div className="grid-4">
              {goals.map((m) => (
                <section key={m.id} className="card pad-sm stack" style={{ gap: 10 }} aria-label={m.label}>
                  <div className="row-between">
                    <span className="eyebrow">{m.label}</span>
                    <span className={"tag tag-dot tag-" + m.tone}>{m.status}</span>
                  </div>
                  <span className="h3 num">{m.value}</span>
                  <Progress pct={m.pct} tone={m.tone} marker={m.marker} />
                  <span className="small muted">{m.note}</span>
                </section>
              ))}
            </div>
          </div>
        )}

        <section className="stack" style={{ gap: 10 }} aria-label="Recent analyses" id="recent">
          <span className="eyebrow">Recent analyses</span>
          <div className="card divider-list" style={{ padding: "0 18px" }}>
            {state.analysis.status !== "none" && (
              <button className="row-between" style={{ width: "100%", background: "none", border: 0, padding: "14px 0", textAlign: "left" }} onClick={() => go(done ? "recommendation" : "questions")}>
                <span className="row wrap"><span className="strong">NYC team activities + equipment</span>
                  <span className={"tag " + (done ? "tag-good" : "")}>{done ? `Created · ${model.verdict}` : "Draft · in progress"}</span></span>
                <span className="small muted">Today →</span>
              </button>
            )}
            {reviewRow(state) && (
              <button className="row-between" style={{ width: "100%", background: "none", border: 0, padding: "14px 0", textAlign: "left" }} onClick={() => go("findings")}>
                <span className="row wrap"><span className="strong">{SAMPLE_MODEL.fileName}</span><span className={"tag " + reviewRow(state).tone}>{reviewRow(state).tag}</span></span>
                <span className="small muted">{reviewRow(state).when} →</span>
              </button>
            )}
            <button className="row-between" style={{ width: "100%", background: "none", border: 0, padding: "14px 0", textAlign: "left" }} onClick={() => toast("The hiring analysis is coming soon in this demo.")}>
              <span className="row wrap"><span className="strong">Hire two engineers</span><span className="tag">Draft · 2 questions unanswered</span></span>
              <span className="small muted">3 days ago →</span>
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

function AnalysesScreen() {
  const { state, set, go, toast, model } = useStore();
  const a = state.analysis;
  const review = reviewRow(state);
  const startNyc = () => { set((s) => { if (s.analysis.status === "none") s.analysis.status = "draft"; }); go(a.status === "done" ? "recommendation" : "questions"); };
  const items = [
    a.status !== "none" && {
      title: "NYC team activities + equipment", kind: "Create", tag: a.status === "done" ? model.verdict : "Draft · in progress",
      tone: a.status === "done" ? (isStale(state) ? "tag-warn" : "tag-good") : "", note: a.status === "done" ? (isStale(state) ? "Inputs changed since the last answer" : model.headline) : "Guided questions answered — build scenarios next",
      when: "Today", open: startNyc,
    },
    review && { title: SAMPLE_MODEL.fileName, kind: "Validate", tag: review.tag, tone: review.tone, note: SAMPLE_MODEL.question, when: review.when, open: () => go("findings") },
    { title: "Hire two engineers", kind: "Create", tag: "Draft · 2 questions unanswered", tone: "", note: "Can we afford two engineers by Month 6?", when: "3 days ago", open: () => toast("The hiring analysis is coming soon in this demo.") },
  ].filter(Boolean);

  return (
    <>
      <TopBar />
      <main className="page">
        <div className="page-head">
          <div className="row"><Illustration subject="scenarios" className="spot-art" /><div>
            <h1 className="h1">Analyses</h1>
            <p className="lede">Decisions you’re modeling and models you’re checking. Every answer keeps its versions.</p>
          </div></div>
          <div className="row">
            <button className="btn btn-secondary" onClick={() => go("validate")}>Upload a model</button>
            <button className="btn btn-primary" onClick={() => go("home")}>New analysis</button>
          </div>
        </div>
        <section className="card divider-list" style={{ padding: "0 20px" }} aria-label="All analyses">
          {items.map((it) => (
            <button key={it.title} onClick={it.open} className="row-between wrap" style={{ width: "100%", background: "none", border: 0, padding: "16px 0", textAlign: "left" }}>
              <span className="stack" style={{ gap: 4, minWidth: 0 }}>
                <span className="row wrap"><span className="tag">{it.kind}</span><span className="h3">{it.title}</span><span className={"tag " + it.tone}>{it.tag}</span></span>
                <span className="small muted">{it.note}</span>
              </span>
              <span className="small muted">{it.when} →</span>
            </button>
          ))}
        </section>
      </main>
    </>
  );
}

function RecommendationsScreen() {
  const { state, set, go, toast, model } = useStore();
  const [openWhy, setOpenWhy] = useState({});
  const [detail, setDetail] = useState(null);
  const recs = buildRecommendations(state, model);
  const done = state.analysis.status === "done";

  const hide = (r, verb) => {
    set((s) => { s.hiddenRecs[r.id] = true; });
    toast(`${verb}: ${r.title}`, { label: "Undo", run: () => set((s) => { delete s.hiddenRecs[r.id]; }) });
  };
  const act = (r) => {
    if (r.go === "questions") { set((s) => { if (s.analysis.status === "none") s.analysis.status = "draft"; }); go("questions"); }
    else if (r.go) go(r.go);
    else setDetail(r.id);
  };

  const summary = done
    ? [
        `Cash covers ${fmtMonths(model.none.runway)} today. With the NYC plan, that falls to about ${Math.floor(model.rec.downside.runway)} months.`,
        `NYC adds a one-time setup cost and ${fmtK(state.analysis.teamCost)}/mo in team costs before new receipts catch up.`,
        "Work through these in order. The top two protect runway; the others free up cash.",
      ]
    : [
        `Cash covers ${fmtMonths(model.none.runway)} today at a ${fmtK(model.netBurnToday)}/mo net burn.`,
        "Your plans — NYC and two engineers — aren’t modeled yet, so we can’t say how much they shorten that.",
        "Start with the NYC plan. The cash-saving items help either way.",
      ];

  return (
    <>
      <TopBar />
      <main className="page">
        <div className="crumbs"><span><button onClick={() => go("home")}>Home</button> / Recommendations</span></div>
        <div className="page-head">
          <div>
            <h1 className="h1">Recommendations for your business</h1>
            <p className="lede">Generated from your connected accounts{done ? " and saved analyses" : ""}. Updated after every sync.</p>
          </div>
          <span className="small muted">Sorted by impact on runway</span>
        </div>
        <div className="grid-3">
          {["What is happening", "Why it is happening", "What to do next"].map((k, i) => (
            <div key={k} className="panel stack" style={{ gap: 6 }}>
              <span className="eyebrow">{k}</span>
              <span>{summary[i]}</span>
            </div>
          ))}
        </div>
        {recs.length === 0 && (
          <div className="card pad brody-empty">
            <Brody pose="celebrate" className="brody-empty-art" />
            <div className="stack" style={{ gap: 4 }}>
              <h2 className="h3">Nothing needs you right now.</h2>
              <span className="small muted">You’ve worked through this list. Come back when you’re ready to explore your next decision.</span>
            </div>
          </div>
        )}
        <div className="grid-2">
          {recs.map((r) => (
            <section key={r.id} className="card pad rec-card" aria-label={r.title}>
              <div className="row-between">
                <span className="eyebrow">{r.category}</span>
                <span className={"tag " + (r.impact === "High" ? "tag-dark" : "")}>{r.impact} impact</span>
              </div>
              <h2 className="h2">{r.title}</h2>
              <span className="strong num">{r.metric}</span>
              <div className="why stack" style={{ gap: 4 }}>
                <span className="eyebrow">Why we suggest this</span>
                <span className="small">{r.why}</span>
                {openWhy[r.id] && (
                  <span className="small muted">
                    {r.provenance === "actual"
                      ? "Calculated from your connected accounts. No assumptions involved."
                      : `Uses your NYC assumptions (team ${fmtK(state.analysis.teamCost)}/mo, receipts ${fmtK(state.analysis.newReceipts)}/mo from Month ${state.analysis.receiptsStart}). Change them and this updates.`}
                  </span>
                )}
              </div>
              <span className="row small muted">Based on: {r.basis} <Prov kind={r.provenance} /></span>
              <div className="row-between wrap">
                <div className="row">
                  <button className="btn btn-primary" onClick={() => act(r)}>{r.action} →</button>
                  <button className="btn btn-secondary" aria-expanded={!!openWhy[r.id]} onClick={() => setOpenWhy((o) => ({ ...o, [r.id]: !o[r.id] }))}>{openWhy[r.id] ? "Hide detail" : "Ask why"}</button>
                </div>
                <div className="row" style={{ gap: 2 }}>
                  <button className="btn btn-quiet btn-sm" onClick={() => hide(r, "Snoozed for 2 weeks")}>Snooze</button>
                  <button className="btn btn-quiet btn-sm" onClick={() => hide(r, "Dismissed")}>Dismiss</button>
                </div>
              </div>
            </section>
          ))}
        </div>
        <div className="panel row-between wrap small">
          <span>Recommendations never act on their own. You approve, snooze or dismiss each one.</span>
          <span className="muted">Last updated: today, after sync</span>
        </div>
        <div><button className="btn btn-ghost" onClick={() => go("home")}>← Back to Home</button></div>
      </main>

      {detail === "tools" && (
        <Modal title="3 overlapping software tools" onClose={() => setDetail(null)}>
          <p className="small muted" style={{ margin: 0 }}>Recurring charges from your bank transactions that look like the same kind of tool. We can’t see usage — check with your team before cancelling.</p>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Tool</th><th>Category</th><th style={{ textAlign: "right" }}>Monthly charge</th></tr></thead>
              <tbody>
                {TOOL_CHARGES.map((t) => <tr key={t.name}><td className="first">{t.name}</td><td>{t.category}</td><td style={{ textAlign: "right" }}>{fmtMoney(t.amount)}</td></tr>)}
                <tr className="total"><td>Total</td><td></td><td style={{ textAlign: "right" }}>{fmtMoney(TOOL_CHARGES.reduce((a, t) => a + t.amount, 0))}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" onClick={() => setDetail(null)}>Close</button>
            <button className="btn btn-primary" onClick={() => { setDetail(null); toast("Reminder set: review tools with the team on Friday"); }}>Remind me Friday</button>
          </div>
        </Modal>
      )}
      {detail === "invoices" && (
        <Modal title="2 invoices unpaid for 45+ days" onClose={() => setDetail(null)}>
          <p className="small muted" style={{ margin: 0 }}>From QuickBooks. Collecting both brings {fmtK(OVERDUE.reduce((a, i) => a + i.amount, 0))} in sooner.</p>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Customer</th><th>Days overdue</th><th style={{ textAlign: "right" }}>Amount</th></tr></thead>
              <tbody>
                {OVERDUE.map((i) => <tr key={i.name}><td className="first">{i.name}</td><td>{i.days} days</td><td style={{ textAlign: "right" }}>{fmtMoney(i.amount)}</td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" onClick={() => setDetail(null)}>Close</button>
            <button className="btn btn-primary" onClick={() => { setDetail(null); toast("Reminder drafts ready in QuickBooks — nothing sent"); }}>Draft reminders</button>
          </div>
        </Modal>
      )}
    </>
  );
}
