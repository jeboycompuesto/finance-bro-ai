// 05 Validate — upload + coverage → 06 Findings + approval

function ValidateCrumbs() {
  const { go } = useStore();
  return (
    <div className="crumbs">
      <span><button onClick={() => go("home")}>Home</button> / <button onClick={() => go("analyses")}>Analyses</button> / Validate a model</span>
    </div>
  );
}

function ValidateScreen() {
  const { state, set, go, toast } = useStore();
  const v = state.validation;
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const startReview = (name) => {
    setError(null);
    set((s) => { s.validation = { ...INITIAL_STATE.validation, stage: "parsing", fileName: name, question: s.validation.question }; });
    setTimeout(() => set((s) => { if (s.validation.stage === "parsing") s.validation.stage = "ready"; }), 1800);
  };
  const onFile = (file) => {
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setError(`We can’t read “${file.name}”. Export your model as .xlsx or .csv and upload that copy.`);
      return;
    }
    toast(`Reviewing a copy of ${file.name}. This demo shows the sample model’s findings.`);
    startReview(file.name);
  };

  return (
    <>
      <TopBar />
      <main className="page">
        <ValidateCrumbs />
        <div>
          <h1 className="h1">Bring the model you already have</h1>
          <p className="lede">We review a copy and flag issues with location, reason and impact. Nothing changes without your approval.</p>
        </div>

        <div className="grid-main rail-wide">
          <div className="stack">
            <div
              className={"dropzone" + (drag ? " drag" : "")}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files[0]); }}
            >
              <span className="logo" style={{ width: 44, height: 52, fontSize: 12 }} aria-hidden="true">XLSX</span>
              <span className="h3">Drop an Excel model (.xlsx) or a CSV</span>
              <span className="small muted">We work from a copy — your original file is never changed.</span>
              <div className="row wrap" style={{ justifyContent: "center" }}>
                <button className="btn btn-secondary" onClick={() => fileRef.current.click()}>Choose a file</button>
                <button className="btn btn-primary" onClick={() => startReview(SAMPLE_MODEL.fileName)}>Use the sample model</button>
              </div>
              <input ref={fileRef} type="file" hidden accept=".xlsx,.xls,.csv" onChange={(e) => onFile(e.target.files[0])} />
            </div>
            {error && (
              <div className="banner banner-crit" role="alert">
                <span className="small">{error}</span>
                <button className="btn btn-secondary btn-sm" onClick={() => startReview(SAMPLE_MODEL.fileName)}>Use the sample instead</button>
              </div>
            )}
            {v.fileName && (
              <div className="card pad-sm row-between wrap">
                <span className="row"><span className="logo" aria-hidden="true">X</span><span className="strong">{v.fileName}</span><span className="small muted">{SAMPLE_MODEL.size} · {SAMPLE_MODEL.sheets.length} sheets</span></span>
                <span className="tag tag-good">Copy · original preserved</span>
              </div>
            )}
            <section className="card pad stack" style={{ gap: 8 }} aria-label="Decision question">
              <label className="field-label" htmlFor="v-question">What is this model trying to decide?</label>
              <input id="v-question" className="input" value={v.question} onChange={(e) => set((s) => { s.validation.question = e.target.value; })} />
              <span className="help">Knowing the decision lets us check the numbers that matter most.</span>
            </section>
            <section className="card pad stack" style={{ gap: 8 }} aria-label="Check the model against">
              <span className="field-label">Check the model against</span>
              <span className="small">✓ Your connected accounts: Rho, Plaid, QuickBooks (last 18 months)</span>
              <span className="small">✓ Internal consistency: formulas, totals, timing</span>
            </section>
          </div>

          <aside className="stack">
            {v.stage === "empty" && (
              <section className="card pad stack" style={{ gap: 8 }}>
                <h2 className="h2">What we’ll check</h2>
                <ul className="small muted" style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>
                  <li>Broken or inconsistent formulas and totals</li>
                  <li>Growth assumptions your real data doesn’t support</li>
                  <li>Cash-flow gaps and a missing downside case</li>
                  <li>Costs and drivers the model leaves out</li>
                </ul>
                <span className="small muted">We always list what we couldn’t check.</span>
              </section>
            )}
            {v.stage === "parsing" && (
              <section className="card pad stack" style={{ gap: 10 }} aria-live="polite">
                <h2 className="h2">Reviewing {v.fileName}…</h2>
                <div className="progress good"><span style={{ width: "70%", transition: "width 1.6s" }} /></div>
                <span className="row small muted"><span className="spinner" /> Reading 3 sheets and 415 formulas, comparing to your bank data</span>
              </section>
            )}
            {v.stage === "ready" && (
              <>
                <section className="card pad stack" style={{ gap: 4 }} aria-label="Review coverage">
                  <div className="row-between"><h2 className="h2">What we could check</h2><span className="tag tag-good">Review complete</span></div>
                  <div className="divider-list">
                    <div className="kv small"><span className="k">Sheets parsed</span><span className="v">{SAMPLE_MODEL.sheets.join(" · ")}</span></div>
                    <div className="kv small"><span className="k">Formulas checked</span><span className="v">{SAMPLE_MODEL.checked} of {SAMPLE_MODEL.formulas}</span></div>
                    <div className="kv small"><span className="k">Months compared to bank data</span><span className="v">18</span></div>
                    <div className="kv small"><span className="k">Not checked</span><span className="v">{SAMPLE_MODEL.unchecked.join(" · ")}</span></div>
                  </div>
                  <div className="panel stack" style={{ gap: 8, marginTop: 8, border: "1px dashed var(--rule-strong)", background: "transparent" }}>
                    <span className="small">We couldn’t read {SAMPLE_MODEL.unchecked.join(" and ")}. “No findings” there doesn’t mean “correct” — they stay listed in the review.</span>
                    <div className="row wrap" style={{ gap: 6 }}>
                      <button className="btn btn-quiet btn-sm" style={{ paddingLeft: 0 }} onClick={() => toast("Tip: save a copy as .xlsx without macros, then upload it again.")}>Upload a copy without macros</button>
                    </div>
                  </div>
                </section>
                <section className="card pad card-emph stack" style={{ gap: 12 }} aria-label="Finance-health review">
                  <span className="eyebrow">Finance-health review</span>
                  <h2 className="h2">Your model overstates Month-6 cash by {fmtK(state.analysis.teamCost * Math.max(0, PROTECT_THROUGH - state.analysis.teamStart + 1))}.</h2>
                  <div className="grid-2" style={{ gap: 10 }}>
                    {[["1", "Formula error", "High"], ["1", "Unrealistic growth", "Medium"], ["1", "Cash-flow gap", "Medium"], ["1", "Missing cost driver", "Low"]].map(([n, l, sev]) => (
                      <div key={l} className="panel stack" style={{ gap: 2, padding: 12 }}>
                        <span className="big-number" style={{ fontSize: 22 }}>{n}</span>
                        <span className="row small" style={{ gap: 6 }}>{l} <span className={"tag sev-" + sev}>{sev}</span></span>
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-primary btn-lg" onClick={() => go("findings")}>Continue with partial review — 4 findings →</button>
                </section>
              </>
            )}
          </aside>
        </div>
        <div className="footer-bar">
          <button className="btn btn-ghost" onClick={() => go("home")}>← Back to Home</button>
          {v.stage !== "empty" && <button className="btn btn-quiet" onClick={() => set((s) => { s.validation = { ...INITIAL_STATE.validation }; })}>Cancel review</button>}
        </div>
      </main>
    </>
  );
}

function FindingsScreen() {
  const { state, set, go, toast, model } = useStore();
  const v = state.validation;
  const findings = validationFindings(state, model);
  const [whyOpen, setWhyOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (v.stage !== "ready") set((s) => { s.validation.stage = "ready"; s.validation.fileName = s.validation.fileName || SAMPLE_MODEL.fileName; });
  }, [v.stage, set]);

  const current = findings.find((f) => f.id === v.selected) || findings[0];
  const idx = findings.indexOf(current);
  const decided = Object.keys(v.decisions).length;
  const approved = Object.values(v.decisions).filter((d) => d === "approved").length;
  const rejected = decided - approved;
  const decision = v.decisions[current.id];

  const select = (id) => { setWhyOpen(false); set((s) => { s.validation.selected = id; }); };
  const decide = (kind) => {
    set((s) => {
      s.validation.decisions[current.id] = kind;
      const nextOpen = findings.find((f, i) => i > idx && !s.validation.decisions[f.id]) || findings.find((f) => !s.validation.decisions[f.id]);
      if (nextOpen) s.validation.selected = nextOpen.id;
    });
    toast(kind === "approved" ? `Approved: ${current.short}` : `Rejected — original kept: ${current.short}`, {
      label: "Undo", run: () => set((s) => { delete s.validation.decisions[current.id]; s.validation.selected = current.id; }),
    });
  };
  const saveVersion = () => {
    set((s) => { s.validation.savedVersion = { approved, rejected }; });
    setSaved(true);
  };

  return (
    <>
      <TopBar />
      <main className="page">
        <ValidateCrumbs />
        <div className="page-head">
          <div>
            <h1 className="h1">Review findings</h1>
            <p className="lede">{v.fileName || SAMPLE_MODEL.fileName} · “{v.question}”</p>
          </div>
          <div className="row">
            <span className="tag tag-good">Original preserved</span>
            <span className={"tag " + (decided === findings.length ? "tag-good" : "")}>{decided} of {findings.length} resolved</span>
          </div>
        </div>

        <div className="grid-main rail-left">
          <aside className="stack" style={{ gap: 10 }} aria-label="Findings">
            {findings.map((f) => {
              const d = v.decisions[f.id];
              return (
                <button key={f.id} className="finding" aria-current={f.id === current.id} onClick={() => select(f.id)}>
                  <span className="row-between">
                    <span className={"tag sev-" + f.severity}>{f.type} · {f.severity}</span>
                    {d && <span className={"tag " + (d === "approved" ? "tag-good" : "")}>{d === "approved" ? "Approved" : "Rejected"}</span>}
                  </span>
                  <span className="strong">{f.short}</span>
                  <span className="small muted" style={{ fontFamily: "var(--font-mono)" }}>{f.location}</span>
                </button>
              );
            })}
            <div className="panel stack" style={{ gap: 4, border: "1px dashed var(--rule-strong)", background: "transparent" }}>
              <span className="small strong">Not checked: {SAMPLE_MODEL.unchecked.join(", ")}</span>
              <span className="small muted">Review these yourself before sharing the model.</span>
            </div>
          </aside>

          <section className="card pad stack" style={{ gap: 18 }} aria-label="Finding detail">
            <div className="row-between wrap">
              <span className={"tag sev-" + current.severity}>{current.type} · {current.severity}</span>
              <div className="row" style={{ gap: 4 }}>
                <button className="btn btn-quiet btn-sm" disabled={idx === 0} onClick={() => select(findings[idx - 1].id)}>‹ Prev</button>
                <span className="small muted">Finding {idx + 1} of {findings.length}</span>
                <button className="btn btn-quiet btn-sm" disabled={idx === findings.length - 1} onClick={() => select(findings[idx + 1].id)}>Next ›</button>
              </div>
            </div>
            <h2 className="h1" style={{ fontSize: 26 }}>{current.title}</h2>
            <div className="row wrap"><span className="small muted">Location</span><span className="tag" style={{ textTransform: "none" }}>{current.location}</span></div>

            <div className="panel stack" style={{ gap: 10 }}>
              <span className="eyebrow">What we found</span>
              <span>{current.found}</span>
              {current.diff && (
                <div className="row wrap">
                  <div className="stack" style={{ gap: 4 }}><span className="eyebrow">Current</span><span className="code">{current.diff.before}</span></div>
                  <span className="h3" aria-hidden="true">→</span>
                  <div className="stack" style={{ gap: 4 }}><span className="eyebrow">Suggested</span><span className="code after">{current.diff.after}</span></div>
                </div>
              )}
            </div>

            <div className="stack" style={{ gap: 4 }}>
              <span className="eyebrow">Why it matters</span>
              <span>{current.why}</span>
              {whyOpen && <span className="small muted">{current.detail}</span>}
            </div>

            <div className="stack" style={{ gap: 8 }}>
              <span className="eyebrow">Impact preview</span>
              <div className="grid-2">
                {current.impact.map((im) => (
                  <div key={im.label} className="card pad-sm stack" style={{ gap: 6 }}>
                    <span className="small muted">{im.label}</span>
                    <div className="row" style={{ alignItems: "flex-end" }}>
                      <div className="stack" style={{ gap: 0 }}><span className="small muted">Original</span><span className="h3 muted num">{im.before}</span></div>
                      <span aria-hidden="true">→</span>
                      <div className="stack" style={{ gap: 0 }}><span className="small muted">With change</span><span className="h2 num">{im.after}</span></div>
                    </div>
                  </div>
                ))}
              </div>
              {current.link && <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start", paddingLeft: 0 }} onClick={() => go(current.link.go)}>{current.link.label} →</button>}
            </div>

            <div className="row-between wrap" style={{ borderTop: "1px solid var(--rule)", paddingTop: 16 }}>
              <span className="small muted" style={{ maxWidth: 340 }}>
                {decision
                  ? decision === "approved" ? "Approved. It goes into the reviewed version when you save." : "Rejected. The original stays as it is; the finding stays listed in the summary."
                  : "Approving adds this change to a reviewed version. The original file stays untouched."}
              </span>
              <div className="row">
                <button className="btn btn-quiet" onClick={() => setWhyOpen((o) => !o)}>{whyOpen ? "Hide detail" : "Ask why"}</button>
                {decision ? (
                  <button className="btn btn-secondary" onClick={() => set((s) => { delete s.validation.decisions[current.id]; })}>Change decision</button>
                ) : (
                  <>
                    <button className="btn btn-secondary" onClick={() => decide("rejected")}>Reject</button>
                    <button className="btn btn-primary" onClick={() => decide("approved")}>{current.approveLabel}</button>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="footer-bar">
          <button className="btn btn-ghost" onClick={() => go("validate")}>← Back to coverage</button>
          <div className="row">
            <span className="small muted">{decided < findings.length ? `${findings.length - decided} still open — you can save anyway` : "All findings resolved"}</span>
            <button className="btn btn-primary btn-lg" disabled={decided === 0} onClick={saveVersion}>Save reviewed version</button>
          </div>
        </div>
      </main>

      {saved && (
        <Modal title="Reviewed version saved" onClose={() => setSaved(false)}>
          <div className="panel stack" style={{ gap: 6 }}>
            <span className="strong">{(v.fileName || SAMPLE_MODEL.fileName).replace(/\.(xlsx|xls|csv)$/i, "")} (reviewed v2).xlsx</span>
            <span className="small muted">Saved to your workspace. The original file is unchanged.</span>
          </div>
          <div className="divider-list">
            {findings.map((f) => (
              <div key={f.id} className="kv small">
                <span className="k">{f.short}</span>
                <span className={"tag " + (v.decisions[f.id] === "approved" ? "tag-good" : v.decisions[f.id] === "rejected" ? "" : "tag-warn")}>
                  {v.decisions[f.id] === "approved" ? "Applied" : v.decisions[f.id] === "rejected" ? "Kept original" : "Still open"}
                </span>
              </div>
            ))}
            <div className="kv small"><span className="k">{SAMPLE_MODEL.unchecked.join(", ")}</span><span className="tag tag-warn">Not checked</span></div>
          </div>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" onClick={() => setSaved(false)}>Keep reviewing</button>
            <button className="btn btn-primary" onClick={() => { setSaved(false); go("analyses"); }}>Done</button>
          </div>
        </Modal>
      )}
    </>
  );
}
