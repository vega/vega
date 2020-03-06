---
layout: example
title: Projections Example
permalink: /examples/projections/index.html
spec: projections
image: /examples/img/projections.png
---

A gallery of world maps using various [cartographic projections](../../docs/projections). Each map clips the projected land masses and graticules to the sphere of the Earth to ensure no extraneous shapes are shown.

This example uses projections from the [d3-geo-projection](https://github.com/d3/d3-geo-projection) library that are not included in the standard Vega release. To register extended projections with Vega, simply import the [vega-projection-extended](https://github.com/vega/vega/tree/master/packages/vega-projection-extended) library:

```html
<script src="https://cdn.jsdelivr.net/npm/vega-projection-extended@2"></script>
```

<br/>

{% include projections %}
{% include example spec=page.spec %}
