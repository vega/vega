import { Padding } from 'vega'

let padding: Padding

// $ExpectError
padding = null

// $ExpectError
padding = "baz"

// $ExpectError
padding = true

// $ExpectError
padding = [0, 1, 2, 3]

// $ExpectError
padding = {"top": "foo", "bottom": 0, "left": 0, "right": 0}

// $ExpectError
padding = {"bottom": 0, "left": 0, "right": 0, "top": 0, "extra": 1}
