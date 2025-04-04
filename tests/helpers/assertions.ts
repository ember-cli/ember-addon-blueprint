import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import fse from 'fs-extra';
import { expect } from 'vitest';

import { readFixture } from './fixtures.js';
import { packageJsonAt } from './utils.js';

interface AssertECUOptions {
  projectRoot: string;
  addonName: string;
  addonLocation?: string;
  testAppLocation?: string;
  testAppName?: string;
  packageManager: 'npm' | 'yarn' | 'pnpm';
  typeScript: boolean;
}

export async function assertCorrectECUJson({
  projectRoot,
  addonName,
  packageManager,
  typeScript,
}: AssertECUOptions) {
  let configPath = path.join(projectRoot, 'config/ember-cli-update.json');
  let json = await fse.readJSON(configPath);

  let ownPkg = await packageJsonAt(fileURLToPath(new URL('../..', import.meta.url)));

  expect(json.projectName).toEqual(addonName);
  expect(json.packages).toHaveLength(1);

  expect(json.packages[0].name).toEqual('@ember/addon-blueprint');
  expect(json.packages[0].version).toEqual(ownPkg.version);

  expect(json.packages[0].blueprints).toHaveLength(1);
  expect(json.packages[0].blueprints[0].name).toEqual('@ember/addon-blueprint');

  if (packageManager !== 'npm') {
    expect(json.packages[0].blueprints[0].options).toContain(`--${packageManager}`);
  }

  if (typeScript) {
    expect(json.packages[0].blueprints[0].options).toContain(`--typescript`);
  } else {
    expect(json.packages[0].blueprints[0].options).not.toContain(`--typescript`);
  }
}

export async function matchesFixture(
  /**
   * Project-relative file to test against
   */
  testFilePath: string,
  options?: {
    /**
     * Which fixture set to use
     */
    scenario?: string;
    /**
     * By default, the file used will be the same as the testFilePath, but
     * in the fixtures directory under the (maybe) specified scenario.
     * this can be overridden, if needed.
     * (like if you're testFilePath is deep with in an existing monorepo, and wouldn't
     *   inherently match our default-project structure used in the fixtures)
     */
    file?: string;

    /**
     * The working directory to use for the relative paths. Defaults to process.cwd() (node default)
     */
    cwd?: string;
  },
) {
  let scenario = options?.scenario ?? 'default';
  let fixtureFile = options?.file ?? testFilePath;

  if (options?.cwd) {
    testFilePath = path.join(options.cwd, testFilePath);
  }

  let sourceContents = (await fs.readFile(testFilePath)).toString();
  let fixtureContents = await readFixture(fixtureFile, { scenario });

  /**
   * We trim because whether or not the source or fixture has
   * leading / trailing invisible characters is of no significance
   * and is mostly a bother to get correct in testing
   */
  expect(sourceContents.trim()).to.equal(
    fixtureContents.trim(),
    `${testFilePath} matches ${fixtureFile}`,
  );
}

