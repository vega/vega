# vega-lib

Include Vega in client-side projects using minimal dependencies.

**Vega** is a _visualization grammar_, a declarative format for creating, saving, and sharing interactive visualization designs. With Vega you can describe data visualizations in a JSON format, and generate interactive views using either HTML5 Canvas or SVG.

The **vega-lib** repository packages up the Vega codebase for use in client-side projects (for example, using [Webpack](https://webpack.js.org/) or [Browserify](http://browserify.org/)) with minimal server-side dependencies. We exclude [node-canvas](https://github.com/Automattic/node-canvas) dependencies to remove compilation steps and associated overhead.

For more about Vega, including support for server-side rendering, see the main [Vega repository](https://github.com/vega/vega) and [Vega website](https://vega.github.io/vega).

## Basic Setup and Testing

For a basic setup allowing you to build Vega and run examples:

- Run `git clone git@github.com:vega/vega-lib.git` to clone this repository.
- Run `yarn` to install dependencies. If you don't have yarn installed, see https://yarnpkg.com/en/docs/install.
- Once installation is complete, use `yarn test` to run tests and `yarn run build` to build output files.

This repository includes web-based demos within the `test` folder. To run these, launch a local web server in the top-level directory for the repo and point your browser to the right place (e.g., `http://localhost:8080/test/`).

Need help launching a local web server? Run `npm install -g http-server` to install a node.js-based web server, then run `http-server -p 8080` to serve files from the current directory on port 8080.
