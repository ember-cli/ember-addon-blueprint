/**
 * This babel.config is not used for publishing.
 * It's only for the local editing experience
 * (and linting)
 */
const { buildMacros } = require('@embroider/macros/babel');
const debugMacros = require('babel-plugin-debug-macros');

const {
  babelCompatSupport,
  templateCompatSupport,
} = require('@embroider/compat/babel');

const macros = buildMacros();

// For scenario testing
const isCompat = Boolean(process.env.ENABLE_COMPAT_BUILD);

module.exports = {
  plugins: [<% if (typescript) { %>
    [
      '@babel/plugin-transform-typescript',
      {
        allExtensions: true,
        allowDeclareFields: true,
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
    // Can be removed if @glimmer/env isn't used in this project's dependency graph.
    [
      debugMacros,
      {
        flags: [
          {
            source: '@glimmer/env',
            flags: {
              DEBUG: true,
              CI: false,
            },
          },
        ],
      },
      '@glimmer/env stripping',
    ],
  ],

  generatorOpts: {
    compact: false,
  },
};
