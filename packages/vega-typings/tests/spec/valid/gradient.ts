import { Spec } from 'vega';

export const spec: Spec = {
  $schema: 'https://vega.github.io/schema/vega/v5.json',
  width: 300,
  padding: 5,

  scales: [
    {
      name: 'color',
      type: 'linear',
      range: { scheme: 'viridis' },
      domain: [0, 100]
    }
  ],

  marks: [
    {
      type: 'rect',
      encode: {
        update: {
          width: { signal: 'width' },
          height: { value: 15 },
          fill: { gradient: 'color' }
        }
      }
    },
    {
      type: 'rect',
      encode: {
        update: {
          y: { value: 20 },
          width: { signal: 'width' },
          height: { value: 15 },
          fill: {
            value: {
              gradient: 'linear',
              stops: [
                { offset: 0.0, color: 'red' },
                { offset: 0.5, color: 'white' },
                { offset: 1.0, color: 'blue' }
              ]
            }
          }
        }
      }
    },
    {
      type: 'symbol',
      encode: {
        update: {
          x: { value: 25 },
          y: { value: 62 },
          size: { value: 1900 },
          fill: {
            value: {
              gradient: 'radial',
              stops: [
                { offset: 0.0, color: 'red' },
                { offset: 0.5, color: 'white' },
                { offset: 1.0, color: 'blue' }
              ]
            }
          }
        }
      }
    },
    {
      type: 'rect',
      encode: {
        update: {
          x: { value: 100 },
          y: { value: 40 },
          width: { value: 200 },
          height: { value: 45 },
          fill: {
            value: {
              gradient: 'radial',
              stops: [
                { offset: 0.0, color: 'red' },
                { offset: 0.5, color: 'white' },
                { offset: 1.0, color: 'blue' }
              ]
            }
          }
        }
      }
    }
  ]
};
