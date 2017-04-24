---
layout: transform
title: Aggregate Transform
permalink: /docs/transforms/aggregate/index.html
---

The **aggregate** transform groups and summarizes an input data stream to produce a derived output stream. Aggregate transforms can be used to compute counts, sums, averages and other descriptive statistics over groups of data objects.

## Transform Parameters

| Property            | Type                            | Description   |
| :------------------ | :-----------------------------: | :------------ |
| groupby             | {% include type t="Field[]" %}  | The data fields to group by. If not specified, a single group containing all data objects will be used.|
| fields              | {% include type t="Field[]" %}  | The data fields for which to compute aggregate functions. This array should align with the _ops_ and _as_ arrays. If no _fields_ and _ops_ are specified, a `count` aggregation will be used by default.|
| ops                 | {% include type t="String[]" %} | The aggregation operations to apply to the _fields_, such as `sum`, `average` or `count`. See the [aggregate operation reference](#ops) for more.|
| as                  | {% include type t="String[]" %} | The output field names to use for each aggregated field in _fields_. If not specified, names will be automatically generated based on the operation and field names (e.g., `sum_field`, `average_field`).|
| cross               | {% include type t="Boolean" %}  | Indicates if the full cross-product of all groupby values should be included in the aggregate output (default `false`). If set to `true`, all possible combinations of groupby field values will be considered and zero count groups will be generated and returned for combinations that do not occur in the data itself. Cross-product output act as if the _drop_ parameter is `false`. In the case of streaming updates, the number of output groups will increase if new groupby field values are observed; all prior groups will be retained. This parameter can be useful for generating facets that include groups for all possible partitions of the data.|
| drop                | {% include type t="Boolean" %}  | Indicates if empty (zero count) groups should be dropped (default `true`). When a data stream updates (for example, in response to interactive filtering), aggregation groups may become empty. By default, the group is removed from the output. However, in some cases (such as histograms), one may wish to retain empty groups.|

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

The aggregate transform

```json
{
  "type": "aggregate",
  "fields": ["foo", "bar", "bar"],
  "ops": ["valid", "sum", "median"],
  "as": ["v", "s", "m"]
}
```

produces the output:

```json
[{"v": 2, "s": 6, "m": 2}]
```
