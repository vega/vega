import { Spec } from 'vega';

export const spec: Spec = {
  $schema: 'https://vega.github.io/schema/vega/v6.json',
  width: 750,
  height: 500,
  padding: 0,
  autosize: 'none',

  signals: [
    {
      name: 'scale',
      value: 0.05,
      bind: { input: 'range', min: 0.005, max: 0.1, step: 0.001 }
    },
    {
      name: 'offset',
      value: 0,
      bind: { input: 'range', min: 0, max: 10, step: 0.1 }
    },
    {
      name: 'smooth',
      value: true,
      bind: { input: 'checkbox' }
    }
  ],

  data: [
    {
      name: 'source',
      values: [{ width: 150, height: 100 }]
    }
  ],

  scales: [
    {
      name: 'color',
      type: 'linear',
      zero: true,
      domain: [-1, 1],
      range: { scheme: 'spectral' }
    }
  ],

  marks: [
    {
      type: 'image',
      from: { data: 'source' },
      encode: {
        update: {
          x: { value: 0 },
          y: { value: 0 },
          width: { signal: 'width' },
          height: { signal: 'height' },
          aspect: { value: false },
          smooth: { signal: 'smooth' }
        }
      },
      transform: [
        {
          type: 'heatmap',
          field: 'datum',
          color: {
            expr: "scale('color', sin(offset + scale * (datum.$x + datum.$y)) * sin(scale * (datum.$x - datum.$y)))"
          },
          opacity: 1
        }
      ]
    }
  ]
};
