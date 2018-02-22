import { Spec, Expr } from 'vega'

// FIXME commented-out cases are due to https://github.com/Microsoft/TypeScript/issues/20863

let spec: Spec

// $ExpectError
spec = {"signals": null}

// $ExpectError
spec = {"signals": "foo"}

// $ExpectError
spec = {"signals": [{"value": 1}]}

// $ExpectError
spec = {"signals": [{"name": true, "value": 1}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "value": 1, "extra": 5}]}

// // $ExpectError
// spec = {"signals": [{"name": "foo", "update": null}]}

// // $ExpectError
// spec = {"signals": [{"name": "foo", "update": false}]}

// // $ExpectError
// spec = {"signals": [{"name": "foo", "update": 1}]}

// // $ExpectError
// spec = {"signals": [{"name": "foo", "update": {}}]}

// // $ExpectError
// spec = {"signals": [{"name": "foo", "react": null}]}

// // $ExpectError
// spec = {"signals": [{"name": "foo", "react": 1}]}

// // $ExpectError
// spec = {"signals": [{"name": "foo", "react": "string"}]}

// // $ExpectError
// spec = {"signals": [{"name": "foo", "react": {}}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": null}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": false}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": 1}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": "string"}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": {}}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": [{"events": "mousedown"}]}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": [{"events": null, "update": "1"}]}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": [{"events": false, "update": "1"}]}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": [{"events": 1, "update": "1"}]}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": [{"events": {}, "update": "1"}]}]}

// // $ExpectError
// spec = {"signals": [{"name": "foo", "on": [{"events": [], "update": "1"}]}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": [{"events": "mousedown", "encode": null}]}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": [{"events": "mousedown", "encode": false}]}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": [{"events": "mousedown", "encode": 1}]}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": [{"events": "mousedown", "encode": []}]}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": [{"events": "mousedown", "encode": {}}]}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": [{"events": "mousedown", "update": null}]}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": [{"events": "mousedown", "update": false}]}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": [{"events": "mousedown", "update": 1}]}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": [{"events": "mousedown", "update": []}]}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": [{"events": "mousedown", "update": {}}]}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": [{"events": "mousedown", "update": "1", "force": null}]}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": [{"events": "mousedown", "update": "1", "force": 1}]}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": [{"events": "mousedown", "update": "1", "force": "string"}]}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": [{"events": "mousedown", "update": "1", "force": {}}]}]}

// $ExpectError
spec = {"signals": [{"name": "foo", "on": [{"events": "mousedown", "update": "1", "force": []}]}]}

// // $ExpectError
// spec = {"signals": [{"name": "foo", "bind": null}]}

// // $ExpectError
// spec = {"signals": [{"name": "foo", "bind": false}]}

// // $ExpectError
// spec = {"signals": [{"name": "foo", "bind": 1}]}

// // $ExpectError
// spec = {"signals": [{"name": "foo", "bind": "string"}]}

// // $ExpectError
// spec = {"signals": [{"name": "foo", "bind": []}]}
