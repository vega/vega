import { Spec } from 'vega';

export const spec: Spec = {
  $schema: 'https://vega.github.io/schema/vega/v6.json',
  width: 200,
  height: 120,
  data: [
    {
      name: 'points',
      values: [
        { group: 'a', x: 0, y: 0 },
        { group: 'a', x: 10, y: 0 },
        { group: 'a', x: 10, y: 10 },
        { group: 'a', x: 0, y: 10 }
      ]
    },
    {
      name: 'hull',
      source: 'points',
      transform: [
        {
          type: 'convexhull',
          x: 'x',
          y: 'y',
          groupby: ['group'],
          offset: 1,
          as: ['hx', 'hy', 'x', 'y']
        }
      ]
    }
  ]
};
