import path, { join } from 'node:path';

import tmp from 'tmp-promise';
let localEmberCli = require.resolve('ember-cli/bin/ember');
import { beforeAll, describe, expect, it } from 'vitest';
import { execa } from 'execa';
import fixturify from 'fixturify';

const blueprintPath = path.join(__dirname, '../..');

import { dirContents, getTryScenarios, applyTryScenario } from '../helpers.js';

const packageManager = 'pnpm';

let tryScenarios = await getTryScenarios();

for (let scenario of tryScenarios) {
  describe(`try-scenarios: ${scenario.name}`, () => {
    let tmpDir: string;
    let addonDir: string;
    let addonName = 'my-addon';

    beforeAll(async () => {
      tmpDir = (await tmp.dir()).path;
      addonDir = join(tmpDir, addonName)
      await execa({ cwd: tmpDir })`${localEmberCli} addon ${addonName} -b ${blueprintPath} --skip-npm --skip-git --prefer-local true --${packageManager} --skip-install`;
      await applyTryScenario(scenario.name, { cwd: addonDir });
      await execa({ cwd: addonDir })`pnpm install`;
    });

    // Tests are additive, so when running them in order, we want to check linting
    // before we add files from fixtures
    it('lints with no fixtures all pass', async () => {
      let { exitCode } = await execa({ cwd: addonDir })`pnpm lint`;

      expect(exitCode).toEqual(0);
    });

    it('build and test', async () => {
      let addonFixture = fixturify.readSync('./fixtures/addon');
      fixturify.writeSync(join(addonDir, 'src'), addonFixture);

      let testFixture = fixturify.readSync('./fixtures/rendering-tests');
      fixturify.writeSync(join(addonDir, 'tests/rendering'), testFixture);

      // Ensure that we have no lint errors.
      // It's important to keep this along with the tests,
      // so that we can have confidence that the lints aren't destructively changing
      // the files in a way that would break consumers
      let { exitCode } = await execa({ cwd: addonDir })`${packageManager} run lint:fix`;

      expect(exitCode).toEqual(0);

      let buildResult = await execa({ cwd: addonDir })`${packageManager} run build`;

      expect(buildResult.exitCode).toEqual(0);

      let contents = await dirContents(join(addonDir, 'dist'));

      expect(contents).to.deep.equal(['_app_', 'components', 'index.js', 'index.js.map']);

      let testResult = await execa({ cwd: addonDir })`${packageManager} run test`;

      expect(testResult.exitCode).toEqual(0);

      expect(testResult.stdout).includes(`# tests 2
# pass  2
# skip  0
# todo  0
# fail  0

# ok`, testResult.stdout);


    });
  });
}
