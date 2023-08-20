import { jsConfig, tsConfig, ignoresConfig } from 'configshare/eslint'

export default [
  jsConfig,
  tsConfig,
  ignoresConfig,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { ignoreRestSiblings: true },
      ],
    },
  },
]
