import { NumericValueRef } from 'vega';

let numRef: NumericValueRef;

// An empty object is not a valid numeric value ref — there is no base value
// @ts-expect-error
numRef = {};

// Modifier-only objects are not valid — a base value (field/signal/value/offset/etc.) is required
// @ts-expect-error
numRef = { mult: 2 };

// @ts-expect-error
numRef = { exponent: 2 };

// @ts-expect-error
numRef = { round: true };
