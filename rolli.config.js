import pkg from './package.json' assert { type: 'json' }

export default {
  replace: {
    __name__: pkg.name.toUpperCase(),
    __version__: pkg.version,
  },
}
