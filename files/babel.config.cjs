/**
 * This babel.config is not used for publishing.
 * It's only for the local editing experience
 * (and linting)
 */
const { buildMacros } = require('@embroider/macros/babel');

const {
  babelCompatSupport,
  templateCompatSupport,
} = require('@embroider/compat/babel');

const macros = buildMacros();

// For scenario testing
const isCompat = Boolean(process.env.ENABLE_COMPAT_BUILD);

/**
 * Babel loads this file as a config file (for linting)
 * and vite.config.mjs loads it as a babel preset,
 * so it exports a function.
 */
module.exports = function (api) {
  api.cache(true);

  return {
    plugins: [<% if (typescript) { %>
      [
        '@babel/plugin-transform-typescript',
        {
          onlyRemoveTypeImports: true,
        },
      ],<% } %>
      [
        'babel-plugin-ember-template-compilation',
        {
          transforms: [
            ...(isCompat ? templateCompatSupport() : macros.templateMacros),
          ],
        },
      ],
      [
        'module:decorator-transforms',
        {
          runtime: {
            import: require.resolve('decorator-transforms/runtime-esm'),
          },
        },
      ],
      ...(isCompat ? babelCompatSupport() : macros.babelMacros),
    ],

    generatorOpts: {
      compact: false,
    },
  };
};
