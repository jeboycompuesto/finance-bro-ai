# Financebro illustration system · v1.2

Updated September 13, 2026. The library now includes separate reusable raster illustrations for Clarity, Scenarios, Planning and Brody. These are PNG assets inside native Figma components, not editable vector artwork or 3D models. The native F logo remains the app identity. The old flat Brody, embedded concept board and cropped portrait are hidden archives.

## Recommendation

Lead with sculptural objects that make financial planning tangible. Use Brody occasionally for welcome and completion moments. His full-body illustration retains the warm brown coat, navy vest, lime zip and blue notebook from the exploration, with no text or surrounding concept-sheet layout.

## First concepts

- `01-object-led-direction.png`: Find clarity (a tangled ribbon becoming a clear path), explore options (a branching path), make room to plan (a calendar sculpture). The ribbon and broad rounded arch could become recurring visual motifs. The calendar needs a clearer calendar cue in the next iteration; it currently also resembles a flip counter.
- `02-brody-direction.png`: Original reference sheet with three poses. The standalone welcome asset is `assets/brody-welcome-white.png` (1254 × 1254).

## Visual grammar to develop

- Preserve the existing F logo and wordmark as native assets. Keep the illustration separate from the logo.
- Use Financebro's existing colors: lime #A1D459, navy #14213D, blue #3D8FE3, orange #F9834F, cool white #F8F9FB. These are art-direction targets; lighting changes the apparent colors inside raster renders.
- Favor broad ribbons, rounded arches, thick edges and a small number of recognizable objects. Build meaning through shape and interaction.
- Use satin ceramic or coated metal as the primary material. Allow a single contrasting resin or textile detail. The first object sheet is more textured than ideal; simplify surfaces for small product placements.
- Keep three-quarter views, soft upper-left light, short contact shadows, generous space and strong silhouettes consistent.
- Small spot illustrations: one object, few details. Larger onboarding or marketing scenes: up to three related objects.
- Keep data, answer cards, charts and financial warnings free of mascot or decorative illustration. This matches the current design-system rule.
- Favor planning and clarity over profit imagery. Avoid money showers, rockets and guaranteed-upward metaphors.

## Application ideas

- Setup / connect accounts: two broad interlocking links.
- Start a forecast: a folded calendar path.
- Scenario introduction: a branching track; never present the decorative branch as actual forecast data.
- Plan saved: a closed notebook with a simple tab.
- Marketing hero: tangled ribbon resolving into a clear path.
- Brody: welcome, thinking during setup, modest completion acknowledgment. One character maximum; no character on errors or risk warnings.

## Asset usage

Clarity, Scenarios and Brody have white backgrounds. Place them on white art panels on colored surfaces; do not treat them as transparent cutouts. Planning has alpha transparency. Preserve each asset's square proportions and use FIT rather than cropping the character. Brody was visually checked at 96, 160 and 320 pixels; prefer 160–320 pixels for product placements. Future poses should match the same character, camera, lighting and palette. Animation would require separate motion assets.

## Figma implementation

The first release is now wired into the source file:

- `Illustrations` page (`35:8`) contains the gallery, size checks and light/navy surface examples.
- `Illustration` component set (`35:80`) has one variant property, `Subject`, with `Clarity`, `Scenarios`, `Planning` (`35:77`–`35:79`) and `Brody` (`57:60`).
- Chapter 02 (`5:2`) now presents the objects as the lead visual language and keeps Brody as an optional companion.
- The Design System header and Cover use the native app icon for product identity (`3:36`, instance `54:57`; `38:8`, instance `53:13`). Clarity remains available as editorial artwork on the Illustrations page and in Chapter 02.
- Chapter 02 includes the full-body Brody component instance (`60:60`) in the companion section (`5:9`). The concept board (`52:59`) is hidden.
- The Cards chapter uses the full-body Brody instance (`60:61`) at 160 pixels. The cropped portrait (`50:54`) is hidden.
- The Illustrations gallery, 96/160/320 size checks and navy-surface example all use linked Brody instances. All seven active instances resolve to component `57:60`.
- The illustration set and variants carry reuse guidance in their Figma descriptions: clarity for getting started, scenarios for choices, planning for timelines.
- Existing colors, type styles, logo components and token collections were reused. No new token collection was added.

## Whole-page corrections

Typography descriptions now match the native styles. Button size and focus guidance, shadow names and chart colors match the examples and tokens. Contrast ratios were recalculated from the actual fills. The setup chapter correctly reports 42 Color variables and distinguishes reusable Logo/Illustration components from button, tag, card and chart specifications and planned input work. Cover and footer show v1.2. Visible design-system text was checked for overflow, and key chapters were visually inspected after the edits.

## References

- Financebro source file: https://www.figma.com/design/NgrotxV7Njc0D60IIEgRJo
- Wise public direction: https://wise.design/direction
- Wise explanation of its icon-inspired 3D illustration system: https://medium.com/wise-engineering/how-did-we-build-3d-animations-in-mobile-apps-515c3de87b74
- The supplied Wise Community kit could not be fetched. This exploration used the accessible public Wise material and Financebro's live file.

## Generation prompts

Exact prompts are recorded in `generation-prompts.md`.
