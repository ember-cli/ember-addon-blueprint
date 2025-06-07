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

    async function commandSucceeds(command: string) {
      let result = await execa({
        cwd: addonDir,
        shell: true,
        preferLocal: true,
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
      })`${localEmberCli} addon ${addonName} -b ${blueprintPath} --skip-npm --prefer-local true --${packageManager} --typescript`;
      // Have to use --force because NPM is *stricter* when you use tags in package.json
      // than pnpm (in that tags don't match any specified stable version)
      await execa({
        cwd: addonDir,
      })`${packageManager} install ${packageManager === 'npm' ? '--force' : ''}`;
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
      await commandSucceeds(`${packageManager} run lint`);
    });

    describe('with fixture', () => {
      beforeEach(async () => {
        let addonFixture = fixturify.readSync('./fixtures/typescript');
        fixturify.writeSync(addonDir, addonFixture);

        // It's important that we ensure that dist directory is empty for these tests,
        // troll-y things can happen with shared dists
        await fs.rm(join(addonDir, 'dist'), { recursive: true, force: true });
      });

      it('lint:fix', async () => {
        await commandSucceeds(`${packageManager} run lint:fix`);
      });

      it('build', async () => {
        await commandSucceeds(`${packageManager} run build`);

        let src = await dirContents(join(addonDir, 'src'));
        let dist = await dirContents(join(addonDir, 'dist'));
        let declarations = await dirContents(join(addonDir, 'declarations'));

        expect(
          { src, dist, declarations },
          `ensure we don't pollute the src dir with declarations and emit the js and .d.ts to the correct folders`,
        ).to.deep.equal({
          src: ['components', 'index.ts', 'services', 'template-registry.ts'],
          dist: [
            '_app_',
            'components',
            'index.js',
            'index.js.map',
            'services',
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
        let testResult = await commandSucceeds(`${packageManager} run test`);

        console.log(testResult.stdout);
        expect(testResult.stdout).to.include('# tests 2');
        expect(testResult.stdout).to.include('# pass  2');
        expect(testResult.stdout).to.include('# fail  0');
      });
    });
  });
}
