import tape from 'tape';
import {JSDOM} from 'jsdom';
import * as vega from '../index.js';

function specification() {
  return {
    width: 200,
    height: 100,
    description: 'Chart description',
    title: {text: 'Revenue', subtitle: 'Quarterly'},
    data: [{name: 'table', values: [{category: 'a'}, {category: 'b'}, {category: 'c'}]}],
    scales: [
      {name: 'x', type: 'band', domain: {data: 'table', field: 'category'}, range: 'width'},
      {name: 'y', type: 'linear', domain: [0, 100], range: 'height'},
      {name: 'color', type: 'ordinal', domain: {data: 'table', field: 'category'}, range: ['red', 'green', 'blue']}
    ],
    axes: [{scale: 'x', orient: 'bottom'}, {scale: 'y', orient: 'left'}],
    legends: [{fill: 'color', stroke: 'color'}],
    marks: [{
      name: 'bars',
      type: 'rect',
      from: {data: 'table'},
      encode: {
        update: {
          x: {scale: 'x', field: 'category'},
          width: {value: 20},
          height: {value: 40},
          fill: {scale: 'color', field: 'category'},
          description: {field: 'category'}
        }
      }
    }],
    config: {events: {bind: 'none'}}
  };
}

const translation = {
  'role.visualization': 'chart role',
  'role.axis': 'axis role',
  'role.legend': 'legend role',
  'role.title': 'title role',
  'role.subtitle': 'subtitle role',
  'role.markContainer': 'container {0}',
  'role.mark': 'item {0}',
  'marktype.rect': 'rectangle',
  'titleText': 'Heading {0}',
  'subtitleText': 'Subheading {0}',
  'axisLabel': 'Axis {0}',
  'axisScaleDiscrete': ' discrete',
  'axisScaleContinuous': ' {0}',
  'axisWithDomain': ' domain {0}',
  'legendType': 'key {0}',
  'legendForChannel': ' channels {0}',
  'legendWithDomain': ' domain {0}',
  'channel.fill': 'fill',
  'channel.stroke': 'stroke',
  'listJoiner': ' / ',
  'listFinalJoiner': ' plus ',
  'domainValues_other': '{0} entries: {1}',
  'domainContinuous': '{0} through {1}'
};

function checkLabels(t, root) {
  const axis = root.querySelectorAll('.role-axis');
  t.equal(axis[0].getAttribute('aria-roledescription'), 'axis role');
  t.equal(axis[0].getAttribute('aria-label'), 'Axis X discrete domain 3 entries: a / b / c');
  t.equal(axis[1].getAttribute('aria-label'), 'Axis Y linear domain 0 through 100');
  const legend = root.querySelector('.role-legend');
  t.equal(legend.getAttribute('aria-roledescription'), 'legend role');
  t.equal(legend.getAttribute('aria-label'), 'Key symbol channels fill plus stroke domain 3 entries: a / b / c');
  t.equal(root.querySelector('.role-title-text').getAttribute('aria-label'), 'Heading Revenue');
  t.equal(root.querySelector('.role-title-subtitle').getAttribute('aria-label'), 'Subheading Quarterly');
  t.equal(root.querySelector('.bars').getAttribute('aria-roledescription'), 'container rectangle');
  t.equal(root.querySelector('.bars path').getAttribute('aria-roledescription'), 'item rectangle');
  t.equal(root.querySelector('.bars path').getAttribute('aria-label'), 'a');
}

tape('Vega View localizes complete SVG output from config and View options', async t => {
  const dom = new JSDOM(),
        container = dom.window.document.createElement('div'),
        spec = specification();
  spec.config.ariaLocale = translation;
  const view = new vega.View(vega.parse(spec), {
    renderer: 'svg',
    ariaLocale: {'role.visualization': 'view chart role'}
  });
  try {
    await view.initialize(container).runAsync();
    t.equal(container.getAttribute('aria-roledescription'), 'view chart role');
    t.equal(container.getAttribute('aria-label'), 'Chart description');
    checkLabels(t, container);
    checkLabels(t, new JSDOM(await view.toSVG()).window.document);
  } finally {
    view.finalize();
    dom.window.close();
  }
  t.end();
});

tape('Vega View updates existing SVG and exported labels when the locale changes', async t => {
  const dom = new JSDOM(),
        container = dom.window.document.createElement('div'),
        view = new vega.View(vega.parse(specification()), {renderer: 'svg'});
  try {
    await view.initialize(container).runAsync();
    t.equal(container.getAttribute('aria-roledescription'), 'visualization');
    t.equal(container.querySelector('.role-axis').getAttribute('aria-label'),
      'X-axis for a discrete scale with 3 values: a, b, c');
    t.equal(view.ariaLocale(translation), view, 'locale setter is chainable');
    await view.runAsync();
    t.equal(container.getAttribute('aria-roledescription'), 'chart role');
    checkLabels(t, container);
    checkLabels(t, new JSDOM(await view.toSVG()).window.document);
    await view.ariaLocale({}).runAsync();
    t.equal(container.getAttribute('aria-roledescription'), 'visualization');
    t.equal(container.querySelector('.role-axis').getAttribute('aria-label'),
      'X-axis for a discrete scale with 3 values: a, b, c', 'empty locale restores defaults');
  } finally {
    view.finalize();
    dom.window.close();
  }
  t.end();
});
