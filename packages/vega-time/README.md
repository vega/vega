# vega-time

JavaScript date-time utilities for Vega. Provides a set of helper methods for working with date objects (or, equivalently, with [UNIX timestamps](https://en.wikipedia.org/wiki/Unix_time)).

## API Reference

- [Time Units](#time-units)
- [Local Time Utilities](#local-time-utilities)
- [UTC Time Utilities](#utc-time-utilities)

### Time Units

The date-time utilities support a set of pre-defined time units. A single _unit_ value is one of the following strings:

- `'year'` - [Gregorian calendar](https://en.wikipedia.org/wiki/Gregorian_calendar) years.
- `'quarter'` - Three-month intervals, starting in one of January, April, July, and October.
- `'month'` - Calendar months (January, February, _etc._).
- `'date'` - Calendar day of the month (January 1, January 2, _etc._).
- `'week'` - Sunday-based weeks. Days before the first Sunday of the year are considered to be in week 0, the first Sunday of the year is the start of week 1, the second Sunday week 2, _etc._.
- `'day'` - Day of the week (Sunday, Monday, _etc._).
- `'hours'` - Hours of the day (12:00am, 1:00am, _etc_.).
- `'minutes'` - Minutes in an hour (12:00, 12:01, _etc_.).
- `'seconds'` - Seconds in a minute (12:00:00, 12:00:01, _etc_.).
- `'milliseconds'` - Milliseconds in a second.

Multiple _units_ can be listed in an array to indicate desired intervals of time. For example, `['year', 'month', 'date']` indicates chronological time sensitive to year, month, and date (but not to hours, minutes, or seconds). The specifier `['month', 'date']` is sensitive to month and date, but not year, which can be useful for binning time values to look at seasonal patterns only.

<a name="timeUnits" href="#timeUnits">#</a>
vega.<b>timeUnits</b>(<i>units</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-time/src/units.js "Source")

Returns a standardized and sorted specifier for the given _units_, which must be an array of one or more valid time unit strings. The returned array contains the same units, sorted in decreasing over of unit size, such that the most granular unit is last (for example, `['year', 'month', 'date']`). This method throws an error if the _units_ array is empty, contains an invalid unit, or contains incompatible units. Specifically, the `'quarter'`, `'month'`, and `'date'` units can not be used in conjunction with the `'week'` or `'day'` units.

<a name="timeUnitSpecifier" href="#timeUnitSpecifier">#</a>
vega.<b>timeUnitSpecifier</b>(<i>units</i>[, <i>specifiers</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-time/src/format.js "Source")

Returns a time format specifier string for the given time _units_. The optional _specifiers_ object provides a set of desired specifier sub-strings for customizing the resulting time formats. The _specifiers_ object may contain keys for both single time units (`"year"`) and time unit sequences (`"year-month-date"`). This method will first standardize the input time units using the [timeUnits](#timeUnits) method. It will then search, starting from the beginning of the units array, for the largest matching sequence defined in the specifiers object. Matching entries are then concatenated together, and the resulting string is whitespace-trimmed and returned.

If no _specifiers_ object is provided, the following defaults are used:

```json
{
  "year": "%Y ",
  "year-month": "%Y-%m ",
  "year-month-date": "%Y-%m-%d ",
  "quarter": "Q%q ",
  "month": "%b ",
  "date": "%d ",
  "week": "W%U ",
  "day": "%a ",
  "hours": "%H:00",
  "hours-minutes": "%H:%M",
  "minutes": "00:%M",
  "seconds": ":%S",
  "milliseconds": ".%L"
}
```

If a _specifiers_ object is provided, its values are merged with the defaults above. As a result, for complete control callees may wish to override the multi-unit `"year-month"`, `"year-month-date"`, and `"hours-minutes"` entries in addition to any individual unit entries. The input _specifiers_ object can use a `null` value to invalidate an entry in the defaults.

<a name="timeBin" href="#timeBin">#</a>
vega.<b>timeBin</b>(<i>options</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-time/src/bin.js "Source")

Determine a temporal binning scheme, for example to create a histogram. Based on the options provided given, this method will search over a space of possible time unit bins, applying constraints such as the maximum number of allowable bins. Given a set of options (see below), returns an object describing the binning scheme, in terms of `units` and `step` properties. These values can then be used as input to the [timeFloor](#timeFloor) or [utcFloor](#utcFloor) methods.

The supported options properties are:

- _extent_: (required) A two-element (`[min, max]`) array indicating the date range over which the bin values are defined.
- _maxbins_: The maximum number of allowable bins (default `40`).


### Local Time Utilities

<a name="timeFormat" href="#timeFormat">#</a>
vega.<b>timeFormat</b>([<i>specifier</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-time/src/format.js "Source")

Returns a function that takes a date or timestamp as input and returns a formatted string in the local timezone. If a string-valued format _specifier_ is provided, it must follow the [d3-time-format](https://github.com/d3/d3-time-format/#locale_format) syntax. In this case, this method is equivalent to d3-time-format's [timeFormat](https://github.com/d3/d3-time-format/#timeFormat) method.

If an object-valued _specifier_ is provided, a multi-format function will be generated, which selects among different format specifiers based on the granularity of the input date value (that is, values residing on a year, month, date, _etc._, boundary can all be formatted differently). The input object should use proper time unit strings for keys. If no time format _specifier_ is provided, a default multi-format function is returned, equivalent to using the following _specifier_:

```json
{
  "year": "%Y",
  "quarter": "%B",
  "month": "%B",
  "week": "%b %d",
  "date": "%a %d",
  "hours": "%I %p",
  "minutes": "%I:%M",
  "seconds": ":%S",
  "milliseconds": ".%L"
}
```

If an input _specifier_ object omits any of these key values, a default value will be used. Note that for this method the `"date"` and `"day"` units are interchangeable; if both are defined the `"date"` entry take precedence.

<a name="timeFloor" href="#timeFloor">#</a>
vega.<b>timeFloor</b>(<i>units</i>[, <i>step</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-time/src/floor.js "Source")

Returns a function that performs flooring (truncation) of input dates to given time _units_ in the local timezone. The _units_ argument must be an array of valid time unit strings, for example `['year', 'month']` or `['week', 'date']`. The optional _step_ argument (default 1) indicates the number of time unit steps (of the smallest provided unit) to include as part of the truncation scheme. For example, `utcFloor(['quarter'])` is equivalent to `utcFloor(['month'], 3)`.

<a name="timeInterval" href="#timeInterval">#</a>
vega.<b>timeInterval</b>(<i>unit</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-time/src/interval.js "Source")

Returns a [d3-time interval](https://github.com/d3/d3-time#_interval) for the given time _unit_ in the local timezone.

<a name="timeOffset" href="#timeOffset">#</a>
vega.<b>timeOffset</b>(<i>unit</i>, <i>date</i>[, <i>step</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-time/src/interval.js "Source")

Returns a new Date instance that offsets the given _date_ by the specified time _unit_ in the local timezone. The optional _step_ argument indicates the number of time unit steps to offset by (default 1).

<a name="timeSequence" href="#timeSequence">#</a>
vega.<b>timeSequence</b>(<i>unit</i>, <i>start</i>, <i>stop</i>[, <i>step</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-time/src/interval.js "Source")

Returns an array of Date instances from _start_ (inclusive) to _stop_ (exclusive), with each entry separated by the given time _unit_ in the local timezone. The optional _step_ argument indicates the number of time unit steps to take between each sequence entry (default 1).

### UTC Time Utilities

<a name="utcFormat" href="#utcFormat">#</a>
vega.<b>utcFormat</b>([<i>specifier</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-time/src/format.js "Source")

Returns a function that takes a date or timestamp as input and returns a formatted string in [Coordinated Universal Time](https://en.wikipedia.org/wiki/Coordinated_Universal_Time) (UTC). If a string-valued format _specifier_ is provided, it must follow the [d3-time-format](https://github.com/d3/d3-time-format/#locale_format) syntax. In this case, this method is equivalent to d3-time-format's [utcFormat](https://github.com/d3/d3-time-format/#utcFormat) method.

This method also accepts object-valued _specifiers_ for creating multi-format functions. If no argumennts are provided, a defualt multi-format function will be returned. For more details, see the [timeFormat](#timeFormat) method documentation.

<a name="utcFloor" href="#utcFloor">#</a>
vega.<b>utcFloor</b>(<i>units</i>[, <i>step</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-time/src/floor.js "Source")

Returns a function that performs flooring (truncation) of input dates to given time _units_ in [Coordinated Universal Time](https://en.wikipedia.org/wiki/Coordinated_Universal_Time) (UTC). The _units_ argument must be an array of valid time unit strings, for example `['year', 'month']` or `['week', 'date']`. The optional _step_ argument (default 1) indicates the number of time unit steps (of the smallest provided unit) to include as part of the truncation scheme. For example, `utcFloor(['quarter'])` is equivalent to `utcFloor(['month'], 3)`.

<a name="utcInterval" href="#utcInterval">#</a>
vega.<b>utcInterval</b>(<i>unit</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-time/src/interval.js "Source")

Returns a [d3-time interval](https://github.com/d3/d3-time#_interval) for the given time _unit_ in [Coordinated Universal Time](https://en.wikipedia.org/wiki/Coordinated_Universal_Time) (UTC).

<a name="utcOffset" href="#utcOffset">#</a>
vega.<b>utcOffset</b>(<i>unit</i>, <i>date</i>[, <i>step</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-time/src/interval.js "Source")

Returns a new Date instance that offsets the given _date_ by the specified time _unit_ in [Coordinated Universal Time](https://en.wikipedia.org/wiki/Coordinated_Universal_Time) (UTC). The optional _step_ argument indicates the number of time unit steps to offset by (default 1).

<a name="utcSequence" href="#utcSequence">#</a>
vega.<b>utcSequence</b>(<i>unit</i>, <i>start</i>, <i>stop</i>[, <i>step</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-time/src/interval.js "Source")

Returns an array of Date instances from _start_ (inclusive) to _stop_ (exclusive), with each entry separated by the given time _unit_ in [Coordinated Universal Time](https://en.wikipedia.org/wiki/Coordinated_Universal_Time) (UTC). The optional _step_ argument indicates the number of time unit steps to take between each sequence entry (default 1).
