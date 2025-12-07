// Helper type guard to check if a property name corresponds to a function on Object.prototype
function isObjectPrototypeFunction(name: string): boolean {
  // Use Record<string, unknown> to enable dynamic property access on Object.prototype
  // This is safe because we're only checking the type, not calling or modifying anything
  const proto = Object.prototype as Record<string, unknown>;
  return typeof proto[name] === 'function';
}

export const DisallowedObjectProperties = new Set(
  [...Object.getOwnPropertyNames(Object.prototype)
    .filter(isObjectPrototypeFunction),
  '__proto__'
  ]
);
