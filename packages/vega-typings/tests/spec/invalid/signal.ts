import { Spec } from 'vega';

// FIXME commented-out cases are due to https://github.com/Microsoft/TypeScript/issues/20863

let spec: Spec;

// @ts-expect-error
spec = { signals: null };

// @ts-expect-error
spec = { signals: 'foo' };

// @ts-expect-error
spec = { signals: [{ value: 1 }] };

// @ts-expect-error
spec = { signals: [{ name: true, value: 1 }] };

// @ts-expect-error
spec = { signals: [{ name: 'foo', value: 1, extra: 5 }] };

// // @ts-expect-error
// spec = {"signals": [{"name": "foo", "update": null}]}

// // @ts-expect-error
// spec = {"signals": [{"name": "foo", "update": false}]}

// // @ts-expect-error
// spec = {"signals": [{"name": "foo", "update": 1}]}

// // @ts-expect-error
// spec = {"signals": [{"name": "foo", "update": {}}]}

// // @ts-expect-error
// spec = {"signals": [{"name": "foo", "react": null}]}

// // @ts-expect-error
// spec = {"signals": [{"name": "foo", "react": 1}]}

// // @ts-expect-error
// spec = {"signals": [{"name": "foo", "react": "string"}]}

// // @ts-expect-error
// spec = {"signals": [{"name": "foo", "react": {}}]}

// @ts-expect-error
spec = { signals: [{ name: 'foo', on: null }] };

// @ts-expect-error
spec = { signals: [{ name: 'foo', on: false }] };

// @ts-expect-error
spec = { signals: [{ name: 'foo', on: 1 }] };

// @ts-expect-error
spec = { signals: [{ name: 'foo', on: 'string' }] };

// @ts-expect-error
spec = { signals: [{ name: 'foo', on: {} }] };

// @ts-expect-error
spec = { signals: [{ name: 'foo', on: [{ events: 'pointerdown' }] }] };

// @ts-expect-error
spec = { signals: [{ name: 'foo', on: [{ events: null, update: '1' }] }] };

// @ts-expect-error
spec = { signals: [{ name: 'foo', on: [{ events: false, update: '1' }] }] };

// @ts-expect-error
spec = { signals: [{ name: 'foo', on: [{ events: 1, update: '1' }] }] };

// @ts-expect-error
spec = { signals: [{ name: 'foo', on: [{ events: {}, update: '1' }] }] };

// // @ts-expect-error
// spec = {"signals": [{"name": "foo", "on": [{"events": [], "update": "1"}]}]}

// @ts-expect-error
spec = { signals: [{ name: 'foo', on: [{ events: 'pointerdown', encode: null }] }] };

// @ts-expect-error
spec = { signals: [{ name: 'foo', on: [{ events: 'pointerdown', encode: false }] }] };

// @ts-expect-error
spec = { signals: [{ name: 'foo', on: [{ events: 'pointerdown', encode: 1 }] }] };

// @ts-expect-error
spec = { signals: [{ name: 'foo', on: [{ events: 'pointerdown', encode: [] }] }] };

// @ts-expect-error
spec = { signals: [{ name: 'foo', on: [{ events: 'pointerdown', encode: {} }] }] };

// @ts-expect-error
spec = { signals: [{ name: 'foo', on: [{ events: 'pointerdown', update: null }] }] };

// @ts-expect-error
spec = { signals: [{ name: 'foo', on: [{ events: 'pointerdown', update: false }] }] };

// @ts-expect-error
spec = { signals: [{ name: 'foo', on: [{ events: 'pointerdown', update: 1 }] }] };

// @ts-expect-error
spec = { signals: [{ name: 'foo', on: [{ events: 'pointerdown', update: [] }] }] };

// @ts-expect-error
spec = { signals: [{ name: 'foo', on: [{ events: 'pointerdown', update: {} }] }] };

// @ts-expect-error
spec = { signals: [{ name: 'foo', on: [{ events: 'pointerdown', update: '1', force: null }] }] };

// @ts-expect-error
spec = { signals: [{ name: 'foo', on: [{ events: 'pointerdown', update: '1', force: 1 }] }] };

// // @ts-expect-error
// spec = {
//   signals: [{ name: 'foo', on: [{ events: 'pointerdown', update: '1', force: 'string' }] }]
// };

// @ts-expect-error
spec = { signals: [{ name: 'foo', on: [{ events: 'pointerdown', update: '1', force: {} }] }] };

// @ts-expect-error
spec = { signals: [{ name: 'foo', on: [{ events: 'pointerdown', update: '1', force: [] }] }] };

// // @ts-expect-error
// spec = {"signals": [{"name": "foo", "bind": null}]}

// // @ts-expect-error
// spec = {"signals": [{"name": "foo", "bind": false}]}

// // @ts-expect-error
// spec = {"signals": [{"name": "foo", "bind": 1}]}

// // @ts-expect-error
// spec = {"signals": [{"name": "foo", "bind": "string"}]}

// // @ts-expect-error
// spec = {"signals": [{"name": "foo", "bind": []}]}
