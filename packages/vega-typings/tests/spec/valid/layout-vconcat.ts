import { Spec } from 'vega';

export const spec: Spec = {
  $schema: 'https://vega.github.io/schema/vega/v6.json',
  padding: 5,
  autosize: 'pad',

  signals: [
    { name: 'cellWidth', value: 200 },
    { name: 'cellHeight', value: 200 }
  ],

  layout: {
    padding: 20,
    columns: 1,
    align: 'all'
  },

  data: [
    {
      name: 'source',
      url: 'data/cars.json',
      transform: [
        {
          type: 'filter',
          expr: "datum['Horsepower'] != null && datum['Miles_per_Gallon'] != null && datum['Acceleration'] != null"
        }
      ]
    }
  ],

  marks: [
    {
      type: 'group',

      signals: [
        { name: 'width', update: 'cellWidth' },
        { name: 'height', update: 'cellHeight' }
      ],

      encode: {
        update: {
          width: { signal: 'cellWidth' },
          height: { signal: 'cellHeight' }
        }
      },

      scales: [
        {
          name: 'x',
          type: 'linear',
          round: true,
          nice: true,
          zero: true,
          domain: { data: 'source', field: 'Horsepower' },
          range: 'width'
        },
        {
          name: 'y',
          type: 'linear',
          round: true,
          nice: true,
          zero: true,
          domain: { data: 'source', field: 'Miles_per_Gallon' },
          range: 'height'
        },
        {
          name: 'size',
          type: 'linear',
          round: true,
          nice: false,
          zero: true,
          domain: { data: 'source', field: 'Acceleration' },
          range: [4, 361]
        }
      ],

      axes: [
        {
          scale: 'x',
          grid: true,
          domain: false,
          orient: 'bottom',
          tickCount: 5,
          title: 'Horsepower'
        },
        {
          scale: 'y',
          grid: true,
          domain: false,
          orient: 'left',
          titlePadding: 5,
          title: 'Miles_per_Gallon'
        }
      ],

      legends: [
        {
          size: 'size',
          title: 'Acceleration',
          format: 's',
          encode: {
            symbols: {
              update: {
                strokeWidth: { value: 2 },
                opacity: { value: 0.5 },
                stroke: { value: '#4682b4' },
                shape: { value: 'circle' }
              }
            }
          }
        }
      ],

      marks: [
        {
          name: 'marks',
          type: 'symbol',
          from: { data: 'source' },
          encode: {
            update: {
              x: { scale: 'x', field: 'Horsepower' },
              y: { scale: 'y', field: 'Miles_per_Gallon' },
              size: { scale: 'size', field: 'Acceleration' },
              shape: { value: 'circle' },
              strokeWidth: { value: 2 },
              opacity: { value: 0.5 },
              stroke: { value: '#4682b4' },
              fill: { value: 'transparent' }
            }
          }
        }
      ]
    },
    {
      type: 'group',

      signals: [
        { name: 'width', update: 'cellWidth' },
        { name: 'height', update: 'cellHeight' }
      ],

      encode: {
        update: {
          width: { signal: 'cellWidth' },
          height: { signal: 'cellHeight' }
        }
      },

      scales: [
        {
          name: 'x',
          type: 'linear',
          round: true,
          nice: true,
          zero: true,
          domain: { data: 'source', field: 'Displacement' },
          range: 'width'
        },
        {
          name: 'y',
          type: 'linear',
          round: true,
          nice: true,
          zero: true,
          domain: { data: 'source', field: 'Miles_per_Gallon' },
          range: 'height'
        },
        {
          name: 'size',
          type: 'linear',
          round: true,
          nice: false,
          zero: true,
          domain: { data: 'source', field: 'Acceleration' },
          range: [4, 361]
        }
      ],

      axes: [
        {
          scale: 'x',
          grid: true,
          domain: false,
          orient: 'bottom',
          tickCount: 5,
          title: 'Displacement'
        },
        {
          scale: 'y',
          grid: true,
          domain: false,
          orient: 'left',
          titlePadding: 5,
          title: 'Miles_per_Gallon'
        }
      ],

      legends: [
        {
          size: 'size',
          title: 'Acceleration',
          format: 's',
          encode: {
            symbols: {
              update: {
                strokeWidth: { value: 2 },
                opacity: { value: 0.5 },
                stroke: { value: '#4682b4' },
                shape: { value: 'circle' }
              }
            }
          }
        }
      ],

      marks: [
        {
          name: 'marks',
          type: 'symbol',
          from: { data: 'source' },
          encode: {
            update: {
              x: { scale: 'x', field: 'Displacement' },
              y: { scale: 'y', field: 'Miles_per_Gallon' },
              size: { scale: 'size', field: 'Acceleration' },
              shape: { value: 'circle' },
              strokeWidth: { value: 2 },
              opacity: { value: 0.5 },
              stroke: { value: '#4682b4' },
              fill: { value: 'transparent' }
            }
          }
        }
      ]
    },
    {
      type: 'group',

      signals: [
        { name: 'width', update: 'cellWidth' },
        { name: 'height', update: 'cellHeight' }
      ],

      encode: {
        update: {
          width: { signal: 'cellWidth' },
          height: { signal: 'cellHeight' }
        }
      },

      scales: [
        {
          name: 'x',
          type: 'linear',
          round: true,
          nice: true,
          zero: true,
          domain: { data: 'source', field: 'Acceleration' },
          range: 'width'
        },
        {
          name: 'y',
          type: 'linear',
          round: true,
          nice: true,
          zero: true,
          domain: { data: 'source', field: 'Miles_per_Gallon' },
          range: 'height'
        },
        {
          name: 'size',
          type: 'linear',
          round: true,
          nice: false,
          zero: true,
          domain: { data: 'source', field: 'Acceleration' },
          range: [4, 361]
        }
      ],

      axes: [
        {
          scale: 'x',
          grid: true,
          domain: false,
          orient: 'bottom',
          tickCount: 5,
          title: 'Acceleration'
        },
        {
          scale: 'y',
          grid: true,
          domain: false,
          orient: 'left',
          titlePadding: 5,
          title: 'Miles_per_Gallon'
        }
      ],

      legends: [
        {
          size: 'size',
          title: 'Acceleration',
          format: 's',
          encode: {
            symbols: {
              update: {
                strokeWidth: { value: 2 },
                opacity: { value: 0.5 },
                stroke: { value: '#4682b4' },
                shape: { value: 'circle' }
              }
            }
          }
        }
      ],

      marks: [
        {
          name: 'marks',
          type: 'symbol',
          from: { data: 'source' },
          encode: {
            update: {
              x: { scale: 'x', field: 'Acceleration' },
              y: { scale: 'y', field: 'Miles_per_Gallon' },
              size: { scale: 'size', field: 'Acceleration' },
              shape: { value: 'circle' },
              strokeWidth: { value: 2 },
              opacity: { value: 0.5 },
              stroke: { value: '#4682b4' },
              fill: { value: 'transparent' }
            }
          }
        }
      ]
    }
  ]
};
