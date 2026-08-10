/** Utilities common to vega-interpreter and vega-expression for evaluating expresions */

/**
 * Properties JSON authors may not set. Most are function-valued members of
 * Object.prototype; `__proto__` and `then` are listed explicitly because they
 * are not, but the language still treats them specially.
 */
export const DisallowedObjectProperties = new Set(
  [...Object.getOwnPropertyNames(Object.prototype)
    .filter(name => typeof Object.prototype[name as keyof typeof Object.prototype] === 'function'),
  '__proto__',
  'then'
  ]
);
