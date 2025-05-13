# @ember/addon-blueprint

Blueprint for scaffolding ember v2 addons

For migrating a v1 addon to a v2 addon, you may follow _[Porting Addons to V2](https://github.com/embroider-build/embroider/blob/main/PORTING-ADDONS-TO-V2.md)_ and
this blog post [Migrating an Ember addon to the next-gen v2 format
](https://www.kaliber5.de/de/blog/v2-addon_en).

## WIP

This is still work in progress but we are aiming for this to be the new default for when someone generates an addon with `ember addon super-addon-name`. This will need an RFC to change the default but if you notice anything that you would like to be imporoved with this blueprint please open an issue to discuss, you don't need to wait for the RFC process to give us feedback. 

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
