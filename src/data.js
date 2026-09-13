// Sample company and catalog data for the demo.
// Everything here is fictional. Numbers match the FigJam low-fi mockup (04).

const COMPANY = {
  name: "Fieldnote Labs",
  stage: "Seed",
  openingCash: 500000,
  monthlyReceipts: 60000,
  monthlyOutflows: 100000,
  historyMonths: 18,
  costDrivers: [
    { label: "Payroll", amount: 62000 },
    { label: "Rent", amount: 14000 },
    { label: "Software", amount: 9000 },
    { label: "Contractors", amount: 8000 },
    { label: "Marketing", amount: 5000 },
    { label: "Other", amount: 2000 },
  ],
  receiptsGrowth: 0.03, // average month-over-month growth in receipts, from bank history
  uncategorizedDeposits: 3,
  overlappingTools: { count: 3, monthlySaving: 1100 },
  overdueInvoices: { count: 2, amount: 18000, days: 45 },
};

// kind decides what a source contributes to the baseline.
const INTEGRATIONS = [
  { id: "plaid", name: "Plaid", category: "banks", kind: "bank", desc: "Most banks and cards · balances, transactions", account: "Chase Savings ••9930" },
  { id: "rho", name: "Rho", category: "banks", kind: "bank", desc: "Business banking, cards, bills", account: "Checking ••4821" },
  { id: "mercury", name: "Mercury", category: "banks", kind: "bank", desc: "Business banking", account: "Checking ••1177" },
  { id: "brex", name: "Brex", category: "banks", kind: "bank", desc: "Cards and spend management", account: "Card ••6620", failsFirst: true },
  { id: "ramp", name: "Ramp", category: "banks", kind: "bank", desc: "Cards and spend management", account: "Card ••3051" },
  { id: "quickbooks", name: "QuickBooks Online", category: "accounting", kind: "accounting", desc: "Chart of accounts, invoices, bills", account: "18 months of books" },
  { id: "xero", name: "Xero", category: "accounting", kind: "accounting", desc: "Chart of accounts, invoices, bills", account: "Books" },
  { id: "netsuite", name: "NetSuite", category: "accounting", kind: "accounting", desc: "ERP · departments, accruals", account: "ERP" },
  { id: "sap", name: "SAP", category: "accounting", kind: "accounting", desc: "ERP · cost centers, entities", account: "ERP" },
  { id: "gusto", name: "Gusto", category: "payroll", kind: "payroll", desc: "Payroll by role — sharper “Can we hire?” answers", account: "Payroll · 14 people", suggested: true },
  { id: "rippling", name: "Rippling", category: "payroll", kind: "payroll", desc: "Payroll and headcount plans", account: "Payroll" },
  { id: "deel", name: "Deel", category: "payroll", kind: "payroll", desc: "Global payroll and contractors", account: "Contractors" },
  { id: "stripe", name: "Stripe", category: "revenue", kind: "revenue", desc: "Revenue, refunds, payout timing", account: "Payouts" },
  { id: "salesforce", name: "Salesforce", category: "revenue", kind: "revenue", desc: "Pipeline → expected revenue timing", account: "Pipeline" },
  { id: "hubspot", name: "HubSpot", category: "revenue", kind: "revenue", desc: "Pipeline → expected revenue timing", account: "Pipeline" },
  { id: "csv", name: "Upload CSV or Excel", category: "files", kind: "file", desc: "Any export — we map the columns with you", account: "transactions.csv" },
  { id: "sheets", name: "Google Sheets", category: "files", kind: "file", desc: "Live link to a sheet", planned: true },
];

const CATEGORIES = [
  { id: "banks", label: "Banks & cards", note: "Cash balances and every transaction" },
  { id: "accounting", label: "Accounting & ERP", note: "Categories, invoices, bills, accruals" },
  { id: "payroll", label: "Payroll & HR", note: "Headcount costs by role and team" },
  { id: "revenue", label: "Revenue & CRM", note: "When revenue actually lands" },
  { id: "files", label: "Files", note: "When there’s no integration" },
];

// Goals the user can pick in setup. `target` links a goal to a money target row.
const GOAL_OPTIONS = [
  { id: "runway", label: "Extend runway", desc: "Make cash last longer before the next raise", target: "runway" },
  { id: "hire", label: "Hire key roles", desc: "Plan headcount you can afford", target: "hiring" },
  { id: "expand", label: "Expand to a new market", desc: "Test a city or region without risking the reserve", target: "nyc" },
  { id: "reserve", label: "Build a cash reserve", desc: "Keep a safety floor you never dip below", target: "reserve" },
  { id: "fundraise", label: "Prepare to fundraise", desc: "Know when to start and how much to raise" },
  { id: "cut", label: "Cut costs", desc: "Find spend to reduce or renegotiate" },
];

const DECISION_AREAS = [
  { id: "growth", label: "Revenue & growth", prompt: "Which channel is paying back?" },
  { id: "invest", label: "Investments", prompt: "Where should the next $50k go?" },
  { id: "expansion", label: "Market expansion", prompt: "Can we fund a NYC team?", live: true },
  { id: "hiring", label: "Hiring & comp", prompt: "Can we hire two engineers?" },
  { id: "raise", label: "Raise capital", prompt: "Should we raise now or in six months?" },
  { id: "budget", label: "Budgeting", prompt: "Runway if revenue slips 20%?" },
  { id: "cost", label: "Cost reduction", prompt: "Where can we cut $10k/mo?" },
  { id: "wc", label: "Working capital", prompt: "Which invoices to chase first?" },
  { id: "procure", label: "Procurement", prompt: "Buy or lease equipment?" },
  { id: "risk", label: "Risk", prompt: "What breaks if our top client churns?" },
];

const NYC_QUESTION = "How much can we afford for NYC team activities and equipment?";

// Deposits the bank shows but accounting hasn't categorized.
const FLAGGED_DEPOSITS = [
  { id: "d1", date: "Aug 2", from: "Transfer from Chase Savings ••9930", amount: 25000, suggested: "transfer" },
  { id: "d2", date: "Jul 14", from: "Wire · Northbeam Capital", amount: 50000, suggested: "loan" },
  { id: "d3", date: "Jul 3", from: "Deposit · M. Reyes", amount: 10000, suggested: "owner" },
];
const DEPOSIT_TYPES = [
  { value: "revenue", label: "Revenue" },
  { value: "transfer", label: "Transfer between accounts" },
  { value: "loan", label: "Loan or credit line" },
  { value: "owner", label: "Owner or investor money" },
];

const SAMPLE_MODEL = {
  fileName: "NYC-team-plan.xlsx",
  size: "412 KB",
  sheets: ["Assumptions", "Forecast", "Summary"],
  formulas: 415,
  checked: 412,
  unchecked: ["1 macro (Forecast!Z2)", "2 external links"],
  question: "Can we fund the NYC team and keep a $150,000 cash reserve?",
};

const SETUP_TIMING = [
  { value: 0, label: "Before Month 1" },
  { value: 1, label: "In Month 1" },
  { value: 2, label: "In Month 2" },
  { value: 3, label: "In Month 3" },
];
const TEAM_TIMING = [
  { value: 1, label: "Months 1–12" },
  { value: 2, label: "From Month 2" },
  { value: 3, label: "From Month 3" },
];

const INITIAL_STATE = {
  route: "loading",
  manage: false, // true when a setup screen is opened from Home instead of during setup
  sources: {}, // id -> "connecting" | "connected"
  goals: {
    stage: "Seed",
    team: "11–50",
    selected: { runway: true, hire: true, expand: true, reserve: true, fundraise: false, cut: false },
    reserve: 150000,
    nyc: { target: 60000, by: "Month 2", saved: 21000 },
    hiring: { target: 90000, by: "Month 6", saved: 30000 },
    runwayTarget: 18,
    custom: [], // [{ id, name, target, by, saved }]
  },
  analysis: {
    status: "none", // none | draft | done
    setup: 60000,
    setupRange: null, // null, or { low, high } when the user isn't sure (setup = high)
    setupMonth: 0, // 0 = before Month 1
    teamCost: 15000,
    teamStart: 1,
    newReceipts: 10000,
    receiptsStart: 3,
    reserve: null, // null = use the goal
    funding: null, // null (optional) | "no" | "yes" | "unsure"
    testSetup: 60000,
    custom: null, // { name, setup, newReceipts, receiptsStart } — one extra scenario
    computedWith: null, // inputs behind the last recommendation; differs from current = stale
    version: 1,
  },
  validation: {
    stage: "empty", // empty | parsing | ready
    fileName: null,
    question: SAMPLE_MODEL.question,
    decisions: {}, // findingId -> "approved" | "rejected"
    selected: "formula",
    savedVersion: null, // { approved: n, rejected: n }
  },
  syncIssue: null, // null | "failed" | "accepted"
  depositsReviewed: false,
  nycTargetUpdated: false,
  hiddenRecs: {},
  welcome: null, // null | "show" (after setup) | "dismissed"
};
