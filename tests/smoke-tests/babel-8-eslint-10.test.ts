import fs from 'node:fs/promises';
import { join } from 'node:path';
import { execa } from 'execa';
import fixturify from 'fixturify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  AddonHelper,
  packageJsonAt,
  safeExecaEnv,
  SUPPORTED_PACKAGE_MANAGERS,
} from '../helpers.js';

/**
 * The next majors of Babel and ESLint.
 * The blueprint does not use them yet,
 * so this test swaps them into the generated addon.
 */
const nextMajors: Record<string, string> = {
  '@babel/core': '^8.1.3',
  '@babel/eslint-parser': '^8.1.2',
  '@babel/plugin-transform-typescript': '^8.1.3',
  '@babel/runtime': '^8.1.3',
  '@eslint/js': '^10.0.1',
  eslint: '^10.0.0',
  'eslint-plugin-ember': '^13.11.4',
};

/**
 * npm fails on these peer ranges, pnpm only warns.
 */
const npmOverrides = {
  '@rollup/plugin-babel': { '@babel/core': '$@babel/core' },
  'eslint-plugin-import': { eslint: '$eslint' },
};

for (let packageManager of SUPPORTED_PACKAGE_MANAGERS) {
  describe(`babel 8 and eslint 10 with ${packageManager}`, () => {
    for (let typeScript of [false, true]) {
      describe(typeScript ? 'typescript' : 'javascript', () => {
        let helper = new AddonHelper({
          packageManager,
          args: typeScript ? ['--typescript'] : [],
        });

        async function run(script: string) {
          let result = await execa({
            cwd: helper.projectRoot,
            extendEnv: false,
            env: safeExecaEnv(),
            reject: false,
          })`${packageManager} run ${script}`;

          expect(result.exitCode, `${script}\n${result.stdout}\n${result.stderr}`).toEqual(0);

          return result;
        }

        beforeAll(async () => {
          await helper.setup();

          let pkg = await packageJsonAt(helper.projectRoot);

          for (let [name, range] of Object.entries(nextMajors)) {
            if (pkg.devDependencies[name]) {
              pkg.devDependencies[name] = range;
            }
          }

          if (packageManager === 'npm') {
            pkg.overrides = npmOverrides;
          }

          await fs.writeFile(
            join(helper.projectRoot, 'package.json'),
            JSON.stringify(pkg, null, 2) + '\n',
          );

          await helper.installDeps();
        });

        afterAll(async () => {
          await helper.clean();
        });

        it('lint', async () => {
          await run('lint');
        });

        /**
         * The tests below build on each other, in order.
         */
        it('lint:fix with fixtures', async () => {
          if (typeScript) {
            fixturify.writeSync(helper.projectRoot, fixturify.readSync('./fixtures/typescript'));
          } else {
            fixturify.writeSync(
              join(helper.projectRoot, 'src'),
              fixturify.readSync('./fixtures/addon'),
            );
            fixturify.writeSync(
              join(helper.projectRoot, 'tests/rendering'),
              fixturify.readSync('./fixtures/rendering-tests'),
            );
          }

          await run('lint:fix');
        });

        it('build', async () => {
          await run('build');
        });

        it('test', async () => {
          await fs.rm(join(helper.projectRoot, 'dist'), { recursive: true, force: true });

          let testResult = await run('test');

          expect(testResult.stdout).to.include('# fail  0');
        });
      });
    }
  });
}
