---
layout: spec
title: Expressions
permalink: /docs/expressions/index.html
---

To enable custom calculations, Vega includes its own _expression language_ for writing basic formulas. For example, these expressions are used by the [filter](../transforms/filter) and [formula](../transforms/formula) transforms to modify data, and within [signal](../signals) definitions to calculate updated values in response to user input.

The expression language is a restricted subset of JavaScript. All basic arithmetic, logical and property access expressions are supported, as are boolean, number, string, object (`{}`) and array (`[]`) literals.  Ternary operators (`ifTest ? thenValue : elseValue`) and a special `if(test, thenValue, elseValue)` function are supported.

To keep the expression language simple, secure and free of unwanted side effects, the following elements are **not** allowed: assignment operators (`=`, `+=` etc), pre/postfix updates (`++`), `new` expressions, and most control flow statements (`for`, `while`, `switch`, etc). In addition, function calls involving nested properties (`foo.bar()`) are not allowed. Instead, the expression language supports a collection of functions defined in the top-level scope.

This page documents the expression language. If you are interested in implementation aspects, the bulk of the expression language &ndash; including parsing, code generation, and some of the constant and function definitions &ndash; are maintained in the [vega-expression module](http://github.com/vega/vega-expression).


## <a name="reference"></a>Expression Language Reference

- [Bound Variables](#bound-variables)
- [Constants](#constants)
- [Type Checking Functions](#type-checking-functions)
- [Type Coercion Functions](#type-coercion-functions)
- [Control Flow Functions](#control-flow-functions)
- [Math Functions](#math-functions)
- [Date/Time Functions](#datetime-functions)
- [Array Functions](#array-functions)
- [String Functions](#string-functions)
- [Object Functions](#object-functions)
- [Formatting Functions](#format-functions)
- [Regular Expression Functions](#regexp-functions)
- [Color Functions](#color-functions)
- [Event Functions](#event-functions)
- [Data Functions](#data-functions)
- [Scale & Projection Functions](#scale-functions)
- [Geographic Functions](#geo-functions)
- [Tree (Hierarchy) Functions](#tree-functions)
- [Browser Functions](#browser-functions)
- [Logging Functions](#logging-functions)
{: .column-list }


## <a name="bound-variables"></a>Bound Variables

The expression language includes a number of automatically-bound named variables.

<a name="datum" href="#datum">#</a>
<b>datum</b>

The current input data object, available within data transform and event handler expressions. To lookup object properties, use normal JavaScript syntax: `datum.value` or `datum['My Value']`.

<a name="event" href="#event">#</a>
<b>event</b>

If the expression is being invoked in response to an event, an _event_ variable is defined. This variable consists of a standard JavaScript DOM event, providing access to bound properties of the event, such as `event.metaKey` or `event.keyCode`.

<a name="signal" href="#signal">#</a>
<i>signal names</i>

Any in-scope signal value can be referenced directly by name. For example, if you have defined a signal named `hover` within your Vega specification, you can refer to it directly within an expression (e.g., `hover.value`).

[Back to Top](#reference)


## <a name="constants"></a>Constants

Constant values that can be referenced by name within expressions.

<a name="NaN" href="#NaN">#</a>
<b>NaN</b><br/>
Not a number. Same as the JavaScript literal `NaN`.

<a name="E" href="#E">#</a>
<b>E</b><br/>
The transcendental number _e_. Same as JavaScript's `Math.E`.

<a name="LN2" href="#LN2">#</a>
<b>LN2</b>
<br/>The natural log of 2. Same as JavaScript's `Math.LN2`.

<a name="LN10" href="#LN10">#</a>
<b>LN10</b>
<br/>The natural log of 10. Same as JavaScript's `Math.LN10`.

<a name="LOG2E" href="#LOG2E">#</a>
<b>LOG2E</b>
<br/>The base 2 logarithm of _e_. Same as JavaScript's `Math.LOG2E`.

<a name="LOG10E" href="#LOG10E">#</a>
<b>LOG10E</b>
<br/>The base 10 logarithm _e_. Same as JavaScript's `Math.LOG10E`.

<a name="MAX_VALUE" href="#MAX_VALUE">#</a>
<b>MAX_VALUE</b>
<br/>The largest positive numeric value. Same as JavaScript's `Number.MAX_VALUE`.

<a name="MIN_VALUE" href="#MIN_VALUE">#</a>
<b>MIN_VALUE</b>
<br/>The smallest positive numeric value. Same as JavaScript's `Number.MIN_VALUE`.

<a name="PI" href="#PI">#</a>
<b>PI</b>
<br/>The transcendental number _&pi;_. Same as JavaScript's `Math.PI`.

<a name="SQRT1_2" href="#SQRT1_2">#</a>
<b>SQRT1_2</b>
<br/>The square root of 0.5. Same as JavaScript's `Math.SQRT1_2`.

<a name="SQRT2" href="#SQRT2">#</a>
<b>SQRT2</b>
<br/>The square root of 2. Same as JavaScript's `Math.SQRT2`.

[Back to Top](#reference)


## <a name="type-checking-functions"></a>Type Checking Functions

Predicate functions for checking value types.

<a name="isArray" href="#isArray">#</a>
<b>isArray</b>(<i>value</i>)<br/>
Returns true if _value_ is an array, false otherwise.

<a name="isBoolean" href="#isBoolean">#</a>
<b>isBoolean</b>(<i>value</i>)<br/>
Returns true if _value_ is a boolean (`true` or `false`), false otherwise.

<a name="isDate" href="#isDate">#</a>
<b>isDate</b>(<i>value</i>)<br/>
Returns true if _value_ is a Date object, false otherwise. This method will return false for timestamp numbers or date-formatted strings; it recognizes Date objects only.

<a name="isNumber" href="#isNumber">#</a>
<b>isNumber</b>(<i>value</i>)<br/>
Returns true if _value_ is a number, false otherwise. `NaN` and `Infinity` are considered numbers.

<a name="isObject" href="#isObject">#</a>
<b>isObject</b>(<i>value</i>)<br/>
Returns true if _value_ is an object, false otherwise. Following JavaScript `typeof` convention, `null` values are considered objects.

<a name="isRegExp" href="#isRegExp">#</a>
<b>isRegExp</b>(<i>value</i>)<br/>
Returns true if _value_ is a RegExp (regular expression) object, false otherwise.

<a name="isString" href="#isString">#</a>
<b>isString</b>(<i>value</i>)<br/>
Returns true if _value_ is a string, false otherwise.


## <a name="type-coercion-functions"></a>Type Coercion Functions

Functions for coercing values to a desired type.

<a name="toBoolean" href="#toBoolean">#</a>
<b>toBoolean</b>(<i>value</i>)<br/>
Coerces the input _value_ to a string. Null values and empty strings are mapped to `null`.

<a name="toDate" href="#toDate">#</a>
<b>toDate</b>(<i>value</i>)<br/>
Coerces the input _value_ to a Date instance. Null values and empty strings are mapped to `null`. If an optional _parser_ function is provided, it is used to perform date parsing, otherwise `Date.parse` is used. Be aware that `Date.parse` has different implementations across browsers!

<a name="toNumber" href="#toNumber">#</a>
<b>toNumber</b>(<i>value</i>)<br/>
Coerces the input _value_ to a number. Null values and empty strings are mapped to `null`.

<a name="toString" href="#toString">#</a>
<b>toString</b>(<i>value</i>)<br/>
Coerces the input _value_ to a string. Null values and empty strings are mapped to `null`.


## <a name="control-flow-functions"></a>Control Flow Functions

<a name="if" href="#if">#</a>
<b>if</b>(<i>test</i>, <i>thenValue</i>, <i>elseValue</i>)<br/>
If _test_ is truthy, returns _thenValue_. Otherwise, returns _elseValue_. The _if_ function is equivalent to the ternary operator `a ? b : c`.

[Back to Top](#reference)


## <a name="math-functions"></a>Math Functions

Basic mathematical functions.

<a name="isNaN" href="#isNaN">#</a>
<b>isNaN</b>(<i>value</i>)<br/>
Returns true if _value_ is not a number. Same as JavaScript's `isNaN`.

<a name="isFinite" href="#isFinite">#</a>
<b>isFinite</b>(<i>value</i>)<br/>
Returns true if _value_ is a finite number. Same as JavaScript's `isFinite`.

<a name="abs" href="#abs">#</a>
<b>abs</b>(<i>value</i>)<br/>
Returns the absolute value of _value_. Same as JavaScript's `Math.abs`.

<a name="acos" href="#acos">#</a>
<b>acos</b>(<i>value</i>)<br/>
Trigonometric arccosine. Same as JavaScript's `Math.acos`.

<a name="asin" href="#asin">#</a>
<b>asin</b>(<i>value</i>)<br/>
Trigonometric arcsine. Same as JavaScript's `Math.asin`.

<a name="atan" href="#atan">#</a>
<b>atan</b>(<i>value</i>)<br/>
Trigonometric arctangent. Same as JavaScript's `Math.atan`.

<a name="atan2" href="#atan2">#</a>
<b>atan2</b>(<i>dy</i>, <i>dx</i>)<br/>
Returns the arctangent of _dy / dx_. Same as JavaScript's `Math.atan2`.

<a name="ceil" href="#ceil">#</a>
<b>ceil</b>(<i>value</i>)<br/>
Rounds _value_ to the nearest integer of equal or greater value. Same as JavaScript's `Math.ceil`.

<a name="clamp" href="#clamp">#</a>
<b>clamp</b>(<i>value</i>, <i>min</i>, <i>max</i>)<br/>
Restricts _value_ to be between the specified _min_ and _max_.

<a name="cos" href="#cos">#</a>
<b>cos</b>(<i>value</i>)<br/>
Trigonometric cosine. Same as JavaScript's `Math.cos`.

<a name="exp" href="#exp">#</a>
<b>exp</b>(<i>exponent</i>)<br/>
Returns the value of _e_ raised to the provided _exponent_. Same as JavaScript's `Math.exp`.

<a name="floor" href="#floor">#</a>
<b>floor</b>(<i>value</i>)<br/>
Rounds _value_ to the nearest integer of equal or lower value. Same as JavaScript's `Math.floor`.

<a name="log" href="#log">#</a>
<b>log</b>(<i>value</i>)<br/>
Returns the natural logarithm of _value_. Same as JavaScript's `Math.log`.

<a name="max" href="#max">#</a>
<b>max</b>(<i>value1</i>, <i>value2</i>, ...)<br/>
Returns the maximum argument value. Same as JavaScript's `Math.max`.

<a name="min" href="#min">#</a>
<b>min</b>(<i>value1</i>, <i>value2</i>, ...)<br/>
Returns the minimum argument value. Same as JavaScript's `Math.min`.

<a name="pow" href="#pow">#</a>
<b>pow</b>(<i>value</i>, <i>exponent</i>)<br/>
Returns _value_ raised to the given _exponent_. Same as JavaScript's `Math.pow`.

<a name="random" href="#random">#</a>
<b>random</b>()<br/>
Returns a pseudo-random number in the range [0,1). Same as JavaScript's `Math.random`.

<a name="round" href="#round">#</a>
<b>round</b>(<i>value</i>)<br/>
Rounds _value_ to the nearest integer. Same as JavaScript's `Math.round`.

<a name="sin" href="#sin">#</a>
<b>sin</b>(<i>value</i>)<br/>
Trigonometric sine. Same as JavaScript's `Math.sin`.

<a name="sqrt" href="#sqrt">#</a>
<b>sqrt</b>(<i>value</i>)<br/>
Square root function. Same as JavaScript's `Math.sqrt`.

<a name="tan" href="#tan">#</a>
<b>tan</b>(<i>value</i>)<br/>
Trigonometric tangent. Same as JavaScript's `Math.tan`.

[Back to Top](#reference)


## <a name="datetime-functions"></a>Date/Time Functions

Functions for working with date/time values.

<a name="now" href="#now">#</a>
<b>now</b>()<br/>
Returns the timestamp for the current time.

<a name="datetime" href="#datetime">#</a>
<b>datetime</b>(<i>year</i>, <i>month</i>[, <i>day</i>, <i>hour</i>, <i>min</i>, <i>sec</i>, <i>millisec</i>])<br/>
Returns a new `Date` instance. The _month_ is 0-based, such that `1` represents February.

<a name="date" href="#date">#</a>
<b>date</b>(<i>datetime</i>)<br/>
Returns the day of the month for the given _datetime_ value, in local time.

<a name="day" href="#day">#</a>
<b>day</b>(<i>datetime</i>)<br/>
Returns the day of the week for the given _datetime_ value, in local time.

<a name="year" href="#year">#</a>
<b>year</b>(<i>datetime</i>)<br/>
Returns the year for the given _datetime_ value, in local time.

<a name="quarter" href="#quarter">#</a>
<b>quarter</b>(<i>datetime</i>)<br/>
Returns the quarter of the year (0-3) for the given _datetime_ value, in local time.

<a name="month" href="#month">#</a>
<b>month</b>(<i>datetime</i>)<br/>
Returns the (zero-based) month for the given _datetime_ value, in local time.

<a name="hours" href="#hours">#</a>
<b>hours</b>(<i>datetime</i>)<br/>
Returns the hours component for the given _datetime_ value, in local time.

<a name="minutes" href="#minutes">#</a>
<b>minutes</b>(<i>datetime</i>)<br/>
Returns the minutes component for the given _datetime_ value, in local time.

<a name="seconds" href="#seconds">#</a>
<b>seconds</b>(<i>datetime</i>)<br/>
Returns the seconds component for the given _datetime_ value, in local time.

<a name="milliseconds" href="#milliseconds">#</a>
<b>milliseconds</b>(<i>datetime</i>)<br/>
Returns the milliseconds component for the given _datetime_ value, in local time.

<a name="time" href="#time">#</a>
<b>time</b>(<i>datetime</i>)<br/>
Returns the epoch-based timestamp for the given _datetime_ value.

<a name="timezoneoffset" href="#timezoneoffset">#</a>
<b>timezoneoffset</b>(<i>datetime</i>)<br/>
Returns the timezone offset from the local timezone to UTC for the given _datetime_ value.

<a name="utc" href="#utc">#</a>
<b>utc</b>(<i>year</i>, <i>month</i>[, <i>day</i>, <i>hour</i>, <i>min</i>, <i>sec</i>, <i>millisec</i>])<br/>
Returns a timestamp for the given UTC date. The _month_ is 0-based, such that `1` represents February.

<a name="utcdate" href="#utcdate">#</a>
<b>utcdate</b>(<i>datetime</i>)<br/>
Returns the day of the month for the given _datetime_ value, in UTC time.

<a name="utcday" href="#utcday">#</a>
<b>utcday</b>(<i>datetime</i>)<br/>
Returns the day of the week for the given _datetime_ value, in UTC time.

<a name="utcyear" href="#utcyear">#</a>
<b>utcyear</b>(<i>datetime</i>)<br/>
Returns the year for the given _datetime_ value, in UTC time.

<a name="utcquarter" href="#utcquarter">#</a>
<b>utcquarter</b>(<i>datetime</i>)<br/>
Returns the quarter of the year (0-3) for the given _datetime_ value, in UTC time.

<a name="utcmonth" href="#utcmonth">#</a>
<b>utcmonth</b>(<i>datetime</i>)<br/>
Returns the (zero-based) month for the given _datetime_ value, in UTC time.

<a name="utchours" href="#utchours">#</a>
<b>utchours</b>(<i>datetime</i>)<br/>
Returns the hours component for the given _datetime_ value, in UTC time.

<a name="utcminutes" href="#utcminutes">#</a>
<b>utcminutes</b>(<i>datetime</i>)<br/>
Returns the minutes component for the given _datetime_ value, in UTC time.

<a name="utcseconds" href="#utcseconds">#</a>
<b>utcseconds</b>(<i>datetime</i>)<br/>
Returns the seconds component for the given _datetime_ value, in UTC time.

<a name="utcmilliseconds" href="#utcmilliseconds">#</a>
<b>utcmilliseconds</b>(<i>datetime</i>)<br/>
Returns the milliseconds component for the given _datetime_ value, in UTC time.

[Back to Top](#reference)


## <a name="array-functions"></a>Array Functions

Functions for working with arrays of values.

<a name="extent" href="#extent">#</a>
<b>extent</b>(<i>array</i>) {% include tag ver="4.0" %}<br/>
Returns a new _[min, max]_ array with the minimum and maximum values of the input array, ignoring `null`, `undefined`, and `NaN` values.

<a name="clamprange" href="#clamprange">#</a>
<b>clampRange</b>(<i>range</i>, <i>min</i>, <i>max</i>)<br/>
Clamps a two-element _range_ array in a span-preserving manner. If the span of the input _range_ is less than _(max - min)_ and an endpoint exceeds either the _min_ or _max_ value, the range is translated such that the span is preserved and one endpoint touches the boundary of the _[min, max]_ range. If the span exceeds _(max - min)_, the range _[min, max]_ is returned.

<a name="indexof" href="#indexof">#</a>
<b>indexof</b>(<i>array</i>, <i>value</i>)<br/>
Returns the first index of _value_ in the input _array_.

<a name="inrange" href="#inrange">#</a>
<b>inrange</b>(<i>value</i>, <i>range</i>)<br/>
Tests whether _value_ lies within (or is equal to either) the first and last values of the _range_ array.

<a name="join" href="#join">#</a>
<b>join</b>(<i>array</i>[, <i>separator</i>])<br/>
Returns a new string by concatenating all of the elements of the input _array_, separated by commas or a specified _separator_ string.

<a name="lastindexof" href="#lastindexof">#</a>
<b>lastindexof</b>(<i>array</i>, <i>value</i>)<br/>
Returns the last index of _value_ in the input _array_.

<a name="length" href="#length">#</a>
<b>length</b>(<i>array</i>)<br/>
Returns the length of the input _array_.

<a name="lerp" href="#lerp">#</a>
<b>lerp</b>(<i>array</i>, <i>fraction</i>)<br/>
Returns the linearly interpolated value between the first and last entries in the _array_ for the provided interpolation _fraction_ (typically between 0 and 1). For example, `lerp([0, 50], 0.5)` returns 25.

<a name="peek" href="#peek">#</a>
<b>peek</b>(<i>array</i>)<br/>
Returns the last element in the input _array_. Similar to the built-in `Array.pop` method, except that it does not remove the last element. This method is a convenient shorthand for `array[array.length - 1]`.

<a name="reverse" href="#reverse">#</a>
<b>reverse</b>(<i>array</i>)<br/>
Returns a new array with elements in a reverse order of the input _array_. The first array element becomes the last, and the last array element becomes the first.

<a name="sequence" href="#sequence">#</a>
<b>sequence</b>([<i>start</i>, ]<i>stop</i>[, <i>step</i>])<br/>
Returns an array containing an arithmetic sequence of numbers. If _step_ is omitted, it defaults to 1. If _start_ is omitted, it defaults to 0. The _stop_ value is exclusive; it is not included in the result. If _step_ is positive, the last element is the largest _start + i * step_ less than _stop_; if _step_ is negative, the last element is the smallest _start + i * step_ greater than _stop_. If the returned array would contain an infinite number of values, an empty range is returned. The arguments are not required to be integers.

<a name="slice" href="#slice">#</a>
<b>slice</b>(<i>array</i>, <i>start</i>[, <i>end</i>])<br/>
Returns a section of _array_ between the _start_ and _end_ indices. If the _end_ argument is negative, it is treated as an offset from the end of the array (_length(array) + end_).

<a name="span" href="#span">#</a>
<b>span</b>(<i>array</i>)<br/>
Returns the span of _array_: the difference between the last and first elements, or _array[array.length-1] - array[0]_.

[Back to Top](#reference)


## <a name="string-functions"></a>String Functions

Functions for modifying text strings.

<a name="string_indexof" href="#string_indexof">#</a>
<b>indexof</b>(<i>string</i>, <i>substring</i>)<br/>
Returns the first index of _substring_ in the input _string_.

<a name="string_lastindexof" href="#string_lastindexof">#</a>
<b>lastindexof</b>(<i>string</i>, <i>substring</i>)<br/>
Returns the last index of _substring_ in the input _string_.

<a name="string_length" href="#string_length">#</a>
<b>length</b>(<i>string</i>)<br/>
Returns the length of the input _string_.

<a name="lower" href="#lower">#</a>
<b>lower</b>(<i>string</i>)<br/>
Transforms _string_ to lower-case letters.

<a name="pad" href="#pad">#</a>
<b>pad</b>(<i>string</i>, <i>length</i>[, <i>character</i>, <i>align</i>])<br/>
Pads a _string_ value with repeated instances of a _character_ up to a specified _length_. If _character_ is not specified, a space (' ') is used. By default, padding is added to the end of a string. An optional _align_ parameter specifies if padding should be added to the `'left'` (beginning), `'center'`, or `'right'` (end) of the input string.

<a name="parseFloat" href="#parseFloat">#</a>
<b>parseFloat</b>(<i>string</i>)<br/>
Parses the input _string_ to a floating-point value. Same as JavaScript's `parseFloat`.

<a name="parseInt" href="#parseInt">#</a>
<b>parseInt</b>(<i>string</i>)<br/>
Parses the input _string_ to an integer value. Same as JavaScript's `parseInt`.

<a name="replace" href="#replace">#</a>
<b>replace</b>(<i>string</i>, <i>pattern</i>, <i>replacement</i>)<br/>
Returns a new string with some or all matches of _pattern_ replaced by a _replacement_ string. The _pattern_ can be a string or a regular expression. If _pattern_ is a string, only the first instance will be replaced. Same as [JavaScript's String.replace](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace).

<a name="string_slice" href="#string_slice">#</a>
<b>slice</b>(<i>string</i>, <i>start</i>[, <i>end</i>])<br/>
Returns a section of _string_ between the _start_ and _end_ indices. If the _end_ argument is negative, it is treated as an offset from the end of the string (_length(string) + end_).

<a name="string_split" href="#string_split">#</a>
<b>split</b>(<i>string</i>, <i>separator</i>[, <i>limit</i>]) {% include tag ver="4.3" %}<br/>
Returns an array of tokens created by splitting the input _string_ according to a provided _separator_ pattern. The result can optionally be constrained to return at most _limit_ tokens.

<a name="substring" href="#substring">#</a>
<b>substring</b>(<i>string</i>, <i>start</i>[, <i>end</i>])<br/>
Returns a section of _string_ between the _start_ and _end_ indices.

<a name="trim" href="#trim">#</a>
<b>trim</b>(<i>string</i>)<br/>
Returns a trimmed string with preceding and trailing whitespace removed.

<a name="truncate" href="#truncate">#</a>
<b>truncate</b>(<i>string</i>, <i>length</i>[, <i>align</i>, <i>ellipsis</i>])<br/>
Truncates an input _string_ to a target _length_. The optional _align_ argument indicates what part of the string should be truncated: `'left'` (the beginning), `'center'`, or `'right'` (the end). By default, the `'right'` end of the string is truncated. The optional _ellipsis_ argument indicates the string to use to indicate truncated content; by default the ellipsis character `…` (`\u2026`) is used.

<a name="upper" href="#upper">#</a>
<b>upper</b>(<i>string</i>)<br/>
Transforms _string_ to upper-case letters.

[Back to Top](#reference)


## <a name="object-functions"></a>Object Functions

Functions for manipulating object instances.

<a name="merge" href="#merge">#</a>
<b>merge</b>(<i>object1</i>[, <i>object2</i>, ...]) {% include tag ver="4.0" %}<br/>
Merges the input objects _object1_, _object2_, etc into a new output object. Inputs are visited in sequential order, such that key values from later arguments can overwrite those from earlier arguments. Example: `merge({a:1, b:2}, {a:3}) -> {a:3, b:2}`.

[Back to Top](#reference)


## <a name="format-functions"></a>Formatting Functions

Functions for formatting number and datetime values as strings.

<a name="dayFormat" href="#dayFormat">#</a>
<b>dayFormat</b>(<i>day</i>)<br/>
Formats a (0-6) _weekday_ number as a full week day name, according to the current locale. For example: `dayFormat(0) -> "Sunday"`.

<a name="dayAbbrevFormat" href="#dayAbbrevFormat">#</a>
<b>dayAbbrevFormat</b>(<i>day</i>)<br/>
Formats a (0-6) _weekday_ number as an abbreviated week day name, according to the current locale. For example: `dayAbbrevFormat(0) -> "Sun"`.

<a name="format" href="#format">#</a>
<b>format</b>(<i>value</i>, <i>specifier</i>)<br/>
Formats a numeric _value_ as a string. The _specifier_ must be a valid [d3-format specifier](https://github.com/d3/d3-format/) (e.g., `format(value, ',.2f')`.

<a name="monthFormat" href="#monthFormat">#</a>
<b>monthFormat</b>(<i>month</i>)<br/>
Formats a (zero-based) _month_ number as a full month name, according to the current locale. For example: `monthFormat(0) -> "January"`.

<a name="monthAbbrevFormat" href="#monthAbbrevFormat">#</a>
<b>monthAbbrevFormat</b>(<i>month</i>)<br/>
Formats a (zero-based) _month_ number as an abbreviated month name, according to the current locale. For example: `monthAbbrevFormat(0) -> "Jan"`.

<a name="timeFormat" href="#timeFormat">#</a>
<b>timeFormat</b>(<i>value</i>, <i>specifier</i>)<br/>
Formats a datetime _value_ (either a `Date` object or timestamp) as a string, according to the local time. The _specifier_ must be a valid [d3-time-format specifier](https://github.com/d3/d3-time-format/). For example: `timeFormat(timestamp, '%A')`.

<a name="timeParse" href="#timeParse">#</a>
<b>timeParse</b>(<i>string</i>, <i>specifier</i>)<br/>
Parses a _string_ value to a Date object, according to the local time. The _specifier_ must be a valid [d3-time-format specifier](https://github.com/d3/d3-time-format/). For example: `timeParse('June 30, 2015', '%B %d, %Y')`.

<a name="utcFormat" href="#utcFormat">#</a>
<b>utcFormat</b>(<i>value</i>, <i>specifier</i>)<br/>
Formats a datetime _value_ (either a `Date` object or timestamp) as a string, according to [UTC](https://en.wikipedia.org/wiki/Coordinated_Universal_Time) time. The _specifier_ must be a valid [d3-time-format specifier](https://github.com/d3/d3-time-format/). For example: `utcFormat(timestamp, '%A')`.

<a name="utcParse" href="#utcParse">#</a>
<b>utcParse</b>(<i>value</i>, <i>specifier</i>)<br/>
Parses a _string_ value to a Date object, according to [UTC](https://en.wikipedia.org/wiki/Coordinated_Universal_Time) time. The _specifier_ must be a valid [d3-time-format specifier](https://github.com/d3/d3-time-format/). For example: `utcParse('June 30, 2015', '%B %d, %Y')`.

[Back to Top](#reference)


## <a name="regexp-functions"></a>RegExp Functions

Functions for creating and applying regular expressions.

<a name="regexp" href="#regexp">#</a>
<b>regexp</b>(<i>pattern</i>[, <i>flags</i>]) -
Creates a regular expression instance from an input _pattern_ string and optional _flags_. Same as [JavaScript's `RegExp`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp).

<a name="test" href="#test">#</a>
<b>test</b>(<i>regexp</i>[, <i>string</i>]) -
Evaluates a regular expression _regexp_ against the input _string_, returning `true` if the string matches the pattern, `false` otherwise. For example: `test(/\\d{3}/, "32-21-9483") -> true`.

[Back to Top](#reference)


## <a name="color-functions"></a>Color Functions

Functions for representing colors in various color spaces. Color functions return objects that, when coerced to a string, map to valid CSS RGB colors.

<a name="rgb" href="#rgb">#</a>
<b>rgb</b>(<i>r</i>, <i>g</i>, <i>b</i>[, <i>opacity</i>]) |
<b>rgb</b>(<i>specifier</i>)<br/>
Constructs a new [RGB](https://en.wikipedia.org/wiki/RGB_color_model) color. If _r_, _g_ and _b_ are specified, these represent the channel values of the returned color; an _opacity_ may also be specified. If a CSS Color Module Level 3 _specifier_ string is specified, it is parsed and then converted to the RGB color space. Uses [d3-color's rgb function](https://github.com/d3/d3-color#rgb).

<a name="hsl" href="#hsl">#</a>
<b>hsl</b>(<i>h</i>, <i>s</i>, <i>l</i>[, <i>opacity</i>]) |
<b>hsl</b>(<i>specifier</i>)<br/>
Constructs a new [HSL](https://en.wikipedia.org/wiki/HSL_and_HSV) color. If _h_, _s_ and _l_ are specified, these represent the channel values of the returned color; an _opacity_ may also be specified. If a CSS Color Module Level 3 _specifier_ string is specified, it is parsed and then converted to the HSL color space. Uses [d3-color's hsl function](https://github.com/d3/d3-color#hsl).

<a name="lab" href="#lab">#</a>
<b>lab</b>(<i>l</i>, <i>a</i>, <i>b</i>[, <i>opacity</i>]) |
<b>lab</b>(<i>specifier</i>)<br/>
Constructs a new [CIE LAB](https://en.wikipedia.org/wiki/Lab_color_space#CIELAB) color. If _l_, _a_ and _b_ are specified, these represent the channel values of the returned color; an _opacity_ may also be specified. If a CSS Color Module Level 3 _specifier_ string is specified, it is parsed and then converted to the LAB color space. Uses [d3-color's lab function](https://github.com/d3/d3-color#lab).

<a name="hcl" href="#hcl">#</a>
<b>hcl</b>(<i>h</i>, <i>c</i>, <i>l</i>[, <i>opacity</i>]) |
<b>hcl</b>(<i>specifier</i>)<br/>
Constructs a new [HCL](https://en.wikipedia.org/wiki/Lab_color_space#CIELAB) (hue, chroma, luminance) color. If _h_, _c_ and _l_ are specified, these represent the channel values of the returned color; an _opacity_ may also be specified. If a CSS Color Module Level 3 _specifier_ string is specified, it is parsed and then converted to the HCL color space. Uses [d3-color's hcl function](https://github.com/d3/d3-color#hcl).

[Back to Top](#reference)


## <a name="event-functions"></a>Event Functions

Functions for processing input event data. These functions are only legal in expressions evaluated in response to an event (for example a signal event handler). Invoking these functions elsewhere can result in errors.

<a name="item" href="#item">#</a>
<b>item</b>()<br/>
Returns the current scenegraph item that is the target of the event.

<a name="group" href="#group">#</a>
<b>group</b>([<i>name</i>])<br/>
Returns the scenegraph group mark item in which the current event has occurred. If no arguments are provided, the immediate parent group is returned. If a group name is provided, the matching ancestor group item is returned.

<a name="xy" href="#xy">#</a>
<b>xy</b>([<i>item</i>])<br/>
Returns the x- and y-coordinates for the current event as a two-element array. If no arguments are provided, the top-level coordinate space of the view is used. If a scenegraph _item_ (or string group name) is provided, the coordinate space of the group item is used.

<a name="x" href="#x">#</a>
<b>x</b>([<i>item</i>])<br/>
Returns the x coordinate for the current event. If no arguments are provided, the top-level coordinate space of the view is used. If a scenegraph _item_ (or string group name) is provided, the coordinate space of the group item is used.

<a name="y" href="#y">#</a>
<b>y</b>([<i>item</i>])<br/>
Returns the y coordinate for the current event. If no arguments are provided, the top-level coordinate space of the view is used. If a scenegraph _item_ (or string group name) is provided, the coordinate space of the group item is used.

<a name="pinchDistance" href="#pinchDistance">#</a>
<b>pinchDistance</b>(<i>event</i>)<br/>
Returns the pixel distance between the first two touch points of a multi-touch event.

<a name="pinchAngle" href="#pinchAngle">#</a>
<b>pinchAngle</b>(<i>event</i>)<br/>
Returns the angle of the line connecting the first two touch points of a multi-touch event.

<a name="inScope" href="#inScope">#</a>
<b>inScope</b>(<i>item</i>)<br/>
Returns true if the given scenegraph _item_ is a descendant of the group mark in which the event handler was defined, false otherwise.

[Back to Top](#reference)


## <a name="data-functions"></a>Data Functions

Functions for accessing Vega data sets.

<a name="data" href="#data">#</a>
<b>data</b>(<i>name</i>)<br/>
Returns the array of data objects for the Vega data set with the given _name_. If the data set is not found, returns an empty array.

<a name="indata" href="#indata">#</a>
<b>indata</b>(<i>name</i>, <i>field</i>, <i>value</i>)<br/>
Tests if the data set with a given _name_ contains a datum with a _field_ value that matches the input _value_. For example: `indata('table', 'category', value)`.

[Back to Top](#reference)


## <a name="scale-functions"></a>Scale and Projection Functions

Functions for working with Vega scale transforms and cartographic projections.

<a name="scale" href="#scale">#</a>
<b>scale</b>(<i>name</i>, <i>value</i>[, <i>group</i>])<br/>
Applies the named scale transform (or projection) to the specified _value_. The optional _group_ argument takes a scenegraph group mark item to indicate the specific scope in which to look up the scale or projection.

<a name="invert" href="#invert">#</a>
<b>invert</b>(<i>name</i>, <i>value</i>[, <i>group</i>])<br/>
Inverts the named scale transform (or projection) for the specified _value_. The optional _group_ argument takes a scenegraph group mark item to indicate the specific scope in which to look up the scale or projection.

<a name="copy" href="#copy">#</a>
<b>copy</b>(<i>name</i>[, <i>group</i>])<br/>
Returns a copy (a new cloned instance) of the named scale transform of projection, or `undefined` if no scale or projection is found. The optional _group_ argument takes a scenegraph group mark item to indicate the specific scope in which to look up the scale or projection.

<a name="domain" href="#domain">#</a>
<b>domain</b>(<i>name</i>[, <i>group</i>])<br/>
Returns the scale domain array for the named scale transform, or an empty array if the scale is not found. The optional _group_ argument takes a scenegraph group mark item to indicate the specific scope in which to look up the scale.

<a name="range" href="#range">#</a>
<b>range</b>(<i>name</i>[, <i>group</i>])<br/>
Returns the scale range array for the named scale transform, or an empty array if the scale is not found. The optional _group_ argument takes a scenegraph group mark item to indicate the specific scope in which to look up the scale.

<a name="bandwidth" href="#bandwidth">#</a>
<b>bandwidth</b>(<i>name</i>[, <i>group</i>])<br/>
Returns the current band width for the named band scale transform, or zero if the scale is not found or is not a band scale. The optional _group_ argument takes a scenegraph group mark item to indicate the specific scope in which to look up the scale.

<a name="bandspace" href="#bandspace">#</a>
<b>bandspace</b>(<i>count</i>[, <i>paddingInner</i>, <i>paddingOuter</i>])<br/>
Returns the number of steps needed within a band scale, based on the _count_ of domain elements and the inner and outer padding values. While normally calculated within the scale itself, this function can be helpful for determining the size of a chart's layout.

<a name="gradient" href="#gradient">#</a>
<b>gradient</b>(<i>scale</i>, <i>p0</i>, <i>p1</i>[, <i>count</i>])<br/>
Returns a linear color gradient for the _scale_ (whose range must be a [continuous color scheme](../schemes)) and starting and ending points _p0_ and _p1_, each an _[x, y]_ array. The points _p0_ and _p1_ should be expressed in normalized coordinates in the domain [0, 1], relative to the bounds of the item being colored. If unspecified, _p0_ defaults to `[0, 0]` and _p1_ defaults to `[1, 0]`, for a horizontal gradient that spans the full bounds of an item. The optional _count_ argument indicates a desired target number of sample points to take from the color scale.

<a name="panLinear" href="#panLinear">#</a>
<b>panLinear</b>(<i>domain</i>, <i>delta</i>)<br/>
Given a linear scale _domain_ array with numeric or datetime values, returns a new two-element domain array that is the result of panning the domain by a fractional _delta_. The _delta_ value represents fractional units of the scale range; for example, `0.5` indicates panning the scale domain to the right by half the scale range.

<a name="panLog" href="#panLog">#</a>
<b>panLog</b>(<i>domain</i>, <i>delta</i>)<br/>
Given a log scale _domain_ array with numeric or datetime values, returns a new two-element domain array that is the result of panning the domain by a fractional _delta_. The _delta_ value represents fractional units of the scale range; for example, `0.5` indicates panning the scale domain to the right by half the scale range.

<a name="panPow" href="#panPow">#</a>
<b>panPow</b>(<i>domain</i>, <i>delta</i>, <i>exponent</i>)<br/>
Given a power scale _domain_ array with numeric or datetime values and the given _exponent_, returns a new two-element domain array that is the result of panning the domain by a fractional _delta_. The _delta_ value represents fractional units of the scale range; for example, `0.5` indicates panning the scale domain to the right by half the scale range.

<a name="panSymlog" href="#panSymlog">#</a>
<b>panSymlog</b>(<i>domain</i>, <i>delta</i>, <i>constant</i>)<br/>
Given a symmetric log scale _domain_ array with numeric or datetime values parameterized by the given _constant_, returns a new two-element domain array that is the result of panning the domain by a fractional _delta_. The _delta_ value represents fractional units of the scale range; for example, `0.5` indicates panning the scale domain to the right by half the scale range.

<a name="zoomLinear" href="#zoomLinear">#</a>
<b>zoomLinear</b>(<i>domain</i>, <i>anchor</i>, <i>scaleFactor</i>)<br/>
Given a linear scale _domain_ array with numeric or datetime values, returns a new two-element domain array that is the result of zooming the domain by a _scaleFactor_, centered at the provided fractional _anchor_. The _anchor_ value represents the zoom position in terms of fractional units of the scale range; for example, `0.5` indicates a zoom centered on the mid-point of the scale range.

<a name="zoomLog" href="#zoomLog">#</a>
<b>zoomLog</b>(<i>domain</i>, <i>anchor</i>, <i>scaleFactor</i>)<br/>
Given a log scale _domain_ array with numeric or datetime values, returns a new two-element domain array that is the result of zooming the domain by a _scaleFactor_, centered at the provided fractional _anchor_. The _anchor_ value represents the zoom position in terms of fractional units of the scale range; for example, `0.5` indicates a zoom centered on the mid-point of the scale range.

<a name="zoomPow" href="#zoomPow">#</a>
<b>zoomPow</b>(<i>domain</i>, <i>anchor</i>, <i>scaleFactor</i>, <i>exponent</i>)<br/>
Given a power scale _domain_ array with numeric or datetime values and the given _exponent_, returns a new two-element domain array that is the result of zooming the domain by a _scaleFactor_, centered at the provided fractional _anchor_. The _anchor_ value represents the zoom position in terms of fractional units of the scale range; for example, `0.5` indicates a zoom centered on the mid-point of the scale range.

<a name="zoomSymlog" href="#zoomSymlog">#</a>
<b>zoomSymlog</b>(<i>domain</i>, <i>anchor</i>, <i>scaleFactor</i>, <i>constant</i>)<br/>
Given a symmetric log scale _domain_ array with numeric or datetime values parameterized by the given _constant_, returns a new two-element domain array that is the result of zooming the domain by a _scaleFactor_, centered at the provided fractional _anchor_. The _anchor_ value represents the zoom position in terms of fractional units of the scale range; for example, `0.5` indicates a zoom centered on the mid-point of the scale range.

[Back to Top](#reference)


## <a name="geo-functions"></a>Geographic Functions

Functions for analyzing geographic regions represented as GeoJSON features.

<a name="geoArea" href="#geoArea">#</a>
<b>geoArea</b>(<i>projection</i>, <i>feature</i>[, <i>group</i>])<br/>
Returns the projected planar area (typically in square pixels) of a GeoJSON _feature_ according to the named _projection_. If the _projection_ argument is `null`, computes the spherical area in steradians using unprojected longitude, latitude coordinates. The optional _group_ argument takes a scenegraph group mark item to indicate the specific scope in which to look up the projection. Uses d3-geo's [geoArea](https://github.com/d3/d3-geo#geoArea) and [path.area](https://github.com/d3/d3-geo#path_area) methods.

<a name="geoBounds" href="#geoBounds">#</a>
<b>geoBounds</b>(<i>projection</i>, <i>feature</i>[, <i>group</i>])<br/>
Returns the projected planar bounding box (typically in pixels) for the specified GeoJSON _feature_, according to the named _projection_. The bounding box is represented by a two-dimensional array: [[_x₀_, _y₀_], [_x₁_, _y₁_]], where _x₀_ is the minimum x-coordinate, _y₀_ is the minimum y-coordinate, _x₁_ is the maximum x-coordinate, and _y₁_ is the maximum y-coordinate. If the _projection_ argument is `null`, computes the spherical bounding box using unprojected longitude, latitude coordinates. The optional _group_ argument takes a scenegraph group mark item to indicate the specific scope in which to look up the projection. Uses d3-geo's [geoBounds](https://github.com/d3/d3-geo#geoBounds) and [path.bounds](https://github.com/d3/d3-geo#path_bounds) methods.

<a name="geoCentroid" href="#geoCentroid">#</a>
<b>geoCentroid</b>(<i>projection</i>, <i>feature</i>[, <i>group</i>])<br/>
Returns the projected planar centroid (typically in pixels) for the specified GeoJSON _feature_, according to the named _projection_. If the _projection_ argument is `null`, computes the spherical centroid using unprojected longitude, latitude coordinates. The optional _group_ argument takes a scenegraph group mark item to indicate the specific scope in which to look up the projection. Uses d3-geo's [geoCentroid](https://github.com/d3/d3-geo#geoCentroid) and [path.centroid](https://github.com/d3/d3-geo#path_centroid) methods.

[Back to Top](#reference)


## <a name="tree-functions"></a>Tree (Hierarchy) Functions

Functions for processing hierarchy data sets constructed with the [stratify](../transforms/stratify) or [nest](../transforms/nest) transforms.

<a name="treePath" href="#treePath">#</a>
<b>treePath</b>(<i>name</i>, <i>source</i>, <i>target</i>)<br/>
For the hierarchy data set with the given _name_, returns the shortest path through from the _source_ node id to the _target_ node id. The path starts at the _source_ node, ascends to the least common ancestor of the _source_ node and the _target_ node, and then descends to the _target_ node.

<a name="treeAncestors" href="#treeAncestors">#</a>
<b>treeAncestors</b>(<i>name</i>, <i>node</i>)<br/>
For the hierarchy data set with the given _name_, returns the array of ancestors nodes, starting with the input _node_, then followed by each parent up to the root.

[Back to Top](#reference)


## <a name="browser-functions"></a>Browser Functions

Functions for accessing web browser facilities.

<a name="containerSize" href="#containerSize">#</a>
<b>containerSize</b>()<br/>
Returns the current CSS box size (`[el.clientWidth, el.clientHeight]`) of the parent DOM element that contains the Vega view. If there is no container element, returns `[undefined, undefined]`.

<a name="screen" href="#screen">#</a>
<b>screen</b>()<br/>
Returns the [`window.screen`](https://developer.mozilla.org/en-US/docs/Web/API/Window/screen) object, or `{}` if Vega is not running in a browser environment.

<a name="windowSize" href="#windowSize">#</a>
<b>windowSize</b>()<br/>
Returns the current window size (`[window.innerWidth, window.innerHeight]`) or `[undefined, undefined]` if Vega is not running in a browser environment.

[Back to Top](#reference)


## <a name="logging-functions"></a>Logging Functions

Logging functions for writing messages to the console. These can be helpful when debugging expressions.

<a name="warn" href="#warn">#</a>
<b>warn</b>(<i>value1</i>[, <i>value2</i>, ...])<br/>
Logs a warning message and returns the last argument. For the message to appear in the console, the visualization view must have the appropriate logging level set.

<a name="info" href="#info">#</a>
<b>info</b>(<i>value1</i>[, <i>value2</i>, ...])<br/>
Logs an informative message and returns the last argument. For the message to appear in the console, the visualization view must have the appropriate logging level set.

<a name="debug" href="#debug">#</a>
<b>debug</b>(<i>value1</i>[, <i>value2</i>, ...])<br/>
Logs a debugging message and returns the last argument. For the message to appear in the console, the visualization view must have the appropriate logging level set.

[Back to Top](#reference)
