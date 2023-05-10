import { Spec } from 'vega';

// FIXME commented-out cases are due to https://github.com/Microsoft/TypeScript/issues/20863

// let spec: Spec

// // @ts-expect-error
// spec = {
//   "signals": [
//     {"name": "foo", "value": 1}
//   ],
//   "marks": [
//     {
//       "type": "group",
//       "signals": [
//         {
//           "name": "foo",
//           "push": "outer",
//           "value": 2
//         }
//       ]
//     }
//   ]
// }

// // @ts-expect-error
// spec = {
//   "signals": [
//     {"name": "foo", "value": 1}
//   ],
//   "marks": [
//     {
//       "type": "group",
//       "signals": [
//         {
//           "name": "foo",
//           "push": "outer",
//           "update": "2"
//         }
//       ]
//     }
//   ]
// }

// // @ts-expect-error
// spec = {
//   "signals": [
//     {"name": "foo", "value": 1}
//   ],
//   "marks": [
//     {
//       "type": "group",
//       "signals": [
//         {
//           "name": "foo",
//           "push": "outer",
//           "bind": {"type": "text"}
//         }
//       ]
//     }
//   ]
// }

// // @ts-expect-error
// spec = {
//   "signals": [
//     {"name": "foo", "value": 1}
//   ],
//   "marks": [
//     {
//       "type": "group",
//       "signals": [
//         {
//           "name": "foo",
//           "push": "outer",
//           "react": false
//         }
//       ]
//     }
//   ]
// }
