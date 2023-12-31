<p align="center">
  <img src=".assets/cover.gif" alt="" />
</p>

<h1 align="center">Rolli</h1>

<p align="center">A zero-config module bundler.</p>

<p align="center">
  <sub><a href="https://github.com/ivodolenc/rolli">Repository</a> | <a href="https://www.npmjs.com/package/rolli">Package</a> | <a href="https://github.com/ivodolenc/rolli/releases">Releases</a> | <a href="https://github.com/ivodolenc/rolli/discussions">Discussions</a></sub>
</p>

<pre align="center">npm i -D rolli</pre>

<br>

## Features

- Smart automatic bundler
- Built-in ESM & TS support
- Allows advanced customization
- Provides a powerful hooking system
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

By default, Rolli automatically detects custom configuration via the `rolli.config.js` file or the `rolli` object inside `package.json`.

The `rolli.config.js` file is located at the project's root and can override or extend the bundler's behavior.

```js
// rolli.config.js

import { defineConfig } from 'rolli'

export default defineConfig({
  // ...
})
```

### Config path

Also, it is possible to set a custom config path via the cli command:

```sh
npx rolli --config my.config.js
```

## Custom Setup

Sometimes it is necessary to manually set the build entries or include extra files that can't be specified via the auto-build _exports_ or _bin_ modes.

Rolli provides an additional custom-build `entries` mode that allows you to tweak the settings for each object individually.

This is very powerful and flexible mode since it can be used in combination with the auto-build modes, but also as a fully manual setup.

```js
// rolli.config.js

import { defineConfig } from 'rolli'

export default defineConfig({
  entries: [
    {
      input: './src/index.ts',
      output: './dist/index.mjs',
    },
    {
      input: './src/types/index.ts',
      output: './dist/types.d.ts',
      externals: ['id-1', 'id-2', /regexp/],
    },
    {
      input: './src/cli/index.js',
      output: './dist/cli.cjs',
      format: 'cjs',
      replace: {
        preventAssignment: true,
        __name__: 'custom-name',
        __version__: '1.0.0',
      },
    },
    {
      input: './src/utils/index.ts',
      output: './dist/utils/index.mjs',
      json: true,
      resolve: true,
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

### exports

- Type: `object | false`
- Default: `enabled`

Specifies the auto-build `exports` mode (node subpath [exports](https://nodejs.org/api/packages.html#subpath-exports)).

This is enabled by default so any additional customization is optional.

When enabled, it automatically parses and bundles all entries that are defined via the _exports_ object in the _package.json_ file.

All defined _output_ paths automatically match _input_ `.js` or `.ts` paths. The _input_ directory is specified by the `srcDir` option.

```js
// rolli.config.js

export default defineConfig({
  exports: {
    // all options are optional
    srcDir: 'src',
    externals: ['id-1', 'id-2', /regexp/],
    minify: false,
    tsconfig: 'tsconfig.custom.json',
    // ...
  },
})
```

#### matcher

- Path Syntax: `./[srcDir]/[filename].[js,ts]`

The `matcher` basically parses all output paths and replaces `filename` with the user's custom value.

```js
export default defineConfig({
  exports: {
    matcher: {
      types: 'dts', // renames all 'types' inputs to 'dts.ts'
      import: 'esm', // renames all 'import' inputs to 'esm.{js,ts}'
      require: 'cjs', // renames all 'require' inputs to 'cjs.{js,ts}'
    },
  },
})
```

So now all input paths, including recursive ones, will be accordingly matched.

```js
// package.json
{
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts", // matches the input './src/types/dts.ts'
      "import": "./dist/index.mjs", // matches the input './src/esm.{js,ts}'
      "require": "./dist/index.cjs", // matches the input './src/cjs.{js,ts}'
    },
    "./path": {
      "types": "./dist/types/path/index.d.ts", // matches the input './src/types/path/dts.ts'
      "import": "./dist/path/index.mjs", // matches the input './src/path/esm.{js,ts}'
      "require": "./dist/path/index.cjs", // matches the input './src/path/cjs.{js,ts}'
    },
    // ...
  },
}
```

#### plugins

Default plugin system is quite powerful, but if needed, it can be easily extended via the `plugins` option.

The `plugins` option accepts an array of plugins.

```js
export default defineConfig({
  exports: {
    plugins: [
      plugin1(),
      plugin2(),
      // ...
    ],
  },
})
```

Or it can be an object that explicitly defines when user plugins will run, before or after the default ones.

```js
export default defineConfig({
  exports: {
    plugins: {
      start: [plugin1()], // runs 'before' the default plugins
      end: [plugin2()], // runs 'after' the default plugins
    },
  },
})
```

#### exclude

It is possible to exclude certain paths from the auto-build mode.

The `exclude` option accepts an array of strings, which are essentially paths, or an array of objects that can individually control path's _types_, _import_ or _require_ options.

```js
export default defineConfig({
  exports: {
    exclude: [
      '.', // excludes the entire path
      './path', // excludes the entire path
      { path: './path-2', types: true }, // excludes types only
      { path: './path-3', import: true, require: true }, // excludes esm and cjs
      { path: './path-4', require: true }, // excludes cjs only
      // ...
    ],
  },
})
```

To disable the mode completely, set it to `false`.

```js
export default defineConfig({
  exports: false,
})
```

### bin

- Type: `object | false`
- Default: `enabled`

Specifies the auto-build `bin` mode ([executable](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#bin) files).

This is enabled by default so any additional customization is optional.

When enabled, it automatically parses and bundles all entries that are defined via the _bin_ object in the _package.json_ file.

All defined _output_ paths automatically match _input_ `.js` or `.ts` paths. The _input_ directory is specified by the `srcDir` option.

Each compiled _bin_ file will have a `#!/usr/bin/env node` inserted at the very beginning.

```js
// rolli.config.js

export default defineConfig({
  bin: {
    // all options are optional
    srcDir: 'src',
    externals: ['id-1', 'id-2', /regexp/],
    minify: false,
    tsconfig: 'tsconfig.custom.json',
    // ...
  },
})
```

#### matcher

- Path Syntax: `./[srcDir]/[filename].[js,ts]`

The `matcher` basically parses all output paths and replaces `filename` with the user's custom value.

```js
export default defineConfig({
  bin: {
    matcher: 'cli', // renames all inputs to 'cli.{js,ts}'
  },
})
```

So now all input paths, including recursive ones, will be accordingly matched.

```js
// package.json
{
  "bin": {
    "command": "./dist/cli/index.mjs", // matches the input './src/cli/cli.{js,ts}'
    "command2": "./dist/cli/dir/index.cjs", // matches the input './src/cli/dir/cli.{js,ts}'
    // ...
  }
}
```

#### plugins

Default plugin system is quite powerful, but if needed, it can be easily extended via the `plugins` option.

The `plugins` option accepts an array of plugins.

```js
export default defineConfig({
  bin: {
    plugins: [
      plugin1(),
      plugin2(),
      // ...
    ],
  },
})
```

Or it can be an object that explicitly defines when user plugins will run, before or after the default ones.

```js
export default defineConfig({
  bin: {
    plugins: {
      start: [plugin1()], // runs 'before' the default plugins
      end: [plugin2()], // runs 'after' the default plugins
    },
  },
})
```

#### exclude

It is possible to exclude certain paths from the auto-build mode.

The `exclude` option accepts an array of strings, which are essentially command names.

```js
export default defineConfig({
  bin: {
    exclude: [
      'command', // excludes the path by command name
      // ...
    ],
  },
})
```

To disable the mode completely, set it to `false`.

```js
export default defineConfig({
  bin: false,
})
```

### entries

- Type: `object[]`
- Default: `undefined`

Specifies the custom-build `entries` mode.

It allows you to manually set all build entries and adjust options for each object individually.

Defined entries can be used with auto-build modes or separately, depending on preference. In each object, only `input` and `output` are required, all other options are optional.

```js
// rolli.config.js

export default defineConfig({
  entries: [
    {
      // only 'input' and 'output' are required
      input: './src/index.ts',
      output: './dist/index.mjs',
      // ...
    },
    // ...
  ],
})
```

To use fully custom-build mode, disable auto-build modes and specify the entries as needed:

```js
export default defineConfig({
  // auto-build modes will be ignored
  exports: false,
  bin: false,
  // only custom entries will be compiled
  entries: [
    // ...
  ],
})
```

#### plugins

Default plugin system is quite powerful, but if needed, it can be easily extended via the `plugins` option.

The `plugins` option accepts an array of plugins.

```js
export default defineConfig({
  entries: [
    {
      input: './src/index.ts',
      output: './dist/index.mjs',
      plugins: [
        plugin1(),
        plugin2(),
        // ...
      ],
    },
  ],
})
```

Or it can be an object that explicitly defines when user plugins will run, before or after the default ones.

```js
export default defineConfig({
  entries: [
    {
      input: './src/index.ts',
      output: './dist/index.mjs',
      plugins: {
        start: [plugin1()], // runs 'before' the default plugins
        end: [plugin2()], // runs 'after' the default plugins
      },
    },
  ],
})
```

### hooks

- Type: `object`
- Default: `undefined`

Provides a powerful hooking system to further expand build modes.

List of available [hooks](./src/types/hooks.ts):

- `rolli:start`
- `rolli:build:start`
- `rolli:build:end`
- `rolli:end`

```js
// rolli.config.js

export default defineConfig({
  hooks: {
    'rolli:start': () => {
      // ...
    },
    'rolli:end': async () => {
      // ...
    },
  },
})
```

### minify

- Type: `boolean`
- Default: `undefined`

Minifies all bundle assets for production.

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

Sets a custom TypeScript configuration for the entire bundle.

If not defined, it uses the main _tsconfig.json_ file from the project's root.

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
