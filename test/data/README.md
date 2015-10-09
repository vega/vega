# vega-datasets

This data lives at https://github.com/vega/vega-datasets

Common repository for example datasets used by vega related projects. Keep changes to this repository minimal as other projects (vega, vega-editor, vega-lite, polestar, voyager) use this data in their tests and for examples.

## How to use it

Use git subtree to add these datasets to a project. Add data git `subtree add` like:

```
git subtree add --prefix path-to-data git@github.com:vega/vega-datasets.git gh-pages
```

Update to the latest version of vega-data with

```
git subtree pull --prefix path-to-data git@github.com:vega/vega-datasets.git gh-pages
```

You can also get the data directly via HTTP served by Github like:

https://vega.github.io/vega-datasets/cars.json

## Changelog

### Version 1.0, October 8, 2015

* Initial import from vega and vega-lite
* Change field names in `cars.json` to be more descriptive (`hp` to `Horsepower`)
