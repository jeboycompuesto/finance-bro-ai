# Finance Bro AI — product demo

A clickable demo of Finance Bro AI built from the FigJam low-fi mockup (section 04).
It turns a business question into a decision you can defend:
connect data → set goals → Home → recommendations → guided questions → scenarios → recommendation.

Everything is simulated (a fictional seed-stage company, Fieldnote Labs), but the numbers are **not hard-coded**:
a deterministic calculation engine (`src/engine.js`) computes every cash projection, runway, reserve breach,
recommended setup cap and recommendation text. Change an assumption or drag the setup-cost slider and every screen updates.

## Run it

No installs needed (Python 3 is already on macOS).

```bash
python3 build.py
```

Then open `dist/index.html` in a browser. React and Babel load from cdnjs, so the first open needs internet.

While editing, rebuild automatically and serve locally:

```bash
python3 build.py --watch
```

```bash
python3 -m http.server 5173 --directory dist
```

Open http://localhost:5173.

## Presenting

- The **Demo** button (bottom-left) jumps to any screen, triggers recovery states, and has **Reset demo** to start over.
- Progress saves in the browser, so a refresh keeps your place.
- Suggested live moments:
  1. On **Scenarios**, drag *NYC setup cost* from $60k to $35k and watch the downside stop breaking the reserve.
     Then open **Home** — recommendations switch from “Test the NYC plan” to “Cap NYC setup at $35k” and “Start raise talks by Month 3”.
  2. Click **See calculation** to show the month-by-month math and where every input comes from.
  3. **Upload a model** → **Use the sample model** → approve the formula fix and watch Month-6 cash drop from $240k to $150k.

## What’s in the demo

| Screen | Route | What works |
|---|---|---|
| 00 Loading | `#/loading` | Animated setup checklist |
| 01 Connect your data | `#/connect` (`?manage` from Data) | Simulated connections, Brex fails on the first try, duplicate merge note, deposit review, Manage per source |
| 01b Set your goals | `#/goals` (`?manage` from Edit goals) | Goals drive savings targets, + Add a goal |
| 02 Home | `#/home` | Ask, decision areas, recommendations, cash outlook, goals, recent analyses, sync-failure banner |
| 02b Recommendations | `#/recs` | Computed recommendations, Ask why, Snooze/Dismiss with Undo, detail tables |
| Analyses | `#/analyses` | All analyses and model reviews |
| 03 Guided questions | `#/questions` | Ranges, timing dropdowns, required-field checks |
| 04a Scenarios | `#/scenarios` | Live slider, See calculation, View lineage, + Add scenario |
| 04b Recommendation | `#/recommendation` | Financial impact views, Update goals, Ask panel, decision brief, out-of-date state with Recalculate/Undo |
| 05 Validate — upload | `#/validate` | Sample model or your own file (demo shows sample findings), unsupported-file error, coverage + partial review |
| 06 Validate — findings | `#/findings` | 4 computed findings, approve/reject with Undo, save a reviewed version |
| 07 Recovery states | Demo menu | Rho sync failure, out-of-date recommendation, failed connection (Brex), missing inputs (screen 03), partial review (screen 05) |

Only the NYC team decision is modeled. Other questions and decision areas show a “coming soon” message.

## Project layout

```
build.py                 bundles src/ into dist/index.html
src/index.template.html  page shell (fonts, CDN scripts)
src/styles.css           design tokens (light + dark) and components
src/data.js              sample company, integrations catalog, goals, initial state
src/engine.js            calculation engine, recommendations, templated explanations
src/ui.jsx               shared components (top bar, stepper, provenance tags, inputs, modal, toasts)
src/charts.jsx           SVG cash chart with hover tooltip, calculation modal, spend bars, progress
src/screens/setup.jsx    loading, connect (+ deposit review), goals
src/screens/home.jsx     home, analyses list, recommendations
src/screens/analysis.jsx guided questions
src/screens/scenarios.jsx scenarios, recommendation
src/screens/validate.jsx validate upload + coverage, findings + approval
src/app.jsx              state, routing, persistence, demo menu
```

## Key numbers (sample company)

$500k cash · $60k/mo receipts · $100k/mo outflows · $40k/mo net burn · 12.5 months runway ·
$150k reserve · NYC plan $60k setup + $15k/mo team · $10k/mo new receipts from Month 3
(downside: half, one month later). Recommended cap: $35k, start raising by Month 3.
