---
layout: transform
title: Quantile Transform
permalink: /docs/transforms/quantile/index.html
---

The **quantile** transform {% include tag ver="5.7" %} calculates empirical [quantile](https://en.wikipedia.org/wiki/Quantile) values for an input data stream. If a *groupby* parameter is provided, quantiles are estimated separately per group. Among other uses, the *quantile* transform is useful for creating [quantile-quantile (Q-Q) plots](https://en.wikipedia.org/wiki/Q%E2%80%93Q_plot).

## Transform Parameters

| Property            | Type                            | Description   |
| :------------------ | :-----------------------------: | :------------ |
| field               | {% include type t="Field" %}    | {% include required %} The data field for which to perform quantile estimation.|
| groupby             | {% include type t="Field[]" %}  | The data fields to group by. If not specified, a single group containing all data objects will be used.|
| probs               | {% include type t="Number[]" %} | An array of probabilities in the range (0, 1) for which to compute quantile values. If not specified, the *step* parameter will be used. |
| step                | {% include type t="Number" %}   | A probability step size (default 0.01) for sampling quantile values. All values from one-half the step size up to 1 (exclusive) will be sampled. This parameter is only used if the *probs* parameter is not provided. |
| as                  | {% include type t="String[]" %} | The output fields for the probability and quantile value. The default is `["prob", "value"]`.|

## Usage

This example computes the [quartile](https://en.wikipedia.org/wiki/Quartile) boundaries for the input data field *value*:

```json
{"type": "quantile", "field": "value", "probs": [0.25, 0.50, 0.75]}
```

This example computes 20 equally-spaced quantiles (from 0.025 to 0.975):

```json
{"type": "quantile", "field": "value", "step": 0.05}
```

For more, see the [quantile-quantile plot example](../../../examples/quantile-quantile-plot).
