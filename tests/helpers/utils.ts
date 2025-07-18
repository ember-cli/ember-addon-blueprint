import fs from 'node:fs/promises';
import os from 'node:os';
import assert from 'node:assert';
import path from 'node:path';
import { $ } from 'execa';
import { fileURLToPath } from 'node:url';
import { globby } from 'globby';

import { execa, type Options } from 'execa';

const DEBUG = process.env.DEBUG === 'true';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// repo-root
const blueprintPath = path.join(__dirname, '../..');
const defaultTryPath = path.join(blueprintPath, 'files/.try.mjs');

export const SUPPORTED_PACKAGE_MANAGERS = ['npm', 'pnpm'] as const;

export async function getTryScenarios(filePath = defaultTryPath) {
  let scenarioInfo = await import(filePath);

  return scenarioInfo.default?.scenarios ?? [];
}

export async function applyTryScenario(
  tryName: string,
  options: { cwd: string; filePath?: string },
) {
  let { filePath = defaultTryPath, cwd } = options;
  assert(cwd, 'applyTryScenario cwd is required');
  let scenarios = await getTryScenarios(filePath);
  let validNames = scenarios.map((x: { name: string }) => x.name);

  assert(
    validNames.includes(tryName),
    `Invalid try scenario name: ${tryName}. Valid names: ${validNames.join(', ')}`,
  );
  return await $({ cwd })`pnpm dlx @embroider/try apply ${tryName}`;
}

export async function createTmp() {
  let prefix = 'v2-addon-blueprint--';
  let prefixPath = path.join(os.tmpdir(), prefix);

  let tmpDirPath = await fs.mkdtemp(prefixPath);

  return tmpDirPath;
}

/**
 * Abstraction for install, as the blueprint supports multiple package managers
 */
export async function install({
  cwd,
  packageManager,
  skipPrepare,
}: {
  cwd: string;
  packageManager: string;
  skipPrepare?: boolean;
}) {
  if (packageManager === 'yarn') {
    await execa('yarn', ['install', '--non-interactive'], { cwd });
  } else {
    let installOptions = [];

    if (packageManager === 'pnpm') {
      installOptions.push('--no-frozen-lockfile');
    }

    await execa(packageManager, ['install', '--ignore-scripts', ...installOptions], { cwd });
  }

  const pkg = await packageJsonAt(cwd);

  // in order to test prepare, we need to have ignore-scripts=false
  // which is a security risk so we'll manually invoke install + prepare
  if (pkg.scripts?.prepare && !skipPrepare) {
    await execa(packageManager, ['run', 'prepare'], { cwd });
  }
}

/**
 * Abstraction for install, as the blueprint supports multiple package managers
 */
export async function runScript({
  cwd,
  script,
  packageManager,
}: {
  cwd: string;
  script: string;
  packageManager: string;
}) {
  // all package managers allow a more verbose <packageManager> run <script> way of running scripts
  let promise = execa(packageManager, ['run', script], { cwd });

  try {
    await promise;

    return promise;
  } catch (e) {
    console.error(e);

    return promise;
  }
}

export async function filesMatching(glob: string, dirPath: string) {
  try {
    let files = await globby(glob, { cwd: dirPath });

    return files;
  } catch (e) {
    console.error('error', e);

    return [];
  }
}

export async function dirContents(dirPath: string) {
  try {
    let files = await fs.readdir(dirPath);

    return files;
  } catch (e) {
    console.error('error', e);

    return [];
  }
}

export async function packageJsonAt(dirPath: string) {
  let buffer = await fs.readFile(path.join(dirPath, 'package.json'));
  let str = buffer.toString();

  return JSON.parse(str);
}

export async function createAddon({
  name = 'my-addon',
  args = [],
  options = {},
}: {
  name?: string;
  args?: string[];
  options?: Options;
}) {
  let emberCliArgs = ['addon', name, '-b', blueprintPath, '--skip-npm', '--skip-git', ...args];

  if (DEBUG) {
    console.debug(`Running ember-cli in ${options.cwd}`);
    console.debug(`\tember ${emberCliArgs.join(' ')}`);
  }

  let localEmberCli = require.resolve('ember-cli/bin/ember');

  let result = await execa(localEmberCli, emberCliArgs, {
    ...options,
    preferLocal: true,
  });

  return { result, name };
}
