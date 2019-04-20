---
layout: api
title: Locale API
permalink: /docs/api/locale/index.html
---

To display number and date values, by default Vega uses formatting rules for American English. If you are deploying visualizations for other languages you will want to change these defaults.

Vega uses formatting utilities provided by the D3 framework, specifically the [d3-format](https://github.com/d3/d3-format) and [d3-time-format](https://github.com/d3/d3-time-format) libraries. These libraries provide methods for updating the default locale and Vega exports these methods as part of its own API.

**Note:** Application code should set the locale to the desired default _before_ performing parsing and view generation.

## <a name="locale"></a>Locale Configuration

<a name="formatLocale" href="#formatLocale">#</a>
vega.<b>formatLocale</b>(<i>definition</i>)
[<>](https://github.com/d3/d3-format/blob/master/src/defaultLocale.js "Source")

Sets the default locale _definition_ for number formatting. This method is an exported version of [d3-format's `formatDefaultLocale`](https://github.com/d3/d3-format#formatDefaultLocale). See the [d3-format locale collection](https://github.com/d3/d3-format/tree/master/locale) for definition files for a variety of languages.

<a name="timeFormatLocale" href="#timeFormatLocale">#</a>
vega.<b>timeFormatLocale</b>(<i>definition</i>)
[<>](https://github.com/d3/d3-time-format/blob/master/src/defaultLocale.js "Source")

Sets the default locale _definition_ for date/time formatting. This method is an exported version of [d3-time-format's `timeFormatDefaultLocale`](https://github.com/d3/d3-time-format#timeFormatDefaultLocale). See the [d3-time-format locale collection](https://github.com/d3/d3-time-format/tree/master/locale) for definition files for a variety of languages.
