# Vega: A Visualization Grammar

<a href="https://vega.github.io/vega/examples">
<img src="https://vega.github.io/vega/assets/banner.png" alt="Vega Examples" width="900"></img>
</a>

**Vega** is a *visualization grammar*, a declarative format for creating, saving, and sharing interactive visualization designs. With Vega you can describe data visualizations in a JSON format, and generate interactive views using either HTML5 Canvas or SVG.

For documentation, tutorials, and examples, see the [Vega website](https://vega.github.io/vega). For a description of changes between Vega 2 and later versions, please refer to the [Vega Porting Guide](https://vega.github.io/vega/docs/porting-guide/).

Are you using Vega in a web application built with a bundler such as [Webpack](https://webpack.js.org/) or [Browserify](http://browserify.org/)? If so, and you _do not need server-side rendering support_, you might prefer using [vega-lib](https://github.com/vega/vega-lib) to include Vega in your app. The vega-lib repository also houses our general test suite.

## Build Instructions

For a basic setup allowing you to build Vega and run examples:

- Clone `https://github.com/vega/vega`.
- Run `yarn` to install dependencies. If you don't have yarn installed, see https://yarnpkg.com/en/docs/install. (If you do not wish to install yarn, you can alternatively run `npm install`. However, you will not be guaranteed to have dependencies matching those of the current release.)
- Once installation is complete, use `yarn build` to build output files.

This repository includes the website and documentation in the `docs` folder. To launch it, run `bundle install` and `bundle exec jekyll serve` in the `docs` folder. The last command launches a local webserver. Now, you can open [`http://127.0.0.1:4000/vega/`](http://127.0.0.1:4000/vega/) to see the website.

## Contributions, Development, and Support

Interested in contributing to Vega? Please see our [contribution and development guidelines](CONTRIBUTING.md), subject to our [code of conduct](CODE_OF_CONDUCT.md).

Looking for support, or interested in sharing examples and tips? Post to the [Vega discussion forum]((https://groups.google.com/forum/#!forum/vega-js)) or join the [Vega slack organization](http://bit.ly/vega-slack)!
