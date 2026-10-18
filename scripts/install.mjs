#!/usr/bin/env node
import { cp, lstat, mkdir, readFile, realpath, rename, rm, writeFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { ensureRea, run } from '../skills/rea-website-rebuild/scripts/ensure-rea.mjs';

const source = fileURLToPath(new URL('../skills/rea-website-rebuild/', import.meta.url));
const name = 'rea-website-rebuild';
const aliases = { claude: 'claude_code', gemini: 'gemini_cli' };
const clients = new Set(['codex', 'claude_code', 'cursor', 'gemini_cli']);
const help = `REA Website Rebuild installer
Usage: node scripts/install.mjs [options]
  --agent <name>     codex, claude, cursor, gemini, or generic; repeatable
  --skill-dir <dir>  Custom skill parent directory (not the skill folder itself)
  --skip-mcp         Use REA CLI without changing an agent's MCP configuration
  --dry-run          Check REA and print the plan; no downloads or writes
  --help            Show this help
With no --agent, detects Codex, Claude Code, Cursor and Gemini directories.
If none are detected, installs to ~/.agents/skills for manual/compatible use.
REA is checked/installed and selected MCP clients configured before skill copying.
`;

export function parseArgs(args) {
  const options = { agents: [], dryRun: false, skipMcp: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--skip-mcp') options.skipMcp = true;
    else if (arg === '--agent' || arg === '--skill-dir') {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`${arg} needs a value.`);
      if (arg === '--skill-dir') options.skillDir = resolve(value);
      else {
        const agent = aliases[value] ?? value;
        if (!clients.has(agent) && agent !== 'generic') throw new Error(`Unsupported agent '${value}'. Use generic with --skill-dir for another host.`);
        options.agents.push(agent);
      }
    } else throw new Error(`Unknown option '${arg}'. Use --help.`);
  }
  options.agents = [...new Set(options.agents)];
  return options;
}

async function stat(path) {
  try { return await lstat(path); } catch (error) { if (error.code === 'ENOENT') return undefined; throw error; }
}

export async function planInstall(options, { home = homedir(), env = process.env } = {}) {
  const locations = {
    codex: { marker: env.CODEX_HOME || join(home, '.codex'), skills: join(home, '.agents', 'skills') },
    claude_code: { marker: env.CLAUDE_CONFIG_DIR || join(home, '.claude'), skills: join(env.CLAUDE_CONFIG_DIR || join(home, '.claude'), 'skills') },
    cursor: { marker: join(home, '.cursor'), skills: join(home, '.cursor', 'skills') },
    gemini_cli: { marker: join(env.GEMINI_CLI_HOME || home, '.gemini'), skills: join(env.GEMINI_CLI_HOME || home, '.agents', 'skills') },
    generic: { skills: join(home, '.agents', 'skills') },
  };
  // An explicitly configured Codex home uses its own skills directory.
  if (env.CODEX_HOME) locations.codex.skills = join(env.CODEX_HOME, 'skills');
  let agents = options.agents;
  if (!agents.length) {
    agents = [];
    for (const agent of clients) if ((await stat(locations[agent].marker))?.isDirectory()) agents.push(agent);
    if (!agents.length) agents = ['generic'];
  }
  const directories = [...new Set(agents.map(agent => options.skillDir || locations[agent].skills))];
  return { agents, destinations: directories.map(directory => join(directory, name)),
    mcpClients: options.skipMcp ? [] : agents.filter(agent => clients.has(agent)) };
}

async function validateSource(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Skill package contains a symlink: ${path}`);
    if (entry.isDirectory()) await validateSource(path);
    else if (!entry.isFile()) throw new Error(`Unsupported package entry: ${path}`);
  }
}

export async function installFolder(destination, rea, {
  sourceDirectory = source,
  backupDirectory = join(homedir(), '.local', 'share', 'rea-website-rebuild', 'backups'),
} = {}) {
  const manifest = await readFile(join(sourceDirectory, 'SKILL.md'), 'utf8');
  if (!manifest.includes('name: rea-website-rebuild')) throw new Error('Invalid skill package.');
  await validateSource(sourceDirectory);
  const existing = await stat(destination);
  if (existing?.isSymbolicLink() || existing && !existing.isDirectory()) throw new Error(`Refusing to replace non-directory/symlink: ${destination}`);
  if (existing) {
    const oldManifest = await readFile(join(destination, 'SKILL.md'), 'utf8').catch(() => '');
    if (!oldManifest.includes('name: rea-website-rebuild')) throw new Error(`Unrelated folder at ${destination}; choose another --skill-dir.`);
  }
  await mkdir(dirname(destination), { recursive: true });
  const stage = `${destination}.install-${randomUUID()}`;
  const backup = existing ? join(backupDirectory, `${name}-${Date.now()}-${randomUUID()}`) : undefined;
  // Backups live outside skill discovery roots to avoid loading duplicate skills.
  if (backup) await mkdir(backupDirectory, { recursive: true });
  let moved = false;
  try {
    await cp(sourceDirectory, stage, { recursive: true, filter: path => !['__pycache__', '.DS_Store', '.rea-runtime.json'].includes(path.split(/[/\\]/).at(-1)) });
    await writeFile(join(stage, '.rea-runtime.json'), JSON.stringify({ command: rea.command, args: rea.args, version: rea.version }, null, 2) + '\n');
    if (backup) { await rename(destination, backup); moved = true; }
    await rename(stage, destination);
  } catch (error) {
    if (moved) await rename(backup, destination);
    throw error;
  } finally { await rm(stage, { recursive: true, force: true }); }
  return { destination, backup };
}

export async function install(options, {
  home = homedir(), env = process.env, ensure = ensureRea, runner = run, log = console.log,
  copy = installFolder,
} = {}) {
  const plan = await planInstall(options, { home, env });
  log('REA Website Rebuild · original design, working workflows');
  log(`Agents: ${plan.agents.join(', ')}${options.skipMcp ? ' (CLI only)' : ''}`);
  plan.destinations.forEach(path => log(`Skill destination: ${path}`));
  const rea = await ensure({ home, env, install: true, dryRun: options.dryRun, log });
  if (options.dryRun) {
    log(`Would configure REA MCP for: ${plan.mcpClients.join(', ') || 'none (CLI/manual use)'}.`);
    log('Would copy the skill after REA verification; existing same-name skills receive backups.');
    return { ...plan, dryRun: true };
  }
  if (plan.mcpClients.length) {
    log(`Configuring REA MCP: ${plan.mcpClients.join(', ')}…`);
    const result = runner(rea.command, [...rea.args, 'setup', ...plan.mcpClients.flatMap(client => ['--client', client]), '--skill=false', '--yes', '--json'], { env, capture: true, timeout: 120000 });
    if (result.stderr?.trim()) log(result.stderr.trim());
    let report;
    try { report = JSON.parse(result.stdout); } catch { /* Diagnose process errors before malformed structured output. */ }
    if (result.status !== 0 || report?.status !== 'ready') {
      for (const [client, detail] of Object.entries(report?.clients ?? {})) {
        if (detail.status !== 'configured') log(`${client}: ${detail.status}${detail.reason ? ` (${detail.reason})` : ''}`);
      }
      log(`REA setup command: ${JSON.stringify([rea.command, ...rea.args, 'setup', ...plan.mcpClients.flatMap(client => ['--client', client]), '--skill=false', '--yes', '--json'])}`);
    }
    if (result.status !== 0) throw new Error(`REA setup failed (exit ${result.status})${result.error ? `: ${result.error.message}` : ''}. The skill was not copied. Review the setup command above, or choose --skip-mcp for CLI use.`);
    if (!report) throw new Error('REA setup did not return valid JSON. The skill was not copied. Check the installed REA version or choose --skip-mcp.');
    if (report.status !== 'ready') throw new Error(`REA setup returned '${report.status ?? 'unknown'}', not ready. The skill was not copied. Review 'rea setup' for the selected client or use --skip-mcp.`);
    log(`REA MCP setup ready: ${plan.mcpClients.join(', ')}. Restart the agent to load the connection.`);
  }
  const installed = [];
  for (const destination of plan.destinations) {
    const result = await copy(destination, rea);
    installed.push(result);
    log(`Installed: ${result.destination}`);
    if (result.backup) log(`Previous skill preserved: ${result.backup}`);
  }
  log('Installation complete. Start a fresh agent session to discover the skill and MCP tools.');
  log('Browser inspection also needs an authorized Chromium/CDP session; see references/rea-inspection.md.');
  log(`REA CLI command: ${JSON.stringify([rea.command, ...rea.args])}`);
  return { ...plan, installed, rea };
}

if (process.argv[1] && await realpath(process.argv[1]).catch(() => undefined) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) console.log(help);
    else await install(options);
  } catch (error) { console.error(`Installation stopped: ${error.message}`); process.exitCode = 1; }
}
