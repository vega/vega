---
layout: transform
title: Impute Transform
permalink: /docs/transforms/impute/index.html
---

The **impute** transform performs imputation of missing data objects.

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| field               | {% include type t="Field" %}   | {% include required %} The data field for which missing values should be imputed.|
| key                 | {% include type t="Field" %}   | {% include required %} A key field that uniquely identifies data objects within a group. Missing _key_ values (those occurring in the data but not in the current group) will be imputed.|
| keyvals             | {% include type t="Any[]" %}   | An optional array of key values that should be considered for imputation. If provided, this array will be used in addition to the key values observed within the input data.|
| method              | {% include type t="String" %}  | The imputation method to use for the _field_ value of imputed data objects. One of `value` (default), `mean`, `median`, `max`, or `min`. For example, the `mean` method will calculate the mean of all existing values within a group, and replace the missing values with the calculated mean. |
| groupby             | {% include type t="Field[]" %} | An optional array of fields by which to group the values. Imputation will then be performed on a per-group basis. For example, missing values may be imputed using the group mean rather than the global mean.|
| value               | {% include type t="Any" %}     | The field value to use when the imputation method is `value`.|

## Usage

```json
{
  "data": [
    {
      "name": "table",
      "values": [
        {"x": 0, "y": 28, "c": 0}, {"x": 0, "y": 55, "c": 1},
        {"x": 1, "y": 43, "c": 0}, {"x": 1, "y": 91, "c": 1},
        {"x": 2, "y": 81, "c": 0}, {"x": 2, "y": 53, "c": 1},
        {"x": 3, "y": 19, "c": 0}
      ],
      "transform": [
        {
          "type": "impute",
          "groupby": ["c"],
          "key": "x",
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
