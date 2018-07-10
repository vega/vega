---
layout: transform
title: Pivot Transform
permalink: /docs/transforms/pivot/index.html
---

The **pivot** transform {% include tag ver="3.2" %} maps unique values from a field to new aggregated fields (columns) in the output stream. The transform requires both a field to pivot on (providing new field names) and a field of values to aggregate to populate the new cells. In addition, any number of groupby fields can be provided to further subdivide the data into output data objects (rows).

Pivot transforms are useful for creating matrix or cross-tabulation data, acting as an inverse to the [fold](../fold) transform.

## Transform Parameters

| Property            | Type                            | Description   |
| :------------------ | :-----------------------------: | :------------ |
| field               | {% include type t="Field" %}    | {% include required %} The field to pivot on. The unique values of this field become new field names in the output stream.|
| value               | {% include type t="Field" %}    | {% include required %} The field to populate pivoted fields. The aggregate values of this field become the values of the new pivoted fields.|
| groupby             | {% include type t="Field[]" %}  | The optional data fields to group by. If not specified, a single group containing all data objects will be used.|
| limit              | {% include type t="Number" %} | An optional parameter indicating the maximum number of pivoted fields to generate. The default (`0`) applies no limit. The pivoted _field_ names are sorted in ascending order prior to enforcing the limit.|
| op                 | {% include type t="String" %} | The aggregation operation to apply to grouped _value_ field values. The default is `sum`. See the [aggregate operation reference](../aggregate/#ops) for more.|

## <a name="op"></a> Pivot Aggregate Operation Reference

The valid operations consist of all [valid aggregate operations](../aggregate/#ops).

## Usage

For the following input data:

```json
[
  {"country": "Norway",  "type": "gold",   "count": 14},
  {"country": "Norway",  "type": "silver", "count": 14},
  {"country": "Norway",  "type": "bronze", "count": 11},
  {"country": "Germany", "type": "gold",   "count": 14},
  {"country": "Germany", "type": "silver", "count": 10},
  {"country": "Germany", "type": "bronze", "count":  7},
  {"country": "Canada",  "type": "gold",   "count": 11},
  {"country": "Canada",  "type": "silver", "count":  8},
  {"country": "Canada",  "type": "bronze", "count": 10}
]
```

The pivot transform

```json
{
  "type": "pivot",
  "groupby": ["country"],
  "field": "type",
  "value": "count"
}
```

produces the output:

```json
[
  {"country": "Norway",  "gold": 14, "silver": 14, "bronze": 11},
  {"country": "Germany", "gold": 14, "silver": 10, "bronze":  7},
  {"country": "Canada",  "gold": 11, "silver":  8, "bronze": 10},
]
```
