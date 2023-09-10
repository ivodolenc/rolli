export interface Hooks {
  ['rolli:start']?: () => Promise<void>
  ['rolli:build:start']?: () => Promise<void>
  ['rolli:build:end']?: () => Promise<void>
  ['rolli:end']?: () => Promise<void>
}
