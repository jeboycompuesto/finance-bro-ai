# LOCK IN Hack submission housekeeping

Reviewed September 13, 2026, after the submission deadline. This is a repository and evidence review, not organizer confirmation of prize eligibility or deadline exceptions.

## Submission evidence

| Requirement | Evidence and status |
|---|---|
| Working project | [Public live demo](https://jeboycompuesto.github.io/finance-bro-ai/). Fresh build reproduces tracked outputs. Default financial calculations pass direct checks; live scenario slider changes the reserve status at $35k. |
| Project description | Root README describes the decision workflow, implementation, tech stack, sample data and limitations. |
| Demo under three minutes | [Drive video](https://drive.google.com/file/d/1O4IjXHmprM71rIpjaA29QgI6__s-9Tjv/view): player shows 2:03. Sharing UI confirms anyone with the link can access without sign-in. Product walkthrough footage is visible. Audio coverage of the tech stack has not been verified; README coverage alone does not establish compliance with the audio requirement. |
| LinkedIn or X post | [X post](https://x.com/jeboymotion/status/2099171873137590762) is published and describes Financebro with an embedded demo. Its displayed timestamp is September 13, 2026, 12:22 p.m. ET, after the extended deadline; organizer acceptance of this late link is unverified. The post was inspected while signed in; anonymous X availability was not established. |
| Public repository or judge access | [Repository](https://github.com/jeboycompuesto/finance-bro-ai) is public. |
| Relevant license for public repository | Owner selected MIT. Included [LICENSE](LICENSE) with attribution to Finance Bro AI contributors. |
| README setup and sample data | Python 3 build and static-server instructions are provided. Fictional company and sample-model metadata are bundled. No service credentials required. |
| Portal submission and final URLs | Verified signed-in portal shows **SUBMITTED / TEAM #43**, Finance Bro & AI (FB&A). Live demo, GitHub and X URLs match. Submitted video URL is a [Drive folder](https://drive.google.com/drive/folders/1sVHmelna42vuO0yH9-ISSj7FImzAoAzk) containing FinanceBro AI Demo Video; folder and video sharing allow anyone with the link to view. |
| Team size at most three | Verified: submitted team lists three members. |
| Participants 18+ and in the US | Not independently verified. |
| In-person attendance and judging | Luma shows the signed-in user is admitted. Admission does not prove attendance or check-in; team attendance remains unverified. |

## Deadline and organizer updates

The [event page](https://luma.com/rhoevents-otbo) lists a noon Sunday submission deadline and in-person judging from 1–5 p.m. The [11:59 a.m. update](https://luma.com/blast/wKKdDbaeDD) extends submissions to 12:15 p.m. The [12:06 p.m. update](https://luma.com/blast/a1p11bxaCn) directs submission edits through Sean Hu at sean.hu@rho.co, including the team name and requested changes. No email or submission modification was sent during this review.

The [September 12 judging update](https://luma.com/blast/R0rguQyp0Q) also asks teams to form their team in the portal and make demo, GitHub and social links publicly viewable. The final X URL is present in the submitted portal record. The portal does not show the submission time or an explicit deadline exception; confirm late-link acceptance with the organizer if needed.

## Repository completeness and validation

- All local application commits were already included in GitHub `main`; the local product-design branch was fast-forwarded to the newer remote version, `f980ddc`, before review.
- GitHub Pages was configured for `main` → `/docs`, with a successful deployment.
- `python3 build.py` reproduces both committed HTML outputs without differences.
- Direct calculation checks passed for 12.5-month baseline runway, $35k setup cap, $125k original downside cash at Month 6, $150k recommended downside cash, fundraising by Month 3, the $35k slider case and the $240k → $150k model-review correction.
- Live browser check confirmed that lowering the scenario slider from $60k to $35k changes the reserve status to holding through Month 6, and the recommendation page renders the $35k cap and Month 3 fundraising guidance.
- Source inspection found simulated integrations and no live API implementation. This project does not establish eligibility for awards requiring actual Rho, Tavily or ElevenLabs API use.
- Scripts and original visual materials previously outside the Git repository are archived under `supporting-materials/`. Final video and editable Figma design remain externally hosted and are linked in README.
- This is a focused build and demo check, not an exhaustive security or financial-model audit.

## Submitted claims requiring clarification

The portal description presents the product as integrating with a client's finance stack through MCPs/APIs and using live financial data. The inspected repository instead implements a browser prototype using fictional data, simulated connections and deterministic explanation templates. Its tech-stack section in the portal correctly lists React, Babel, Python, CSS, SVG and JavaScript.

The portal opts into **Best Fintech Track**, **Best Use of Tavily API** and **Best Project Built with ElevenLabs**. No Rho, Tavily or ElevenLabs API calls were found in the submitted application. Clarify the prototype scope and these category selections with the organizer unless qualifying implementation or ElevenLabs use in another artifact can be evidenced. Do not represent simulated connections as working sponsor integrations.

The portal records no pre-existing work disclosed; the accuracy of that declaration was not independently established.
