import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ensureRea, supportsNode, findRea } from '../skills/rea-website-rebuild/scripts/ensure-rea.mjs';
import { install, installFolder, parseArgs, planInstall } from '../scripts/install.mjs';

const quiet = () => {};
const rea = { command: '/fixture/node', args: ['/fixture/rea.mjs'], version: '6.7.0' };
async function temporary(t) {
  const home = await mkdtemp(join(tmpdir(), 'rea-rebuild-test-'));
  t.after(() => rm(home, { recursive: true, force: true }));
  return home;
}

test('existing working REA never invokes npm or installation', async () => {
  const result = await ensureRea({ find: async () => rea, install: true, nodeVersion: '25.0.0',
    npm: () => assert.fail('npm must not be called'), runner: () => assert.fail(), log: quiet });
  assert.equal(result, rea);
});

test('fresh install checks REA, installs official pinned package, then verifies', async () => {
  const events = [];
  const result = await ensureRea({ home: '/fixture', install: true, nodeVersion: '24.11.0',
    find: async () => { events.push('check'); return events.length === 1 ? undefined : rea; },
    npm: async () => ({ command: 'node', args: ['npm-cli.js'] }),
    runner: (cmd, args) => { events.push('install'); assert.equal(cmd, 'node');
      assert.ok(args.includes('rea-agents@6.7.0')); assert.ok(args.includes('--prefix')); return { status: 0 }; }, log: quiet });
  assert.deepEqual(events, ['check', 'install', 'check']);
  assert.equal(result, rea);
});

test('missing REA check does not mutate, and failed npm installation stops', async () => {
  await assert.rejects(ensureRea({ find: async () => undefined, runner: () => assert.fail() }), /REA is missing/);
  await assert.rejects(ensureRea({ find: async () => undefined, install: true, nodeVersion: '24.11.0',
    npm: async () => ({ command: 'node', args: [] }), runner: () => ({ status: 17 }), log: quiet }), /installation failed/);
});

test('successful npm exit without a working REA still fails', async () => {
  await assert.rejects(ensureRea({ find: async () => undefined, install: true, nodeVersion: '24.11.0',
    npm: async () => ({ command: 'node', args: [] }), runner: () => ({ status: 0 }), log: quiet }), /did not pass/);
});

test('missing REA dry run never downloads or writes', async () => {
  const result = await ensureRea({ find: async () => undefined, install: true, dryRun: true,
    nodeVersion: '26.0.0', npm: async () => ({ command: 'node', args: [] }), runner: () => assert.fail(), log: quiet });
  assert.equal(result.planned, true);
});

test('supported Node versions match official package engine ranges', () => {
  for (const version of ['22.19.0', '22.22.0', '24.11.0', '24.19.0', '26.0.0', '27.0.0']) assert.ok(supportsNode(version), version);
  for (const version of ['18.20.0', '22.18.0', '23.11.0', '24.10.0', '25.1.0']) assert.equal(supportsNode(version), false, version);
});

test('unsupported runtime blocks a fresh install before npm is invoked', async () => {
  await assert.rejects(ensureRea({ install: true, nodeVersion: '25.2.0', find: async () => undefined,
    npm: () => assert.fail(), log: quiet }), /requires Node/);
});

test('findRea can discover the managed JS entry without relying on PATH', async t => {
  const home = await temporary(t);
  const entry = join(home, '.local/share/rea-website-rebuild/runtime/node_modules/rea-agents/scripts/rea.mjs');
  await mkdir(join(entry, '..'), { recursive: true });
  await writeFile(entry, '// fixture');
  const result = await findRea({ home, env: { PATH: '' }, runner: (command, args) => {
    assert.equal(args[0], entry); return { status: 0, stdout: '6.7.0\n' };
  } });
  assert.equal(result.args[0], entry);
});

test('argument parsing handles aliases, repetitions and paths with spaces', () => {
  const parsed = parseArgs(['--agent', 'claude', '--agent', 'claude_code', '--agent', 'codex', '--skill-dir', '/path with spaces', '--skip-mcp']);
  assert.deepEqual(parsed.agents, ['claude_code', 'codex']);
  assert.equal(parsed.skillDir, '/path with spaces');
  assert.ok(parsed.skipMcp);
  assert.throws(() => parseArgs(['--agent', 'unknown']), /Unsupported/);
  assert.throws(() => parseArgs(['--skill-dir']), /needs a value/);
  assert.throws(() => parseArgs(['--not-real']), /Unknown/);
});

test('auto detection selects known agents and deduplicates shared destination', async t => {
  const home = await temporary(t);
  await mkdir(join(home, '.codex'));
  await mkdir(join(home, '.gemini'));
  const plan = await planInstall(parseArgs([]), { home, env: {} });
  assert.deepEqual(plan.agents, ['codex', 'gemini_cli']);
  assert.deepEqual(plan.destinations, [join(home, '.agents/skills/rea-website-rebuild')]);
  assert.deepEqual(plan.mcpClients, ['codex', 'gemini_cli']);
});

test('no detected agent gives portable CLI mode, custom paths and overrides work', async t => {
  const home = await temporary(t);
  const plan = await planInstall(parseArgs([]), { home, env: {} });
  assert.deepEqual(plan.agents, ['generic']);
  assert.deepEqual(plan.mcpClients, []);
  const custom = await planInstall(parseArgs(['--agent', 'generic', '--skill-dir', join(home, 'custom')]), { home, env: {} });
  assert.deepEqual(custom.destinations, [join(home, 'custom/rea-website-rebuild')]);
  const override = await planInstall(parseArgs(['--agent', 'codex']), { home, env: { CODEX_HOME: join(home, 'codex-override') } });
  assert.deepEqual(override.destinations, [join(home, 'codex-override/skills/rea-website-rebuild')]);
});

test('REA verification and selected MCP configuration happen before any skill copying', async t => {
  const events = [];
  const home = await temporary(t);
  await install(parseArgs(['--agent', 'codex', '--agent', 'claude']), { home, env: {}, log: quiet,
    ensure: async () => { events.push('rea'); return rea; },
    runner: (command, args) => { events.push('mcp'); assert.equal(command, rea.command);
      assert.deepEqual(args, ['/fixture/rea.mjs', 'setup', '--client', 'codex', '--client', 'claude_code', '--skill=false', '--yes', '--json']); return { status: 0, stdout: '{"status":"ready"}' }; },
    copy: async destination => { events.push('copy'); return { destination }; } });
  assert.deepEqual(events, ['rea', 'mcp', 'copy', 'copy']);
});

test('REA or MCP failure prevents skill installation', async t => {
  const home = await temporary(t);
  const options = parseArgs(['--agent', 'codex']);
  await assert.rejects(install(options, { home, env: {}, log: quiet, ensure: async () => { throw new Error('no REA'); },
    copy: () => assert.fail() }), /no REA/);
  await assert.rejects(install(options, { home, env: {}, log: quiet, ensure: async () => rea,
    runner: () => ({ status: 1 }), copy: () => assert.fail() }), /setup failed/);
});

test('installer dry run does not configure MCP or copy; CLI mode skips MCP', async t => {
  const home = await temporary(t);
  const deps = { home, env: {}, log: quiet, ensure: async () => rea, runner: () => assert.fail(), copy: () => assert.fail() };
  await install(parseArgs(['--agent', 'codex', '--dry-run']), deps);
  let copied = false;
  await install(parseArgs(['--agent', 'codex', '--skip-mcp']), { ...deps, copy: async destination => { copied = true; return { destination }; } });
  assert.ok(copied);
  assert.deepEqual(await readdir(home), []);
});

test('an incomplete or malformed REA setup report cannot claim success', async t => {
  const home = await temporary(t);
  for (const stdout of ['{"status":"failed"}', '{"status":"cancelled"}', 'not json']) {
    await assert.rejects(install(parseArgs(['--agent', 'codex']), { home, env: {}, log: quiet,
      ensure: async () => rea, runner: () => ({ status: 0, stdout }), copy: () => assert.fail() }), /not copied/);
  }
});

test('install copies complete skill; update preserves modifications outside discovery roots', async t => {
  const home = await temporary(t);
  const destination = join(home, 'skills/rea-website-rebuild');
  const backupDirectory = join(home, 'backups');
  await installFolder(destination, rea, { backupDirectory });
  assert.ok((await readFile(join(destination, 'references/verification.md'), 'utf8')).length);
  assert.ok((await readFile(join(destination, 'scripts/ensure-rea.mjs'), 'utf8')).length);
  assert.equal(JSON.parse(await readFile(join(destination, '.rea-runtime.json'), 'utf8')).version, '6.7.0');
  await writeFile(join(destination, 'user-note.txt'), 'keep my changes');
  const update = await installFolder(destination, rea, { backupDirectory });
  assert.equal(await readFile(join(update.backup, 'user-note.txt'), 'utf8'), 'keep my changes');
  assert.deepEqual(await readdir(join(home, 'skills')), ['rea-website-rebuild']);
});

test('unrelated destination and symlink are preserved instead of overwritten', async t => {
  const home = await temporary(t);
  const destination = join(home, 'rea-website-rebuild');
  await mkdir(destination);
  await writeFile(join(destination, 'note'), 'unrelated');
  await assert.rejects(installFolder(destination, rea), /Unrelated/);
  assert.equal(await readFile(join(destination, 'note'), 'utf8'), 'unrelated');
  if (process.platform !== 'win32') {
    const link = join(home, 'linked');
    await symlink(destination, link);
    await assert.rejects(installFolder(link, rea), /symlink/);
  }
});
