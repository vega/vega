import { Spec } from 'vega';

export const spec: Spec = {
  $schema: 'https://vega.github.io/schema/vega/v6.json',
  width: 400,
  height: 300,
  padding: 30,
  autosize: 'none',

  config: {
    text: {
      lineBreak: '|'
    }
  },

  signals: [
    {
      name: 'angle',
      value: 0,
      bind: { input: 'range', min: 0, max: 360, step: 1 }
    },
    {
      name: 'limit',
      value: 100,
      bind: { input: 'range', min: 0, max: 100, step: 1 }
    }
  ],

  data: [
    {
      name: 'table',
      values: [{ text: 'Longer text|Short' }]
    },
    {
      name: 'configs',
      values: [
        { align: 'left', baseline: 'top' },
        { align: 'center', baseline: 'top' },
        { align: 'right', baseline: 'top' },
        { align: 'left', baseline: 'middle' },
        { align: 'center', baseline: 'middle' },
        { align: 'right', baseline: 'middle' },
        { align: 'left', baseline: 'alphabetic' },
        { align: 'center', baseline: 'alphabetic' },
        { align: 'right', baseline: 'alphabetic' },
        { align: 'left', baseline: 'bottom' },
        { align: 'center', baseline: 'bottom' },
        { align: 'right', baseline: 'bottom' }
      ]
    }
  ],

  scales: [
    {
      name: 'x',
      type: 'band',
      domain: { data: 'configs', field: 'align' },
      range: 'width',
      padding: 0
    },
    {
      name: 'y',
      type: 'band',
      domain: { data: 'configs', field: 'baseline' },
      range: 'height',
      padding: 0
    }
  ],

  marks: [
    {
      type: 'group',
      from: { data: 'configs' },
      encode: {
        enter: {
          x: { scale: 'x', field: 'align', band: 0.5 },
          y: { scale: 'y', field: 'baseline', band: 0.5 }
        }
      },
      marks: [
        {
          type: 'rule',
          encode: {
            enter: {
              x: { value: -10 },
              x2: { value: 10 },
              y: { value: 0.5 },
              stroke: { value: 'steelblue' },
              strokeWidth: { value: 1 }
            }
          }
        },
        {
          type: 'text',
          from: { data: 'table' },
          encode: {
            enter: {
              x: { value: 0 },
              y: { value: 0 },
              text: { field: 'text' },
              align: { signal: 'parent.align' },
              baseline: { signal: 'parent.baseline' },
              fontSize: { value: 12 },
              href: { signal: "'#' + parent.align + '_' + parent.baseline" },
              cursor: { value: 'pointer' }
            },
            update: {
              fill: { value: 'black' },
              angle: { signal: 'angle' },
              limit: { signal: 'limit' }
            },
            hover: {
              fill: { value: 'firebrick' }
            }
          }
        }
      ]
    }
  ]
};
