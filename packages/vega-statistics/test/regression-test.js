const tape = require('tape');
const vega = require('../');
const x = d => d[0];
const y = d => d[1];

function closeTo(t, a, b) {
  return t.equal(a.toFixed(9), b.toFixed(9));
}

tape('regressionLinear fits a linear regression model', function (t) {
  const data = [NaN, 0, 1, 2].map(v => [v, 2 - v]);
  const fit = vega.regressionLinear(data, x, y);

  closeTo(t, fit.coef[0], 2);
  closeTo(t, fit.coef[1], -1);
  closeTo(t, fit.rSquared, 1);
  data.filter(d => d === d).forEach(d => closeTo(t, fit.predict(x(d)), y(d)));

  t.end();
});

tape('regressionLog fits a logarithmic regression model', function (t) {
  const data = [1, 2, NaN, 3].map(v => [v, 2 + 3 * Math.log(v)]);
  const fit = vega.regressionLog(data, x, y);

  closeTo(t, fit.coef[0], 2);
  closeTo(t, fit.coef[1], 3);
  closeTo(t, fit.rSquared, 1);
  data.filter(d => d === d).forEach(d => closeTo(t, fit.predict(x(d)), y(d)));

  t.end();
});

tape('regressionExp fits an exponential regression model', function (t) {
  const data = [1, NaN, 2, 3].map(v => [v, 2 * Math.exp(3 * v)]);
  const fit = vega.regressionExp(data, x, y);

  closeTo(t, fit.coef[0], 2);
  closeTo(t, fit.coef[1], 3);
  closeTo(t, fit.rSquared, 1);
  data.filter(d => d === d).forEach(d => closeTo(t, fit.predict(x(d)), y(d)));

  t.end();
});

tape('regressionPow fits a power regression model', function (t) {
  const data = [1, 2, 3, NaN].map(v => [v, 2 * Math.pow(v, 3)]);
  const fit = vega.regressionPow(data, x, y);

  closeTo(t, fit.coef[0], 2);
  closeTo(t, fit.coef[1], 3);
  closeTo(t, fit.rSquared, 1);
  data.filter(d => d === d).forEach(d => closeTo(t, fit.predict(x(d)), y(d)));

  t.end();
});

tape('regressionQuad fits a quadratic regression model', function (t) {
  const data = [1, NaN, 2, 3].map(v => [v, 2 + 3 * v - v * v]);
  const fit = vega.regressionQuad(data, x, y);

  closeTo(t, fit.coef[0], 2);
  closeTo(t, fit.coef[1], 3);
  closeTo(t, fit.coef[2], -1);
  closeTo(t, fit.rSquared, 1);
  data.filter(d => d === d).forEach(d => closeTo(t, fit.predict(x(d)), y(d)));

  t.end();
});

tape('regressionPoly fits a polynomial regression model', function (t) {
  const data = [1, 2, NaN, 3, 4].map(v => [v, 2 + 3 * v - v * v + 0.5 * v * v * v]);
  const fit = vega.regressionPoly(data, x, y, 3);

  closeTo(t, fit.coef[0], 2);
  closeTo(t, fit.coef[1], 3);
  closeTo(t, fit.coef[2], -1);
  closeTo(t, fit.coef[3], 0.5);
  closeTo(t, fit.rSquared, 1);
  data.filter(d => d === d).forEach(d => closeTo(t, fit.predict(x(d)), y(d)));

  t.end();
});
