'use strict';

const { sortPackageJson } = require('sort-package-json');

let date = new Date();

const description = 'The default blueprint for Embroider v2 addons.';

function stringifyAndNormalize(contents) {
  return `${JSON.stringify(contents, null, 2)}\n`;
}

const replacers = {
  'package.json'(content) {
    return this.updatePackageJson(content);
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

    return {
      name: options.name,
      blueprintVersion: require('./package.json').version,
      year: date.getFullYear(),
      packageManager: options.packageManager,
      yarn: false,
      pnpm: isPnpm(options),
      npm: isNpm(options),
      typescript: options.typescript,
      ext: options.typescript ? 'ts' : 'js',
      blueprint: 'addon',
      blueprintOptions: buildBlueprintOptions({
        [`--ci-provider=${options.ciProvider}`]: options.ciProvider,
        '--pnpm': isPnpm(options),
        '--npm': isNpm(options),
        '--typescript': options.typescript,
      }),
      ciProvider: options.ciProvider,
    };
  },

  files(options) {
    let files = this._super.files.apply(this, arguments);

    if (options.ciProvider !== 'github') {
      files = files.filter((file) => file.indexOf('.github') < 0);
    }

    if (!options.typescript) {
      let ignoredFiles = ['tsconfig.json'];

      files = files.filter(
        (filename) => !filename.match(/.*\.ts$/) && !ignoredFiles.includes(filename),
      );
    }

    return files;
  },

  updatePackageJson(content) {
    let contents = JSON.parse(content);
    return stringifyAndNormalize(sortPackageJson(contents));
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
  buildFileInfo(_intoDir, _templateVariables, file, _commandOptions) {
    let fileInfo = this._super.buildFileInfo.apply(this, arguments);

    if (file in replacers) {
      fileInfo.replacer = replacers[file].bind(this);
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
