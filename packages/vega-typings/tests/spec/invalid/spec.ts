import { Spec } from 'vega';

let spec: Spec;

// @ts-expect-error
spec = { background: null };

// @ts-expect-error
spec = { background: false };

// @ts-expect-error
spec = { background: 100 };

// @ts-expect-error
spec = { width: null };

// @ts-expect-error
spec = { width: true };

// @ts-expect-error
spec = { width: 'foo' };

// @ts-expect-error
spec = { width: {} };

// @ts-expect-error
spec = { height: null };

// @ts-expect-error
spec = { height: true };

// @ts-expect-error
spec = { height: 'foo' };

// @ts-expect-error
spec = { height: {} };

// @ts-expect-error
spec = { $schema: null };

// @ts-expect-error
spec = { $schema: false };

// @ts-expect-error
spec = { $schema: 100 };

// @ts-expect-error
spec = { $schema: {} };

// @ts-expect-error
spec = { description: null };

// @ts-expect-error
spec = { description: false };

// @ts-expect-error
spec = { description: 100 };
