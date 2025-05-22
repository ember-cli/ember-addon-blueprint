import path, { join } from 'node:path';

import tmp from 'tmp-promise';
let localEmberCli = require.resolve('ember-cli/bin/ember');
import { beforeAll, describe, expect, it } from 'vitest';
import { execa } from 'execa';
import fixturify from 'fixturify';

const blueprintPath = path.join(__dirname, '../..');

import { getTryScenarios, applyTryScenario } from '../helpers.js';

const packageManager = 'pnpm';

let tryScenarios = await getTryScenarios();

for (let scenario of tryScenarios) {
  describe(`try-scenarios: ${scenario.name}`, () => {
    let tmpDir: string;
    let addonDir: string;
    let addonName = 'my-addon';

    function runInAddon(command: string) {
      return execa({ cwd: addonDir, env: scenario.env })(command);
    }

    beforeAll(async () => {
      tmpDir = (await tmp.dir()).path;
      addonDir = join(tmpDir, addonName)
      await execa({ cwd: tmpDir })`${localEmberCli} addon ${addonName} -b ${blueprintPath} --skip-npm --skip-git --prefer-local true --${packageManager} --skip-install`;
      await applyTryScenario(scenario.name, { cwd: addonDir });
      await runInAddon(`${packageManager} install`);
    });

    it('build and test', async () => {
      let addonFixture = fixturify.readSync('./fixtures/addon');
      fixturify.writeSync(join(addonDir, 'src'), addonFixture);

      let testFixture = fixturify.readSync('./fixtures/rendering-tests');
      fixturify.writeSync(join(addonDir, 'tests/rendering'), testFixture);

      let testResult = await runInAddon(`${packageManager} run test`);

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
