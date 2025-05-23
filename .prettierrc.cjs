'use strict';

module.exports = {
  printWidth: 100,
  overrides: [
    {
      files: '*.{js,ts,mjs,mts,cjs,cts}',
      options: {
        singleQuote: true,
      },
    },
  ],
};
