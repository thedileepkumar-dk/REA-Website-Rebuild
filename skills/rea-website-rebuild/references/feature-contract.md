# Feature contract and helpers

Keep one record per meaningful capability, sized to the request. The ledger is a scope and evidence index, not a substitute for implementation or source inspection. All artifact paths are relative to the project root; exported evidence must stay inside that project.

## `.rebuild/features.json`

The initializer creates an empty feature inventory and pending quality checks. An empty inventory intentionally cannot pass. The following example shows the complete shape for one feature; add every requested feature and the remaining quality checks for the actual project:

```json
{
  "schema_version": 1,
  "source": {
    "url": "https://example.com",
    "rea_evidence_files": [".rebuild/evidence/source-observations.json"],
    "scope_notes": "Public product demo; private billing screens unavailable."
  },
  "mock_authorized": true,
  "design": {
    "original_ui": true,
    "status": "pass",
    "evidence": [".rebuild/evidence/redesign-desktop.png", ".rebuild/evidence/redesign-mobile.png"]
  },
  "features": [
    {
      "id": "watchlist",
      "name": "Save and manage a watchlist",
      "required": true,
      "source_status": "observed",
      "source_refs": ["ev_example_replace_with_actual_evidence_id", "https://example.com/demo/watchlist"],
      "source_notes": "Add/remove observed; original persistence mechanism not established.",
      "acceptance": ["Add a symbol, reload, reopen the same list, remove it and verify count"],
      "implementation": {
        "mode": "local",
        "status": "complete",
        "routes": ["/watchlist"],
        "mock_label": null
      },
      "tests": [
        {
          "name": "Watchlist add/reload/remove",
          "status": "pass",
          "evidence": [".rebuild/evidence/watchlist-browser-check.json"]
        }
      ]
    }
  ],
  "checks": [
    {"id": "runtime", "status": "pass", "evidence": [".rebuild/evidence/runtime-check.json"]}
  ]
}
```

Field semantics:

- `source_status`: `observed` for directly inspected behavior, `claimed` for a public promise only, `inferred` for a reconstruction decision, `unavailable` for inaccessible behavior. Include `source_notes` for anything unobserved and preserve the original access limit.
- `required`: defaults to true. Optional features remain reported; marking an originally requested feature optional requires a real scope decision, not a way to pass an audit.
- `acceptance`: observable user outcomes and relevant limits, not “button exists.”
- `implementation.mode`: `real`, `local`, `mock` or `unimplemented` as defined in the entrypoint. A local algorithm can consume mock data; record its synthetic-input boundary in notes and the visible label. Choose `mock` when the external capability itself is simulated.
- `implementation.status`: `complete`, `partial` or `blocked`. Requested incomplete/unimplemented capabilities fail the recorded-scope gate.
- `implementation.routes`: local paths, even if several features share one route; retain original route mapping in source references/notes.
- `mock_authorized`: actual user authorization, not an agent assumption. `mock_label` describes the visible disclosure for a simulated capability.
- Test/check `status`: use `not-run`, `pass` or `fail`. Never convert an unexecuted check to pass because an evidence file exists.
- Required global check IDs: `runtime`, `routes`, `workflows`, `responsive`, `accessibility`, `motion`, `network`, `visual-review`. Add relevant build/type/calculation tests as additional checks. Additional checks must also pass, or use `not-applicable` with explanatory `notes` (for example a buildless HTML app). Include them in the actual verification report.

If a source promises 500 proprietary presets but only a sample is accessible, record that claim and the rule-coverage gap. A page listing 500 labels does not establish 500 working source-equivalent rules. Likewise, a claimed 10,000-row capacity needs a real dataset exercise, not only a selected dropdown.

## Helper use

Requires Python 3.9+ for the optional standard-library helpers. If Python is unavailable, create/update the same records with the host's file tools and perform the coverage review manually; do not install a runtime without authorization merely to run a helper.

```sh
python3 /path/to/skill/scripts/init_rebuild.py --output /path/to/project --source-url https://example.com
python3 /path/to/skill/scripts/audit_rebuild.py --project /path/to/project --profile demo
python3 /path/to/skill/scripts/audit_rebuild.py --project /path/to/project --profile production
```

Initialization preserves existing application files and refuses to replace an existing `.rebuild/` directory. Resume that ledger rather than deleting it.

Audit exit codes: `0` means the declared scope/statuses/artifacts meet the selected profile; `1` means recorded coverage is not ready; `2` means invalid input or unreadable records. Demo permits explicitly authorized, visibly labeled mocks. Production rejects mocks; it still does not test deployment, security or real integrations itself. Both profiles report unobserved-source warnings. Neither profile can establish original private-product parity.

The helper checks local evidence paths and required recorded statuses. It cannot verify that an artifact's contents are truthful, that a screenshot is attractive or that a test actually exercised the product. Read the evidence and perform real runtime/visual validation before using its result in a handoff.
