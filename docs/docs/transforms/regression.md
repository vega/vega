---
layout: transform
title: Regression Transform
permalink: /docs/transforms/regression/index.html
---

The **regression** transform {% include tag ver="5.4" %} fits two-dimensional [regression models](https://en.wikipedia.org/wiki/Regression_analysis) to smooth and predict data. This transform can fit multiple models for input data (one per group) and generates new data objects that represent points for summary trend lines. Alternatively, this transform can be used to generate a set of objects containing regression model parameters, one per group.

This transform supports parametric models for the following functional forms:

* linear (`linear`): _y = a + b * x_
* logarithmic (`log`): _y = a + b * log(x)_
* exponential (`exp`): _y = a + e<sup>b * x</sup>_
* power (`pow`): _y = a * x<sup>b</sup>_
* quadratic (`quad`): _y = a + b * x + c * x<sup>2</sup>_
* polynomial (`poly`): _y = a + b * x + ... + k * x<sup>order</sup>_

All models are fit using [ordinary least squares](https://en.wikipedia.org/wiki/Ordinary_least_squares). For non-parametric locally weighted regression, see the [loess](../loess) transform.

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| x                   | {% include type t="Field" %}   | {% include required %} The data field for predictor (independent) values, typically associated with the x-axis.|
| y                   | {% include type t="Field" %}   | {% include required %} The data field for predicted (dependent) values, typically associated with the y-axis.|
| groupby             | {% include type t="Field[]" %} | The data fields to group by. If not specified, a single group containing all data objects will be used.|
| method              | {% include type t="String" %}  | The type of regression model to use. One of `linear` (default), `log`, `exp`, `pow`, `quad`, or `poly`.|
| order               | {% include type t="Number" %}  | The polynomial order (number of coefficients) for the `poly` method.|
| extent              | {% include type t="Number[]" %}| A _[min, max]_ domain over the _x_ field specifying the starting and ending points of the generated trend line.|
| params              | {% include type t="Boolean" %} | A boolean flag indicating if the transform should return the fit model parameters (one object per group), rather than trend line points. The resulting objects include a `coef` array of fitted coefficient values (starting with the intercept term and then including terms of increasing order) and an `rSquared` value (indicating the total variance explained by the model).|
| as                  | {% include type t="String" %}  | The output fields for the predictor and predicted values for the line of best fit. If unspecified, the _x_ and _y_ parameter field names will be used.|

## Usage

### Linear Regression

Fit a linear regression model that predicts the field `dv` as a function of `iv`. Generates a new data stream with points for a regression line that extends from -5 to 5 over the domain of `iv`:

```json
{
  "type": "regression",
  "method": "linear",
  "x": "dv",
  "y": "iv",
  "extent": [-5, 5]
}
```

The resulting points can then be visualized with a line mark.

### Model Parameters

Fit a fourth-order polynomial regression model that predicts the field `dv` as a function of `iv`, with separate models for each value of the _groupby_ field `key`:

```json
{
  "type": "regression",
  "method": "poly",
  "groupby": ["key"],
  "x": "dv",
  "y": "iv",
  "order": 4,
  "params": true
}
```

By setting _params_ to `true`, instead of trend line points this example returns an object with model parameter values for each group with the fields `coef` (an array of fitted model coefficients) and `rSquared` (the [coefficient of determination](https://en.wikipedia.org/wiki/Coefficient_of_determination) indicating the amount of variance explained by the model).
