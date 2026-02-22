/** Utilities common to vega-interpreter and vega-expression for evaluating expresions */

// Write-side guard for object literals (contrasts with read-side DisallowedMemberProperties).
export const DisallowedObjectProperties = new Set(
  [...Object.getOwnPropertyNames(Object.prototype)
    .filter(name => typeof Object.prototype[name as keyof typeof Object.prototype] === 'function'),
  '__proto__'
  ]
);

// Allowlist of event properties that expressions may access.
// Properties NOT on this list are blocked when accessed on non-datum objects.
// This is a default-deny approach: new browser APIs are blocked automatically.
export const AllowedEventProperties = new Set([
  // Mouse/touch position
  'clientX', 'clientY', 'pageX', 'pageY', 'screenX', 'screenY',
  'offsetX', 'offsetY', 'movementX', 'movementY',
  // Keyboard
  'key', 'code', 'keyCode', 'charCode',
  // Modifier keys
  'altKey', 'ctrlKey', 'shiftKey', 'metaKey',
  // Mouse buttons
  'button', 'buttons', 'detail', 'which',
  // Wheel/scroll
  'deltaX', 'deltaY', 'deltaZ', 'deltaMode',
  'wheelDelta', 'wheelDeltaX', 'wheelDeltaY',
  // Touch events
  'touches', 'changedTouches', 'targetTouches',
  // Pointer events
  'pointerId', 'pointerType', 'pressure', 'width', 'height',
  'tiltX', 'tiltY', 'twist', 'isPrimary',
  // Event metadata
  'type', 'timeStamp', 'bubbles', 'cancelable', 'composed',
  'eventPhase', 'isTrusted', 'repeat',
  // Vega-specific extensions (added by events-extend.js)
  'vega', 'item', 'dataflow',
]);
