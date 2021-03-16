---
layout: transform
title: TimeUnit Transform
permalink: /docs/transforms/timeunit/index.html
---

The **timeunit** transform {% include tag ver="5.8" %} discretizes date-time values into time unit bins. A common use case is to group data values into specific time intervals, such as months or days of the week.

## Transform Parameters

| Property            | Type                            | Description   |
| :------------------ | :-----------------------------: | :------------ |
| field               | {% include type t="Field" %}    | {% include required %} The data field of date-time values.|
| units               | {% include type t="String[]" %} | An array of time unit specifiers defining how date-time values should be binned. See the [time unit reference](#time-units) for more. If unspecified, the units will be inferred based on the value _extent_.|
| step               | {% include type t="Number" %}    | The number of steps between bins in terms of the smallest provided time unit in _units_ (default `1`). If _units_ is unspecified, this parameter is ignored.|
| timezone            | {% include type t="String" %}   | The timezone to use, one of `"local"` (default) for the local timezone or `"utc"` for [Coordinated Universal Time](https://en.wikipedia.org/wiki/Coordinated_Universal_Time) (UTC).|
| interval            | {% include type t="String" %}   | A boolean flag (default `true`) indicating if both the start and end unit values should be output. If `false`, only the starting (floored) time unit value is written to the output.|
| extent              | {% include type t="Date[]" %} | A two-element array with the minimum and maximum values to consider for inferred time units. If unspecified, the observed minimum and maximum values of _field_ will be used. This parameter is applicable only if the _units_ parameter is unspecified.|
| maxbins             | {% include type t="Number" %}   | The maximum number of bins to create for inferred time units (default `40`). There will often be fewer bins as the domain gets sliced at "nicely" rounded values. This parameter is applicable only if the _units_ parameter is unspecified.|
| signal              | {% include type t="String" %}   | If defined, binds the computed time unit specification to a signal with the given name. The bound has object has _unit_ (the smallest time unit), _units_ (the array of all time units), _step_, _start_, and _stop_ properties. |
| as                  | {% include type t="String[]" %} | The output fields at which to write the start and end time unit interval values. The default is `["unit0", "unit1"]`.|

## <a name="time-units"></a>Time Units

The timeunit transform accepts the following set of pre-defined time units. A single unit value is one of the following strings:

- `"year"` - [Gregorian calendar](https://en.wikipedia.org/wiki/Gregorian_calendar) years.
- `"quarter"` - Three-month intervals, starting in one of January, April, July, and October.
- `"month"` - Calendar months (January, February, _etc._).
- `"date"` - Calendar day of the month (January 1, January 2, _etc._).
- `"week"` - Sunday-based weeks. Days before the first Sunday of the year are considered to be in week 0, the first Sunday of the year is the start of week 1, the second Sunday week 2, _etc._.
- `"day"` - Day of the week (Sunday, Monday, _etc._).
- `"dayofyear"` - Day of the year (1, 2, ..., 365, _etc._).
- `"hours"` - Hours of the day (12:00am, 1:00am, _etc_.).
- `"minutes"` - Minutes in an hour (12:00, 12:01, _etc_.).
- `"seconds"` - Seconds in a minute (12:00:00, 12:00:01, _etc_.).
- `"milliseconds"` - Milliseconds in a second.

The _units_ transform parameter accepts an array to indicate desired intervals of time. For example, `["year", "month", "date"]` indicates chronological time sensitive to year, month, and date (but not to hours, minutes, or seconds). The specifier `["month", "date"]` is sensitive to month and date, but not year, which can be useful for binning time values to look at seasonal patterns only.

## Usage

### Chronological Time Units

This example discretizes values in the _date_ field by year and Sunday-based week number (_units_), using two week intervals (_step_).

```json
{"type": "timeunit", "field": "amount", "units": ["year", "week"], "step": 2}
```

Given the input data

```js
[
  {"date": Date(2018,  0, 11)},
  {"date": Date(2018,  4, 12)},
  {"date": Date(2018,  8,  7)},
  {"date": Date(2018, 11, 23)}
]
```

the timeunit transform produces the output

```js
[
  {"date": Date(2018,  0, 11), "unit0": Date(2018,  0,  7), "unit1": Date(2018,  0, 21)},
  {"date": Date(2018,  4, 12), "unit0": Date(2018,  3, 29), "unit1": Date(2018,  4, 13)}},
  {"date": Date(2018,  8,  7), "unit0": Date(2018,  8,  2), "unit1": Date(2018,  8, 16)}},
  {"date": Date(2018, 11, 23), "unit0": Date(2018, 11, 23), "unit1": Date(2019,  0,  6)}}
]
```

Alternatively, a grouping by year and month is specified using `"units": ["year", "month"]`.

### Cyclical Time Units

This example discretizes values in the _date_ field by month, regardless of the year.

```json
{"type": "timeunit", "field": "amount", "units": ["month"]}
```

Given the input data

```js
[
  {"date": Date(2018,  0,  4)},
  {"date": Date(2018,  4, 12)},
  {"date": Date(2018,  8,  7)},
  {"date": Date(2018, 11, 23)}
]
```

the timeunit transform produces the output

```js
[
  {"date": Date(2018,  0,  4), "unit0": Date(2012,  0, 1), "unit1": Date(2012, 1, 1)},
  {"date": Date(2018,  4, 12), "unit0": Date(2012,  4, 1), "unit1": Date(2012, 5, 1)}},
  {"date": Date(2018,  8,  7), "unit0": Date(2012,  8, 1), "unit1": Date(2012, 9, 1)}},
  {"date": Date(2018, 11, 23), "unit0": Date(2012, 11, 1), "unit1": Date(2013, 0, 1)}}
]
```

Note that the output dates default to the year 2012. This default is chosen as it is a leap year (and so the date February 29 is respected) that begins on a Sunday (and so days of the week will order properly at the beginning of the year).

A similar grouping by Sunday-based day of week is specified by `"units": ["day"]`, whereas grouping by day of the month (regardless of year or month) is specified by `"units": ["date"]`.
