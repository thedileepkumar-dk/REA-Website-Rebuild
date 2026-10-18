# REA browser inspection

## Select the available path

Use the current host's tool inventory and the connected server's schemas. Tool namespaces differ between agents; examples below use logical operation names. If the host supplies REA's own skill, consult its browser/runtime guidance for the installed version. This skill does not require that companion skill to exist.

- Working REA MCP connection: start with `list_browser_targets` for the supplied literal loopback CDP endpoint, then select the page corresponding to the user's URL.
- CLI available: the prerequisite helper prints its executable/argument array; a repository install also records it in `.rea-runtime.json` inside the installed skill. Preserve those arguments when calling a managed REA entry point through Node. Use the installed command help only as needed. `rea list-browser-targets http://127.0.0.1:9222 --json` is the discovery pattern; port 9222 is an example, not an assumption about the user's running browser.
- Missing executable: run `node /path/to/rea-website-rebuild/scripts/ensure-rea.mjs --install`. This checks again, installs official REA only if needed, then verifies it. It does not upgrade working REA or configure MCP. Stop retrying the same installation after a failure; report the specific Node/npm/network/permission gap.
- Missing connection: distinguish a missing executable from MCP registration/client policy and unreachable CDP endpoint. Use the observed error to choose repair. Report the gap and continue useful work; do not describe substitute research as REA evidence.

Use [REA's repository](https://github.com/morluto/rea), [installation guide](https://github.com/morluto/rea/blob/main/docs/installation.md) and [browser guide](https://github.com/morluto/rea/blob/main/docs/browser-observation.md) for version-specific setup. Review configuration changes before applying authorized setup; preserve other agents, approvals, existing skills and unrelated providers. Do not install Ghidra/Hopper/IDA for website work. Do not install or upgrade unrelated runtimes to resolve a browser connection.

## Browser lifecycle and source scope

Respect the user's preferred browser and any applicable browser skill. Reuse a suitable authorized session; otherwise a dedicated Chromium-family investigation profile can expose a loopback debugging port. Use an explicit, separate user-data directory with remote-debugging flags. Discover the installed executable rather than hardcoding an OS path. Preserve user tabs and sessions. Never expose debugging on a public interface or copy tokens/cookies into an evidence bundle.

REA's passive CDP operations observe an existing page; they do not click, navigate, scroll or evaluate JavaScript. Use the host's browser-control capability or REA's advertised controlled browser scenario operation when interaction is necessary. Read the current schema before constructing a scenario; launch/connect ownership and cleanup differ. Do not claim a passive capture performed a source action. Keep any automation-owned page/context alive until passive REA captures finish; a live browser endpoint alone does not prove a temporary page survives its owner’s disconnect.

Request only the data needed for a question. Scope captures to the relevant origin and record when cross-origin frames, assets or requests are excluded. Network observation covers its attach window, not earlier traffic. Script presence/static route candidates do not prove execution, endpoint availability, entitlement or source completeness.

## Evidence-driven investigation

Choose focused operations as available:

| Question | Relevant REA operation |
|---|---|
| Which supplied pages are open? | `list_browser_targets` |
| What structure, accessibility and resources are exposed? | `inspect_web_page`, with accessibility text when needed |
| What scripts/routes/module relationships are delivered? | `analyze_web_bundle`, focused script export/static analysis if justified |
| What changed during a user/browser action? | `observe_web_session` or a controlled `capture_browser_scenario` |
| What did the visible state look like? | `capture_web_screenshot`; use browser control to establish the intended state first |
| How can evidence be retained? | `export_evidence_bundle`, or save complete CLI output with its Evidence ID |

Treat these names as a routing guide, not a promise that an older server advertises every operation. Retained evidence can be paged using advertised analysis-view tools. Avoid dumping large source bodies into chat or repeating the same producer to work around truncated previews.

For each feature, retain source URL/route, date, viewport, preconditions/role, action, observed result, relevant Evidence IDs, saved artifact paths and limitations. Separate direct observations, static inferences, marketing claims and inaccessible states. Do not save secrets or unnecessary personal data in project evidence or portable skill packages.

## When the paid/private part is inaccessible

Capture the publicly advertised capability list and public demos. Ask once for an authorized session if exact paid behavior matters. If the user chooses public-only reconstruction, continue with explicit inference and authorized mock boundaries. Keep the requested feature inventory visible; do not equate a reproduced pricing page with paid-feature implementation. Never use hidden route guessing or client bundle edits to bypass a subscription or role gate.
