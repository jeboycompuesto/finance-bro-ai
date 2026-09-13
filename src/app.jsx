// App shell: state, routing, persistence, toasts and the presenter's demo menu.

const STORAGE_KEY = "finance-bro-demo-v2";
const ROUTES = {
  loading: { label: "00 · Loading", el: LoadingScreen },
  connect: { label: "01 · Connect your data", el: ConnectScreen },
  goals: { label: "01b · Set your goals", el: GoalsScreen },
  home: { label: "02 · Home", el: HomeScreen },
  recs: { label: "02b · Recommendations", el: RecommendationsScreen },
  analyses: { label: "Analyses list", el: AnalysesScreen },
  questions: { label: "03 · Guided questions", el: QuestionsScreen },
  scenarios: { label: "04a · Scenarios", el: ScenariosScreen },
  recommendation: { label: "04b · Recommendation", el: RecommendationScreen },
  validate: { label: "05 · Validate — upload + coverage", el: ValidateScreen },
  findings: { label: "06 · Validate — findings", el: FindingsScreen },
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(INITIAL_STATE);
    const saved = JSON.parse(raw);
    const base = structuredClone(INITIAL_STATE);
    return {
      ...base, ...saved,
      goals: { ...base.goals, ...saved.goals },
      analysis: { ...base.analysis, ...saved.analysis },
      validation: { ...base.validation, ...saved.validation, stage: saved.validation?.stage === "parsing" ? "ready" : saved.validation?.stage ?? "empty" },
    };
  } catch {
    return structuredClone(INITIAL_STATE);
  }
}

function routeFromHash() {
  const [name, query] = location.hash.replace(/^#\/?/, "").split("?");
  return ROUTES[name] ? { route: name, manage: query === "manage" } : null;
}

function DemoMenu({ go, reset, set, state, toast }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <div className="demo-menu">
      {open && (
        <div className="menu" role="menu">
          {Object.entries(ROUTES).map(([id, r]) => (
            <button key={id} role="menuitem" onClick={() => { close(); go(id); }}>{r.label}</button>
          ))}
          <span className="eyebrow" style={{ padding: "10px 10px 4px", borderTop: "1px solid var(--rule)", marginTop: 4 }}>Recovery states</span>
          <button role="menuitem" onClick={() => {
            close();
            set((s) => { s.syncIssue = s.syncIssue === "failed" ? null : "failed"; ["rho", "plaid", "quickbooks"].forEach((id) => (s.sources[id] = s.sources[id] || "connected")); });
            if (state.syncIssue !== "failed") go("home");
          }}>{state.syncIssue === "failed" ? "Clear Rho sync failure" : "Simulate Rho sync failure"}</button>
          <button role="menuitem" onClick={() => {
            close();
            set((s) => {
              s.analysis.status = "done";
              if (!s.analysis.computedWith) s.analysis.computedWith = answerInputs(s);
              s.analysis.setup = s.analysis.computedWith.setup === 45000 ? 60000 : 45000;
              s.analysis.testSetup = s.analysis.setup;
            });
            go("recommendation");
            toast("Changed NYC setup after the answer — see the out-of-date state");
          }}>Show out-of-date recommendation</button>
          <span className="small muted" style={{ padding: "0 10px 6px" }}>Connecting Brex fails on the first try.</span>
          <button role="menuitem" style={{ borderTop: "1px solid var(--rule)", marginTop: 4, color: "var(--crit)" }} onClick={() => { close(); reset(); }}>
            Reset demo
          </button>
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open}>Demo</button>
    </div>
  );
}

function App() {
  const [state, setState] = useState(() => {
    const s = loadState();
    const fromHash = routeFromHash();
    return fromHash ? { ...s, ...fromHash } : s;
  });
  const [toasts, setToasts] = useState([]);

  const set = useCallback((mutate) => {
    setState((prev) => {
      const next = structuredClone(prev);
      mutate(next);
      return next;
    });
  }, []);

  const go = useCallback((route, opts = {}) => {
    setState((prev) => ({ ...prev, route, manage: !!opts.manage }));
    const hash = `#/${route}${opts.manage ? "?manage" : ""}`;
    if (location.hash !== hash) history.pushState(null, "", hash);
    window.scrollTo({ top: 0 });
  }, []);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback((text, action) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-2), { id, text, action }]);
    setTimeout(() => dismiss(id), action ? 6000 : 3500);
  }, [dismiss]);

  const reset = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setState(structuredClone(INITIAL_STATE));
    history.pushState(null, "", "#/loading");
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onPop = () => {
      const r = routeFromHash();
      if (r) setState((prev) => ({ ...prev, ...r }));
    };
    window.addEventListener("popstate", onPop);
    if (!location.hash) history.replaceState(null, "", `#/${state.route}`);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const model = useMemo(() => buildModel(state), [state]);
  const store = { state, set, go, toast, model };
  const Screen = ROUTES[state.route].el;

  return (
    <StoreContext.Provider value={store}>
      <div className="app">
        <Screen key={state.route + (state.manage ? "-m" : "")} />
      </div>
      <Toasts toasts={toasts} dismiss={dismiss} />
      <DemoMenu go={go} reset={reset} set={set} state={state} toast={toast} />
    </StoreContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
