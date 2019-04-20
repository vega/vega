# Contributing to Vega

If you find a bug in the code or a mistake in the [documentation](https://vega.github.io/vega/docs/), or if you would like to request a new feature, please [file an issue on GitHub](https://github.com/vega/vega/issues), or even better, submit a pull request.

For small fixes, please feel free to submit a pull request directly: don't worry about creating an issue first. For major changes, please discuss with us first. To ensure the discussion is visible and open for comments, please submit a new issue that we can tag with the discussion label.

If you would like to make multiple unrelated modifications, please separate them into separate pull requests for independent review and merging. If making significant inter-related modifications, please try to provide a logical sequence of piecewise commits rather than one giant commit spanning many files (as is feasible). Please also include appropriate test cases for ensuring correctness. Feel free to reach out for help or confirmation if you have questions on how to best proceed!

## Website and Documentation

The Vega website and documentation is in the `docs/` folder of this repository. We use Jekyll and Github Pages to publish our documentation. Each page in the documentation includes an "Edit this Page" link at the bottom that provides a shortcut for fixing errors and submitting them directly on GitHub. To contribute more substantial changes to the website, you can submit a pull request that modifies the files in `docs/`.

If contributing to the example gallery, include a corresponding thumbnail image in `docs/examples/img` that is either 360 pixels wide or 200 pixels tall. Please also add an entry for the example within an appropriate category in `docs/_data/examples.json`.

## Looking for a Task to Contribute

You can find [tasks with the "help-wanted" label in the issue tracker](https://github.com/vega/vega/labels/help-wanted). Please get in touch if you are planning to work on a major task.

# Development Setup

The Vega project consists of a number of packages, organized into a single [monorepo](https://en.wikipedia.org/wiki/Monorepo). Each package is published as a separate package on [npm](https://www.npmjs.com/). The modular design is intended to enable reuse and encourage appropriate separation of concerns. For example, Vega's dataflow can be used independent of Vega's parsing and view components.

For an overview of all packages, see the [vega `/packages` folder](/packages).

To setup a development environment follow the [Build Instructions in README.md](https://github.com/vega/vega/#Build-Instructions). We use [Yarn workspaces](https://yarnpkg.com/lang/en/docs/workspaces/) and [lerna](https://github.com/lerna/lerna) to manage the monorepo packages.
