import { Spec } from 'vega';

export const spec: Spec = {
  $schema: 'https://vega.github.io/schema/vega/v6.json',
  padding: 5,

  config: {
    legend: {
      offset: 5,
      symbolSize: 200
    }
  },

  signals: [
    {
      name: 'data',
      value: [
        'a',
        'b',
        'c',
        'd',
        'e',
        'f',
        'g',
        'h',
        'i',
        'j',
        'k',
        'l',
        'm',
        'n',
        'o',
        'p',
        'q',
        'r',
        's',
        't'
      ]
    },
    { name: 'count', value: 20, bind: { input: 'range', min: 0, max: 20, step: 1 } },
    { name: 'domain', update: 'slice(data, 0, count)' }
  ],

  scales: [
    {
      name: 'category',
      type: 'ordinal',
      range: 'category',
      domain: { signal: 'domain' }
    },
    {
      name: 'ordinal',
      type: 'ordinal',
      range: 'ordinal',
      domain: { signal: 'domain' }
    },
    {
      name: 'ramp',
      type: 'ordinal',
      range: 'ramp',
      domain: { signal: 'domain' }
    },
    {
      name: 'diverging',
      type: 'ordinal',
      range: 'diverging',
      domain: { signal: 'domain' }
    },
    {
      name: 'heatmap',
      type: 'ordinal',
      range: 'heatmap',
      domain: { signal: 'domain' }
    },
    {
      name: 'custom',
      type: 'ordinal',
      range: { scheme: ['goldenrod', 'lightgray', 'royalblue'] },
      domain: { signal: 'domain' }
    }
  ],

  legends: [
    {
      orient: 'none',
      fill: 'category',
      title: 'Category',
      encode: { legend: { update: { x: { value: 0 }, y: { value: 0 } } } }
    },
    {
      orient: 'none',
      fill: 'ordinal',
      title: 'Ordinal',
      encode: { legend: { update: { x: { value: 60 }, y: { value: 0 } } } }
    },
    {
      orient: 'none',
      fill: 'ramp',
      title: 'Ramp',
      encode: { legend: { update: { x: { value: 120 }, y: { value: 0 } } } }
    },
    {
      orient: 'none',
      fill: 'diverging',
      title: 'Diverging',
      encode: { legend: { update: { x: { value: 180 }, y: { value: 0 } } } }
    },
    {
      orient: 'none',
      fill: 'heatmap',
      title: 'Heatmap',
      encode: { legend: { update: { x: { value: 240 }, y: { value: 0 } } } }
    },
    {
      orient: 'none',
      fill: 'custom',
      title: 'Custom',
      encode: { legend: { update: { x: { value: 300 }, y: { value: 0 } } } }
    }
  ]
};
