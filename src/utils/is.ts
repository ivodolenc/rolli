export const toString = (v: any): string =>
  Object.prototype.toString.call(v).slice(8, -1)

export const isString = (v: any): v is string => typeof v === 'string'

export const isObject = (v: any): v is object => toString(v) === 'Object'
