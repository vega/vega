---
layout: spec
title: Color Schemes
permalink: /docs/schemes/index.html
---

Color **schemes** provide a set of named color palettes for both discrete and continuous color encodings. Vega provides a collection of perceptually-motivated color schemes, many of which were originally created by [Cynthia Brewer](https://en.wikipedia.org/wiki/Cynthia_Brewer) and the [ColorBrewer](http://colorbrewer2.org/) project, or by [Maureen Stone](https://research.tableau.com/user/maureen-stone) of Tableau Software. To view and set default color schemes, see the [Config documentation](../config/#scale-range).

Discrete color schemes may be used directly with scales that have discrete (or discretizing) domains, such as [`ordinal`](../scales/#ordinal), [`quantize`](../scales/#quantize), and [`quantile`](../scales/#quantile) scales. Continuous color schemes can be used directly with continuous scales (such as [`linear`](../scales/#linear), [`log`](../scales/#log), and [`sqrt`](../scales/#sqrt) scales), and &ndash; by specifying a scheme `count` property &ndash; can also be used to generate discrete color schemes.

## Scheme Properties

Properties supported by color scheme definitions. These objects can be assigned to a scale's _range_ property. If a scale definition includes the property `"reverse": true`, the color scheme order will be flipped.

| Property      | Type                          | Description    |
| :------------ | :---------------------------: | :------------- |
| scheme        | {% include type t="String|Color[]" %} | {% include required %} The name of the color scheme to use or an array of color values. See the [scheme reference](#reference) below for named schemes. For Vega 5.0 and higher, if a color array is provided, the colors will be interpolated to form a new scheme; use the [scale `interpolate`](../scales#properties) property to set the interpolation type (defaults to linear RGB interpolation).|
| count         | {% include type t="Number" %} | The number of colors to use in the scheme. This property can be useful for scale types such as `quantile` and `quantize`, which use the length of the scale range to determine the number of discrete bins for the scale domain. |
| extent        | {% include type t="Number[]" %} | For continuous schemes only, determines the extent of the color range to use. For example `[0.2, 1]` will rescale the color scheme such that color values in the range [0, 0.2) are excluded from the scheme.  Starting the extent array with the higher number will reverse the scheme order.  For example, `[1, 0]` is the reverse of `[0, 1]`. |

## Registering Additional Schemes

Vega can be extended with additional color schemes using the [`vega.scheme`](https://github.com/vega/vega/tree/master/packages/vega-scale/#scheme) method. New schemes must be a valid color array or [interpolator](https://github.com/d3/d3-scale#sequential_interpolator). For example:

```js
// Register a discrete color scheme named "basic" that can then be used in Vega specs
vega.scheme('basic', ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff']);
```

```js
// Register a custom continuous interpolation scheme

// Define an interpolator function that maps from [0,1] to colors
function grey(f) {
  var g = Math.max(0, Math.min(255, Math.round(255 * f))) + '';
  return 'rgb(' + g + ', ' + g + ', ' + g + ')';
}

// Register the interpolator. Now the scheme "mygrey" can be used in Vega specs
vega.scheme("mygrey", grey);
```

## <a name="reference"></a>Scheme Reference

- [**Categorical**](#categorical)
- [**Sequential Single-Hue**](#seq-single-hue)
- [**Sequential Multi-Hue**](#seq-multi-hue)
- [**Diverging**](#diverging)
- [**Cyclical**](#cyclical)

<script>
function toggle(id) {
  var el = document.querySelector(id),
      v = el.style.display === 'block' ? 'none' : 'block';
  el.style.display = v;
}
</script>

### <a name="categorical"></a>Categorical Schemes

Categorical color schemes can be used to encode discrete data values, each representing a distinct category.

<div class="scheme">
<a name="accent" href="#accent">#</a> <strong>accent</strong>
<div class="swatch">
  <div title="#7fc97f" style="background: rgb(127, 201, 127);"></div>
  <div title="#beaed4" style="background: rgb(190, 174, 212);"></div>
  <div title="#fdc086" style="background: rgb(253, 192, 134);"></div>
  <div title="#ffff99" style="background: rgb(255, 255, 153);"></div>
  <div title="#386cb0" style="background: rgb(56, 108, 176);"></div>
  <div title="#f0027f" style="background: rgb(240, 2, 127);"></div>
  <div title="#bf5b17" style="background: rgb(191, 91, 23);"></div>
  <div title="#666666" style="background: rgb(102, 102, 102);"></div>
</div>
</div>

<div class="scheme">
<a name="category10" href="#category10">#</a> <strong>category10</strong>
<div class="swatch">
  <div title="#1f77b4" style="background: rgb(31, 119, 180);"></div>
  <div title="#ff7f0e" style="background: rgb(255, 127, 14);"></div>
  <div title="#2ca02c" style="background: rgb(44, 160, 44);"></div>
  <div title="#d62728" style="background: rgb(214, 39, 40);"></div>
  <div title="#9467bd" style="background: rgb(148, 103, 189);"></div>
  <div title="#8c564b" style="background: rgb(140, 86, 75);"></div>
  <div title="#e377c2" style="background: rgb(227, 119, 194);"></div>
  <div title="#7f7f7f" style="background: rgb(127, 127, 127);"></div>
  <div title="#bcbd22" style="background: rgb(188, 189, 34);"></div>
  <div title="#17becf" style="background: rgb(23, 190, 207);"></div>
</div>
</div>

<div class="scheme">
<a name="category20" href="#category20">#</a> <strong>category20</strong>
<div class="swatch">
  <div title="#1f77b4" style="background: rgb(31, 119, 180);"></div>
  <div title="#aec7e8" style="background: rgb(174, 199, 232);"></div>
  <div title="#ff7f0e" style="background: rgb(255, 127, 14);"></div>
  <div title="#ffbb78" style="background: rgb(255, 187, 120);"></div>
  <div title="#2ca02c" style="background: rgb(44, 160, 44);"></div>
  <div title="#98df8a" style="background: rgb(152, 223, 138);"></div>
  <div title="#d62728" style="background: rgb(214, 39, 40);"></div>
  <div title="#ff9896" style="background: rgb(255, 152, 150);"></div>
  <div title="#9467bd" style="background: rgb(148, 103, 189);"></div>
  <div title="#c5b0d5" style="background: rgb(197, 176, 213);"></div>
  <div title="#8c564b" style="background: rgb(140, 86, 75);"></div>
  <div title="#c49c94" style="background: rgb(196, 156, 148);"></div>
  <div title="#e377c2" style="background: rgb(227, 119, 194);"></div>
  <div title="#f7b6d2" style="background: rgb(247, 182, 210);"></div>
  <div title="#7f7f7f" style="background: rgb(127, 127, 127);"></div>
  <div title="#c7c7c7" style="background: rgb(199, 199, 199);"></div>
  <div title="#bcbd22" style="background: rgb(188, 189, 34);"></div>
  <div title="#dbdb8d" style="background: rgb(219, 219, 141);"></div>
  <div title="#17becf" style="background: rgb(23, 190, 207);"></div>
  <div title="#9edae5" style="background: rgb(158, 218, 229);"></div>
</div>
</div>

<div class="scheme">
<a name="category20b" href="#category20b">#</a> <strong>category20b</strong>
<div class="swatch">
  <div title="#393b79" style="background: rgb(57, 59, 121);"></div>
  <div title="#5254a3" style="background: rgb(82, 84, 163);"></div>
  <div title="#6b6ecf" style="background: rgb(107, 110, 207);"></div>
  <div title="#9c9ede" style="background: rgb(156, 158, 222);"></div>
  <div title="#637939" style="background: rgb(99, 121, 57);"></div>
  <div title="#8ca252" style="background: rgb(140, 162, 82);"></div>
  <div title="#b5cf6b" style="background: rgb(181, 207, 107);"></div>
  <div title="#cedb9c" style="background: rgb(206, 219, 156);"></div>
  <div title="#8c6d31" style="background: rgb(140, 109, 49);"></div>
  <div title="#bd9e39" style="background: rgb(189, 158, 57);"></div>
  <div title="#e7ba52" style="background: rgb(231, 186, 82);"></div>
  <div title="#e7cb94" style="background: rgb(231, 203, 148);"></div>
  <div title="#843c39" style="background: rgb(132, 60, 57);"></div>
  <div title="#ad494a" style="background: rgb(173, 73, 74);"></div>
  <div title="#d6616b" style="background: rgb(214, 97, 107);"></div>
  <div title="#e7969c" style="background: rgb(231, 150, 156);"></div>
  <div title="#7b4173" style="background: rgb(123, 65, 115);"></div>
  <div title="#a55194" style="background: rgb(165, 81, 148);"></div>
  <div title="#ce6dbd" style="background: rgb(206, 109, 189);"></div>
  <div title="#de9ed6" style="background: rgb(222, 158, 214);"></div>
</div>
</div>

<div class="scheme">
<a name="category20c" href="#category20c">#</a> <strong>category20c</strong>
<div class="swatch">
  <div title="#3182bd" style="background: rgb(49, 130, 189);"></div>
  <div title="#6baed6" style="background: rgb(107, 174, 214);"></div>
  <div title="#9ecae1" style="background: rgb(158, 202, 225);"></div>
  <div title="#c6dbef" style="background: rgb(198, 219, 239);"></div>
  <div title="#e6550d" style="background: rgb(230, 85, 13);"></div>
  <div title="#fd8d3c" style="background: rgb(253, 141, 60);"></div>
  <div title="#fdae6b" style="background: rgb(253, 174, 107);"></div>
  <div title="#fdd0a2" style="background: rgb(253, 208, 162);"></div>
  <div title="#31a354" style="background: rgb(49, 163, 84);"></div>
  <div title="#74c476" style="background: rgb(116, 196, 118);"></div>
  <div title="#a1d99b" style="background: rgb(161, 217, 155);"></div>
  <div title="#c7e9c0" style="background: rgb(199, 233, 192);"></div>
  <div title="#756bb1" style="background: rgb(117, 107, 177);"></div>
  <div title="#9e9ac8" style="background: rgb(158, 154, 200);"></div>
  <div title="#bcbddc" style="background: rgb(188, 189, 220);"></div>
  <div title="#dadaeb" style="background: rgb(218, 218, 235);"></div>
  <div title="#636363" style="background: rgb(99, 99, 99);"></div>
  <div title="#969696" style="background: rgb(150, 150, 150);"></div>
  <div title="#bdbdbd" style="background: rgb(189, 189, 189);"></div>
  <div title="#d9d9d9" style="background: rgb(217, 217, 217);"></div>
</div>
</div>

<div class="scheme">
<a name="dark2" href="#dark2">#</a> <strong>dark2</strong>
<div class="swatch">
  <div title="#1b9e77" style="background: rgb(27, 158, 119);"></div>
  <div title="#d95f02" style="background: rgb(217, 95, 2);"></div>
  <div title="#7570b3" style="background: rgb(117, 112, 179);"></div>
  <div title="#e7298a" style="background: rgb(231, 41, 138);"></div>
  <div title="#66a61e" style="background: rgb(102, 166, 30);"></div>
  <div title="#e6ab02" style="background: rgb(230, 171, 2);"></div>
  <div title="#a6761d" style="background: rgb(166, 118, 29);"></div>
  <div title="#666666" style="background: rgb(102, 102, 102);"></div>
</div>
</div>

<div class="scheme">
<a name="paired" href="#paired">#</a> <strong>paired</strong>
<div class="swatch">
  <div title="#a6cee3" style="background: rgb(166, 206, 227);"></div>
  <div title="#1f78b4" style="background: rgb(31, 120, 180);"></div>
  <div title="#b2df8a" style="background: rgb(178, 223, 138);"></div>
  <div title="#33a02c" style="background: rgb(51, 160, 44);"></div>
  <div title="#fb9a99" style="background: rgb(251, 154, 153);"></div>
  <div title="#e31a1c" style="background: rgb(227, 26, 28);"></div>
  <div title="#fdbf6f" style="background: rgb(253, 191, 111);"></div>
  <div title="#ff7f00" style="background: rgb(255, 127, 0);"></div>
  <div title="#cab2d6" style="background: rgb(202, 178, 214);"></div>
  <div title="#6a3d9a" style="background: rgb(106, 61, 154);"></div>
  <div title="#ffff99" style="background: rgb(255, 255, 153);"></div>
  <div title="#b15928" style="background: rgb(177, 89, 40);"></div>
</div>
</div>

<div class="scheme">
<a name="pastel1" href="#pastel1">#</a> <strong>pastel1</strong>
<div class="swatch">
  <div title="#fbb4ae" style="background: rgb(251, 180, 174);"></div>
  <div title="#b3cde3" style="background: rgb(179, 205, 227);"></div>
  <div title="#ccebc5" style="background: rgb(204, 235, 197);"></div>
  <div title="#decbe4" style="background: rgb(222, 203, 228);"></div>
  <div title="#fed9a6" style="background: rgb(254, 217, 166);"></div>
  <div title="#ffffcc" style="background: rgb(255, 255, 204);"></div>
  <div title="#e5d8bd" style="background: rgb(229, 216, 189);"></div>
  <div title="#fddaec" style="background: rgb(253, 218, 236);"></div>
  <div title="#f2f2f2" style="background: rgb(242, 242, 242);"></div>
</div>
</div>

<div class="scheme">
<a name="pastel2" href="#pastel2">#</a> <strong>pastel2</strong>
<div class="swatch">
  <div title="#b3e2cd" style="background: rgb(179, 226, 205);"></div>
  <div title="#fdcdac" style="background: rgb(253, 205, 172);"></div>
  <div title="#cbd5e8" style="background: rgb(203, 213, 232);"></div>
  <div title="#f4cae4" style="background: rgb(244, 202, 228);"></div>
  <div title="#e6f5c9" style="background: rgb(230, 245, 201);"></div>
  <div title="#fff2ae" style="background: rgb(255, 242, 174);"></div>
  <div title="#f1e2cc" style="background: rgb(241, 226, 204);"></div>
  <div title="#cccccc" style="background: rgb(204, 204, 204);"></div>
</div>
</div>

<div class="scheme">
<a name="set1" href="#set1">#</a> <strong>set1</strong>
<div class="swatch">
  <div title="#e41a1c" style="background: rgb(228, 26, 28);"></div>
  <div title="#377eb8" style="background: rgb(55, 126, 184);"></div>
  <div title="#4daf4a" style="background: rgb(77, 175, 74);"></div>
  <div title="#984ea3" style="background: rgb(152, 78, 163);"></div>
  <div title="#ff7f00" style="background: rgb(255, 127, 0);"></div>
  <div title="#ffff33" style="background: rgb(255, 255, 51);"></div>
  <div title="#a65628" style="background: rgb(166, 86, 40);"></div>
  <div title="#f781bf" style="background: rgb(247, 129, 191);"></div>
  <div title="#999999" style="background: rgb(153, 153, 153);"></div>
</div>
</div>

<div class="scheme">
<a name="set2" href="#set2">#</a> <strong>set2</strong>
<div class="swatch">
  <div title="#66c2a5" style="background: rgb(102, 194, 165);"></div>
  <div title="#fc8d62" style="background: rgb(252, 141, 98);"></div>
  <div title="#8da0cb" style="background: rgb(141, 160, 203);"></div>
  <div title="#e78ac3" style="background: rgb(231, 138, 195);"></div>
  <div title="#a6d854" style="background: rgb(166, 216, 84);"></div>
  <div title="#ffd92f" style="background: rgb(255, 217, 47);"></div>
  <div title="#e5c494" style="background: rgb(229, 196, 148);"></div>
  <div title="#b3b3b3" style="background: rgb(179, 179, 179);"></div>
</div>
</div>

<div class="scheme">
<a name="set3" href="#set3">#</a> <strong>set3</strong>
<div class="swatch">
  <div title="#8dd3c7" style="background: rgb(141, 211, 199);"></div>
  <div title="#ffffb3" style="background: rgb(255, 255, 179);"></div>
  <div title="#bebada" style="background: rgb(190, 186, 218);"></div>
  <div title="#fb8072" style="background: rgb(251, 128, 114);"></div>
  <div title="#80b1d3" style="background: rgb(128, 177, 211);"></div>
  <div title="#fdb462" style="background: rgb(253, 180, 98);"></div>
  <div title="#b3de69" style="background: rgb(179, 222, 105);"></div>
  <div title="#fccde5" style="background: rgb(252, 205, 229);"></div>
  <div title="#d9d9d9" style="background: rgb(217, 217, 217);"></div>
  <div title="#bc80bd" style="background: rgb(188, 128, 189);"></div>
  <div title="#ccebc5" style="background: rgb(204, 235, 197);"></div>
  <div title="#ffed6f" style="background: rgb(255, 237, 111);"></div>
</div>
</div>

<div class="scheme">
<a name="tableau10" href="#tableau10">#</a> <strong>tableau10</strong>
<div class="swatch">
  <div title="#4c78a8" style="background: rgb(76, 120, 168);"></div>
  <div title="#f58518" style="background: rgb(245, 133, 24);"></div>
  <div title="#e45756" style="background: rgb(228, 87, 86);"></div>
  <div title="#72b7b2" style="background: rgb(114, 183, 178);"></div>
  <div title="#54a24b" style="background: rgb(84, 162, 75);"></div>
  <div title="#eeca3b" style="background: rgb(238, 202, 59);"></div>
  <div title="#b279a2" style="background: rgb(178, 121, 162);"></div>
  <div title="#ff9da6" style="background: rgb(255, 157, 166);"></div>
  <div title="#9d755d" style="background: rgb(157, 117, 93);"></div>
  <div title="#bab0ac" style="background: rgb(186, 176, 172);"></div>
</div>
</div>

<div class="scheme">
<a name="tableau20" href="#tableau20">#</a> <strong>tableau20</strong>
<div class="swatch">
  <div title="#4c78a8" style="background: rgb(76, 120, 168);"></div>
  <div title="#9ecae9" style="background: rgb(158, 202, 233);"></div>
  <div title="#f58518" style="background: rgb(245, 133, 24);"></div>
  <div title="#ffbf79" style="background: rgb(255, 191, 121);"></div>
  <div title="#54a24b" style="background: rgb(84, 162, 75);"></div>
  <div title="#88d27a" style="background: rgb(136, 210, 122);"></div>
  <div title="#b79a20" style="background: rgb(183, 154, 32);"></div>
  <div title="#f2cf5b" style="background: rgb(242, 207, 91);"></div>
  <div title="#439894" style="background: rgb(67, 152, 148);"></div>
  <div title="#83bcb6" style="background: rgb(131, 188, 182);"></div>
  <div title="#e45756" style="background: rgb(228, 87, 86);"></div>
  <div title="#ff9d98" style="background: rgb(255, 157, 152);"></div>
  <div title="#79706e" style="background: rgb(121, 112, 110);"></div>
  <div title="#bab0ac" style="background: rgb(186, 176, 172);"></div>
  <div title="#d67195" style="background: rgb(214, 113, 149);"></div>
  <div title="#fcbfd2" style="background: rgb(252, 191, 210);"></div>
  <div title="#b279a2" style="background: rgb(178, 121, 162);"></div>
  <div title="#d6a5c9" style="background: rgb(214, 165, 201);"></div>
  <div title="#9e765f" style="background: rgb(158, 118, 95);"></div>
  <div title="#d8b5a5" style="background: rgb(216, 181, 165);"></div>
</div>
</div>


### <a name="seq-single-hue"></a>Sequential Single-Hue Schemes

Sequential color schemes can be used to encode quantitative values. These color ramps are designed to encode increasing numeric values. Hover over a scheme and click the "View Discrete" link to toggle display of discretized palettes suitable for quantile, quantize, threshold, or ordinal [scales](../scales).

<div class="scheme continuous">
<a name="blues" href="#blues">#</a> <strong>blues</strong> <a class="toggle" href='javascript:toggle("#discrete-blues")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-blues">
      <stop offset="0%" stop-color="#cfe1f2"></stop>
      <stop offset="10%" stop-color="#bed8ec"></stop>
      <stop offset="20%" stop-color="#a8cee5"></stop>
      <stop offset="30%" stop-color="#8fc1de"></stop>
      <stop offset="40%" stop-color="#74b2d7"></stop>
      <stop offset="50%" stop-color="#5ba3cf"></stop>
      <stop offset="60%" stop-color="#4592c6"></stop>
      <stop offset="70%" stop-color="#3181bd"></stop>
      <stop offset="80%" stop-color="#206fb2"></stop>
      <stop offset="90%" stop-color="#125ca4"></stop>
      <stop offset="100%" stop-color="#0a4a90"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-blues)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-blues" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#5ba3cf" style="background: #5ba3cf;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#86bcdc" style="background: #86bcdc;"></div>
  <div title="#3887c0" style="background: #3887c0;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#9cc8e2" style="background: #9cc8e2;"></div>
  <div title="#5ba3cf" style="background: #5ba3cf;"></div>
  <div title="#2978b8" style="background: #2978b8;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#a8cee5" style="background: #a8cee5;"></div>
  <div title="#74b2d7" style="background: #74b2d7;"></div>
  <div title="#4592c6" style="background: #4592c6;"></div>
  <div title="#206fb2" style="background: #206fb2;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#afd1e7" style="background: #afd1e7;"></div>
  <div title="#86bcdc" style="background: #86bcdc;"></div>
  <div title="#5ba3cf" style="background: #5ba3cf;"></div>
  <div title="#3887c0" style="background: #3887c0;"></div>
  <div title="#1b69ad" style="background: #1b69ad;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#b5d4e9" style="background: #b5d4e9;"></div>
  <div title="#93c3df" style="background: #93c3df;"></div>
  <div title="#6daed5" style="background: #6daed5;"></div>
  <div title="#4b97c9" style="background: #4b97c9;"></div>
  <div title="#2f7ebb" style="background: #2f7ebb;"></div>
  <div title="#1864aa" style="background: #1864aa;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#b9d6ea" style="background: #b9d6ea;"></div>
  <div title="#9cc8e2" style="background: #9cc8e2;"></div>
  <div title="#7bb6d9" style="background: #7bb6d9;"></div>
  <div title="#5ba3cf" style="background: #5ba3cf;"></div>
  <div title="#408ec4" style="background: #408ec4;"></div>
  <div title="#2978b8" style="background: #2978b8;"></div>
  <div title="#1661a8" style="background: #1661a8;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#bcd7eb" style="background: #bcd7eb;"></div>
  <div title="#a2cbe3" style="background: #a2cbe3;"></div>
  <div title="#86bcdc" style="background: #86bcdc;"></div>
  <div title="#69abd3" style="background: #69abd3;"></div>
  <div title="#4f9aca" style="background: #4f9aca;"></div>
  <div title="#3887c0" style="background: #3887c0;"></div>
  <div title="#2473b4" style="background: #2473b4;"></div>
  <div title="#145ea6" style="background: #145ea6;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#bed8ec" style="background: #bed8ec;"></div>
  <div title="#a8cee5" style="background: #a8cee5;"></div>
  <div title="#8fc1de" style="background: #8fc1de;"></div>
  <div title="#74b2d7" style="background: #74b2d7;"></div>
  <div title="#5ba3cf" style="background: #5ba3cf;"></div>
  <div title="#4592c6" style="background: #4592c6;"></div>
  <div title="#3181bd" style="background: #3181bd;"></div>
  <div title="#206fb2" style="background: #206fb2;"></div>
  <div title="#125ca4" style="background: #125ca4;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="tealblues" href="#tealblues">#</a> <strong>tealblues</strong> {% include tag ver="5.0" %} <a class="toggle" href='javascript:toggle("#discrete-tealblues")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-tealblues">
      <stop offset="0%" stop-color="#bce4d8"></stop>
      <stop offset="10%" stop-color="#a3d6d2"></stop>
      <stop offset="20%" stop-color="#8cc9cd"></stop>
      <stop offset="30%" stop-color="#76bdc7"></stop>
      <stop offset="40%" stop-color="#5fb0c0"></stop>
      <stop offset="50%" stop-color="#45a2b9"></stop>
      <stop offset="60%" stop-color="#3993b0"></stop>
      <stop offset="70%" stop-color="#3584a6"></stop>
      <stop offset="80%" stop-color="#32759b"></stop>
      <stop offset="90%" stop-color="#2f6790"></stop>
      <stop offset="100%" stop-color="#2c5985"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-tealblues)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-tealblues" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#45a2b9" style="background: #45a2b9;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#6eb8c5" style="background: #6eb8c5;"></div>
  <div title="#3589a9" style="background: #3589a9;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#81c3cb" style="background: #81c3cb;"></div>
  <div title="#45a2b9" style="background: #45a2b9;"></div>
  <div title="#347da0" style="background: #347da0;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#8cc9cd" style="background: #8cc9cd;"></div>
  <div title="#5fb0c0" style="background: #5fb0c0;"></div>
  <div title="#3993b0" style="background: #3993b0;"></div>
  <div title="#32759b" style="background: #32759b;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#94cecf" style="background: #94cecf;"></div>
  <div title="#6eb8c5" style="background: #6eb8c5;"></div>
  <div title="#45a2b9" style="background: #45a2b9;"></div>
  <div title="#3589a9" style="background: #3589a9;"></div>
  <div title="#317097" style="background: #317097;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#99d1d0" style="background: #99d1d0;"></div>
  <div title="#79bec8" style="background: #79bec8;"></div>
  <div title="#57acbe" style="background: #57acbe;"></div>
  <div title="#3c97b3" style="background: #3c97b3;"></div>
  <div title="#3582a4" style="background: #3582a4;"></div>
  <div title="#316d95" style="background: #316d95;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#9dd3d1" style="background: #9dd3d1;"></div>
  <div title="#81c3cb" style="background: #81c3cb;"></div>
  <div title="#65b3c2" style="background: #65b3c2;"></div>
  <div title="#45a2b9" style="background: #45a2b9;"></div>
  <div title="#368fae" style="background: #368fae;"></div>
  <div title="#347da0" style="background: #347da0;"></div>
  <div title="#306a93" style="background: #306a93;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#a0d5d2" style="background: #a0d5d2;"></div>
  <div title="#87c7cc" style="background: #87c7cc;"></div>
  <div title="#6eb8c5" style="background: #6eb8c5;"></div>
  <div title="#53aabd" style="background: #53aabd;"></div>
  <div title="#3e9ab4" style="background: #3e9ab4;"></div>
  <div title="#3589a9" style="background: #3589a9;"></div>
  <div title="#33799d" style="background: #33799d;"></div>
  <div title="#306891" style="background: #306891;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#a3d6d2" style="background: #a3d6d2;"></div>
  <div title="#8cc9cd" style="background: #8cc9cd;"></div>
  <div title="#76bdc7" style="background: #76bdc7;"></div>
  <div title="#5fb0c0" style="background: #5fb0c0;"></div>
  <div title="#45a2b9" style="background: #45a2b9;"></div>
  <div title="#3993b0" style="background: #3993b0;"></div>
  <div title="#3584a6" style="background: #3584a6;"></div>
  <div title="#32759b" style="background: #32759b;"></div>
  <div title="#2f6790" style="background: #2f6790;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="teals" href="#teals">#</a> <strong>teals</strong> {% include tag ver="5.0" %} <a class="toggle" href='javascript:toggle("#discrete-teals")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-teals">
      <stop offset="0%" stop-color="#bbdfdf"></stop>
      <stop offset="10%" stop-color="#a2d4d5"></stop>
      <stop offset="20%" stop-color="#8ac9c9"></stop>
      <stop offset="30%" stop-color="#75bcbb"></stop>
      <stop offset="40%" stop-color="#61b0af"></stop>
      <stop offset="50%" stop-color="#4da5a4"></stop>
      <stop offset="60%" stop-color="#379998"></stop>
      <stop offset="70%" stop-color="#2b8b8c"></stop>
      <stop offset="80%" stop-color="#1e7f7f"></stop>
      <stop offset="90%" stop-color="#127273"></stop>
      <stop offset="100%" stop-color="#006667"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-teals)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-teals" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#4da5a4" style="background: #4da5a4;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#6eb8b7" style="background: #6eb8b7;"></div>
  <div title="#2f9090" style="background: #2f9090;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#80c3c2" style="background: #80c3c2;"></div>
  <div title="#4da5a4" style="background: #4da5a4;"></div>
  <div title="#258586" style="background: #258586;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#8ac9c9" style="background: #8ac9c9;"></div>
  <div title="#61b0af" style="background: #61b0af;"></div>
  <div title="#379998" style="background: #379998;"></div>
  <div title="#1e7f7f" style="background: #1e7f7f;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#92cdcd" style="background: #92cdcd;"></div>
  <div title="#6eb8b7" style="background: #6eb8b7;"></div>
  <div title="#4da5a4" style="background: #4da5a4;"></div>
  <div title="#2f9090" style="background: #2f9090;"></div>
  <div title="#1a7b7b" style="background: #1a7b7b;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#98cfd0" style="background: #98cfd0;"></div>
  <div title="#78bebd" style="background: #78bebd;"></div>
  <div title="#5badac" style="background: #5badac;"></div>
  <div title="#3d9c9b" style="background: #3d9c9b;"></div>
  <div title="#29898a" style="background: #29898a;"></div>
  <div title="#177878" style="background: #177878;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#9cd1d2" style="background: #9cd1d2;"></div>
  <div title="#80c3c2" style="background: #80c3c2;"></div>
  <div title="#66b3b2" style="background: #66b3b2;"></div>
  <div title="#4da5a4" style="background: #4da5a4;"></div>
  <div title="#349695" style="background: #349695;"></div>
  <div title="#258586" style="background: #258586;"></div>
  <div title="#157576" style="background: #157576;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#9fd3d4" style="background: #9fd3d4;"></div>
  <div title="#85c6c6" style="background: #85c6c6;"></div>
  <div title="#6eb8b7" style="background: #6eb8b7;"></div>
  <div title="#58abaa" style="background: #58abaa;"></div>
  <div title="#419e9d" style="background: #419e9d;"></div>
  <div title="#2f9090" style="background: #2f9090;"></div>
  <div title="#218282" style="background: #218282;"></div>
  <div title="#137374" style="background: #137374;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#a2d4d5" style="background: #a2d4d5;"></div>
  <div title="#8ac9c9" style="background: #8ac9c9;"></div>
  <div title="#75bcbb" style="background: #75bcbb;"></div>
  <div title="#61b0af" style="background: #61b0af;"></div>
  <div title="#4da5a4" style="background: #4da5a4;"></div>
  <div title="#379998" style="background: #379998;"></div>
  <div title="#2b8b8c" style="background: #2b8b8c;"></div>
  <div title="#1e7f7f" style="background: #1e7f7f;"></div>
  <div title="#127273" style="background: #127273;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="greens" href="#greens">#</a> <strong>greens</strong> <a class="toggle" href='javascript:toggle("#discrete-greens")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-greens">
      <stop offset="0%" stop-color="#d3eecd"></stop>
      <stop offset="10%" stop-color="#c0e6ba"></stop>
      <stop offset="20%" stop-color="#abdda5"></stop>
      <stop offset="30%" stop-color="#94d391"></stop>
      <stop offset="40%" stop-color="#7bc77d"></stop>
      <stop offset="50%" stop-color="#60ba6c"></stop>
      <stop offset="60%" stop-color="#46ab5e"></stop>
      <stop offset="70%" stop-color="#329a51"></stop>
      <stop offset="80%" stop-color="#208943"></stop>
      <stop offset="90%" stop-color="#0e7735"></stop>
      <stop offset="100%" stop-color="#036429"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-greens)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-greens" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#60ba6c" style="background: #60ba6c;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#8ccf8a" style="background: #8ccf8a;"></div>
  <div title="#39a055" style="background: #39a055;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#a0d89b" style="background: #a0d89b;"></div>
  <div title="#60ba6c" style="background: #60ba6c;"></div>
  <div title="#29924a" style="background: #29924a;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#abdda5" style="background: #abdda5;"></div>
  <div title="#7bc77d" style="background: #7bc77d;"></div>
  <div title="#46ab5e" style="background: #46ab5e;"></div>
  <div title="#208943" style="background: #208943;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#b2e0ac" style="background: #b2e0ac;"></div>
  <div title="#8ccf8a" style="background: #8ccf8a;"></div>
  <div title="#60ba6c" style="background: #60ba6c;"></div>
  <div title="#39a055" style="background: #39a055;"></div>
  <div title="#1a833e" style="background: #1a833e;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#b7e2b1" style="background: #b7e2b1;"></div>
  <div title="#97d494" style="background: #97d494;"></div>
  <div title="#73c378" style="background: #73c378;"></div>
  <div title="#4daf62" style="background: #4daf62;"></div>
  <div title="#2f984f" style="background: #2f984f;"></div>
  <div title="#167f3b" style="background: #167f3b;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#bbe4b5" style="background: #bbe4b5;"></div>
  <div title="#a0d89b" style="background: #a0d89b;"></div>
  <div title="#81ca82" style="background: #81ca82;"></div>
  <div title="#60ba6c" style="background: #60ba6c;"></div>
  <div title="#41a75b" style="background: #41a75b;"></div>
  <div title="#29924a" style="background: #29924a;"></div>
  <div title="#137c39" style="background: #137c39;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#bee5b8" style="background: #bee5b8;"></div>
  <div title="#a6dba1" style="background: #a6dba1;"></div>
  <div title="#8ccf8a" style="background: #8ccf8a;"></div>
  <div title="#6fc175" style="background: #6fc175;"></div>
  <div title="#52b264" style="background: #52b264;"></div>
  <div title="#39a055" style="background: #39a055;"></div>
  <div title="#248d46" style="background: #248d46;"></div>
  <div title="#107937" style="background: #107937;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#c0e6ba" style="background: #c0e6ba;"></div>
  <div title="#abdda5" style="background: #abdda5;"></div>
  <div title="#94d391" style="background: #94d391;"></div>
  <div title="#7bc77d" style="background: #7bc77d;"></div>
  <div title="#60ba6c" style="background: #60ba6c;"></div>
  <div title="#46ab5e" style="background: #46ab5e;"></div>
  <div title="#329a51" style="background: #329a51;"></div>
  <div title="#208943" style="background: #208943;"></div>
  <div title="#0e7735" style="background: #0e7735;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="browns" href="#browns">#</a> <strong>browns</strong> {% include tag ver="5.0" %} <a class="toggle" href='javascript:toggle("#discrete-browns")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-browns">
      <stop offset="0%" stop-color="#eedbbd"></stop>
      <stop offset="10%" stop-color="#ecca96"></stop>
      <stop offset="20%" stop-color="#e9b97a"></stop>
      <stop offset="30%" stop-color="#e4a865"></stop>
      <stop offset="40%" stop-color="#dc9856"></stop>
      <stop offset="50%" stop-color="#d18954"></stop>
      <stop offset="60%" stop-color="#c7784c"></stop>
      <stop offset="70%" stop-color="#c0673f"></stop>
      <stop offset="80%" stop-color="#b85536"></stop>
      <stop offset="90%" stop-color="#ad4433"></stop>
      <stop offset="100%" stop-color="#9f3632"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-browns)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-browns" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#d18954" style="background: #d18954;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#e1a360" style="background: #e1a360;"></div>
  <div title="#c26d43" style="background: #c26d43;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#e7b170" style="background: #e7b170;"></div>
  <div title="#d18954" style="background: #d18954;"></div>
  <div title="#bc5e3b" style="background: #bc5e3b;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#e9b97a" style="background: #e9b97a;"></div>
  <div title="#dc9856" style="background: #dc9856;"></div>
  <div title="#c7784c" style="background: #c7784c;"></div>
  <div title="#b85536" style="background: #b85536;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#eabf83" style="background: #eabf83;"></div>
  <div title="#e1a360" style="background: #e1a360;"></div>
  <div title="#d18954" style="background: #d18954;"></div>
  <div title="#c26d43" style="background: #c26d43;"></div>
  <div title="#b44f35" style="background: #b44f35;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#ebc38a" style="background: #ebc38a;"></div>
  <div title="#e5aa68" style="background: #e5aa68;"></div>
  <div title="#d99455" style="background: #d99455;"></div>
  <div title="#ca7d4e" style="background: #ca7d4e;"></div>
  <div title="#bf643e" style="background: #bf643e;"></div>
  <div title="#b24b34" style="background: #b24b34;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#ebc68f" style="background: #ebc68f;"></div>
  <div title="#e7b170" style="background: #e7b170;"></div>
  <div title="#de9c5a" style="background: #de9c5a;"></div>
  <div title="#d18954" style="background: #d18954;"></div>
  <div title="#c57449" style="background: #c57449;"></div>
  <div title="#bc5e3b" style="background: #bc5e3b;"></div>
  <div title="#b04834" style="background: #b04834;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#ecc893" style="background: #ecc893;"></div>
  <div title="#e8b575" style="background: #e8b575;"></div>
  <div title="#e1a360" style="background: #e1a360;"></div>
  <div title="#d79155" style="background: #d79155;"></div>
  <div title="#cb8050" style="background: #cb8050;"></div>
  <div title="#c26d43" style="background: #c26d43;"></div>
  <div title="#ba5938" style="background: #ba5938;"></div>
  <div title="#ae4633" style="background: #ae4633;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#ecca96" style="background: #ecca96;"></div>
  <div title="#e9b97a" style="background: #e9b97a;"></div>
  <div title="#e4a865" style="background: #e4a865;"></div>
  <div title="#dc9856" style="background: #dc9856;"></div>
  <div title="#d18954" style="background: #d18954;"></div>
  <div title="#c7784c" style="background: #c7784c;"></div>
  <div title="#c0673f" style="background: #c0673f;"></div>
  <div title="#b85536" style="background: #b85536;"></div>
  <div title="#ad4433" style="background: #ad4433;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="oranges" href="#oranges">#</a> <strong>oranges</strong> <a class="toggle" href='javascript:toggle("#discrete-oranges")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-oranges">
      <stop offset="0%" stop-color="#fdd8b3"></stop>
      <stop offset="10%" stop-color="#fdc998"></stop>
      <stop offset="20%" stop-color="#fdb87b"></stop>
      <stop offset="30%" stop-color="#fda55e"></stop>
      <stop offset="40%" stop-color="#fc9244"></stop>
      <stop offset="50%" stop-color="#f87f2c"></stop>
      <stop offset="60%" stop-color="#f06b18"></stop>
      <stop offset="70%" stop-color="#e4580b"></stop>
      <stop offset="80%" stop-color="#d14904"></stop>
      <stop offset="90%" stop-color="#b93d02"></stop>
      <stop offset="100%" stop-color="#9f3303"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-oranges)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-oranges" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#f87f2c" style="background: #f87f2c;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#fd9f55" style="background: #fd9f55;"></div>
  <div title="#e85e0f" style="background: #e85e0f;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#fdaf6d" style="background: #fdaf6d;"></div>
  <div title="#f87f2c" style="background: #f87f2c;"></div>
  <div title="#db5108" style="background: #db5108;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#fdb87b" style="background: #fdb87b;"></div>
  <div title="#fc9244" style="background: #fc9244;"></div>
  <div title="#f06b18" style="background: #f06b18;"></div>
  <div title="#d14904" style="background: #d14904;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#fdbe85" style="background: #fdbe85;"></div>
  <div title="#fd9f55" style="background: #fd9f55;"></div>
  <div title="#f87f2c" style="background: #f87f2c;"></div>
  <div title="#e85e0f" style="background: #e85e0f;"></div>
  <div title="#c94503" style="background: #c94503;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#fdc28c" style="background: #fdc28c;"></div>
  <div title="#fda862" style="background: #fda862;"></div>
  <div title="#fb8d3d" style="background: #fb8d3d;"></div>
  <div title="#f2711e" style="background: #f2711e;"></div>
  <div title="#e1560a" style="background: #e1560a;"></div>
  <div title="#c34203" style="background: #c34203;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#fdc591" style="background: #fdc591;"></div>
  <div title="#fdaf6d" style="background: #fdaf6d;"></div>
  <div title="#fc974b" style="background: #fc974b;"></div>
  <div title="#f87f2c" style="background: #f87f2c;"></div>
  <div title="#ed6615" style="background: #ed6615;"></div>
  <div title="#db5108" style="background: #db5108;"></div>
  <div title="#bf4003" style="background: #bf4003;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#fdc795" style="background: #fdc795;"></div>
  <div title="#fdb475" style="background: #fdb475;"></div>
  <div title="#fd9f55" style="background: #fd9f55;"></div>
  <div title="#fa8a39" style="background: #fa8a39;"></div>
  <div title="#f47421" style="background: #f47421;"></div>
  <div title="#e85e0f" style="background: #e85e0f;"></div>
  <div title="#d54c06" style="background: #d54c06;"></div>
  <div title="#bc3e02" style="background: #bc3e02;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#fdc998" style="background: #fdc998;"></div>
  <div title="#fdb87b" style="background: #fdb87b;"></div>
  <div title="#fda55e" style="background: #fda55e;"></div>
  <div title="#fc9244" style="background: #fc9244;"></div>
  <div title="#f87f2c" style="background: #f87f2c;"></div>
  <div title="#f06b18" style="background: #f06b18;"></div>
  <div title="#e4580b" style="background: #e4580b;"></div>
  <div title="#d14904" style="background: #d14904;"></div>
  <div title="#b93d02" style="background: #b93d02;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="reds" href="#reds">#</a> <strong>reds</strong> <a class="toggle" href='javascript:toggle("#discrete-reds")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-reds">
      <stop offset="0%" stop-color="#fdc9b4"></stop>
      <stop offset="10%" stop-color="#fcb49a"></stop>
      <stop offset="20%" stop-color="#fc9e80"></stop>
      <stop offset="30%" stop-color="#fc8767"></stop>
      <stop offset="40%" stop-color="#fa7051"></stop>
      <stop offset="50%" stop-color="#f6573f"></stop>
      <stop offset="60%" stop-color="#ec3f2f"></stop>
      <stop offset="70%" stop-color="#dc2a25"></stop>
      <stop offset="80%" stop-color="#c81b1d"></stop>
      <stop offset="90%" stop-color="#b21218"></stop>
      <stop offset="100%" stop-color="#970b13"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-reds)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-reds" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#f6573f" style="background: #f6573f;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#fb7f60" style="background: #fb7f60;"></div>
  <div title="#e13128" style="background: #e13128;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#fc9374" style="background: #fc9374;"></div>
  <div title="#f6573f" style="background: #f6573f;"></div>
  <div title="#d22321" style="background: #d22321;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#fc9e80" style="background: #fc9e80;"></div>
  <div title="#fa7051" style="background: #fa7051;"></div>
  <div title="#ec3f2f" style="background: #ec3f2f;"></div>
  <div title="#c81b1d" style="background: #c81b1d;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#fca589" style="background: #fca589;"></div>
  <div title="#fb7f60" style="background: #fb7f60;"></div>
  <div title="#f6573f" style="background: #f6573f;"></div>
  <div title="#e13128" style="background: #e13128;"></div>
  <div title="#c1181b" style="background: #c1181b;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#fcab8f" style="background: #fcab8f;"></div>
  <div title="#fc8a6b" style="background: #fc8a6b;"></div>
  <div title="#f9694c" style="background: #f9694c;"></div>
  <div title="#ef4634" style="background: #ef4634;"></div>
  <div title="#d92824" style="background: #d92824;"></div>
  <div title="#bb161a" style="background: #bb161a;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#fcaf94" style="background: #fcaf94;"></div>
  <div title="#fc9374" style="background: #fc9374;"></div>
  <div title="#fb7657" style="background: #fb7657;"></div>
  <div title="#f6573f" style="background: #f6573f;"></div>
  <div title="#e83a2d" style="background: #e83a2d;"></div>
  <div title="#d22321" style="background: #d22321;"></div>
  <div title="#b81419" style="background: #b81419;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#fcb297" style="background: #fcb297;"></div>
  <div title="#fc997a" style="background: #fc997a;"></div>
  <div title="#fb7f60" style="background: #fb7f60;"></div>
  <div title="#f86549" style="background: #f86549;"></div>
  <div title="#f04a36" style="background: #f04a36;"></div>
  <div title="#e13128" style="background: #e13128;"></div>
  <div title="#cc1e1f" style="background: #cc1e1f;"></div>
  <div title="#b41319" style="background: #b41319;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#fcb49a" style="background: #fcb49a;"></div>
  <div title="#fc9e80" style="background: #fc9e80;"></div>
  <div title="#fc8767" style="background: #fc8767;"></div>
  <div title="#fa7051" style="background: #fa7051;"></div>
  <div title="#f6573f" style="background: #f6573f;"></div>
  <div title="#ec3f2f" style="background: #ec3f2f;"></div>
  <div title="#dc2a25" style="background: #dc2a25;"></div>
  <div title="#c81b1d" style="background: #c81b1d;"></div>
  <div title="#b21218" style="background: #b21218;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="purples" href="#purples">#</a> <strong>purples</strong> <a class="toggle" href='javascript:toggle("#discrete-purples")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-purples">
      <stop offset="0%" stop-color="#e2e1ef"></stop>
      <stop offset="10%" stop-color="#d4d4e8"></stop>
      <stop offset="20%" stop-color="#c4c5e0"></stop>
      <stop offset="30%" stop-color="#b4b3d6"></stop>
      <stop offset="40%" stop-color="#a3a0cc"></stop>
      <stop offset="50%" stop-color="#928ec3"></stop>
      <stop offset="60%" stop-color="#827cb9"></stop>
      <stop offset="70%" stop-color="#7566ae"></stop>
      <stop offset="80%" stop-color="#684ea2"></stop>
      <stop offset="90%" stop-color="#5c3696"></stop>
      <stop offset="100%" stop-color="#501f8c"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-purples)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-purples" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#928ec3" style="background: #928ec3;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#aeadd3" style="background: #aeadd3;"></div>
  <div title="#796db2" style="background: #796db2;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#bcbcdb" style="background: #bcbcdb;"></div>
  <div title="#928ec3" style="background: #928ec3;"></div>
  <div title="#6f5aa8" style="background: #6f5aa8;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#c4c5e0" style="background: #c4c5e0;"></div>
  <div title="#a3a0cc" style="background: #a3a0cc;"></div>
  <div title="#827cb9" style="background: #827cb9;"></div>
  <div title="#684ea2" style="background: #684ea2;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#c9cae3" style="background: #c9cae3;"></div>
  <div title="#aeadd3" style="background: #aeadd3;"></div>
  <div title="#928ec3" style="background: #928ec3;"></div>
  <div title="#796db2" style="background: #796db2;"></div>
  <div title="#64469e" style="background: #64469e;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#cdcee5" style="background: #cdcee5;"></div>
  <div title="#b6b6d7" style="background: #b6b6d7;"></div>
  <div title="#9e9bc9" style="background: #9e9bc9;"></div>
  <div title="#8781bc" style="background: #8781bc;"></div>
  <div title="#7363ac" style="background: #7363ac;"></div>
  <div title="#61409b" style="background: #61409b;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#d0d0e6" style="background: #d0d0e6;"></div>
  <div title="#bcbcdb" style="background: #bcbcdb;"></div>
  <div title="#a7a5cf" style="background: #a7a5cf;"></div>
  <div title="#928ec3" style="background: #928ec3;"></div>
  <div title="#7f77b6" style="background: #7f77b6;"></div>
  <div title="#6f5aa8" style="background: #6f5aa8;"></div>
  <div title="#5f3c99" style="background: #5f3c99;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#d2d2e7" style="background: #d2d2e7;"></div>
  <div title="#c0c1de" style="background: #c0c1de;"></div>
  <div title="#aeadd3" style="background: #aeadd3;"></div>
  <div title="#9b98c8" style="background: #9b98c8;"></div>
  <div title="#8984bd" style="background: #8984bd;"></div>
  <div title="#796db2" style="background: #796db2;"></div>
  <div title="#6b53a5" style="background: #6b53a5;"></div>
  <div title="#5d3997" style="background: #5d3997;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#d4d4e8" style="background: #d4d4e8;"></div>
  <div title="#c4c5e0" style="background: #c4c5e0;"></div>
  <div title="#b4b3d6" style="background: #b4b3d6;"></div>
  <div title="#a3a0cc" style="background: #a3a0cc;"></div>
  <div title="#928ec3" style="background: #928ec3;"></div>
  <div title="#827cb9" style="background: #827cb9;"></div>
  <div title="#7566ae" style="background: #7566ae;"></div>
  <div title="#684ea2" style="background: #684ea2;"></div>
  <div title="#5c3696" style="background: #5c3696;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="warmgreys" href="#warmgreys">#</a> <strong>warmgreys</strong> {% include tag ver="5.0" %} <a class="toggle" href='javascript:toggle("#discrete-warmgreys")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-warmgreys">
      <stop offset="0%" stop-color="#dcd4d0"></stop>
      <stop offset="10%" stop-color="#cec5c1"></stop>
      <stop offset="20%" stop-color="#c0b8b4"></stop>
      <stop offset="30%" stop-color="#b3aaa7"></stop>
      <stop offset="40%" stop-color="#a59c99"></stop>
      <stop offset="50%" stop-color="#98908c"></stop>
      <stop offset="60%" stop-color="#8b827f"></stop>
      <stop offset="70%" stop-color="#7e7673"></stop>
      <stop offset="80%" stop-color="#726866"></stop>
      <stop offset="90%" stop-color="#665c5a"></stop>
      <stop offset="100%" stop-color="#59504e"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-warmgreys)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-warmgreys" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#98908c" style="background: #98908c;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#aea5a2" style="background: #aea5a2;"></div>
  <div title="#827a77" style="background: #827a77;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#bab1ae" style="background: #bab1ae;"></div>
  <div title="#98908c" style="background: #98908c;"></div>
  <div title="#786f6d" style="background: #786f6d;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#c0b8b4" style="background: #c0b8b4;"></div>
  <div title="#a59c99" style="background: #a59c99;"></div>
  <div title="#8b827f" style="background: #8b827f;"></div>
  <div title="#726866" style="background: #726866;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#c5bcb8" style="background: #c5bcb8;"></div>
  <div title="#aea5a2" style="background: #aea5a2;"></div>
  <div title="#98908c" style="background: #98908c;"></div>
  <div title="#827a77" style="background: #827a77;"></div>
  <div title="#6e6462" style="background: #6e6462;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#c8bfbb" style="background: #c8bfbb;"></div>
  <div title="#b5aca9" style="background: #b5aca9;"></div>
  <div title="#a19995" style="background: #a19995;"></div>
  <div title="#8f8683" style="background: #8f8683;"></div>
  <div title="#7c7471" style="background: #7c7471;"></div>
  <div title="#6b615f" style="background: #6b615f;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#cbc2be" style="background: #cbc2be;"></div>
  <div title="#bab1ae" style="background: #bab1ae;"></div>
  <div title="#a9a09d" style="background: #a9a09d;"></div>
  <div title="#98908c" style="background: #98908c;"></div>
  <div title="#887f7c" style="background: #887f7c;"></div>
  <div title="#786f6d" style="background: #786f6d;"></div>
  <div title="#695f5d" style="background: #695f5d;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#ccc4c0" style="background: #ccc4c0;"></div>
  <div title="#bdb5b1" style="background: #bdb5b1;"></div>
  <div title="#aea5a2" style="background: #aea5a2;"></div>
  <div title="#9f9793" style="background: #9f9793;"></div>
  <div title="#918885" style="background: #918885;"></div>
  <div title="#827a77" style="background: #827a77;"></div>
  <div title="#756b69" style="background: #756b69;"></div>
  <div title="#675d5b" style="background: #675d5b;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#cec5c1" style="background: #cec5c1;"></div>
  <div title="#c0b8b4" style="background: #c0b8b4;"></div>
  <div title="#b3aaa7" style="background: #b3aaa7;"></div>
  <div title="#a59c99" style="background: #a59c99;"></div>
  <div title="#98908c" style="background: #98908c;"></div>
  <div title="#8b827f" style="background: #8b827f;"></div>
  <div title="#7e7673" style="background: #7e7673;"></div>
  <div title="#726866" style="background: #726866;"></div>
  <div title="#665c5a" style="background: #665c5a;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="greys" href="#greys">#</a> <strong>greys</strong> <a class="toggle" href='javascript:toggle("#discrete-greys")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-greys">
      <stop offset="0%" stop-color="#e2e2e2"></stop>
      <stop offset="10%" stop-color="#d4d4d4"></stop>
      <stop offset="20%" stop-color="#c4c4c4"></stop>
      <stop offset="30%" stop-color="#b1b1b1"></stop>
      <stop offset="40%" stop-color="#9d9d9d"></stop>
      <stop offset="50%" stop-color="#888888"></stop>
      <stop offset="60%" stop-color="#757575"></stop>
      <stop offset="70%" stop-color="#626262"></stop>
      <stop offset="80%" stop-color="#4d4d4d"></stop>
      <stop offset="90%" stop-color="#353535"></stop>
      <stop offset="100%" stop-color="#1e1e1e"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-greys)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-greys" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#888888" style="background: #888888;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#aaaaaa" style="background: #aaaaaa;"></div>
  <div title="#686868" style="background: #686868;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#bbbbbb" style="background: #bbbbbb;"></div>
  <div title="#888888" style="background: #888888;"></div>
  <div title="#585858" style="background: #585858;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#c4c4c4" style="background: #c4c4c4;"></div>
  <div title="#9d9d9d" style="background: #9d9d9d;"></div>
  <div title="#757575" style="background: #757575;"></div>
  <div title="#4d4d4d" style="background: #4d4d4d;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#c9c9c9" style="background: #c9c9c9;"></div>
  <div title="#aaaaaa" style="background: #aaaaaa;"></div>
  <div title="#888888" style="background: #888888;"></div>
  <div title="#686868" style="background: #686868;"></div>
  <div title="#454545" style="background: #454545;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#cdcdcd" style="background: #cdcdcd;"></div>
  <div title="#b4b4b4" style="background: #b4b4b4;"></div>
  <div title="#979797" style="background: #979797;"></div>
  <div title="#7a7a7a" style="background: #7a7a7a;"></div>
  <div title="#5f5f5f" style="background: #5f5f5f;"></div>
  <div title="#3f3f3f" style="background: #3f3f3f;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#d0d0d0" style="background: #d0d0d0;"></div>
  <div title="#bbbbbb" style="background: #bbbbbb;"></div>
  <div title="#a2a2a2" style="background: #a2a2a2;"></div>
  <div title="#888888" style="background: #888888;"></div>
  <div title="#707070" style="background: #707070;"></div>
  <div title="#585858" style="background: #585858;"></div>
  <div title="#3b3b3b" style="background: #3b3b3b;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#d2d2d2" style="background: #d2d2d2;"></div>
  <div title="#c0c0c0" style="background: #c0c0c0;"></div>
  <div title="#aaaaaa" style="background: #aaaaaa;"></div>
  <div title="#949494" style="background: #949494;"></div>
  <div title="#7d7d7d" style="background: #7d7d7d;"></div>
  <div title="#686868" style="background: #686868;"></div>
  <div title="#525252" style="background: #525252;"></div>
  <div title="#383838" style="background: #383838;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#d4d4d4" style="background: #d4d4d4;"></div>
  <div title="#c4c4c4" style="background: #c4c4c4;"></div>
  <div title="#b1b1b1" style="background: #b1b1b1;"></div>
  <div title="#9d9d9d" style="background: #9d9d9d;"></div>
  <div title="#888888" style="background: #888888;"></div>
  <div title="#757575" style="background: #757575;"></div>
  <div title="#626262" style="background: #626262;"></div>
  <div title="#4d4d4d" style="background: #4d4d4d;"></div>
  <div title="#353535" style="background: #353535;"></div>
</div>
</div>
</div>


### <a name="seq-multi-hue"></a>Sequential Multi-Hue Schemes

Sequential color schemes can be used to encode quantitative values. These color ramps are designed to encode increasing numeric values, but use additional hues for more color discrimination, which may be useful for visualizations such as heatmaps. However, beware that using multiple hues may cause viewers to inaccurately see the data range as grouped into color-coded clusters. Hover over a scheme and click the "View Discrete" link to toggle display of discretized palettes suitable for quantile, quantize, threshold, or ordinal [scales](../scales).

<div class="scheme continuous">
<a name="viridis" href="#viridis">#</a> <strong>viridis</strong> <a class="toggle" href='javascript:toggle("#discrete-viridis")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-viridis">
      <stop offset="0%" stop-color="#440154"></stop>
      <stop offset="10%" stop-color="#482575"></stop>
      <stop offset="20%" stop-color="#414487"></stop>
      <stop offset="30%" stop-color="#35608d"></stop>
      <stop offset="40%" stop-color="#2a788e"></stop>
      <stop offset="50%" stop-color="#21918d"></stop>
      <stop offset="60%" stop-color="#22a884"></stop>
      <stop offset="70%" stop-color="#43bf71"></stop>
      <stop offset="80%" stop-color="#7ad151"></stop>
      <stop offset="90%" stop-color="#bcdf27"></stop>
      <stop offset="100%" stop-color="#fde725"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-viridis)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-viridis" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#21918d" style="background: #21918d;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#31688e" style="background: #31688e;"></div>
  <div title="#35b779" style="background: #35b779;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#3b528b" style="background: #3b528b;"></div>
  <div title="#21918d" style="background: #21918d;"></div>
  <div title="#5dc963" style="background: #5dc963;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#414487" style="background: #414487;"></div>
  <div title="#2a788e" style="background: #2a788e;"></div>
  <div title="#22a884" style="background: #22a884;"></div>
  <div title="#7ad151" style="background: #7ad151;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#443a83" style="background: #443a83;"></div>
  <div title="#31688e" style="background: #31688e;"></div>
  <div title="#21918d" style="background: #21918d;"></div>
  <div title="#35b779" style="background: #35b779;"></div>
  <div title="#8fd744" style="background: #8fd744;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#46327f" style="background: #46327f;"></div>
  <div title="#375c8d" style="background: #375c8d;"></div>
  <div title="#27808e" style="background: #27808e;"></div>
  <div title="#1fa187" style="background: #1fa187;"></div>
  <div title="#4ac26d" style="background: #4ac26d;"></div>
  <div title="#9fda3a" style="background: #9fda3a;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#472d7b" style="background: #472d7b;"></div>
  <div title="#3b528b" style="background: #3b528b;"></div>
  <div title="#2c728e" style="background: #2c728e;"></div>
  <div title="#21918d" style="background: #21918d;"></div>
  <div title="#28ae80" style="background: #28ae80;"></div>
  <div title="#5dc963" style="background: #5dc963;"></div>
  <div title="#abdc32" style="background: #abdc32;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#482878" style="background: #482878;"></div>
  <div title="#3e4b89" style="background: #3e4b89;"></div>
  <div title="#31688e" style="background: #31688e;"></div>
  <div title="#26838e" style="background: #26838e;"></div>
  <div title="#1f9d89" style="background: #1f9d89;"></div>
  <div title="#35b779" style="background: #35b779;"></div>
  <div title="#6dce59" style="background: #6dce59;"></div>
  <div title="#b4de2c" style="background: #b4de2c;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#482575" style="background: #482575;"></div>
  <div title="#414487" style="background: #414487;"></div>
  <div title="#35608d" style="background: #35608d;"></div>
  <div title="#2a788e" style="background: #2a788e;"></div>
  <div title="#21918d" style="background: #21918d;"></div>
  <div title="#22a884" style="background: #22a884;"></div>
  <div title="#43bf71" style="background: #43bf71;"></div>
  <div title="#7ad151" style="background: #7ad151;"></div>
  <div title="#bcdf27" style="background: #bcdf27;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="magma" href="#magma">#</a> <strong>magma</strong> <a class="toggle" href='javascript:toggle("#discrete-magma")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-magma">
      <stop offset="0%" stop-color="#000004"></stop>
      <stop offset="10%" stop-color="#150e37"></stop>
      <stop offset="20%" stop-color="#3b0f70"></stop>
      <stop offset="30%" stop-color="#651a80"></stop>
      <stop offset="40%" stop-color="#8c2981"></stop>
      <stop offset="50%" stop-color="#b6377a"></stop>
      <stop offset="60%" stop-color="#de4968"></stop>
      <stop offset="70%" stop-color="#f76f5c"></stop>
      <stop offset="80%" stop-color="#fe9f6d"></stop>
      <stop offset="90%" stop-color="#fece91"></stop>
      <stop offset="100%" stop-color="#fcfdbf"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-magma)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-magma" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#b6377a" style="background: #b6377a;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#721f81" style="background: #721f81;"></div>
  <div title="#f1605d" style="background: #f1605d;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#51137c" style="background: #51137c;"></div>
  <div title="#b6377a" style="background: #b6377a;"></div>
  <div title="#fb8762" style="background: #fb8762;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#3b0f70" style="background: #3b0f70;"></div>
  <div title="#8c2981" style="background: #8c2981;"></div>
  <div title="#de4968" style="background: #de4968;"></div>
  <div title="#fe9f6d" style="background: #fe9f6d;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#2c1160" style="background: #2c1160;"></div>
  <div title="#721f81" style="background: #721f81;"></div>
  <div title="#b6377a" style="background: #b6377a;"></div>
  <div title="#f1605d" style="background: #f1605d;"></div>
  <div title="#feaf78" style="background: #feaf78;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#231151" style="background: #231151;"></div>
  <div title="#5f187f" style="background: #5f187f;"></div>
  <div title="#982d80" style="background: #982d80;"></div>
  <div title="#d3436e" style="background: #d3436e;"></div>
  <div title="#f8765d" style="background: #f8765d;"></div>
  <div title="#feba81" style="background: #feba81;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#1d1046" style="background: #1d1046;"></div>
  <div title="#51137c" style="background: #51137c;"></div>
  <div title="#822582" style="background: #822582;"></div>
  <div title="#b6377a" style="background: #b6377a;"></div>
  <div title="#e65164" style="background: #e65164;"></div>
  <div title="#fb8762" style="background: #fb8762;"></div>
  <div title="#fec387" style="background: #fec387;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#190f3e" style="background: #190f3e;"></div>
  <div title="#451076" style="background: #451076;"></div>
  <div title="#721f81" style="background: #721f81;"></div>
  <div title="#9f2f7f" style="background: #9f2f7f;"></div>
  <div title="#cd4071" style="background: #cd4071;"></div>
  <div title="#f1605d" style="background: #f1605d;"></div>
  <div title="#fd9468" style="background: #fd9468;"></div>
  <div title="#fec98d" style="background: #fec98d;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#150e37" style="background: #150e37;"></div>
  <div title="#3b0f70" style="background: #3b0f70;"></div>
  <div title="#651a80" style="background: #651a80;"></div>
  <div title="#8c2981" style="background: #8c2981;"></div>
  <div title="#b6377a" style="background: #b6377a;"></div>
  <div title="#de4968" style="background: #de4968;"></div>
  <div title="#f76f5c" style="background: #f76f5c;"></div>
  <div title="#fe9f6d" style="background: #fe9f6d;"></div>
  <div title="#fece91" style="background: #fece91;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="inferno" href="#inferno">#</a> <strong>inferno</strong> <a class="toggle" href='javascript:toggle("#discrete-inferno")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-inferno">
      <stop offset="0%" stop-color="#000004"></stop>
      <stop offset="10%" stop-color="#170c3b"></stop>
      <stop offset="20%" stop-color="#420a68"></stop>
      <stop offset="30%" stop-color="#6b176e"></stop>
      <stop offset="40%" stop-color="#932667"></stop>
      <stop offset="50%" stop-color="#bb3755"></stop>
      <stop offset="60%" stop-color="#dd513a"></stop>
      <stop offset="70%" stop-color="#f3771a"></stop>
      <stop offset="80%" stop-color="#fca50a"></stop>
      <stop offset="90%" stop-color="#f6d645"></stop>
      <stop offset="100%" stop-color="#fcffa4"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-inferno)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-inferno" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#bb3755" style="background: #bb3755;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#781c6d" style="background: #781c6d;"></div>
  <div title="#ed6925" style="background: #ed6925;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#57106d" style="background: #57106d;"></div>
  <div title="#bb3755" style="background: #bb3755;"></div>
  <div title="#fa8d0b" style="background: #fa8d0b;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#420a68" style="background: #420a68;"></div>
  <div title="#932667" style="background: #932667;"></div>
  <div title="#dd513a" style="background: #dd513a;"></div>
  <div title="#fca50a" style="background: #fca50a;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#330a5f" style="background: #330a5f;"></div>
  <div title="#781c6d" style="background: #781c6d;"></div>
  <div title="#bb3755" style="background: #bb3755;"></div>
  <div title="#ed6925" style="background: #ed6925;"></div>
  <div title="#fcb519" style="background: #fcb519;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#280b54" style="background: #280b54;"></div>
  <div title="#65156e" style="background: #65156e;"></div>
  <div title="#9f2a63" style="background: #9f2a63;"></div>
  <div title="#d44843" style="background: #d44843;"></div>
  <div title="#f57d15" style="background: #f57d15;"></div>
  <div title="#fbc127" style="background: #fbc127;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#210c4a" style="background: #210c4a;"></div>
  <div title="#57106d" style="background: #57106d;"></div>
  <div title="#89226a" style="background: #89226a;"></div>
  <div title="#bb3755" style="background: #bb3755;"></div>
  <div title="#e45933" style="background: #e45933;"></div>
  <div title="#fa8d0b" style="background: #fa8d0b;"></div>
  <div title="#f9ca33" style="background: #f9ca33;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#1b0c42" style="background: #1b0c42;"></div>
  <div title="#4b0c6b" style="background: #4b0c6b;"></div>
  <div title="#781c6d" style="background: #781c6d;"></div>
  <div title="#a52d60" style="background: #a52d60;"></div>
  <div title="#ce4347" style="background: #ce4347;"></div>
  <div title="#ed6925" style="background: #ed6925;"></div>
  <div title="#fb9a07" style="background: #fb9a07;"></div>
  <div title="#f7d13d" style="background: #f7d13d;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#170c3b" style="background: #170c3b;"></div>
  <div title="#420a68" style="background: #420a68;"></div>
  <div title="#6b176e" style="background: #6b176e;"></div>
  <div title="#932667" style="background: #932667;"></div>
  <div title="#bb3755" style="background: #bb3755;"></div>
  <div title="#dd513a" style="background: #dd513a;"></div>
  <div title="#f3771a" style="background: #f3771a;"></div>
  <div title="#fca50a" style="background: #fca50a;"></div>
  <div title="#f6d645" style="background: #f6d645;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="plasma" href="#plasma">#</a> <strong>plasma</strong> <a class="toggle" href='javascript:toggle("#discrete-plasma")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-plasma">
      <stop offset="0%" stop-color="#0d0887"></stop>
      <stop offset="10%" stop-color="#42039d"></stop>
      <stop offset="20%" stop-color="#6a00a8"></stop>
      <stop offset="30%" stop-color="#900da4"></stop>
      <stop offset="40%" stop-color="#b12a90"></stop>
      <stop offset="50%" stop-color="#cb4779"></stop>
      <stop offset="60%" stop-color="#e16462"></stop>
      <stop offset="70%" stop-color="#f2834c"></stop>
      <stop offset="80%" stop-color="#fca636"></stop>
      <stop offset="90%" stop-color="#fcce25"></stop>
      <stop offset="100%" stop-color="#f0f921"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-plasma)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-plasma" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#cb4779" style="background: #cb4779;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#9c179e" style="background: #9c179e;"></div>
  <div title="#ed7953" style="background: #ed7953;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#7e03a8" style="background: #7e03a8;"></div>
  <div title="#cb4779" style="background: #cb4779;"></div>
  <div title="#f89541" style="background: #f89541;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#6a00a8" style="background: #6a00a8;"></div>
  <div title="#b12a90" style="background: #b12a90;"></div>
  <div title="#e16462" style="background: #e16462;"></div>
  <div title="#fca636" style="background: #fca636;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#5d01a6" style="background: #5d01a6;"></div>
  <div title="#9c179e" style="background: #9c179e;"></div>
  <div title="#cb4779" style="background: #cb4779;"></div>
  <div title="#ed7953" style="background: #ed7953;"></div>
  <div title="#fdb32f" style="background: #fdb32f;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#5402a3" style="background: #5402a3;"></div>
  <div title="#8b0aa5" style="background: #8b0aa5;"></div>
  <div title="#b93389" style="background: #b93389;"></div>
  <div title="#db5b68" style="background: #db5b68;"></div>
  <div title="#f48849" style="background: #f48849;"></div>
  <div title="#febc2b" style="background: #febc2b;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#4d02a1" style="background: #4d02a1;"></div>
  <div title="#7e03a8" style="background: #7e03a8;"></div>
  <div title="#aa2396" style="background: #aa2396;"></div>
  <div title="#cb4779" style="background: #cb4779;"></div>
  <div title="#e66c5d" style="background: #e66c5d;"></div>
  <div title="#f89541" style="background: #f89541;"></div>
  <div title="#fec428" style="background: #fec428;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#47039f" style="background: #47039f;"></div>
  <div title="#7301a8" style="background: #7301a8;"></div>
  <div title="#9c179e" style="background: #9c179e;"></div>
  <div title="#bd3785" style="background: #bd3785;"></div>
  <div title="#d8576c" style="background: #d8576c;"></div>
  <div title="#ed7953" style="background: #ed7953;"></div>
  <div title="#fb9e3b" style="background: #fb9e3b;"></div>
  <div title="#fdc926" style="background: #fdc926;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#42039d" style="background: #42039d;"></div>
  <div title="#6a00a8" style="background: #6a00a8;"></div>
  <div title="#900da4" style="background: #900da4;"></div>
  <div title="#b12a90" style="background: #b12a90;"></div>
  <div title="#cb4779" style="background: #cb4779;"></div>
  <div title="#e16462" style="background: #e16462;"></div>
  <div title="#f2834c" style="background: #f2834c;"></div>
  <div title="#fca636" style="background: #fca636;"></div>
  <div title="#fcce25" style="background: #fcce25;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="cividis" href="#cividis">#</a> <strong>cividis</strong> {% include tag ver="5.15" %} <a class="toggle" href='javascript:toggle("#discrete-cividis")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-cividis">
        <stop offset="0%" stop-color="#002051"></stop>
        <stop offset="10%" stop-color="#0a326a"></stop>
        <stop offset="20%" stop-color="#2b446e"></stop>
        <stop offset="30%" stop-color="#4d566d"></stop>
        <stop offset="40%" stop-color="#696970"></stop>
        <stop offset="50%" stop-color="#7f7c75"></stop>
        <stop offset="60%" stop-color="#948f78"></stop>
        <stop offset="70%" stop-color="#ada476"></stop>
        <stop offset="80%" stop-color="#caba6a"></stop>
        <stop offset="90%" stop-color="#ead156"></stop>
        <stop offset="100%" stop-color="#fdea45"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-cividis)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-cividis" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#7f7c75" style="background: #7f7c75;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#575c6e" style="background: #575c6e;"></div>
  <div title="#a49d78" style="background: #a49d78;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#3c4d6e" style="background: #3c4d6e;"></div>
  <div title="#7f7c75" style="background: #7f7c75;"></div>
  <div title="#bbaf71" style="background: #bbaf71;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#2b446e" style="background: #2b446e;"></div>
  <div title="#696970" style="background: #696970;"></div>
  <div title="#948f78" style="background: #948f78;"></div>
  <div title="#caba6a" style="background: #caba6a;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#1f3e6e" style="background: #1f3e6e;"></div>
  <div title="#575c6e" style="background: #575c6e;"></div>
  <div title="#7f7c75" style="background: #7f7c75;"></div>
  <div title="#a49d78" style="background: #a49d78;"></div>
  <div title="#d5c164" style="background: #d5c164;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#173a6d" style="background: #173a6d;"></div>
  <div title="#48546d" style="background: #48546d;"></div>
  <div title="#706e71" style="background: #706e71;"></div>
  <div title="#8e8978" style="background: #8e8978;"></div>
  <div title="#b1a775" style="background: #b1a775;"></div>
  <div title="#ddc75f" style="background: #ddc75f;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#11366c" style="background: #11366c;"></div>
  <div title="#3c4d6e" style="background: #3c4d6e;"></div>
  <div title="#62646f" style="background: #62646f;"></div>
  <div title="#7f7c75" style="background: #7f7c75;"></div>
  <div title="#9a9478" style="background: #9a9478;"></div>
  <div title="#bbaf71" style="background: #bbaf71;"></div>
  <div title="#e2cb5c" style="background: #e2cb5c;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#0d346b" style="background: #0d346b;"></div>
  <div title="#33486e" style="background: #33486e;"></div>
  <div title="#575c6e" style="background: #575c6e;"></div>
  <div title="#737172" style="background: #737172;"></div>
  <div title="#8b8677" style="background: #8b8677;"></div>
  <div title="#a49d78" style="background: #a49d78;"></div>
  <div title="#c3b56d" style="background: #c3b56d;"></div>
  <div title="#e6cf59" style="background: #e6cf59;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#0a326a" style="background: #0a326a;"></div>
  <div title="#2b446e" style="background: #2b446e;"></div>
  <div title="#4d566d" style="background: #4d566d;"></div>
  <div title="#696970" style="background: #696970;"></div>
  <div title="#7f7c75" style="background: #7f7c75;"></div>
  <div title="#948f78" style="background: #948f78;"></div>
  <div title="#ada476" style="background: #ada476;"></div>
  <div title="#caba6a" style="background: #caba6a;"></div>
  <div title="#ead156" style="background: #ead156;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="turbo" href="#turbo">#</a> <strong>turbo</strong> {% include tag ver="5.15" %} <a class="toggle" href='javascript:toggle("#discrete-turbo")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-turbo">
        <stop offset="0%" stop-color="#23171b"></stop>
        <stop offset="10%" stop-color="#4a58dd"></stop>
        <stop offset="20%" stop-color="#2f9df5"></stop>
        <stop offset="30%" stop-color="#27d7c4"></stop>
        <stop offset="40%" stop-color="#4df884"></stop>
        <stop offset="50%" stop-color="#95fb51"></stop>
        <stop offset="60%" stop-color="#dedd32"></stop>
        <stop offset="70%" stop-color="#ffa423"></stop>
        <stop offset="80%" stop-color="#f65f18"></stop>
        <stop offset="90%" stop-color="#ba2208"></stop>
        <stop offset="100%" stop-color="#900c00"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-turbo)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-turbo" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#95fb51" style="background: #95fb51;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#2ee5ae" style="background: #2ee5ae;"></div>
  <div title="#feb927" style="background: #feb927;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#26bce1" style="background: #26bce1;"></div>
  <div title="#95fb51" style="background: #95fb51;"></div>
  <div title="#ff821d" style="background: #ff821d;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#2f9df5" style="background: #2f9df5;"></div>
  <div title="#4df884" style="background: #4df884;"></div>
  <div title="#dedd32" style="background: #dedd32;"></div>
  <div title="#f65f18" style="background: #f65f18;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#3987f9" style="background: #3987f9;"></div>
  <div title="#2ee5ae" style="background: #2ee5ae;"></div>
  <div title="#95fb51" style="background: #95fb51;"></div>
  <div title="#feb927" style="background: #feb927;"></div>
  <div title="#e54813" style="background: #e54813;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#4076f5" style="background: #4076f5;"></div>
  <div title="#26d0cd" style="background: #26d0cd;"></div>
  <div title="#5ffc73" style="background: #5ffc73;"></div>
  <div title="#cbe839" style="background: #cbe839;"></div>
  <div title="#ff9b21" style="background: #ff9b21;"></div>
  <div title="#d6390f" style="background: #d6390f;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#4569ee" style="background: #4569ee;"></div>
  <div title="#26bce1" style="background: #26bce1;"></div>
  <div title="#3ff393" style="background: #3ff393;"></div>
  <div title="#95fb51" style="background: #95fb51;"></div>
  <div title="#ecd12e" style="background: #ecd12e;"></div>
  <div title="#ff821d" style="background: #ff821d;"></div>
  <div title="#cb2f0d" style="background: #cb2f0d;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#4860e6" style="background: #4860e6;"></div>
  <div title="#2aabee" style="background: #2aabee;"></div>
  <div title="#2ee5ae" style="background: #2ee5ae;"></div>
  <div title="#6afd6a" style="background: #6afd6a;"></div>
  <div title="#c0ee3d" style="background: #c0ee3d;"></div>
  <div title="#feb927" style="background: #feb927;"></div>
  <div title="#fe6e1a" style="background: #fe6e1a;"></div>
  <div title="#c2270a" style="background: #c2270a;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#4a58dd" style="background: #4a58dd;"></div>
  <div title="#2f9df5" style="background: #2f9df5;"></div>
  <div title="#27d7c4" style="background: #27d7c4;"></div>
  <div title="#4df884" style="background: #4df884;"></div>
  <div title="#95fb51" style="background: #95fb51;"></div>
  <div title="#dedd32" style="background: #dedd32;"></div>
  <div title="#ffa423" style="background: #ffa423;"></div>
  <div title="#f65f18" style="background: #f65f18;"></div>
  <div title="#ba2208" style="background: #ba2208;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="bluegreen" href="#bluegreen">#</a> <strong>bluegreen</strong> <a class="toggle" href='javascript:toggle("#discrete-bluegreen")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-bluegreen">
      <stop offset="0%" stop-color="#d5efed"></stop>
      <stop offset="10%" stop-color="#c1e8e0"></stop>
      <stop offset="20%" stop-color="#a7ddd1"></stop>
      <stop offset="30%" stop-color="#8bd2be"></stop>
      <stop offset="40%" stop-color="#70c6a9"></stop>
      <stop offset="50%" stop-color="#58ba91"></stop>
      <stop offset="60%" stop-color="#44ad77"></stop>
      <stop offset="70%" stop-color="#319c5d"></stop>
      <stop offset="80%" stop-color="#208946"></stop>
      <stop offset="90%" stop-color="#0e7736"></stop>
      <stop offset="100%" stop-color="#036429"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-bluegreen)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-bluegreen" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#58ba91" style="background: #58ba91;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#82ceb7" style="background: #82ceb7;"></div>
  <div title="#37a266" style="background: #37a266;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#99d8c8" style="background: #99d8c8;"></div>
  <div title="#58ba91" style="background: #58ba91;"></div>
  <div title="#299352" style="background: #299352;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#a7ddd1" style="background: #a7ddd1;"></div>
  <div title="#70c6a9" style="background: #70c6a9;"></div>
  <div title="#44ad77" style="background: #44ad77;"></div>
  <div title="#208946" style="background: #208946;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#b0e1d6" style="background: #b0e1d6;"></div>
  <div title="#82ceb7" style="background: #82ceb7;"></div>
  <div title="#58ba91" style="background: #58ba91;"></div>
  <div title="#37a266" style="background: #37a266;"></div>
  <div title="#1a8341" style="background: #1a8341;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#b6e3da" style="background: #b6e3da;"></div>
  <div title="#8fd4c1" style="background: #8fd4c1;"></div>
  <div title="#69c3a2" style="background: #69c3a2;"></div>
  <div title="#4ab17e" style="background: #4ab17e;"></div>
  <div title="#2f995a" style="background: #2f995a;"></div>
  <div title="#167f3d" style="background: #167f3d;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#bbe5dc" style="background: #bbe5dc;"></div>
  <div title="#99d8c8" style="background: #99d8c8;"></div>
  <div title="#77c9ae" style="background: #77c9ae;"></div>
  <div title="#58ba91" style="background: #58ba91;"></div>
  <div title="#3fa971" style="background: #3fa971;"></div>
  <div title="#299352" style="background: #299352;"></div>
  <div title="#137c3a" style="background: #137c3a;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#bee7de" style="background: #bee7de;"></div>
  <div title="#a1dbcd" style="background: #a1dbcd;"></div>
  <div title="#82ceb7" style="background: #82ceb7;"></div>
  <div title="#65c19e" style="background: #65c19e;"></div>
  <div title="#4db383" style="background: #4db383;"></div>
  <div title="#37a266" style="background: #37a266;"></div>
  <div title="#248d4b" style="background: #248d4b;"></div>
  <div title="#107938" style="background: #107938;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#c1e8e0" style="background: #c1e8e0;"></div>
  <div title="#a7ddd1" style="background: #a7ddd1;"></div>
  <div title="#8bd2be" style="background: #8bd2be;"></div>
  <div title="#70c6a9" style="background: #70c6a9;"></div>
  <div title="#58ba91" style="background: #58ba91;"></div>
  <div title="#44ad77" style="background: #44ad77;"></div>
  <div title="#319c5d" style="background: #319c5d;"></div>
  <div title="#208946" style="background: #208946;"></div>
  <div title="#0e7736" style="background: #0e7736;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="bluepurple" href="#bluepurple">#</a> <strong>bluepurple</strong> <a class="toggle" href='javascript:toggle("#discrete-bluepurple")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-bluepurple">
      <stop offset="0%" stop-color="#ccddec"></stop>
      <stop offset="10%" stop-color="#bad0e4"></stop>
      <stop offset="20%" stop-color="#a8c2dd"></stop>
      <stop offset="30%" stop-color="#9ab0d4"></stop>
      <stop offset="40%" stop-color="#919cc9"></stop>
      <stop offset="50%" stop-color="#8d85be"></stop>
      <stop offset="60%" stop-color="#8b6db2"></stop>
      <stop offset="70%" stop-color="#8a55a6"></stop>
      <stop offset="80%" stop-color="#873c99"></stop>
      <stop offset="90%" stop-color="#822287"></stop>
      <stop offset="100%" stop-color="#730f71"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-bluepurple)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-bluepurple" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#8d85be" style="background: #8d85be;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#97a9d0" style="background: #97a9d0;"></div>
  <div title="#8a5daa" style="background: #8a5daa;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#a1b9d9" style="background: #a1b9d9;"></div>
  <div title="#8d85be" style="background: #8d85be;"></div>
  <div title="#8949a0" style="background: #8949a0;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#a8c2dd" style="background: #a8c2dd;"></div>
  <div title="#919cc9" style="background: #919cc9;"></div>
  <div title="#8b6db2" style="background: #8b6db2;"></div>
  <div title="#873c99" style="background: #873c99;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#aec7df" style="background: #aec7df;"></div>
  <div title="#97a9d0" style="background: #97a9d0;"></div>
  <div title="#8d85be" style="background: #8d85be;"></div>
  <div title="#8a5daa" style="background: #8a5daa;"></div>
  <div title="#853393" style="background: #853393;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#b2cae1" style="background: #b2cae1;"></div>
  <div title="#9cb3d5" style="background: #9cb3d5;"></div>
  <div title="#9095c6" style="background: #9095c6;"></div>
  <div title="#8c74b5" style="background: #8c74b5;"></div>
  <div title="#8a51a4" style="background: #8a51a4;"></div>
  <div title="#842d8f" style="background: #842d8f;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#b6cde2" style="background: #b6cde2;"></div>
  <div title="#a1b9d9" style="background: #a1b9d9;"></div>
  <div title="#93a1cc" style="background: #93a1cc;"></div>
  <div title="#8d85be" style="background: #8d85be;"></div>
  <div title="#8b67af" style="background: #8b67af;"></div>
  <div title="#8949a0" style="background: #8949a0;"></div>
  <div title="#83298c" style="background: #83298c;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#b8cee3" style="background: #b8cee3;"></div>
  <div title="#a5bedb" style="background: #a5bedb;"></div>
  <div title="#97a9d0" style="background: #97a9d0;"></div>
  <div title="#8f92c4" style="background: #8f92c4;"></div>
  <div title="#8c78b7" style="background: #8c78b7;"></div>
  <div title="#8a5daa" style="background: #8a5daa;"></div>
  <div title="#88429c" style="background: #88429c;"></div>
  <div title="#832589" style="background: #832589;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#bad0e4" style="background: #bad0e4;"></div>
  <div title="#a8c2dd" style="background: #a8c2dd;"></div>
  <div title="#9ab0d4" style="background: #9ab0d4;"></div>
  <div title="#919cc9" style="background: #919cc9;"></div>
  <div title="#8d85be" style="background: #8d85be;"></div>
  <div title="#8b6db2" style="background: #8b6db2;"></div>
  <div title="#8a55a6" style="background: #8a55a6;"></div>
  <div title="#873c99" style="background: #873c99;"></div>
  <div title="#822287" style="background: #822287;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="goldgreen" href="#goldgreen">#</a> <strong>goldgreen</strong> {% include tag ver="5.0" %} <a class="toggle" href='javascript:toggle("#discrete-goldgreen")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-goldgreen">
      <stop offset="0%" stop-color="#f4d166"></stop>
      <stop offset="10%" stop-color="#d5ca60"></stop>
      <stop offset="20%" stop-color="#b6c35c"></stop>
      <stop offset="30%" stop-color="#98bb59"></stop>
      <stop offset="40%" stop-color="#7cb257"></stop>
      <stop offset="50%" stop-color="#60a656"></stop>
      <stop offset="60%" stop-color="#4b9c53"></stop>
      <stop offset="70%" stop-color="#3f8f4f"></stop>
      <stop offset="80%" stop-color="#33834a"></stop>
      <stop offset="90%" stop-color="#257740"></stop>
      <stop offset="100%" stop-color="#146c36"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-goldgreen)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-goldgreen" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#60a656" style="background: #60a656;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#8fb858" style="background: #8fb858;"></div>
  <div title="#439350" style="background: #439350;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#a7bf5b" style="background: #a7bf5b;"></div>
  <div title="#60a656" style="background: #60a656;"></div>
  <div title="#39894d" style="background: #39894d;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#b6c35c" style="background: #b6c35c;"></div>
  <div title="#7cb257" style="background: #7cb257;"></div>
  <div title="#4b9c53" style="background: #4b9c53;"></div>
  <div title="#33834a" style="background: #33834a;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#c0c55d" style="background: #c0c55d;"></div>
  <div title="#8fb858" style="background: #8fb858;"></div>
  <div title="#60a656" style="background: #60a656;"></div>
  <div title="#439350" style="background: #439350;"></div>
  <div title="#2e7f47" style="background: #2e7f47;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#c8c75e" style="background: #c8c75e;"></div>
  <div title="#9cbc59" style="background: #9cbc59;"></div>
  <div title="#74af57" style="background: #74af57;"></div>
  <div title="#519f54" style="background: #519f54;"></div>
  <div title="#3d8d4e" style="background: #3d8d4e;"></div>
  <div title="#2b7c44" style="background: #2b7c44;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#cdc85f" style="background: #cdc85f;"></div>
  <div title="#a7bf5b" style="background: #a7bf5b;"></div>
  <div title="#83b458" style="background: #83b458;"></div>
  <div title="#60a656" style="background: #60a656;"></div>
  <div title="#489952" style="background: #489952;"></div>
  <div title="#39894d" style="background: #39894d;"></div>
  <div title="#297a43" style="background: #297a43;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#d2c960" style="background: #d2c960;"></div>
  <div title="#afc15b" style="background: #afc15b;"></div>
  <div title="#8fb858" style="background: #8fb858;"></div>
  <div title="#70ad57" style="background: #70ad57;"></div>
  <div title="#54a054" style="background: #54a054;"></div>
  <div title="#439350" style="background: #439350;"></div>
  <div title="#36864b" style="background: #36864b;"></div>
  <div title="#277841" style="background: #277841;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#d5ca60" style="background: #d5ca60;"></div>
  <div title="#b6c35c" style="background: #b6c35c;"></div>
  <div title="#98bb59" style="background: #98bb59;"></div>
  <div title="#7cb257" style="background: #7cb257;"></div>
  <div title="#60a656" style="background: #60a656;"></div>
  <div title="#4b9c53" style="background: #4b9c53;"></div>
  <div title="#3f8f4f" style="background: #3f8f4f;"></div>
  <div title="#33834a" style="background: #33834a;"></div>
  <div title="#257740" style="background: #257740;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="goldorange" href="#goldorange">#</a> <strong>goldorange</strong> {% include tag ver="5.0" %} <a class="toggle" href='javascript:toggle("#discrete-goldorange")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-goldorange">
      <stop offset="0%" stop-color="#f4d166"></stop>
      <stop offset="10%" stop-color="#f8be5c"></stop>
      <stop offset="20%" stop-color="#f8aa4c"></stop>
      <stop offset="30%" stop-color="#f5983b"></stop>
      <stop offset="40%" stop-color="#f3852a"></stop>
      <stop offset="50%" stop-color="#ef701b"></stop>
      <stop offset="60%" stop-color="#e2621f"></stop>
      <stop offset="70%" stop-color="#d65322"></stop>
      <stop offset="80%" stop-color="#c54923"></stop>
      <stop offset="90%" stop-color="#b14223"></stop>
      <stop offset="100%" stop-color="#9e3a26"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-goldorange)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-goldorange" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#ef701b" style="background: #ef701b;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#f49235" style="background: #f49235;"></div>
  <div title="#da5821" style="background: #da5821;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#f7a144" style="background: #f7a144;"></div>
  <div title="#ef701b" style="background: #ef701b;"></div>
  <div title="#ce4e23" style="background: #ce4e23;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#f8aa4c" style="background: #f8aa4c;"></div>
  <div title="#f3852a" style="background: #f3852a;"></div>
  <div title="#e2621f" style="background: #e2621f;"></div>
  <div title="#c54923" style="background: #c54923;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#f8b151" style="background: #f8b151;"></div>
  <div title="#f49235" style="background: #f49235;"></div>
  <div title="#ef701b" style="background: #ef701b;"></div>
  <div title="#da5821" style="background: #da5821;"></div>
  <div title="#be4723" style="background: #be4723;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#f8b555" style="background: #f8b555;"></div>
  <div title="#f59b3d" style="background: #f59b3d;"></div>
  <div title="#f27f26" style="background: #f27f26;"></div>
  <div title="#e6661e" style="background: #e6661e;"></div>
  <div title="#d45222" style="background: #d45222;"></div>
  <div title="#ba4523" style="background: #ba4523;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#f8b958" style="background: #f8b958;"></div>
  <div title="#f7a144" style="background: #f7a144;"></div>
  <div title="#f48a2e" style="background: #f48a2e;"></div>
  <div title="#ef701b" style="background: #ef701b;"></div>
  <div title="#df5e20" style="background: #df5e20;"></div>
  <div title="#ce4e23" style="background: #ce4e23;"></div>
  <div title="#b64423" style="background: #b64423;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#f8bc5a" style="background: #f8bc5a;"></div>
  <div title="#f7a648" style="background: #f7a648;"></div>
  <div title="#f49235" style="background: #f49235;"></div>
  <div title="#f17c23" style="background: #f17c23;"></div>
  <div title="#e8681d" style="background: #e8681d;"></div>
  <div title="#da5821" style="background: #da5821;"></div>
  <div title="#c94b23" style="background: #c94b23;"></div>
  <div title="#b34323" style="background: #b34323;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#f8be5c" style="background: #f8be5c;"></div>
  <div title="#f8aa4c" style="background: #f8aa4c;"></div>
  <div title="#f5983b" style="background: #f5983b;"></div>
  <div title="#f3852a" style="background: #f3852a;"></div>
  <div title="#ef701b" style="background: #ef701b;"></div>
  <div title="#e2621f" style="background: #e2621f;"></div>
  <div title="#d65322" style="background: #d65322;"></div>
  <div title="#c54923" style="background: #c54923;"></div>
  <div title="#b14223" style="background: #b14223;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="goldred" href="#goldred">#</a> <strong>goldred</strong> {% include tag ver="5.0" %} <a class="toggle" href='javascript:toggle("#discrete-goldred")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-goldred">
      <stop offset="0%" stop-color="#f4d166"></stop>
      <stop offset="10%" stop-color="#f6be59"></stop>
      <stop offset="20%" stop-color="#f9aa51"></stop>
      <stop offset="30%" stop-color="#fc964e"></stop>
      <stop offset="40%" stop-color="#f6834b"></stop>
      <stop offset="50%" stop-color="#ee734a"></stop>
      <stop offset="60%" stop-color="#e56249"></stop>
      <stop offset="70%" stop-color="#db5247"></stop>
      <stop offset="80%" stop-color="#cf4244"></stop>
      <stop offset="90%" stop-color="#c43141"></stop>
      <stop offset="100%" stop-color="#b71d3e"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-goldred)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-goldred" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#ee734a" style="background: #ee734a;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#fa904d" style="background: #fa904d;"></div>
  <div title="#de5748" style="background: #de5748;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#fba050" style="background: #fba050;"></div>
  <div title="#ee734a" style="background: #ee734a;"></div>
  <div title="#d54a46" style="background: #d54a46;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#f9aa51" style="background: #f9aa51;"></div>
  <div title="#f6834b" style="background: #f6834b;"></div>
  <div title="#e56249" style="background: #e56249;"></div>
  <div title="#cf4244" style="background: #cf4244;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#f8b154" style="background: #f8b154;"></div>
  <div title="#fa904d" style="background: #fa904d;"></div>
  <div title="#ee734a" style="background: #ee734a;"></div>
  <div title="#de5748" style="background: #de5748;"></div>
  <div title="#cb3c43" style="background: #cb3c43;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#f7b556" style="background: #f7b556;"></div>
  <div title="#fc994e" style="background: #fc994e;"></div>
  <div title="#f47e4b" style="background: #f47e4b;"></div>
  <div title="#e86749" style="background: #e86749;"></div>
  <div title="#d95047" style="background: #d95047;"></div>
  <div title="#c93842" style="background: #c93842;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#f7b957" style="background: #f7b957;"></div>
  <div title="#fba050" style="background: #fba050;"></div>
  <div title="#f8884c" style="background: #f8884c;"></div>
  <div title="#ee734a" style="background: #ee734a;"></div>
  <div title="#e35e49" style="background: #e35e49;"></div>
  <div title="#d54a46" style="background: #d54a46;"></div>
  <div title="#c73542" style="background: #c73542;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#f6bc58" style="background: #f6bc58;"></div>
  <div title="#faa650" style="background: #faa650;"></div>
  <div title="#fa904d" style="background: #fa904d;"></div>
  <div title="#f27c4b" style="background: #f27c4b;"></div>
  <div title="#e96a49" style="background: #e96a49;"></div>
  <div title="#de5748" style="background: #de5748;"></div>
  <div title="#d24645" style="background: #d24645;"></div>
  <div title="#c53341" style="background: #c53341;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#f6be59" style="background: #f6be59;"></div>
  <div title="#f9aa51" style="background: #f9aa51;"></div>
  <div title="#fc964e" style="background: #fc964e;"></div>
  <div title="#f6834b" style="background: #f6834b;"></div>
  <div title="#ee734a" style="background: #ee734a;"></div>
  <div title="#e56249" style="background: #e56249;"></div>
  <div title="#db5247" style="background: #db5247;"></div>
  <div title="#cf4244" style="background: #cf4244;"></div>
  <div title="#c43141" style="background: #c43141;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="greenblue" href="#greenblue">#</a> <strong>greenblue</strong> <a class="toggle" href='javascript:toggle("#discrete-greenblue")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-greenblue">
      <stop offset="0%" stop-color="#d3eece"></stop>
      <stop offset="10%" stop-color="#c5e8c3"></stop>
      <stop offset="20%" stop-color="#b1e1bb"></stop>
      <stop offset="30%" stop-color="#9bd8bb"></stop>
      <stop offset="40%" stop-color="#82cec2"></stop>
      <stop offset="50%" stop-color="#69c2ca"></stop>
      <stop offset="60%" stop-color="#51b2cd"></stop>
      <stop offset="70%" stop-color="#3c9fc7"></stop>
      <stop offset="80%" stop-color="#288abd"></stop>
      <stop offset="90%" stop-color="#1675b1"></stop>
      <stop offset="100%" stop-color="#0b60a1"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-greenblue)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-greenblue" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#69c2ca" style="background: #69c2ca;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#93d5bd" style="background: #93d5bd;"></div>
  <div title="#43a5c9" style="background: #43a5c9;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#a6ddbb" style="background: #a6ddbb;"></div>
  <div title="#69c2ca" style="background: #69c2ca;"></div>
  <div title="#3295c2" style="background: #3295c2;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#b1e1bb" style="background: #b1e1bb;"></div>
  <div title="#82cec2" style="background: #82cec2;"></div>
  <div title="#51b2cd" style="background: #51b2cd;"></div>
  <div title="#288abd" style="background: #288abd;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#b8e3be" style="background: #b8e3be;"></div>
  <div title="#93d5bd" style="background: #93d5bd;"></div>
  <div title="#69c2ca" style="background: #69c2ca;"></div>
  <div title="#43a5c9" style="background: #43a5c9;"></div>
  <div title="#2283b9" style="background: #2283b9;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#bce5c0" style="background: #bce5c0;"></div>
  <div title="#9ed9bb" style="background: #9ed9bb;"></div>
  <div title="#7bcbc4" style="background: #7bcbc4;"></div>
  <div title="#58b7cc" style="background: #58b7cc;"></div>
  <div title="#399cc6" style="background: #399cc6;"></div>
  <div title="#1e7eb6" style="background: #1e7eb6;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#c0e6c1" style="background: #c0e6c1;"></div>
  <div title="#a6ddbb" style="background: #a6ddbb;"></div>
  <div title="#88d1c0" style="background: #88d1c0;"></div>
  <div title="#69c2ca" style="background: #69c2ca;"></div>
  <div title="#4cadcc" style="background: #4cadcc;"></div>
  <div title="#3295c2" style="background: #3295c2;"></div>
  <div title="#1b7ab4" style="background: #1b7ab4;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#c3e7c2" style="background: #c3e7c2;"></div>
  <div title="#acdfbb" style="background: #acdfbb;"></div>
  <div title="#93d5bd" style="background: #93d5bd;"></div>
  <div title="#77c9c6" style="background: #77c9c6;"></div>
  <div title="#5cb9cc" style="background: #5cb9cc;"></div>
  <div title="#43a5c9" style="background: #43a5c9;"></div>
  <div title="#2c8fbf" style="background: #2c8fbf;"></div>
  <div title="#1877b2" style="background: #1877b2;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#c5e8c3" style="background: #c5e8c3;"></div>
  <div title="#b1e1bb" style="background: #b1e1bb;"></div>
  <div title="#9bd8bb" style="background: #9bd8bb;"></div>
  <div title="#82cec2" style="background: #82cec2;"></div>
  <div title="#69c2ca" style="background: #69c2ca;"></div>
  <div title="#51b2cd" style="background: #51b2cd;"></div>
  <div title="#3c9fc7" style="background: #3c9fc7;"></div>
  <div title="#288abd" style="background: #288abd;"></div>
  <div title="#1675b1" style="background: #1675b1;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="orangered" href="#orangered">#</a> <strong>orangered</strong> <a class="toggle" href='javascript:toggle("#discrete-orangered")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-orangered">
      <stop offset="0%" stop-color="#fddcaf"></stop>
      <stop offset="10%" stop-color="#fdcf9b"></stop>
      <stop offset="20%" stop-color="#fdc18a"></stop>
      <stop offset="30%" stop-color="#fdad77"></stop>
      <stop offset="40%" stop-color="#fb9562"></stop>
      <stop offset="50%" stop-color="#f67d53"></stop>
      <stop offset="60%" stop-color="#ee6545"></stop>
      <stop offset="70%" stop-color="#e24932"></stop>
      <stop offset="80%" stop-color="#d32d1e"></stop>
      <stop offset="90%" stop-color="#bf130d"></stop>
      <stop offset="100%" stop-color="#a70403"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-orangered)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-orangered" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#f67d53" style="background: #f67d53;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#fca570" style="background: #fca570;"></div>
  <div title="#e65238" style="background: #e65238;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#fdb781" style="background: #fdb781;"></div>
  <div title="#f67d53" style="background: #f67d53;"></div>
  <div title="#db3b28" style="background: #db3b28;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#fdc18a" style="background: #fdc18a;"></div>
  <div title="#fb9562" style="background: #fb9562;"></div>
  <div title="#ee6545" style="background: #ee6545;"></div>
  <div title="#d32d1e" style="background: #d32d1e;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#fdc690" style="background: #fdc690;"></div>
  <div title="#fca570" style="background: #fca570;"></div>
  <div title="#f67d53" style="background: #f67d53;"></div>
  <div title="#e65238" style="background: #e65238;"></div>
  <div title="#cc2418" style="background: #cc2418;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#fdc994" style="background: #fdc994;"></div>
  <div title="#fdb07a" style="background: #fdb07a;"></div>
  <div title="#fa8e5e" style="background: #fa8e5e;"></div>
  <div title="#f06c49" style="background: #f06c49;"></div>
  <div title="#e0452f" style="background: #e0452f;"></div>
  <div title="#c81e14" style="background: #c81e14;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#fdcc97" style="background: #fdcc97;"></div>
  <div title="#fdb781" style="background: #fdb781;"></div>
  <div title="#fc9b67" style="background: #fc9b67;"></div>
  <div title="#f67d53" style="background: #f67d53;"></div>
  <div title="#eb5e40" style="background: #eb5e40;"></div>
  <div title="#db3b28" style="background: #db3b28;"></div>
  <div title="#c41a11" style="background: #c41a11;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#fdcd99" style="background: #fdcd99;"></div>
  <div title="#fdbd86" style="background: #fdbd86;"></div>
  <div title="#fca570" style="background: #fca570;"></div>
  <div title="#f98a5b" style="background: #f98a5b;"></div>
  <div title="#f2704b" style="background: #f2704b;"></div>
  <div title="#e65238" style="background: #e65238;"></div>
  <div title="#d63322" style="background: #d63322;"></div>
  <div title="#c1160f" style="background: #c1160f;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#fdcf9b" style="background: #fdcf9b;"></div>
  <div title="#fdc18a" style="background: #fdc18a;"></div>
  <div title="#fdad77" style="background: #fdad77;"></div>
  <div title="#fb9562" style="background: #fb9562;"></div>
  <div title="#f67d53" style="background: #f67d53;"></div>
  <div title="#ee6545" style="background: #ee6545;"></div>
  <div title="#e24932" style="background: #e24932;"></div>
  <div title="#d32d1e" style="background: #d32d1e;"></div>
  <div title="#bf130d" style="background: #bf130d;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="purplebluegreen" href="#purplebluegreen">#</a> <strong>purplebluegreen</strong> <a class="toggle" href='javascript:toggle("#discrete-purplebluegreen")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-purplebluegreen">
      <stop offset="0%" stop-color="#dbd8ea"></stop>
      <stop offset="10%" stop-color="#c8cee4"></stop>
      <stop offset="20%" stop-color="#b0c3de"></stop>
      <stop offset="30%" stop-color="#93b7d8"></stop>
      <stop offset="40%" stop-color="#72acd1"></stop>
      <stop offset="50%" stop-color="#549fc8"></stop>
      <stop offset="60%" stop-color="#3892bb"></stop>
      <stop offset="70%" stop-color="#1c88a3"></stop>
      <stop offset="80%" stop-color="#097f87"></stop>
      <stop offset="90%" stop-color="#02736b"></stop>
      <stop offset="100%" stop-color="#016353"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-purplebluegreen)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-purplebluegreen" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#549fc8" style="background: #549fc8;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#88b3d6" style="background: #88b3d6;"></div>
  <div title="#258bab" style="background: #258bab;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#a2bddb" style="background: #a2bddb;"></div>
  <div title="#549fc8" style="background: #549fc8;"></div>
  <div title="#138495" style="background: #138495;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#b0c3de" style="background: #b0c3de;"></div>
  <div title="#72acd1" style="background: #72acd1;"></div>
  <div title="#3892bb" style="background: #3892bb;"></div>
  <div title="#097f87" style="background: #097f87;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#b8c7e0" style="background: #b8c7e0;"></div>
  <div title="#88b3d6" style="background: #88b3d6;"></div>
  <div title="#549fc8" style="background: #549fc8;"></div>
  <div title="#258bab" style="background: #258bab;"></div>
  <div title="#077b7e" style="background: #077b7e;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#bec9e1" style="background: #bec9e1;"></div>
  <div title="#97b9d9" style="background: #97b9d9;"></div>
  <div title="#69a8ce" style="background: #69a8ce;"></div>
  <div title="#4096bf" style="background: #4096bf;"></div>
  <div title="#19879f" style="background: #19879f;"></div>
  <div title="#057877" style="background: #057877;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#c2cbe3" style="background: #c2cbe3;"></div>
  <div title="#a2bddb" style="background: #a2bddb;"></div>
  <div title="#7aafd3" style="background: #7aafd3;"></div>
  <div title="#549fc8" style="background: #549fc8;"></div>
  <div title="#3190b5" style="background: #3190b5;"></div>
  <div title="#138495" style="background: #138495;"></div>
  <div title="#047672" style="background: #047672;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#c5cde3" style="background: #c5cde3;"></div>
  <div title="#aac0dd" style="background: #aac0dd;"></div>
  <div title="#88b3d6" style="background: #88b3d6;"></div>
  <div title="#65a6cd" style="background: #65a6cd;"></div>
  <div title="#4498c1" style="background: #4498c1;"></div>
  <div title="#258bab" style="background: #258bab;"></div>
  <div title="#0d818d" style="background: #0d818d;"></div>
  <div title="#03746e" style="background: #03746e;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#c8cee4" style="background: #c8cee4;"></div>
  <div title="#b0c3de" style="background: #b0c3de;"></div>
  <div title="#93b7d8" style="background: #93b7d8;"></div>
  <div title="#72acd1" style="background: #72acd1;"></div>
  <div title="#549fc8" style="background: #549fc8;"></div>
  <div title="#3892bb" style="background: #3892bb;"></div>
  <div title="#1c88a3" style="background: #1c88a3;"></div>
  <div title="#097f87" style="background: #097f87;"></div>
  <div title="#02736b" style="background: #02736b;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="purpleblue" href="#purpleblue">#</a> <strong>purpleblue</strong> <a class="toggle" href='javascript:toggle("#discrete-purpleblue")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-purpleblue">
      <stop offset="0%" stop-color="#dbdaeb"></stop>
      <stop offset="10%" stop-color="#c8cee4"></stop>
      <stop offset="20%" stop-color="#b1c3de"></stop>
      <stop offset="30%" stop-color="#97b7d8"></stop>
      <stop offset="40%" stop-color="#7bacd1"></stop>
      <stop offset="50%" stop-color="#5b9fc9"></stop>
      <stop offset="60%" stop-color="#3a90c0"></stop>
      <stop offset="70%" stop-color="#1e7fb7"></stop>
      <stop offset="80%" stop-color="#0b70ab"></stop>
      <stop offset="90%" stop-color="#056199"></stop>
      <stop offset="100%" stop-color="#045281"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-purpleblue)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-purpleblue" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#5b9fc9" style="background: #5b9fc9;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#8eb3d6" style="background: #8eb3d6;"></div>
  <div title="#2785ba" style="background: #2785ba;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#a4bddb" style="background: #a4bddb;"></div>
  <div title="#5b9fc9" style="background: #5b9fc9;"></div>
  <div title="#1578b1" style="background: #1578b1;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#b1c3de" style="background: #b1c3de;"></div>
  <div title="#7bacd1" style="background: #7bacd1;"></div>
  <div title="#3a90c0" style="background: #3a90c0;"></div>
  <div title="#0b70ab" style="background: #0b70ab;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#b9c7e0" style="background: #b9c7e0;"></div>
  <div title="#8eb3d6" style="background: #8eb3d6;"></div>
  <div title="#5b9fc9" style="background: #5b9fc9;"></div>
  <div title="#2785ba" style="background: #2785ba;"></div>
  <div title="#096ba5" style="background: #096ba5;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#bec9e1" style="background: #bec9e1;"></div>
  <div title="#9bb9d9" style="background: #9bb9d9;"></div>
  <div title="#72a8cf" style="background: #72a8cf;"></div>
  <div title="#4394c3" style="background: #4394c3;"></div>
  <div title="#1b7db5" style="background: #1b7db5;"></div>
  <div title="#0867a1" style="background: #0867a1;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#c2cbe3" style="background: #c2cbe3;"></div>
  <div title="#a4bddb" style="background: #a4bddb;"></div>
  <div title="#82afd3" style="background: #82afd3;"></div>
  <div title="#5b9fc9" style="background: #5b9fc9;"></div>
  <div title="#338cbe" style="background: #338cbe;"></div>
  <div title="#1578b1" style="background: #1578b1;"></div>
  <div title="#07659e" style="background: #07659e;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#c5cde3" style="background: #c5cde3;"></div>
  <div title="#abc0dd" style="background: #abc0dd;"></div>
  <div title="#8eb3d6" style="background: #8eb3d6;"></div>
  <div title="#6da6cd" style="background: #6da6cd;"></div>
  <div title="#4997c4" style="background: #4997c4;"></div>
  <div title="#2785ba" style="background: #2785ba;"></div>
  <div title="#0f73ae" style="background: #0f73ae;"></div>
  <div title="#06639b" style="background: #06639b;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#c8cee4" style="background: #c8cee4;"></div>
  <div title="#b1c3de" style="background: #b1c3de;"></div>
  <div title="#97b7d8" style="background: #97b7d8;"></div>
  <div title="#7bacd1" style="background: #7bacd1;"></div>
  <div title="#5b9fc9" style="background: #5b9fc9;"></div>
  <div title="#3a90c0" style="background: #3a90c0;"></div>
  <div title="#1e7fb7" style="background: #1e7fb7;"></div>
  <div title="#0b70ab" style="background: #0b70ab;"></div>
  <div title="#056199" style="background: #056199;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="purplered" href="#purplered">#</a> <strong>purplered</strong> <a class="toggle" href='javascript:toggle("#discrete-purplered")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-purplered">
      <stop offset="0%" stop-color="#dcc9e2"></stop>
      <stop offset="10%" stop-color="#d3b3d7"></stop>
      <stop offset="20%" stop-color="#ce9ecc"></stop>
      <stop offset="30%" stop-color="#d186c0"></stop>
      <stop offset="40%" stop-color="#da6bb2"></stop>
      <stop offset="50%" stop-color="#e14da0"></stop>
      <stop offset="60%" stop-color="#e23189"></stop>
      <stop offset="70%" stop-color="#d91e6f"></stop>
      <stop offset="80%" stop-color="#c61159"></stop>
      <stop offset="90%" stop-color="#ab0749"></stop>
      <stop offset="100%" stop-color="#8f023a"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-purplered)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-purplered" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#e14da0" style="background: #e14da0;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#d47dbb" style="background: #d47dbb;"></div>
  <div title="#dc2478" style="background: #dc2478;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#d092c6" style="background: #d092c6;"></div>
  <div title="#e14da0" style="background: #e14da0;"></div>
  <div title="#d01864" style="background: #d01864;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#ce9ecc" style="background: #ce9ecc;"></div>
  <div title="#da6bb2" style="background: #da6bb2;"></div>
  <div title="#e23189" style="background: #e23189;"></div>
  <div title="#c61159" style="background: #c61159;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#d0a5d0" style="background: #d0a5d0;"></div>
  <div title="#d47dbb" style="background: #d47dbb;"></div>
  <div title="#e14da0" style="background: #e14da0;"></div>
  <div title="#dc2478" style="background: #dc2478;"></div>
  <div title="#bd0e54" style="background: #bd0e54;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#d1aad2" style="background: #d1aad2;"></div>
  <div title="#d189c2" style="background: #d189c2;"></div>
  <div title="#dc62ad" style="background: #dc62ad;"></div>
  <div title="#e23990" style="background: #e23990;"></div>
  <div title="#d61c6c" style="background: #d61c6c;"></div>
  <div title="#b70b50" style="background: #b70b50;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#d2aed4" style="background: #d2aed4;"></div>
  <div title="#d092c6" style="background: #d092c6;"></div>
  <div title="#d872b6" style="background: #d872b6;"></div>
  <div title="#e14da0" style="background: #e14da0;"></div>
  <div title="#e02c83" style="background: #e02c83;"></div>
  <div title="#d01864" style="background: #d01864;"></div>
  <div title="#b20a4d" style="background: #b20a4d;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#d2b1d6" style="background: #d2b1d6;"></div>
  <div title="#cf99c9" style="background: #cf99c9;"></div>
  <div title="#d47dbb" style="background: #d47dbb;"></div>
  <div title="#dd5eaa" style="background: #dd5eaa;"></div>
  <div title="#e23d93" style="background: #e23d93;"></div>
  <div title="#dc2478" style="background: #dc2478;"></div>
  <div title="#ca145e" style="background: #ca145e;"></div>
  <div title="#ae084b" style="background: #ae084b;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#d3b3d7" style="background: #d3b3d7;"></div>
  <div title="#ce9ecc" style="background: #ce9ecc;"></div>
  <div title="#d186c0" style="background: #d186c0;"></div>
  <div title="#da6bb2" style="background: #da6bb2;"></div>
  <div title="#e14da0" style="background: #e14da0;"></div>
  <div title="#e23189" style="background: #e23189;"></div>
  <div title="#d91e6f" style="background: #d91e6f;"></div>
  <div title="#c61159" style="background: #c61159;"></div>
  <div title="#ab0749" style="background: #ab0749;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="redpurple" href="#redpurple">#</a> <strong>redpurple</strong> <a class="toggle" href='javascript:toggle("#discrete-redpurple")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-redpurple">
      <stop offset="0%" stop-color="#fccfcc"></stop>
      <stop offset="10%" stop-color="#fcbec0"></stop>
      <stop offset="20%" stop-color="#faa9b8"></stop>
      <stop offset="30%" stop-color="#f98faf"></stop>
      <stop offset="40%" stop-color="#f571a5"></stop>
      <stop offset="50%" stop-color="#ec539d"></stop>
      <stop offset="60%" stop-color="#db3695"></stop>
      <stop offset="70%" stop-color="#c41b8a"></stop>
      <stop offset="80%" stop-color="#a90880"></stop>
      <stop offset="90%" stop-color="#8d0179"></stop>
      <stop offset="100%" stop-color="#700174"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-redpurple)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-redpurple" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#ec539d" style="background: #ec539d;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#f885ac" style="background: #f885ac;"></div>
  <div title="#cc248e" style="background: #cc248e;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#fa9cb4" style="background: #fa9cb4;"></div>
  <div title="#ec539d" style="background: #ec539d;"></div>
  <div title="#b71285" style="background: #b71285;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#faa9b8" style="background: #faa9b8;"></div>
  <div title="#f571a5" style="background: #f571a5;"></div>
  <div title="#db3695" style="background: #db3695;"></div>
  <div title="#a90880" style="background: #a90880;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#fbb0bb" style="background: #fbb0bb;"></div>
  <div title="#f885ac" style="background: #f885ac;"></div>
  <div title="#ec539d" style="background: #ec539d;"></div>
  <div title="#cc248e" style="background: #cc248e;"></div>
  <div title="#a0067e" style="background: #a0067e;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#fbb5bd" style="background: #fbb5bd;"></div>
  <div title="#f993b0" style="background: #f993b0;"></div>
  <div title="#f268a3" style="background: #f268a3;"></div>
  <div title="#e03e97" style="background: #e03e97;"></div>
  <div title="#c01889" style="background: #c01889;"></div>
  <div title="#99047c" style="background: #99047c;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#fcb9be" style="background: #fcb9be;"></div>
  <div title="#fa9cb4" style="background: #fa9cb4;"></div>
  <div title="#f679a8" style="background: #f679a8;"></div>
  <div title="#ec539d" style="background: #ec539d;"></div>
  <div title="#d52f92" style="background: #d52f92;"></div>
  <div title="#b71285" style="background: #b71285;"></div>
  <div title="#94037b" style="background: #94037b;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#fcbcbf" style="background: #fcbcbf;"></div>
  <div title="#faa3b6" style="background: #faa3b6;"></div>
  <div title="#f885ac" style="background: #f885ac;"></div>
  <div title="#f164a1" style="background: #f164a1;"></div>
  <div title="#e34399" style="background: #e34399;"></div>
  <div title="#cc248e" style="background: #cc248e;"></div>
  <div title="#af0c82" style="background: #af0c82;"></div>
  <div title="#90027a" style="background: #90027a;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#fcbec0" style="background: #fcbec0;"></div>
  <div title="#faa9b8" style="background: #faa9b8;"></div>
  <div title="#f98faf" style="background: #f98faf;"></div>
  <div title="#f571a5" style="background: #f571a5;"></div>
  <div title="#ec539d" style="background: #ec539d;"></div>
  <div title="#db3695" style="background: #db3695;"></div>
  <div title="#c41b8a" style="background: #c41b8a;"></div>
  <div title="#a90880" style="background: #a90880;"></div>
  <div title="#8d0179" style="background: #8d0179;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="yellowgreenblue" href="#yellowgreenblue">#</a> <strong>yellowgreenblue</strong> <a class="toggle" href='javascript:toggle("#discrete-yellowgreenblue")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-yellowgreenblue">
      <stop offset="0%" stop-color="#eff9bd"></stop>
      <stop offset="10%" stop-color="#dbf1b4"></stop>
      <stop offset="20%" stop-color="#bde5b5"></stop>
      <stop offset="30%" stop-color="#94d5b9"></stop>
      <stop offset="40%" stop-color="#69c5be"></stop>
      <stop offset="50%" stop-color="#45b4c2"></stop>
      <stop offset="60%" stop-color="#2c9ec0"></stop>
      <stop offset="70%" stop-color="#2182b8"></stop>
      <stop offset="80%" stop-color="#2163aa"></stop>
      <stop offset="90%" stop-color="#23479c"></stop>
      <stop offset="100%" stop-color="#1c3185"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-yellowgreenblue)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-yellowgreenblue" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#45b4c2" style="background: #45b4c2;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#86d0bb" style="background: #86d0bb;"></div>
  <div title="#258bbb" style="background: #258bbb;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#a9ddb7" style="background: #a9ddb7;"></div>
  <div title="#45b4c2" style="background: #45b4c2;"></div>
  <div title="#2173b1" style="background: #2173b1;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#bde5b5" style="background: #bde5b5;"></div>
  <div title="#69c5be" style="background: #69c5be;"></div>
  <div title="#2c9ec0" style="background: #2c9ec0;"></div>
  <div title="#2163aa" style="background: #2163aa;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#c7e9b5" style="background: #c7e9b5;"></div>
  <div title="#86d0bb" style="background: #86d0bb;"></div>
  <div title="#45b4c2" style="background: #45b4c2;"></div>
  <div title="#258bbb" style="background: #258bbb;"></div>
  <div title="#225aa5" style="background: #225aa5;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#ceecb4" style="background: #ceecb4;"></div>
  <div title="#9ad7b8" style="background: #9ad7b8;"></div>
  <div title="#5fc0bf" style="background: #5fc0bf;"></div>
  <div title="#33a4c1" style="background: #33a4c1;"></div>
  <div title="#217eb6" style="background: #217eb6;"></div>
  <div title="#2253a2" style="background: #2253a2;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#d4eeb4" style="background: #d4eeb4;"></div>
  <div title="#a9ddb7" style="background: #a9ddb7;"></div>
  <div title="#74c9bd" style="background: #74c9bd;"></div>
  <div title="#45b4c2" style="background: #45b4c2;"></div>
  <div title="#2997be" style="background: #2997be;"></div>
  <div title="#2173b1" style="background: #2173b1;"></div>
  <div title="#234ea0" style="background: #234ea0;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#d8f0b4" style="background: #d8f0b4;"></div>
  <div title="#b4e1b6" style="background: #b4e1b6;"></div>
  <div title="#86d0bb" style="background: #86d0bb;"></div>
  <div title="#59bdc0" style="background: #59bdc0;"></div>
  <div title="#37a8c1" style="background: #37a8c1;"></div>
  <div title="#258bbb" style="background: #258bbb;"></div>
  <div title="#216aad" style="background: #216aad;"></div>
  <div title="#234a9e" style="background: #234a9e;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#dbf1b4" style="background: #dbf1b4;"></div>
  <div title="#bde5b5" style="background: #bde5b5;"></div>
  <div title="#94d5b9" style="background: #94d5b9;"></div>
  <div title="#69c5be" style="background: #69c5be;"></div>
  <div title="#45b4c2" style="background: #45b4c2;"></div>
  <div title="#2c9ec0" style="background: #2c9ec0;"></div>
  <div title="#2182b8" style="background: #2182b8;"></div>
  <div title="#2163aa" style="background: #2163aa;"></div>
  <div title="#23479c" style="background: #23479c;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="yellowgreen" href="#yellowgreen">#</a> <strong>yellowgreen</strong> <a class="toggle" href='javascript:toggle("#discrete-yellowgreen")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-yellowgreen">
      <stop offset="0%" stop-color="#e4f4ac"></stop>
      <stop offset="10%" stop-color="#d1eca0"></stop>
      <stop offset="20%" stop-color="#b9e294"></stop>
      <stop offset="30%" stop-color="#9ed688"></stop>
      <stop offset="40%" stop-color="#80c97c"></stop>
      <stop offset="50%" stop-color="#62bb6e"></stop>
      <stop offset="60%" stop-color="#47aa5e"></stop>
      <stop offset="70%" stop-color="#329750"></stop>
      <stop offset="80%" stop-color="#208344"></stop>
      <stop offset="90%" stop-color="#0e723b"></stop>
      <stop offset="100%" stop-color="#036034"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-yellowgreen)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-yellowgreen" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#62bb6e" style="background: #62bb6e;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#94d284" style="background: #94d284;"></div>
  <div title="#399d55" style="background: #399d55;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#acdc8e" style="background: #acdc8e;"></div>
  <div title="#62bb6e" style="background: #62bb6e;"></div>
  <div title="#298d4a" style="background: #298d4a;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#b9e294" style="background: #b9e294;"></div>
  <div title="#80c97c" style="background: #80c97c;"></div>
  <div title="#47aa5e" style="background: #47aa5e;"></div>
  <div title="#208344" style="background: #208344;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#c1e598" style="background: #c1e598;"></div>
  <div title="#94d284" style="background: #94d284;"></div>
  <div title="#62bb6e" style="background: #62bb6e;"></div>
  <div title="#399d55" style="background: #399d55;"></div>
  <div title="#1a7d41" style="background: #1a7d41;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#c7e89b" style="background: #c7e89b;"></div>
  <div title="#a2d88a" style="background: #a2d88a;"></div>
  <div title="#77c578" style="background: #77c578;"></div>
  <div title="#4faf63" style="background: #4faf63;"></div>
  <div title="#2f944e" style="background: #2f944e;"></div>
  <div title="#16793f" style="background: #16793f;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#cbea9d" style="background: #cbea9d;"></div>
  <div title="#acdc8e" style="background: #acdc8e;"></div>
  <div title="#88cc7f" style="background: #88cc7f;"></div>
  <div title="#62bb6e" style="background: #62bb6e;"></div>
  <div title="#42a55b" style="background: #42a55b;"></div>
  <div title="#298d4a" style="background: #298d4a;"></div>
  <div title="#13763d" style="background: #13763d;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#ceeb9f" style="background: #ceeb9f;"></div>
  <div title="#b3df91" style="background: #b3df91;"></div>
  <div title="#94d284" style="background: #94d284;"></div>
  <div title="#73c376" style="background: #73c376;"></div>
  <div title="#53b265" style="background: #53b265;"></div>
  <div title="#399d55" style="background: #399d55;"></div>
  <div title="#248747" style="background: #248747;"></div>
  <div title="#10743c" style="background: #10743c;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#d1eca0" style="background: #d1eca0;"></div>
  <div title="#b9e294" style="background: #b9e294;"></div>
  <div title="#9ed688" style="background: #9ed688;"></div>
  <div title="#80c97c" style="background: #80c97c;"></div>
  <div title="#62bb6e" style="background: #62bb6e;"></div>
  <div title="#47aa5e" style="background: #47aa5e;"></div>
  <div title="#329750" style="background: #329750;"></div>
  <div title="#208344" style="background: #208344;"></div>
  <div title="#0e723b" style="background: #0e723b;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="yelloworangebrown" href="#yelloworangebrown">#</a> <strong>yelloworangebrown</strong> <a class="toggle" href='javascript:toggle("#discrete-yelloworangebrown")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-yelloworangebrown">
      <stop offset="0%" stop-color="#feeaa1"></stop>
      <stop offset="10%" stop-color="#fedd84"></stop>
      <stop offset="20%" stop-color="#fecc63"></stop>
      <stop offset="30%" stop-color="#feb746"></stop>
      <stop offset="40%" stop-color="#fca031"></stop>
      <stop offset="50%" stop-color="#f68921"></stop>
      <stop offset="60%" stop-color="#eb7215"></stop>
      <stop offset="70%" stop-color="#db5e0b"></stop>
      <stop offset="80%" stop-color="#c54c05"></stop>
      <stop offset="90%" stop-color="#ab3d03"></stop>
      <stop offset="100%" stop-color="#8f3204"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-yelloworangebrown)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-yelloworangebrown" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#f68921" style="background: #f68921;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#fdaf3f" style="background: #fdaf3f;"></div>
  <div title="#e0650e" style="background: #e0650e;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#fec255" style="background: #fec255;"></div>
  <div title="#f68921" style="background: #f68921;"></div>
  <div title="#d05508" style="background: #d05508;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#fecc63" style="background: #fecc63;"></div>
  <div title="#fca031" style="background: #fca031;"></div>
  <div title="#eb7215" style="background: #eb7215;"></div>
  <div title="#c54c05" style="background: #c54c05;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#fed26e" style="background: #fed26e;"></div>
  <div title="#fdaf3f" style="background: #fdaf3f;"></div>
  <div title="#f68921" style="background: #f68921;"></div>
  <div title="#e0650e" style="background: #e0650e;"></div>
  <div title="#bc4704" style="background: #bc4704;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#fed676" style="background: #fed676;"></div>
  <div title="#feba4a" style="background: #feba4a;"></div>
  <div title="#fa992c" style="background: #fa992c;"></div>
  <div title="#ee7918" style="background: #ee7918;"></div>
  <div title="#d85b0a" style="background: #d85b0a;"></div>
  <div title="#b64304" style="background: #b64304;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#fed97c" style="background: #fed97c;"></div>
  <div title="#fec255" style="background: #fec255;"></div>
  <div title="#fda636" style="background: #fda636;"></div>
  <div title="#f68921" style="background: #f68921;"></div>
  <div title="#e76d13" style="background: #e76d13;"></div>
  <div title="#d05508" style="background: #d05508;"></div>
  <div title="#b24104" style="background: #b24104;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#fedb80" style="background: #fedb80;"></div>
  <div title="#fec75d" style="background: #fec75d;"></div>
  <div title="#fdaf3f" style="background: #fdaf3f;"></div>
  <div title="#f9962a" style="background: #f9962a;"></div>
  <div title="#f07c1a" style="background: #f07c1a;"></div>
  <div title="#e0650e" style="background: #e0650e;"></div>
  <div title="#ca5006" style="background: #ca5006;"></div>
  <div title="#ae3f03" style="background: #ae3f03;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#fedd84" style="background: #fedd84;"></div>
  <div title="#fecc63" style="background: #fecc63;"></div>
  <div title="#feb746" style="background: #feb746;"></div>
  <div title="#fca031" style="background: #fca031;"></div>
  <div title="#f68921" style="background: #f68921;"></div>
  <div title="#eb7215" style="background: #eb7215;"></div>
  <div title="#db5e0b" style="background: #db5e0b;"></div>
  <div title="#c54c05" style="background: #c54c05;"></div>
  <div title="#ab3d03" style="background: #ab3d03;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="yelloworangered" href="#yelloworangered">#</a> <strong>yelloworangered</strong> <a class="toggle" href='javascript:toggle("#discrete-yelloworangered")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-yelloworangered">
      <stop offset="0%" stop-color="#fee087"></stop>
      <stop offset="10%" stop-color="#fed16f"></stop>
      <stop offset="20%" stop-color="#febd59"></stop>
      <stop offset="30%" stop-color="#fea849"></stop>
      <stop offset="40%" stop-color="#fd903e"></stop>
      <stop offset="50%" stop-color="#fc7335"></stop>
      <stop offset="60%" stop-color="#f9522b"></stop>
      <stop offset="70%" stop-color="#ee3423"></stop>
      <stop offset="80%" stop-color="#de1b20"></stop>
      <stop offset="90%" stop-color="#ca0b22"></stop>
      <stop offset="100%" stop-color="#af0225"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-yelloworangered)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-yelloworangered" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#fc7335" style="background: #fc7335;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#fea045" style="background: #fea045;"></div>
  <div title="#f23e26" style="background: #f23e26;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#feb351" style="background: #feb351;"></div>
  <div title="#fc7335" style="background: #fc7335;"></div>
  <div title="#e62822" style="background: #e62822;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#febd59" style="background: #febd59;"></div>
  <div title="#fd903e" style="background: #fd903e;"></div>
  <div title="#f9522b" style="background: #f9522b;"></div>
  <div title="#de1b20" style="background: #de1b20;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#fec460" style="background: #fec460;"></div>
  <div title="#fea045" style="background: #fea045;"></div>
  <div title="#fc7335" style="background: #fc7335;"></div>
  <div title="#f23e26" style="background: #f23e26;"></div>
  <div title="#d71621" style="background: #d71621;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#fec866" style="background: #fec866;"></div>
  <div title="#feab4b" style="background: #feab4b;"></div>
  <div title="#fd883b" style="background: #fd883b;"></div>
  <div title="#fa5b2e" style="background: #fa5b2e;"></div>
  <div title="#ec3023" style="background: #ec3023;"></div>
  <div title="#d31221" style="background: #d31221;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#fecc6a" style="background: #fecc6a;"></div>
  <div title="#feb351" style="background: #feb351;"></div>
  <div title="#fd9641" style="background: #fd9641;"></div>
  <div title="#fc7335" style="background: #fc7335;"></div>
  <div title="#f64b29" style="background: #f64b29;"></div>
  <div title="#e62822" style="background: #e62822;"></div>
  <div title="#cf0f22" style="background: #cf0f22;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#fecf6d" style="background: #fecf6d;"></div>
  <div title="#feb855" style="background: #feb855;"></div>
  <div title="#fea045" style="background: #fea045;"></div>
  <div title="#fd833a" style="background: #fd833a;"></div>
  <div title="#fa612f" style="background: #fa612f;"></div>
  <div title="#f23e26" style="background: #f23e26;"></div>
  <div title="#e22121" style="background: #e22121;"></div>
  <div title="#cc0d22" style="background: #cc0d22;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#fed16f" style="background: #fed16f;"></div>
  <div title="#febd59" style="background: #febd59;"></div>
  <div title="#fea849" style="background: #fea849;"></div>
  <div title="#fd903e" style="background: #fd903e;"></div>
  <div title="#fc7335" style="background: #fc7335;"></div>
  <div title="#f9522b" style="background: #f9522b;"></div>
  <div title="#ee3423" style="background: #ee3423;"></div>
  <div title="#de1b20" style="background: #de1b20;"></div>
  <div title="#ca0b22" style="background: #ca0b22;"></div>
</div>
</div>
</div>

#### For Dark Backgrounds

<div class="scheme continuous">
<a name="darkblue" href="#darkblue">#</a> <strong>darkblue</strong> {% include tag ver="5.0" %} <a class="toggle" href='javascript:toggle("#discrete-darkblue")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-darkblue">
      <stop offset="0%" stop-color="#323232"></stop>
      <stop offset="10%" stop-color="#2e4463"></stop>
      <stop offset="20%" stop-color="#1e588a"></stop>
      <stop offset="30%" stop-color="#086da7"></stop>
      <stop offset="40%" stop-color="#0082b9"></stop>
      <stop offset="50%" stop-color="#039ac7"></stop>
      <stop offset="60%" stop-color="#12b1d4"></stop>
      <stop offset="70%" stop-color="#2bc8e2"></stop>
      <stop offset="80%" stop-color="#3ddff0"></stop>
      <stop offset="90%" stop-color="#61f4fb"></stop>
      <stop offset="100%" stop-color="#ffffff"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-darkblue)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-darkblue" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#039ac7" style="background: #039ac7;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#0074af" style="background: #0074af;"></div>
  <div title="#25c0dd" style="background: #25c0dd;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#14629a" style="background: #14629a;"></div>
  <div title="#039ac7" style="background: #039ac7;"></div>
  <div title="#33d4e9" style="background: #33d4e9;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#1e588a" style="background: #1e588a;"></div>
  <div title="#0082b9" style="background: #0082b9;"></div>
  <div title="#12b1d4" style="background: #12b1d4;"></div>
  <div title="#3ddff0" style="background: #3ddff0;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#24517e" style="background: #24517e;"></div>
  <div title="#0074af" style="background: #0074af;"></div>
  <div title="#039ac7" style="background: #039ac7;"></div>
  <div title="#25c0dd" style="background: #25c0dd;"></div>
  <div title="#44e7f4" style="background: #44e7f4;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#284c74" style="background: #284c74;"></div>
  <div title="#0b6aa3" style="background: #0b6aa3;"></div>
  <div title="#0089bd" style="background: #0089bd;"></div>
  <div title="#0aabd0" style="background: #0aabd0;"></div>
  <div title="#2dcbe4" style="background: #2dcbe4;"></div>
  <div title="#49ecf6" style="background: #49ecf6;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#2b496d" style="background: #2b496d;"></div>
  <div title="#14629a" style="background: #14629a;"></div>
  <div title="#007db5" style="background: #007db5;"></div>
  <div title="#039ac7" style="background: #039ac7;"></div>
  <div title="#19b7d7" style="background: #19b7d7;"></div>
  <div title="#33d4e9" style="background: #33d4e9;"></div>
  <div title="#4df0f8" style="background: #4df0f8;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#2d4668" style="background: #2d4668;"></div>
  <div title="#1a5c93" style="background: #1a5c93;"></div>
  <div title="#0074af" style="background: #0074af;"></div>
  <div title="#008cbf" style="background: #008cbf;"></div>
  <div title="#05a7ce" style="background: #05a7ce;"></div>
  <div title="#25c0dd" style="background: #25c0dd;"></div>
  <div title="#38daed" style="background: #38daed;"></div>
  <div title="#50f3fa" style="background: #50f3fa;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#2e4463" style="background: #2e4463;"></div>
  <div title="#1e588a" style="background: #1e588a;"></div>
  <div title="#086da7" style="background: #086da7;"></div>
  <div title="#0082b9" style="background: #0082b9;"></div>
  <div title="#039ac7" style="background: #039ac7;"></div>
  <div title="#12b1d4" style="background: #12b1d4;"></div>
  <div title="#2bc8e2" style="background: #2bc8e2;"></div>
  <div title="#3ddff0" style="background: #3ddff0;"></div>
  <div title="#61f4fb" style="background: #61f4fb;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="darkgold" href="#darkgold">#</a> <strong>darkgold</strong> {% include tag ver="5.0" %} <a class="toggle" href='javascript:toggle("#discrete-darkgold")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-darkgold">
      <stop offset="0%" stop-color="#3c3c3c"></stop>
      <stop offset="10%" stop-color="#554a38"></stop>
      <stop offset="20%" stop-color="#6d5a35"></stop>
      <stop offset="30%" stop-color="#846f32"></stop>
      <stop offset="40%" stop-color="#a0832d"></stop>
      <stop offset="50%" stop-color="#bf9828"></stop>
      <stop offset="60%" stop-color="#dbb022"></stop>
      <stop offset="70%" stop-color="#f0cb23"></stop>
      <stop offset="80%" stop-color="#fae241"></stop>
      <stop offset="90%" stop-color="#fff290"></stop>
      <stop offset="100%" stop-color="#ffffff"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-darkgold)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-darkgold" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#bf9828" style="background: #bf9828;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#8c7631" style="background: #8c7631;"></div>
  <div title="#ecc31e" style="background: #ecc31e;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#796433" style="background: #796433;"></div>
  <div title="#bf9828" style="background: #bf9828;"></div>
  <div title="#f6d72c" style="background: #f6d72c;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#6d5a35" style="background: #6d5a35;"></div>
  <div title="#a0832d" style="background: #a0832d;"></div>
  <div title="#dbb022" style="background: #dbb022;"></div>
  <div title="#fae241" style="background: #fae241;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#655536" style="background: #655536;"></div>
  <div title="#8c7631" style="background: #8c7631;"></div>
  <div title="#bf9828" style="background: #bf9828;"></div>
  <div title="#ecc31e" style="background: #ecc31e;"></div>
  <div title="#fce85a" style="background: #fce85a;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#5f5036" style="background: #5f5036;"></div>
  <div title="#816c32" style="background: #816c32;"></div>
  <div title="#a9882c" style="background: #a9882c;"></div>
  <div title="#d3a823" style="background: #d3a823;"></div>
  <div title="#f2cf26" style="background: #f2cf26;"></div>
  <div title="#fdec6c" style="background: #fdec6c;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#5b4d37" style="background: #5b4d37;"></div>
  <div title="#796433" style="background: #796433;"></div>
  <div title="#997e2f" style="background: #997e2f;"></div>
  <div title="#bf9828" style="background: #bf9828;"></div>
  <div title="#e1b720" style="background: #e1b720;"></div>
  <div title="#f6d72c" style="background: #f6d72c;"></div>
  <div title="#feef7a" style="background: #feef7a;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#584b37" style="background: #584b37;"></div>
  <div title="#725e34" style="background: #725e34;"></div>
  <div title="#8c7631" style="background: #8c7631;"></div>
  <div title="#ae8b2b" style="background: #ae8b2b;"></div>
  <div title="#cfa424" style="background: #cfa424;"></div>
  <div title="#ecc31e" style="background: #ecc31e;"></div>
  <div title="#f9de30" style="background: #f9de30;"></div>
  <div title="#fff184" style="background: #fff184;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#554a38" style="background: #554a38;"></div>
  <div title="#6d5a35" style="background: #6d5a35;"></div>
  <div title="#846f32" style="background: #846f32;"></div>
  <div title="#a0832d" style="background: #a0832d;"></div>
  <div title="#bf9828" style="background: #bf9828;"></div>
  <div title="#dbb022" style="background: #dbb022;"></div>
  <div title="#f0cb23" style="background: #f0cb23;"></div>
  <div title="#fae241" style="background: #fae241;"></div>
  <div title="#fff290" style="background: #fff290;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="darkgreen" href="#darkgreen">#</a> <strong>darkgreen</strong> {% include tag ver="5.0" %} <a class="toggle" href='javascript:toggle("#discrete-darkgreen")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-darkgreen">
      <stop offset="0%" stop-color="#3a3a3a"></stop>
      <stop offset="10%" stop-color="#245447"></stop>
      <stop offset="20%" stop-color="#076a4c"></stop>
      <stop offset="30%" stop-color="#038145"></stop>
      <stop offset="40%" stop-color="#2d9642"></stop>
      <stop offset="50%" stop-color="#5fa941"></stop>
      <stop offset="60%" stop-color="#89bb3f"></stop>
      <stop offset="70%" stop-color="#b3cb3b"></stop>
      <stop offset="80%" stop-color="#dbdc34"></stop>
      <stop offset="90%" stop-color="#ffed39"></stop>
      <stop offset="100%" stop-color="#ffffaa"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-darkgreen)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-darkgreen" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#5fa941" style="background: #5fa941;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#048942" style="background: #048942;"></div>
  <div title="#a6c63d" style="background: #a6c63d;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#01764a" style="background: #01764a;"></div>
  <div title="#5fa941" style="background: #5fa941;"></div>
  <div title="#c7d438" style="background: #c7d438;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#076a4c" style="background: #076a4c;"></div>
  <div title="#2d9642" style="background: #2d9642;"></div>
  <div title="#89bb3f" style="background: #89bb3f;"></div>
  <div title="#dbdc34" style="background: #dbdc34;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#11634b" style="background: #11634b;"></div>
  <div title="#048942" style="background: #048942;"></div>
  <div title="#5fa941" style="background: #5fa941;"></div>
  <div title="#a6c63d" style="background: #a6c63d;"></div>
  <div title="#e9e231" style="background: #e9e231;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#185e49" style="background: #185e49;"></div>
  <div title="#027e47" style="background: #027e47;"></div>
  <div title="#3e9b42" style="background: #3e9b42;"></div>
  <div title="#7db640" style="background: #7db640;"></div>
  <div title="#b9ce3a" style="background: #b9ce3a;"></div>
  <div title="#f2e62f" style="background: #f2e62f;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#1d5a49" style="background: #1d5a49;"></div>
  <div title="#01764a" style="background: #01764a;"></div>
  <div title="#1e9142" style="background: #1e9142;"></div>
  <div title="#5fa941" style="background: #5fa941;"></div>
  <div title="#94bf3e" style="background: #94bf3e;"></div>
  <div title="#c7d438" style="background: #c7d438;"></div>
  <div title="#f9e92d" style="background: #f9e92d;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#215748" style="background: #215748;"></div>
  <div title="#006f4d" style="background: #006f4d;"></div>
  <div title="#048942" style="background: #048942;"></div>
  <div title="#489e42" style="background: #489e42;"></div>
  <div title="#76b340" style="background: #76b340;"></div>
  <div title="#a6c63d" style="background: #a6c63d;"></div>
  <div title="#d2d836" style="background: #d2d836;"></div>
  <div title="#ffeb2c" style="background: #ffeb2c;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#245447" style="background: #245447;"></div>
  <div title="#076a4c" style="background: #076a4c;"></div>
  <div title="#038145" style="background: #038145;"></div>
  <div title="#2d9642" style="background: #2d9642;"></div>
  <div title="#5fa941" style="background: #5fa941;"></div>
  <div title="#89bb3f" style="background: #89bb3f;"></div>
  <div title="#b3cb3b" style="background: #b3cb3b;"></div>
  <div title="#dbdc34" style="background: #dbdc34;"></div>
  <div title="#ffed39" style="background: #ffed39;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="darkmulti" href="#darkmulti">#</a> <strong>darkmulti</strong> {% include tag ver="5.0" %} <a class="toggle" href='javascript:toggle("#discrete-darkmulti")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-darkmulti">
      <stop offset="0%" stop-color="#373737"></stop>
      <stop offset="10%" stop-color="#294767"></stop>
      <stop offset="20%" stop-color="#1e5b88"></stop>
      <stop offset="30%" stop-color="#1a748b"></stop>
      <stop offset="40%" stop-color="#1f8e7e"></stop>
      <stop offset="50%" stop-color="#29a869"></stop>
      <stop offset="60%" stop-color="#6abf50"></stop>
      <stop offset="70%" stop-color="#aad332"></stop>
      <stop offset="80%" stop-color="#eae30d"></stop>
      <stop offset="90%" stop-color="#fff166"></stop>
      <stop offset="100%" stop-color="#ffffff"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-darkmulti)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-darkmulti" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#29a869" style="background: #29a869;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#197d8c" style="background: #197d8c;"></div>
  <div title="#95ce3f" style="background: #95ce3f;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#1c688a" style="background: #1c688a;"></div>
  <div title="#29a869" style="background: #29a869;"></div>
  <div title="#cadb20" style="background: #cadb20;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#1e5b88" style="background: #1e5b88;"></div>
  <div title="#1f8e7e" style="background: #1f8e7e;"></div>
  <div title="#6abf50" style="background: #6abf50;"></div>
  <div title="#eae30d" style="background: #eae30d;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#1f5287" style="background: #1f5287;"></div>
  <div title="#197d8c" style="background: #197d8c;"></div>
  <div title="#29a869" style="background: #29a869;"></div>
  <div title="#95ce3f" style="background: #95ce3f;"></div>
  <div title="#ffe800" style="background: #ffe800;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#224e7c" style="background: #224e7c;"></div>
  <div title="#1b718b" style="background: #1b718b;"></div>
  <div title="#229678" style="background: #229678;"></div>
  <div title="#57b857" style="background: #57b857;"></div>
  <div title="#b3d52d" style="background: #b3d52d;"></div>
  <div title="#ffeb24" style="background: #ffeb24;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#254b73" style="background: #254b73;"></div>
  <div title="#1c688a" style="background: #1c688a;"></div>
  <div title="#1d8883" style="background: #1d8883;"></div>
  <div title="#29a869" style="background: #29a869;"></div>
  <div title="#7ac54a" style="background: #7ac54a;"></div>
  <div title="#cadb20" style="background: #cadb20;"></div>
  <div title="#ffee40" style="background: #ffee40;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#27496c" style="background: #27496c;"></div>
  <div title="#1d6089" style="background: #1d6089;"></div>
  <div title="#197d8c" style="background: #197d8c;"></div>
  <div title="#249a75" style="background: #249a75;"></div>
  <div title="#4db55b" style="background: #4db55b;"></div>
  <div title="#95ce3f" style="background: #95ce3f;"></div>
  <div title="#dcdf15" style="background: #dcdf15;"></div>
  <div title="#fff055" style="background: #fff055;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#294767" style="background: #294767;"></div>
  <div title="#1e5b88" style="background: #1e5b88;"></div>
  <div title="#1a748b" style="background: #1a748b;"></div>
  <div title="#1f8e7e" style="background: #1f8e7e;"></div>
  <div title="#29a869" style="background: #29a869;"></div>
  <div title="#6abf50" style="background: #6abf50;"></div>
  <div title="#aad332" style="background: #aad332;"></div>
  <div title="#eae30d" style="background: #eae30d;"></div>
  <div title="#fff166" style="background: #fff166;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="darkred" href="#darkred">#</a> <strong>darkred</strong> {% include tag ver="5.0" %} <a class="toggle" href='javascript:toggle("#discrete-darkred")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-darkred">
      <stop offset="0%" stop-color="#343434"></stop>
      <stop offset="10%" stop-color="#643633"></stop>
      <stop offset="20%" stop-color="#8c3a36"></stop>
      <stop offset="30%" stop-color="#b03e38"></stop>
      <stop offset="40%" stop-color="#d14632"></stop>
      <stop offset="50%" stop-color="#e75d1e"></stop>
      <stop offset="60%" stop-color="#eb7e20"></stop>
      <stop offset="70%" stop-color="#ed9c25"></stop>
      <stop offset="80%" stop-color="#efb92d"></stop>
      <stop offset="90%" stop-color="#f3d431"></stop>
      <stop offset="100%" stop-color="#ffeb2c"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-darkred)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-darkred" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#e75d1e" style="background: #e75d1e;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#bd3f37" style="background: #bd3f37;"></div>
  <div title="#ed9223" style="background: #ed9223;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#9e3c38" style="background: #9e3c38;"></div>
  <div title="#e75d1e" style="background: #e75d1e;"></div>
  <div title="#eeab29" style="background: #eeab29;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#8c3a36" style="background: #8c3a36;"></div>
  <div title="#d14632" style="background: #d14632;"></div>
  <div title="#eb7e20" style="background: #eb7e20;"></div>
  <div title="#efb92d" style="background: #efb92d;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#7f3835" style="background: #7f3835;"></div>
  <div title="#bd3f37" style="background: #bd3f37;"></div>
  <div title="#e75d1e" style="background: #e75d1e;"></div>
  <div title="#ed9223" style="background: #ed9223;"></div>
  <div title="#efc22f" style="background: #efc22f;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#773734" style="background: #773734;"></div>
  <div title="#ab3d38" style="background: #ab3d38;"></div>
  <div title="#d84c2c" style="background: #d84c2c;"></div>
  <div title="#ea741f" style="background: #ea741f;"></div>
  <div title="#eda026" style="background: #eda026;"></div>
  <div title="#f0c931" style="background: #f0c931;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#703633" style="background: #703633;"></div>
  <div title="#9e3c38" style="background: #9e3c38;"></div>
  <div title="#cc4037" style="background: #cc4037;"></div>
  <div title="#e75d1e" style="background: #e75d1e;"></div>
  <div title="#ec8620" style="background: #ec8620;"></div>
  <div title="#eeab29" style="background: #eeab29;"></div>
  <div title="#f0ce32" style="background: #f0ce32;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#693633" style="background: #693633;"></div>
  <div title="#943b37" style="background: #943b37;"></div>
  <div title="#bd3f37" style="background: #bd3f37;"></div>
  <div title="#db5029" style="background: #db5029;"></div>
  <div title="#e96f1f" style="background: #e96f1f;"></div>
  <div title="#ed9223" style="background: #ed9223;"></div>
  <div title="#eeb32b" style="background: #eeb32b;"></div>
  <div title="#f2d131" style="background: #f2d131;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#643633" style="background: #643633;"></div>
  <div title="#8c3a36" style="background: #8c3a36;"></div>
  <div title="#b03e38" style="background: #b03e38;"></div>
  <div title="#d14632" style="background: #d14632;"></div>
  <div title="#e75d1e" style="background: #e75d1e;"></div>
  <div title="#eb7e20" style="background: #eb7e20;"></div>
  <div title="#ed9c25" style="background: #ed9c25;"></div>
  <div title="#efb92d" style="background: #efb92d;"></div>
  <div title="#f3d431" style="background: #f3d431;"></div>
</div>
</div>
</div>

#### For Light Backgrounds

<div class="scheme continuous">
<a name="lightgreyred" href="#lightgreyred">#</a> <strong>lightgreyred</strong> {% include tag ver="5.0" %} <a class="toggle" href='javascript:toggle("#discrete-lightgreyred")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-lightgreyred">
      <stop offset="0%" stop-color="#efe9e6"></stop>
      <stop offset="10%" stop-color="#e2dcd9"></stop>
      <stop offset="20%" stop-color="#d7cecb"></stop>
      <stop offset="30%" stop-color="#ccc1be"></stop>
      <stop offset="40%" stop-color="#c0b4af"></stop>
      <stop offset="50%" stop-color="#c4a293"></stop>
      <stop offset="60%" stop-color="#d38b66"></stop>
      <stop offset="70%" stop-color="#de7336"></stop>
      <stop offset="80%" stop-color="#e15917"></stop>
      <stop offset="90%" stop-color="#df3a10"></stop>
      <stop offset="100%" stop-color="#dc000b"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-lightgreyred)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-lightgreyred" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#c4a293" style="background: #c4a293;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#c8bdb9" style="background: #c8bdb9;"></div>
  <div title="#dc7b43" style="background: #dc7b43;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#d2c8c4" style="background: #d2c8c4;"></div>
  <div title="#c4a293" style="background: #c4a293;"></div>
  <div title="#e06624" style="background: #e06624;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#d7cecb" style="background: #d7cecb;"></div>
  <div title="#c0b4af" style="background: #c0b4af;"></div>
  <div title="#d38b66" style="background: #d38b66;"></div>
  <div title="#e15917" style="background: #e15917;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#dbd3d0" style="background: #dbd3d0;"></div>
  <div title="#c8bdb9" style="background: #c8bdb9;"></div>
  <div title="#c4a293" style="background: #c4a293;"></div>
  <div title="#dc7b43" style="background: #dc7b43;"></div>
  <div title="#e05015" style="background: #e05015;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#ded6d3" style="background: #ded6d3;"></div>
  <div title="#cec3bf" style="background: #cec3bf;"></div>
  <div title="#bdb0ab" style="background: #bdb0ab;"></div>
  <div title="#cf9275" style="background: #cf9275;"></div>
  <div title="#de6f31" style="background: #de6f31;"></div>
  <div title="#e04913" style="background: #e04913;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#e0d8d5" style="background: #e0d8d5;"></div>
  <div title="#d2c8c4" style="background: #d2c8c4;"></div>
  <div title="#c3b7b3" style="background: #c3b7b3;"></div>
  <div title="#c4a293" style="background: #c4a293;"></div>
  <div title="#d68559" style="background: #d68559;"></div>
  <div title="#e06624" style="background: #e06624;"></div>
  <div title="#df4412" style="background: #df4412;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#e1dad7" style="background: #e1dad7;"></div>
  <div title="#d5cbc8" style="background: #d5cbc8;"></div>
  <div title="#c8bdb9" style="background: #c8bdb9;"></div>
  <div title="#bbaea9" style="background: #bbaea9;"></div>
  <div title="#cd967d" style="background: #cd967d;"></div>
  <div title="#dc7b43" style="background: #dc7b43;"></div>
  <div title="#e15f19" style="background: #e15f19;"></div>
  <div title="#df4011" style="background: #df4011;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#e2dcd9" style="background: #e2dcd9;"></div>
  <div title="#d7cecb" style="background: #d7cecb;"></div>
  <div title="#ccc1be" style="background: #ccc1be;"></div>
  <div title="#c0b4af" style="background: #c0b4af;"></div>
  <div title="#c4a293" style="background: #c4a293;"></div>
  <div title="#d38b66" style="background: #d38b66;"></div>
  <div title="#de7336" style="background: #de7336;"></div>
  <div title="#e15917" style="background: #e15917;"></div>
  <div title="#df3a10" style="background: #df3a10;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="lightgreyteal" href="#lightgreyteal">#</a> <strong>lightgreyteal</strong> {% include tag ver="5.0" %} <a class="toggle" href='javascript:toggle("#discrete-lightgreyteal")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-lightgreyteal">
      <stop offset="0%" stop-color="#e4eaea"></stop>
      <stop offset="10%" stop-color="#d7ddde"></stop>
      <stop offset="20%" stop-color="#cbd1d4"></stop>
      <stop offset="30%" stop-color="#bcc6ca"></stop>
      <stop offset="40%" stop-color="#adbac0"></stop>
      <stop offset="50%" stop-color="#85b2be"></stop>
      <stop offset="60%" stop-color="#4aacc1"></stop>
      <stop offset="70%" stop-color="#22a1c2"></stop>
      <stop offset="80%" stop-color="#2192c0"></stop>
      <stop offset="90%" stop-color="#1e84be"></stop>
      <stop offset="100%" stop-color="#1876bc"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-lightgreyteal)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-lightgreyteal" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#85b2be" style="background: #85b2be;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#b7c2c7" style="background: #b7c2c7;"></div>
  <div title="#22a6c3" style="background: #22a6c3;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#c4cbcf" style="background: #c4cbcf;"></div>
  <div title="#85b2be" style="background: #85b2be;"></div>
  <div title="#2299c2" style="background: #2299c2;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#cbd1d4" style="background: #cbd1d4;"></div>
  <div title="#adbac0" style="background: #adbac0;"></div>
  <div title="#4aacc1" style="background: #4aacc1;"></div>
  <div title="#2192c0" style="background: #2192c0;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#cfd5d8" style="background: #cfd5d8;"></div>
  <div title="#b7c2c7" style="background: #b7c2c7;"></div>
  <div title="#85b2be" style="background: #85b2be;"></div>
  <div title="#22a6c3" style="background: #22a6c3;"></div>
  <div title="#218dc0" style="background: #218dc0;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#d2d8da" style="background: #d2d8da;"></div>
  <div title="#bec7cc" style="background: #bec7cc;"></div>
  <div title="#a8b6be" style="background: #a8b6be;"></div>
  <div title="#5bafc0" style="background: #5bafc0;"></div>
  <div title="#229fc2" style="background: #229fc2;"></div>
  <div title="#208abf" style="background: #208abf;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#d4dadc" style="background: #d4dadc;"></div>
  <div title="#c4cbcf" style="background: #c4cbcf;"></div>
  <div title="#b1bdc3" style="background: #b1bdc3;"></div>
  <div title="#85b2be" style="background: #85b2be;"></div>
  <div title="#3baac2" style="background: #3baac2;"></div>
  <div title="#2299c2" style="background: #2299c2;"></div>
  <div title="#1f87be" style="background: #1f87be;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#d6dcdd" style="background: #d6dcdd;"></div>
  <div title="#c8ced2" style="background: #c8ced2;"></div>
  <div title="#b7c2c7" style="background: #b7c2c7;"></div>
  <div title="#a6b4bc" style="background: #a6b4bc;"></div>
  <div title="#64b0bf" style="background: #64b0bf;"></div>
  <div title="#22a6c3" style="background: #22a6c3;"></div>
  <div title="#2295c1" style="background: #2295c1;"></div>
  <div title="#1f85be" style="background: #1f85be;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#d7ddde" style="background: #d7ddde;"></div>
  <div title="#cbd1d4" style="background: #cbd1d4;"></div>
  <div title="#bcc6ca" style="background: #bcc6ca;"></div>
  <div title="#adbac0" style="background: #adbac0;"></div>
  <div title="#85b2be" style="background: #85b2be;"></div>
  <div title="#4aacc1" style="background: #4aacc1;"></div>
  <div title="#22a1c2" style="background: #22a1c2;"></div>
  <div title="#2192c0" style="background: #2192c0;"></div>
  <div title="#1e84be" style="background: #1e84be;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="lightmulti" href="#lightmulti">#</a> <strong>lightmulti</strong> {% include tag ver="5.0" %} <a class="toggle" href='javascript:toggle("#discrete-lightmulti")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-lightmulti">
      <stop offset="0%" stop-color="#e0f1f2"></stop>
      <stop offset="10%" stop-color="#caebd7"></stop>
      <stop offset="20%" stop-color="#b8e2b3"></stop>
      <stop offset="30%" stop-color="#bddf93"></stop>
      <stop offset="40%" stop-color="#d8e17e"></stop>
      <stop offset="50%" stop-color="#f6e072"></stop>
      <stop offset="60%" stop-color="#f6c659"></stop>
      <stop offset="70%" stop-color="#f4a946"></stop>
      <stop offset="80%" stop-color="#f58a3f"></stop>
      <stop offset="90%" stop-color="#f56c3f"></stop>
      <stop offset="100%" stop-color="#ef4a3c"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-lightmulti)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-lightmulti" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#f6e072" style="background: #f6e072;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#c5e08b" style="background: #c5e08b;"></div>
  <div title="#f5b34c" style="background: #f5b34c;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#b0de9f" style="background: #b0de9f;"></div>
  <div title="#f6e072" style="background: #f6e072;"></div>
  <div title="#f3993e" style="background: #f3993e;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#b8e2b3" style="background: #b8e2b3;"></div>
  <div title="#d8e17e" style="background: #d8e17e;"></div>
  <div title="#f6c659" style="background: #f6c659;"></div>
  <div title="#f58a3f" style="background: #f58a3f;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#bde5c0" style="background: #bde5c0;"></div>
  <div title="#c5e08b" style="background: #c5e08b;"></div>
  <div title="#f6e072" style="background: #f6e072;"></div>
  <div title="#f5b34c" style="background: #f5b34c;"></div>
  <div title="#f6803f" style="background: #f6803f;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#c1e7c9" style="background: #c1e7c9;"></div>
  <div title="#b9df96" style="background: #b9df96;"></div>
  <div title="#e0e17b" style="background: #e0e17b;"></div>
  <div title="#f6ce60" style="background: #f6ce60;"></div>
  <div title="#f4a444" style="background: #f4a444;"></div>
  <div title="#f67940" style="background: #f67940;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#c4e9d0" style="background: #c4e9d0;"></div>
  <div title="#b0de9f" style="background: #b0de9f;"></div>
  <div title="#d0e181" style="background: #d0e181;"></div>
  <div title="#f6e072" style="background: #f6e072;"></div>
  <div title="#f6c053" style="background: #f6c053;"></div>
  <div title="#f3993e" style="background: #f3993e;"></div>
  <div title="#f77440" style="background: #f77440;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#c7ead4" style="background: #c7ead4;"></div>
  <div title="#b4e0aa" style="background: #b4e0aa;"></div>
  <div title="#c5e08b" style="background: #c5e08b;"></div>
  <div title="#e5e079" style="background: #e5e079;"></div>
  <div title="#f6d264" style="background: #f6d264;"></div>
  <div title="#f5b34c" style="background: #f5b34c;"></div>
  <div title="#f4913e" style="background: #f4913e;"></div>
  <div title="#f66f40" style="background: #f66f40;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#caebd7" style="background: #caebd7;"></div>
  <div title="#b8e2b3" style="background: #b8e2b3;"></div>
  <div title="#bddf93" style="background: #bddf93;"></div>
  <div title="#d8e17e" style="background: #d8e17e;"></div>
  <div title="#f6e072" style="background: #f6e072;"></div>
  <div title="#f6c659" style="background: #f6c659;"></div>
  <div title="#f4a946" style="background: #f4a946;"></div>
  <div title="#f58a3f" style="background: #f58a3f;"></div>
  <div title="#f56c3f" style="background: #f56c3f;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="lightorange" href="#lightorange">#</a> <strong>lightorange</strong> {% include tag ver="5.0" %} <a class="toggle" href='javascript:toggle("#discrete-lightorange")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-lightorange">
      <stop offset="0%" stop-color="#f2e7da"></stop>
      <stop offset="10%" stop-color="#f7d7bd"></stop>
      <stop offset="20%" stop-color="#f9c7a0"></stop>
      <stop offset="30%" stop-color="#fab78a"></stop>
      <stop offset="40%" stop-color="#faa47a"></stop>
      <stop offset="50%" stop-color="#f8936d"></stop>
      <stop offset="60%" stop-color="#f38264"></stop>
      <stop offset="70%" stop-color="#ed725f"></stop>
      <stop offset="80%" stop-color="#e6605b"></stop>
      <stop offset="90%" stop-color="#dd4f5b"></stop>
      <stop offset="100%" stop-color="#d43d5b"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-lightorange)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-lightorange" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#f8936d" style="background: #f8936d;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#fab184" style="background: #fab184;"></div>
  <div title="#ef7860" style="background: #ef7860;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#f9bf94" style="background: #f9bf94;"></div>
  <div title="#f8936d" style="background: #f8936d;"></div>
  <div title="#ea695c" style="background: #ea695c;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#f9c7a0" style="background: #f9c7a0;"></div>
  <div title="#faa47a" style="background: #faa47a;"></div>
  <div title="#f38264" style="background: #f38264;"></div>
  <div title="#e6605b" style="background: #e6605b;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#f8cdaa" style="background: #f8cdaa;"></div>
  <div title="#fab184" style="background: #fab184;"></div>
  <div title="#f8936d" style="background: #f8936d;"></div>
  <div title="#ef7860" style="background: #ef7860;"></div>
  <div title="#e35b5b" style="background: #e35b5b;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#f8d0b1" style="background: #f8d0b1;"></div>
  <div title="#fab98d" style="background: #fab98d;"></div>
  <div title="#fa9f75" style="background: #fa9f75;"></div>
  <div title="#f58766" style="background: #f58766;"></div>
  <div title="#ec6f5e" style="background: #ec6f5e;"></div>
  <div title="#e1565b" style="background: #e1565b;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#f7d3b6" style="background: #f7d3b6;"></div>
  <div title="#f9bf94" style="background: #f9bf94;"></div>
  <div title="#faa97e" style="background: #faa97e;"></div>
  <div title="#f8936d" style="background: #f8936d;"></div>
  <div title="#f27e63" style="background: #f27e63;"></div>
  <div title="#ea695c" style="background: #ea695c;"></div>
  <div title="#df535b" style="background: #df535b;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#f7d5ba" style="background: #f7d5ba;"></div>
  <div title="#f9c499" style="background: #f9c499;"></div>
  <div title="#fab184" style="background: #fab184;"></div>
  <div title="#fa9c73" style="background: #fa9c73;"></div>
  <div title="#f68967" style="background: #f68967;"></div>
  <div title="#ef7860" style="background: #ef7860;"></div>
  <div title="#e8645b" style="background: #e8645b;"></div>
  <div title="#de515b" style="background: #de515b;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#f7d7bd" style="background: #f7d7bd;"></div>
  <div title="#f9c7a0" style="background: #f9c7a0;"></div>
  <div title="#fab78a" style="background: #fab78a;"></div>
  <div title="#faa47a" style="background: #faa47a;"></div>
  <div title="#f8936d" style="background: #f8936d;"></div>
  <div title="#f38264" style="background: #f38264;"></div>
  <div title="#ed725f" style="background: #ed725f;"></div>
  <div title="#e6605b" style="background: #e6605b;"></div>
  <div title="#dd4f5b" style="background: #dd4f5b;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="lighttealblue" href="#lighttealblue">#</a> <strong>lighttealblue</strong> {% include tag ver="5.0" %} <a class="toggle" href='javascript:toggle("#discrete-lighttealblue")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-lighttealblue">
      <stop offset="0%" stop-color="#e3e9e0"></stop>
      <stop offset="10%" stop-color="#c4ddd1"></stop>
      <stop offset="20%" stop-color="#a2d1cb"></stop>
      <stop offset="30%" stop-color="#84c4c9"></stop>
      <stop offset="40%" stop-color="#66b5c3"></stop>
      <stop offset="50%" stop-color="#49a7bd"></stop>
      <stop offset="60%" stop-color="#3698b4"></stop>
      <stop offset="70%" stop-color="#3188a9"></stop>
      <stop offset="80%" stop-color="#2d799e"></stop>
      <stop offset="90%" stop-color="#276994"></stop>
      <stop offset="100%" stop-color="#255988"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-lighttealblue)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-lighttealblue" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div title="#49a7bd" style="background: #49a7bd;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div title="#7abfc8" style="background: #7abfc8;"></div>
  <div title="#328dad" style="background: #328dad;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div title="#92caca" style="background: #92caca;"></div>
  <div title="#49a7bd" style="background: #49a7bd;"></div>
  <div title="#3080a3" style="background: #3080a3;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div title="#a2d1cb" style="background: #a2d1cb;"></div>
  <div title="#66b5c3" style="background: #66b5c3;"></div>
  <div title="#3698b4" style="background: #3698b4;"></div>
  <div title="#2d799e" style="background: #2d799e;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div title="#add5cd" style="background: #add5cd;"></div>
  <div title="#7abfc8" style="background: #7abfc8;"></div>
  <div title="#49a7bd" style="background: #49a7bd;"></div>
  <div title="#328dad" style="background: #328dad;"></div>
  <div title="#2b749b" style="background: #2b749b;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div title="#b5d8ce" style="background: #b5d8ce;"></div>
  <div title="#88c5c9" style="background: #88c5c9;"></div>
  <div title="#5eb1c1" style="background: #5eb1c1;"></div>
  <div title="#379cb7" style="background: #379cb7;"></div>
  <div title="#3186a7" style="background: #3186a7;"></div>
  <div title="#297098" style="background: #297098;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div title="#bbdace" style="background: #bbdace;"></div>
  <div title="#92caca" style="background: #92caca;"></div>
  <div title="#6eb9c5" style="background: #6eb9c5;"></div>
  <div title="#49a7bd" style="background: #49a7bd;"></div>
  <div title="#3494b2" style="background: #3494b2;"></div>
  <div title="#3080a3" style="background: #3080a3;"></div>
  <div title="#286d96" style="background: #286d96;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#c0dccf" style="background: #c0dccf;"></div>
  <div title="#9aceca" style="background: #9aceca;"></div>
  <div title="#7abfc8" style="background: #7abfc8;"></div>
  <div title="#59afc0" style="background: #59afc0;"></div>
  <div title="#389fb9" style="background: #389fb9;"></div>
  <div title="#328dad" style="background: #328dad;"></div>
  <div title="#2f7ca0" style="background: #2f7ca0;"></div>
  <div title="#276b95" style="background: #276b95;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#c4ddd1" style="background: #c4ddd1;"></div>
  <div title="#a2d1cb" style="background: #a2d1cb;"></div>
  <div title="#84c4c9" style="background: #84c4c9;"></div>
  <div title="#66b5c3" style="background: #66b5c3;"></div>
  <div title="#49a7bd" style="background: #49a7bd;"></div>
  <div title="#3698b4" style="background: #3698b4;"></div>
  <div title="#3188a9" style="background: #3188a9;"></div>
  <div title="#2d799e" style="background: #2d799e;"></div>
  <div title="#276994" style="background: #276994;"></div>
</div>
</div>
</div>


### <a name="diverging"></a>Diverging Schemes

Diverging color schemes can be used to encode quantitative values with a meaningful mid-point, such as zero or the average value. Color ramps with different hues diverge with increasing saturation to highlight the values below and above the mid-point. Hover over a scheme and click the "View Discrete" link to toggle display of discretized palettes suitable for quantile, quantize, threshold, or ordinal [scales](../scales).

<div class="scheme continuous">
<a name="blueorange" href="#blueorange">#</a> <strong>blueorange</strong> <a class="toggle" href='javascript:toggle("#discrete-blueorange")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-blueorange">
      <stop offset="0%" stop-color="#134b85"></stop>
      <stop offset="10%" stop-color="#2f78b3"></stop>
      <stop offset="20%" stop-color="#5da2cb"></stop>
      <stop offset="30%" stop-color="#9dcae1"></stop>
      <stop offset="40%" stop-color="#d2e5ef"></stop>
      <stop offset="50%" stop-color="#f2f0eb"></stop>
      <stop offset="60%" stop-color="#fce0ba"></stop>
      <stop offset="70%" stop-color="#fbbf74"></stop>
      <stop offset="80%" stop-color="#e8932f"></stop>
      <stop offset="90%" stop-color="#c5690d"></stop>
      <stop offset="100%" stop-color="#994a07"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-blueorange)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-blueorange" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div></div> <div></div> <div></div> <div></div>
  <div title="#f2f0eb" style="background: #f2f0eb;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div></div> <div></div> <div></div>
  <div title="#afd3e6" style="background: #afd3e6;"></div>
  <div></div>
  <div title="#fbca8b" style="background: #fbca8b;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div></div> <div></div> <div></div>
  <div title="#7db6d6" style="background: #7db6d6;"></div>
  <div title="#f2f0eb" style="background: #f2f0eb;"></div>
  <div title="#f2a952" style="background: #f2a952;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div></div> <div></div>
  <div title="#5da2cb" style="background: #5da2cb;"></div>
  <div title="#d2e5ef" style="background: #d2e5ef;"></div>
  <div></div>
  <div title="#fce0ba" style="background: #fce0ba;"></div>
  <div title="#e8932f" style="background: #e8932f;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div></div> <div></div>
  <div title="#4e94c3" style="background: #4e94c3;"></div>
  <div title="#afd3e6" style="background: #afd3e6;"></div>
  <div title="#f2f0eb" style="background: #f2f0eb;"></div>
  <div title="#fbca8b" style="background: #fbca8b;"></div>
  <div title="#dc8524" style="background: #dc8524;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div></div>
  <div title="#438abd" style="background: #438abd;"></div>
  <div title="#94c4de" style="background: #94c4de;"></div>
  <div title="#dbe8ee" style="background: #dbe8ee;"></div>
  <div></div>
  <div title="#f9e5c8" style="background: #f9e5c8;"></div>
  <div title="#f8b96a" style="background: #f8b96a;"></div>
  <div title="#d47b1c" style="background: #d47b1c;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div></div>
  <div title="#3b83b9" style="background: #3b83b9;"></div>
  <div title="#7db6d6" style="background: #7db6d6;"></div>
  <div title="#c5deec" style="background: #c5deec;"></div>
  <div title="#f2f0eb" style="background: #f2f0eb;"></div>
  <div title="#fcd8a9" style="background: #fcd8a9;"></div>
  <div title="#f2a952" style="background: #f2a952;"></div>
  <div title="#ce7416" style="background: #ce7416;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#347db6" style="background: #347db6;"></div>
  <div title="#6babd0" style="background: #6babd0;"></div>
  <div title="#afd3e6" style="background: #afd3e6;"></div>
  <div title="#e0eaed" style="background: #e0eaed;"></div>
  <div></div>
  <div title="#f8e7d0" style="background: #f8e7d0;"></div>
  <div title="#fbca8b" style="background: #fbca8b;"></div>
  <div title="#ec9d3e" style="background: #ec9d3e;"></div>
  <div title="#c96e11" style="background: #c96e11;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#2f78b3" style="background: #2f78b3;"></div>
  <div title="#5da2cb" style="background: #5da2cb;"></div>
  <div title="#9dcae1" style="background: #9dcae1;"></div>
  <div title="#d2e5ef" style="background: #d2e5ef;"></div>
  <div title="#f2f0eb" style="background: #f2f0eb;"></div>
  <div title="#fce0ba" style="background: #fce0ba;"></div>
  <div title="#fbbf74" style="background: #fbbf74;"></div>
  <div title="#e8932f" style="background: #e8932f;"></div>
  <div title="#c5690d" style="background: #c5690d;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="brownbluegreen" href="#brownbluegreen">#</a> <strong>brownbluegreen</strong> <a class="toggle" href='javascript:toggle("#discrete-brownbluegreen")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-brownbluegreen">
      <stop offset="0%" stop-color="#704108"></stop>
      <stop offset="10%" stop-color="#a0651a"></stop>
      <stop offset="20%" stop-color="#c79548"></stop>
      <stop offset="30%" stop-color="#e3c78a"></stop>
      <stop offset="40%" stop-color="#f3e6c6"></stop>
      <stop offset="50%" stop-color="#eef1ea"></stop>
      <stop offset="60%" stop-color="#c9e9e4"></stop>
      <stop offset="70%" stop-color="#8ed1c7"></stop>
      <stop offset="80%" stop-color="#4da79e"></stop>
      <stop offset="90%" stop-color="#187a72"></stop>
      <stop offset="100%" stop-color="#025147"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-brownbluegreen)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-brownbluegreen" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div></div> <div></div> <div></div> <div></div>
  <div title="#eef1ea" style="background: #eef1ea;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div></div> <div></div> <div></div>
  <div title="#e8d19e" style="background: #e8d19e;"></div>
  <div></div>
  <div title="#a2d9d1" style="background: #a2d9d1;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div></div> <div></div> <div></div>
  <div title="#d5ae69" style="background: #d5ae69;"></div>
  <div title="#eef1ea" style="background: #eef1ea;"></div>
  <div title="#6ebcb3" style="background: #6ebcb3;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div></div> <div></div>
  <div title="#c79548" style="background: #c79548;"></div>
  <div title="#f3e6c6" style="background: #f3e6c6;"></div>
  <div></div>
  <div title="#c9e9e4" style="background: #c9e9e4;"></div>
  <div title="#4da79e" style="background: #4da79e;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div></div> <div></div>
  <div title="#ba8539" style="background: #ba8539;"></div>
  <div title="#e8d19e" style="background: #e8d19e;"></div>
  <div title="#eef1ea" style="background: #eef1ea;"></div>
  <div title="#a2d9d1" style="background: #a2d9d1;"></div>
  <div title="#3b988f" style="background: #3b988f;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div></div>
  <div title="#b17a2e" style="background: #b17a2e;"></div>
  <div title="#dfc081" style="background: #dfc081;"></div>
  <div title="#f2e9d0" style="background: #f2e9d0;"></div>
  <div></div>
  <div title="#d4ebe6" style="background: #d4ebe6;"></div>
  <div title="#85cbc1" style="background: #85cbc1;"></div>
  <div title="#2f8d85" style="background: #2f8d85;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div></div>
  <div title="#aa7126" style="background: #aa7126;"></div>
  <div title="#d5ae69" style="background: #d5ae69;"></div>
  <div title="#efdeb7" style="background: #efdeb7;"></div>
  <div title="#eef1ea" style="background: #eef1ea;"></div>
  <div title="#bae3dd" style="background: #bae3dd;"></div>
  <div title="#6ebcb3" style="background: #6ebcb3;"></div>
  <div title="#25857d" style="background: #25857d;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#a46a1f" style="background: #a46a1f;"></div>
  <div title="#cda057" style="background: #cda057;"></div>
  <div title="#e8d19e" style="background: #e8d19e;"></div>
  <div title="#f1ebd6" style="background: #f1ebd6;"></div>
  <div></div>
  <div title="#d9ede7" style="background: #d9ede7;"></div>
  <div title="#a2d9d1" style="background: #a2d9d1;"></div>
  <div title="#5bb0a7" style="background: #5bb0a7;"></div>
  <div title="#1e7f77" style="background: #1e7f77;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#a0651a" style="background: #a0651a;"></div>
  <div title="#c79548" style="background: #c79548;"></div>
  <div title="#e3c78a" style="background: #e3c78a;"></div>
  <div title="#f3e6c6" style="background: #f3e6c6;"></div>
  <div title="#eef1ea" style="background: #eef1ea;"></div>
  <div title="#c9e9e4" style="background: #c9e9e4;"></div>
  <div title="#8ed1c7" style="background: #8ed1c7;"></div>
  <div title="#4da79e" style="background: #4da79e;"></div>
  <div title="#187a72" style="background: #187a72;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="purplegreen" href="#purplegreen">#</a> <strong>purplegreen</strong> <a class="toggle" href='javascript:toggle("#discrete-purplegreen")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-purplegreen">
      <stop offset="0%" stop-color="#5b1667"></stop>
      <stop offset="10%" stop-color="#834792"></stop>
      <stop offset="20%" stop-color="#a67fb6"></stop>
      <stop offset="30%" stop-color="#c9aed3"></stop>
      <stop offset="40%" stop-color="#e6d6e8"></stop>
      <stop offset="50%" stop-color="#eff0ef"></stop>
      <stop offset="60%" stop-color="#d9efd5"></stop>
      <stop offset="70%" stop-color="#aedda9"></stop>
      <stop offset="80%" stop-color="#71bb75"></stop>
      <stop offset="90%" stop-color="#368e49"></stop>
      <stop offset="100%" stop-color="#0e5e29"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-purplegreen)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-purplegreen" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div></div> <div></div> <div></div> <div></div>
  <div title="#eff0ef" style="background: #eff0ef;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div></div> <div></div> <div></div>
  <div title="#d3bbda" style="background: #d3bbda;"></div>
  <div></div>
  <div title="#bce3b8" style="background: #bce3b8;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div></div> <div></div> <div></div>
  <div title="#b897c5" style="background: #b897c5;"></div>
  <div title="#eff0ef" style="background: #eff0ef;"></div>
  <div title="#90cc8f" style="background: #90cc8f;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div></div> <div></div>
  <div title="#a67fb6" style="background: #a67fb6;"></div>
  <div title="#e6d6e8" style="background: #e6d6e8;"></div>
  <div></div>
  <div title="#d9efd5" style="background: #d9efd5;"></div>
  <div title="#71bb75" style="background: #71bb75;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div></div> <div></div>
  <div title="#9a6caa" style="background: #9a6caa;"></div>
  <div title="#d3bbda" style="background: #d3bbda;"></div>
  <div title="#eff0ef" style="background: #eff0ef;"></div>
  <div title="#bce3b8" style="background: #bce3b8;"></div>
  <div title="#5dac66" style="background: #5dac66;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div></div>
  <div title="#925fa1" style="background: #925fa1;"></div>
  <div title="#c4a7cf" style="background: #c4a7cf;"></div>
  <div title="#e9ddea" style="background: #e9ddea;"></div>
  <div></div>
  <div title="#dfefdc" style="background: #dfefdc;"></div>
  <div title="#a5d8a2" style="background: #a5d8a2;"></div>
  <div title="#4fa15c" style="background: #4fa15c;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div></div>
  <div title="#8c559b" style="background: #8c559b;"></div>
  <div title="#b897c5" style="background: #b897c5;"></div>
  <div title="#dfcce3" style="background: #dfcce3;"></div>
  <div title="#eff0ef" style="background: #eff0ef;"></div>
  <div title="#ceebca" style="background: #ceebca;"></div>
  <div title="#90cc8f" style="background: #90cc8f;"></div>
  <div title="#459954" style="background: #459954;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#874d96" style="background: #874d96;"></div>
  <div title="#ae89bc" style="background: #ae89bc;"></div>
  <div title="#d3bbda" style="background: #d3bbda;"></div>
  <div title="#eae2eb" style="background: #eae2eb;"></div>
  <div></div>
  <div title="#e3efe1" style="background: #e3efe1;"></div>
  <div title="#bce3b8" style="background: #bce3b8;"></div>
  <div title="#7fc381" style="background: #7fc381;"></div>
  <div title="#3d934e" style="background: #3d934e;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#834792" style="background: #834792;"></div>
  <div title="#a67fb6" style="background: #a67fb6;"></div>
  <div title="#c9aed3" style="background: #c9aed3;"></div>
  <div title="#e6d6e8" style="background: #e6d6e8;"></div>
  <div title="#eff0ef" style="background: #eff0ef;"></div>
  <div title="#d9efd5" style="background: #d9efd5;"></div>
  <div title="#aedda9" style="background: #aedda9;"></div>
  <div title="#71bb75" style="background: #71bb75;"></div>
  <div title="#368e49" style="background: #368e49;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="pinkyellowgreen" href="#pinkyellowgreen">#</a> <strong>pinkyellowgreen</strong> <a class="toggle" href='javascript:toggle("#discrete-pinkyellowgreen")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-pinkyellowgreen">
      <stop offset="0%" stop-color="#8e0152"></stop>
      <stop offset="10%" stop-color="#c0267e"></stop>
      <stop offset="20%" stop-color="#dd72ad"></stop>
      <stop offset="30%" stop-color="#f0b3d6"></stop>
      <stop offset="40%" stop-color="#fadded"></stop>
      <stop offset="50%" stop-color="#f5f3ef"></stop>
      <stop offset="60%" stop-color="#e1f2ca"></stop>
      <stop offset="70%" stop-color="#b6de87"></stop>
      <stop offset="80%" stop-color="#80bb47"></stop>
      <stop offset="90%" stop-color="#4f9125"></stop>
      <stop offset="100%" stop-color="#276419"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-pinkyellowgreen)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-pinkyellowgreen" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div></div> <div></div> <div></div> <div></div>
  <div title="#f5f3ef" style="background: #f5f3ef;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div></div> <div></div> <div></div>
  <div title="#f3c1de" style="background: #f3c1de;"></div>
  <div></div>
  <div title="#c4e59d" style="background: #c4e59d;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div></div> <div></div> <div></div>
  <div title="#e793c2" style="background: #e793c2;"></div>
  <div title="#f5f3ef" style="background: #f5f3ef;"></div>
  <div title="#9bcd67" style="background: #9bcd67;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div></div> <div></div>
  <div title="#dd72ad" style="background: #dd72ad;"></div>
  <div title="#fadded" style="background: #fadded;"></div>
  <div></div>
  <div title="#e1f2ca" style="background: #e1f2ca;"></div>
  <div title="#80bb47" style="background: #80bb47;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div></div> <div></div>
  <div title="#d3599d" style="background: #d3599d;"></div>
  <div title="#f3c1de" style="background: #f3c1de;"></div>
  <div title="#f5f3ef" style="background: #f5f3ef;"></div>
  <div title="#c4e59d" style="background: #c4e59d;"></div>
  <div title="#70ad3c" style="background: #70ad3c;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div></div>
  <div title="#cc4792" style="background: #cc4792;"></div>
  <div title="#edaad0" style="background: #edaad0;"></div>
  <div title="#f9e3ee" style="background: #f9e3ee;"></div>
  <div></div>
  <div title="#e7f2d5" style="background: #e7f2d5;"></div>
  <div title="#aed97e" style="background: #aed97e;"></div>
  <div title="#64a334" style="background: #64a334;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div></div>
  <div title="#c7398a" style="background: #c7398a;"></div>
  <div title="#e793c2" style="background: #e793c2;"></div>
  <div title="#f8d3e7" style="background: #f8d3e7;"></div>
  <div title="#f5f3ef" style="background: #f5f3ef;"></div>
  <div title="#d6edb9" style="background: #d6edb9;"></div>
  <div title="#9bcd67" style="background: #9bcd67;"></div>
  <div title="#5b9c2e" style="background: #5b9c2e;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#c32e83" style="background: #c32e83;"></div>
  <div title="#e180b6" style="background: #e180b6;"></div>
  <div title="#f3c1de" style="background: #f3c1de;"></div>
  <div title="#f8e7ee" style="background: #f8e7ee;"></div>
  <div></div>
  <div title="#eaf2da" style="background: #eaf2da;"></div>
  <div title="#c4e59d" style="background: #c4e59d;"></div>
  <div title="#8cc355" style="background: #8cc355;"></div>
  <div title="#549629" style="background: #549629;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#c0267e" style="background: #c0267e;"></div>
  <div title="#dd72ad" style="background: #dd72ad;"></div>
  <div title="#f0b3d6" style="background: #f0b3d6;"></div>
  <div title="#fadded" style="background: #fadded;"></div>
  <div title="#f5f3ef" style="background: #f5f3ef;"></div>
  <div title="#e1f2ca" style="background: #e1f2ca;"></div>
  <div title="#b6de87" style="background: #b6de87;"></div>
  <div title="#80bb47" style="background: #80bb47;"></div>
  <div title="#4f9125" style="background: #4f9125;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="purpleorange" href="#purpleorange">#</a> <strong>purpleorange</strong> <a class="toggle" href='javascript:toggle("#discrete-purpleorange")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-purpleorange">
      <stop offset="0%" stop-color="#411469"></stop>
      <stop offset="10%" stop-color="#664796"></stop>
      <stop offset="20%" stop-color="#8f83b7"></stop>
      <stop offset="30%" stop-color="#b9b4d6"></stop>
      <stop offset="40%" stop-color="#dadbeb"></stop>
      <stop offset="50%" stop-color="#f3eeea"></stop>
      <stop offset="60%" stop-color="#fce0ba"></stop>
      <stop offset="70%" stop-color="#fbbf74"></stop>
      <stop offset="80%" stop-color="#e8932f"></stop>
      <stop offset="90%" stop-color="#c5690d"></stop>
      <stop offset="100%" stop-color="#994a07"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-purpleorange)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-purpleorange" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div></div> <div></div> <div></div> <div></div>
  <div title="#f3eeea" style="background: #f3eeea;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div></div> <div></div> <div></div>
  <div title="#c4c1dd" style="background: #c4c1dd;"></div>
  <div></div>
  <div title="#fbca8b" style="background: #fbca8b;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div></div> <div></div> <div></div>
  <div title="#a49cc7" style="background: #a49cc7;"></div>
  <div title="#f3eeea" style="background: #f3eeea;"></div>
  <div title="#f2a952" style="background: #f2a952;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div></div> <div></div>
  <div title="#8f83b7" style="background: #8f83b7;"></div>
  <div title="#dadbeb" style="background: #dadbeb;"></div>
  <div></div>
  <div title="#fce0ba" style="background: #fce0ba;"></div>
  <div title="#e8932f" style="background: #e8932f;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div></div> <div></div>
  <div title="#816fac" style="background: #816fac;"></div>
  <div title="#c4c1dd" style="background: #c4c1dd;"></div>
  <div title="#f3eeea" style="background: #f3eeea;"></div>
  <div title="#fbca8b" style="background: #fbca8b;"></div>
  <div title="#dc8524" style="background: #dc8524;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div></div>
  <div title="#7861a4" style="background: #7861a4;"></div>
  <div title="#b3add2" style="background: #b3add2;"></div>
  <div title="#e1e0eb" style="background: #e1e0eb;"></div>
  <div></div>
  <div title="#f9e4c8" style="background: #f9e4c8;"></div>
  <div title="#f8b96a" style="background: #f8b96a;"></div>
  <div title="#d47b1c" style="background: #d47b1c;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div></div>
  <div title="#70569e" style="background: #70569e;"></div>
  <div title="#a49cc7" style="background: #a49cc7;"></div>
  <div title="#d2d1e6" style="background: #d2d1e6;"></div>
  <div title="#f3eeea" style="background: #f3eeea;"></div>
  <div title="#fcd8a9" style="background: #fcd8a9;"></div>
  <div title="#f2a952" style="background: #f2a952;"></div>
  <div title="#ce7416" style="background: #ce7416;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#6b4e9a" style="background: #6b4e9a;"></div>
  <div title="#988ebe" style="background: #988ebe;"></div>
  <div title="#c4c1dd" style="background: #c4c1dd;"></div>
  <div title="#e5e3eb" style="background: #e5e3eb;"></div>
  <div></div>
  <div title="#f8e6cf" style="background: #f8e6cf;"></div>
  <div title="#fbca8b" style="background: #fbca8b;"></div>
  <div title="#ec9d3e" style="background: #ec9d3e;"></div>
  <div title="#c96e11" style="background: #c96e11;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#664796" style="background: #664796;"></div>
  <div title="#8f83b7" style="background: #8f83b7;"></div>
  <div title="#b9b4d6" style="background: #b9b4d6;"></div>
  <div title="#dadbeb" style="background: #dadbeb;"></div>
  <div title="#f3eeea" style="background: #f3eeea;"></div>
  <div title="#fce0ba" style="background: #fce0ba;"></div>
  <div title="#fbbf74" style="background: #fbbf74;"></div>
  <div title="#e8932f" style="background: #e8932f;"></div>
  <div title="#c5690d" style="background: #c5690d;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="redblue" href="#redblue">#</a> <strong>redblue</strong> <a class="toggle" href='javascript:toggle("#discrete-redblue")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-redblue">
      <stop offset="0%" stop-color="#8c0d25"></stop>
      <stop offset="10%" stop-color="#bf363a"></stop>
      <stop offset="20%" stop-color="#df745e"></stop>
      <stop offset="30%" stop-color="#f4ae91"></stop>
      <stop offset="40%" stop-color="#fbdbc9"></stop>
      <stop offset="50%" stop-color="#f2efee"></stop>
      <stop offset="60%" stop-color="#d2e5ef"></stop>
      <stop offset="70%" stop-color="#9dcae1"></stop>
      <stop offset="80%" stop-color="#5da2cb"></stop>
      <stop offset="90%" stop-color="#2f78b3"></stop>
      <stop offset="100%" stop-color="#134b85"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-redblue)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-redblue" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div></div> <div></div> <div></div> <div></div>
  <div title="#f2efee" style="background: #f2efee;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div></div> <div></div> <div></div>
  <div title="#f6bda4" style="background: #f6bda4;"></div>
  <div></div>
  <div title="#afd3e6" style="background: #afd3e6;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div></div> <div></div> <div></div>
  <div title="#ea9178" style="background: #ea9178;"></div>
  <div title="#f2efee" style="background: #f2efee;"></div>
  <div title="#7db6d6" style="background: #7db6d6;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div></div> <div></div>
  <div title="#df745e" style="background: #df745e;"></div>
  <div title="#fbdbc9" style="background: #fbdbc9;"></div>
  <div></div>
  <div title="#d2e5ef" style="background: #d2e5ef;"></div>
  <div title="#5da2cb" style="background: #5da2cb;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div></div> <div></div>
  <div title="#d45f52" style="background: #d45f52;"></div>
  <div title="#f6bda4" style="background: #f6bda4;"></div>
  <div title="#f2efee" style="background: #f2efee;"></div>
  <div title="#afd3e6" style="background: #afd3e6;"></div>
  <div title="#4e94c3" style="background: #4e94c3;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div></div>
  <div title="#cd5149" style="background: #cd5149;"></div>
  <div title="#f1a68a" style="background: #f1a68a;"></div>
  <div title="#f8e1d4" style="background: #f8e1d4;"></div>
  <div></div>
  <div title="#dbe8ef" style="background: #dbe8ef;"></div>
  <div title="#94c4de" style="background: #94c4de;"></div>
  <div title="#438abd" style="background: #438abd;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div></div>
  <div title="#c74643" style="background: #c74643;"></div>
  <div title="#ea9178" style="background: #ea9178;"></div>
  <div title="#f9d0bb" style="background: #f9d0bb;"></div>
  <div title="#f2efee" style="background: #f2efee;"></div>
  <div title="#c5deec" style="background: #c5deec;"></div>
  <div title="#7db6d6" style="background: #7db6d6;"></div>
  <div title="#3b83b9" style="background: #3b83b9;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#c33d3e" style="background: #c33d3e;"></div>
  <div title="#e48169" style="background: #e48169;"></div>
  <div title="#f6bda4" style="background: #f6bda4;"></div>
  <div title="#f7e4d9" style="background: #f7e4d9;"></div>
  <div></div>
  <div title="#e0e9ef" style="background: #e0e9ef;"></div>
  <div title="#afd3e6" style="background: #afd3e6;"></div>
  <div title="#6babd0" style="background: #6babd0;"></div>
  <div title="#347db6" style="background: #347db6;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#bf363a" style="background: #bf363a;"></div>
  <div title="#df745e" style="background: #df745e;"></div>
  <div title="#f4ae91" style="background: #f4ae91;"></div>
  <div title="#fbdbc9" style="background: #fbdbc9;"></div>
  <div title="#f2efee" style="background: #f2efee;"></div>
  <div title="#d2e5ef" style="background: #d2e5ef;"></div>
  <div title="#9dcae1" style="background: #9dcae1;"></div>
  <div title="#5da2cb" style="background: #5da2cb;"></div>
  <div title="#2f78b3" style="background: #2f78b3;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="redgrey" href="#redgrey">#</a> <strong>redgrey</strong> <a class="toggle" href='javascript:toggle("#discrete-redgrey")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-redgrey">
      <stop offset="0%" stop-color="#8c0d25"></stop>
      <stop offset="10%" stop-color="#bf363a"></stop>
      <stop offset="20%" stop-color="#df745e"></stop>
      <stop offset="30%" stop-color="#f4ae91"></stop>
      <stop offset="40%" stop-color="#fcdccb"></stop>
      <stop offset="50%" stop-color="#faf4f1"></stop>
      <stop offset="60%" stop-color="#e2e2e2"></stop>
      <stop offset="70%" stop-color="#c0c0c0"></stop>
      <stop offset="80%" stop-color="#969696"></stop>
      <stop offset="90%" stop-color="#646464"></stop>
      <stop offset="100%" stop-color="#343434"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-redgrey)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-redgrey" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div></div> <div></div> <div></div> <div></div>
  <div title="#faf4f1" style="background: #faf4f1;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div></div> <div></div> <div></div>
  <div title="#f7bda4" style="background: #f7bda4;"></div>
  <div></div>
  <div title="#cbcbcb" style="background: #cbcbcb;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div></div> <div></div> <div></div>
  <div title="#ea9178" style="background: #ea9178;"></div>
  <div title="#faf4f1" style="background: #faf4f1;"></div>
  <div title="#ababab" style="background: #ababab;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div></div> <div></div>
  <div title="#df745e" style="background: #df745e;"></div>
  <div title="#fcdccb" style="background: #fcdccb;"></div>
  <div></div>
  <div title="#e2e2e2" style="background: #e2e2e2;"></div>
  <div title="#969696" style="background: #969696;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div></div> <div></div>
  <div title="#d45f52" style="background: #d45f52;"></div>
  <div title="#f7bda4" style="background: #f7bda4;"></div>
  <div title="#faf4f1" style="background: #faf4f1;"></div>
  <div title="#cbcbcb" style="background: #cbcbcb;"></div>
  <div title="#858585" style="background: #858585;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div></div>
  <div title="#cd5149" style="background: #cd5149;"></div>
  <div title="#f1a68a" style="background: #f1a68a;"></div>
  <div title="#fbe3d6" style="background: #fbe3d6;"></div>
  <div></div>
  <div title="#e9e7e6" style="background: #e9e7e6;"></div>
  <div title="#bababa" style="background: #bababa;"></div>
  <div title="#797979" style="background: #797979;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div></div>
  <div title="#c74643" style="background: #c74643;"></div>
  <div title="#ea9178" style="background: #ea9178;"></div>
  <div title="#fad1bd" style="background: #fad1bd;"></div>
  <div title="#faf4f1" style="background: #faf4f1;"></div>
  <div title="#dadada" style="background: #dadada;"></div>
  <div title="#ababab" style="background: #ababab;"></div>
  <div title="#717171" style="background: #717171;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#c33d3e" style="background: #c33d3e;"></div>
  <div title="#e48169" style="background: #e48169;"></div>
  <div title="#f7bda4" style="background: #f7bda4;"></div>
  <div title="#fbe7dc" style="background: #fbe7dc;"></div>
  <div></div>
  <div title="#edeae9" style="background: #edeae9;"></div>
  <div title="#cbcbcb" style="background: #cbcbcb;"></div>
  <div title="#9f9f9f" style="background: #9f9f9f;"></div>
  <div title="#6a6a6a" style="background: #6a6a6a;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#bf363a" style="background: #bf363a;"></div>
  <div title="#df745e" style="background: #df745e;"></div>
  <div title="#f4ae91" style="background: #f4ae91;"></div>
  <div title="#fcdccb" style="background: #fcdccb;"></div>
  <div title="#faf4f1" style="background: #faf4f1;"></div>
  <div title="#e2e2e2" style="background: #e2e2e2;"></div>
  <div title="#c0c0c0" style="background: #c0c0c0;"></div>
  <div title="#969696" style="background: #969696;"></div>
  <div title="#646464" style="background: #646464;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="redyellowblue" href="#redyellowblue">#</a> <strong>redyellowblue</strong> <a class="toggle" href='javascript:toggle("#discrete-redyellowblue")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-redyellowblue">
      <stop offset="0%" stop-color="#a50026"></stop>
      <stop offset="10%" stop-color="#d4322c"></stop>
      <stop offset="20%" stop-color="#f16e43"></stop>
      <stop offset="30%" stop-color="#fcac64"></stop>
      <stop offset="40%" stop-color="#fedd90"></stop>
      <stop offset="50%" stop-color="#faf8c1"></stop>
      <stop offset="60%" stop-color="#dcf1ec"></stop>
      <stop offset="70%" stop-color="#abd6e8"></stop>
      <stop offset="80%" stop-color="#75abd0"></stop>
      <stop offset="90%" stop-color="#4a74b4"></stop>
      <stop offset="100%" stop-color="#313695"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-redyellowblue)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-redyellowblue" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div></div> <div></div> <div></div> <div></div>
  <div title="#faf8c1" style="background: #faf8c1;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div></div> <div></div> <div></div>
  <div title="#fdbc73" style="background: #fdbc73;"></div>
  <div></div>
  <div title="#bbdfe9" style="background: #bbdfe9;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div></div> <div></div> <div></div>
  <div title="#f78d54" style="background: #f78d54;"></div>
  <div title="#faf8c1" style="background: #faf8c1;"></div>
  <div title="#90c1dc" style="background: #90c1dc;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div></div> <div></div>
  <div title="#f16e43" style="background: #f16e43;"></div>
  <div title="#fedd90" style="background: #fedd90;"></div>
  <div></div>
  <div title="#dcf1ec" style="background: #dcf1ec;"></div>
  <div title="#75abd0" style="background: #75abd0;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div></div> <div></div>
  <div title="#e75a3b" style="background: #e75a3b;"></div>
  <div title="#fdbc73" style="background: #fdbc73;"></div>
  <div title="#faf8c1" style="background: #faf8c1;"></div>
  <div title="#bbdfe9" style="background: #bbdfe9;"></div>
  <div title="#6799c7" style="background: #6799c7;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div></div>
  <div title="#e04c36" style="background: #e04c36;"></div>
  <div title="#faa35f" style="background: #faa35f;"></div>
  <div title="#fde59e" style="background: #fde59e;"></div>
  <div></div>
  <div title="#e5f3e0" style="background: #e5f3e0;"></div>
  <div title="#a3d0e5" style="background: #a3d0e5;"></div>
  <div title="#5c8cc0" style="background: #5c8cc0;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div></div>
  <div title="#db4132" style="background: #db4132;"></div>
  <div title="#f78d54" style="background: #f78d54;"></div>
  <div title="#fed185" style="background: #fed185;"></div>
  <div title="#faf8c1" style="background: #faf8c1;"></div>
  <div title="#d0eaeb" style="background: #d0eaeb;"></div>
  <div title="#90c1dc" style="background: #90c1dc;"></div>
  <div title="#5582bb" style="background: #5582bb;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#d7392f" style="background: #d7392f;"></div>
  <div title="#f37c4a" style="background: #f37c4a;"></div>
  <div title="#fdbc73" style="background: #fdbc73;"></div>
  <div title="#fce9a6" style="background: #fce9a6;"></div>
  <div></div>
  <div title="#e9f4d9" style="background: #e9f4d9;"></div>
  <div title="#bbdfe9" style="background: #bbdfe9;"></div>
  <div title="#81b5d5" style="background: #81b5d5;"></div>
  <div title="#4f7ab7" style="background: #4f7ab7;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#d4322c" style="background: #d4322c;"></div>
  <div title="#f16e43" style="background: #f16e43;"></div>
  <div title="#fcac64" style="background: #fcac64;"></div>
  <div title="#fedd90" style="background: #fedd90;"></div>
  <div title="#faf8c1" style="background: #faf8c1;"></div>
  <div title="#dcf1ec" style="background: #dcf1ec;"></div>
  <div title="#abd6e8" style="background: #abd6e8;"></div>
  <div title="#75abd0" style="background: #75abd0;"></div>
  <div title="#4a74b4" style="background: #4a74b4;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="redyellowgreen" href="#redyellowgreen">#</a> <strong>redyellowgreen</strong> <a class="toggle" href='javascript:toggle("#discrete-redyellowgreen")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-redyellowgreen">
      <stop offset="0%" stop-color="#a50026"></stop>
      <stop offset="10%" stop-color="#d4322c"></stop>
      <stop offset="20%" stop-color="#f16e43"></stop>
      <stop offset="30%" stop-color="#fcac63"></stop>
      <stop offset="40%" stop-color="#fedd8d"></stop>
      <stop offset="50%" stop-color="#f9f7ae"></stop>
      <stop offset="60%" stop-color="#d7ee8e"></stop>
      <stop offset="70%" stop-color="#a4d86e"></stop>
      <stop offset="80%" stop-color="#64bc61"></stop>
      <stop offset="90%" stop-color="#22964f"></stop>
      <stop offset="100%" stop-color="#006837"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-redyellowgreen)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-redyellowgreen" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div></div> <div></div> <div></div> <div></div>
  <div title="#f9f7ae" style="background: #f9f7ae;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div></div> <div></div> <div></div>
  <div title="#fdbc71" style="background: #fdbc71;"></div>
  <div></div>
  <div title="#b5df79" style="background: #b5df79;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div></div> <div></div> <div></div>
  <div title="#f78d53" style="background: #f78d53;"></div>
  <div title="#f9f7ae" style="background: #f9f7ae;"></div>
  <div title="#84ca68" style="background: #84ca68;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div></div> <div></div>
  <div title="#f16e43" style="background: #f16e43;"></div>
  <div title="#fedd8d" style="background: #fedd8d;"></div>
  <div></div>
  <div title="#d7ee8e" style="background: #d7ee8e;"></div>
  <div title="#64bc61" style="background: #64bc61;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div></div> <div></div>
  <div title="#e75a3b" style="background: #e75a3b;"></div>
  <div title="#fdbc71" style="background: #fdbc71;"></div>
  <div title="#f9f7ae" style="background: #f9f7ae;"></div>
  <div title="#b5df79" style="background: #b5df79;"></div>
  <div title="#4eaf5b" style="background: #4eaf5b;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div></div>
  <div title="#e04c36" style="background: #e04c36;"></div>
  <div title="#faa35e" style="background: #faa35e;"></div>
  <div title="#fde496" style="background: #fde496;"></div>
  <div></div>
  <div title="#e1f197" style="background: #e1f197;"></div>
  <div title="#9bd46c" style="background: #9bd46c;"></div>
  <div title="#3ea657" style="background: #3ea657;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div></div>
  <div title="#db4132" style="background: #db4132;"></div>
  <div title="#f78d53" style="background: #f78d53;"></div>
  <div title="#fed183" style="background: #fed183;"></div>
  <div title="#f9f7ae" style="background: #f9f7ae;"></div>
  <div title="#cae986" style="background: #cae986;"></div>
  <div title="#84ca68" style="background: #84ca68;"></div>
  <div title="#33a054" style="background: #33a054;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#d7392f" style="background: #d7392f;"></div>
  <div title="#f37c4a" style="background: #f37c4a;"></div>
  <div title="#fdbc71" style="background: #fdbc71;"></div>
  <div title="#fce99c" style="background: #fce99c;"></div>
  <div></div>
  <div title="#e6f29c" style="background: #e6f29c;"></div>
  <div title="#b5df79" style="background: #b5df79;"></div>
  <div title="#72c264" style="background: #72c264;"></div>
  <div title="#299a51" style="background: #299a51;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#d4322c" style="background: #d4322c;"></div>
  <div title="#f16e43" style="background: #f16e43;"></div>
  <div title="#fcac63" style="background: #fcac63;"></div>
  <div title="#fedd8d" style="background: #fedd8d;"></div>
  <div title="#f9f7ae" style="background: #f9f7ae;"></div>
  <div title="#d7ee8e" style="background: #d7ee8e;"></div>
  <div title="#a4d86e" style="background: #a4d86e;"></div>
  <div title="#64bc61" style="background: #64bc61;"></div>
  <div title="#22964f" style="background: #22964f;"></div>
</div>
</div>
</div>

<div class="scheme continuous">
<a name="spectral" href="#spectral">#</a> <strong>spectral</strong> <a class="toggle" href='javascript:toggle("#discrete-spectral")'>View Discrete</a>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-spectral">
      <stop offset="0%" stop-color="#9e0142"></stop>
      <stop offset="10%" stop-color="#d13c4b"></stop>
      <stop offset="20%" stop-color="#f0704a"></stop>
      <stop offset="30%" stop-color="#fcac63"></stop>
      <stop offset="40%" stop-color="#fedd8d"></stop>
      <stop offset="50%" stop-color="#fbf8b0"></stop>
      <stop offset="60%" stop-color="#e0f3a1"></stop>
      <stop offset="70%" stop-color="#a9dda2"></stop>
      <stop offset="80%" stop-color="#69bda9"></stop>
      <stop offset="90%" stop-color="#4288b5"></stop>
      <stop offset="100%" stop-color="#5e4fa2"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-spectral)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div id="discrete-spectral" style="display: none;">
<div class="swatch">
  <strong>1</strong>
  <div></div> <div></div> <div></div> <div></div>
  <div title="#fbf8b0" style="background: #fbf8b0;"></div>
</div>
<div class="swatch">
  <strong>2</strong>
  <div></div> <div></div> <div></div>
  <div title="#fdbc71" style="background: #fdbc71;"></div>
  <div></div>
  <div title="#bbe4a2" style="background: #bbe4a2;"></div>
</div>
<div class="swatch">
  <strong>3</strong>
  <div></div> <div></div> <div></div>
  <div title="#f68e57" style="background: #f68e57;"></div>
  <div title="#fbf8b0" style="background: #fbf8b0;"></div>
  <div title="#89cda6" style="background: #89cda6;"></div>
</div>
<div class="swatch">
  <strong>4</strong>
  <div></div> <div></div>
  <div title="#f0704a" style="background: #f0704a;"></div>
  <div title="#fedd8d" style="background: #fedd8d;"></div>
  <div></div>
  <div title="#e0f3a1" style="background: #e0f3a1;"></div>
  <div title="#69bda9" style="background: #69bda9;"></div>
</div>
<div class="swatch">
  <strong>5</strong>
  <div></div> <div></div>
  <div title="#e65f4a" style="background: #e65f4a;"></div>
  <div title="#fdbc71" style="background: #fdbc71;"></div>
  <div title="#fbf8b0" style="background: #fbf8b0;"></div>
  <div title="#bbe4a2" style="background: #bbe4a2;"></div>
  <div title="#5cabad" style="background: #5cabad;"></div>
</div>
<div class="swatch">
  <strong>6</strong>
  <div></div>
  <div title="#de524b" style="background: #de524b;"></div>
  <div title="#faa35f" style="background: #faa35f;"></div>
  <div title="#fde597" style="background: #fde597;"></div>
  <div></div>
  <div title="#e8f4a5" style="background: #e8f4a5;"></div>
  <div title="#a0d8a3" style="background: #a0d8a3;"></div>
  <div title="#539fb0" style="background: #539fb0;"></div>
</div>
<div class="swatch">
  <strong>7</strong>
  <div></div>
  <div title="#d9494b" style="background: #d9494b;"></div>
  <div title="#f68e57" style="background: #f68e57;"></div>
  <div title="#fed183" style="background: #fed183;"></div>
  <div title="#fbf8b0" style="background: #fbf8b0;"></div>
  <div title="#d2eea1" style="background: #d2eea1;"></div>
  <div title="#89cda6" style="background: #89cda6;"></div>
  <div title="#4c95b2" style="background: #4c95b2;"></div>
</div>
<div class="swatch">
  <strong>8</strong>
  <div title="#d4424b" style="background: #d4424b;"></div>
  <div title="#f37d50" style="background: #f37d50;"></div>
  <div title="#fdbc71" style="background: #fdbc71;"></div>
  <div title="#fde99d" style="background: #fde99d;"></div>
  <div></div>
  <div title="#ecf5a8" style="background: #ecf5a8;"></div>
  <div title="#bbe4a2" style="background: #bbe4a2;"></div>
  <div title="#77c4a7" style="background: #77c4a7;"></div>
  <div title="#468eb4" style="background: #468eb4;"></div>
</div>
<div class="swatch">
  <strong>9</strong>
  <div title="#d13c4b" style="background: #d13c4b;"></div>
  <div title="#f0704a" style="background: #f0704a;"></div>
  <div title="#fcac63" style="background: #fcac63;"></div>
  <div title="#fedd8d" style="background: #fedd8d;"></div>
  <div title="#fbf8b0" style="background: #fbf8b0;"></div>
  <div title="#e0f3a1" style="background: #e0f3a1;"></div>
  <div title="#a9dda2" style="background: #a9dda2;"></div>
  <div title="#69bda9" style="background: #69bda9;"></div>
  <div title="#4288b5" style="background: #4288b5;"></div>
</div>
</div>
</div>


### <a name="cyclical"></a>Cyclical Schemes

Cyclical color schemes may be used to highlight periodic patterns in continuous data. However, these schemes are not well suited to accurately convey value differences.

<div class="scheme continuous">
<a name="rainbow" href="#rainbow">#</a> <strong>rainbow</strong> {% include tag ver="4.0" %}
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-rainbow">
      <stop offset="0%" stop-color="#6e40aa"></stop>
      <stop offset="10%" stop-color="#bf3caf"></stop>
      <stop offset="20%" stop-color="#fe4b83"></stop>
      <stop offset="30%" stop-color="#ff7847"></stop>
      <stop offset="40%" stop-color="#e2b72f"></stop>
      <stop offset="50%" stop-color="#aff05b"></stop>
      <stop offset="60%" stop-color="#52f667"></stop>
      <stop offset="70%" stop-color="#1ddfa3"></stop>
      <stop offset="80%" stop-color="#23abd8"></stop>
      <stop offset="90%" stop-color="#4c6edb"></stop>
      <stop offset="100%" stop-color="#6e40aa"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-rainbow)" x="0" y="0" width="1" height="1"></rect>
</svg>
</div>

<div class="scheme continuous">
<a name="sinebow" href="#sinebow">#</a> <strong>sinebow</strong> {% include tag ver="4.0" %}
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-sinebow">
      <stop offset="0%" stop-color="#ff4040"></stop>
      <stop offset="10%" stop-color="#e78d0b"></stop>
      <stop offset="20%" stop-color="#a7d503"></stop>
      <stop offset="30%" stop-color="#58fc2a"></stop>
      <stop offset="40%" stop-color="#18f472"></stop>
      <stop offset="50%" stop-color="#00bfbf"></stop>
      <stop offset="60%" stop-color="#1872f4"></stop>
      <stop offset="70%" stop-color="#582afc"></stop>
      <stop offset="80%" stop-color="#a703d5"></stop>
      <stop offset="90%" stop-color="#e70b8d"></stop>
      <stop offset="100%" stop-color="#ff4040"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-sinebow)" x="0" y="0" width="1" height="1"></rect>
</svg>
</div>
