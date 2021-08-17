import * as vega from 'vega'

import { spec as histogram } from '../spec/valid/histogram'

// Runtime examples from https://vega.github.io/vega/usage/

function clientSideApi() {
  // fr-FR locale example from d3-format
  vega.formatLocale({
    'decimal': ',',
    'thousands': '\u00a0',
    'grouping': [3],
    'currency': ['', '\u00a0€'],
    'percent': '\u202f%'
  });
  // fr-FR locale example from d3-time-format
  vega.timeFormatLocale({
    'dateTime': '%A, le %e %B %Y, %X',
    'date': '%d/%m/%Y',
    'time': '%H:%M:%S',
    'periods': ['AM', 'PM'],
    'days': ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
    'shortDays': ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'],
    'months': ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
    'shortMonths': ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
  });

  vega
    .loader()
    .load('https://vega.github.io/vega/examples/bar-chart.vg.json')
    .then((data) => {
      render(JSON.parse(data));
    });

  // the vega logger with a custom output handler
  vega.logger(vega.Info, undefined, (method , level, input) => {
    const args = ['custom logger', level].concat([].slice.call(input));
    console[method].apply(console, args); // eslint-disable-line no-console
  })

  function render(spec: vega.Spec) {
    const _view = new vega.View(vega.parse(spec))
      .renderer('canvas') // set renderer (canvas or svg)
      .initialize('#view') // initialize view within parent DOM container
      .hover() // enable hover encode set processing
      .run();
  }
}

function serverSideApi() {
  // create a new view instance for a given Vega JSON spec
  const view = new vega.View(vega.parse(histogram)).renderer('none').initialize();

  // generate a static SVG image
  view
    .toSVG()
    .then((svg) => {
      // process svg string
    })
    .catch((err) => {
      console.error(err);
    });

  // generate a static PNG image
  view
    .toCanvas()
    .then(canvas => {
      const filename = 'chart.png';
      const url = canvas.toDataURL();
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('target', '_blank');
      link.setAttribute('download', filename);
      link.dispatchEvent(new MouseEvent('click'));
    })
    .catch((err) => {
      console.error(err);
    });
}
