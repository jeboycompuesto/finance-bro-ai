// Shared UI primitives and the app store hook.
const { useState, useEffect, useMemo, useRef, useCallback, useContext, createContext, useReducer } = React;

const StoreContext = createContext(null);
const useStore = () => useContext(StoreContext);

// Uka's F mark: a blue stroke over a lime stroke (Logo / Mark · Color in Figma).
function BrandMark({ className = "" }) {
  return (
    <svg className={"brand-mark " + className} viewBox="0 0 264 272" aria-hidden="true">
      <path d="M100 0H214A50 50 0 0 1 214 100H118C58 100 14 110 4 134C2 139 0 138 0 132V100C0 45 45 0 100 0Z" style={{ fill: "var(--blue)" }} />
      <path d="M96 122H158A42 42 0 0 1 158 206H120C106 206 99 213 99 223A49.5 49.5 0 0 1 0 223V196C0 151 42 122 96 122Z" style={{ fill: "var(--lime)" }} />
    </svg>
  );
}

function Wordmark() {
  return <span className="wordmark">Finance<span>Bro</span></span>;
}

function TopBar({ setup = false }) {
  const { state, go } = useStore();
  const r = state.route;
  const current = (names) => (names.includes(r) && !state.manage ? "page" : undefined);
  return (
    <header className="topbar">
      <button className="brand" onClick={() => (setup ? null : go("home"))} aria-label="Finance Bro AI home">
        <BrandMark /> <Wordmark /> <span className="brand-tag">AI</span>
      </button>
      {setup ? (
        <div className="row small muted">
          <span className="hide-sm">Setup saves as you go</span>
          <button className="btn btn-quiet" onClick={() => go("home")}>Finish later</button>
        </div>
      ) : (
        <nav className="nav" aria-label="Main">
          <button aria-current={current(["home", "recs"])} onClick={() => go("home")}>Home</button>
          <button aria-current={current(["analyses", "questions", "scenarios", "recommendation", "validate", "findings"])} onClick={() => go("analyses")}>Analyses</button>
          <button aria-current={state.manage && r === "connect" ? "page" : undefined} onClick={() => go("connect", { manage: true })}>Data</button>
          {state.syncIssue === "failed" ? (
            <button className="sync sync-bad hide-sm" style={{ marginLeft: 12 }} onClick={() => go("home")}>Rho sync failed</button>
          ) : (
            <span className="sync hide-sm" style={{ marginLeft: 12 }}>{state.syncIssue === "accepted" ? "Using data up to 9:02 AM" : "Synced 2 min ago"}</span>
          )}
          <span className="avatar" style={{ marginLeft: 10 }} aria-label="Signed in as Maya">MR</span>
        </nav>
      )}
    </header>
  );
}

function SetupBar({ step }) {
  const steps = ["Connect your data", "Set your goals"];
  return (
    <div className="setupbar">
      <div className="setup-steps">
        <span className="eyebrow">Set up your workspace</span>
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <span className={"step " + (i < step ? "done" : i === step ? "current" : "")}>
              {i < step ? "✓" : i + 1}&nbsp; {s}
            </span>
            <span className="line" />
          </React.Fragment>
        ))}
        <span className="step">→&nbsp; Home</span>
      </div>
      <span className="small muted">Step {step + 1} of 2 · {step === 0 ? "about 5 min" : "almost done"}</span>
    </div>
  );
}

const ANALYSIS_STEPS = ["Question", "Data", "Assumptions", "Scenarios", "Recommendation"];
function Stepper({ current }) {
  return (
    <ol className="stepper" aria-label="Analysis progress" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {ANALYSIS_STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <li className={"step " + (i < current ? "done" : i === current ? "current" : "")} aria-current={i === current ? "step" : undefined}>
            {i < current ? "✓" : i + 1}&nbsp; {s}
          </li>
          {i < ANALYSIS_STEPS.length - 1 && <li className="step-line" aria-hidden="true" />}
        </React.Fragment>
      ))}
    </ol>
  );
}

function Prov({ kind }) {
  if (kind === "actual") return <span className="tag tag-actual" title="From your connected accounts">Actual</span>;
  if (kind === "goal") return <span className="tag tag-goal" title="Set in your goals">From your goals</span>;
  return <span className="tag tag-assumption" title="Entered by you — a belief about the future">Assumption</span>;
}

function ProvenanceLegend() {
  return (
    <div className="provenance-legend">
      <span className="row" style={{ gap: 6 }}><Prov kind="actual" /> from your accounts</span>
      <span className="row" style={{ gap: 6 }}><Prov kind="assumption" /> your estimate</span>
    </div>
  );
}

function MoneyInput({ value, onChange, id, invalid, ariaLabel }) {
  const [text, setText] = useState(value == null ? "" : Math.round(value).toLocaleString("en-US"));
  useEffect(() => {
    const parsed = Number(text.replace(/[^0-9.]/g, ""));
    if (value !== (text === "" ? null : parsed)) setText(value == null ? "" : Math.round(value).toLocaleString("en-US"));
    // eslint-disable-next-line
  }, [value]);
  return (
    <div className="input-money">
      <input
        id={id}
        aria-label={ariaLabel}
        className={"input" + (invalid ? " input-error" : "")}
        inputMode="numeric"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const digits = e.target.value.replace(/[^0-9]/g, "");
          onChange(digits === "" ? null : Number(digits));
        }}
        onBlur={() => setText(value == null ? "" : Math.round(value).toLocaleString("en-US"))}
      />
    </div>
  );
}

function Seg({ options, value, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={"modal" + (wide ? " modal-wide" : "")} role="dialog" aria-modal="true" aria-label={title}>
        <div className="row-between">
          <h2 className="h2">{title}</h2>
          <button className="btn btn-quiet" onClick={onClose} aria-label="Close">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Toasts({ toasts, dismiss }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div className="toast" key={t.id}>
          <span>{t.text}</span>
          {t.action && (
            <button onClick={() => { t.action.run(); dismiss(t.id); }}>{t.action.label}</button>
          )}
        </div>
      ))}
    </div>
  );
}

function QuestionBanner({ sub }) {
  const { go } = useStore();
  return (
    <div className="panel row-between wrap" style={{ padding: "18px 22px" }}>
      <div className="stack" style={{ gap: 4 }}>
        <span className="eyebrow">Your question</span>
        <h1 className="h2" style={{ fontSize: 23 }}>{NYC_QUESTION}</h1>
        {sub && <span className="small muted">{sub}</span>}
      </div>
      <div className="row">
        <span className="tag">Horizon · 12 months</span>
        <button className="btn btn-ghost btn-sm" onClick={() => go("questions")}>Edit</button>
      </div>
    </div>
  );
}
