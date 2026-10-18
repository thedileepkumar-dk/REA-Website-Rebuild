# Portability and invocation

The package uses the open Agent Skills format: `SKILL.md`, relative references and optional helpers. `agents/openai.yaml` supplies optional Codex UI metadata. The workflow does not require a particular framework, browser executable or vendor-specific tool namespace.

## Install with the repository installer

Get the release or clone [REA Website Rebuild](https://github.com/thedileepkumar-dk/REA-Website-Rebuild). From its root run:

```sh
node scripts/install.mjs --agent codex
node scripts/install.mjs --agent claude
node scripts/install.mjs --agent cursor
node scripts/install.mjs --agent gemini
```

Repeat `--agent` to select several. With no selection, the installer detects these four agents by their configuration directories; no detections means shared/manual installation. Use `--dry-run` to inspect the plan or `--skip-mcp` for CLI-only use. A directory marker is not proof the agent is installed/running.

The installer checks REA first. If missing or broken, it installs the official pinned `rea-agents` release into `~/.local/share/rea-website-rebuild/runtime`, then verifies it. A working existing REA is reused. New REA installation requires npm and a supported Node version: 22.19+, 24.11+, or 26+. It does not install Node or native disassemblers.

Next it delegates selected MCP registration to REA's official `setup --client … --skill=false --yes`, and copies this skill only after setup succeeds. Existing same-name skill folders are backed up under `~/.local/share/rea-website-rebuild/backups`, outside discovery roots. REA owns its configuration edits/backups. If setup partially changes a selected client before failing, inspect its output before retrying; the installer does not undo REA-owned configuration changes. It never reports that failure as a complete installation.

| Host | Default personal skill directory |
|---|---|
| Codex | `~/.agents/skills/`; `$CODEX_HOME/skills/` when explicitly set |
| Claude Code | `~/.claude/skills/`; `$CLAUDE_CONFIG_DIR/skills/` when set |
| Cursor | `~/.cursor/skills/` |
| Gemini CLI | `~/.agents/skills/`, relative to `$GEMINI_CLI_HOME` when set |
| Generic/manual | `~/.agents/skills/` |

For another host, use `--agent generic --skill-dir /your/host/skills`. This copies the portable folder and prepares REA CLI; it does not guess that host's discovery or MCP configuration. Configure MCP separately with REA's official client guide if supported. A coding agent without skill discovery can read the installed `SKILL.md` directly.

Start a fresh agent session or refresh discovery after installation. Installation does not prove the running agent loaded the skill/MCP connection. Local installs do not propagate into remote/cloud sandboxes. Each executing environment needs its own tools and package.

## Manually copied or marketplace-installed folders

Preserve the whole folder, including `references/` and `scripts/`. Before inspection, check:

```sh
node /path/to/rea-website-rebuild/scripts/ensure-rea.mjs --check
```

If missing, install REA first:

```sh
node /path/to/rea-website-rebuild/scripts/ensure-rea.mjs --install
```

The helper prints the working executable/argument array. For a managed installation use `node /absolute/runtime/node_modules/rea-agents/scripts/rea.mjs <command>`; do not assume it was added to PATH. MCP is optional if the agent can use the CLI. A working REA MCP connection is also sufficient when the agent cannot inspect the host's local executables.

## Example invocation

Codex:

```text
Use $rea-website-rebuild to inspect https://example.com and rebuild its features in ./my-product. Create a unique professional interface with purposeful animation. Use real local persistence; mock unavailable external services and label them. Verify desktop/mobile workflows and report gaps.
```

Claude Code:

```text
/rea-website-rebuild Inspect https://example.com and rebuild its features in ./my-product with an original professional animated design. Use real local persistence; visibly mock unavailable external services. Verify the workflows and report gaps.
```

Other agent:

```text
Read /path/to/rea-website-rebuild/SKILL.md. Use it to rebuild the workflows of https://example.com in ./my-product with a distinct professional animated interface. Inspect with REA, implement the agreed scope and verify it.
```

Replace the URL, directory and mock policy with the user's actual intent. Example mock authorization does not apply to another request. The skill does not bundle a browser, credentials, original website data, or a universal cloning engine. The executing agent needs filesystem/coding, browser and REA access; inaccessible private behavior remains unknown.

Format/discovery sources: [Agent Skills standard](https://agentskills.io/), [OpenAI skills](https://developers.openai.com/codex/skills/), [Claude Code skills](https://code.claude.com/docs/en/skills), [Cursor skills](https://cursor.com/docs/context/skills), [Gemini CLI skills](https://geminicli.com/docs/cli/skills/), [REA installation](https://github.com/morluto/rea/blob/main/docs/installation.md). Recheck host-specific discovery conventions when they change.
