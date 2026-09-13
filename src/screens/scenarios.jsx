// 04a Scenarios and 04b Recommendation

const INPUT_LABELS = {
  setup: "NYC setup", setupMonth: "setup timing", teamCost: "NYC team costs", teamStart: "team start month",
  newReceipts: "NYC receipts", receiptsStart: "receipts start month", reserve: "cash reserve",
};

function CustomScenarioForm({ onClose }) {
  const { state, set } = useStore();
  const a = state.analysis;
  const [name, setName] = useState("Slower NYC ramp");
  const [setup, setSetup] = useState(45000);
  const [rec, setRec] = useState(Math.round(a.newReceipts * 0.7));
  const [start, setStart] = useState(a.receiptsStart + 2);
  const valid = name.trim() && setup != null && rec != null;
  return (
    <div className="panel stack" style={{ gap: 10 }}>
      <span className="eyebrow">Add a scenario</span>
      <div className="inline-form">
        <label className="field"><span className="small strong">Name</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="field"><span className="small strong">Setup cost</span><MoneyInput value={setup} onChange={setSetup} ariaLabel="Scenario setup cost" /></label>
        <label className="field"><span className="small strong">NYC receipts / mo</span><MoneyInput value={rec} onChange={setRec} ariaLabel="Scenario NYC receipts" /></label>
        <label className="field"><span className="small strong">Receipts from</span>
          <select className="select" value={start} onChange={(e) => setStart(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((m) => <option key={m} value={m}>Month {m}</option>)}
          </select>
        </label>
        <div className="row">
          <button className="btn btn-quiet" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!valid} onClick={() => { set((s) => { s.analysis.custom = { name: name.trim(), setup, newReceipts: rec, receiptsStart: start }; }); onClose(); }}>Add</button>
        </div>
      </div>
      <span className="help">Uses your NYC team costs ({fmtK(a.teamCost)}/mo) and the same calculation. One extra scenario at a time.</span>
    </div>
  );
}

function ScenariosScreen() {
  const { state, set, go, model } = useStore();
  const a = state.analysis;
  const t = a.testSetup;
  const holds = t <= model.cap;
  const [calc, setCalc] = useState(null);
  const [adding, setAdding] = useState(false);

  const rows = [
    { label: "No expansion", r: model.none },
    { label: `Base · ${fmtK(t)} setup`, r: model.test.base },
    { label: `Downside · ${fmtK(t)} setup`, r: model.test.downside },
  ];
  if (t !== model.chosen) rows.push({ label: `Base · ${fmtK(model.chosen)} setup`, r: model.rec.base });
  rows.push({ label: `Downside · ${fmtK(model.chosen)} setup`, r: model.rec.downside, emph: true });
  if (model.custom) rows.push({ label: `${a.custom.name} · ${fmtK(a.custom.setup)} setup`, r: model.custom, custom: true });

  // Always three lines: the recommended setup (solid target) against the downside and base of the
  // setup being compared — the slider value, or your plan when the slider sits on the recommendation.
  const compare = t !== model.chosen ? t : a.setup;
  const cmp = compare === a.testSetup ? model.test : model.plan;
  const series = compare !== model.chosen
    ? [
        { id: "rec", label: `Downside · ${fmtK(model.chosen)} setup (recommended)`, short: "Recommended", cash: model.rec.downside.cash, variant: "focus" },
        { id: "down", label: `Downside · ${fmtK(compare)} setup`, short: "Downside", cash: cmp.downside.cash, variant: "dash" },
        { id: "base", label: `Base · ${fmtK(compare)} setup`, short: "Base", cash: cmp.base.cash, variant: "dot" },
      ]
    : [
        { id: "rec", label: `Downside · ${fmtK(model.chosen)} setup (recommended)`, short: "Recommended", cash: model.rec.downside.cash, variant: "focus" },
        { id: "base", label: `Base · ${fmtK(model.chosen)} setup`, short: "Base", cash: model.rec.base.cash, variant: "dot" },
        { id: "none", label: "No expansion", short: "No expansion", cash: model.none.cash, variant: "dash" },
      ];
  if (model.custom) series.push({ id: "custom", label: a.custom.name, short: a.custom.name, cash: model.custom.cash, variant: "alt" });
  const downM6 = model.test.downside.cash[PROTECT_THROUGH];

  const seeRecommendation = () => {
    set((s) => { s.analysis.status = "done"; s.analysis.computedWith = answerInputs(s); });
    go("recommendation");
  };

  return (
    <>
      <TopBar />
      <main className="page">
        <Crumbs right={`Version ${a.version} · auto-saved`} />
        <Stepper current={3} />
        <QuestionBanner sub={`Compare how cash moves in each scenario. Drag the setup cost to see where your ${fmtK(model.reserve)} reserve breaks.`} />
        <div className="grid-main">
          <div className="stack">
            <section className="card pad stack" style={{ gap: 14 }} aria-label="Month-end cash">
              <div className="row-between">
                <h2 className="h2">Month-end cash · next 12 months</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => setCalc("months")}>See calculation →</button>
              </div>
              <CashChart
                reserve={model.reserve}
                series={series}
                marker={downM6 < model.reserve ? { month: PROTECT_THROUGH, value: downM6, label: `M${PROTECT_THROUGH}: ${fmtK(downM6)} (${fmtK(downM6 - model.reserve)})` } : null}
              />
              <div className="lineage">
                <span>Numbers computed by the calculation engine from 3 sources + your assumptions. AI only writes the explanation.</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setCalc("lineage")}>View lineage →</button>
              </div>
            </section>

            <section className="card pad stack" style={{ gap: 8 }} aria-label="Compare scenarios">
              <div className="row-between">
                <h2 className="h2">Compare scenarios</h2>
                {!adding && !model.custom && <button className="btn btn-ghost btn-sm" onClick={() => setAdding(true)}>+ Add scenario</button>}
              </div>
              {adding && <CustomScenarioForm onClose={() => setAdding(false)} />}
              <div className="table-wrap">
                <table className="data">
                  <thead><tr><th>Scenario</th><th>Cash at M{PROTECT_THROUGH}</th><th>Below {fmtK(model.reserve)} reserve</th><th>Runway</th></tr></thead>
                  <tbody>
                    {rows.map((row) => {
                      const breach = firstMonthBelow(row.r.cash, model.reserve);
                      const early = breach != null && breach <= PROTECT_THROUGH;
                      return (
                        <tr key={row.label} className={row.emph ? "emph" : ""}>
                          <td className="first">
                            {row.label}{row.emph ? " ★" : ""}
                            {row.custom && <button className="btn btn-quiet btn-sm" style={{ marginLeft: 8, padding: 0 }} onClick={() => set((s) => { s.analysis.custom = null; })}>Remove</button>}
                          </td>
                          <td>{fmtK(row.r.cash[PROTECT_THROUGH])}</td>
                          <td>{breach ? <span className="row" style={{ gap: 6 }}>From Month {breach}{early && <span className="tag tag-crit">Too early</span>}</span> : "Holds all year"}</td>
                          <td>{fmtMonths(row.r.runway)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <span className="small muted">★ Recommended: the most setup that keeps the reserve through Month {PROTECT_THROUGH} in the downside. No new funding assumed.</span>
            </section>
          </div>

          <aside className="stack">
            <section className="card pad stack" style={{ gap: 14 }} aria-label="Change a driver">
              <div className="row-between"><h2 className="h2">Change a driver</h2><span className="tag tag-good">Live</span></div>
              <div className="field">
                <div className="row-between">
                  <label className="field-label" htmlFor="drv-setup">NYC setup cost</label>
                  <span className="big-number" style={{ fontSize: 22 }}>{fmtMoney(t)}</span>
                </div>
                <input id="drv-setup" type="range" className="slider" min="0" max="100000" step="5000" value={t}
                  onChange={(e) => set((s) => { s.analysis.testSetup = Number(e.target.value); })} />
                <div className="row-between small muted"><span>$0</span><span>$100k</span></div>
                <span className={"tag tag-dot " + (holds ? "tag-good" : "tag-crit")} style={{ alignSelf: "flex-start" }}>
                  {holds ? `Reserve holds through Month ${PROTECT_THROUGH}` : `Downside breaks the reserve in Month ${firstMonthBelow(model.test.downside.cash, model.reserve)}`}
                </span>
                <span className="help">The reserve holds up to {fmtK(model.cap)}. {model.rangeNote || `Your plan is ${fmtK(a.setup)}.`}</span>
              </div>
              <div className="field">
                <span className="field-label">NYC receipts start</span>
                <Seg label="NYC receipts start" value={a.receiptsStart} onChange={(v) => set((s) => { s.analysis.receiptsStart = v; })}
                  options={[2, 3, 4].map((m) => ({ value: m, label: `Month ${m}` }))} />
              </div>
            </section>

            <section className="card pad stack" style={{ gap: 4 }} aria-label="What this answer assumes">
              <div className="row-between"><h2 className="h3">What this answer assumes</h2><button className="btn btn-ghost btn-sm" onClick={() => go("questions")}>Edit</button></div>
              <div className="divider-list">
                <div className="kv small"><span className="k">Opening cash</span><span className="v">{fmtK(COMPANY.openingCash)} <Prov kind="actual" /></span></div>
                <div className="kv small"><span className="k">Net burn today</span><span className="v">{fmtK(model.netBurnToday)}/mo <Prov kind="actual" /></span></div>
                <div className="kv small"><span className="k">Setup timing</span><span className="v">{SETUP_TIMING.find((o) => o.value === a.setupMonth).label} <Prov kind="assumption" /></span></div>
                <div className="kv small"><span className="k">NYC team costs</span><span className="v">{fmtK(a.teamCost)}/mo · M{a.teamStart} <Prov kind="assumption" /></span></div>
                <div className="kv small"><span className="k">NYC receipts</span><span className="v">{fmtK(a.newReceipts)}/mo · M{a.receiptsStart} <Prov kind="assumption" /></span></div>
                <div className="kv small"><span className="k">Downside receipts</span><span className="v">{fmtK(a.newReceipts / 2)}/mo · M{a.receiptsStart + 1} <Prov kind="assumption" /></span></div>
                <div className="kv small"><span className="k">Cash reserve</span><span className="v">{fmtK(model.reserve)} <Prov kind={a.reserve == null ? "goal" : "assumption"} /></span></div>
              </div>
            </section>
          </aside>
        </div>
        <div className="footer-bar">
          <button className="btn btn-ghost" onClick={() => go("questions")}>← Edit assumptions</button>
          <button className="btn btn-primary btn-lg" onClick={seeRecommendation}>See recommendation →</button>
        </div>
      </main>
      {calc && <CalculationModal initialTab={calc} onClose={() => setCalc(null)} />}
    </>
  );
}

function RecommendationScreen() {
  const store = useStore();
  const { state, set, go, toast } = store;
  const a = state.analysis;
  const [view, setView] = useState("cash");
  const [asked, setAsked] = useState([]);
  const [draft, setDraft] = useState("");
  const [brief, setBrief] = useState(false);
  const [calc, setCalc] = useState(null);

  // Reaching the recommendation (by button, link or the demo menu) completes the analysis.
  useEffect(() => {
    if (a.status !== "done" || !a.computedWith) set((s) => { s.analysis.status = "done"; s.analysis.computedWith = s.analysis.computedWith || answerInputs(s); });
  }, [a.status, a.computedWith, set]);

  const stale = isStale(state);
  const shownState = stale ? withInputs(state, a.computedWith) : state;
  const model = stale ? buildModel(shownState) : store.model;
  const changed = stale ? ANSWER_INPUTS.filter((k) => answerInputs(state)[k] !== a.computedWith[k]) : [];
  const answers = askAnswers(shownState, model);
  const d = model.rec.downside;
  const toneTag = model.verdict === "Viable as planned" ? "tag-good" : model.verdict === "Not viable yet" ? "tag-crit" : "tag-warn";
  const sa = shownState.analysis;

  const cashRows = [
    ["Receipts", fmtK(COMPANY.monthlyReceipts), `${fmtK(model.downReceipts)} from Month ${model.downStart}`, `+${fmtK(sa.newReceipts / 2)}`],
    ["Operating costs", fmtK(COMPANY.monthlyOutflows), `${fmtK(model.costsWithNyc)} from Month ${sa.teamStart}`, `+${fmtK(sa.teamCost)}`],
    ["   New budget line: NYC team", "—", fmtK(sa.teamCost), "Not in current budget"],
    ["One-time: NYC setup", "—", `${fmtK(model.chosen)} ${setupWhen(sa.setupMonth)}`, `+${fmtK(model.chosen)}`],
  ];
  const plRows = [
    ["Revenue (accrual)", fmtK(COMPANY.monthlyReceipts), `${fmtK(model.downReceipts)} from Month ${model.downStart}`, `+${fmtK(sa.newReceipts / 2)}`],
    ["Operating expenses", fmtK(COMPANY.monthlyOutflows), fmtK(model.costsWithNyc), `+${fmtK(sa.teamCost)}`],
    ["Team activities (expensed)", "—", `${fmtK(Math.round(model.chosen * 0.4))} when paid`, "One-off"],
    ["Equipment (capitalized, 3 yrs)", "—", `${fmtK(Math.round((model.chosen * 0.6) / 36))}/mo depreciation`, `${fmtK(Math.round(model.chosen * 0.6))} asset`],
  ];
  const budgetRows = [
    ["NYC team (new line)", "Not budgeted", `${fmtK(sa.teamCost)}/mo`, "Add to budget"],
    ["NYC setup", `${fmtK(sa.setup)} planned`, `${fmtK(model.chosen)} cap`, model.planHolds ? "Within plan" : `−${fmtK(sa.setup - model.chosen)} vs plan`],
    ["Marketing", fmtK(5000) + "/mo", fmtK(5000) + "/mo", "No change"],
    ["Software", fmtK(9000) + "/mo", fmtK(9000) + "/mo", "Review 3 tools"],
  ];
  const rows = view === "cash" ? cashRows : view === "pl" ? plRows : budgetRows;
  const heads = view === "budget" ? ["Line", "Budget", "With NYC plan", "Variance"] : ["Line (monthly)", "Today", "With NYC plan", "Change"];

  const ask = (text) => {
    const t = text.toLowerCase();
    const hit = answers.find((x) => x.q === text) ||
      (/calcul|math|formula|how is/.test(t) && answers.find((x) => x.calc)) ||
      (/runway|drop/.test(t) && answers[0]) ||
      (/month 2|start|earlier/.test(t) && answers[2]) ||
      (/cap|35|why \$|setup/.test(t) && answers[1]);
    setAsked((q) => [...q, { q: text, a: hit ? hit.a : "In this demo I can answer questions about runway, the setup cap, receipt timing and how the numbers are calculated. Try one of the suggestions.", calc: hit && hit.calc }]);
    setDraft("");
  };

  const recalc = () => {
    set((s) => { s.analysis.computedWith = answerInputs(s); s.analysis.version += 1; });
    toast(`Recalculated — saved as version ${a.version + 1}`);
  };
  const undo = () => {
    set((s) => {
      const { reserve, ...rest } = s.analysis.computedWith;
      Object.assign(s.analysis, rest);
      s.analysis.reserve = reserve === s.goals.reserve ? null : reserve;
      s.analysis.testSetup = s.analysis.setup;
    });
    toast("Change undone — back to the last answer");
  };

  return (
    <>
      <TopBar />
      <main className="page">
        <Crumbs right={`Version ${a.version} · ${stale ? "inputs changed" : "auto-saved"}`} />
        <Stepper current={4} />
        {stale && (
          <div className="banner banner-warn" role="alert">
            <div className="stack" style={{ gap: 2 }}>
              <span className="strong">These numbers are out of date</span>
              <span className="small">
                You changed {changed.map((k) => INPUT_LABELS[k]).join(", ")} after this answer. Showing version {a.version} until you recalculate.
              </span>
            </div>
            <div className="row">
              <button className="btn btn-primary btn-sm" onClick={recalc}>Recalculate</button>
              <button className="btn btn-secondary btn-sm" onClick={undo}>Undo change</button>
            </div>
          </div>
        )}
        <div className={stale ? "stale stack" : "stack"} style={{ gap: 22 }} aria-hidden={stale || undefined}>
          <section className="card pad card-emph stack" style={{ gap: 16 }} aria-label="Recommendation">
            <div className="row wrap" style={{ gap: 8 }}>
              <span className="tag tag-dark">Recommendation</span>
              <span className={"tag tag-dot " + toneTag}>{model.verdict}</span>
              <span className="small muted">Q: {NYC_QUESTION}</span>
            </div>
            <h1 className="h1" style={{ fontSize: 30 }}>{model.headline}</h1>
            {model.rangeNote && <span className="small">{model.rangeNote}</span>}
            <div className="grid-3">
              {[["What is happening", model.what], ["Why it is happening", model.why], ["What to do next", model.next]].map(([k, v]) => (
                <div key={k} className="panel stack" style={{ gap: 6 }}><span className="eyebrow">{k}</span><span>{v}</span></div>
              ))}
            </div>
          </section>

          <div className="grid-main">
            <section className="card pad stack" style={{ gap: 12 }} aria-label="What changes in your financials">
              <div className="row-between wrap">
                <h2 className="h2">What changes in your financials</h2>
                <span className="tag">Downside · {fmtK(model.chosen)} setup</span>
              </div>
              <Seg label="Financial view" value={view} onChange={setView}
                options={[{ value: "cash", label: "Cash view" }, { value: "pl", label: "P&L view (QuickBooks)" }, { value: "budget", label: "Budget view" }]} />
              <div className="table-wrap">
                <table className="data">
                  <thead><tr>{heads.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r[0]}>
                        <td className={r[0].startsWith("   ") ? "" : "first"} style={r[0].startsWith("   ") ? { paddingLeft: 28, color: "var(--muted)" } : undefined}>{r[0].trim()}</td>
                        <td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td>
                      </tr>
                    ))}
                    {view === "cash" && (
                      <>
                        <tr className="total"><td>Net burn</td><td>{fmtK(model.netBurnToday)}</td><td>{fmtK(model.burnBefore)} → {fmtK(model.burnAfter)} from Month {model.downStart}</td><td>+{fmtK(model.burnAfter - model.netBurnToday)} ongoing</td></tr>
                        <tr className="total"><td>Runway</td><td>{fmtMonths(model.none.runway)}</td><td>{fmtMonths(d.runway)} (base {fmtMonthsShort(model.rec.base.runway)})</td><td>−{(model.none.runway - d.runway).toFixed(1)} months</td></tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="panel stack" style={{ gap: 6 }}>
                <span className="eyebrow">Goals affected</span>
                <span className="small">
                  Cash reserve floor ({fmtK(model.reserve)}): {model.breach ? `breached from Month ${model.breach}` : "holds all year"}
                  {state.goals.selected.runway && <> · Runway target ({state.goals.runwayTarget} mo): gap widens from {(state.goals.runwayTarget - model.none.runway).toFixed(1)} to {(state.goals.runwayTarget - d.runway).toFixed(1)} months</>}
                  {state.goals.selected.expand && <> · NYC team fund: {state.nycTargetUpdated ? `target now ${fmtK(model.chosen)}` : `lower the target from ${fmtK(state.goals.nyc.target)} to ${fmtK(model.chosen)}`}</>}
                </span>
              </div>
              <div className="row-between wrap">
                <span className="small muted">{view === "pl" ? "P&L split of setup (40% activities, 60% equipment) is an assumption." : "Cash view uses bank actuals; P&L view uses QuickBooks categories."}</span>
                <div className="row">
                  <button className="btn btn-secondary btn-sm" onClick={() => toast(`Added “NYC team · ${fmtK(sa.teamCost)}/mo” to your budget draft`)}>Add NYC line to budget</button>
                  <button className="btn btn-secondary btn-sm" disabled={state.nycTargetUpdated || !state.goals.selected.expand}
                    onClick={() => { set((s) => { s.nycTargetUpdated = true; }); toast(`NYC team fund target set to ${fmtK(model.chosen)}`, { label: "Undo", run: () => set((s) => { s.nycTargetUpdated = false; }) }); }}>
                    {state.nycTargetUpdated ? "Goals updated ✓" : "Update goals"}
                  </button>
                </div>
              </div>
            </section>

            <aside className="stack">
              <section className="card pad stack" style={{ gap: 8 }} aria-label="Scenario behind this answer">
                <div className="row-between"><span className="eyebrow">Scenario behind this answer</span><button className="btn btn-ghost btn-sm" onClick={() => go("scenarios")}>Compare →</button></div>
                <h2 className="h2">Downside · {fmtK(model.chosen)} setup</h2>
                <div className="divider-list">
                  <div className="kv small"><span className="k">Cash at Month {PROTECT_THROUGH}</span><span className="v">{fmtK(d.cash[PROTECT_THROUGH])}</span></div>
                  <div className="kv small"><span className="k">Below {fmtK(model.reserve)} reserve</span><span className="v">{model.breach ? `From Month ${model.breach}` : "Never"}</span></div>
                  <div className="kv small"><span className="k">Runway</span><span className="v">{fmtMonthsShort(d.runway)} months (base {fmtMonthsShort(model.rec.base.runway)})</span></div>
                </div>
                <span className="small muted">We plan for the downside so the answer holds if NYC receipts arrive late.</span>
                <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start", paddingLeft: 0 }} onClick={() => setCalc("months")}>See calculation →</button>
              </section>

              <section className="panel stack" style={{ gap: 10 }} aria-label="Ask about this analysis">
                <h2 className="h3">Ask about this analysis</h2>
                {asked.map((m, i) => (
                  <React.Fragment key={i}>
                    <div className="chat-q">{m.q}</div>
                    <div className="chat-a stack" style={{ gap: 6 }}>
                      <span>{m.a}</span>
                      {m.calc && <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start", paddingLeft: 0 }} onClick={() => setCalc("months")}>Open the month-by-month calculation →</button>}
                    </div>
                  </React.Fragment>
                ))}
                {answers.filter((x) => !asked.some((m) => m.q === x.q)).slice(0, asked.length ? 2 : 3).map((x) => (
                  <button key={x.q} className="suggest" onClick={() => ask(x.q)}>{x.q}</button>
                ))}
                <form className="row" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) ask(draft.trim()); }}>
                  <input className="input" placeholder="Ask a follow-up…" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Ask a follow-up question" />
                  <button className="btn btn-dark" type="submit">Ask</button>
                </form>
              </section>
            </aside>
          </div>
        </div>

        <div className="footer-bar">
          <button className="btn btn-ghost" onClick={() => go("scenarios")}>← Back to scenarios</button>
          <div className="row">
            <button className="btn btn-secondary" disabled={stale} onClick={() => { set((s) => { s.analysis.version += 1; }); toast(`Saved as version ${a.version + 1}`); }}>Save version</button>
            <button className="btn btn-primary btn-lg" disabled={stale} onClick={() => setBrief(true)}>Share decision brief →</button>
          </div>
        </div>
      </main>

      {calc && <CalculationModal initialTab={calc} onClose={() => setCalc(null)} />}
      {brief && (
        <Modal title="Decision brief" onClose={() => setBrief(false)}>
          <p className="small muted" style={{ margin: 0 }}>A plain-text summary your cofounders or board can read in a minute. Every number traces back to this analysis.</p>
          <pre className="brief">{decisionBrief(state, model)}</pre>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" onClick={() => setBrief(false)}>Close</button>
            <button className="btn btn-primary" onClick={async () => {
              try { await navigator.clipboard.writeText(decisionBrief(state, model)); toast("Brief copied — paste it into Slack or email"); }
              catch { toast("Couldn’t copy automatically — select the text and copy it"); }
            }}>Copy brief</button>
          </div>
        </Modal>
      )}
    </>
  );
}
