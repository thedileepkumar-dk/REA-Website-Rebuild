# Validation

Checked on 18 October 2026. These results describe the installer and skill helpers, not a guarantee that every website can be fully reconstructed.

## Automated checks

```sh
npm test
python3 skills/rea-website-rebuild/scripts/test_helpers.py
```

- **18 installer tests:** reuse working REA; install/verify ordering; failed installation; false-success prevention; missing-dependency diagnostics; runtime compatibility; managed entry discovery; agent selection; environment overrides; generic/custom destinations; dry runs; MCP failure; CLI-only mode; complete copying; backups; protection of unrelated destinations; execution through symlinked paths.
- **12 ledger-helper tests:** preserve existing files; reject invalid source URLs; fail empty scope, incomplete work and missing evidence; enforce mock authorization and labels; reject mocks in the production profile; retain source uncertainty; validate required checks.
- Skill frontmatter/naming validation with the Codex skill-creator validator.
- POSIX launcher syntax and actual local shell dry run.
- Custom README SVG rendered and visually inspected.

## Live installation checks

Executed on **macOS arm64 with Node 24.19.0**, using an isolated temporary home and npm cache:

1. Started without REA in the executing environment.
2. Installed official `rea-agents@6.7.0` into the user-owned managed runtime.
3. Verified REA's real version command before skill installation.
4. Applied official REA setup for Codex, Claude Code, Cursor and Gemini CLI.
5. Checked the actual configuration files and complete installed skill folders.
6. Confirmed unrelated pre-existing MCP server entries survived setup.
7. Repeated installation and verified reuse of REA and preservation of the old skill outside discovery roots.
8. Launched the actual registered Codex MCP command, completed protocol initialization and listed 207 REA tools, including browser-target discovery.

A separate dry run reused an existing REA 6.4.0 installation without upgrading it.

## Practical limits

Windows PowerShell/batch launchers and Linux bootstrap paths are provided, but have not been executed on native Windows/Linux hosts in this release's local validation. Agent configuration checks do not prove the agent application's UI has loaded the skill; start a fresh session and verify it there.

The tests do not log into a private source website, validate a third-party backend, publish an app, or certify an arbitrary generated product. Browser/CDP connection, permissions, private-page access and each project's own acceptance checks remain separate.

The audit helper validates self-reported coverage and artifact existence. Inspect actual screenshots and runtime outcomes before making completion claims.
