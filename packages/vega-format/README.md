# vega-format

Utilities for formatting values (numbers, dates) as text strings.

## API Reference

- [Number Formatting](#number-format)
- [Local Time Formatting](#time-format)
- [UTC Time Formatting](#utc-format)


### Local Time Formatting

<a name="timeFormat" href="#timeFormat">#</a>
vega.<b>timeFormat</b>([<i>specifier</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-format/src/format.js "Source")

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

### UTC Time Formatting

<a name="utcFormat" href="#utcFormat">#</a>
vega.<b>utcFormat</b>([<i>specifier</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-format/src/format.js "Source")

Returns a function that takes a date or timestamp as input and returns a formatted string in [Coordinated Universal Time](https://en.wikipedia.org/wiki/Coordinated_Universal_Time) (UTC). If a string-valued format _specifier_ is provided, it must follow the [d3-time-format](https://github.com/d3/d3-time-format/#locale_format) syntax. In this case, this method is equivalent to d3-time-format's [utcFormat](https://github.com/d3/d3-time-format/#utcFormat) method.

This method also accepts object-valued _specifiers_ for creating multi-format functions. If no argumennts are provided, a defualt multi-format function will be returned. For more details, see the [timeFormat](#timeFormat) method documentation.
