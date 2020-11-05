# Vega: A Visualization Grammar <a href="https://vega.github.io/vega/"><img align="right" src="https://github.com/vega/logos/blob/master/assets/VG_Color@64.png?raw=true" height="38"></img></a>

<a href="https://vega.github.io/vega/examples">
<img src="https://vega.github.io/vega/assets/banner.png" alt="Vega Examples" width="900"></img>
</a>

**Vega** is a *visualization grammar*, a declarative format for creating, saving, and sharing interactive visualization designs. With Vega you can describe data visualizations in a JSON format, and generate interactive views using either HTML5 Canvas or SVG.

For documentation, tutorials, and examples, see the [Vega website](https://vega.github.io/vega). For a description of changes between Vega 2 and later versions, please refer to the [Vega Porting Guide](https://vega.github.io/vega/docs/porting-guide/).

## Build Instructions

For a basic setup allowing you to build Vega and run examples:

- Clone `https://github.com/vega/vega`.
- Run `yarn` to install dependencies for all packages. If you don't have yarn installed, see https://yarnpkg.com/en/docs/install. We use [Yarn workspaces](https://yarnpkg.com/lang/en/docs/workspaces/) to manage multiple packages within this [monorepo](https://en.wikipedia.org/wiki/Monorepo).
- Once installation is complete, run `yarn test` to run test cases, or run `yarn build` to build output files for all packages.
- After running either `yarn test` or `yarn build`, run `yarn serve` to launch a local web server &mdash; your default browser will open and you can browse to the `"test"` folder to view test specifications.

This repository includes the Vega website and documentation in the `docs` folder. To launch the website locally, first run `bundle install` in the `docs` folder to install the necessary Jekyll libraries. Afterwards, use `yarn docs` to build the documentation and launch a local webserver. After launching, you can open [`http://127.0.0.1:4000/vega/`](http://127.0.0.1:4000/vega/) to see the website.

## ES5 Support
For backwards compatibility, Vega includes a [babel-ified](https://babeljs.io/) ES5-compatible version of the code in `packages/vega/build-es5` directory. Older browser would also require several polyfill libraries:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/7.4.4/polyfill.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/regenerator-runtime@0.13.3/runtime.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/whatwg-fetch@3.0.0/dist/fetch.umd.min.js"></script>
```

## Contributions, Development, and Support

Interested in contributing to Vega? Please see our [contribution and development guidelines](CONTRIBUTING.md), subject to our [code of conduct](CODE_OF_CONDUCT.md).

Looking for support, or interested in sharing examples and tips? Post to the [Vega discussion forum](https://groups.google.com/forum/#!forum/vega-js) or join the [Vega slack organization](https://bit.ly/join-vega-slack-2020)! We also have examples available as [Observable notebooks](https://observablehq.com/@vega).

If you're curious about system performance, see some [in-browser benchmarks](https://observablehq.com/@vega/vega-performance-tests). Read about future plans in [our roadmap](https://github.com/vega/roadmap/projects/1).
