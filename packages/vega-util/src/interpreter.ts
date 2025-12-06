export const DisallowedObjectProperties = new Set(
  [...Object.getOwnPropertyNames(Object.prototype)
    .filter(name => typeof Object.prototype[name as keyof Object] === 'function'),
  '__proto__'
  ]
);
