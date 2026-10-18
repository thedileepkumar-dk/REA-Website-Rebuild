# Verification and handoff

## Behavioral checks

Use the feature map to define journeys with observable results. For a substantial app, verify the important applicable cases rather than checking only that every route renders:

- Direct/deep navigation, refresh and browser back; JavaScript/CSS/image endpoints have the right content types instead of receiving an HTML fallback.
- Valid and invalid form inputs; numeric step/min relationships, boundary values, units, rounding and error recovery.
- Create/edit/delete, reopening a saved item, fresh-page persistence, and cross-feature totals/derived results.
- Search/filter/sort/pagination change the actual dataset, including empty results and reset.
- Calculations change with their inputs and satisfy meaningful invariants such as accounting reconciliation or known analytic cases.
- Download completion plus exported content matching the current state; large datasets are genuinely generated/processed within advertised capacity.
- Integration success/failure with authorized accounts or test doubles; mocks display their simulation state. Real integrations must have actual external evidence where relevant.
- Responsive navigation and content on a narrow phone and desktop; additional widths when the layout changes substantially.
- Keyboard, focus restoration, accessible names, contrast and reduced-motion behavior.
- Runtime/resource errors and unintended outbound requests. A local/mock rebuild should not execute source-site scripts, tracking or original auth requests.

Isolate destructive QA and financial/account mutations from real data. Prefer synthetic fixtures and host-owned browser contexts for tests. Do not clear user storage or modify an existing source account to get a clean test run.

Await semantic readiness: a matching new result, saved identifier, completed download or changed state. A click can finish before render/network work completes. Avoid arbitrary sleeps and assertions against stale results. Test async state ordering and focused-input rerenders when they affect the application; do not hide a runtime error by relaxing the assertion.

## Screenshot evidence

Record viewport, route, state, capture date and any deliberately different source/rebuild data. Ensure fonts/images and reveal transitions have settled; inspect the image itself to catch blank sections and clipping. Capture at least representative desktop/mobile screens and additional dialogs/results needed to assess the requested features.

Use side-by-side source/redesign views to assess workflow coverage and originality. Use redesign-before/redesign-after comparisons for visual regressions. Do not optimize source pixel similarity, call a large pixel difference original design, or report background-dominated percentages as functional equivalence. Private pages without a source reference stay visually unverified.

## Completion language

The audit helper validates recorded structure/statuses and local artifact existence. It cannot execute the site, authenticate evidence, inspect image quality or prove production readiness. The agent still needs to read results and inspect screenshots. An empty ledger or a stub page cannot pass simply because the project builds.

Use completion descriptions that match evidence:

- **Working local rebuild:** requested local workflows persist and pass their checks, with service limits stated.
- **Complete with authorized mocks:** all agreed workflows pass, simulated boundaries are approved and visible, and real/local/mock counts are reported.
- **Partially complete:** missing routes/features, unapproved simulation, failed/not-run critical checks or unresolved dependencies remain.
- **Production-integrated scope verified:** relevant real-service behavior, persistence, access control and deployment checks have been exercised. The audit's production profile alone does not establish this.

Finish with project location, tested setup/start commands, preview lifecycle and what to open. Report active server only after confirming readiness; if stopped, give the launcher/start command instead. Respect a user request to keep a preview running. Include feature differences, access gaps, evidence locations and any remaining user-supplied credentials/configuration needs without exposing secrets.
