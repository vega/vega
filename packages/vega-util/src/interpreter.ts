/** Utilities common to vega-interpreter and vega-expression for evaluating expresions */

// Write-side guard for object literals (contrasts with read-side DisallowedMemberProperties).
export const DisallowedObjectProperties = new Set(
  [...Object.getOwnPropertyNames(Object.prototype)
    .filter(name => typeof Object.prototype[name as keyof typeof Object.prototype] === 'function'),
  '__proto__'
  ]
);

// Read-side guard for member access (contrasts with write-side DisallowedObjectProperties).
export const DisallowedMemberProperties = new Set([
  // DOM entry points
  'ownerDocument',
  'defaultView',
  'document',
  'window',
  'cookie',
  'localStorage',
  'sessionStorage',

  // Internal implementation properties
  '_el',
  '_elBind',
  '_renderer',
  '_handler',
  '_bind',

  // DOM traversal and content access
  'parentNode',
  'parentElement',
  'innerHTML',
  'outerHTML',
  'textContent',
  'innerText',

  // Listener collections that can include DOM/window/document
  '_eventListeners',
  '_resizeListeners'
]);

/**
 * Check if a member property access should be blocked for security reasons.
 * Returns the property value if allowed, or undefined if blocked.
 * @param obj The object being accessed
 * @param prop The property name being accessed
 * @returns The property value if allowed, undefined if blocked
 */
export function shouldBlockMember(obj: any, prop: string): any {
  if (DisallowedMemberProperties.has(prop)) {
    // eslint-disable-next-line no-console
    console.error(`Property access not allowed: "${prop}"`);
    return undefined;
  }
  return obj?.[prop];
}
