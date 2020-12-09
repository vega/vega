---
layout: page
title: Supporting Internet Explorer
menu: usage
permalink: /usage/internet-explorer/index.html
---

Vega version 4.3.0 and earlier is compatible with Internet Explorer versions 10 and 11, but with some notable caveats and limitations, described below. Later versions of Vega assume [ES6](http://es6-features.org/) support. Vega 5.9.0 and
later provides an ES5-compliant build in the `build-es5` directory, or you can use a JavaScript compiler such as [Babel](https://babeljs.io/) to generate ES5-compliant code from the `build` directory.

## Enabling Internet Explorer Support

Internet Explorer does not natively support [Symbols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol), [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise), or the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API). Vega uses Symbols to add unique identifiers to data objects, uses Promises for asynchronous tasks such as data and image loading, and uses Fetch to load external files.

For Vega 4.3 and earlier to work with Internet Explorer, deployments should include [polyfills](https://en.wikipedia.org/wiki/Polyfill) that add Symbol, Promise, and Fetch support. For example, one can use the [es6-promise](https://github.com/stefanpenner/es6-promise) and the [github/fetch](https://github.com/github/fetch) libraries. Web pages should first import any polyfill scripts, then import Vega:

```html
<head>
  <script src="https://vega.github.io/vega/assets/promise.min.js"></script>
  <script src="https://vega.github.io/vega/assets/symbol.min.js"></script>
  <script src="https://vega.github.io/vega/assets/fetch.min.js"></script>
  <script src="https://vega.github.io/vega/vega.min.js"></script>
</head>
```

Note that polyfills are necessary only for Internet Explorer support. Recent versions of other browsers &ndash; including Edge (Internet Explorer's successor), Chrome, Safari, Firefox and Opera &ndash; all have native Symbol, Promise, and Fetch support.

## Limitations

Input event handling issues on Internet Explorer may arise when using stroked marks (such as `line` marks) with a Canvas renderer. Some versions of Internet Explorer do not support the Canvas Context2D method [`isPointInStroke`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/isPointInStroke). Vega depends on this method to determine when the mouse cursor is within a stroke. Without it, Vega can only tell when a point lies within a filled (rather than stroked) region, causing interactions such as mouse hover over line marks to fail. Possible solutions include using SVG rather than Canvas (Vega then uses browser element event listeners to determine hover), or encouraging users to upgrade to a more modern standards-compliant browser.
