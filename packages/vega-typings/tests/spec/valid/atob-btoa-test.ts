import { Spec } from 'vega';

export const spec: Spec = {
  $schema: 'https://vega.github.io/schema/vega/v5.json',
  background: 'white',
  padding: 5,
  style: 'cell',
  data: [
    {
      name: 'source_0',
      values: [
        { a: 'A', b: 28 },
        { a: 'B', b: 55 },
        { a: 'C', b: 43 }
      ]
    },
    {
      name: 'data_0',
      source: 'source_0',
      transform: [
        { type: 'formula', expr: 'atob(btoa(datum.a))', as: 'identity' },
        { type: 'formula', expr: 'btoa(datum.a)', as: 'encoded' }
      ]
    }
  ],
  signals: [
    { name: 'x_step', value: 20 },
    {
      name: 'width',
      update: "bandspace(domain('x').length, 0.1, 0.05) * x_step"
    },
    { name: 'y_step', value: 20 },
    {
      name: 'height',
      update: "bandspace(domain('y').length, 0.1, 0.05) * y_step"
    }
  ],
  marks: [
    {
      name: 'marks',
      type: 'rect',
      style: ['bar'],
      from: { data: 'data_0' },
      encode: {
        update: {
          fill: { scale: 'color', field: 'a' },
          ariaRoleDescription: { value: 'bar' },
          description: {
            signal:
              '"identity: " + (isValid(datum["identity"]) ? datum["identity"] : ""+datum["identity"]) + "; encoded: " + (isValid(datum["encoded"]) ? datum["encoded"] : ""+datum["encoded"]) + "; a: " + (isValid(datum["a"]) ? datum["a"] : ""+datum["a"])'
          },
          x: { scale: 'x', field: 'identity' },
          width: { signal: "max(0.25, bandwidth('x'))" },
          y: { scale: 'y', field: 'encoded' },
          height: { signal: "max(0.25, bandwidth('y'))" }
        }
      }
    }
  ],
  scales: [
    {
      name: 'x',
      type: 'band',
      domain: { data: 'data_0', field: 'identity', sort: true },
      range: { step: { signal: 'x_step' } },
      paddingInner: 0.1,
      paddingOuter: 0.05
    },
    {
      name: 'y',
      type: 'band',
      domain: { data: 'data_0', field: 'encoded', sort: true },
      range: { step: { signal: 'y_step' } },
      paddingInner: 0.1,
      paddingOuter: 0.05
    },
    {
      name: 'color',
      type: 'ordinal',
      domain: { data: 'data_0', field: 'a', sort: true },
      range: 'category'
    }
  ],
  axes: [
    {
      scale: 'x',
      orient: 'bottom',
      grid: false,
      title: 'identity',
      labelAlign: 'right',
      labelAngle: 270,
      labelBaseline: 'middle',
      zindex: 0
    },
    {
      scale: 'y',
      orient: 'left',
      grid: false,
      title: 'encoded',
      zindex: 0
    }
  ]
};
