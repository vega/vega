/** Utilities common to vega-interpreter and vega-expression for evaluating expresions */

/** JSON authors are not allowed to set these properties, as these are built-in to the JS Object Prototype and should not be overridden. */
export const DisallowedObjectProperties = new Set(
  [...Object.getOwnPropertyNames(Object.prototype)
    .filter(name => typeof Object.prototype[name] === 'function'),
  '__proto__'
  ]
);
