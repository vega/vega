# vega-projection-extended

Extended projections for cartographic mapping.

This package extends Vega's set of cartographic projections with those provided by the [d3-geo-projection](https://github.com/d3/d3-geo-projection) library. See the `index.js` file for the complete list of imported projections.

## Usage Instructions

Import this module for its side effects to register all extended projections with Vega:

```js
import * as vega from 'vega';
import 'vega-projection-extended';
```

In the browser, you can import both modules from a CDN:

```html
<script type="module">
  import * as vega from 'https://cdn.jsdelivr.net/npm/vega@6/+esm';
  import 'https://cdn.jsdelivr.net/npm/vega-projection-extended@3/+esm';
</script>
```
