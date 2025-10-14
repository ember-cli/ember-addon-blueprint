'use strict';

module.exports = {
  printWidth: 100,
  plugins: ['prettier-plugin-ember-template-tag'],
  overrides: [
    {
      files: '*.{js,ts,mjs,mts,cjs,cts}',
      options: {
        singleQuote: true,
      },
    },
  ],
};
