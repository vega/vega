---
layout: transform
title: JoinAggregate Transform
permalink: /docs/transforms/joinaggregate/index.html
---

The **joinaggregate** transform extends the input data objects with aggregate values. Aggregation is performed and the results are then joined with the input data. The parameters for this transform are nearly identical to the [`aggregate`](../aggregate) transform, but rather than creating new output objects, the results are written back to each of the input data objects. This transform can be helpful for creating derived values that combine both raw data and aggregate calculations, such as percentages of group totals.

## Transform Parameters

| Property            | Type                            | Description   |
| :------------------ | :-----------------------------: | :------------ |
| groupby             | {% include type t="Field[]" %}  | The data fields to group by. If not specified, a single group containing all data objects will be used.|
| fields              | {% include type t="Field[]" %}  | The data fields for which to compute aggregate functions. This array should align with the _ops_ and _as_ arrays. If no _fields_ and _ops_ are specified, a `count` aggregation will be used by default.|
| ops                 | {% include type t="String[]" %} | The aggregation operations to apply to the _fields_, such as `sum`, `average` or `count`. See the [aggregate operation reference](#ops) for more.|
| as                  | {% include type t="String[]" %} | The output field names to use for each aggregated field in _fields_. If not specified, names will be automatically generated based on the operation and field names (e.g., `sum_field`, `average_field`).|

## <a name="ops"></a> Aggregate Operation Reference

All valid aggregate operations.

| Operation | Description  |
| :-------- | :------------|
| count     | The total count of data objects in the group.|
| valid     | The count of field values that are not null, undefined or NaN.|
| missing   | The count of null or undefined field values.|
| distinct  | The count of distinct field values.|
| sum       | The sum of field values.|
| mean      | The mean (average) field value.|
| average   | The mean (average) field value. Identical to mean.|
| variance  | The sample variance of field values.|
| variancep | The population variance of field values.|
| stdev     | The sample standard deviation of field values.|
| stdevp    | The population standard deviation of field values.|
| stderr    | The standard error of field values.|
| median    | The median field value.|
| q1        | The lower quartile boundary of field values.|
| q3        | The upper quartile boundary of field values.|
| ci0       | The lower boundary of the bootstrapped 95% confidence interval of the mean field value.|
| ci1       | The upper boundary of the bootstrapped 95% confidence interval of the mean field value.|
| min       | The minimum field value.|
| max       | The maximum field value.|
| argmin    | An input data object containing the minimum field value.|
| argmax    | An input data object containing the maximum field value.|

## Usage

For the following input data:

```json
[
  {"foo": 1, "bar": 1},
  {"foo": 1, "bar": 2},
  {"foo": null, "bar": 3}
]
```

The join aggregate transform

```json
{
  "type": "joinaggregate",
  "fields": ["foo", "bar", "bar"],
  "ops": ["valid", "sum", "median"],
  "as": ["v", "s", "m"]
}
```

produces the output:

```json
[
  {"foo": 1, "bar": 1, "v": 2, "s": 6, "m": 2},
  {"foo": 1, "bar": 2, "v": 2, "s": 6, "m": 2},
  {"foo": null, "bar": 3, "v": 2, "s": 6, "m": 2}
]
```
