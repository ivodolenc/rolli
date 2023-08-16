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
  // Build entries (outputs match inputs)
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

**Rolli** has an integrated `auto-build` setup mode that already covers most cases, but if needed, it can be fully customized to match specific requirements.

### Config

By default, Rolli automatically detects custom configuration via the `rolli` object inside `package.json` or loads it from a separate `rolli.config.js` file.

The `rolli.config.js` file is located at the project's root and can override or extend the bundler's behavior.

All [options](./src/types/options.ts) are optional, so you only have to specify what you’d like to change.

```js
// rolli.config.js

import { defineConfig } from 'rolli'

export default defineConfig({
  // ...
})
```

Another way is to specify the `rolli` object in the `package.json` file.

This can be useful for simple static data, but note that the _.json_ format is not compatible with dynamic configuration like the _.js_ format.

```js
// package.json

{
  "rolli": {
    // ...
  }
}
```

### Custom path

Also, it is possible to set a custom config path via the cli command:

```sh
npx rolli --config my.config.js
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
