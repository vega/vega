---
layout: transform
title: CountPattern Transform
permalink: /docs/transforms/countpattern/index.html
---

The **countpattern** transform counts the number of occurrences of a text pattern, as defined by a regular expression. This transform will iterate through each data object and count all unique pattern matches found within the designated text _field_.

Both the _pattern_ and _stopwords_ parameters below are not "raw" regular expression patterns – they are embedded in a string. As a result, take care to make sure you use proper escape characters as needed. For example, to match digits, use `"\\d"`, not `"\d"`.

## Transform Parameters

| Property            | Type                            | Description   |
| :------------------ | :-----------------------------: | :------------ |
| field               | {% include type t="Field" %}    | {% include required %} The data field containing the text data.|
| pattern             | {% include type t="String" %}   | A string containing a well-formatted [regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions), defining a pattern to match in the text. All unique pattern matches will be separately counted. The default value is `[\\w\']+`, which will match sequences containing word characters and apostrophes, but no other characters.|
| case                | {% include type t="String" %}   | A lower- or upper-case transformation to apply prior to pattern matching. One of `lower`, `upper` or `mixed` (the default).|
| stopwords           | {% include type t="String" %}   | A string containing a well-formatted [regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions), defining a pattern of text to ignore. For example, the value `"(foo|bar|baz)"` will treat the words `"foo"`, `"bar"` and `"baz"` as stopwords that should be ignored. The default value is the empty string (`""`), indicating no stop words.|
| as                  | {% include type t="String[]" %} | The output fields for the text pattern and occurrence count. The default is `["text", "count"]`.|

## Usage

This example counts the occurrences of each digit sequence in the comment field, except for the number 13.

```json
{
  "type": "countpattern",
  "field": "comment",
  "pattern": "\\d+",
  "stopwords": "13"
}
```

Running the transform on this input data

```json
[
  {"comment": "between 12 and 12.43"},
  {"comment": "43 minutes past 12 o'clock (and 13 seconds)"}
]
```

will produce the output

```json
[
  {"text": "12", "count": 3},
  {"text": "43", "count": 2},
]
```
