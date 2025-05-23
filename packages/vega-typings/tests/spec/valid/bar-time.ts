import { Spec } from 'vega';

export const spec: Spec = {
  $schema: 'https://vega.github.io/schema/vega/v6.json',
  width: 500,
  height: 200,
  padding: 5,

  config: {
    title: { frame: 'group' },
    locale: {
      number: {
        decimal: ',',
        thousands: '.',
        grouping: [3],
        currency: ['', '\u00a0€']
      },
      time: {
        dateTime: '%A, der %e. %B %Y, %X',
        date: '%d.%m.%Y',
        time: '%H:%M:%S',
        periods: ['AM', 'PM'],
        days: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
        shortDays: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
        months: [
          'Januar',
          'Februar',
          'März',
          'April',
          'Mai',
          'Juni',
          'Juli',
          'August',
          'September',
          'Oktober',
          'November',
          'Dezember'
        ],
        shortMonths: [
          'Jan',
          'Feb',
          'Mrz',
          'Apr',
          'Mai',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Okt',
          'Nov',
          'Dez'
        ]
      }
    }
  },

  signals: [
    {
      name: 'timeunits',
      value: ['day'],
      bind: {
        input: 'select',
        options: [
          ['day'],
          ['week', 'day'],
          ['date'],
          ['month', 'date'],
          ['quarter', 'date'],
          ['year', 'month', 'date']
        ]
      }
    }
  ],

  data: [
    {
      name: 'table',
      values: [
        { d: 0 },
        { d: 0 },
        { d: 1 },
        { d: 1 },
        { d: 1 },
        { d: 1 },
        { d: 2 },
        { d: 2 },
        { d: 2 },
        { d: 2 },
        { d: 2 },
        { d: 4 },
        { d: 4 },
        { d: 4 },
        { d: 4 },
        { d: 4 },
        { d: 4 },
        { d: 5 },
        { d: 5 },
        { d: 5 },
        { d: 5 },
        { d: 5 },
        { d: 6 },
        { d: 6 },
        { d: 6 }
      ],
      transform: [
        {
          type: 'timeunit',
          field: { expr: 'datetime(2012, 0, datum.d + 1)' },
          units: { signal: 'timeunits' },
          signal: 'tbin'
        },
        {
          type: 'aggregate',
          groupby: ['unit0']
        }
      ]
    }
  ],

  marks: [
    {
      type: 'group',
      title: 'Ordinal (Band) Time Scale',

      encode: {
        enter: {
          width: { signal: 'width' },
          height: { signal: 'height' }
        }
      },

      scales: [
        {
          name: 'xscale',
          type: 'band',
          range: 'width',
          padding: 0.05,
          round: true,
          domain: { signal: "timeSequence('day', tbin.start, tbin.stop)" }
        },
        {
          name: 'yscale',
          type: 'linear',
          range: 'height',
          domain: { data: 'table', field: 'count' },
          zero: true,
          nice: true
        }
      ],

      axes: [
        {
          orient: 'bottom',
          scale: 'xscale',
          zindex: 1,
          formatType: 'time',
          format: { signal: 'timeUnitSpecifier(tbin.units)' }
        },
        { orient: 'left', scale: 'yscale', zindex: 1 }
      ],

      marks: [
        {
          type: 'rect',
          from: { data: 'table' },
          encode: {
            enter: {
              x: { scale: 'xscale', field: 'unit0' },
              width: { scale: 'xscale', band: 1 },
              y: { scale: 'yscale', field: 'count' },
              y2: { scale: 'yscale', value: 0 }
            },
            update: {
              fill: { value: 'steelblue' }
            },
            hover: {
              fill: { value: 'red' }
            }
          }
        }
      ]
    },
    {
      type: 'group',
      title: 'Continuous Time Scale',

      encode: {
        enter: {
          y: { value: 255 },
          width: { signal: 'width' },
          height: { signal: 'height' }
        }
      },

      scales: [
        {
          name: 'xscale',
          type: 'time',
          range: 'width',
          domain: { signal: '[tbin.start, tbin.stop]' }
        },
        {
          name: 'yscale',
          type: 'linear',
          range: 'height',
          domain: { data: 'table', field: 'count' },
          zero: true,
          nice: true
        }
      ],

      axes: [
        {
          orient: 'bottom',
          scale: 'xscale',
          zindex: 1,
          tickCount: 7,
          format: { signal: 'timeUnitSpecifier(tbin.units)' }
        },
        { orient: 'left', scale: 'yscale', zindex: 1 }
      ],

      marks: [
        {
          type: 'rect',
          from: { data: 'table' },
          encode: {
            enter: {
              x: { scale: 'xscale', field: 'unit0' },
              x2: { scale: 'xscale', signal: 'timeOffset(tbin.unit, datum.unit0)', offset: -1 },
              y: { scale: 'yscale', field: 'count' },
              y2: { scale: 'yscale', value: 0 }
            },
            update: {
              fill: { value: 'steelblue' }
            },
            hover: {
              fill: { value: 'red' }
            }
          }
        }
      ]
    }
  ]
};
