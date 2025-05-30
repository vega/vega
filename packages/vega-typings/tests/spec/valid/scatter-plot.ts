import { Spec } from 'vega';

export const spec: Spec = {
  $schema: 'https://vega.github.io/schema/vega/v6.json',
  width: 400,
  height: 350,
  padding: 10,
  autosize: 'pad',

  config: {
    legend: {
      titleOrient: 'left',
      offset: 4,

      symbolDirection: 'horizontal',
      symbolFillColor: '#4682b4',
      symbolStrokeWidth: 0,
      symbolOpacity: 1,
      symbolType: 'circle',

      layout: {
        right: {
          direction: 'vertical',
          anchor: { signal: 'anchorRight' }
        },
        bottom: {
          margin: 2,
          direction: 'vertical',
          anchor: 'middle',
          center: true
        },
        top: {
          margin: 2,
          direction: 'vertical',
          anchor: 'end'
        }
      }
    }
  },

  signals: [
    {
      name: 'anchorRight',
      value: 'middle',
      bind: { input: 'select', options: ['start', 'middle', 'end'] }
    }
  ],

  data: [
    {
      name: 'source',
      url: 'data/cars.json',
      transform: [
        {
          type: 'filter',
          expr: 'datum.Horsepower != null && datum.Miles_per_Gallon != null && datum.Acceleration != null'
        }
      ]
    }
  ],

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
      title: 'Horsepower',
      titleAnchor: 'end',
      titleBaseline: 'bottom',
      titleY: -5
    },
    {
      scale: 'y',
      grid: true,
      domain: false,
      orient: 'left',
      titlePadding: 5,
      title: 'Miles_per_Gallon',
      titleAlign: 'left',
      titleBaseline: 'bottom',
      titleAnchor: 'end',
      titleAngle: 90,
      titleX: 5
    }
  ],

  legends: [
    {
      size: 'size',
      orient: 'right',
      title: 'Acceleration',
      direction: 'vertical',
      titleOrient: 'top',
      values: [1, 5, 10, 20]
    },
    {
      size: 'size',
      orient: 'bottom',
      title: 'Legend 1',
      values: [0, 2, 5, 10, 12, 15, 18, 20]
    },
    {
      size: 'size',
      orient: 'bottom',
      title: 'Legend 2',
      values: [0, 2, 5, 10, 15, 20]
    }
  ],

  marks: [
    {
      name: 'marks',
      type: 'symbol',
      from: { data: 'source' },
      encode: {
        enter: {
          x: { scale: 'x', field: 'Horsepower' },
          y: { scale: 'y', field: 'Miles_per_Gallon' },
          size: { scale: 'size', field: 'Acceleration' },
          shape: { value: 'circle' },
          opacity: { value: 0.25 }
        },
        update: {
          fill: { value: '#4682b4' }
        },
        hover: {
          fill: { value: 'firebrick' }
        }
      }
    }
  ]
};
