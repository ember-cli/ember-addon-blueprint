/**
 * This babel.config is only used for publishing.
 *
 * For local dev experience, see the babel.config
 *
 * rolldown.config.mjs loads it as a babel preset,
 * so it exports a function.
 */
module.exports = function () {
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
          targetFormat: 'hbs',
          transforms: [],
        },
      ],
      [
        'module:decorator-transforms',
        {
          runtime: {
            import: 'decorator-transforms/runtime-esm',
          },
        },
      ],
    ],

    generatorOpts: {
      compact: false,
    },
  };
};
