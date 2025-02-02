# Vega: A Visualization Grammar <a href="https://vega.github.io/vega/"><img align="right" src="https://github.com/vega/logos/blob/master/assets/VG_Color@64.png?raw=true" height="38"></img></a>

<a href="https://vega.github.io/vega/examples">
<img src="https://vega.github.io/vega/assets/banner.png" alt="Vega Examples" width="900"></img>
</a>

**Vega** is a *visualization grammar*, a declarative format for creating, saving, and sharing interactive visualization designs. With Vega you can describe data visualizations in a JSON format, and generate interactive views using HTML5 Canvas or SVG.

For [documentation](https://vega.github.io/vega/docs/), [tutorials](https://vega.github.io/vega/tutorials/), and [examples](https://vega.github.io/vega/examples/), see the [Vega website](https://vega.github.io/vega). For a description of changes between Vega 2 and later versions, please refer to the [Vega Porting Guide](https://vega.github.io/vega/docs/porting-guide/).

Try using Vega in the online [Vega Editor](https://vega.github.io/editor/#/examples/vega/bar-chart).

## Internet Explorer Support
For backwards compatibility, Vega includes a [babel-ified](https://babeljs.io/) IE-compatible version of the code in the `packages/vega/build-es5` directory. Older browsers also require these polyfill libraries:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/7.4.4/polyfill.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/regenerator-runtime@0.13.3/runtime.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/whatwg-fetch@3.0.0/dist/fetch.umd.min.js"></script>
```

## Contributions, Development, and Support

Interested in contributing to Vega? Please see our [contribution and development guidelines](CONTRIBUTING.md), subject to our [code of conduct](https://github.com/vega/.github/blob/master/CODE_OF_CONDUCT.md).

Looking for support, or interested in sharing examples and tips? Post to the [Vega discussion forum](https://groups.google.com/forum/#!forum/vega-js) or join the [Vega slack organization](https://bit.ly/join-vega-slack-2020)! We also have examples available as [Observable notebooks](https://observablehq.com/@vega).

If you're curious about system performance, see some [in-browser benchmarks](https://observablehq.com/@vega/vega-performance-tests). Read about future plans in [our roadmap](https://github.com/orgs/vega/projects/9/views/3?pane=info).

## Security

Please see our [guidelines](./SECURITY.md) for reporting vulnerabilities.
