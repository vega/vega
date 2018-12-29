import { AutoSizeType } from 'vega';

let autosize: AutoSizeType

// $ExpectError
autosize = null

// $ExpectError
autosize = false

// $ExpectError
autosize = "foo"

// $ExpectError
autosize = {}

// $ExpectError
autosize = 100
