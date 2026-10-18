#!/usr/bin/env node
// Shared by the installer and by agents invoking a manually copied skill.
import { spawnSync } from 'node:child_process';
import { access, realpath } from 'node:fs/promises';
import { constants } from 'node:fs';
import { delimiter, dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

export const REA_PACKAGE = 'rea-agents@6.7.0';
export const runtimeDirectory = (home = homedir()) => join(home, '.local', 'share', 'rea-website-rebuild', 'runtime');
export const managedEntry = (home = homedir()) => join(runtimeDirectory(home), 'node_modules', 'rea-agents', 'scripts', 'rea.mjs');
export const supportsNode = (version = process.versions.node) => {
  const [major, minor] = version.split('.').map(Number);
  return major === 22 && minor >= 19 || major === 24 && minor >= 11 || major >= 26;
};

export function run(command, args, { env = process.env, capture = false, timeout = 30000 } = {}) {
  const result = spawnSync(command, args, {
    env, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit', windowsHide: true,
    ...(capture ? { timeout, maxBuffer: 1024 * 1024 } : {}),
  });
  return { status: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? '', error: result.error };
}

async function exists(path, mode = constants.F_OK) {
  try { await access(path, mode); return true; } catch { return false; }
}

export async function pathCommand(name, env = process.env, platform = process.platform) {
  const key = Object.keys(env).find(key => key.toLowerCase() === 'path');
  const separators = platform === 'win32' ? ';' : delimiter;
  const suffixes = platform === 'win32' ? ['.exe', '.cmd', ''] : [''];
  for (const directory of (env[key] ?? '').split(separators).filter(Boolean)) {
    for (const suffix of suffixes) {
      const candidate = join(directory.replace(/^"|"$/g, ''), name + suffix);
      if (await exists(candidate, platform === 'win32' ? constants.F_OK : constants.X_OK)) return candidate;
    }
  }
}

async function invocation(path) {
  if (/\.(?:cmd|ps1)$/i.test(path)) {
    // Use npm's adjacent JS entry point instead of executing a shell command string.
    const entry = join(dirname(path), 'node_modules', 'rea-agents', 'scripts', 'rea.mjs');
    return await exists(entry) ? { command: process.execPath, args: [entry] } : undefined;
  }
  return { command: path, args: [] };
}

export async function findRea({ home = homedir(), env = process.env, runner = run } = {}) {
  const candidates = [];
  const onPath = await pathCommand('rea', env);
  if (onPath) candidates.push(await invocation(onPath));
  candidates.push({ command: process.execPath, args: [managedEntry(home)] });
  // A previous user-local installation may be absent from this agent's PATH.
  if (process.platform !== 'win32') candidates.push(await invocation(join(home, '.local', 'bin', 'rea')));
  for (const candidate of candidates.filter(Boolean)) {
    if (candidate.args[0] && !await exists(candidate.args[0])) continue;
    const result = runner(candidate.command, [...candidate.args, '--version'], { env, capture: true });
    if (result.status === 0 && /\d+\.\d+\.\d+/.test(result.stdout)) {
      return { ...candidate, version: result.stdout.trim() };
    }
  }
}

export async function npmInvocation(env = process.env) {
  const launcher = await pathCommand('npm', env);
  if (!launcher) throw new Error('npm is missing. Install an official supported Node.js distribution (including npm), then rerun.');
  const entry = /\.cmd$/i.test(launcher)
    ? join(dirname(launcher), 'node_modules', 'npm', 'bin', 'npm-cli.js')
    : await realpath(launcher);
  if (!await exists(entry)) throw new Error(`Cannot locate npm's JS entry point beside ${launcher}. Repair the Node.js/npm installation.`);
  return { command: process.execPath, args: [entry] };
}

export async function ensureRea({
  home = homedir(), env = process.env, install = false, dryRun = false,
  runner = run, find = findRea, npm = npmInvocation, nodeVersion = process.versions.node,
  log = console.log,
} = {}) {
  const current = await find({ home, env, runner });
  if (current) { log(`REA found: ${current.version}`); return current; }
  if (!install) throw new Error('REA is missing or cannot run. Rerun this helper with --install, or use the repository installer.');
  if (!supportsNode(nodeVersion)) throw new Error(`Installing ${REA_PACKAGE} requires Node 22.19+, 24.11+, or 26+. Current: ${nodeVersion}. Install a supported Node version and rerun; no runtime has been changed.`);
  const npmCommand = await npm(env);
  if (dryRun) {
    log(`Would install ${REA_PACKAGE} in ${runtimeDirectory(home)} before installing the skill.`);
    return { planned: true };
  }
  log(`REA is missing. Installing ${REA_PACKAGE} in ${runtimeDirectory(home)}…`);
  const result = runner(npmCommand.command, [...npmCommand.args, 'install', '--prefix', runtimeDirectory(home),
    '--no-audit', '--no-fund', '--omit=dev', '--package-lock=false', REA_PACKAGE], { env });
  if (result.status !== 0) throw new Error(`REA installation failed (exit ${result.status}). The skill has not been installed. Check npm/network output and rerun.`);
  const installed = await find({ home, env, runner });
  if (!installed) throw new Error('npm finished, but REA did not pass its version check. The skill has not been installed.');
  log(`REA verified: ${installed.version}`);
  return installed;
}

if (process.argv[1] && await realpath(process.argv[1]).catch(() => undefined) === fileURLToPath(import.meta.url)) {
  const flags = process.argv.slice(2);
  const unknown = flags.filter(flag => !['--check', '--install', '--dry-run'].includes(flag));
  try {
    if (unknown.length) throw new Error(`Unknown option: ${unknown.join(', ')}`);
    const rea = await ensureRea({ install: flags.includes('--install'), dryRun: flags.includes('--dry-run') });
    if (!rea.planned) console.log(`REA command: ${JSON.stringify([rea.command, ...rea.args])}`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
