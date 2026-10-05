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

## <a name="localization"></a>Localization <small>{% include tag ver="FUTURE" %}</small>

By default, Vega will add `aria-label` and `aria-roledescription` text to describe structural elements of the visualization rendered to SVG. These descriptions use English (`en`) by default.

<a name="ariaLocale" href="#ariaLocale">#</a>
vega.<b>ariaLocale</b>([<i>definition</i>])
[<>](https://github.com/vega/vega/blob/master/packages/vega-scenegraph/src/util/aria-locale.js "Source")

Gets or sets the default locale for ARIA labels. If no argument is provided, returns the current default ARIA locale. Otherwise, merges the provided `Record<string, string>` *definition* with Vega's American English defaults, sets the resulting global default, and returns it. The new default applies to views created after this method is called; existing views retain the locale with which they were constructed.

For example, set global Spanish strings before parsing specifications and creating views:

```js
vega.ariaLocale({
  languageTag: 'es',
  'role.visualization': 'visualización',
  'role.axis': 'eje',
  'role.legend': 'leyenda'
});
```

<a name="resetAriaLocale" href="#resetAriaLocale">#</a>
vega.<b>resetAriaLocale</b>()
[<>](https://github.com/vega/vega/blob/master/packages/vega-scenegraph/src/util/aria-locale.js "Source")

Resets the default ARIA locale to Vega's American English translation and returns the resulting locale object.

For a specific view, provide an `ariaLocale` object in the Vega configuration or as a `View` constructor option. Any localization key not provided at any level falls back to Vega's American English translation.

The structure of this object is as follows, where indexed placeholders (such as `{0}`) indicate string substitution for composite translation:

| Key | Default Value | Description |
| --- | --- | --- |
| `languageTag` | `"en"` | A BCP 47 language tag used to select plural forms with [Intl.PluralRules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules). |
| `listJoiner` | `", "` | Joins items in a list before the final item. |
| `listFinalJoiner` | `" and "` | Joins the final item in a list. |
| `containerRoleDescription` | `"visualization"` | Describes the visualization container. |
| `markContainer` | `"{0} mark container"` | Describes a mark container; `{0}` is the localized mark type. |
| `markRoleDescription` | `"{0} mark"` | Describes a mark; `{0}` is the localized mark type. |
| `titleText` | `"Title text '{0}'"` | Describes title text; `{0}` is the title. |
| `subtitleText` | `"Subtitle text '{0}'"` | Describes subtitle text; `{0}` is the subtitle. |
| `axisLabel` | `"{0}-axis"` | Starts an axis description; `{0}` is the localized axis orientation. |
| `axisTitled` | `" titled '{0}'"` | Adds an axis title; `{0}` is the title. |
| `axisScaleDiscrete` | `" for a discrete scale"` | Describes an axis with a discrete scale. |
| `axisScaleContinuous` | `" for a {0} scale"` | Describes an axis with a continuous scale; `{0}` is the scale type. |
| `axisWithDomain` | `" with {0}"` | Adds an axis domain description; `{0}` is the formatted domain. |
| `legendType` | `"{0} legend"` | Starts a typed legend description; `{0}` is the legend type. |
| `legendTypeDefault` | `"Legend"` | Starts a legend description when no legend type is available. |
| `legendTitled` | `" titled '{0}'"` | Adds a legend title; `{0}` is the title. |
| `legendForChannel` | `" for {0}"` | Adds the visual channels encoded by a legend; `{0}` is the localized channel list. |
| `legendWithDomain` | `" with {0}"` | Adds a legend domain description; `{0}` is the formatted domain. |
| `channel.fill` | `"fill color"` | Describes the `fill` encoding channel. |
| `channel.stroke` | `"stroke color"` | Describes the `stroke` encoding channel. |
| `domainBoundaries_one` | `"{0} boundary: {1}"` | Describes one discrete domain boundary; `{0}` is the count and `{1}` is the boundary list. |
| `domainBoundaries_other` | `"{0} boundaries: {1}"` | Describes multiple discrete domain boundaries; `{0}` is the count and `{1}` is the boundary list. |
| `domainValues_one` | `"{0} value: {1}"` | Describes one discrete domain value; `{0}` is the count and `{1}` is the value list. |
| `domainValues_other` | `"{0} values: {1}"` | Describes multiple discrete domain values; `{0}` is the count and `{1}` is the value list. |
| `domainDiscreteOverflow` | `"{0}, ending with {1}"` | Describes a truncated discrete domain; `{0}` is the displayed list and `{1}` is the final value. |
| `domainContinuous` | `"values from {0} to {1}"` | Describes a continuous domain; `{0}` and `{1}` are its lower and upper bounds. |
| `orientationX` | `"X"` | Names the horizontal axis orientation. |
| `orientationY` | `"Y"` | Names the vertical axis orientation. |
| `role.visualization` | `"visualization"` | Describes the visualization's ARIA role. |
| `role.axis` | `"axis"` | Describes an axis's ARIA role. |
| `role.legend` | `"legend"` | Describes a legend's ARIA role. |
| `role.title` | `"title"` | Describes a title's ARIA role. |
| `role.subtitle` | `"subtitle"` | Describes a subtitle's ARIA role. |
| `role.markContainer` | `"{0} mark container"` | Describes a mark container's ARIA role; `{0}` is the localized mark type. |
| `role.mark` | `"{0} mark"` | Describes a mark's ARIA role; `{0}` is the localized mark type. |
| `marktype.arc` | `"arc"` | Names an arc mark in ARIA descriptions. |
| `marktype.area` | `"area"` | Names an area mark in ARIA descriptions. |
| `marktype.group` | `"group"` | Names a group mark in ARIA descriptions. |
| `marktype.image` | `"image"` | Names an image mark in ARIA descriptions. |
| `marktype.line` | `"line"` | Names a line mark in ARIA descriptions. |
| `marktype.path` | `"path"` | Names a path mark in ARIA descriptions. |
| `marktype.rect` | `"rect"` | Names a rect mark in ARIA descriptions. |
| `marktype.rule` | `"rule"` | Names a rule mark in ARIA descriptions. |
| `marktype.shape` | `"shape"` | Names a shape mark in ARIA descriptions. |
| `marktype.symbol` | `"symbol"` | Names a symbol mark in ARIA descriptions. |
| `marktype.text` | `"text"` | Names a text mark in ARIA descriptions. |
| `marktype.trail` | `"trail"` | Names a trail mark in ARIA descriptions. |
