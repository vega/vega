---
layout: api
title: Locale API
permalink: /docs/api/locale/index.html
---

To display number and date values, by default Vega uses formatting rules for American English. If you are deploying visualizations for other languages you will want to change these defaults. Vega uses the formatting utilities provided by the D3 framework, specifically the [d3-format](https://github.com/d3/d3-format) and [d3-time-format](https://github.com/d3/d3-time-format) libraries.

Vega supports changing the default locale for all visualizations using the methods below. To set the locale for a specific view, either provide a [`locale` config](../../config/#view) or use the [View constructor `locale` option](../view/#view).

**Note:** If changing the default locale, application code should set the locale to the desired value _before_ performing parsing and view generation.

## <a name="locale"></a>Locale Configuration

<a name="formatLocale" href="#formatLocale">#</a>
vega.<b>formatLocale</b>([<i>definition</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-format/src/number.js "Source")

Get or set the default locale for number formatting. If no arguments are provided, returns the current default locale. Otherwise, sets the default locale based on the provided *definition*, and returns the resulting locale object. The *definition* argument must match the format expected by [d3-format](https://github.com/d3/d3-format#formatLocale). For examples of definition files for a variety of languages, see the [d3-format locale collection](https://github.com/d3/d3-format/tree/master/locale). To set the number and time locales simultaneously, use the [defaultLocale](#defaultLocale) method.

<a name="timeFormatLocale" href="#timeFormatLocale">#</a>
vega.<b>timeFormatLocale</b>([<i>definition</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-format/src/time.js "Source")

Get or set the default locale for time formatting. If no arguments are provided, returns the current default locale. Otherwise, sets the default locale based on the provided *definition*, and returns the resulting locale object. The *definition* argument must match the format expected by [d3-time-format](https://github.com/d3/d3-time-format#timeFormatLocale). For examples of definition files for a variety of languages, see the [d3-time-format locale collection](https://github.com/d3/d3-time-format/tree/master/locale). To set the number and time locales simultaneously, use the [defaultLocale](#defaultLocale) method.

## <a name="combined-locale"></a>Combined Locale <small>{% include tag ver="5.12" %}</small>

Combined locale objects provide a convenient abstraction for both number and time formatting methods defined on a single object. A combined locale object contains the methods of both a number format locale object and a time format locale object.

<a name="locale" href="#locale">#</a>
vega.<b>locale</b>(<i>numberDefinition</i>, <i>timeDefinition</i>)
[<>](https://github.com/vega/vega/blob/master/packages/vega-format/src/locale.js "Source")

Returns a combined locale object with methods for both number and time formatting, based on the provided *numberDefinition* and *timeDefinition*. The definition arguments must match the format expected by [d3-format](https://github.com/d3/d3-format#formatLocale) and [d3-time-format](https://github.com/d3/d3-time-format#timeFormatLocale). If either argument is null or unspecified, the current [default locale](#defaultLocale) is used instead. For examples of definition files for a variety of languages, see the [d3-format locale collection](https://github.com/d3/d3-format/tree/master/locale) and [d3-time-format locale collection](https://github.com/d3/d3-time-format/tree/master/locale).

For example, to create a locale for number and time formatting in German:

```js
const deDE = vega.locale(
  {
    decimal: ',',
    thousands: '.',
    grouping: [3],
    currency: ['', '\u00a0€']
  },
  {
    dateTime: '%A, der %e. %B %Y, %X',
    date: '%d.%m.%Y',
    time: '%H:%M:%S',
    periods: ['AM', 'PM'],
    days: [
      'Sonntag', 'Montag', 'Dienstag', 'Mittwoch',
      'Donnerstag', 'Freitag', 'Samstag'
    ],
    shortDays: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
    months: [
      'Januar', 'Februar', 'März',
      'April', 'Mai', 'Juni',
      'Juli', 'August', 'September',
      'Oktober', 'November', 'Dezember'
    ],
    shortMonths: [
      'Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun',
      'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
    ]
  }
);
```

<a name="defaultLocale" href="#defaultLocale">#</a>
vega.<b>defaultLocale</b>([<i>numberDefinition</i>, <i>timeDefinition</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-format/src/locale.js "Source")

Get or set the default locale for both number and time formatting. If no arguments are provided, returns the current default locale. Otherwise, sets the default locales based on the provided *numberDefinition* and *timeDefinition*, and returns the resulting combined locale object. The input definitions should be of the same type accepted by the [locale](#locale) method.

<a name="resetDefaultLocale" href="#resetDefaultLocale">#</a>
vega.<b>resetDefaultLocale</b>()
[<>](https://github.com/vega/vega/blob/master/packages/vega-format/src/locale.js "Source")

Resets the default locale for both number and time formatting and returns the resulting comgined locale object. The new default locales for Vega will match the current default locales for the underlying d3-format and d3-time-format libraries.
