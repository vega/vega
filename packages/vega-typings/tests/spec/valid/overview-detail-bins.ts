import { Spec } from 'vega';

export const spec: Spec = {
  $schema: 'https://vega.github.io/schema/vega/v6.json',
  autosize: 'pad',
  padding: 5,
  width: 963,
  data: [
    {
      name: 'time_store'
    },
    {
      name: 'source_0',
      url: 'data/flights-5k.json',
      format: { type: 'json' },
      transform: [
        {
          type: 'formula',
          expr: 'hours(datum.date) + minutes(datum.date) / 60',
          as: 'time'
        },
        {
          type: 'extent',
          field: 'time',
          signal: 'concat_1_bin_maxbins_30_time_extent'
        },
        {
          type: 'bin',
          field: 'time',
          as: ['bin_maxbins_30_time', 'bin_maxbins_30_time_end'],
          signal: 'concat_1_bin_maxbins_30_time_bins',
          maxbins: 30,
          extent: { signal: 'concat_1_bin_maxbins_30_time_extent' },
          span: { signal: "span(time['time'])" }
        },
        {
          type: 'extent',
          field: 'time',
          signal: 'concat_0_bin_maxbins_30_minstep_1_time_extent'
        },
        {
          type: 'bin',
          field: 'time',
          as: ['bin_maxbins_30_minstep_1_time', 'bin_maxbins_30_minstep_1_time_end'],
          signal: 'concat_0_bin_maxbins_30_minstep_1_time_bins',
          maxbins: 30,
          minstep: 1,
          extent: { signal: 'concat_0_bin_maxbins_30_minstep_1_time_extent' }
        }
      ]
    },
    {
      name: 'data_0',
      source: 'source_0',
      transform: [
        {
          type: 'aggregate',
          groupby: ['bin_maxbins_30_time', 'bin_maxbins_30_time_end'],
          ops: ['count'],
          fields: [null],
          as: ['__count']
        },
        {
          type: 'filter',
          expr: 'datum["bin_maxbins_30_time"] !== null && !isNaN(datum["bin_maxbins_30_time"])'
        }
      ]
    },
    {
      name: 'data_1',
      source: 'source_0',
      transform: [
        {
          type: 'aggregate',
          groupby: ['bin_maxbins_30_minstep_1_time', 'bin_maxbins_30_minstep_1_time_end'],
          ops: ['count'],
          fields: [null],
          as: ['__count']
        },
        {
          type: 'filter',
          expr: 'datum["bin_maxbins_30_minstep_1_time"] !== null && !isNaN(datum["bin_maxbins_30_minstep_1_time"])'
        }
      ]
    }
  ],
  signals: [
    { name: 'concat_0_height', value: 100 },
    { name: 'concat_1_height', value: 100 },
    {
      name: 'unit',
      value: {},
      on: [{ events: 'mousemove', update: 'isTuple(group()) ? group() : unit' }]
    },
    {
      name: 'time',
      update: 'vlSelectionResolve("time_store")'
    }
  ],
  layout: { padding: 20, columns: 1, bounds: 'full', align: 'each' },
  marks: [
    {
      type: 'group',
      name: 'concat_0_group',
      style: 'cell',
      encode: {
        update: {
          width: { signal: 'width' },
          height: { signal: 'concat_0_height' }
        }
      },
      signals: [
        {
          name: 'time_x',
          value: [],
          on: [
            {
              events: {
                source: 'scope',
                type: 'mousedown',
                filter: ['!event.item || event.item.mark.name !== "time_brush"']
              },
              update: '[x(unit), x(unit)]'
            },
            {
              events: {
                source: 'window',
                type: 'mousemove',
                consume: true,
                between: [
                  {
                    source: 'scope',
                    type: 'mousedown',
                    filter: ['!event.item || event.item.mark.name !== "time_brush"']
                  },
                  { source: 'window', type: 'mouseup' }
                ]
              },
              update: '[time_x[0], clamp(x(unit), 0, width)]'
            },
            {
              events: { signal: 'time_scale_trigger' },
              update: '[scale("concat_0_x", time_time[0]), scale("concat_0_x", time_time[1])]'
            },
            {
              events: { signal: 'time_translate_delta' },
              update:
                'clampRange(panLinear(time_translate_anchor.extent_x, time_translate_delta.x / span(time_translate_anchor.extent_x)), 0, width)'
            },
            {
              events: { signal: 'time_zoom_delta' },
              update:
                'clampRange(zoomLinear(time_x, time_zoom_anchor.x, time_zoom_delta), 0, width)'
            },
            {
              events: [{ source: 'scope', type: 'dblclick' }],
              update: '[0, 0]'
            }
          ]
        },
        {
          name: 'time_time',
          value: [5, 10],
          on: [
            {
              events: { signal: 'time_x' },
              update: 'time_x[0] === time_x[1] ? null : invert("concat_0_x", time_x)'
            }
          ]
        },
        {
          name: 'time_scale_trigger',
          value: {},
          on: [
            {
              events: [{ scale: 'concat_0_x' }],
              update:
                '(!isArray(time_time) || (+invert("concat_0_x", time_x)[0] === +time_time[0] && +invert("concat_0_x", time_x)[1] === +time_time[1])) ? time_scale_trigger : {}'
            }
          ]
        },
        {
          name: 'time_tuple',
          update:
            'time_time ? {unit: "concat_0", fields: time_tuple_fields, values: [time_time]} : null'
        },
        {
          name: 'time_tuple_fields',
          value: [{ field: 'time', channel: 'x', type: 'R' }]
        },
        {
          name: 'time_translate_anchor',
          value: {},
          on: [
            {
              events: [
                {
                  source: 'scope',
                  type: 'mousedown',
                  markname: 'time_brush'
                }
              ],
              update: '{x: x(unit), y: y(unit), extent_x: slice(time_x)}'
            }
          ]
        },
        {
          name: 'time_translate_delta',
          value: {},
          on: [
            {
              events: [
                {
                  source: 'window',
                  type: 'mousemove',
                  consume: true,
                  between: [
                    {
                      source: 'scope',
                      type: 'mousedown',
                      markname: 'time_brush'
                    },
                    { source: 'window', type: 'mouseup' }
                  ]
                }
              ],
              update: '{x: time_translate_anchor.x - x(unit), y: time_translate_anchor.y - y(unit)}'
            }
          ]
        },
        {
          name: 'time_zoom_anchor',
          on: [
            {
              events: [
                {
                  source: 'scope',
                  type: 'wheel',
                  consume: true,
                  markname: 'time_brush'
                }
              ],
              update: '{x: x(unit), y: y(unit)}'
            }
          ]
        },
        {
          name: 'time_zoom_delta',
          on: [
            {
              events: [
                {
                  source: 'scope',
                  type: 'wheel',
                  consume: true,
                  markname: 'time_brush'
                }
              ],
              force: true,
              update: 'pow(1.001, event.deltaY * pow(16, event.deltaMode))'
            }
          ]
        },
        {
          name: 'time_modify',
          update: 'modify("time_store", time_tuple, true)'
        }
      ],
      marks: [
        {
          name: 'time_brush_bg',
          type: 'rect',
          clip: true,
          encode: {
            enter: {
              fill: { value: '#333' },
              fillOpacity: { value: 0.125 }
            },
            update: {
              x: [
                {
                  test: 'data("time_store").length && data("time_store")[0].unit === "concat_0"',
                  signal: 'time_x[0]'
                },
                { value: 0 }
              ],
              y: [
                {
                  test: 'data("time_store").length && data("time_store")[0].unit === "concat_0"',
                  value: 0
                },
                { value: 0 }
              ],
              x2: [
                {
                  test: 'data("time_store").length && data("time_store")[0].unit === "concat_0"',
                  signal: 'time_x[1]'
                },
                { value: 0 }
              ],
              y2: [
                {
                  test: 'data("time_store").length && data("time_store")[0].unit === "concat_0"',
                  field: { group: 'height' }
                },
                { value: 0 }
              ]
            }
          }
        },
        {
          name: 'concat_0_marks',
          type: 'rect',
          style: ['bar'],
          from: { data: 'data_1' },
          encode: {
            update: {
              fill: { value: '#4c78a8' },
              x2: [
                {
                  test: 'datum["bin_maxbins_30_minstep_1_time"] === null || isNaN(datum["bin_maxbins_30_minstep_1_time"])',
                  value: 0
                },
                {
                  scale: 'concat_0_x',
                  field: 'bin_maxbins_30_minstep_1_time',
                  offset: 1
                }
              ],
              x: [
                {
                  test: 'datum["bin_maxbins_30_minstep_1_time"] === null || isNaN(datum["bin_maxbins_30_minstep_1_time"])',
                  value: 0
                },
                {
                  scale: 'concat_0_x',
                  field: 'bin_maxbins_30_minstep_1_time_end'
                }
              ],
              y: { scale: 'concat_0_y', field: '__count' },
              y2: { scale: 'concat_0_y', value: 0 }
            }
          }
        },
        {
          name: 'time_brush',
          type: 'rect',
          clip: true,
          encode: {
            enter: { fill: { value: 'transparent' } },
            update: {
              x: [
                {
                  test: 'data("time_store").length && data("time_store")[0].unit === "concat_0"',
                  signal: 'time_x[0]'
                },
                { value: 0 }
              ],
              y: [
                {
                  test: 'data("time_store").length && data("time_store")[0].unit === "concat_0"',
                  value: 0
                },
                { value: 0 }
              ],
              x2: [
                {
                  test: 'data("time_store").length && data("time_store")[0].unit === "concat_0"',
                  signal: 'time_x[1]'
                },
                { value: 0 }
              ],
              y2: [
                {
                  test: 'data("time_store").length && data("time_store")[0].unit === "concat_0"',
                  field: { group: 'height' }
                },
                { value: 0 }
              ],
              stroke: [{ test: 'time_x[0] !== time_x[1]', value: 'white' }, { value: null }]
            }
          }
        }
      ],
      axes: [
        {
          scale: 'concat_0_x',
          orient: 'bottom',
          grid: false,
          title: 'time',
          format: 'd',
          titleAnchor: 'start',
          labelFlush: true,
          labelOverlap: true,
          tickCount: { signal: 'ceil(width/10)' },
          zindex: 0
        }
      ]
    },
    {
      type: 'group',
      name: 'concat_1_group',
      style: 'cell',
      encode: {
        update: {
          width: { signal: 'width' },
          height: { signal: 'concat_1_height' }
        }
      },
      marks: [
        {
          name: 'concat_1_marks',
          type: 'rect',
          clip: true,
          style: ['bar'],
          from: { data: 'data_0' },
          encode: {
            update: {
              fill: { value: '#4c78a8' },
              x2: [
                {
                  test: 'datum["bin_maxbins_30_time"] === null || isNaN(datum["bin_maxbins_30_time"])',
                  value: 0
                },
                {
                  scale: 'concat_1_x',
                  field: 'bin_maxbins_30_time',
                  offset: 1
                }
              ],
              x: [
                {
                  test: 'datum["bin_maxbins_30_time"] === null || isNaN(datum["bin_maxbins_30_time"])',
                  value: 0
                },
                { scale: 'concat_1_x', field: 'bin_maxbins_30_time_end' }
              ],
              y: { scale: 'concat_1_y', field: '__count' },
              y2: { scale: 'concat_1_y', value: 0 }
            }
          }
        }
      ],
      axes: [
        {
          scale: 'concat_1_x',
          orient: 'bottom',
          grid: false,
          title: 'time',
          titleAnchor: 'start',
          labelFlush: true,
          labelOverlap: true,
          tickCount: { signal: 'ceil(width/10)' },
          zindex: 0
        }
      ]
    }
  ],
  scales: [
    {
      name: 'concat_0_x',
      type: 'linear',
      domain: {
        signal:
          '[concat_0_bin_maxbins_30_minstep_1_time_bins.start, concat_0_bin_maxbins_30_minstep_1_time_bins.stop]'
      },
      range: [0, { signal: 'width' }],
      bins: { signal: 'concat_0_bin_maxbins_30_minstep_1_time_bins' },
      zero: false
    },
    {
      name: 'concat_0_y',
      type: 'linear',
      domain: { data: 'data_1', field: '__count' },
      range: [{ signal: 'concat_0_height' }, 0],
      nice: true,
      zero: true
    },
    {
      name: 'concat_1_x',
      type: 'linear',
      domain: {
        signal: '[concat_1_bin_maxbins_30_time_bins.start, concat_1_bin_maxbins_30_time_bins.stop]'
      },
      domainRaw: { signal: 'time["time"]' },
      range: [0, { signal: 'width' }],
      bins: { signal: 'concat_1_bin_maxbins_30_time_bins' },
      zero: false
    },
    {
      name: 'concat_1_y',
      type: 'linear',
      domain: { data: 'data_0', field: '__count' },
      range: [{ signal: 'concat_1_height' }, 0],
      nice: true,
      zero: true
    }
  ],
  config: { style: { cell: { stroke: null } } }
};
