'use strict';

const { sortPackageJson } = require('sort-package-json');

let date = new Date();

const description = 'The default blueprint for Embroider v2 addons.';

function stringifyAndNormalize(contents) {
  return `${JSON.stringify(contents, null, 2)}\n`;
}

const replacers = {
  'package.json'(locals, content) {
    return this.updatePackageJson(locals, content);
  },
};

module.exports = {
  description,

  fileMapTokens(options) {
    let { ext } = options.locals;

    return {
      __ext__: () => ext,
    };
  },

  locals(options) {
    if (isYarn(options)) {
      throw new Error(
        `Please do not generate this project with --yarn. Omit '--yarn' when generating this blueprint'`,
      );
    }

    // noBuild doesn't exist because of how ember-cli normalizes args
    let noBuild = options.build === false;

    return {
      name: options.name,
      blueprintVersion: require('./package.json').version,
      year: date.getFullYear(),
      packageManager: options.packageManager,
      yarn: false,
      pnpm: isPnpm(options),
      npm: isNpm(options),
      runScript: isPnpm(options) ? 'pnpm' : 'npm run',
      typescript: options.typescript,
      ext: options.typescript ? 'ts' : 'js',
      blueprint: 'addon',
      blueprintOptions: buildBlueprintOptions({
        [`--ci-provider=${options.ciProvider}`]: options.ciProvider,
        '--pnpm': isPnpm(options),
        '--npm': isNpm(options),
        '--typescript': options.typescript,
        '--no-build': options.noBuild,
      }),
      ciProvider: options.ciProvider,
      noBuild,
      hasBuild: !noBuild,
    };
  },

  files(options) {
    let files = this._super.files.apply(this, arguments);

    if (options.ciProvider !== 'github') {
      files = files.filter((file) => file.indexOf('.github') < 0);
    }

    if (!isPnpm(options)) {
      let ignoredFiles = ['pnpm-workspace.yaml'];

      files = files.filter((filename) => !ignoredFiles.includes(filename));
    }

    if (!options.typescript) {
      let ignoredFiles = ['tsconfig.json'];

      files = files.filter(
        (filename) => !filename.match(/.*\.ts$/) && !ignoredFiles.includes(filename),
      );
    }

    if (options.noBuild) {
      files = files.filter((filename) => {
        if (filename.endsWith('rollup.config.mjs')) return false;
        if (filename.endsWith('babel.publish.config.cjs')) return false;
        if (filename.endsWith('tsconfig.publish.json')) return false;

        return true;
      });
    }

    return files;
  },

  updatePackageJson(locals, content) {
    let contents = JSON.parse(content);

    if (locals.noBuild) {
      let extSuffix = locals.typescript ? 'ts' : 'js';

      contents.exports = {
        '.': `./src/index.${extSuffix}`,
        './addon-main.js': './addon-main.cjs',
        './*': './src/*',
        './*.css': './src/*.css',
      };

      delete contents.scripts.build;
      delete contents.scripts.prepack;
      delete contents.devDependencies['@embroider/addon-dev'];
      delete contents.devDependencies['@ember/library-tsconfig'];
      delete contents.devDependencies['@rollup/plugin-babel'];
      delete contents.devDependencies['rollup'];
    }

    let sorted = sortPackageJson(contents);
    let normalized = stringifyAndNormalize(sorted);
    return normalized;
  },

  /**
   * @override
   *
   * This modification of buildFileInfo allows our differing
   * input files to output to a single file, depending on the options.
   * For example:
   *
   *   for javascript,
   *     _ts_eslint.config.mjs is deleted
   *     _js_eslint.config.mjs is renamed to eslint.config.mjs
   *
   *   for typescript,
   *     _js_eslint.config.mjs is deleted
   *     _ts_eslint.config.mjs is renamed to eslint.config.mjs
   */
  buildFileInfo(_intoDir, locals, file, _commandOptions) {
    let fileInfo = this._super.buildFileInfo.apply(this, arguments);

    if (file in replacers) {
      fileInfo.replacer = replacers[file].bind(this, locals);
    }

    return fileInfo;
  },
};

function buildBlueprintOptions(blueprintOptions) {
  let blueprintOptionsFiltered = Object.keys(blueprintOptions).filter((option) => {
    return Boolean(blueprintOptions[option]);
  });

  if (blueprintOptionsFiltered.length > 0) {
    return (
      `\n            ` +
      blueprintOptionsFiltered.map((option) => `"${option}"`).join(',\n            ') +
      `\n          `
    );
  }

  return '';
}

// These methods exist because in ember-cli 5.4, package manager handling
// had changed to solely use the packageManager key, however
// prior to ember-cli 5.4, pnpm, yarn, and npm, had their own booleans on
// the options object.
function isPnpm(options) {
  return options.packageManager === 'pnpm' || options.pnpm;
}

function isYarn(options) {
  return options.packageManager === 'yarn' || options.yarn;
}

function isNpm(options) {
  return options.packageManager === 'npm' || options.npm;
}
