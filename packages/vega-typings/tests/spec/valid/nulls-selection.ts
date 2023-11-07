import { Spec } from 'vega';

export const spec: Spec = {
  $schema: 'https://vega.github.io/schema/vega/v5.json',
  description: 'A simple pie chart with embedded data.',
  background: 'white',
  padding: 5,
  width: 200,
  height: 200,
  style: 'view',
  data: [
    { name: 'click_store' },
    {
      name: 'source_0',
      values: [
        { category: 1, value: 4 },
        { category: 2, value: 6 },
        { category: 3, value: 10 },
        { category: 4, value: 3 },
        { category: 5, value: 7 },
        { category: 6, value: 8 },
        { category: null, value: 10 }
      ]
    },
    {
      name: 'data_0',
      source: 'source_0',
      transform: [
        {
          type: 'stack',
          groupby: [],
          field: 'value',
          sort: { field: ['category'], order: ['ascending'] },
          as: ['value_start', 'value_end'],
          offset: 'zero'
        },
        {
          type: 'filter',
          expr: 'isValid(datum["value"]) && isFinite(+datum["value"])'
        }
      ]
    }
  ],
  signals: [
    {
      name: 'unit',
      value: {},
      on: [{ events: 'mousemove', update: 'isTuple(group()) ? group() : unit' }]
    },
    {
      name: 'click',
      update: 'vlSelectionResolve("click_store", "union", true, true)'
    },
    {
      name: 'click_tuple',
      on: [
        {
          events: [{ source: 'scope', type: 'click' }],
          update:
            'datum && item().mark.marktype !== \'group\' && indexof(item().mark.role, \'legend\') < 0 ? {unit: "", fields: click_tuple_fields, values: [(item().isVoronoi ? datum.datum : datum)["category"]]} : null',
          force: true
        },
        { events: [{ source: 'view', type: 'dblclick' }], update: 'null' }
      ]
    },
    {
      name: 'click_tuple_fields',
      value: [{ field: 'category', channel: 'color', type: 'E' }]
    },
    {
      name: 'click_toggle',
      value: false,
      on: [
        {
          events: [{ source: 'scope', type: 'click' }],
          update: 'event.shiftKey'
        },
        { events: [{ source: 'view', type: 'dblclick' }], update: 'false' }
      ]
    },
    {
      name: 'click_modify',
      on: [
        {
          events: { signal: 'click_tuple' },
          update:
            'modify("click_store", click_toggle ? null : click_tuple, click_toggle ? null : true, click_toggle ? click_tuple : null)'
        }
      ]
    }
  ],
  marks: [
    {
      name: 'marks',
      type: 'arc',
      style: ['arc'],
      interactive: true,
      from: { data: 'data_0' },
      encode: {
        update: {
          fill: { scale: 'color', field: 'category' },
          opacity: [
            {
              test: '!length(data("click_store")) || vlSelectionTest("click_store", datum)',
              value: 1
            },
            { value: 0.5 }
          ],
          description: {
            signal:
              '"value: " + (format(datum["value"], "")) + "; category: " + (isValid(datum["category"]) ? datum["category"] : ""+datum["category"])'
          },
          x: { signal: 'width', mult: 0.5 },
          y: { signal: 'height', mult: 0.5 },
          outerRadius: { signal: 'min(width,height)/2' },
          innerRadius: { value: 0 },
          startAngle: { scale: 'theta', field: 'value_end' },
          endAngle: { scale: 'theta', field: 'value_start' }
        }
      }
    }
  ],
  scales: [
    {
      name: 'theta',
      type: 'linear',
      domain: { data: 'data_0', fields: ['value_start', 'value_end'] },
      range: [0, 6.283185307179586],
      zero: true
    },
    {
      name: 'color',
      type: 'ordinal',
      domain: { data: 'data_0', field: 'category', sort: true },
      range: 'category'
    }
  ],
  legends: [
    {
      fill: 'color',
      symbolType: 'circle',
      title: 'category',
      encode: { symbols: { update: { opacity: { value: 1 } } } }
    }
  ]
};
