import path, { join } from 'node:path';

import tmp from 'tmp-promise';
let localEmberCli = require.resolve('ember-cli/bin/ember');
import { beforeAll, describe, expect, it } from 'vitest';
import {execa } from 'execa';

const blueprintPath = path.join(__dirname, '../..');

import {
  AddonHelper,
  assertGeneratedCorrectly,
  dirContents,
  matchesFixture,
  SUPPORTED_PACKAGE_MANAGERS
} from '../helpers.js';
import { existsSync } from 'node:fs';

for (let packageManager of SUPPORTED_PACKAGE_MANAGERS) {
  describe(`defaults with ${packageManager}`, () => {
    let tmpDir: string;
    let addonDir: string;
    let addonName = 'my-addon';
    
    beforeAll(async () => {
      tmpDir = (await tmp.dir()).path;
      addonDir = join(tmpDir, addonName)
      await execa({cwd: tmpDir})`${localEmberCli} addon ${addonName} -b ${blueprintPath} --skip-npm --skip-git --prefer-local true --${packageManager}`;
      await execa({cwd: addonDir})`${packageManager} install`
    });

    it('is using the correct packager', async () => {
      let npm = path.join(addonDir, 'package-lock.json');
      let pnpm = path.join(addonDir, 'pnpm-lock.yaml');

      switch (packageManager) {
        case 'npm': {
          expect(existsSync(npm), 'for NPM: package-lock.json exists').toBe(true);
          expect(existsSync(pnpm), 'pnpm-lock.yaml does not exist').toBe(false);

          await matchesFixture('.github/workflows/ci.yml', { cwd: addonDir });
          await matchesFixture('.github/workflows/push-dist.yml', { cwd: addonDir });
          await matchesFixture('CONTRIBUTING.md', { cwd: addonDir });

          break;
        }
        case 'pnpm': {
          expect(existsSync(pnpm), 'for pnpm: pnpm-lock.yaml exists').toBe(true);
          expect(existsSync(npm), 'package-lock.json does not exist').toBe(false);

          await matchesFixture('.github/workflows/ci.yml', {
            cwd: addonDir,
            scenario: 'pnpm',
          });
          await matchesFixture('.github/workflows/push-dist.yml', {
            cwd: addonDir,
            scenario: 'pnpm',
          });
          await matchesFixture('CONTRIBUTING.md', {
            cwd: addonDir,
            scenario: 'pnpm' 
          });
          await matchesFixture('.npmrc', {
            cwd: addonDir,
            scenario: 'pnpm',
          });

          break;
        }

        default:
          throw new Error(`unknown packageManager: ${packageManager}`);
      }
    });

    it.skip('"prepare" built the addon', async () => {
      let contents = await dirContents(join(addonDir, 'dist'));

      expect(contents).to.deep.equal(['index.js', 'index.js.map']);
    });

    it('was generated correctly', async () => {
      await assertGeneratedCorrectly({ projectRoot: addonDir, packageManager });
    });

    // Tests are additive, so when running them in order, we want to check linting
    // before we add files from fixtures
    it('lints with no fixtures all pass', async () => {
      let { exitCode } = await execa({cwd: addonDir})`pnpm lint`;

      expect(exitCode).toEqual(0);
    });

    it.skip('build and test ', async () => {
      // Copy over fixtures
      await helper.fixtures.use('./my-addon/src/components');
      await helper.fixtures.use('./test-app/tests');

      // Ensure that we have no lint errors.
      // It's important to keep this along with the tests,
      // so that we can have confidence that the lints aren't destructively changing
      // the files in a way that would break consumers
      let { exitCode } = await helper.run('lint:fix');

      expect(exitCode).toEqual(0);

      let buildResult = await helper.build();

      expect(buildResult.exitCode).toEqual(0);

      let contents = await dirContents(distDir);

      expect(contents).to.deep.equal(['_app_', 'components', 'index.js', 'index.js.map']);

      let testResult = await helper.run('test:ember');

      expect(testResult.exitCode).toEqual(0);

      expect(testResult.stdout).to.include('# tests 4');
      expect(testResult.stdout).to.include('# pass  4');
      expect(testResult.stdout).to.include('# fail  0');
    });
  });
}
