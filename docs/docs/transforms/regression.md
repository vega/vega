---
layout: transform
title: Regression Transform
permalink: /docs/transforms/regression/index.html
---

The **regression** transform fits two-dimensional [regression models](https://en.wikipedia.org/wiki/Regression_analysis) to smooth and predict data. This transform can fit multiple models for input data (one per group) and generates new data objects that represent points for summary trend lines.

## Transform Parameters

| Property            | Type                           | Description   |
| :------------------ | :----------------------------: | :------------ |
| x                   | {% include type t="Field" %}   | {% include required %} The data field for predictor (independent) values, typically associated with the x-axis.|
| y                   | {% include type t="Field" %}   | {% include required %} The data field for predicted (dependent) values, typically associated with the y-axis.|
| groupby             | {% include type t="Field[]" %} | The data fields to group by. If not specified, a single group containing all data objects will be used.|
| method              | {% include type t="String" %}  | The type of regression model to use. One of `linear` (default), `exp` `log`, `quad`, `poly`, `pow`, or `loess` ([locally-estimated regression](https://en.wikipedia.org/wiki/Local_regression)).|
| bandwidth           | {% include type t="Number" %}  | The bandwidth parameter for the `loess` method (default 0.3).|
| order               | {% include type t="Number" %}  | The polynomial order (number of coefficients) for the `poly` method.|
| extent              | {% include type t="Number[]" %}| A _[min, max]_ domain over the _x_ field specifying the starting and ending points of the generated trend line. This parameter is ignored if the `loess` method is used.|
| params              | {% include type t="Boolean" %} | A boolean flag indicating if the transform should return the fit model parameters (one object per group), rather than trend line points. Most methods write coefficients to the output fields `a`, `b`, and (for `quad`) `c`. The `poly` method instead writes the parmater values to a `coefficients` array. All of these methods produce an `rSquared` value as well, indicating the total variance explained by the model. The `loess` method, in contrast, does not produce any fit model parameters.|
| as                  | {% include type t="String" %}  | The output fields for the predictor and predicted values for the line of best fit. If unspecified, the _x_ and _y_ parameter field names will be used.|

## Usage

### Linear Regression

```json
{
  "type": "regression",
  "method": "linear",
  "x": "dv",
  "y": "iv",
  "extent": [-5, 5]
}
```

Fits a linear regression model that predicts the field `dv` as a function of `iv`. Generates a new data stream with points for a regression line that extends from -5 to 5 over the domain of `iv`.

### Loess Regression

```json
{
  "type": "regression",
  "method": "loess",
  "x": "dv",
  "y": "iv",
  "bandwidth": 0.2
}
```

Fits a [loess](https://en.wikipedia.org/wiki/Local_regression) regression model that predicts the field `dv` as a function of `iv`, using a bandwidth parameter of 0.2

### Model Parameters

```json
{
  "type": "regression",
  "method": "loess",
  "groupby": ["key"],
  "x": "dv",
  "y": "iv",
  "order": 4,
  "params": true
}
```

Fits a fourth-order polynomial regression model that predicts the field `dv` as a function of `iv`, with separate models for each value of the _groupby_ field `key`. Rather than generate trend line points, returns an object with model parameter values for each group with the fields `coefficients` (an array of fitted model coefficients) and `rSquared` (the [coefficient of determination](https://en.wikipedia.org/wiki/Coefficient_of_determination) indicating the amount of variance explained by the model).
