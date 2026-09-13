// Setup: 00 Loading → 01 Connect your data → 01b Set your goals

function LoadingScreen() {
  const { go } = useStore();
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const started = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - started) / 2400);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const items = [
    { label: "Secure workspace created", at: 0.15 },
    { label: "Loading available integrations", at: 0.6 },
    { label: "Preparing your setup", at: 0.98 },
  ];
  const ready = progress >= 1;
  return (
    <main className="loading-screen">
      <div className="loading-col">
        <Illustration subject="clarity" className="loading-art" />
        <div className="stack" style={{ gap: 10, alignItems: "center" }}>
          <h1 className="brand" style={{ margin: 0 }} aria-label="Finance Bro AI"><BrandMark /> <Wordmark /></h1>
          <p className="lede" style={{ margin: 0 }}>{ready ? "Your workspace is ready. Make room for your next move." : "Getting your workspace ready…"}</p>
        </div>
        <div style={{ width: "100%" }} className="stack">
          <div className="progress good" aria-label="Loading progress"><span style={{ width: `${progress * 100}%` }} /></div>
          <div className="check-list">
            {items.map((it) => {
              const done = progress >= it.at;
              return (
                <span key={it.label} className={done ? "" : "pending"}>
                  {done ? "✓" : "○"} {it.label}
                </span>
              );
            })}
          </div>
        </div>
        <section className="panel stack" style={{ width: "100%", padding: 24, textAlign: "left", gap: 16 }} aria-label="What setup looks like">
          <div className="row-between">
            <h2 className="h3">Next: set up your workspace</h2>
            <span className="small muted">About 5 minutes</span>
          </div>
          <div className="grid-3">
            {[
              ["1", "Connect your data", "Banks, cards, accounting, payroll. Read-only."],
              ["2", "Set your goals", "What you’re working toward and saving for."],
              ["✓", "Your Home", "Runway, goals and recommendations."],
            ].map(([n, t, d]) => (
              <div key={t} className="card pad-sm stack" style={{ gap: 6 }}>
                <span className="tag tag-dark" style={{ alignSelf: "flex-start" }}>{n}</span>
                <span className="strong">{t}</span>
                <span className="small muted">{d}</span>
              </div>
            ))}
          </div>
          <p className="small muted" style={{ margin: 0 }}>We connect your data first so we can suggest realistic goal amounts from your real cash and burn.</p>
        </section>
        <button className="btn btn-primary btn-lg" disabled={!ready} onClick={() => go("connect")}>
          {ready ? "Start setup →" : "Loading…"}
        </button>
      </div>
    </main>
  );
}

function ConnectScreen() {
  const { state, set, go, toast } = useStore();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [managing, setManaging] = useState(null);
  const [reviewDeposits, setReviewDeposits] = useState(false);
  const manage = state.manage;
  const connected = (id) => state.sources[id] === "connected";
  const connectedList = INTEGRATIONS.filter((i) => connected(i.id));
  const hasCash = connectedList.some((i) => i.kind === "bank" || i.kind === "file");
  const hasBooks = connectedList.some((i) => i.kind === "accounting");

  const connect = (item) => {
    const st = state.sources[item.id];
    if (item.planned || (st && st !== "failed")) return;
    const willFail = item.failsFirst && !(state.failedOnce && state.failedOnce[item.id]);
    set((s) => { s.sources[item.id] = "connecting"; });
    setTimeout(() => {
      if (willFail) {
        set((s) => { s.sources[item.id] = "failed"; s.failedOnce = { ...(s.failedOnce || {}), [item.id]: true }; });
        return;
      }
      set((s) => { s.sources[item.id] = "connected"; });
      toast(`${item.name} connected · ${item.account}`);
    }, 1100);
  };
  const disconnect = (item) => {
    set((s) => { delete s.sources[item.id]; });
    toast(`${item.name} disconnected`, { label: "Undo", run: () => set((s) => { s.sources[item.id] = "connected"; }) });
  };
  const useDemo = () => {
    set((s) => { ["rho", "plaid", "quickbooks"].forEach((id) => (s.sources[id] = "connected")); });
    toast("Demo company connected: Rho, Plaid and QuickBooks");
  };

  const visible = INTEGRATIONS.filter(
    (i) => (filter === "all" || i.category === filter) && i.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <>
      {manage ? <TopBar /> : <><TopBar setup /><SetupBar step={0} /></>}
      <main className="page">
        <div className="page-head">
          <div>
            <h1 className="h1">{manage ? "Your connected data" : "Connect your financial tools"}</h1>
            <p className="lede">
              Connect everything you use — banks, cards, accounting, payroll, revenue — so we can see where your business stands today.
              Read-only: we can never move money.{manage ? "" : " Next, you’ll set your goals."}
            </p>
          </div>
          <input className="input" style={{ maxWidth: 340 }} type="search" placeholder="Search integrations (Mercury, Xero, Stripe…)" aria-label="Search integrations" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        <div className="grid-main">
          <div className="stack">
            <div className="row wrap" role="group" aria-label="Filter by category">
              <button className="chip" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All</button>
              {CATEGORIES.map((c) => (
                <button key={c.id} className="chip" aria-pressed={filter === c.id} onClick={() => setFilter(c.id)}>{c.label}</button>
              ))}
            </div>
            {CATEGORIES.map((cat) => {
              const items = visible.filter((i) => i.category === cat.id);
              if (!items.length) return null;
              const n = items.filter((i) => connected(i.id)).length;
              return (
                <section key={cat.id} className="card pad stack" style={{ gap: 12 }} aria-label={cat.label}>
                  <div className="row-between">
                    <span className="eyebrow" style={{ color: "var(--ink)" }}>{cat.label}</span>
                    <span className="small muted">{n ? `${n} connected · ` : ""}{cat.note}</span>
                  </div>
                  <div className="grid-3">
                    {items.map((item) => {
                      const st = state.sources[item.id];
                      return (
                        <div key={item.id} className={"integration" + (st === "connected" ? " connected" : "") + (item.planned ? " planned" : "")}>
                          <div className="row" style={{ gap: 10 }}>
                            <span className="logo" aria-hidden="true">{item.name[0]}</span>
                            <span className="strong" style={{ flex: 1 }}>{item.name}</span>
                            {item.planned && <span className="tag">Planned</span>}
                            {item.suggested && !st && <span className="tag tag-goal">Suggested</span>}
                          </div>
                          <span className="small muted" style={{ flex: 1 }}>{item.desc}</span>
                          {st === "connected" ? (
                            <div className="stack small" style={{ gap: 2, alignItems: "flex-start" }}>
                              <span className="strong">✓ {item.account}</span>
                              <button className="btn btn-quiet btn-sm" style={{ padding: 0 }} onClick={() => disconnect(item)}>Disconnect</button>
                            </div>
                          ) : st === "connecting" ? (
                            <span className="row small muted"><span className="spinner" /> Connecting — sign in with {item.name}…</span>
                          ) : st === "failed" ? (
                            <div className="stack" style={{ gap: 8 }}>
                              <span className="small" style={{ color: "var(--crit)" }}>{item.name} didn’t finish connecting — the sign-in window closed before access was granted.</span>
                              <div className="row wrap" style={{ gap: 6 }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => connect(item)}>Retry</button>
                                <button className="btn btn-quiet btn-sm" onClick={() => { set((s) => { delete s.sources[item.id]; }); connect(INTEGRATIONS.find((i) => i.id === "csv")); }}>Upload CSV instead</button>
                              </div>
                            </div>
                          ) : item.planned ? (
                            <span className="small muted">Coming soon</span>
                          ) : (
                            <button className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => connect(item)}>
                              {item.kind === "file" ? "Upload file" : "Connect"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
            {!visible.length && (
              <div className="card pad muted">No integrations match “{query}”. Upload a CSV instead, or request one.</div>
            )}
          </div>

          <aside className="stack" aria-label="Your baseline">
            <section className={"card pad stack" + (hasCash ? " card-emph" : "")} style={{ gap: 12 }}>
              <div className="row-between">
                <h2 className="h2">Your baseline</h2>
                <span className="tag">{connectedList.length} source{connectedList.length === 1 ? "" : "s"}</span>
              </div>
              {!hasCash ? (
                <div className="panel stack" style={{ gap: 10 }}>
                  <span className="small">Connect a bank, card, or upload a CSV to see your cash, burn and runway.</span>
                  <button className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }} onClick={useDemo}>Use demo company</button>
                </div>
              ) : (
                <>
                  <div className="divider-list">
                    {connectedList.map((i) => (
                      <div key={i.id} style={{ padding: "9px 0" }} className="stack">
                        <div className="row">
                          <span className="logo" aria-hidden="true">{i.name[0]}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="strong small">{i.name}</div>
                            <div className="small muted">
                              {i.account} · {i.id === "rho" && state.syncIssue === "failed" ? <span style={{ color: "var(--crit)" }}>sync failed 3 hours ago</span> : "synced just now"}
                            </div>
                          </div>
                          <button className="btn btn-quiet btn-sm" aria-expanded={managing === i.id} onClick={() => setManaging(managing === i.id ? null : i.id)}>Manage</button>
                        </div>
                        {managing === i.id && (
                          <div className="row wrap" style={{ gap: 6, paddingLeft: 42 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => { set((s) => { if (i.id === "rho") s.syncIssue = null; }); toast(`${i.name} synced just now`); setManaging(null); }}>Sync now</button>
                            <button className="btn btn-quiet btn-sm" onClick={() => { disconnect(i); setManaging(null); }}>Disconnect</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {connected("rho") && connected("plaid") && (
                    <div className="panel small" style={{ padding: 12, border: "1px dashed var(--rule-strong)", background: "transparent" }}>
                      Your Rho account also showed up through Plaid. We merged them, so nothing is counted twice.
                    </div>
                  )}
                  <div className="divider-list">
                    <div className="kv"><span className="k">Cash on hand</span><span className="v">{fmtMoney(COMPANY.openingCash)} <Prov kind="actual" /></span></div>
                    <div className="kv"><span className="k">Avg. monthly receipts</span><span className="v">{fmtMoney(COMPANY.monthlyReceipts)} <Prov kind="actual" /></span></div>
                    <div className="kv"><span className="k">Avg. monthly outflows</span><span className="v">{fmtMoney(COMPANY.monthlyOutflows)} <Prov kind="actual" /></span></div>
                    <div className="kv"><span className="k">Runway today</span><span className="v">{fmtMonths(COMPANY.openingCash / (COMPANY.monthlyOutflows - COMPANY.monthlyReceipts))}</span></div>
                  </div>
                  {hasBooks ? (
                    <>
                      <span className="eyebrow">Cost drivers · categories from QuickBooks</span>
                      <div className="row wrap" style={{ gap: 6 }}>
                        {COMPANY.costDrivers.map((d) => <span className="chip" key={d.label}>{d.label} {fmtK(d.amount)}</span>)}
                      </div>
                      {state.depositsReviewed ? (
                        <div className="panel row-between small" style={{ padding: 12 }}>
                          <span>✓ {COMPANY.uncategorizedDeposits} deposits categorized — not counted as revenue</span>
                          <button className="btn btn-ghost btn-sm" onClick={() => setReviewDeposits(true)}>Edit</button>
                        </div>
                      ) : (
                        <div className="panel row-between small" style={{ padding: 12, background: "var(--warn-soft)" }}>
                          <span>⚠ {COMPANY.uncategorizedDeposits} deposits aren’t categorized — loans or transfers, not revenue?</span>
                          <button className="btn btn-ghost btn-sm" onClick={() => setReviewDeposits(true)}>Review</button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="panel small">Connect accounting (QuickBooks, Xero…) to split costs into categories.</div>
                  )}
                </>
              )}
            </section>
            <section className="card pad-sm stack" style={{ gap: 8 }}>
              <h2 className="h3">How we protect your data</h2>
              <ul className="small muted" style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>
                <li>Read-only, least-privilege access. We can’t move money or change your books.</li>
                <li>You sign in with each provider — we never see those passwords.</li>
                <li>Every number keeps its source, so you can trace it back.</li>
                <li>Disconnect a source or delete your data anytime.</li>
                <li>Your data is never used to benchmark other companies without opt-in.</li>
              </ul>
            </section>
          </aside>
        </div>

        <div className="footer-bar">
          <span className="small muted">{manage ? "Changes apply to every analysis." : "Minimum to continue: 1 bank or card source, or a CSV."}</span>
          <div className="row">
            {!manage && !hasCash && <button className="btn btn-quiet" onClick={useDemo}>Use demo company</button>}
            {manage ? (
              <button className="btn btn-primary" onClick={() => go("home")}>Done</button>
            ) : (
              <button className="btn btn-primary btn-lg" disabled={!hasCash} onClick={() => go("goals")}>Continue to goals →</button>
            )}
          </div>
        </div>
      </main>
      {reviewDeposits && <DepositReview onClose={() => setReviewDeposits(false)} />}
    </>
  );
}

function DepositReview({ onClose }) {
  const { set, toast } = useStore();
  const [types, setTypes] = useState(() => Object.fromEntries(FLAGGED_DEPOSITS.map((d) => [d.id, d.suggested])));
  const revenue = FLAGGED_DEPOSITS.filter((d) => types[d.id] === "revenue").reduce((t, d) => t + d.amount, 0);
  return (
    <Modal title="Review 3 uncategorized deposits" onClose={onClose} wide>
      <p className="small muted" style={{ margin: 0 }}>
        Only revenue counts toward receipts. We’ve suggested a type from the sender and amount — change anything that’s wrong.
      </p>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Date</th><th>From</th><th style={{ textAlign: "right" }}>Amount</th><th>Type</th></tr></thead>
          <tbody>
            {FLAGGED_DEPOSITS.map((d) => (
              <tr key={d.id}>
                <td style={{ whiteSpace: "nowrap" }}>{d.date}</td>
                <td className="first">{d.from}</td>
                <td style={{ textAlign: "right" }}>{fmtMoney(d.amount)}</td>
                <td>
                  <select className="select" style={{ minWidth: 230 }} aria-label={`Type for ${d.from}`} value={types[d.id]} onChange={(e) => setTypes((t) => ({ ...t, [d.id]: e.target.value }))}>
                    {DEPOSIT_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel small">
        {revenue > 0
          ? `${fmtMoney(revenue)} marked as revenue. In the full product this would raise average receipts; this demo keeps the sample company’s numbers fixed.`
          : "None of these count as revenue, so average receipts stay at " + fmtMoney(COMPANY.monthlyReceipts) + "/mo."}
      </div>
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={() => { set((s) => { s.depositsReviewed = true; }); toast("3 deposits categorized"); onClose(); }}>Save categories</button>
      </div>
    </Modal>
  );
}

const TARGET_MONTHS =["Month 1", "Month 2", "Month 3", "Month 4", "Month 6", "Month 9", "Month 12"];
const TARGET_COLUMNS = "minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)";

function TargetRow({ goalLabel, name, onName, onRemove, value, onValue, by, onBy, saved, onSaved, help, suggested }) {
  return (
    <div className="stack" style={{ gap: 6, padding: "12px 0" }}>
      <div className="grid-4" style={{ gridTemplateColumns: TARGET_COLUMNS, alignItems: "center" }}>
        {onName ? (
          <input className="input" value={name} placeholder="What are you saving for?" aria-label="Goal name" onChange={(e) => onName(e.target.value)} />
        ) : (
          <span className="strong">{name}</span>
        )}
        <MoneyInput value={value} onChange={onValue} ariaLabel={`${name} target`} />
        {onBy ? (
          <select className="select" value={by} onChange={(e) => onBy(e.target.value)} aria-label={`${name} by when`}>
            {TARGET_MONTHS.map((m) => <option key={m}>{m}</option>)}
          </select>
        ) : (
          <span className="small muted">Always</span>
        )}
        {onSaved ? (
          <MoneyInput value={saved} onChange={onSaved} ariaLabel={`${name} already set aside`} />
        ) : suggested ? (
          <span className="tag tag-goal" style={{ justifySelf: "start" }}>Suggested</span>
        ) : (
          <span />
        )}
      </div>
      <div className="row-between">
        <span className="help">{goalLabel ? `For “${goalLabel}.” ` : ""}{help}</span>
        {onRemove && <button className="btn btn-quiet btn-sm" onClick={onRemove}>Remove</button>}
      </div>
    </div>
  );
}

function GoalsScreen() {
  const { state, set, go, toast } = useStore();
  const g = state.goals;
  const manage = state.manage;
  const burn = COMPANY.monthlyOutflows - COMPANY.monthlyReceipts;
  const pickedCount = Object.values(g.selected).filter(Boolean).length;

  const finish = () => {
    go("home");
    toast(manage ? "Goals saved" : "Setup complete — here’s your Home");
  };

  return (
    <>
      {manage ? <TopBar /> : <><TopBar setup /><SetupBar step={1} /></>}
      <main className="page page-narrow">
        <div className="row setup-intro">
          <div><h1 className="h1">What is your business working toward?</h1>
          <p className="lede">
            {manage
              ? "Change your goals anytime. We track them on Home and rank recommendations around them."
              : "Now that we can see your cash, tell us what you’re working toward. We’ve suggested amounts from your real numbers — edit anything."}
          </p></div><Illustration subject="planning" className="spot-art" />
        </div>

        <section className="card pad stack" style={{ gap: 14 }} aria-label="Company">
          <div className="field">
            <span className="field-label">Company stage</span>
            <div className="row wrap" style={{ gap: 6 }}>
              {["Pre-seed", "Seed", "Series A", "Series B+", "Bootstrapped"].map((s) => (
                <button key={s} className="chip" aria-pressed={g.stage === s} onClick={() => set((st) => { st.goals.stage = s; })}>{s}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="field-label">Team size</span>
            <div className="row wrap" style={{ gap: 6 }}>
              {["1–10", "11–50", "51–100", "100+"].map((s) => (
                <button key={s} className="chip" aria-pressed={g.team === s} onClick={() => set((st) => { st.goals.team = s; })}>{s}</button>
              ))}
            </div>
          </div>
        </section>

        <section className="card pad stack" style={{ gap: 14 }} aria-label="Goals">
          <div className="row-between">
            <h2 className="h2">Your goals for the next 12 months</h2>
            <span className="small muted">Pick all that apply · {pickedCount} selected</span>
          </div>
          <div className="grid-2" style={{ gap: 10 }}>
            {GOAL_OPTIONS.map((o) => (
              <button key={o.id} className="check" aria-pressed={!!g.selected[o.id]} onClick={() => set((st) => { st.goals.selected[o.id] = !st.goals.selected[o.id]; })}>
                <span className="check-box" aria-hidden="true">{g.selected[o.id] ? "✓" : ""}</span>
                <span className="stack" style={{ gap: 2 }}>
                  <span className="strong">{o.label}</span>
                  <span className="small muted">{o.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="card pad stack" style={{ gap: 4 }} aria-label="Money set aside">
          <h2 className="h2">What are you setting money aside for?</h2>
          <p className="small muted" style={{ margin: "2px 0 8px" }}>One target for each goal you picked above. We track them on Home. Amounts are earmarked from your cash — nothing moves.</p>
          <div className="grid-4 eyebrow" style={{ gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)", paddingBottom: 6, borderBottom: "1px solid var(--rule)" }}>
            <span>Goal</span><span>Target</span><span>By when</span><span>Already set aside</span>
          </div>
          <div className="divider-list">
            {g.selected.reserve && (
              <TargetRow goalLabel="Build a cash reserve" name="Cash reserve floor" value={g.reserve}
                onValue={(v) => set((st) => { st.goals.reserve = v ?? 0; })} suggested
                help={`We suggest ${fmtK(burn * 3)}–${fmtK(burn * 4)}: 3–4 months of your ${fmtK(burn)}/mo net burn.`} />
            )}
            {g.selected.expand && (
              <TargetRow goalLabel="Expand to a new market" name="NYC team activities + equipment" value={g.nyc.target}
                onValue={(v) => set((st) => { st.goals.nyc.target = v ?? 0; })}
                by={g.nyc.by} onBy={(v) => set((st) => { st.goals.nyc.by = v; })}
                saved={g.nyc.saved} onSaved={(v) => set((st) => { st.goals.nyc.saved = v ?? 0; })}
                help="Your current plan — we’ll test it when you model NYC." />
            )}
            {g.selected.hire && (
              <TargetRow goalLabel="Hire key roles" name="Hiring fund · 2 engineers" value={g.hiring.target}
                onValue={(v) => set((st) => { st.goals.hiring.target = v ?? 0; })}
                by={g.hiring.by} onBy={(v) => set((st) => { st.goals.hiring.by = v; })}
                saved={g.hiring.saved} onSaved={(v) => set((st) => { st.goals.hiring.saved = v ?? 0; })}
                help="About 3 months of loaded salary for 2 engineers." />
            )}
            {(g.custom || []).map((c, idx) => (
              <TargetRow key={c.id} name={c.name}
                onName={(v) => set((st) => { st.goals.custom[idx].name = v; })}
                onRemove={() => set((st) => { st.goals.custom.splice(idx, 1); })}
                value={c.target} onValue={(v) => set((st) => { st.goals.custom[idx].target = v ?? 0; })}
                by={c.by} onBy={(v) => set((st) => { st.goals.custom[idx].by = v; })}
                saved={c.saved} onSaved={(v) => set((st) => { st.goals.custom[idx].saved = v ?? 0; })}
                help="Your own goal. We track it on Home like the others." />
            ))}
            {!g.selected.reserve && !g.selected.expand && !g.selected.hire && !(g.custom || []).length && (
              <p className="small muted" style={{ padding: "12px 0", margin: 0 }}>Pick “Build a cash reserve”, “Expand to a new market” or “Hire key roles” to add a savings target, or add your own below.</p>
            )}
          </div>
          <button
            className="btn btn-secondary"
            style={{ borderStyle: "dashed", marginTop: 8 }}
            onClick={() => set((st) => { st.goals.custom = [...(st.goals.custom || []), { id: "g" + Date.now(), name: "", target: 20000, by: "Month 6", saved: 0 }]; })}
          >
            + Add a goal <span className="muted" style={{ fontWeight: 400 }}>— taxes, equipment, a buffer for a slow quarter…</span>
          </button>
        </section>

        {g.selected.runway && (
          <section className="panel row-between wrap" aria-label="Runway target">
            <div className="stack" style={{ gap: 2 }}>
              <span className="strong">Runway target before your next raise</span>
              <span className="small muted">For “Extend runway.” You have {fmtMonths(COMPANY.openingCash / burn)} today. Common guidance is 18–24 months when you start raising.</span>
            </div>
            <select className="select" style={{ width: 150 }} value={g.runwayTarget} onChange={(e) => set((st) => { st.goals.runwayTarget = Number(e.target.value); })} aria-label="Runway target">
              {[12, 15, 18, 24].map((m) => <option key={m} value={m}>{m} months</option>)}
            </select>
          </section>
        )}

        <div className="footer-bar">
          <button className="btn btn-ghost" onClick={() => go("connect", { manage })}>{manage ? "← Manage data" : "← Back to connect data"}</button>
          <div className="row">
            {!manage && <button className="btn btn-quiet" onClick={finish}>Skip for now</button>}
            <button className="btn btn-primary btn-lg" onClick={finish}>{manage ? "Save goals" : "Finish setup → Go to Home"}</button>
          </div>
        </div>
      </main>
    </>
  );
}
