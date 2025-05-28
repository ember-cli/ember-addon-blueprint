import path, { join } from 'node:path';
import fs from 'node:fs/promises';

import tmp from 'tmp-promise';
let localEmberCli = require.resolve('ember-cli/bin/ember');
import { beforeEach, beforeAll, describe, expect, it } from 'vitest';
import { execa } from 'execa';
import fixturify from 'fixturify';

const blueprintPath = path.join(__dirname, '../..');

import {
  AddonHelper,
  assertGeneratedCorrectly,
  dirContents,
  matchesFixture,
  SUPPORTED_PACKAGE_MANAGERS,
} from '../helpers.js';
import { existsSync } from 'node:fs';

/**
 * NOTE: tests run sequentially
 *       we need to manually specify "concurrent" to run them in parallel
 *
 *       https://vitest.dev/guide/features.html#running-tests-concurrently
 *
 *       This is important because we delete stuff in one test that was created in another
 */
for (let packageManager of SUPPORTED_PACKAGE_MANAGERS) {
  describe(`defaults with ${packageManager}`, () => {
    let tmpDir: string;
    let addonDir: string;
    let addonName = 'my-addon';

    beforeAll(async () => {
      tmpDir = (await tmp.dir()).path;
      addonDir = join(tmpDir, addonName);
      await execa({
        cwd: tmpDir,
      })`${localEmberCli} addon ${addonName} -b ${blueprintPath} --skip-npm --skip-git --prefer-local true --${packageManager}`;
      await execa({ cwd: addonDir })`${packageManager} install`;
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
            scenario: 'pnpm',
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
      let { exitCode } = await execa({ cwd: addonDir })`pnpm lint`;

      expect(exitCode).toEqual(0);
    });

    it('lint:fix with no fixtures', async () => {
      let { exitCode } = await execa({ cwd: addonDir })`${packageManager} run lint:fix`;

      expect(exitCode).toEqual(0);
    });

    describe('with fixture', () => {
      beforeEach(async () => {
        let addonFixture = fixturify.readSync('./fixtures/addon');
        fixturify.writeSync(join(addonDir, 'src'), addonFixture);

        let testFixture = fixturify.readSync('./fixtures/rendering-tests');
        fixturify.writeSync(join(addonDir, 'tests/rendering'), testFixture);
      });

      it('lint:fix', async () => {
        let { exitCode } = await execa({ cwd: addonDir })`${packageManager} run lint:fix`;

        expect(exitCode).toEqual(0);
      });

      it('build', async () => {
        let buildResult = await execa({ cwd: addonDir })`${packageManager} run build`;

        expect(buildResult.exitCode).toEqual(0);

        let contents = await dirContents(join(addonDir, 'dist'));

        expect(contents).to.deep.equal(['_app_', 'components', 'index.js', 'index.js.map']);
      });

      it('test', async () => {
        // It's important that we ensure that dist directory is empty for this test, because
        await fs.rm(join(addonDir, 'dist'), { recursive: true, force: true });

        let testResult = await execa({ cwd: addonDir })`${packageManager} run test`;

        expect(testResult.exitCode).toEqual(0);

        expect(testResult.stdout).includes(
          `# tests 2
# pass  2
# skip  0
# todo  0
# fail  0

# ok`,
          testResult.stdout,
        );
      });
    });
  });
}
