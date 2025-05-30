import { Spec } from 'vega';

export const spec: Spec = {
  $schema: 'https://vega.github.io/schema/vega/v6.json',
  width: 200,
  padding: 5,
  autosize: { type: 'pad', resize: true },

  signals: [
    { name: 'offset', value: 15 },
    { name: 'cellHeight', value: 100 },
    { name: 'columns', value: 3, bind: { input: 'radio', options: [1, 2, 3, 4] } }
  ],

  data: [
    {
      name: 'barley',
      url: 'data/barley.json'
    },
    {
      name: 'footers',
      transform: [
        {
          type: 'sequence',
          start: 0,
          stop: { signal: 'columns' }
        }
      ]
    }
  ],

  scales: [
    {
      name: 'xscale',
      type: 'linear',
      nice: true,
      range: 'width',
      round: true,
      domain: { data: 'barley', field: 'yield' }
    },
    {
      name: 'yscale',
      type: 'point',
      range: [0, { signal: 'cellHeight' }],
      padding: 1,
      round: true,
      domain: {
        data: 'barley',
        field: 'variety',
        sort: {
          field: 'yield',
          op: 'median',
          order: 'descending'
        }
      }
    },
    {
      name: 'cscale',
      type: 'ordinal',
      range: 'category',
      domain: { data: 'barley', field: 'year' }
    }
  ],

  layout: {
    padding: { column: 10, row: 5 },
    offset: 0,
    columns: { signal: 'columns' },
    bounds: 'full'
  },

  legends: [
    {
      stroke: 'cscale',
      title: 'Year',
      padding: 4
    }
  ],

  marks: [
    {
      role: 'column-footer',
      type: 'group',
      from: { data: 'footers' },

      axes: [{ orient: 'bottom', scale: 'xscale', title: 'Yield' }]
    },
    {
      name: 'site',
      type: 'group',

      from: {
        facet: {
          data: 'barley',
          name: 'sites',
          groupby: 'site'
        }
      },

      encode: {
        enter: {
          height: { signal: 'cellHeight' },
          width: { signal: 'width' },
          stroke: { value: '#ccc' }
        }
      },

      axes: [
        {
          orient: 'left',
          scale: 'yscale',
          tickSize: 0,
          domain: false,
          grid: true,
          encode: {
            grid: {
              enter: { strokeDash: { value: [3, 3] } }
            }
          }
        }
      ],

      title: {
        text: { signal: 'parent.site' },
        frame: 'group'
      },

      marks: [
        {
          type: 'symbol',
          from: { data: 'sites' },
          encode: {
            enter: {
              x: { scale: 'xscale', field: 'yield' },
              y: { scale: 'yscale', field: 'variety' },
              stroke: { scale: 'cscale', field: 'year' },
              strokeWidth: { value: 2 },
              size: { value: 50 }
            }
          }
        }
      ]
    }
  ]
};
