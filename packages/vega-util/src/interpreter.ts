/** Utilities common to vega-interpreter and vega-expression for evaluating expresions */

/**
 * JSON authors are not allowed to set these properties. Most are function-valued members of the JS
 * Object prototype and should not be overridden; `__proto__` and `then` are listed explicitly
 * because they are not, but are still given special treatment by the language (`__proto__` as an
 * accessor for the prototype, `then` by the thenable protocol during promise resolution).
 */
export const DisallowedObjectProperties = new Set(
  [...Object.getOwnPropertyNames(Object.prototype)
    .filter(name => typeof Object.prototype[name as keyof typeof Object.prototype] === 'function'),
  '__proto__',
  'then'
  ]
);
