import pkg from './package.json' assert { type: 'json' }

/** @type {import('./src/types/options').RolliOptions} */
export default {
  bin: {
    externals: [/node:/, /rollup/, /utills/, ...Object.keys(pkg.dependencies)],
    replace: {
      preventAssignment: true,
      __name__: pkg.name.toUpperCase(),
      __version__: pkg.version,
    },
  },
}
