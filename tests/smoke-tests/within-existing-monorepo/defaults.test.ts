import fs from 'node:fs/promises';
import path from 'node:path';

import fixturify from 'fixturify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  assertGeneratedCorrectly,
  createAddon,
  createTmp,
  install,
  readFixture,
  runScript,
  SUPPORTED_PACKAGE_MANAGERS,
} from '../../helpers.js';

let commonFixtures = {
  '.prettierrc.cjs': await readFixture('.prettierrc.cjs'),
};

for (let packageManager of SUPPORTED_PACKAGE_MANAGERS) {
  describe.skip(`monorepo with ${packageManager}`, () => {
    let cwd = '';
    let tmpDir = '';
    let addonLocation = 'my-addon';
    let testAppLocation = 'test-app';
    let rootPackageJson;
    let rootFiles = {};
    let lockFile =
      packageManager === 'yarn'
        ? 'yarn.lock'
        : packageManager === 'pnpm'
        ? 'pnpm-lock.yaml'
        : 'package-lock.json';

    beforeAll(async () => {
      tmpDir = await createTmp();

      switch (packageManager) {
        case 'npm':
        case 'yarn':
          rootPackageJson = {
            name: 'existing-monorepo',
            private: true,
            workspaces: ['*'],
            devDependencies: {
              prettier: '^2.5.0',
            },
          };
          rootFiles = {
            ...commonFixtures,
            'package.json': JSON.stringify(rootPackageJson),
          };
          fixturify.writeSync(tmpDir, rootFiles);

          break;
        case 'pnpm':
          rootPackageJson = {
            name: 'existing-monorepo',
            private: true,
            devDependencies: {
              prettier: '^2.5.0',
            },
          };
          rootFiles = {
            ...commonFixtures,
            'package.json': JSON.stringify(rootPackageJson),
            'pnpm-workspace.yaml': "packages:\n  - '*'",
          };
          fixturify.writeSync(tmpDir, rootFiles);

          break;
      }

      await createAddon({
        args: [`--${packageManager}`],
        options: { cwd: tmpDir },
      });

      cwd = tmpDir;

      await install({ cwd, packageManager });
    });

    afterAll(async () => {
      fs.rm(tmpDir, { recursive: true, force: true });
    });

    it('ignores root files', async () => {
      expect(
        fixturify.readSync(cwd, {
          ignore: ['my-addon', 'test-app', 'node_modules', lockFile],
        }),
        'root files have not been touched',
      ).toEqual(rootFiles);
    });

    it('was generated correctly', async () => {
      await assertGeneratedCorrectly({
        projectRoot: cwd,
        expectedStaticFiles: ['README.md', 'CONTRIBUTING.md'],
        packageManager,
        existingMonorepo: true,
      });
    });

    it('runs tests', async () => {
      let { exitCode } = await runScript({
        cwd: path.join(cwd, testAppLocation),
        script: 'test',
        packageManager,
      });

      expect(exitCode).toEqual(0);
    });

    it('addon lints all pass', async () => {
      let { exitCode } = await runScript({
        cwd: path.join(cwd, addonLocation),
        script: 'lint',
        packageManager,
      });

      expect(exitCode).toEqual(0);
    });

    it('test-app lints all pass', async () => {
      let { exitCode } = await runScript({
        cwd: path.join(cwd, testAppLocation),
        script: 'lint',
        packageManager,
      });

      expect(exitCode).toEqual(0);
    });
  });
}
