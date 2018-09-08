// @flow

exports.ABS = (v) => Math.abs(v)

exports.ARRAY_CONCAT = (...a) => a.reduce((b, c) => [...b, ...c], [])

exports.ARRAY_CONTAINS = (a, c) => a.some(i => Object.keys(c).every(k => i[k] === c[k]))

exports.ARRAY_LENGTH = (a) => a.length

exports.ARRAY_SLICE = (a, b, c) => a.slice(b, c ? b + c : undefined)

exports.CEILING = (v) => Math.ceil(v)

exports.CONCAT = (...a) => a.join('')

exports.CONTAINS = (a, b) => a.includes(b)

exports.FLOOR = (v) => Math.floor(v)

exports.INDEX_OF = (a, b) => a.indexOf(b)

exports.IS_ARRAY = (v) => Array.isArray(v)

exports.IS_BOOL = (v) => typeof v === 'boolean'

exports.IS_DEFINED = (v) => typeof v !== 'undefined'

exports.IS_NULL = (v) => v === null

exports.IS_NUMBER = (v) => typeof v === 'number'

exports.IS_OBJECT = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v)

exports.IS_PRIMITIVE = (v) => exports.IS_NULL(v) || exports.IS_NUMBER(v) || exports.IS_STRING(v) || exports.IS_BOOL(v)

exports.IS_STRING = (v) => typeof v === 'string'

exports.LENGTH = (v) => v.length

exports.LOWER = (v) => v.toLowerCase()

exports.REVERSE = (v) => v.split('').reverse().join('')

exports.ROUND = (v) => Math.round(v)

exports.STARTSWITH = (a, b) => a.startsWith(b)

exports.SUBSTRING = (a, b, c) => a.substring(b, c ? b + c : undefined)

exports.ToString = (v) => typeof v === 'undefined' ? undefined : String(v)

exports.TRIM = (v) => v.trim()

exports.UPPER = (v) => v.toUpperCase()
