import { Spec } from 'vega';

export const spec: Spec = {
  $schema: 'https://vega.github.io/schema/vega/v5.json',
  autosize: {
    type: 'pad'
  },
  background: 'red',
  width: 500,
  height: 500,
  data: [
    {
      name: 'data',
      values: []
    }
  ],
  scales: [
    {
      name: 'color',
      type: 'ordinal',
      domain: {
        data: 'data',
        field: 'series',
        sort: true
      },
      range: 'category'
    }
  ],
  legends: [
    {
      stroke: 'color',
      symbolType: 'stroke'
    }
  ]
};
