# Product refinement

## Diagnosis

The previous demo combined a large lime surface, an 800-weight display headline, pill controls and ten equal-weight decision tiles. These treatments competed with the financial content and made the first screen feel playful and crowded. Illustrations were missing from the main experience, but adding artwork alone would not fix the hierarchy.

## Implemented direction

- Lead Home with the company context and four existing financial metrics. Values use the same company data and calculation engine as the rest of the demo.
- Keep one editorial introduction with a clarity sculpture. A neutral surface and lighter Figtree heading give the artwork space. Keep the original native F mark and wordmark.
- Use lime for primary actions and a small priority accent. Use navy, neutral surfaces, thin borders and modest corner radii elsewhere.
- Put decision areas in a native, keyboard-accessible disclosure. Preserve all ten prompts and their existing demo behavior; keep the modeled NYC question directly accessible.
- Separate the model-review shortcut from the question form and make recommendations a distinct section.
- Reserve illustrations for introductions: clarity on Home and loading, branching paths in Analyses, planning in goal setup. No illustration appears in financial warnings, charts or recommendations.
- Default to light appearance, with a persistent dark-mode control. White-background artwork stays on white art panels in dark mode.
- Stack metrics in two columns on phones, simplify the introductory art away on Home, and keep goal cards readable.

## Assets and delivery

The three PNG assets are the previously created Financebro illustration library from this workspace, reused without visual modification. Build embeds them in a plain script separately from the Babel-transformed application, preserving both single-file outputs and avoiding transforming megabytes of image data.

The app remains a simulated clickable demo. Its calculation engine, integrations, sample data, routing and review behavior are unchanged. React/Babel and fonts still load from their existing CDNs.

Visual reference: [Wise design direction](https://wise.design/direction). The implementation follows Financebro’s existing colors and artwork rather than importing Wise assets.

## Verification

- Build succeeds for both docs/index.html and dist/index.html.
- Desktop and 390px phone layouts reviewed, with route-level overflow checks on all 11 screens.
- NYC question → scenarios → recommendation works. Slider changes the reserve status; the recommendation retains the computed $35k setup cap.
- Light and dark appearance checked, including persistence after reload.
- Sample model review and decision-area disclosure checked in the browser.
