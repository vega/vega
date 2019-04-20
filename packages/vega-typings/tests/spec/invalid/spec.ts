import { Spec } from 'vega'

let spec: Spec

// $ExpectError
spec = {"background": null}

// $ExpectError
spec = {"background": false}

// $ExpectError
spec = {"background": 100}

// $ExpectError
spec = {"width": null}

// $ExpectError
spec = {"width": true}

// $ExpectError
spec = {"width": "foo"}

// $ExpectError
spec = {"width": {}}

// $ExpectError
spec = {"height": null}

// $ExpectError
spec = {"height": true}

// $ExpectError
spec = {"height": "foo"}

// $ExpectError
spec = {"height": {}}

// $ExpectError
spec = {"$schema": null}

// $ExpectError
spec = {"$schema": false}

// $ExpectError
spec = {"$schema": 100}

// $ExpectError
spec = {"$schema": {}}

// $ExpectError
spec = {"description": null}

// $ExpectError
spec = {"description": false}

// $ExpectError
spec = {"description": 100}
