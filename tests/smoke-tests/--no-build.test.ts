import path, { join } from 'node:path';
import tmp from 'tmp-promise';
import fs from 'node:fs/promises';
import fixturify from 'fixturify';
import { execa } from 'execa';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  assertGeneratedCorrectly,
  filesMatching,
  SUPPORTED_PACKAGE_MANAGERS,
  safeExecaEnv,
} from '../helpers.js';
const blueprintPath = path.join(__dirname, '../..');
let localEmberCli = require.resolve('ember-cli/bin/ember');

for (let packageManager of SUPPORTED_PACKAGE_MANAGERS) {
  describe(`--no-build with ${packageManager}`, () => {
    let tmpDir: string;
    let addonDir: string;
    let addonName = 'my-addon';

    async function commandSucceeds(command: string) {
      let result = await execa({
        cwd: addonDir,
        shell: true,
        preferLocal: true,
        extendEnv: false,
        env: safeExecaEnv(),
        // Allows us to not fail yet when the command fails
        // but we'd still fail appropriately with the exitCode check below.
        // When we fail, we want to check for git diffs for debugging purposes.
        reject: false,
      })(command);

      if (result.exitCode !== 0) {
        console.log(result);
        console.log(`\n\n${command} exited with code ${result.exitCode}\n\n`);
        console.log(result.stdout);
        console.log(result.stderr);
        console.log(`\n\n git diff \n\n`);
        await execa({ cwd: addonDir, stdio: 'inherit' })`git diff`;
      }

      expect(result.exitCode, `\`${command}\` succeeds`).toEqual(0);

      return result;
    }

    beforeAll(async () => {
      tmpDir = (await tmp.dir()).path;
      addonDir = join(tmpDir, addonName);
      await execa({
        cwd: tmpDir,
        extendEnv: false,
      })`${localEmberCli} addon ${addonName} -b ${blueprintPath} --skip-npm true --${packageManager} --no-build`;
      // Have to use --force because NPM is *stricter* when you use tags in package.json
      // than pnpm (in that tags don't match any specified stable version)
      if (packageManager === 'npm') {
        await execa({ cwd: addonDir, extendEnv: false })`npm install --force`;
      } else if (packageManager === 'pnpm') {
        await execa({ cwd: addonDir, extendEnv: false })`pnpm install`;
      }
    });

    it('was generated correctly', async () => {
      assertGeneratedCorrectly({
        projectRoot: addonDir,
        packageManager,
        typeScript: false,
      });
    });

    // Tests are additive, so when running them in order, we want to check linting
    // before we add files from fixtures
    it('lints pass', async () => {
      await commandSucceeds(`${packageManager} run lint`);
    });

    // Tests are additive, so when running them in order, we want to check linting
    // before we add files from fixtures
    it('lints with no fixtures all pass', async () => {
      let { exitCode } = await execa({ cwd: addonDir, extendEnv: false })`pnpm lint`;

      expect(exitCode).toEqual(0);
    });

    it('lint:fix with no fixtures', async () => {
      let { exitCode } = await execa({
        cwd: addonDir,
        extendEnv: false,
      })`${packageManager} run lint:fix`;

      expect(exitCode).toEqual(0);
    });

    describe('with fixture', () => {
      beforeEach(async () => {
        let addonFixture = fixturify.readSync('./fixtures/addon');
        fixturify.writeSync(join(addonDir, 'src'), addonFixture);

        let testFixture = fixturify.readSync('./fixtures/rendering-tests');
        fixturify.writeSync(join(addonDir, 'tests/rendering'), testFixture);

        fixturify.writeSync(
          join(addonDir, 'tests/unit'),
          fixturify.readSync('./fixtures/build-mode-tests'),
        );
      });

      it('lint:fix', async () => {
        await commandSucceeds(`${packageManager} run lint:fix`);
      });

      it('test', async () => {
        let testResult = await commandSucceeds(`${packageManager} run test`);

        console.log(testResult.stdout);
        expect(testResult.stdout).to.include('# tests 6');
        expect(testResult.stdout).to.include('# pass  6');
        expect(testResult.stdout).to.include('# fail  0');
      });
    });
  });
}
