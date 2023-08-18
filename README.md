# Rolli

A zero-config module bundler.

<sub><a href="https://github.com/ivodolenc/rolli">Repository</a> | <a href="https://www.npmjs.com/package/rolli">Package</a> | <a href="https://github.com/ivodolenc/rolli/releases">Releases</a> | <a href="https://github.com/ivodolenc/rolli/discussions">Discussions</a></sub>

```sh
npm i -D rolli
```

## Features

- Smart automatic bundler
- Built-in ESM & TS support
- Allows advanced customization
- Exports fully optimized code
- Auto-handles node hashbangs
- Prints useful bundle stats
- Follows modern practice
- Super easy to use

## Intro

**Rolli** allows you to easily bundle your projects with _zero-config_ setup by extending the latest [Rollup](https://github.com/rollup/rollup) features and powerful plugins.

It automatically detects your options and infers build entries, so all you need is a basic npm package setup.

Also, it's possible to fully customize all aspects of the build setup as needed.

## Quick Start

1. Update your `package.json` to follow modern npm rules:

```js
{
  "type": "module",
  // Build entries
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts", // matches the input './src/types/index.ts'
      "import": "./dist/index.mjs", // matches the input './src/index.{js,ts}'
      "require": "./dist/index.cjs", // matches the input './src/index.{js,ts}'
    },
    "./path": {
      "types": "./dist/types/path/index.d.ts", // matches the input './src/types/path/index.ts'
      "import": "./dist/path/index.mjs", // matches the input './src/path/index.{js,ts}'
      "require": "./dist/path/index.cjs", // matches the input './src/path/index.{js,ts}'
    },
    // ...
  },
  // Node hashbangs (optional)
  "bin": {
    "command": "./dist/cli/index.mjs", // matches the input './src/cli/index.{js,ts}'
    // ...
  }
}
```

> [!NOTE]\
> Output paths from the `./dist` dir automatically match input paths from the `./src` dir.

2. When you're ready to build, simply run the command:

```sh
npx rolli
```

That's it!

## Customization

**Rolli** has integrated `auto-build` setup modes that already covers most cases, but if needed, it can be fully customized to match specific requirements.

### Config

By default, Rolli automatically detects custom configuration via the `rolli` object inside `package.json` or loads it from a separate `rolli.config.js` file.

The `rolli.config.js` file is located at the project's root and can override or extend the bundler's behavior.

```js
// rolli.config.js

import { defineConfig } from 'rolli'

export default defineConfig({
  // ...
})
```

Another way is to specify the `rolli` object in the `package.json` file.

This can be useful for simple static data, but keep in mind that the _.json_ format is not compatible with dynamic configuration like the _.js_ format.

```js
// package.json

{
  "rolli": {
    // ...
  }
}
```

### Config path

Also, it is possible to set a custom config path via the cli command:

```sh
npx rolli --config my.config.js
```

## Custom Setup

Sometimes it is necessary to manually set the build entries or include extra files that can't be specified via the _exports_ or _bin_ options.

Rolli provides an additional `entries` build mode that allows you to tweak the settings for each object separately. This is very powerful and flexible mode since it can be used in combination with the auto-build modes, but also as a fully manual setup.

```js
// rolli.config.js

import { defineConfig } from 'rolli'

export default defineConfig({
  entries: [
    {
      // 'input' and 'output' are required, all other options are optional
      input: './src/index.ts',
      output: './dist/index.mjs',
    },
    {
      input: './src/types/index.ts',
      output: './dist/types.d.ts',
      externals: ['id-1', 'id-2', 'id-3'],
    },
    {
      input: './src/cli/index.js',
      output: './dist/cli.cjs',
      format: 'cjs',
      replace: {
        __name__: 'custom-name',
        __version__: '1.0.0',
      },
      // ...
    },
    // ...
  ],
})
```

## Options

All [options](./src/types/options.ts) are optional, so you only have to specify what you’d like to change.

Also, you can see the current Rolli configuration in the terminal by simply running the CLI command:

```sh
npx rolli --print-config
```

### srcDir

- Type: `string`
- Default: `src`

Specifies the _source_ directory where all `input` files are located.

```js
// rolli.config.js

export default defineConfig({
  srcDir: 'source',
})
```

### exports

- Type: `false`
- Default: `enabled`

Specifies the auto-build `exports` mode.

When enabled, it automatically parses and bundles all entries that are defined in the _package.json_ file via the _exports_ object (node subpath [exports](https://nodejs.org/api/packages.html#subpath-exports)).

All defined _output_ paths are automatically matched with _input_ paths. The _input_ directory is specified by the `srcDir` option.

To disable the option completely, set it to `false`.

```js
// rolli.config.js

export default defineConfig({
  exports: false,
})
```

### bin

- Type: `false`
- Default: `enabled`

Specifies the auto-build `bin` mode.

When enabled, it automatically parses and bundles all entries that are defined in the _package.json_ file via the _bin_ object ([executable](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#bin) files).

By default, each compiled _bin_ file will have a `#!/usr/bin/env node` inserted at the very beginning.

To disable the option completely, set it to `false`.

```js
// rolli.config.js

export default defineConfig({
  bin: false,
})
```

### entries

- Type: `object[]`
- Default: `undefined`

Specifies the custom `entries` mode.

It allows you to manually set all build entries and adjust [options](./src/types/options.ts) for each object separately.

Defined entries can be used with auto-build modes or separately, depending on preference. In each object, only `input` and `output` options are required, all others are optional.

```js
// rolli.config.js

export default defineConfig({
  entries: [
    {
      input: './src/index.ts',
      output: './dist/index.mjs',
    },
    // ...
  ],
})
```

### externals

- Type: `(string | RegExp)[]`
- Default: `package.dependencies`

Specifies module IDs that should remain external to the bundle. Accepts an array of _strings_ or _regular expressions_.

By default, _externals_ are automatically inferred from _package.json_ file via _dependencies_ object. Note that manual entry overwrites the default IDs so you must re-enter any dependencies you wish to exclude.

```js
// rolli.config.js

export default defineConfig({
  externals: [
    'package-name',
    /RegExp/,
    // ...
  ],
})
```

### minify

- Type: `boolean`
- Default: `undefined`

Minifies bundle assets for production.

```js
// rolli.config.js

export default defineConfig({
  minify: true,
})
```

It can also be specified via the CLI command:

```sh
npx rolli --minify
```

### tsconfig

- Type: `string`
- Default: `undefined`

Sets a custom TypeScript configuration.

```js
// rolli.config.js

export default defineConfig({
  tsconfig: 'tsconfig.custom.json',
})
```

It can also be specified via the CLI command:

```sh
npx rolli --tsconfig tsconfig.custom.json
```

## CLI

Check all available CLI commands:

```sh
npx rolli --help
```

## Community

Feel free to use the official [discussions](https://github.com/ivodolenc/rolli/discussions) for any additional questions.

## License

Developed in 🇭🇷 Croatia

Released under the [MIT](LICENSE.txt) license.

© Ivo Dolenc
