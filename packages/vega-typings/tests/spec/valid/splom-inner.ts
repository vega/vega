import { Spec } from 'vega';

export const spec: Spec = {
  $schema: 'https://vega.github.io/schema/vega/v6.json',
  padding: 10,
  config: {
    axis: {
      tickColor: '#ccc',
      domainColor: '#ccc'
    }
  },

  signals: [
    { name: 'chartSize', value: 120 },
    { name: 'chartPad', value: 30 },
    { name: 'chartStep', update: 'chartSize + chartPad' },
    { name: 'width', update: 'chartStep * 4' },
    { name: 'height', update: 'chartStep * 4' },
    {
      name: 'cell',
      value: null,
      on: [
        {
          events: '@cell:mousedown',
          update: 'group()'
        },
        {
          events: '@cell:mouseup',
          update: '!span(brushX) && !span(brushY) ? null : cell'
        }
      ]
    },
    {
      name: 'brushX',
      value: 0,
      on: [
        {
          events: '@cell:mousedown',
          update: '[x(cell), x(cell)]'
        },
        {
          events: '[@cell:mousedown, window:mouseup] > window:mousemove',
          update: '[brushX[0], clamp(x(cell), 0, chartSize)]'
        },
        {
          events: { signal: 'delta' },
          update: 'clampRange([anchorX[0] + delta[0], anchorX[1] + delta[0]], 0, chartSize)'
        }
      ]
    },
    {
      name: 'brushY',
      value: 0,
      on: [
        {
          events: '@cell:mousedown',
          update: '[y(cell), y(cell)]'
        },
        {
          events: '[@cell:mousedown, window:mouseup] > window:mousemove',
          update: '[brushY[0], clamp(y(cell), 0, chartSize)]'
        },
        {
          events: { signal: 'delta' },
          update: 'clampRange([anchorY[0] + delta[1], anchorY[1] + delta[1]], 0, chartSize)'
        }
      ]
    },
    {
      name: 'down',
      value: [0, 0],
      on: [{ events: '@brush:mousedown', update: '[x(cell), y(cell)]' }]
    },
    {
      name: 'anchorX',
      value: null,
      on: [{ events: '@brush:mousedown', update: 'slice(brushX)' }]
    },
    {
      name: 'anchorY',
      value: null,
      on: [{ events: '@brush:mousedown', update: 'slice(brushY)' }]
    },
    {
      name: 'delta',
      value: [0, 0],
      on: [
        {
          events: '[@brush:mousedown, window:mouseup] > window:mousemove',
          update: '[x(cell) - down[0], y(cell) - down[1]]'
        }
      ]
    },
    {
      name: 'rangeX',
      value: [0, 0],
      on: [
        {
          events: { signal: 'brushX' },
          update: "invert('innerX', brushX, cell)"
        }
      ]
    },
    {
      name: 'rangeY',
      value: [0, 0],
      on: [
        {
          events: { signal: 'brushY' },
          update: "invert('innerY', brushY, cell)"
        }
      ]
    },
    {
      name: 'cursor',
      value: "'default'",
      on: [
        {
          events: '[@cell:mousedown, window:mouseup] > window:mousemove!',
          update: "'nwse-resize'"
        },
        {
          events: '@brush:mousemove, [@brush:mousedown, window:mouseup] > window:mousemove!',
          update: "'move'"
        },
        {
          events: '@brush:mouseout, window:mouseup',
          update: "'default'"
        }
      ]
    }
  ],

  data: [
    {
      name: 'penguins',
      url: 'data/penguins.json',
      transform: [{ type: 'filter', expr: "datum['Beak Length (mm)'] != null" }]
    },
    {
      name: 'fields',
      values: ['Beak Length (mm)', 'Beak Depth (mm)', 'Flipper Length (mm)', 'Body Mass (g)']
    },
    {
      name: 'cross',
      source: 'fields',
      transform: [
        { type: 'cross', as: ['x', 'y'] },
        { type: 'formula', as: 'xscale', expr: "datum.x.data + 'X'" },
        { type: 'formula', as: 'yscale', expr: "datum.y.data + 'Y'" }
      ]
    }
  ],

  scales: [
    {
      name: 'groupx',
      type: 'band',
      range: 'width',
      domain: { data: 'fields', field: 'data' }
    },
    {
      name: 'groupy',
      type: 'band',
      range: [{ signal: 'height' }, 0],
      domain: { data: 'fields', field: 'data' }
    },
    {
      name: 'color',
      type: 'ordinal',
      domain: { data: 'penguins', field: 'Species' },
      range: 'category'
    }
  ],

  legends: [
    {
      fill: 'color',
      title: 'Species',
      offset: 0,
      encode: {
        symbols: {
          update: {
            fillOpacity: { value: 0.5 },
            stroke: { value: 'transparent' }
          }
        }
      }
    }
  ],

  marks: [
    {
      type: 'rect',
      encode: {
        enter: {
          fill: { value: '#eee' }
        },
        update: {
          opacity: { signal: 'cell ? 1 : 0' },
          x: { signal: 'cell ? cell.x + brushX[0] : 0' },
          x2: { signal: 'cell ? cell.x + brushX[1] : 0' },
          y: { signal: 'cell ? cell.y + brushY[0] : 0' },
          y2: { signal: 'cell ? cell.y + brushY[1] : 0' }
        }
      }
    },
    {
      name: 'cell',
      type: 'group',
      from: { data: 'cross' },

      encode: {
        enter: {
          x: { scale: 'groupx', field: 'x.data' },
          y: { scale: 'groupy', field: 'y.data' },
          width: { signal: 'chartSize' },
          height: { signal: 'chartSize' },
          fill: { value: 'transparent' },
          stroke: { value: '#ddd' }
        }
      },

      signals: [
        { name: 'width', update: 'chartSize' },
        { name: 'height', update: 'chartSize' }
      ],

      scales: [
        {
          name: 'innerX',
          type: 'linear',
          zero: false,
          nice: true,
          domain: { data: 'penguins', field: { signal: 'parent.x.data' } },
          range: 'width'
        },
        {
          name: 'innerY',
          type: 'linear',
          zero: false,
          nice: true,
          domain: { data: 'penguins', field: { signal: 'parent.y.data' } },
          range: 'height'
        }
      ],

      axes: [
        { orient: 'bottom', scale: 'innerX', tickCount: 5 },
        { orient: 'left', scale: 'innerY', tickCount: 5 }
      ],

      marks: [
        {
          type: 'symbol',
          from: { data: 'penguins' },
          interactive: false,
          encode: {
            enter: {
              x: {
                scale: 'innerX',
                field: { datum: { parent: 'x.data' } }
              },
              y: {
                scale: 'innerY',
                field: { datum: { parent: 'y.data' } }
              },
              fillOpacity: { value: 0.5 },
              size: { value: 36 }
            },
            update: {
              fill: [
                {
                  test: '!cell || inrange(datum[cell.datum.x.data], rangeX) && inrange(datum[cell.datum.y.data], rangeY)',
                  scale: 'color',
                  field: 'Species'
                },
                { value: '#ddd' }
              ]
            }
          }
        }
      ]
    },
    {
      type: 'rect',
      name: 'brush',
      encode: {
        enter: {
          fill: { value: 'transparent' }
        },
        update: {
          x: { signal: 'cell ? cell.x + brushX[0] : 0' },
          x2: { signal: 'cell ? cell.x + brushX[1] : 0' },
          y: { signal: 'cell ? cell.y + brushY[0] : 0' },
          y2: { signal: 'cell ? cell.y + brushY[1] : 0' }
        }
      }
    }
  ]
};
