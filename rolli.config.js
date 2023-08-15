import pkg from './package.json' assert { type: 'json' }

/** @type import('./src/types/options').RolliOptions */
export default {
  replace: {
    preventAssignment: true,
    __name__: pkg.name.toUpperCase(),
    __version__: pkg.version,
  },
}
