// Calculation engine. Deterministic: the same inputs always give the same numbers.
// The UI never invents figures; it renders what these functions return.
// Written "explanations" are templates filled from these numbers.

const HORIZON = 12; // months shown
const PROTECT_THROUGH = 6; // keep the reserve intact through this month while raising
const RAISE_LEAD_MONTHS = 4; // assumed time from first investor talks to cash in the bank
const PAYROLL_LOAD = 0.2; // employer taxes + benefits suggested for the "missing driver" finding

// ---------- formatting ----------
const fmtMoney = (n) => {
  const sign = n < 0 ? "−" : "";
  return sign + "$" + Math.round(Math.abs(n)).toLocaleString("en-US");
};
const fmtK = (n) => {
  if (Math.round(n) === 0) return "$0";
  const sign = n < 0 ? "−" : "";
  const k = Math.abs(n) / 1000;
  return sign + "$" + (Number.isInteger(k) ? k : k.toFixed(1)) + "k";
};
const fmtMonths = (m) => (m === Infinity ? "24+" : m.toFixed(1)) + " months";
const fmtMonthsShort = (m) => (m === Infinity ? "24+" : m.toFixed(1));
const setupWhen = (month) => (month === 0 ? "before Month 1" : `in Month ${month}`);

// ---------- projection ----------
// Cash at month-end for M0..HORIZON. Runway keeps projecting past the horizon until cash reaches zero.
// `rows` is the month-by-month breakdown shown in "See calculation".
function project({
  opening, receipts, outflows,
  setup = 0, setupMonth = 0,
  extraCost = 0, extraStart = 1,
  newReceipts = 0, newStart = 999, growth = 0,
}) {
  const c0 = opening - (setupMonth === 0 ? setup : 0);
  const cash = [c0];
  const rows = [{ m: 0, start: opening, receipts: 0, newRec: 0, outflows: 0, extra: 0, setup: setupMonth === 0 ? setup : 0, end: c0 }];
  let c = c0;
  let runway = c <= 0 ? 0 : null;
  for (let m = 1; m <= 120; m++) {
    const newRec = m >= newStart ? newReceipts * Math.pow(1 + growth, m - newStart) : 0;
    const extra = m >= extraStart ? extraCost : 0;
    const oneOff = m === setupMonth ? setup : 0;
    const n = receipts + newRec - outflows - extra - oneOff;
    const prev = c;
    c = prev + n;
    if (m <= HORIZON) {
      cash.push(c);
      rows.push({ m, start: prev, receipts, newRec, outflows, extra, setup: oneOff, end: c });
    }
    if (runway === null && c <= 0) runway = m - 1 + (n < 0 ? prev / -n : 0);
    if (runway !== null && m >= HORIZON) break;
  }
  return { cash, rows, runway: runway === null ? Infinity : runway };
}

function firstMonthBelow(cash, floor) {
  for (let m = 1; m < cash.length; m++) if (cash[m] < floor) return m;
  return null;
}

// Inputs that decide the answer. If these change after a recommendation, it is out of date.
const ANSWER_INPUTS = ["setup", "setupMonth", "teamCost", "teamStart", "newReceipts", "receiptsStart", "reserve"];
function answerInputs(state) {
  const a = state.analysis;
  const out = {};
  ANSWER_INPUTS.forEach((k) => (out[k] = k === "reserve" ? a.reserve ?? state.goals.reserve : a[k]));
  return out;
}
function isStale(state) {
  const a = state.analysis;
  if (a.status !== "done" || !a.computedWith) return false;
  const now = answerInputs(state);
  return ANSWER_INPUTS.some((k) => now[k] !== a.computedWith[k]);
}
function withInputs(state, inputs) {
  const { reserve, ...rest } = inputs;
  return { ...state, analysis: { ...state.analysis, ...rest, reserve } };
}

// ---------- the NYC analysis ----------
const BASELINE = () => ({ opening: COMPANY.openingCash, receipts: COMPANY.monthlyReceipts, outflows: COMPANY.monthlyOutflows });

function buildModel(state) {
  const a = state.analysis;
  const reserve = a.reserve ?? state.goals.reserve;
  const netBurnToday = COMPANY.monthlyOutflows - COMPANY.monthlyReceipts;

  const none = project(BASELINE());
  const run = (setup, kind, over = {}) =>
    project({
      ...BASELINE(),
      setup,
      setupMonth: a.setupMonth,
      extraCost: a.teamCost,
      extraStart: a.teamStart,
      newReceipts: kind === "base" ? a.newReceipts : a.newReceipts / 2,
      newStart: kind === "base" ? a.receiptsStart : a.receiptsStart + 1,
      ...over,
    });

  const downsideAtZero = run(0, "downside");
  const rawCap = downsideAtZero.cash[PROTECT_THROUGH] - reserve;
  const cap = Math.max(0, Math.floor(rawCap / 5000) * 5000);
  const planHolds = cap >= a.setup;
  const chosen = planHolds ? a.setup : cap;

  const plan = { base: run(a.setup, "base"), downside: run(a.setup, "downside") };
  const rec = { base: run(chosen, "base"), downside: run(chosen, "downside") };
  const test = { base: run(a.testSetup, "base"), downside: run(a.testSetup, "downside") };
  const custom = a.custom
    ? run(a.custom.setup, "base", { newReceipts: a.custom.newReceipts, newStart: a.custom.receiptsStart })
    : null;

  const breach = firstMonthBelow(rec.downside.cash, reserve);
  const raiseBy = breach ? Math.max(1, breach - RAISE_LEAD_MONTHS) : null;
  const verdict = rawCap <= 0 ? "Not viable yet" : planHolds ? "Viable as planned" : "Viable with conditions";

  const downStart = a.receiptsStart + 1;
  const downReceipts = COMPANY.monthlyReceipts + a.newReceipts / 2;
  const costsWithNyc = COMPANY.monthlyOutflows + a.teamCost;
  const burnBefore = costsWithNyc - COMPANY.monthlyReceipts;
  const burnAfter = costsWithNyc - downReceipts;

  const planM6 = plan.downside.cash[PROTECT_THROUGH];
  const range = a.setupRange;
  const rangeNote = !range
    ? null
    : cap >= range.high
      ? `Your whole ${fmtK(range.low)}–${fmtK(range.high)} range keeps the reserve.`
      : cap >= range.low
        ? `Only the low end of your ${fmtK(range.low)}–${fmtK(range.high)} range is safe: up to ${fmtK(cap)}.`
        : `Even the low end of your ${fmtK(range.low)}–${fmtK(range.high)} range breaks the reserve.`;

  const headline = verdict === "Not viable yet"
    ? `Hold off on NYC — even with no setup cost, the downside breaks your ${fmtK(reserve)} reserve by Month ${PROTECT_THROUGH}.`
    : planHolds
      ? `Your ${fmtK(a.setup)} NYC plan holds — start fundraising conversations by Month ${raiseBy ?? HORIZON}.`
      : `Cap NYC setup at ${fmtK(cap)} — and start fundraising conversations by Month ${raiseBy}.`;

  const what = planM6 < reserve
    ? `At ${fmtK(a.setup)} setup, the downside case drops to ${fmtK(planM6)} by Month ${PROTECT_THROUGH} — ${fmtK(reserve - planM6)} below your ${fmtK(reserve)} reserve.`
    : `At ${fmtK(a.setup)} setup, the downside case still holds ${fmtK(planM6)} at Month ${PROTECT_THROUGH}, above your ${fmtK(reserve)} reserve.`;
  const why = `Setup is paid ${a.setupMonth === 0 ? "upfront" : `in Month ${a.setupMonth}`}, and in the downside NYC cash arrives a month later at half the rate (${fmtK(a.newReceipts / 2)}/mo from Month ${downStart}).`;
  const next = verdict === "Not viable yet"
    ? `Delay NYC or line up funding first. Revisit once receipts grow or costs fall.`
    : `${planHolds ? "Keep" : "Cap"} setup at ${fmtK(chosen)} to hold the reserve through Month ${PROTECT_THROUGH}. Runway still falls from ${fmtMonthsShort(none.runway)} to ~${Math.floor(rec.downside.runway)} months, so line up a raise.`;

  return {
    reserve, netBurnToday, none, plan, rec, test, custom, cap, chosen, planHolds, breach, raiseBy, verdict,
    headline, what, why, next, rangeNote,
    downStart, downReceipts, costsWithNyc, burnBefore, burnAfter,
    noneBreach: firstMonthBelow(none.cash, reserve),
    run,
  };
}

// ---------- goals on Home ----------
const monthNumber = (label) => parseInt(String(label).replace(/\D/g, ""), 10) || 1;

function goalMetrics(state, model) {
  const g = state.goals;
  const done = state.analysis.status === "done";
  const out = [];
  if (g.selected.reserve) {
    const monthsToFloor = (COMPANY.openingCash - g.reserve) / model.netBurnToday;
    out.push({
      id: "reserve", label: "Cash reserve floor", value: `${fmtK(COMPANY.openingCash)} cash · floor ${fmtK(g.reserve)}`,
      pct: 1, marker: g.reserve / COMPANY.openingCash,
      status: done && model.breach ? "At risk later" : "On track",
      tone: done && model.breach ? "warn" : "good",
      note: done && model.breach
        ? `Holds today. With the NYC plan, cash dips below the floor from Month ${model.breach}.`
        : `Holds today · about ${monthsToFloor.toFixed(1)} months until the floor at today’s burn.`,
    });
  }
  const savings = (id, label, target, saved, by, noteLead) => {
    const left = Math.max(0, target - saved);
    const pct = target > 0 ? Math.min(1, saved / target) : 0;
    return {
      id, label, value: `${fmtK(saved)} of ${fmtK(target)}`, pct,
      status: pct >= 1 ? "Funded" : "On track", tone: "good",
      note: pct >= 1 ? "Fully set aside." : `${noteLead || `${Math.round(pct * 100)}% set aside`} · ${fmtK(left / monthNumber(by))}/mo more funds it by ${by}.`,
    };
  };
  if (g.selected.expand) {
    const target = state.nycTargetUpdated ? model.chosen : g.nyc.target;
    out.push(savings("nyc", "NYC team fund", target, g.nyc.saved, g.nyc.by,
      state.nycTargetUpdated ? `Target lowered from ${fmtK(g.nyc.target)} after your NYC analysis` : null));
  }
  if (g.selected.hire) out.push(savings("hiring", "Hiring fund · 2 engineers", g.hiring.target, g.hiring.saved, g.hiring.by));
  (g.custom || []).forEach((c) => out.push(savings(c.id, c.name || "New goal", c.target || 0, c.saved || 0, c.by)));
  if (g.selected.runway) {
    const today = model.none.runway;
    const needBurn = COMPANY.openingCash / g.runwayTarget;
    const cut = Math.max(0, model.netBurnToday - needBurn);
    out.push({
      id: "runway", label: "Runway target", value: `${fmtMonthsShort(today)} of ${g.runwayTarget} months`,
      pct: Math.min(1, today / g.runwayTarget),
      status: today >= g.runwayTarget ? "On track" : "Behind", tone: today >= g.runwayTarget ? "good" : "crit",
      note: today >= g.runwayTarget ? "You already clear your runway target." : `Raise, or cut ~${fmtK(Math.round(cut / 100) * 100)}/mo of burn, to reach ${g.runwayTarget} months.`,
    });
  }
  return out;
}

// ---------- recommendations ----------
function buildRecommendations(state, model) {
  const done = state.analysis.status === "done";
  const r = [];
  if (done) {
    r.push({
      id: "raise", category: "Prepare funding", impact: "High", title: `Start raise talks by Month ${model.raiseBy}`,
      metric: `Runway ${fmtMonthsShort(model.none.runway)} → ~${Math.floor(model.rec.downside.runway)} months`,
      why: `With the NYC plan, cash drops below your ${fmtK(model.reserve)} reserve from Month ${model.breach}. Raises usually take about ${RAISE_LEAD_MONTHS} months, so start before the floor is at risk.`,
      basis: "NYC team analysis", provenance: "assumption", action: "Open NYC analysis", go: "recommendation",
    });
    if (!model.planHolds) {
      r.push({
        id: "cap", category: "Protect reserve", impact: "High", title: `Cap NYC setup at ${fmtK(model.cap)}, release the rest in stages`,
        metric: `Keeps your ${fmtK(model.reserve)} floor through Month ${PROTECT_THROUGH}`,
        why: `At ${fmtK(state.analysis.setup)} setup, the downside falls to ${fmtK(model.plan.downside.cash[PROTECT_THROUGH])} by Month ${PROTECT_THROUGH}. Release more only once NYC receipts reach ${fmtK(state.analysis.newReceipts)}/mo.`,
        basis: "NYC team analysis · downside", provenance: "assumption", action: "See scenarios", go: "scenarios",
      });
    }
  } else {
    r.push({
      id: "model", category: "Protect reserve", impact: "High", title: "Test the NYC plan before you commit",
      metric: `Floor reached in Month ${model.noneBreach} at today’s burn`,
      why: `You plan ${fmtK(state.goals.nyc.target)} for NYC plus ongoing team costs. Without NYC, cash already reaches your ${fmtK(model.reserve)} floor in Month ${model.noneBreach}. Model it to see how much sooner.`,
      basis: "Bank balances + your goals", provenance: "actual", action: "Model this", go: "questions",
    });
    r.push({
      id: "raise", category: "Prepare funding", impact: "Medium", title: `Plan raise talks by Month ${Math.max(1, model.noneBreach - RAISE_LEAD_MONTHS)}`,
      metric: `Runway ${fmtMonthsShort(model.none.runway)} months today`,
      why: `At a ${fmtK(model.netBurnToday)}/mo net burn you reach the reserve floor in Month ${model.noneBreach}. Raises usually take about ${RAISE_LEAD_MONTHS} months.`,
      basis: "Bank transactions · last 6 months", provenance: "actual", action: "Model raise timing", go: "questions",
    });
  }
  r.push({
    id: "tools", category: "Save money", impact: "Medium", title: `Review ${COMPANY.overlappingTools.count} overlapping software tools`,
    metric: `~${fmtK(COMPANY.overlappingTools.monthlySaving)} / month`,
    why: `Software is ${fmtK(COMPANY.costDrivers[2].amount)}/mo. Three charges look like tools in the same category. We see charges, not usage — confirm before cancelling.`,
    basis: "Bank transactions · last 6 months", provenance: "actual", action: "Review charges", go: null,
  });
  const inv = COMPANY.overdueInvoices;
  r.push({
    id: "invoices", category: "Working capital", impact: "Medium", title: `Chase ${inv.count} invoices unpaid for ${inv.days}+ days`,
    metric: `${fmtK(inv.amount)} in sooner ≈ ${Math.round((inv.amount / model.netBurnToday) * 30 / 7)} weeks of burn`,
    why: `Two customer invoices are past ${inv.days} days. Collecting them now eases the cash dip${done ? " while NYC ramps up" : ""}.`,
    basis: "QuickBooks invoices", provenance: "actual", action: "See invoices", go: null,
  });
  return r.filter((x) => !state.hiddenRecs[x.id]);
}

// ---------- canned "Ask about this analysis" answers (templated from the model) ----------
function askAnswers(state, model) {
  const a = state.analysis;
  const alt = buildModel({ ...state, analysis: { ...a, receiptsStart: 2 } });
  return [
    {
      q: `Why does runway drop by ${(model.none.runway - model.rec.downside.runway).toFixed(1)} months?`,
      a: `The ${fmtK(a.teamCost)}/mo NYC team cost is larger than new receipts (${fmtK(a.newReceipts / 2)}–${fmtK(a.newReceipts)}/mo), so net burn rises from ${fmtK(model.netBurnToday)} to ${fmtK(model.burnAfter)}/mo in the downside — on top of the ${fmtK(model.chosen)} one-time setup.`,
    },
    {
      q: `Why ${fmtK(model.chosen)} and not ${fmtK(a.setup)}?`,
      a: `With no setup cost, the downside would hold ${fmtK(model.plan.downside.cash[PROTECT_THROUGH] + a.setup)} at Month ${PROTECT_THROUGH}. Keeping ${fmtK(model.reserve)} leaves room for about ${fmtK(model.cap)} of setup, rounded down to the nearest $5k.`,
    },
    {
      q: "What if NYC receipts start in Month 2?",
      a: `Then the cap rises to ${fmtK(alt.cap)} and downside runway becomes ~${fmtMonthsShort(alt.rec.downside.runway)} months. Try it with “NYC receipts start” on the scenarios step.`,
    },
    {
      q: "How is this calculated?",
      a: `Month by month: cash = last month + ${fmtK(COMPANY.monthlyReceipts)} receipts + new NYC receipts − ${fmtK(COMPANY.monthlyOutflows)} costs − ${fmtK(a.teamCost)} NYC team. Setup comes off ${setupWhen(a.setupMonth)}. The downside halves NYC receipts and starts them a month later.`,
      calc: true,
    },
  ];
}

function decisionBrief(state, model) {
  const a = state.analysis;
  return [
    `Decision brief — ${NYC_QUESTION}`,
    ``,
    `Recommendation: ${model.headline}`,
    `Status: ${model.verdict}`,
    ``,
    `What is happening: ${model.what}`,
    `Why: ${model.why}`,
    `Next: ${model.next}`,
    ``,
    `Scenario behind this answer: Downside · ${fmtK(model.chosen)} setup`,
    `• Cash at Month ${PROTECT_THROUGH}: ${fmtK(model.rec.downside.cash[PROTECT_THROUGH])}`,
    `• Below ${fmtK(model.reserve)} reserve from: Month ${model.breach ?? "—"}`,
    `• Runway: ${fmtMonths(model.rec.downside.runway)} (base ${fmtMonthsShort(model.rec.base.runway)})`,
    ``,
    `Assumptions: setup paid ${setupWhen(a.setupMonth)} · NYC team ${fmtK(a.teamCost)}/mo from Month ${a.teamStart} · new receipts ${fmtK(a.newReceipts)}/mo from Month ${a.receiptsStart} (downside: half, one month later) · no new funding.`,
    `Sources: Rho Checking ••4821 · Chase Savings ••9930 (Plaid) · QuickBooks. Version ${a.version}.`,
  ].join("\n");
}

// ---------- Validate: findings for the uploaded model ----------
// The sample workbook is the NYC base plan with four problems a reviewer should catch.
function validationFindings(state, model) {
  const a = state.analysis;
  const base = model.plan.base;
  const correctedM6 = base.cash[PROTECT_THROUGH];
  const teamMonths = Math.max(0, PROTECT_THROUGH - a.teamStart + 1);
  const omitted = a.teamCost * teamMonths;

  const grown = project({ ...BASELINE(), setup: a.setup, setupMonth: a.setupMonth, extraCost: a.teamCost, extraStart: a.teamStart, newReceipts: a.newReceipts, newStart: a.receiptsStart, growth: 0.25 });
  const m12Grown = a.newReceipts * Math.pow(1.25, HORIZON - a.receiptsStart);
  const overstatement = grown.cash[HORIZON] - base.cash[HORIZON];

  const loadMonthly = Math.round((a.teamCost * PAYROLL_LOAD) / 500) * 500 || 0;
  const loaded = project({ ...BASELINE(), setup: a.setup, setupMonth: a.setupMonth, extraCost: a.teamCost + loadMonthly, extraStart: a.teamStart, newReceipts: a.newReceipts, newStart: a.receiptsStart });

  return [
    {
      id: "formula", type: "Formula error", severity: "High",
      title: "Operating costs are left out of the monthly outflow total",
      short: "Operating costs left out of the total",
      location: "Forecast!C24:H24",
      found: `The total sums rows 19–23 and skips row 18, “Ongoing NYC team costs” (${fmtK(a.teamCost)} × ${teamMonths} months = ${fmtK(omitted)}).`,
      diff: { before: "=SUM(C19:C23)", after: "=SUM(C18:C23)" },
      why: `The model makes the NYC plan look ${fmtK(omitted)} cheaper than it is. Anyone reading the summary would see a buffer that doesn’t exist.`,
      impact: [
        { label: `Month-${PROTECT_THROUGH} ending cash`, before: fmtK(correctedM6 + omitted), after: fmtK(correctedM6) },
        { label: `Buffer above ${fmtK(model.reserve)} reserve`, before: fmtK(correctedM6 + omitted - model.reserve), after: fmtK(correctedM6 - model.reserve) },
      ],
      approveLabel: "Approve change",
      detail: "Checked by rebuilding the total from the rows it should include. Deterministic — not an AI judgment.",
    },
    {
      id: "growth", type: "Unrealistic growth", severity: "Medium",
      title: "NYC receipts grow 25% every month",
      short: "NYC receipts grow 25% month over month",
      location: "Assumptions!B9",
      found: `From Month ${a.receiptsStart}, NYC receipts compound 25% a month, reaching ${fmtK(m12Grown)}/mo by Month ${HORIZON}. Your total receipts grew about ${Math.round(COMPANY.receiptsGrowth * 100)}% a month over the last 18 months.`,
      why: "Growth this steep is possible but unproven for a new city. The downside should not depend on it.",
      impact: [
        { label: `NYC receipts in Month ${HORIZON}`, before: `${fmtK(m12Grown)}/mo`, after: `${fmtK(a.newReceipts)}/mo` },
        { label: `Month-${HORIZON} cash overstated by`, before: fmtK(overstatement), after: "$0" },
      ],
      approveLabel: `Hold at ${fmtK(a.newReceipts)}/mo`,
      detail: "Compared against 18 months of receipts from your connected bank accounts.",
    },
    {
      id: "gap", type: "Cash-flow gap", severity: "Medium",
      title: correctedM6 === model.reserve
        ? `After the fix, Month ${PROTECT_THROUGH} sits exactly on your reserve`
        : correctedM6 < model.reserve
          ? `After the fix, Month ${PROTECT_THROUGH} falls ${fmtK(model.reserve - correctedM6)} below your reserve`
          : `After the fix, Month ${PROTECT_THROUGH} keeps only ${fmtK(correctedM6 - model.reserve)} above your reserve`,
      short: correctedM6 === model.reserve
        ? `Month ${PROTECT_THROUGH} lands on the ${fmtK(model.reserve)} reserve`
        : `Month ${PROTECT_THROUGH} has a ${fmtK(correctedM6 - model.reserve)} buffer, no downside`,
      location: `Forecast!H30`,
      found: `With costs included, the base case ends Month ${PROTECT_THROUGH} at ${fmtK(correctedM6)}. The model has no downside case, which falls to ${fmtK(model.plan.downside.cash[PROTECT_THROUGH])}.`,
      why: model.plan.downside.cash[PROTECT_THROUGH] < model.reserve
        ? "Without a downside case, the plan looks safe — but it breaks the reserve the first time receipts slip."
        : "The plan holds in the downside too, but the model should show it.",
      impact: [
        { label: "Base case, Month 6", before: fmtK(correctedM6), after: fmtK(correctedM6) },
        { label: "Downside case, Month 6", before: "Not modeled", after: fmtK(model.plan.downside.cash[PROTECT_THROUGH]) },
      ],
      approveLabel: "Add a downside sheet",
      link: { label: "Compare in your NYC analysis", go: "scenarios" },
      detail: "Uses the same calculation engine as Create, with this model’s inputs.",
    },
    {
      id: "payroll", type: "Missing driver", severity: "Low",
      title: "No payroll taxes or benefits on NYC hires",
      short: "No payroll taxes or benefits on NYC hires",
      location: "Assumptions!B12:B14",
      found: `NYC team costs are ${fmtK(a.teamCost)}/mo with no employer taxes or benefits. These typically add 15–25% of salary — confirm with your payroll provider.`,
      why: "Loaded cost, not salary, is what leaves the bank.",
      impact: [
        { label: "NYC team costs", before: `${fmtK(a.teamCost)}/mo`, after: `${fmtK(a.teamCost + loadMonthly)}/mo` },
        { label: `Month-${PROTECT_THROUGH} ending cash`, before: fmtK(correctedM6), after: fmtK(loaded.cash[PROTECT_THROUGH]) },
      ],
      approveLabel: `Add ${Math.round(PAYROLL_LOAD * 100)}% load`,
      detail: `The ${Math.round(PAYROLL_LOAD * 100)}% load is an assumption, shown separately so you can change it.`,
    },
  ];
}
