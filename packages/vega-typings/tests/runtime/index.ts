import * as vega from 'vega'

import { histogram } from '../spec/examples'

// Runtime examples from https://vega.github.io/vega/usage/

function clientSideApi() {
  var view;

  vega
    .loader()
    .load('https://vega.github.io/vega/examples/bar-chart.vg.json')
    .then(function(data) {
      render(JSON.parse(data));
    });

  function render(spec: vega.Spec) {
    view = new vega.View(vega.parse(spec))
      .renderer('canvas') // set renderer (canvas or svg)
      .initialize('#view') // initialize view within parent DOM container
      .hover() // enable hover encode set processing
      .run();
  }
}

function serverSideApi() {
  // create a new view instance for a given Vega JSON spec
  var view = new vega.View(vega.parse(histogram)).renderer('none').initialize();

  // generate a static SVG image
  view
    .toSVG()
    .then(function(svg) {
      // process svg string
    })
    .catch(function(err) {
      console.error(err);
    });

  // generate a static PNG image
  view
    .toCanvas()
    .then(function(canvas) {
      // process node-canvas instance
      // for example, generate a PNG stream to write
      var stream = canvas.createPNGStream();
    })
    .catch(function(err) {
      console.error(err);
    });
}
