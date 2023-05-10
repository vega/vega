import { AutoSizeType } from 'vega';

let autosize: AutoSizeType;

// @ts-expect-error
autosize = null;

// @ts-expect-error
autosize = false;

// @ts-expect-error
autosize = 'foo';

// @ts-expect-error
autosize = {};

// @ts-expect-error
autosize = 100;
