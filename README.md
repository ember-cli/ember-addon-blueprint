# @ember/addon-blueprint

Blueprint for scaffolding ember v2 addons

For migrating a v1 addon to a v2 addon, you may follow _[Porting Addons to V2](https://github.com/embroider-build/embroider/blob/main/PORTING-ADDONS-TO-V2.md)_ and
this blog post [Migrating an Ember addon to the next-gen v2 format
](https://www.kaliber5.de/de/blog/v2-addon_en).

> [!NOTE]
> This is not yet the default blueprint. For discussion on strategy around this becoming the default, see [the RFC](https://github.com/emberjs/rfcs/pull/985)

## Usage

```bash
pnpm dlx ember-cli@latest addon my-addon -b @ember/addon-blueprint --pnpm
```

### Options

For all these options, you'll see a warning printed from `ember-cli` about unsupported options.
`ember-cli` doesn't have a way to detect if flags are used by a blueprint.

#### `--pnpm`

Sets up the new addon with [`pnpm`](https://pnpm.io/) as a default package manager.

Example:

```bash
npx ember-cli@latest addon my-addon -b @ember/addon-blueprint --pnpm
cd my-addon
```

#### `--npm`

Sets up the new addon with `npm` as a default.

Example:

```bash
npx ember-cli@latest addon my-addon -b @ember/addon-blueprint --npm
cd my-addon
```

#### `--typescript`

Sets up the new addon with [`typescript`](https://www.typescriptlang.org/) support.

Example:

```bash
npx ember-cli@latest addon my-addon -b @ember/addon-blueprint --typescript
```

### Updating the addon

The blueprint supports `ember-cli-update` to update your addon with any changes that occurred in the blueprint since you created the addon. So to update your addons boilerplate, simply run `ember-cli-update` (or `npx ember-cli-update` if you haven't installed it globally).

For additional instructions, please consult its [documentation](https://github.com/ember-cli/ember-cli-update).

## License

This project is licensed under the [MIT License](LICENSE.md).
