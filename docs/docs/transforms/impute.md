---
layout: transform
title: Impute Transform
permalink: /docs/transforms/impute/index.html
---

The **impute** transform performs imputation of missing values.

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| field               | {% include type t="Field" %}   | {% include required %} The data field for which missing values should be imputed.|
| method              | {% include type t="String" %}  | The imputation method to use. One of `value` (default), `mean`, `median`, `max` or `min`.|
| groupby             | {% include type t="Field[]" %} | An optional array of fields by which to group the values. Imputation will then be performed on a per-group basis. For example, missing values may be imputed using the group mean rather than the global mean.|
| orderby             | {% include type t="Field[]" %} | An optional array of fields by which to sort data objects into a series. Missing _orderby_ values (those occuring in the data but not in the current group) will be imputed.|
| value               | {% include type t="Any" %}     | The field value to use when the imputation method is `value`.|

## Usage

```json
{
  "data": [
    {
      "name": "table",
      "values": [
        {"x": 0, "y": 28, "c":0}, {"x": 0, "y": 55, "c":1},
        {"x": 1, "y": 43, "c":0}, {"x": 1, "y": 91, "c":1},
        {"x": 2, "y": 81, "c":0}, {"x": 2, "y": 53, "c":1},
        {"x": 3, "y": 19, "c":0}
      ],
      "transform": [
        {
          "type": "impute",
          "groupby": ["c"],
          "orderby": ["x"],
          "field": "y",
          "method": "value",
          "value": 500
        }
      ]
    }
  ]
}
```

In this example, the transform imputes the tuple

```json
{"x": 3, "c": 1, "y": 500}
```
