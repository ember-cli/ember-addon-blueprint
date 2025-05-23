export default scenarios();

function scenarios() {
  return {
    scenarios: [
      compatEmberScenario('ember-lts-4.12', '^4.12.0'),
      compatEmberScenario('ember-lts-5.4', '~5.4.0'),
      compatEmberScenario('ember-lts-5.12', '^5.12.0'),
      emberScenario('~6.4.0'),
      emberScenario('latest'),
      emberScenario('beta'),
      emberScenario('alpha'),
    ],
  };
}

function emberScenario(tag) {
  return {
    name: `ember-${tag}`,
    npm: {
      devDependencies: {
        'ember-source': `npm:ember-source@${tag}`,
      },
    },
  };
}


/**
 * NOTE: if you chanege your real babel.config.cjs,
 *       you'll want to change this as well.
 *
  * We need a different babel config for older ember support
  * - 4.12
  * - 5.4
  *
  * This is due to these ember's using `DEBUG` from `@glimmer/env`
  * (something we don't want to encourage doing)
  */
function compatBabel() {
  return `
const { babelCompatSupport, templateCompatSupport } = require('@embroider/compat/babel');
module.exports = {
  plugins: [
    [ 'babel-plugin-ember-template-compilation', {
        compilerPath: 'ember-source/dist/ember-template-compiler.js',
        enableLegacyModules: [
          'ember-cli-htmlbars',
          'ember-cli-htmlbars-inline-precompile',
          'htmlbars-inline-precompile',
        ],
        transforms: [...templateCompatSupport()],
    }],
    ['module:decorator-transforms', {
        runtime: { import: require.resolve('decorator-transforms/runtime-esm') },
    }],
    ...babelCompatSupport(),
  ],
  generatorOpts: { compact: false },
};
`;
}

function emberCliBuildJS() {
  return `const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { compatBuild } = require('@embroider/compat');
module.exports = async function (defaults) {
  const { buildOnce } = await import('@embroider/vite');
  let app = new EmberApp(defaults);
  return compatBuild(app, buildOnce);
};`;
}

function compatEmberScenario(name, emberVersion) {
  let needsBabelComat = emberVersion === '~5.4.0';
  return {
    name,
    npm: {
      devDependencies: {
        'ember-source': emberVersion,
        '@embroider/compat': '^4.0.3',
        'ember-cli': '^5.12.0',
        'ember-auto-import': '^2.10.0',
        '@ember/optional-features': '^2.2.0',
      },
    },
    env: {
      ENABLE_COMPAT_BUILD: true,
    },
    files: {
      'ember-cli-build.js': emberCliBuildJS(),
      ...(needsBabelComat ? { 'babel.config.cjs': compatBabel() } : {}),
      'config/optional-features.json': JSON.stringify({
        'application-template-wrapper': false,
        'default-async-observers': true,
        'jquery-integration': false,
        'template-only-glimmer-components': true,
        'no-implicit-route-model': true,
      }),
    },
  };
}
