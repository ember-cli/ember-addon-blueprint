/**
 * Debugging:
 *   https://eslint.org/docs/latest/use/configure/debug
 *  ----------------------------------------------------
 *
 *   Print a file's calculated configuration
 *
 *     npx eslint --print-config path/to/file.js
 *
 *   Inspecting the config
 *
 *     npx eslint --inspect-config
 *
 */
import babelParser from '@babel/eslint-parser';
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import emberTemplateLintMigration from 'eslint-plugin-ember/configs/template-lint-migration';
import ember, { hbsParser } from 'eslint-plugin-ember/recommended';
import { importX } from 'eslint-plugin-import-x';
import n from 'eslint-plugin-n';
import globals from 'globals';<% if (typescript) { %>
import ts from 'typescript-eslint';<% } %>

// Only the plugin and its rules: ember.configs.gjs/gts set up the parsers, and
// the preset's own `**/*.{gjs,gts}` block would make JavaScript addons lint
// the demo app's .gts files.
const templateRules = emberTemplateLintMigration.filter(
  (config) => !config.files,
);

const esmParserOptions = {
  ecmaFeatures: { modules: true },
  ecmaVersion: 'latest',
};
<% if (typescript) { %>
const tsParserOptions = {
  projectService: true,
  tsconfigRootDir: import.meta.dirname,
};
<% } %>
export default defineConfig([
  globalIgnores(['dist/', 'dist-*/', 'declarations/', 'coverage/', '!**/.*']),
  js.configs.recommended,
  prettier,
  ember.configs.base,
  ember.configs.gjs,<% if (typescript) { %>
  ember.configs.gts,<% } %>
  ...templateRules,
  /**
   * https://eslint.org/docs/latest/use/configure/configuration-files#configuring-linter-options
   */
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      parser: babelParser,
    },
  },
  {
    files: ['**/*.hbs'],
    languageOptions: {
      parser: hbsParser,
    },
  },
  {
    files: ['**/*.{js,gjs}'],
    languageOptions: {
      parserOptions: esmParserOptions,
      globals: {
        ...globals.browser,
      },
    },
  },<% if (typescript) { %>
  {
    files: ['**/*.{ts,gts}'],
    languageOptions: {
      parser: ember.parser,
      parserOptions: tsParserOptions,
      globals: {
        ...globals.browser,
      },
    },
    extends: [
      ...ts.configs.recommendedTypeChecked,
      // https://github.com/ember-cli/ember-addon-blueprint/issues/119
      {
        ...ts.configs.eslintRecommended,
        files: undefined,
      },
      ember.configs.gts,
    ],
  },<% } %>
  {
    files: ['src/**/*'],
    plugins: {
      'import-x': importX,
    },
    rules: {
      // require relative imports use full extensions
      'import-x/extensions': ['error', 'always', { ignorePackages: true }],
    },
  },
  /**
   * CJS node files
   */
  {
    files: ['**/*.cjs'],
    plugins: {
      n,
    },

    languageOptions: {
      sourceType: 'script',
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
      },
    },
  },
  /**
   * ESM node files
   */
  {
    files: ['**/*.mjs'],
    plugins: {
      n,
    },

    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      parserOptions: esmParserOptions,
      globals: {
        ...globals.node,
      },
    },
  },
]);
