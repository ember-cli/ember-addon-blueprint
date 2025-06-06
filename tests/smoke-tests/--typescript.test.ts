import path, { join } from 'node:path';
import tmp from 'tmp-promise';
import fs from 'node:fs/promises';
import fixturify from 'fixturify';
import { execa } from 'execa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { assertGeneratedCorrectly, dirContents, SUPPORTED_PACKAGE_MANAGERS } from '../helpers.js';
const blueprintPath = path.join(__dirname, '../..');
let localEmberCli = require.resolve('ember-cli/bin/ember');

for (let packageManager of SUPPORTED_PACKAGE_MANAGERS) {
  describe(`--typescript with ${packageManager}`, () => {
    let tmpDir: string;
    let addonDir: string;
    let addonName = 'my-addon';

    beforeAll(async () => {
      tmpDir = (await tmp.dir()).path;
      addonDir = join(tmpDir, addonName);
      await execa({
        cwd: tmpDir,
      })`${localEmberCli} addon ${addonName} -b ${blueprintPath} --skip-npm --skip-git --prefer-local true --${packageManager} --typescript`;
      await execa({ cwd: addonDir })`${packageManager} install`;
    });

    it('was generated correctly', async () => {
      assertGeneratedCorrectly({
        projectRoot: addonDir,
        packageManager,
        typeScript: true,
      });
    });

    // Tests are additive, so when running them in order, we want to check linting
    // before we add files from fixtures
    it('lints pass', async () => {
      let { exitCode } = await execa({ cwd: addonDir })`pnpm lint`;

      expect(exitCode).toEqual(0);
    });

    describe('with fixture', () => {
      beforeEach(async () => {
        let addonFixture = fixturify.readSync('./fixtures/addon');
        fixturify.writeSync(join(addonDir, 'src'), addonFixture);

        let testFixture = fixturify.readSync('./fixtures/rendering-tests');
        fixturify.writeSync(join(addonDir, 'tests/rendering'), testFixture);

        // It's important that we ensure that dist directory is empty for these tests,
        // troll-y things can happen with shared dists
        await fs.rm(join(addonDir, 'dist'), { recursive: true, force: true });
      });

      it('lint:fix', async () => {
        let { exitCode } = await execa({ cwd: addonDir })`${packageManager} run lint:fix`;

        expect(exitCode).toEqual(0);
      });

      it('build', async () => {
        let buildResult = await execa({ cwd: addonDir })`${packageManager} run build`;

        expect(buildResult.exitCode).toEqual(0);

        let dist = await dirContents(join(addonDir, 'dist'));
        let declarations = await dirContents(join(addonDir, 'dist'));

        expect({ dist, declarations }).to.deep.equal({
          dist: [
            '_app_',
            'components',
            'index.js',
            'index.js.map',
            'template-registry.js',
            'template-registry.js.map',
          ],
          declarations: [
            'components',
            'index.d.ts',
            'index.d.ts.map',
            'services',
            'template-registry.d.ts',
            'template-registry.d.ts.map',
          ],
        });
      });

      it('test', async () => {
        let testResult = await execa({ cwd: addonDir })`${packageManager} run test`;

        expect(testResult.exitCode).toEqual(0);

        expect(testResult.exitCode).toEqual(0);
        expect(testResult.stdout).to.include('# tests 5');
        expect(testResult.stdout).to.include('# pass  5');
        expect(testResult.stdout).to.include('# fail  0');
      });
    });
  });
}
