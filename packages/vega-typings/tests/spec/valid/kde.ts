import { Spec } from 'vega';

export const spec: Spec = {
  $schema: 'https://vega.github.io/schema/vega/v5.json',
  width: 500,
  padding: 5,

  signals: [
    { name: 'plotHeight', value: 50 },
    { name: 'bandwidth', value: 0, bind: { input: 'range', min: 0, max: 1, step: 0.01 } }
  ],

  data: [
    {
      name: 'points',
      values: [
        { k: 'a', v: 1 },
        { k: 'a', v: 3 },
        { k: 'a', v: 3 },
        { k: 'a', v: 5 },
        { k: 'b', v: 2 },
        { k: 'b', v: 2 },
        { k: 'b', v: 4 }
      ]
    },
    {
      name: 'pdf',
      source: 'points',
      transform: [
        {
          type: 'kde',
          groupby: ['k'],
          field: 'v',
          bandwidth: { signal: 'bandwidth' }
        }
      ]
    },
    {
      name: 'cdf',
      source: 'points',
      transform: [
        {
          type: 'kde',
          cumulative: true,
          groupby: ['k'],
          field: 'v',
          bandwidth: { signal: 'bandwidth' }
        }
      ]
    }
  ],

  scales: [
    {
      name: 'xscale',
      type: 'linear',
      range: 'width',
      domain: { data: 'points', field: 'v' },
      zero: false,
      nice: true
    },
    {
      name: 'ypdf',
      type: 'linear',
      range: [{ signal: 'plotHeight' }, 0],
      domain: { data: 'pdf', field: 'density' }
    },
    {
      name: 'ycdf',
      type: 'linear',
      range: [{ signal: 'plotHeight' }, 0],
      domain: { data: 'cdf', field: 'density' }
    }
  ],

  layout: {
    columns: 1,
    padding: 10
  },

  marks: [
    {
      type: 'group',
      from: {
        facet: {
          data: 'pdf',
          name: 'facet',
          groupby: 'k'
        }
      },
      encode: {
        enter: {
          height: { signal: 'plotHeight' }
        }
      },
      axes: [{ orient: 'bottom', scale: 'xscale', zindex: 1 }],
      marks: [
        {
          type: 'area',
          from: { data: 'facet' },
          encode: {
            update: {
              x: { scale: 'xscale', field: 'value' },
              y: { scale: 'ypdf', field: 'density' },
              y2: { scale: 'ypdf', value: 0 },
              fill: { value: 'steelblue' }
            }
          }
        }
      ]
    },
    {
      type: 'group',
      from: {
        facet: {
          data: 'cdf',
          name: 'facet',
          groupby: 'k'
        }
      },
      encode: {
        enter: {
          height: { signal: 'plotHeight' }
        }
      },
      axes: [{ orient: 'bottom', scale: 'xscale', zindex: 1 }],
      marks: [
        {
          type: 'area',
          from: { data: 'facet' },
          encode: {
            update: {
              x: { scale: 'xscale', field: 'value' },
              y: { scale: 'ycdf', field: 'density' },
              y2: { scale: 'ycdf', value: 0 },
              fill: { value: 'steelblue' }
            }
          }
        }
      ]
    }
  ]
};
