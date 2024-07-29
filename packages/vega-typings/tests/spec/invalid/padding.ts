import { Padding } from 'vega';

let padding: Padding;

// @ts-expect-error
padding = null;

// @ts-expect-error
padding = 'baz';

// @ts-expect-error
padding = true;

// @ts-expect-error
padding = [0, 1, 2, 3];

// @ts-expect-error
padding = { top: 'foo', bottom: 0, left: 0, right: 0 };

// @ts-expect-error
padding = { bottom: 0, left: 0, right: 0, top: 0, extra: 1 };
