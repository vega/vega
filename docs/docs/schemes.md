---
layout: spec
title: Color Schemes
permalink: /docs/schemes/index.html
---

Color **schemes** provide a set of named color palettes for both discrete and continuous color encodings. Vega provides a collection of perceptually-motivated color schemes, many of which are drawn from the [d3-scale](https://github.com/d3/d3-scale), [d3-scale-chromatic](https://github.com/d3/d3-scale-chromatic), and [ColorBrewer](http://colorbrewer2.org/) projects. To view and set default color schemes, see the [Config documentation](../config/#scale-range).

Discrete color schemes may be used with scales that have discrete (or discretizing) domains, such as [`ordinal`](../scales/#ordinal), [`quantize`](../scales/#quantize) and [`quantile`](../scales/#quantile) scales. Continuous color schemes are intended for use with [`sequential`](../scales/#sequential) scales.

## Scheme Properties

Properties supported by color scheme definitions. These objects can be assigned to a scale's _range_ property. If a scale definition includes the property `"reverse": true`, the color scheme order will be flipped.

| Property      | Type                          | Description    |
| :------------ | :---------------------------: | :------------- |
| scheme        | {% include type t="String" %} | {% include required %} The name of the color scheme to use. See the [scheme reference](#reference) below.|
| count         | {% include type t="Number" %} | The number of colors to use in the scheme. This can be useful for scale types such as `quantize`, which use the length of the scale range to determine the number of discrete bins for the scale domain. |
| extent        | {% include type t="Number[]" %} | For sequential and diverging schemes only, determines the extent of the color range to use. For example `[0.2, 1]` will rescale the color scheme such that color values in the range [0, 0.2) are excluded from the scheme. |

## Registering Additional Schemes

Vega can be extended with additional color schemes using the [`vega.scheme`](https://github.com/vega/vega-scale/#scheme) method. New schemes must be a valid color array or [interpolator](https://github.com/d3/d3-scale#sequential_interpolator). For example:

```js
// Register a color scheme named "basic" that can then be used in Vega specs
vega.scheme('basic', ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff']);
```

## <a name="reference"></a>Scheme Reference

- [**Categorical**](#categorical)
- [**Sequential Single-Hue**](#seq-single-hue)
- [**Sequential Multi-Hue**](#seq-multi-hue)
- [**Diverging**](#diverging)


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

Sequential color schemes can be used to encode quantitative values. These color ramps are designed to encode increasing numerical values. These schemes include both continuous color palettes, and a limited set of discrete palettes with a suffix that indicates the desired number of colors.

<div class="scheme">
<a name="blues" href="#blues">#</a> <strong>blues</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-blues">
      <stop offset="0%" stop-color="rgb(247, 251, 255)"></stop>
      <stop offset="10%" stop-color="rgb(227, 238, 249)"></stop>
      <stop offset="20%" stop-color="rgb(207, 225, 242)"></stop>
      <stop offset="30%" stop-color="rgb(181, 212, 233)"></stop>
      <stop offset="40%" stop-color="rgb(147, 195, 223)"></stop>
      <stop offset="50%" stop-color="rgb(109, 174, 213)"></stop>
      <stop offset="60%" stop-color="rgb(75, 151, 201)"></stop>
      <stop offset="70%" stop-color="rgb(47, 126, 188)"></stop>
      <stop offset="80%" stop-color="rgb(24, 100, 170)"></stop>
      <stop offset="90%" stop-color="rgb(10, 74, 144)"></stop>
      <stop offset="100%" stop-color="rgb(8, 48, 107)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-blues)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>blues-3</strong>
  <div title="#deebf7" style="background: rgb(222, 235, 247);"></div>
  <div title="#9ecae1" style="background: rgb(158, 202, 225);"></div>
  <div title="#3182bd" style="background: rgb(49, 130, 189);"></div>
</div>
<div class="swatch">
  <strong>blues-4</strong>
  <div title="#eff3ff" style="background: rgb(239, 243, 255);"></div>
  <div title="#bdd7e7" style="background: rgb(189, 215, 231);"></div>
  <div title="#6baed6" style="background: rgb(107, 174, 214);"></div>
  <div title="#2171b5" style="background: rgb(33, 113, 181);"></div>
</div>
<div class="swatch">
  <strong>blues-5</strong>
  <div title="#eff3ff" style="background: rgb(239, 243, 255);"></div>
  <div title="#bdd7e7" style="background: rgb(189, 215, 231);"></div>
  <div title="#6baed6" style="background: rgb(107, 174, 214);"></div>
  <div title="#3182bd" style="background: rgb(49, 130, 189);"></div>
  <div title="#08519c" style="background: rgb(8, 81, 156);"></div>
</div>
<div class="swatch">
  <strong>blues-6</strong>
  <div title="#eff3ff" style="background: rgb(239, 243, 255);"></div>
  <div title="#c6dbef" style="background: rgb(198, 219, 239);"></div>
  <div title="#9ecae1" style="background: rgb(158, 202, 225);"></div>
  <div title="#6baed6" style="background: rgb(107, 174, 214);"></div>
  <div title="#3182bd" style="background: rgb(49, 130, 189);"></div>
  <div title="#08519c" style="background: rgb(8, 81, 156);"></div>
</div>
<div class="swatch">
  <strong>blues-7</strong>
  <div title="#eff3ff" style="background: rgb(239, 243, 255);"></div>
  <div title="#c6dbef" style="background: rgb(198, 219, 239);"></div>
  <div title="#9ecae1" style="background: rgb(158, 202, 225);"></div>
  <div title="#6baed6" style="background: rgb(107, 174, 214);"></div>
  <div title="#4292c6" style="background: rgb(66, 146, 198);"></div>
  <div title="#2171b5" style="background: rgb(33, 113, 181);"></div>
  <div title="#084594" style="background: rgb(8, 69, 148);"></div>
</div>
<div class="swatch">
  <strong>blues-8</strong>
  <div title="#f7fbff" style="background: rgb(247, 251, 255);"></div>
  <div title="#deebf7" style="background: rgb(222, 235, 247);"></div>
  <div title="#c6dbef" style="background: rgb(198, 219, 239);"></div>
  <div title="#9ecae1" style="background: rgb(158, 202, 225);"></div>
  <div title="#6baed6" style="background: rgb(107, 174, 214);"></div>
  <div title="#4292c6" style="background: rgb(66, 146, 198);"></div>
  <div title="#2171b5" style="background: rgb(33, 113, 181);"></div>
  <div title="#084594" style="background: rgb(8, 69, 148);"></div>
</div>
<div class="swatch">
  <strong>blues-9</strong>
  <div title="#f7fbff" style="background: rgb(247, 251, 255);"></div>
  <div title="#deebf7" style="background: rgb(222, 235, 247);"></div>
  <div title="#c6dbef" style="background: rgb(198, 219, 239);"></div>
  <div title="#9ecae1" style="background: rgb(158, 202, 225);"></div>
  <div title="#6baed6" style="background: rgb(107, 174, 214);"></div>
  <div title="#4292c6" style="background: rgb(66, 146, 198);"></div>
  <div title="#2171b5" style="background: rgb(33, 113, 181);"></div>
  <div title="#08519c" style="background: rgb(8, 81, 156);"></div>
  <div title="#08306b" style="background: rgb(8, 48, 107);"></div>
</div>
</div>

<div class="scheme">
<a name="greens" href="#greens">#</a> <strong>greens</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-greens">
      <stop offset="0%" stop-color="rgb(247, 252, 245)"></stop>
      <stop offset="10%" stop-color="rgb(232, 246, 227)"></stop>
      <stop offset="20%" stop-color="rgb(211, 238, 205)"></stop>
      <stop offset="30%" stop-color="rgb(183, 226, 177)"></stop>
      <stop offset="40%" stop-color="rgb(151, 212, 148)"></stop>
      <stop offset="50%" stop-color="rgb(115, 195, 120)"></stop>
      <stop offset="60%" stop-color="rgb(77, 175, 98)"></stop>
      <stop offset="70%" stop-color="rgb(47, 152, 79)"></stop>
      <stop offset="80%" stop-color="rgb(21, 127, 59)"></stop>
      <stop offset="90%" stop-color="rgb(3, 100, 41)"></stop>
      <stop offset="100%" stop-color="rgb(0, 68, 27)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-greens)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>greens-3</strong>
  <div title="#e5f5e0" style="background: rgb(229, 245, 224);"></div>
  <div title="#a1d99b" style="background: rgb(161, 217, 155);"></div>
  <div title="#31a354" style="background: rgb(49, 163, 84);"></div>
</div>
<div class="swatch">
  <strong>greens-4</strong>
  <div title="#edf8e9" style="background: rgb(237, 248, 233);"></div>
  <div title="#bae4b3" style="background: rgb(186, 228, 179);"></div>
  <div title="#74c476" style="background: rgb(116, 196, 118);"></div>
  <div title="#238b45" style="background: rgb(35, 139, 69);"></div>
</div>
<div class="swatch">
  <strong>greens-5</strong>
  <div title="#edf8e9" style="background: rgb(237, 248, 233);"></div>
  <div title="#bae4b3" style="background: rgb(186, 228, 179);"></div>
  <div title="#74c476" style="background: rgb(116, 196, 118);"></div>
  <div title="#31a354" style="background: rgb(49, 163, 84);"></div>
  <div title="#006d2c" style="background: rgb(0, 109, 44);"></div>
</div>
<div class="swatch">
  <strong>greens-6</strong>
  <div title="#edf8e9" style="background: rgb(237, 248, 233);"></div>
  <div title="#c7e9c0" style="background: rgb(199, 233, 192);"></div>
  <div title="#a1d99b" style="background: rgb(161, 217, 155);"></div>
  <div title="#74c476" style="background: rgb(116, 196, 118);"></div>
  <div title="#31a354" style="background: rgb(49, 163, 84);"></div>
  <div title="#006d2c" style="background: rgb(0, 109, 44);"></div>
</div>
<div class="swatch">
  <strong>greens-7</strong>
  <div title="#edf8e9" style="background: rgb(237, 248, 233);"></div>
  <div title="#c7e9c0" style="background: rgb(199, 233, 192);"></div>
  <div title="#a1d99b" style="background: rgb(161, 217, 155);"></div>
  <div title="#74c476" style="background: rgb(116, 196, 118);"></div>
  <div title="#41ab5d" style="background: rgb(65, 171, 93);"></div>
  <div title="#238b45" style="background: rgb(35, 139, 69);"></div>
  <div title="#005a32" style="background: rgb(0, 90, 50);"></div>
</div>
<div class="swatch">
  <strong>greens-8</strong>
  <div title="#f7fcf5" style="background: rgb(247, 252, 245);"></div>
  <div title="#e5f5e0" style="background: rgb(229, 245, 224);"></div>
  <div title="#c7e9c0" style="background: rgb(199, 233, 192);"></div>
  <div title="#a1d99b" style="background: rgb(161, 217, 155);"></div>
  <div title="#74c476" style="background: rgb(116, 196, 118);"></div>
  <div title="#41ab5d" style="background: rgb(65, 171, 93);"></div>
  <div title="#238b45" style="background: rgb(35, 139, 69);"></div>
  <div title="#005a32" style="background: rgb(0, 90, 50);"></div>
</div>
<div class="swatch">
  <strong>greens-9</strong>
  <div title="#f7fcf5" style="background: rgb(247, 252, 245);"></div>
  <div title="#e5f5e0" style="background: rgb(229, 245, 224);"></div>
  <div title="#c7e9c0" style="background: rgb(199, 233, 192);"></div>
  <div title="#a1d99b" style="background: rgb(161, 217, 155);"></div>
  <div title="#74c476" style="background: rgb(116, 196, 118);"></div>
  <div title="#41ab5d" style="background: rgb(65, 171, 93);"></div>
  <div title="#238b45" style="background: rgb(35, 139, 69);"></div>
  <div title="#006d2c" style="background: rgb(0, 109, 44);"></div>
  <div title="#00441b" style="background: rgb(0, 68, 27);"></div>
</div>
</div>

<div class="scheme">
<a name="greys" href="#greys">#</a> <strong>greys</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-greys">
      <stop offset="0%" stop-color="rgb(255, 255, 255)"></stop>
      <stop offset="10%" stop-color="rgb(242, 242, 242)"></stop>
      <stop offset="20%" stop-color="rgb(226, 226, 226)"></stop>
      <stop offset="30%" stop-color="rgb(206, 206, 206)"></stop>
      <stop offset="40%" stop-color="rgb(180, 180, 180)"></stop>
      <stop offset="50%" stop-color="rgb(151, 151, 151)"></stop>
      <stop offset="60%" stop-color="rgb(122, 122, 122)"></stop>
      <stop offset="70%" stop-color="rgb(95, 95, 95)"></stop>
      <stop offset="80%" stop-color="rgb(64, 64, 64)"></stop>
      <stop offset="90%" stop-color="rgb(30, 30, 30)"></stop>
      <stop offset="100%" stop-color="rgb(0, 0, 0)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-greys)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>greys-3</strong>
  <div title="#f0f0f0" style="background: rgb(240, 240, 240);"></div>
  <div title="#bdbdbd" style="background: rgb(189, 189, 189);"></div>
  <div title="#636363" style="background: rgb(99, 99, 99);"></div>
</div>
<div class="swatch">
  <strong>greys-4</strong>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#cccccc" style="background: rgb(204, 204, 204);"></div>
  <div title="#969696" style="background: rgb(150, 150, 150);"></div>
  <div title="#525252" style="background: rgb(82, 82, 82);"></div>
</div>
<div class="swatch">
  <strong>greys-5</strong>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#cccccc" style="background: rgb(204, 204, 204);"></div>
  <div title="#969696" style="background: rgb(150, 150, 150);"></div>
  <div title="#636363" style="background: rgb(99, 99, 99);"></div>
  <div title="#252525" style="background: rgb(37, 37, 37);"></div>
</div>
<div class="swatch">
  <strong>greys-6</strong>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#d9d9d9" style="background: rgb(217, 217, 217);"></div>
  <div title="#bdbdbd" style="background: rgb(189, 189, 189);"></div>
  <div title="#969696" style="background: rgb(150, 150, 150);"></div>
  <div title="#636363" style="background: rgb(99, 99, 99);"></div>
  <div title="#252525" style="background: rgb(37, 37, 37);"></div>
</div>
<div class="swatch">
  <strong>greys-7</strong>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#d9d9d9" style="background: rgb(217, 217, 217);"></div>
  <div title="#bdbdbd" style="background: rgb(189, 189, 189);"></div>
  <div title="#969696" style="background: rgb(150, 150, 150);"></div>
  <div title="#737373" style="background: rgb(115, 115, 115);"></div>
  <div title="#525252" style="background: rgb(82, 82, 82);"></div>
  <div title="#252525" style="background: rgb(37, 37, 37);"></div>
</div>
<div class="swatch">
  <strong>greys-8</strong>
  <div title="#ffffff" style="background: rgb(255, 255, 255);"></div>
  <div title="#f0f0f0" style="background: rgb(240, 240, 240);"></div>
  <div title="#d9d9d9" style="background: rgb(217, 217, 217);"></div>
  <div title="#bdbdbd" style="background: rgb(189, 189, 189);"></div>
  <div title="#969696" style="background: rgb(150, 150, 150);"></div>
  <div title="#737373" style="background: rgb(115, 115, 115);"></div>
  <div title="#525252" style="background: rgb(82, 82, 82);"></div>
  <div title="#252525" style="background: rgb(37, 37, 37);"></div>
</div>
<div class="swatch">
  <strong>greys-9</strong>
  <div title="#ffffff" style="background: rgb(255, 255, 255);"></div>
  <div title="#f0f0f0" style="background: rgb(240, 240, 240);"></div>
  <div title="#d9d9d9" style="background: rgb(217, 217, 217);"></div>
  <div title="#bdbdbd" style="background: rgb(189, 189, 189);"></div>
  <div title="#969696" style="background: rgb(150, 150, 150);"></div>
  <div title="#737373" style="background: rgb(115, 115, 115);"></div>
  <div title="#525252" style="background: rgb(82, 82, 82);"></div>
  <div title="#252525" style="background: rgb(37, 37, 37);"></div>
  <div title="#000000" style="background: rgb(0, 0, 0);"></div>
</div>
</div>

<div class="scheme">
<a name="purples" href="#purples">#</a> <strong>purples</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-purples">
      <stop offset="0%" stop-color="rgb(252, 251, 253)"></stop>
      <stop offset="10%" stop-color="rgb(241, 239, 246)"></stop>
      <stop offset="20%" stop-color="rgb(226, 225, 239)"></stop>
      <stop offset="30%" stop-color="rgb(206, 206, 229)"></stop>
      <stop offset="40%" stop-color="rgb(182, 181, 216)"></stop>
      <stop offset="50%" stop-color="rgb(158, 155, 201)"></stop>
      <stop offset="60%" stop-color="rgb(135, 130, 188)"></stop>
      <stop offset="70%" stop-color="rgb(115, 99, 172)"></stop>
      <stop offset="80%" stop-color="rgb(97, 64, 155)"></stop>
      <stop offset="90%" stop-color="rgb(80, 31, 140)"></stop>
      <stop offset="100%" stop-color="rgb(63, 0, 125)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-purples)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>purples-3</strong>
  <div title="#efedf5" style="background: rgb(239, 237, 245);"></div>
  <div title="#bcbddc" style="background: rgb(188, 189, 220);"></div>
  <div title="#756bb1" style="background: rgb(117, 107, 177);"></div>
</div>
<div class="swatch">
  <strong>purples-4</strong>
  <div title="#f2f0f7" style="background: rgb(242, 240, 247);"></div>
  <div title="#cbc9e2" style="background: rgb(203, 201, 226);"></div>
  <div title="#9e9ac8" style="background: rgb(158, 154, 200);"></div>
  <div title="#6a51a3" style="background: rgb(106, 81, 163);"></div>
</div>
<div class="swatch">
  <strong>purples-5</strong>
  <div title="#f2f0f7" style="background: rgb(242, 240, 247);"></div>
  <div title="#cbc9e2" style="background: rgb(203, 201, 226);"></div>
  <div title="#9e9ac8" style="background: rgb(158, 154, 200);"></div>
  <div title="#756bb1" style="background: rgb(117, 107, 177);"></div>
  <div title="#54278f" style="background: rgb(84, 39, 143);"></div>
</div>
<div class="swatch">
  <strong>purples-6</strong>
  <div title="#f2f0f7" style="background: rgb(242, 240, 247);"></div>
  <div title="#dadaeb" style="background: rgb(218, 218, 235);"></div>
  <div title="#bcbddc" style="background: rgb(188, 189, 220);"></div>
  <div title="#9e9ac8" style="background: rgb(158, 154, 200);"></div>
  <div title="#756bb1" style="background: rgb(117, 107, 177);"></div>
  <div title="#54278f" style="background: rgb(84, 39, 143);"></div>
</div>
<div class="swatch">
  <strong>purples-7</strong>
  <div title="#f2f0f7" style="background: rgb(242, 240, 247);"></div>
  <div title="#dadaeb" style="background: rgb(218, 218, 235);"></div>
  <div title="#bcbddc" style="background: rgb(188, 189, 220);"></div>
  <div title="#9e9ac8" style="background: rgb(158, 154, 200);"></div>
  <div title="#807dba" style="background: rgb(128, 125, 186);"></div>
  <div title="#6a51a3" style="background: rgb(106, 81, 163);"></div>
  <div title="#4a1486" style="background: rgb(74, 20, 134);"></div>
</div>
<div class="swatch">
  <strong>purples-8</strong>
  <div title="#fcfbfd" style="background: rgb(252, 251, 253);"></div>
  <div title="#efedf5" style="background: rgb(239, 237, 245);"></div>
  <div title="#dadaeb" style="background: rgb(218, 218, 235);"></div>
  <div title="#bcbddc" style="background: rgb(188, 189, 220);"></div>
  <div title="#9e9ac8" style="background: rgb(158, 154, 200);"></div>
  <div title="#807dba" style="background: rgb(128, 125, 186);"></div>
  <div title="#6a51a3" style="background: rgb(106, 81, 163);"></div>
  <div title="#4a1486" style="background: rgb(74, 20, 134);"></div>
</div>
<div class="swatch">
  <strong>purples-9</strong>
  <div title="#fcfbfd" style="background: rgb(252, 251, 253);"></div>
  <div title="#efedf5" style="background: rgb(239, 237, 245);"></div>
  <div title="#dadaeb" style="background: rgb(218, 218, 235);"></div>
  <div title="#bcbddc" style="background: rgb(188, 189, 220);"></div>
  <div title="#9e9ac8" style="background: rgb(158, 154, 200);"></div>
  <div title="#807dba" style="background: rgb(128, 125, 186);"></div>
  <div title="#6a51a3" style="background: rgb(106, 81, 163);"></div>
  <div title="#54278f" style="background: rgb(84, 39, 143);"></div>
  <div title="#3f007d" style="background: rgb(63, 0, 125);"></div>
</div>
</div>

<div class="scheme">
<a name="reds" href="#reds">#</a> <strong>reds</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-reds">
      <stop offset="0%" stop-color="rgb(255, 245, 240)"></stop>
      <stop offset="10%" stop-color="rgb(254, 227, 214)"></stop>
      <stop offset="20%" stop-color="rgb(253, 201, 180)"></stop>
      <stop offset="30%" stop-color="rgb(252, 170, 142)"></stop>
      <stop offset="40%" stop-color="rgb(252, 138, 107)"></stop>
      <stop offset="50%" stop-color="rgb(249, 105, 76)"></stop>
      <stop offset="60%" stop-color="rgb(239, 69, 51)"></stop>
      <stop offset="70%" stop-color="rgb(217, 39, 35)"></stop>
      <stop offset="80%" stop-color="rgb(187, 21, 26)"></stop>
      <stop offset="90%" stop-color="rgb(151, 11, 19)"></stop>
      <stop offset="100%" stop-color="rgb(103, 0, 13)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-reds)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>reds-3</strong>
  <div title="#fee0d2" style="background: rgb(254, 224, 210);"></div>
  <div title="#fc9272" style="background: rgb(252, 146, 114);"></div>
  <div title="#de2d26" style="background: rgb(222, 45, 38);"></div>
</div>
<div class="swatch">
  <strong>reds-4</strong>
  <div title="#fee5d9" style="background: rgb(254, 229, 217);"></div>
  <div title="#fcae91" style="background: rgb(252, 174, 145);"></div>
  <div title="#fb6a4a" style="background: rgb(251, 106, 74);"></div>
  <div title="#cb181d" style="background: rgb(203, 24, 29);"></div>
</div>
<div class="swatch">
  <strong>reds-5</strong>
  <div title="#fee5d9" style="background: rgb(254, 229, 217);"></div>
  <div title="#fcae91" style="background: rgb(252, 174, 145);"></div>
  <div title="#fb6a4a" style="background: rgb(251, 106, 74);"></div>
  <div title="#de2d26" style="background: rgb(222, 45, 38);"></div>
  <div title="#a50f15" style="background: rgb(165, 15, 21);"></div>
</div>
<div class="swatch">
  <strong>reds-6</strong>
  <div title="#fee5d9" style="background: rgb(254, 229, 217);"></div>
  <div title="#fcbba1" style="background: rgb(252, 187, 161);"></div>
  <div title="#fc9272" style="background: rgb(252, 146, 114);"></div>
  <div title="#fb6a4a" style="background: rgb(251, 106, 74);"></div>
  <div title="#de2d26" style="background: rgb(222, 45, 38);"></div>
  <div title="#a50f15" style="background: rgb(165, 15, 21);"></div>
</div>
<div class="swatch">
  <strong>reds-7</strong>
  <div title="#fee5d9" style="background: rgb(254, 229, 217);"></div>
  <div title="#fcbba1" style="background: rgb(252, 187, 161);"></div>
  <div title="#fc9272" style="background: rgb(252, 146, 114);"></div>
  <div title="#fb6a4a" style="background: rgb(251, 106, 74);"></div>
  <div title="#ef3b2c" style="background: rgb(239, 59, 44);"></div>
  <div title="#cb181d" style="background: rgb(203, 24, 29);"></div>
  <div title="#99000d" style="background: rgb(153, 0, 13);"></div>
</div>
<div class="swatch">
  <strong>reds-8</strong>
  <div title="#fff5f0" style="background: rgb(255, 245, 240);"></div>
  <div title="#fee0d2" style="background: rgb(254, 224, 210);"></div>
  <div title="#fcbba1" style="background: rgb(252, 187, 161);"></div>
  <div title="#fc9272" style="background: rgb(252, 146, 114);"></div>
  <div title="#fb6a4a" style="background: rgb(251, 106, 74);"></div>
  <div title="#ef3b2c" style="background: rgb(239, 59, 44);"></div>
  <div title="#cb181d" style="background: rgb(203, 24, 29);"></div>
  <div title="#99000d" style="background: rgb(153, 0, 13);"></div>
</div>
<div class="swatch">
  <strong>reds-9</strong>
  <div title="#fff5f0" style="background: rgb(255, 245, 240);"></div>
  <div title="#fee0d2" style="background: rgb(254, 224, 210);"></div>
  <div title="#fcbba1" style="background: rgb(252, 187, 161);"></div>
  <div title="#fc9272" style="background: rgb(252, 146, 114);"></div>
  <div title="#fb6a4a" style="background: rgb(251, 106, 74);"></div>
  <div title="#ef3b2c" style="background: rgb(239, 59, 44);"></div>
  <div title="#cb181d" style="background: rgb(203, 24, 29);"></div>
  <div title="#a50f15" style="background: rgb(165, 15, 21);"></div>
  <div title="#67000d" style="background: rgb(103, 0, 13);"></div>
</div>
</div>

<div class="scheme">
<a name="oranges" href="#oranges">#</a> <strong>oranges</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-oranges">
      <stop offset="0%" stop-color="rgb(255, 245, 235)"></stop>
      <stop offset="10%" stop-color="rgb(254, 232, 211)"></stop>
      <stop offset="20%" stop-color="rgb(253, 216, 179)"></stop>
      <stop offset="30%" stop-color="rgb(253, 194, 140)"></stop>
      <stop offset="40%" stop-color="rgb(253, 167, 98)"></stop>
      <stop offset="50%" stop-color="rgb(251, 141, 61)"></stop>
      <stop offset="60%" stop-color="rgb(242, 112, 29)"></stop>
      <stop offset="70%" stop-color="rgb(226, 86, 9)"></stop>
      <stop offset="80%" stop-color="rgb(196, 65, 3)"></stop>
      <stop offset="90%" stop-color="rgb(159, 51, 3)"></stop>
      <stop offset="100%" stop-color="rgb(127, 39, 4)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-oranges)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>oranges-3</strong>
  <div title="#fee6ce" style="background: rgb(254, 230, 206);"></div>
  <div title="#fdae6b" style="background: rgb(253, 174, 107);"></div>
  <div title="#e6550d" style="background: rgb(230, 85, 13);"></div>
</div>
<div class="swatch">
  <strong>oranges-4</strong>
  <div title="#feedde" style="background: rgb(254, 237, 222);"></div>
  <div title="#fdbe85" style="background: rgb(253, 190, 133);"></div>
  <div title="#fd8d3c" style="background: rgb(253, 141, 60);"></div>
  <div title="#d94701" style="background: rgb(217, 71, 1);"></div>
</div>
<div class="swatch">
  <strong>oranges-5</strong>
  <div title="#feedde" style="background: rgb(254, 237, 222);"></div>
  <div title="#fdbe85" style="background: rgb(253, 190, 133);"></div>
  <div title="#fd8d3c" style="background: rgb(253, 141, 60);"></div>
  <div title="#e6550d" style="background: rgb(230, 85, 13);"></div>
  <div title="#a63603" style="background: rgb(166, 54, 3);"></div>
</div>
<div class="swatch">
  <strong>oranges-6</strong>
  <div title="#feedde" style="background: rgb(254, 237, 222);"></div>
  <div title="#fdd0a2" style="background: rgb(253, 208, 162);"></div>
  <div title="#fdae6b" style="background: rgb(253, 174, 107);"></div>
  <div title="#fd8d3c" style="background: rgb(253, 141, 60);"></div>
  <div title="#e6550d" style="background: rgb(230, 85, 13);"></div>
  <div title="#a63603" style="background: rgb(166, 54, 3);"></div>
</div>
<div class="swatch">
  <strong>oranges-7</strong>
  <div title="#feedde" style="background: rgb(254, 237, 222);"></div>
  <div title="#fdd0a2" style="background: rgb(253, 208, 162);"></div>
  <div title="#fdae6b" style="background: rgb(253, 174, 107);"></div>
  <div title="#fd8d3c" style="background: rgb(253, 141, 60);"></div>
  <div title="#f16913" style="background: rgb(241, 105, 19);"></div>
  <div title="#d94801" style="background: rgb(217, 72, 1);"></div>
  <div title="#8c2d04" style="background: rgb(140, 45, 4);"></div>
</div>
<div class="swatch">
  <strong>oranges-8</strong>
  <div title="#fff5eb" style="background: rgb(255, 245, 235);"></div>
  <div title="#fee6ce" style="background: rgb(254, 230, 206);"></div>
  <div title="#fdd0a2" style="background: rgb(253, 208, 162);"></div>
  <div title="#fdae6b" style="background: rgb(253, 174, 107);"></div>
  <div title="#fd8d3c" style="background: rgb(253, 141, 60);"></div>
  <div title="#f16913" style="background: rgb(241, 105, 19);"></div>
  <div title="#d94801" style="background: rgb(217, 72, 1);"></div>
  <div title="#8c2d04" style="background: rgb(140, 45, 4);"></div>
</div>
<div class="swatch">
  <strong>oranges-9</strong>
  <div title="#fff5eb" style="background: rgb(255, 245, 235);"></div>
  <div title="#fee6ce" style="background: rgb(254, 230, 206);"></div>
  <div title="#fdd0a2" style="background: rgb(253, 208, 162);"></div>
  <div title="#fdae6b" style="background: rgb(253, 174, 107);"></div>
  <div title="#fd8d3c" style="background: rgb(253, 141, 60);"></div>
  <div title="#f16913" style="background: rgb(241, 105, 19);"></div>
  <div title="#d94801" style="background: rgb(217, 72, 1);"></div>
  <div title="#a63603" style="background: rgb(166, 54, 3);"></div>
  <div title="#7f2704" style="background: rgb(127, 39, 4);"></div>
</div>
</div>


### <a name="seq-multi-hue"></a>Sequential Multi-Hue Schemes

Sequential color schemes can be used to encode quantitative values. These color ramps are designed to encode increasing numerical values, but use additional hues for more color discrimination, which may be useful for visualizations such as heatmaps. However, beware that using multiple hues may cause viewers to inaccurately see the data range as grouped into color-coded clusters. These schemes include both continuous color palettes, and a limited set of discrete palettes with a suffix that indicates the desired number of colors.

<div class="scheme">
<a name="viridis" href="#viridis">#</a> <strong>viridis</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-viridis">
      <stop offset="0%" stop-color="#440154"></stop>
      <stop offset="10%" stop-color="#482475"></stop>
      <stop offset="20%" stop-color="#414487"></stop>
      <stop offset="30%" stop-color="#355f8d"></stop>
      <stop offset="40%" stop-color="#2a788e"></stop>
      <stop offset="50%" stop-color="#21918c"></stop>
      <stop offset="60%" stop-color="#22a884"></stop>
      <stop offset="70%" stop-color="#44bf70"></stop>
      <stop offset="80%" stop-color="#7ad151"></stop>
      <stop offset="90%" stop-color="#bddf26"></stop>
      <stop offset="100%" stop-color="#fde725"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-viridis)" x="0" y="0" width="1" height="1"></rect>
</svg>
</div>

<div class="scheme">
<a name="inferno" href="#inferno">#</a> <strong>inferno</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-inferno">
      <stop offset="0%" stop-color="#000004"></stop>
      <stop offset="10%" stop-color="#160b39"></stop>
      <stop offset="20%" stop-color="#420a68"></stop>
      <stop offset="30%" stop-color="#6a176e"></stop>
      <stop offset="40%" stop-color="#932667"></stop>
      <stop offset="50%" stop-color="#bc3754"></stop>
      <stop offset="60%" stop-color="#dd513a"></stop>
      <stop offset="70%" stop-color="#f37819"></stop>
      <stop offset="80%" stop-color="#fca50a"></stop>
      <stop offset="90%" stop-color="#f6d746"></stop>
      <stop offset="100%" stop-color="#fcffa4"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-inferno)" x="0" y="0" width="1" height="1"></rect>
</svg>
</div>

<div class="scheme">
<a name="magma" href="#magma">#</a> <strong>magma</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-magma">
      <stop offset="0%" stop-color="#000004"></stop>
      <stop offset="10%" stop-color="#140e36"></stop>
      <stop offset="20%" stop-color="#3b0f70"></stop>
      <stop offset="30%" stop-color="#641a80"></stop>
      <stop offset="40%" stop-color="#8c2981"></stop>
      <stop offset="50%" stop-color="#b73779"></stop>
      <stop offset="60%" stop-color="#de4968"></stop>
      <stop offset="70%" stop-color="#f7705c"></stop>
      <stop offset="80%" stop-color="#fe9f6d"></stop>
      <stop offset="90%" stop-color="#fecf92"></stop>
      <stop offset="100%" stop-color="#fcfdbf"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-magma)" x="0" y="0" width="1" height="1"></rect>
</svg>
</div>

<div class="scheme">
<a name="plasma" href="#plasma">#</a> <strong>plasma</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-plasma">
      <stop offset="0%" stop-color="#0d0887"></stop>
      <stop offset="10%" stop-color="#41049d"></stop>
      <stop offset="20%" stop-color="#6a00a8"></stop>
      <stop offset="30%" stop-color="#8f0da4"></stop>
      <stop offset="40%" stop-color="#b12a90"></stop>
      <stop offset="50%" stop-color="#cc4778"></stop>
      <stop offset="60%" stop-color="#e16462"></stop>
      <stop offset="70%" stop-color="#f2844b"></stop>
      <stop offset="80%" stop-color="#fca636"></stop>
      <stop offset="90%" stop-color="#fcce25"></stop>
      <stop offset="100%" stop-color="#f0f921"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-plasma)" x="0" y="0" width="1" height="1"></rect>
</svg>
</div>

<div class="scheme">
<a name="bluegreen" href="#bluegreen">#</a> <strong>bluegreen</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-bluegreen">
      <stop offset="0%" stop-color="rgb(247, 252, 253)"></stop>
      <stop offset="10%" stop-color="rgb(232, 246, 249)"></stop>
      <stop offset="20%" stop-color="rgb(213, 239, 237)"></stop>
      <stop offset="30%" stop-color="rgb(183, 228, 218)"></stop>
      <stop offset="40%" stop-color="rgb(143, 211, 193)"></stop>
      <stop offset="50%" stop-color="rgb(104, 194, 163)"></stop>
      <stop offset="60%" stop-color="rgb(73, 177, 127)"></stop>
      <stop offset="70%" stop-color="rgb(47, 153, 89)"></stop>
      <stop offset="80%" stop-color="rgb(21, 127, 60)"></stop>
      <stop offset="90%" stop-color="rgb(3, 100, 41)"></stop>
      <stop offset="100%" stop-color="rgb(0, 68, 27)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-bluegreen)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>bluegreen-3</strong>
  <div title="#e5f5f9" style="background: rgb(229, 245, 249);"></div>
  <div title="#99d8c9" style="background: rgb(153, 216, 201);"></div>
  <div title="#2ca25f" style="background: rgb(44, 162, 95);"></div>
</div>
<div class="swatch">
  <strong>bluegreen-4</strong>
  <div title="#edf8fb" style="background: rgb(237, 248, 251);"></div>
  <div title="#b2e2e2" style="background: rgb(178, 226, 226);"></div>
  <div title="#66c2a4" style="background: rgb(102, 194, 164);"></div>
  <div title="#238b45" style="background: rgb(35, 139, 69);"></div>
</div>
<div class="swatch">
  <strong>bluegreen-5</strong>
  <div title="#edf8fb" style="background: rgb(237, 248, 251);"></div>
  <div title="#b2e2e2" style="background: rgb(178, 226, 226);"></div>
  <div title="#66c2a4" style="background: rgb(102, 194, 164);"></div>
  <div title="#2ca25f" style="background: rgb(44, 162, 95);"></div>
  <div title="#006d2c" style="background: rgb(0, 109, 44);"></div>
</div>
<div class="swatch">
  <strong>bluegreen-6</strong>
  <div title="#edf8fb" style="background: rgb(237, 248, 251);"></div>
  <div title="#ccece6" style="background: rgb(204, 236, 230);"></div>
  <div title="#99d8c9" style="background: rgb(153, 216, 201);"></div>
  <div title="#66c2a4" style="background: rgb(102, 194, 164);"></div>
  <div title="#2ca25f" style="background: rgb(44, 162, 95);"></div>
  <div title="#006d2c" style="background: rgb(0, 109, 44);"></div>
</div>
<div class="swatch">
  <strong>bluegreen-7</strong>
  <div title="#edf8fb" style="background: rgb(237, 248, 251);"></div>
  <div title="#ccece6" style="background: rgb(204, 236, 230);"></div>
  <div title="#99d8c9" style="background: rgb(153, 216, 201);"></div>
  <div title="#66c2a4" style="background: rgb(102, 194, 164);"></div>
  <div title="#41ae76" style="background: rgb(65, 174, 118);"></div>
  <div title="#238b45" style="background: rgb(35, 139, 69);"></div>
  <div title="#005824" style="background: rgb(0, 88, 36);"></div>
</div>
<div class="swatch">
  <strong>bluegreen-8</strong>
  <div title="#f7fcfd" style="background: rgb(247, 252, 253);"></div>
  <div title="#e5f5f9" style="background: rgb(229, 245, 249);"></div>
  <div title="#ccece6" style="background: rgb(204, 236, 230);"></div>
  <div title="#99d8c9" style="background: rgb(153, 216, 201);"></div>
  <div title="#66c2a4" style="background: rgb(102, 194, 164);"></div>
  <div title="#41ae76" style="background: rgb(65, 174, 118);"></div>
  <div title="#238b45" style="background: rgb(35, 139, 69);"></div>
  <div title="#005824" style="background: rgb(0, 88, 36);"></div>
</div>
<div class="swatch">
  <strong>bluegreen-9</strong>
  <div title="#f7fcfd" style="background: rgb(247, 252, 253);"></div>
  <div title="#e5f5f9" style="background: rgb(229, 245, 249);"></div>
  <div title="#ccece6" style="background: rgb(204, 236, 230);"></div>
  <div title="#99d8c9" style="background: rgb(153, 216, 201);"></div>
  <div title="#66c2a4" style="background: rgb(102, 194, 164);"></div>
  <div title="#41ae76" style="background: rgb(65, 174, 118);"></div>
  <div title="#238b45" style="background: rgb(35, 139, 69);"></div>
  <div title="#006d2c" style="background: rgb(0, 109, 44);"></div>
  <div title="#00441b" style="background: rgb(0, 68, 27);"></div>
</div>
</div><div class="scheme">
<a name="bluepurple" href="#bluepurple">#</a> <strong>bluepurple</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-bluepurple">
      <stop offset="0%" stop-color="rgb(247, 252, 253)"></stop>
      <stop offset="10%" stop-color="rgb(228, 238, 245)"></stop>
      <stop offset="20%" stop-color="rgb(204, 221, 236)"></stop>
      <stop offset="30%" stop-color="rgb(178, 202, 225)"></stop>
      <stop offset="40%" stop-color="rgb(156, 179, 213)"></stop>
      <stop offset="50%" stop-color="rgb(143, 149, 198)"></stop>
      <stop offset="60%" stop-color="rgb(140, 116, 181)"></stop>
      <stop offset="70%" stop-color="rgb(137, 82, 165)"></stop>
      <stop offset="80%" stop-color="rgb(133, 45, 143)"></stop>
      <stop offset="90%" stop-color="rgb(115, 15, 113)"></stop>
      <stop offset="100%" stop-color="rgb(77, 0, 75)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-bluepurple)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>bluepurple-3</strong>
  <div title="#e0ecf4" style="background: rgb(224, 236, 244);"></div>
  <div title="#9ebcda" style="background: rgb(158, 188, 218);"></div>
  <div title="#8856a7" style="background: rgb(136, 86, 167);"></div>
</div>
<div class="swatch">
  <strong>bluepurple-4</strong>
  <div title="#edf8fb" style="background: rgb(237, 248, 251);"></div>
  <div title="#b3cde3" style="background: rgb(179, 205, 227);"></div>
  <div title="#8c96c6" style="background: rgb(140, 150, 198);"></div>
  <div title="#88419d" style="background: rgb(136, 65, 157);"></div>
</div>
<div class="swatch">
  <strong>bluepurple-5</strong>
  <div title="#edf8fb" style="background: rgb(237, 248, 251);"></div>
  <div title="#b3cde3" style="background: rgb(179, 205, 227);"></div>
  <div title="#8c96c6" style="background: rgb(140, 150, 198);"></div>
  <div title="#8856a7" style="background: rgb(136, 86, 167);"></div>
  <div title="#810f7c" style="background: rgb(129, 15, 124);"></div>
</div>
<div class="swatch">
  <strong>bluepurple-6</strong>
  <div title="#edf8fb" style="background: rgb(237, 248, 251);"></div>
  <div title="#bfd3e6" style="background: rgb(191, 211, 230);"></div>
  <div title="#9ebcda" style="background: rgb(158, 188, 218);"></div>
  <div title="#8c96c6" style="background: rgb(140, 150, 198);"></div>
  <div title="#8856a7" style="background: rgb(136, 86, 167);"></div>
  <div title="#810f7c" style="background: rgb(129, 15, 124);"></div>
</div>
<div class="swatch">
  <strong>bluepurple-7</strong>
  <div title="#edf8fb" style="background: rgb(237, 248, 251);"></div>
  <div title="#bfd3e6" style="background: rgb(191, 211, 230);"></div>
  <div title="#9ebcda" style="background: rgb(158, 188, 218);"></div>
  <div title="#8c96c6" style="background: rgb(140, 150, 198);"></div>
  <div title="#8c6bb1" style="background: rgb(140, 107, 177);"></div>
  <div title="#88419d" style="background: rgb(136, 65, 157);"></div>
  <div title="#6e016b" style="background: rgb(110, 1, 107);"></div>
</div>
<div class="swatch">
  <strong>bluepurple-8</strong>
  <div title="#f7fcfd" style="background: rgb(247, 252, 253);"></div>
  <div title="#e0ecf4" style="background: rgb(224, 236, 244);"></div>
  <div title="#bfd3e6" style="background: rgb(191, 211, 230);"></div>
  <div title="#9ebcda" style="background: rgb(158, 188, 218);"></div>
  <div title="#8c96c6" style="background: rgb(140, 150, 198);"></div>
  <div title="#8c6bb1" style="background: rgb(140, 107, 177);"></div>
  <div title="#88419d" style="background: rgb(136, 65, 157);"></div>
  <div title="#6e016b" style="background: rgb(110, 1, 107);"></div>
</div>
<div class="swatch">
  <strong>bluepurple-9</strong>
  <div title="#f7fcfd" style="background: rgb(247, 252, 253);"></div>
  <div title="#e0ecf4" style="background: rgb(224, 236, 244);"></div>
  <div title="#bfd3e6" style="background: rgb(191, 211, 230);"></div>
  <div title="#9ebcda" style="background: rgb(158, 188, 218);"></div>
  <div title="#8c96c6" style="background: rgb(140, 150, 198);"></div>
  <div title="#8c6bb1" style="background: rgb(140, 107, 177);"></div>
  <div title="#88419d" style="background: rgb(136, 65, 157);"></div>
  <div title="#810f7c" style="background: rgb(129, 15, 124);"></div>
  <div title="#4d004b" style="background: rgb(77, 0, 75);"></div>
</div>
</div>

<div class="scheme">
<a name="greenblue" href="#greenblue">#</a> <strong>greenblue</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-greenblue">
      <stop offset="0%" stop-color="rgb(247, 252, 240)"></stop>
      <stop offset="10%" stop-color="rgb(229, 245, 223)"></stop>
      <stop offset="20%" stop-color="rgb(211, 238, 206)"></stop>
      <stop offset="30%" stop-color="rgb(189, 229, 191)"></stop>
      <stop offset="40%" stop-color="rgb(158, 217, 187)"></stop>
      <stop offset="50%" stop-color="rgb(123, 203, 196)"></stop>
      <stop offset="60%" stop-color="rgb(88, 183, 205)"></stop>
      <stop offset="70%" stop-color="rgb(57, 156, 198)"></stop>
      <stop offset="80%" stop-color="rgb(29, 126, 183)"></stop>
      <stop offset="90%" stop-color="rgb(11, 96, 161)"></stop>
      <stop offset="100%" stop-color="rgb(8, 64, 129)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-greenblue)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>greenblue-3</strong>
  <div title="#e0f3db" style="background: rgb(224, 243, 219);"></div>
  <div title="#a8ddb5" style="background: rgb(168, 221, 181);"></div>
  <div title="#43a2ca" style="background: rgb(67, 162, 202);"></div>
</div>
<div class="swatch">
  <strong>greenblue-4</strong>
  <div title="#f0f9e8" style="background: rgb(240, 249, 232);"></div>
  <div title="#bae4bc" style="background: rgb(186, 228, 188);"></div>
  <div title="#7bccc4" style="background: rgb(123, 204, 196);"></div>
  <div title="#2b8cbe" style="background: rgb(43, 140, 190);"></div>
</div>
<div class="swatch">
  <strong>greenblue-5</strong>
  <div title="#f0f9e8" style="background: rgb(240, 249, 232);"></div>
  <div title="#bae4bc" style="background: rgb(186, 228, 188);"></div>
  <div title="#7bccc4" style="background: rgb(123, 204, 196);"></div>
  <div title="#43a2ca" style="background: rgb(67, 162, 202);"></div>
  <div title="#0868ac" style="background: rgb(8, 104, 172);"></div>
</div>
<div class="swatch">
  <strong>greenblue-6</strong>
  <div title="#f0f9e8" style="background: rgb(240, 249, 232);"></div>
  <div title="#ccebc5" style="background: rgb(204, 235, 197);"></div>
  <div title="#a8ddb5" style="background: rgb(168, 221, 181);"></div>
  <div title="#7bccc4" style="background: rgb(123, 204, 196);"></div>
  <div title="#43a2ca" style="background: rgb(67, 162, 202);"></div>
  <div title="#0868ac" style="background: rgb(8, 104, 172);"></div>
</div>
<div class="swatch">
  <strong>greenblue-7</strong>
  <div title="#f0f9e8" style="background: rgb(240, 249, 232);"></div>
  <div title="#ccebc5" style="background: rgb(204, 235, 197);"></div>
  <div title="#a8ddb5" style="background: rgb(168, 221, 181);"></div>
  <div title="#7bccc4" style="background: rgb(123, 204, 196);"></div>
  <div title="#4eb3d3" style="background: rgb(78, 179, 211);"></div>
  <div title="#2b8cbe" style="background: rgb(43, 140, 190);"></div>
  <div title="#08589e" style="background: rgb(8, 88, 158);"></div>
</div>
<div class="swatch">
  <strong>greenblue-8</strong>
  <div title="#f7fcf0" style="background: rgb(247, 252, 240);"></div>
  <div title="#e0f3db" style="background: rgb(224, 243, 219);"></div>
  <div title="#ccebc5" style="background: rgb(204, 235, 197);"></div>
  <div title="#a8ddb5" style="background: rgb(168, 221, 181);"></div>
  <div title="#7bccc4" style="background: rgb(123, 204, 196);"></div>
  <div title="#4eb3d3" style="background: rgb(78, 179, 211);"></div>
  <div title="#2b8cbe" style="background: rgb(43, 140, 190);"></div>
  <div title="#08589e" style="background: rgb(8, 88, 158);"></div>
</div>
<div class="swatch">
  <strong>greenblue-9</strong>
  <div title="#f7fcf0" style="background: rgb(247, 252, 240);"></div>
  <div title="#e0f3db" style="background: rgb(224, 243, 219);"></div>
  <div title="#ccebc5" style="background: rgb(204, 235, 197);"></div>
  <div title="#a8ddb5" style="background: rgb(168, 221, 181);"></div>
  <div title="#7bccc4" style="background: rgb(123, 204, 196);"></div>
  <div title="#4eb3d3" style="background: rgb(78, 179, 211);"></div>
  <div title="#2b8cbe" style="background: rgb(43, 140, 190);"></div>
  <div title="#0868ac" style="background: rgb(8, 104, 172);"></div>
  <div title="#084081" style="background: rgb(8, 64, 129);"></div>
</div>
</div>

<div class="scheme">
<a name="orangered" href="#orangered">#</a> <strong>orangered</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-orangered">
      <stop offset="0%" stop-color="rgb(255, 247, 236)"></stop>
      <stop offset="10%" stop-color="rgb(254, 235, 207)"></stop>
      <stop offset="20%" stop-color="rgb(253, 220, 175)"></stop>
      <stop offset="30%" stop-color="rgb(253, 202, 148)"></stop>
      <stop offset="40%" stop-color="rgb(253, 176, 122)"></stop>
      <stop offset="50%" stop-color="rgb(250, 142, 93)"></stop>
      <stop offset="60%" stop-color="rgb(241, 108, 73)"></stop>
      <stop offset="70%" stop-color="rgb(224, 69, 48)"></stop>
      <stop offset="80%" stop-color="rgb(200, 29, 19)"></stop>
      <stop offset="90%" stop-color="rgb(167, 4, 3)"></stop>
      <stop offset="100%" stop-color="rgb(127, 0, 0)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-orangered)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>orangered-3</strong>
  <div title="#fee8c8" style="background: rgb(254, 232, 200);"></div>
  <div title="#fdbb84" style="background: rgb(253, 187, 132);"></div>
  <div title="#e34a33" style="background: rgb(227, 74, 51);"></div>
</div>
<div class="swatch">
  <strong>orangered-4</strong>
  <div title="#fef0d9" style="background: rgb(254, 240, 217);"></div>
  <div title="#fdcc8a" style="background: rgb(253, 204, 138);"></div>
  <div title="#fc8d59" style="background: rgb(252, 141, 89);"></div>
  <div title="#d7301f" style="background: rgb(215, 48, 31);"></div>
</div>
<div class="swatch">
  <strong>orangered-5</strong>
  <div title="#fef0d9" style="background: rgb(254, 240, 217);"></div>
  <div title="#fdcc8a" style="background: rgb(253, 204, 138);"></div>
  <div title="#fc8d59" style="background: rgb(252, 141, 89);"></div>
  <div title="#e34a33" style="background: rgb(227, 74, 51);"></div>
  <div title="#b30000" style="background: rgb(179, 0, 0);"></div>
</div>
<div class="swatch">
  <strong>orangered-6</strong>
  <div title="#fef0d9" style="background: rgb(254, 240, 217);"></div>
  <div title="#fdd49e" style="background: rgb(253, 212, 158);"></div>
  <div title="#fdbb84" style="background: rgb(253, 187, 132);"></div>
  <div title="#fc8d59" style="background: rgb(252, 141, 89);"></div>
  <div title="#e34a33" style="background: rgb(227, 74, 51);"></div>
  <div title="#b30000" style="background: rgb(179, 0, 0);"></div>
</div>
<div class="swatch">
  <strong>orangered-7</strong>
  <div title="#fef0d9" style="background: rgb(254, 240, 217);"></div>
  <div title="#fdd49e" style="background: rgb(253, 212, 158);"></div>
  <div title="#fdbb84" style="background: rgb(253, 187, 132);"></div>
  <div title="#fc8d59" style="background: rgb(252, 141, 89);"></div>
  <div title="#ef6548" style="background: rgb(239, 101, 72);"></div>
  <div title="#d7301f" style="background: rgb(215, 48, 31);"></div>
  <div title="#990000" style="background: rgb(153, 0, 0);"></div>
</div>
<div class="swatch">
  <strong>orangered-8</strong>
  <div title="#fff7ec" style="background: rgb(255, 247, 236);"></div>
  <div title="#fee8c8" style="background: rgb(254, 232, 200);"></div>
  <div title="#fdd49e" style="background: rgb(253, 212, 158);"></div>
  <div title="#fdbb84" style="background: rgb(253, 187, 132);"></div>
  <div title="#fc8d59" style="background: rgb(252, 141, 89);"></div>
  <div title="#ef6548" style="background: rgb(239, 101, 72);"></div>
  <div title="#d7301f" style="background: rgb(215, 48, 31);"></div>
  <div title="#990000" style="background: rgb(153, 0, 0);"></div>
</div>
<div class="swatch">
  <strong>orangered-9</strong>
  <div title="#fff7ec" style="background: rgb(255, 247, 236);"></div>
  <div title="#fee8c8" style="background: rgb(254, 232, 200);"></div>
  <div title="#fdd49e" style="background: rgb(253, 212, 158);"></div>
  <div title="#fdbb84" style="background: rgb(253, 187, 132);"></div>
  <div title="#fc8d59" style="background: rgb(252, 141, 89);"></div>
  <div title="#ef6548" style="background: rgb(239, 101, 72);"></div>
  <div title="#d7301f" style="background: rgb(215, 48, 31);"></div>
  <div title="#b30000" style="background: rgb(179, 0, 0);"></div>
  <div title="#7f0000" style="background: rgb(127, 0, 0);"></div>
</div>
</div>

<div class="scheme">
<a name="purplebluegreen" href="#purplebluegreen">#</a> <strong>purplebluegreen</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-purplebluegreen">
      <stop offset="0%" stop-color="rgb(255, 247, 251)"></stop>
      <stop offset="10%" stop-color="rgb(239, 231, 242)"></stop>
      <stop offset="20%" stop-color="rgb(219, 216, 234)"></stop>
      <stop offset="30%" stop-color="rgb(190, 201, 226)"></stop>
      <stop offset="40%" stop-color="rgb(152, 185, 217)"></stop>
      <stop offset="50%" stop-color="rgb(105, 168, 207)"></stop>
      <stop offset="60%" stop-color="rgb(64, 150, 192)"></stop>
      <stop offset="70%" stop-color="rgb(25, 135, 159)"></stop>
      <stop offset="80%" stop-color="rgb(3, 120, 119)"></stop>
      <stop offset="90%" stop-color="rgb(1, 99, 83)"></stop>
      <stop offset="100%" stop-color="rgb(1, 70, 54)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-purplebluegreen)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>purplebluegreen-3</strong>
  <div title="#ece2f0" style="background: rgb(236, 226, 240);"></div>
  <div title="#a6bddb" style="background: rgb(166, 189, 219);"></div>
  <div title="#1c9099" style="background: rgb(28, 144, 153);"></div>
</div>
<div class="swatch">
  <strong>purplebluegreen-4</strong>
  <div title="#f6eff7" style="background: rgb(246, 239, 247);"></div>
  <div title="#bdc9e1" style="background: rgb(189, 201, 225);"></div>
  <div title="#67a9cf" style="background: rgb(103, 169, 207);"></div>
  <div title="#02818a" style="background: rgb(2, 129, 138);"></div>
</div>
<div class="swatch">
  <strong>purplebluegreen-5</strong>
  <div title="#f6eff7" style="background: rgb(246, 239, 247);"></div>
  <div title="#bdc9e1" style="background: rgb(189, 201, 225);"></div>
  <div title="#67a9cf" style="background: rgb(103, 169, 207);"></div>
  <div title="#1c9099" style="background: rgb(28, 144, 153);"></div>
  <div title="#016c59" style="background: rgb(1, 108, 89);"></div>
</div>
<div class="swatch">
  <strong>purplebluegreen-6</strong>
  <div title="#f6eff7" style="background: rgb(246, 239, 247);"></div>
  <div title="#d0d1e6" style="background: rgb(208, 209, 230);"></div>
  <div title="#a6bddb" style="background: rgb(166, 189, 219);"></div>
  <div title="#67a9cf" style="background: rgb(103, 169, 207);"></div>
  <div title="#1c9099" style="background: rgb(28, 144, 153);"></div>
  <div title="#016c59" style="background: rgb(1, 108, 89);"></div>
</div>
<div class="swatch">
  <strong>purplebluegreen-7</strong>
  <div title="#f6eff7" style="background: rgb(246, 239, 247);"></div>
  <div title="#d0d1e6" style="background: rgb(208, 209, 230);"></div>
  <div title="#a6bddb" style="background: rgb(166, 189, 219);"></div>
  <div title="#67a9cf" style="background: rgb(103, 169, 207);"></div>
  <div title="#3690c0" style="background: rgb(54, 144, 192);"></div>
  <div title="#02818a" style="background: rgb(2, 129, 138);"></div>
  <div title="#016450" style="background: rgb(1, 100, 80);"></div>
</div>
<div class="swatch">
  <strong>purplebluegreen-8</strong>
  <div title="#fff7fb" style="background: rgb(255, 247, 251);"></div>
  <div title="#ece2f0" style="background: rgb(236, 226, 240);"></div>
  <div title="#d0d1e6" style="background: rgb(208, 209, 230);"></div>
  <div title="#a6bddb" style="background: rgb(166, 189, 219);"></div>
  <div title="#67a9cf" style="background: rgb(103, 169, 207);"></div>
  <div title="#3690c0" style="background: rgb(54, 144, 192);"></div>
  <div title="#02818a" style="background: rgb(2, 129, 138);"></div>
  <div title="#016450" style="background: rgb(1, 100, 80);"></div>
</div>
<div class="swatch">
  <strong>purplebluegreen-9</strong>
  <div title="#fff7fb" style="background: rgb(255, 247, 251);"></div>
  <div title="#ece2f0" style="background: rgb(236, 226, 240);"></div>
  <div title="#d0d1e6" style="background: rgb(208, 209, 230);"></div>
  <div title="#a6bddb" style="background: rgb(166, 189, 219);"></div>
  <div title="#67a9cf" style="background: rgb(103, 169, 207);"></div>
  <div title="#3690c0" style="background: rgb(54, 144, 192);"></div>
  <div title="#02818a" style="background: rgb(2, 129, 138);"></div>
  <div title="#016c59" style="background: rgb(1, 108, 89);"></div>
  <div title="#014636" style="background: rgb(1, 70, 54);"></div>
</div>
</div>

<div class="scheme">
<a name="purpleblue" href="#purpleblue">#</a> <strong>purpleblue</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-purpleblue">
      <stop offset="0%" stop-color="rgb(255, 247, 251)"></stop>
      <stop offset="10%" stop-color="rgb(239, 234, 244)"></stop>
      <stop offset="20%" stop-color="rgb(219, 218, 235)"></stop>
      <stop offset="30%" stop-color="rgb(191, 201, 226)"></stop>
      <stop offset="40%" stop-color="rgb(155, 185, 217)"></stop>
      <stop offset="50%" stop-color="rgb(114, 168, 207)"></stop>
      <stop offset="60%" stop-color="rgb(67, 148, 195)"></stop>
      <stop offset="70%" stop-color="rgb(26, 125, 182)"></stop>
      <stop offset="80%" stop-color="rgb(6, 103, 161)"></stop>
      <stop offset="90%" stop-color="rgb(4, 82, 129)"></stop>
      <stop offset="100%" stop-color="rgb(2, 56, 88)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-purpleblue)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>purpleblue-3</strong>
  <div title="#ece7f2" style="background: rgb(236, 231, 242);"></div>
  <div title="#a6bddb" style="background: rgb(166, 189, 219);"></div>
  <div title="#2b8cbe" style="background: rgb(43, 140, 190);"></div>
</div>
<div class="swatch">
  <strong>purpleblue-4</strong>
  <div title="#f1eef6" style="background: rgb(241, 238, 246);"></div>
  <div title="#bdc9e1" style="background: rgb(189, 201, 225);"></div>
  <div title="#74a9cf" style="background: rgb(116, 169, 207);"></div>
  <div title="#0570b0" style="background: rgb(5, 112, 176);"></div>
</div>
<div class="swatch">
  <strong>purpleblue-5</strong>
  <div title="#f1eef6" style="background: rgb(241, 238, 246);"></div>
  <div title="#bdc9e1" style="background: rgb(189, 201, 225);"></div>
  <div title="#74a9cf" style="background: rgb(116, 169, 207);"></div>
  <div title="#2b8cbe" style="background: rgb(43, 140, 190);"></div>
  <div title="#045a8d" style="background: rgb(4, 90, 141);"></div>
</div>
<div class="swatch">
  <strong>purpleblue-6</strong>
  <div title="#f1eef6" style="background: rgb(241, 238, 246);"></div>
  <div title="#d0d1e6" style="background: rgb(208, 209, 230);"></div>
  <div title="#a6bddb" style="background: rgb(166, 189, 219);"></div>
  <div title="#74a9cf" style="background: rgb(116, 169, 207);"></div>
  <div title="#2b8cbe" style="background: rgb(43, 140, 190);"></div>
  <div title="#045a8d" style="background: rgb(4, 90, 141);"></div>
</div>
<div class="swatch">
  <strong>purpleblue-7</strong>
  <div title="#f1eef6" style="background: rgb(241, 238, 246);"></div>
  <div title="#d0d1e6" style="background: rgb(208, 209, 230);"></div>
  <div title="#a6bddb" style="background: rgb(166, 189, 219);"></div>
  <div title="#74a9cf" style="background: rgb(116, 169, 207);"></div>
  <div title="#3690c0" style="background: rgb(54, 144, 192);"></div>
  <div title="#0570b0" style="background: rgb(5, 112, 176);"></div>
  <div title="#034e7b" style="background: rgb(3, 78, 123);"></div>
</div>
<div class="swatch">
  <strong>purpleblue-8</strong>
  <div title="#fff7fb" style="background: rgb(255, 247, 251);"></div>
  <div title="#ece7f2" style="background: rgb(236, 231, 242);"></div>
  <div title="#d0d1e6" style="background: rgb(208, 209, 230);"></div>
  <div title="#a6bddb" style="background: rgb(166, 189, 219);"></div>
  <div title="#74a9cf" style="background: rgb(116, 169, 207);"></div>
  <div title="#3690c0" style="background: rgb(54, 144, 192);"></div>
  <div title="#0570b0" style="background: rgb(5, 112, 176);"></div>
  <div title="#034e7b" style="background: rgb(3, 78, 123);"></div>
</div>
<div class="swatch">
  <strong>purpleblue-9</strong>
  <div title="#fff7fb" style="background: rgb(255, 247, 251);"></div>
  <div title="#ece7f2" style="background: rgb(236, 231, 242);"></div>
  <div title="#d0d1e6" style="background: rgb(208, 209, 230);"></div>
  <div title="#a6bddb" style="background: rgb(166, 189, 219);"></div>
  <div title="#74a9cf" style="background: rgb(116, 169, 207);"></div>
  <div title="#3690c0" style="background: rgb(54, 144, 192);"></div>
  <div title="#0570b0" style="background: rgb(5, 112, 176);"></div>
  <div title="#045a8d" style="background: rgb(4, 90, 141);"></div>
  <div title="#023858" style="background: rgb(2, 56, 88);"></div>
</div>
</div>

<div class="scheme">
<a name="purplered" href="#purplered">#</a> <strong>purplered</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-purplered">
      <stop offset="0%" stop-color="rgb(247, 244, 249)"></stop>
      <stop offset="10%" stop-color="rgb(234, 227, 240)"></stop>
      <stop offset="20%" stop-color="rgb(220, 201, 226)"></stop>
      <stop offset="30%" stop-color="rgb(208, 170, 210)"></stop>
      <stop offset="40%" stop-color="rgb(208, 138, 194)"></stop>
      <stop offset="50%" stop-color="rgb(221, 99, 174)"></stop>
      <stop offset="60%" stop-color="rgb(227, 56, 144)"></stop>
      <stop offset="70%" stop-color="rgb(215, 28, 108)"></stop>
      <stop offset="80%" stop-color="rgb(183, 11, 79)"></stop>
      <stop offset="90%" stop-color="rgb(143, 2, 58)"></stop>
      <stop offset="100%" stop-color="rgb(103, 0, 31)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-purplered)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>purplered-3</strong>
  <div title="#e7e1ef" style="background: rgb(231, 225, 239);"></div>
  <div title="#c994c7" style="background: rgb(201, 148, 199);"></div>
  <div title="#dd1c77" style="background: rgb(221, 28, 119);"></div>
</div>
<div class="swatch">
  <strong>purplered-4</strong>
  <div title="#f1eef6" style="background: rgb(241, 238, 246);"></div>
  <div title="#d7b5d8" style="background: rgb(215, 181, 216);"></div>
  <div title="#df65b0" style="background: rgb(223, 101, 176);"></div>
  <div title="#ce1256" style="background: rgb(206, 18, 86);"></div>
</div>
<div class="swatch">
  <strong>purplered-5</strong>
  <div title="#f1eef6" style="background: rgb(241, 238, 246);"></div>
  <div title="#d7b5d8" style="background: rgb(215, 181, 216);"></div>
  <div title="#df65b0" style="background: rgb(223, 101, 176);"></div>
  <div title="#dd1c77" style="background: rgb(221, 28, 119);"></div>
  <div title="#980043" style="background: rgb(152, 0, 67);"></div>
</div>
<div class="swatch">
  <strong>purplered-6</strong>
  <div title="#f1eef6" style="background: rgb(241, 238, 246);"></div>
  <div title="#d4b9da" style="background: rgb(212, 185, 218);"></div>
  <div title="#c994c7" style="background: rgb(201, 148, 199);"></div>
  <div title="#df65b0" style="background: rgb(223, 101, 176);"></div>
  <div title="#dd1c77" style="background: rgb(221, 28, 119);"></div>
  <div title="#980043" style="background: rgb(152, 0, 67);"></div>
</div>
<div class="swatch">
  <strong>purplered-7</strong>
  <div title="#f1eef6" style="background: rgb(241, 238, 246);"></div>
  <div title="#d4b9da" style="background: rgb(212, 185, 218);"></div>
  <div title="#c994c7" style="background: rgb(201, 148, 199);"></div>
  <div title="#df65b0" style="background: rgb(223, 101, 176);"></div>
  <div title="#e7298a" style="background: rgb(231, 41, 138);"></div>
  <div title="#ce1256" style="background: rgb(206, 18, 86);"></div>
  <div title="#91003f" style="background: rgb(145, 0, 63);"></div>
</div>
<div class="swatch">
  <strong>purplered-8</strong>
  <div title="#f7f4f9" style="background: rgb(247, 244, 249);"></div>
  <div title="#e7e1ef" style="background: rgb(231, 225, 239);"></div>
  <div title="#d4b9da" style="background: rgb(212, 185, 218);"></div>
  <div title="#c994c7" style="background: rgb(201, 148, 199);"></div>
  <div title="#df65b0" style="background: rgb(223, 101, 176);"></div>
  <div title="#e7298a" style="background: rgb(231, 41, 138);"></div>
  <div title="#ce1256" style="background: rgb(206, 18, 86);"></div>
  <div title="#91003f" style="background: rgb(145, 0, 63);"></div>
</div>
<div class="swatch">
  <strong>purplered-9</strong>
  <div title="#f7f4f9" style="background: rgb(247, 244, 249);"></div>
  <div title="#e7e1ef" style="background: rgb(231, 225, 239);"></div>
  <div title="#d4b9da" style="background: rgb(212, 185, 218);"></div>
  <div title="#c994c7" style="background: rgb(201, 148, 199);"></div>
  <div title="#df65b0" style="background: rgb(223, 101, 176);"></div>
  <div title="#e7298a" style="background: rgb(231, 41, 138);"></div>
  <div title="#ce1256" style="background: rgb(206, 18, 86);"></div>
  <div title="#980043" style="background: rgb(152, 0, 67);"></div>
  <div title="#67001f" style="background: rgb(103, 0, 31);"></div>
</div>
</div>

<div class="scheme">
<a name="redpurple" href="#redpurple">#</a> <strong>redpurple</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-redpurple">
      <stop offset="0%" stop-color="rgb(255, 247, 243)"></stop>
      <stop offset="10%" stop-color="rgb(253, 228, 225)"></stop>
      <stop offset="20%" stop-color="rgb(252, 207, 204)"></stop>
      <stop offset="30%" stop-color="rgb(251, 181, 188)"></stop>
      <stop offset="40%" stop-color="rgb(249, 147, 176)"></stop>
      <stop offset="50%" stop-color="rgb(243, 105, 163)"></stop>
      <stop offset="60%" stop-color="rgb(224, 62, 152)"></stop>
      <stop offset="70%" stop-color="rgb(192, 23, 136)"></stop>
      <stop offset="80%" stop-color="rgb(153, 3, 124)"></stop>
      <stop offset="90%" stop-color="rgb(112, 1, 116)"></stop>
      <stop offset="100%" stop-color="rgb(73, 0, 106)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-redpurple)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>redpurple-3</strong>
  <div title="#fde0dd" style="background: rgb(253, 224, 221);"></div>
  <div title="#fa9fb5" style="background: rgb(250, 159, 181);"></div>
  <div title="#c51b8a" style="background: rgb(197, 27, 138);"></div>
</div>
<div class="swatch">
  <strong>redpurple-4</strong>
  <div title="#feebe2" style="background: rgb(254, 235, 226);"></div>
  <div title="#fbb4b9" style="background: rgb(251, 180, 185);"></div>
  <div title="#f768a1" style="background: rgb(247, 104, 161);"></div>
  <div title="#ae017e" style="background: rgb(174, 1, 126);"></div>
</div>
<div class="swatch">
  <strong>redpurple-5</strong>
  <div title="#feebe2" style="background: rgb(254, 235, 226);"></div>
  <div title="#fbb4b9" style="background: rgb(251, 180, 185);"></div>
  <div title="#f768a1" style="background: rgb(247, 104, 161);"></div>
  <div title="#c51b8a" style="background: rgb(197, 27, 138);"></div>
  <div title="#7a0177" style="background: rgb(122, 1, 119);"></div>
</div>
<div class="swatch">
  <strong>redpurple-6</strong>
  <div title="#feebe2" style="background: rgb(254, 235, 226);"></div>
  <div title="#fcc5c0" style="background: rgb(252, 197, 192);"></div>
  <div title="#fa9fb5" style="background: rgb(250, 159, 181);"></div>
  <div title="#f768a1" style="background: rgb(247, 104, 161);"></div>
  <div title="#c51b8a" style="background: rgb(197, 27, 138);"></div>
  <div title="#7a0177" style="background: rgb(122, 1, 119);"></div>
</div>
<div class="swatch">
  <strong>redpurple-7</strong>
  <div title="#feebe2" style="background: rgb(254, 235, 226);"></div>
  <div title="#fcc5c0" style="background: rgb(252, 197, 192);"></div>
  <div title="#fa9fb5" style="background: rgb(250, 159, 181);"></div>
  <div title="#f768a1" style="background: rgb(247, 104, 161);"></div>
  <div title="#dd3497" style="background: rgb(221, 52, 151);"></div>
  <div title="#ae017e" style="background: rgb(174, 1, 126);"></div>
  <div title="#7a0177" style="background: rgb(122, 1, 119);"></div>
</div>
<div class="swatch">
  <strong>redpurple-8</strong>
  <div title="#fff7f3" style="background: rgb(255, 247, 243);"></div>
  <div title="#fde0dd" style="background: rgb(253, 224, 221);"></div>
  <div title="#fcc5c0" style="background: rgb(252, 197, 192);"></div>
  <div title="#fa9fb5" style="background: rgb(250, 159, 181);"></div>
  <div title="#f768a1" style="background: rgb(247, 104, 161);"></div>
  <div title="#dd3497" style="background: rgb(221, 52, 151);"></div>
  <div title="#ae017e" style="background: rgb(174, 1, 126);"></div>
  <div title="#7a0177" style="background: rgb(122, 1, 119);"></div>
</div>
<div class="swatch">
  <strong>redpurple-9</strong>
  <div title="#fff7f3" style="background: rgb(255, 247, 243);"></div>
  <div title="#fde0dd" style="background: rgb(253, 224, 221);"></div>
  <div title="#fcc5c0" style="background: rgb(252, 197, 192);"></div>
  <div title="#fa9fb5" style="background: rgb(250, 159, 181);"></div>
  <div title="#f768a1" style="background: rgb(247, 104, 161);"></div>
  <div title="#dd3497" style="background: rgb(221, 52, 151);"></div>
  <div title="#ae017e" style="background: rgb(174, 1, 126);"></div>
  <div title="#7a0177" style="background: rgb(122, 1, 119);"></div>
  <div title="#49006a" style="background: rgb(73, 0, 106);"></div>
</div>
</div>

<div class="scheme">
<a name="yellowgreenblue" href="#yellowgreenblue">#</a> <strong>yellowgreenblue</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-yellowgreenblue">
      <stop offset="0%" stop-color="rgb(255, 255, 217)"></stop>
      <stop offset="10%" stop-color="rgb(239, 249, 189)"></stop>
      <stop offset="20%" stop-color="rgb(213, 238, 179)"></stop>
      <stop offset="30%" stop-color="rgb(169, 221, 183)"></stop>
      <stop offset="40%" stop-color="rgb(115, 201, 189)"></stop>
      <stop offset="50%" stop-color="rgb(69, 180, 194)"></stop>
      <stop offset="60%" stop-color="rgb(40, 151, 191)"></stop>
      <stop offset="70%" stop-color="rgb(32, 115, 178)"></stop>
      <stop offset="80%" stop-color="rgb(35, 78, 160)"></stop>
      <stop offset="90%" stop-color="rgb(28, 49, 133)"></stop>
      <stop offset="100%" stop-color="rgb(8, 29, 88)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-yellowgreenblue)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>yellowgreenblue-3</strong>
  <div title="#edf8b1" style="background: rgb(237, 248, 177);"></div>
  <div title="#7fcdbb" style="background: rgb(127, 205, 187);"></div>
  <div title="#2c7fb8" style="background: rgb(44, 127, 184);"></div>
</div>
<div class="swatch">
  <strong>yellowgreenblue-4</strong>
  <div title="#ffffcc" style="background: rgb(255, 255, 204);"></div>
  <div title="#a1dab4" style="background: rgb(161, 218, 180);"></div>
  <div title="#41b6c4" style="background: rgb(65, 182, 196);"></div>
  <div title="#225ea8" style="background: rgb(34, 94, 168);"></div>
</div>
<div class="swatch">
  <strong>yellowgreenblue-5</strong>
  <div title="#ffffcc" style="background: rgb(255, 255, 204);"></div>
  <div title="#a1dab4" style="background: rgb(161, 218, 180);"></div>
  <div title="#41b6c4" style="background: rgb(65, 182, 196);"></div>
  <div title="#2c7fb8" style="background: rgb(44, 127, 184);"></div>
  <div title="#253494" style="background: rgb(37, 52, 148);"></div>
</div>
<div class="swatch">
  <strong>yellowgreenblue-6</strong>
  <div title="#ffffcc" style="background: rgb(255, 255, 204);"></div>
  <div title="#c7e9b4" style="background: rgb(199, 233, 180);"></div>
  <div title="#7fcdbb" style="background: rgb(127, 205, 187);"></div>
  <div title="#41b6c4" style="background: rgb(65, 182, 196);"></div>
  <div title="#2c7fb8" style="background: rgb(44, 127, 184);"></div>
  <div title="#253494" style="background: rgb(37, 52, 148);"></div>
</div>
<div class="swatch">
  <strong>yellowgreenblue-7</strong>
  <div title="#ffffcc" style="background: rgb(255, 255, 204);"></div>
  <div title="#c7e9b4" style="background: rgb(199, 233, 180);"></div>
  <div title="#7fcdbb" style="background: rgb(127, 205, 187);"></div>
  <div title="#41b6c4" style="background: rgb(65, 182, 196);"></div>
  <div title="#1d91c0" style="background: rgb(29, 145, 192);"></div>
  <div title="#225ea8" style="background: rgb(34, 94, 168);"></div>
  <div title="#0c2c84" style="background: rgb(12, 44, 132);"></div>
</div>
<div class="swatch">
  <strong>yellowgreenblue-8</strong>
  <div title="#ffffd9" style="background: rgb(255, 255, 217);"></div>
  <div title="#edf8b1" style="background: rgb(237, 248, 177);"></div>
  <div title="#c7e9b4" style="background: rgb(199, 233, 180);"></div>
  <div title="#7fcdbb" style="background: rgb(127, 205, 187);"></div>
  <div title="#41b6c4" style="background: rgb(65, 182, 196);"></div>
  <div title="#1d91c0" style="background: rgb(29, 145, 192);"></div>
  <div title="#225ea8" style="background: rgb(34, 94, 168);"></div>
  <div title="#0c2c84" style="background: rgb(12, 44, 132);"></div>
</div>
<div class="swatch">
  <strong>yellowgreenblue-9</strong>
  <div title="#ffffd9" style="background: rgb(255, 255, 217);"></div>
  <div title="#edf8b1" style="background: rgb(237, 248, 177);"></div>
  <div title="#c7e9b4" style="background: rgb(199, 233, 180);"></div>
  <div title="#7fcdbb" style="background: rgb(127, 205, 187);"></div>
  <div title="#41b6c4" style="background: rgb(65, 182, 196);"></div>
  <div title="#1d91c0" style="background: rgb(29, 145, 192);"></div>
  <div title="#225ea8" style="background: rgb(34, 94, 168);"></div>
  <div title="#253494" style="background: rgb(37, 52, 148);"></div>
  <div title="#081d58" style="background: rgb(8, 29, 88);"></div>
</div>
</div>

<div class="scheme">
<a name="yellowgreen" href="#yellowgreen">#</a> <strong>yellowgreen</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-yellowgreen">
      <stop offset="0%" stop-color="rgb(255, 255, 229)"></stop>
      <stop offset="10%" stop-color="rgb(247, 252, 196)"></stop>
      <stop offset="20%" stop-color="rgb(228, 244, 172)"></stop>
      <stop offset="30%" stop-color="rgb(199, 232, 155)"></stop>
      <stop offset="40%" stop-color="rgb(162, 216, 138)"></stop>
      <stop offset="50%" stop-color="rgb(120, 197, 120)"></stop>
      <stop offset="60%" stop-color="rgb(78, 175, 99)"></stop>
      <stop offset="70%" stop-color="rgb(47, 148, 78)"></stop>
      <stop offset="80%" stop-color="rgb(21, 121, 63)"></stop>
      <stop offset="90%" stop-color="rgb(3, 96, 52)"></stop>
      <stop offset="100%" stop-color="rgb(0, 69, 41)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-yellowgreen)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>yellowgreen-3</strong>
  <div title="#f7fcb9" style="background: rgb(247, 252, 185);"></div>
  <div title="#addd8e" style="background: rgb(173, 221, 142);"></div>
  <div title="#31a354" style="background: rgb(49, 163, 84);"></div>
</div>
<div class="swatch">
  <strong>yellowgreen-4</strong>
  <div title="#ffffcc" style="background: rgb(255, 255, 204);"></div>
  <div title="#c2e699" style="background: rgb(194, 230, 153);"></div>
  <div title="#78c679" style="background: rgb(120, 198, 121);"></div>
  <div title="#238443" style="background: rgb(35, 132, 67);"></div>
</div>
<div class="swatch">
  <strong>yellowgreen-5</strong>
  <div title="#ffffcc" style="background: rgb(255, 255, 204);"></div>
  <div title="#c2e699" style="background: rgb(194, 230, 153);"></div>
  <div title="#78c679" style="background: rgb(120, 198, 121);"></div>
  <div title="#31a354" style="background: rgb(49, 163, 84);"></div>
  <div title="#006837" style="background: rgb(0, 104, 55);"></div>
</div>
<div class="swatch">
  <strong>yellowgreen-6</strong>
  <div title="#ffffcc" style="background: rgb(255, 255, 204);"></div>
  <div title="#d9f0a3" style="background: rgb(217, 240, 163);"></div>
  <div title="#addd8e" style="background: rgb(173, 221, 142);"></div>
  <div title="#78c679" style="background: rgb(120, 198, 121);"></div>
  <div title="#31a354" style="background: rgb(49, 163, 84);"></div>
  <div title="#006837" style="background: rgb(0, 104, 55);"></div>
</div>
<div class="swatch">
  <strong>yellowgreen-7</strong>
  <div title="#ffffcc" style="background: rgb(255, 255, 204);"></div>
  <div title="#d9f0a3" style="background: rgb(217, 240, 163);"></div>
  <div title="#addd8e" style="background: rgb(173, 221, 142);"></div>
  <div title="#78c679" style="background: rgb(120, 198, 121);"></div>
  <div title="#41ab5d" style="background: rgb(65, 171, 93);"></div>
  <div title="#238443" style="background: rgb(35, 132, 67);"></div>
  <div title="#005a32" style="background: rgb(0, 90, 50);"></div>
</div>
<div class="swatch">
  <strong>yellowgreen-8</strong>
  <div title="#ffffe5" style="background: rgb(255, 255, 229);"></div>
  <div title="#f7fcb9" style="background: rgb(247, 252, 185);"></div>
  <div title="#d9f0a3" style="background: rgb(217, 240, 163);"></div>
  <div title="#addd8e" style="background: rgb(173, 221, 142);"></div>
  <div title="#78c679" style="background: rgb(120, 198, 121);"></div>
  <div title="#41ab5d" style="background: rgb(65, 171, 93);"></div>
  <div title="#238443" style="background: rgb(35, 132, 67);"></div>
  <div title="#005a32" style="background: rgb(0, 90, 50);"></div>
</div>
<div class="swatch">
  <strong>yellowgreen-9</strong>
  <div title="#ffffe5" style="background: rgb(255, 255, 229);"></div>
  <div title="#f7fcb9" style="background: rgb(247, 252, 185);"></div>
  <div title="#d9f0a3" style="background: rgb(217, 240, 163);"></div>
  <div title="#addd8e" style="background: rgb(173, 221, 142);"></div>
  <div title="#78c679" style="background: rgb(120, 198, 121);"></div>
  <div title="#41ab5d" style="background: rgb(65, 171, 93);"></div>
  <div title="#238443" style="background: rgb(35, 132, 67);"></div>
  <div title="#006837" style="background: rgb(0, 104, 55);"></div>
  <div title="#004529" style="background: rgb(0, 69, 41);"></div>
</div>
</div>

<div class="scheme">
<a name="yelloworangebrown" href="#yelloworangebrown">#</a> <strong>yelloworangebrown</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-yelloworangebrown">
      <stop offset="0%" stop-color="rgb(255, 255, 229)"></stop>
      <stop offset="10%" stop-color="rgb(255, 248, 196)"></stop>
      <stop offset="20%" stop-color="rgb(254, 234, 161)"></stop>
      <stop offset="30%" stop-color="rgb(254, 214, 118)"></stop>
      <stop offset="40%" stop-color="rgb(254, 186, 74)"></stop>
      <stop offset="50%" stop-color="rgb(251, 153, 44)"></stop>
      <stop offset="60%" stop-color="rgb(238, 121, 24)"></stop>
      <stop offset="70%" stop-color="rgb(216, 91, 10)"></stop>
      <stop offset="80%" stop-color="rgb(183, 67, 4)"></stop>
      <stop offset="90%" stop-color="rgb(143, 50, 4)"></stop>
      <stop offset="100%" stop-color="rgb(102, 37, 6)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-yelloworangebrown)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>yelloworangebrown-3</strong>
  <div title="#fff7bc" style="background: rgb(255, 247, 188);"></div>
  <div title="#fec44f" style="background: rgb(254, 196, 79);"></div>
  <div title="#d95f0e" style="background: rgb(217, 95, 14);"></div>
</div>
<div class="swatch">
  <strong>yelloworangebrown-4</strong>
  <div title="#ffffd4" style="background: rgb(255, 255, 212);"></div>
  <div title="#fed98e" style="background: rgb(254, 217, 142);"></div>
  <div title="#fe9929" style="background: rgb(254, 153, 41);"></div>
  <div title="#cc4c02" style="background: rgb(204, 76, 2);"></div>
</div>
<div class="swatch">
  <strong>yelloworangebrown-5</strong>
  <div title="#ffffd4" style="background: rgb(255, 255, 212);"></div>
  <div title="#fed98e" style="background: rgb(254, 217, 142);"></div>
  <div title="#fe9929" style="background: rgb(254, 153, 41);"></div>
  <div title="#d95f0e" style="background: rgb(217, 95, 14);"></div>
  <div title="#993404" style="background: rgb(153, 52, 4);"></div>
</div>
<div class="swatch">
  <strong>yelloworangebrown-6</strong>
  <div title="#ffffd4" style="background: rgb(255, 255, 212);"></div>
  <div title="#fee391" style="background: rgb(254, 227, 145);"></div>
  <div title="#fec44f" style="background: rgb(254, 196, 79);"></div>
  <div title="#fe9929" style="background: rgb(254, 153, 41);"></div>
  <div title="#d95f0e" style="background: rgb(217, 95, 14);"></div>
  <div title="#993404" style="background: rgb(153, 52, 4);"></div>
</div>
<div class="swatch">
  <strong>yelloworangebrown-7</strong>
  <div title="#ffffd4" style="background: rgb(255, 255, 212);"></div>
  <div title="#fee391" style="background: rgb(254, 227, 145);"></div>
  <div title="#fec44f" style="background: rgb(254, 196, 79);"></div>
  <div title="#fe9929" style="background: rgb(254, 153, 41);"></div>
  <div title="#ec7014" style="background: rgb(236, 112, 20);"></div>
  <div title="#cc4c02" style="background: rgb(204, 76, 2);"></div>
  <div title="#8c2d04" style="background: rgb(140, 45, 4);"></div>
</div>
<div class="swatch">
  <strong>yelloworangebrown-8</strong>
  <div title="#ffffe5" style="background: rgb(255, 255, 229);"></div>
  <div title="#fff7bc" style="background: rgb(255, 247, 188);"></div>
  <div title="#fee391" style="background: rgb(254, 227, 145);"></div>
  <div title="#fec44f" style="background: rgb(254, 196, 79);"></div>
  <div title="#fe9929" style="background: rgb(254, 153, 41);"></div>
  <div title="#ec7014" style="background: rgb(236, 112, 20);"></div>
  <div title="#cc4c02" style="background: rgb(204, 76, 2);"></div>
  <div title="#8c2d04" style="background: rgb(140, 45, 4);"></div>
</div>
<div class="swatch">
  <strong>yelloworangebrown-9</strong>
  <div title="#ffffe5" style="background: rgb(255, 255, 229);"></div>
  <div title="#fff7bc" style="background: rgb(255, 247, 188);"></div>
  <div title="#fee391" style="background: rgb(254, 227, 145);"></div>
  <div title="#fec44f" style="background: rgb(254, 196, 79);"></div>
  <div title="#fe9929" style="background: rgb(254, 153, 41);"></div>
  <div title="#ec7014" style="background: rgb(236, 112, 20);"></div>
  <div title="#cc4c02" style="background: rgb(204, 76, 2);"></div>
  <div title="#993404" style="background: rgb(153, 52, 4);"></div>
  <div title="#662506" style="background: rgb(102, 37, 6);"></div>
</div>
</div>

<div class="scheme">
<a name="yelloworangered" href="#yelloworangered">#</a> <strong>yelloworangered</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-yelloworangered">
      <stop offset="0%" stop-color="rgb(255, 255, 204)"></stop>
      <stop offset="10%" stop-color="rgb(255, 240, 169)"></stop>
      <stop offset="20%" stop-color="rgb(254, 224, 135)"></stop>
      <stop offset="30%" stop-color="rgb(254, 201, 101)"></stop>
      <stop offset="40%" stop-color="rgb(254, 171, 75)"></stop>
      <stop offset="50%" stop-color="rgb(253, 137, 60)"></stop>
      <stop offset="60%" stop-color="rgb(250, 92, 46)"></stop>
      <stop offset="70%" stop-color="rgb(236, 48, 35)"></stop>
      <stop offset="80%" stop-color="rgb(211, 17, 33)"></stop>
      <stop offset="90%" stop-color="rgb(175, 2, 37)"></stop>
      <stop offset="100%" stop-color="rgb(128, 0, 38)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-yelloworangered)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>yelloworangered-3</strong>
  <div title="#ffeda0" style="background: rgb(255, 237, 160);"></div>
  <div title="#feb24c" style="background: rgb(254, 178, 76);"></div>
  <div title="#f03b20" style="background: rgb(240, 59, 32);"></div>
</div>
<div class="swatch">
  <strong>yelloworangered-4</strong>
  <div title="#ffffb2" style="background: rgb(255, 255, 178);"></div>
  <div title="#fecc5c" style="background: rgb(254, 204, 92);"></div>
  <div title="#fd8d3c" style="background: rgb(253, 141, 60);"></div>
  <div title="#e31a1c" style="background: rgb(227, 26, 28);"></div>
</div>
<div class="swatch">
  <strong>yelloworangered-5</strong>
  <div title="#ffffb2" style="background: rgb(255, 255, 178);"></div>
  <div title="#fecc5c" style="background: rgb(254, 204, 92);"></div>
  <div title="#fd8d3c" style="background: rgb(253, 141, 60);"></div>
  <div title="#f03b20" style="background: rgb(240, 59, 32);"></div>
  <div title="#bd0026" style="background: rgb(189, 0, 38);"></div>
</div>
<div class="swatch">
  <strong>yelloworangered-6</strong>
  <div title="#ffffb2" style="background: rgb(255, 255, 178);"></div>
  <div title="#fed976" style="background: rgb(254, 217, 118);"></div>
  <div title="#feb24c" style="background: rgb(254, 178, 76);"></div>
  <div title="#fd8d3c" style="background: rgb(253, 141, 60);"></div>
  <div title="#f03b20" style="background: rgb(240, 59, 32);"></div>
  <div title="#bd0026" style="background: rgb(189, 0, 38);"></div>
</div>
<div class="swatch">
  <strong>yelloworangered-7</strong>
  <div title="#ffffb2" style="background: rgb(255, 255, 178);"></div>
  <div title="#fed976" style="background: rgb(254, 217, 118);"></div>
  <div title="#feb24c" style="background: rgb(254, 178, 76);"></div>
  <div title="#fd8d3c" style="background: rgb(253, 141, 60);"></div>
  <div title="#fc4e2a" style="background: rgb(252, 78, 42);"></div>
  <div title="#e31a1c" style="background: rgb(227, 26, 28);"></div>
  <div title="#b10026" style="background: rgb(177, 0, 38);"></div>
</div>
<div class="swatch">
  <strong>yelloworangered-8</strong>
  <div title="#ffffcc" style="background: rgb(255, 255, 204);"></div>
  <div title="#ffeda0" style="background: rgb(255, 237, 160);"></div>
  <div title="#fed976" style="background: rgb(254, 217, 118);"></div>
  <div title="#feb24c" style="background: rgb(254, 178, 76);"></div>
  <div title="#fd8d3c" style="background: rgb(253, 141, 60);"></div>
  <div title="#fc4e2a" style="background: rgb(252, 78, 42);"></div>
  <div title="#e31a1c" style="background: rgb(227, 26, 28);"></div>
  <div title="#b10026" style="background: rgb(177, 0, 38);"></div>
</div>
<div class="swatch">
  <strong>yelloworangered-9</strong>
  <div title="#ffffcc" style="background: rgb(255, 255, 204);"></div>
  <div title="#ffeda0" style="background: rgb(255, 237, 160);"></div>
  <div title="#fed976" style="background: rgb(254, 217, 118);"></div>
  <div title="#feb24c" style="background: rgb(254, 178, 76);"></div>
  <div title="#fd8d3c" style="background: rgb(253, 141, 60);"></div>
  <div title="#fc4e2a" style="background: rgb(252, 78, 42);"></div>
  <div title="#e31a1c" style="background: rgb(227, 26, 28);"></div>
  <div title="#bd0026" style="background: rgb(189, 0, 38);"></div>
  <div title="#800026" style="background: rgb(128, 0, 38);"></div>
</div>
</div>


### <a name="diverging"></a>Diverging Schemes

Diverging color schemes can be used to encode quantitative values with a meaningful mid-point, such as zero or the average value. Color ramps with different hues diverge with increasing saturation to highlight the values below and above the mid-point. These schemes include both continuous color palettes, and a limited set of discrete palettes with a suffix that indicates the desired number of colors.

<div class="scheme">
<a name="blueorange" href="#blueorange">#</a> <strong>blueorange</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-blueorange">
      <stop offset="0%" stop-color="rgb(5, 48, 97)"></stop>
      <stop offset="10%" stop-color="rgb(34, 101, 163)"></stop>
      <stop offset="20%" stop-color="rgb(75, 148, 196)"></stop>
      <stop offset="30%" stop-color="rgb(143, 194, 221)"></stop>
      <stop offset="40%" stop-color="rgb(205, 227, 238)"></stop>
      <stop offset="50%" stop-color="rgb(242, 240, 235)"></stop>
      <stop offset="60%" stop-color="rgb(253, 221, 179)"></stop>
      <stop offset="70%" stop-color="rgb(248, 182, 100)"></stop>
      <stop offset="80%" stop-color="rgb(221, 132, 31)"></stop>
      <stop offset="90%" stop-color="rgb(178, 90, 9)"></stop>
      <stop offset="100%" stop-color="rgb(127, 59, 8)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-blueorange)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>blueorange-3</strong>
  <div></div> <div></div> <div></div> <div></div>
  <div title="#67a9cf" style="background: rgb(103, 169, 207);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#f1a340" style="background: rgb(241, 163, 64);"></div>
</div>
<div class="swatch">
  <strong>blueorange-4</strong>
  <div></div> <div></div> <div></div>
  <div title="#0571b0" style="background: rgb(5, 113, 176);"></div>
  <div title="#92c5de" style="background: rgb(146, 197, 222);"></div>
  <div></div>
  <div title="#fdb863" style="background: rgb(253, 184, 99);"></div>
  <div title="#e66101" style="background: rgb(230, 97, 1);"></div>
</div>
<div class="swatch">
  <strong>blueorange-5</strong>
  <div></div> <div></div> <div></div>
  <div title="#0571b0" style="background: rgb(5, 113, 176);"></div>
  <div title="#92c5de" style="background: rgb(146, 197, 222);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#fdb863" style="background: rgb(253, 184, 99);"></div>
  <div title="#e66101" style="background: rgb(230, 97, 1);"></div>
</div>
<div class="swatch">
  <strong>blueorange-6</strong>
  <div></div> <div></div>
  <div title="#2166ac" style="background: rgb(33, 102, 172);"></div>
  <div title="#67a9cf" style="background: rgb(103, 169, 207);"></div>
  <div title="#d1e5f0" style="background: rgb(209, 229, 240);"></div>
  <div></div>
  <div title="#fee0b6" style="background: rgb(254, 224, 182);"></div>
  <div title="#f1a340" style="background: rgb(241, 163, 64);"></div>
  <div title="#b35806" style="background: rgb(179, 88, 6);"></div>
</div>
<div class="swatch">
  <strong>blueorange-7</strong>
  <div></div> <div></div>
  <div title="#2166ac" style="background: rgb(33, 102, 172);"></div>
  <div title="#67a9cf" style="background: rgb(103, 169, 207);"></div>
  <div title="#d1e5f0" style="background: rgb(209, 229, 240);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#fee0b6" style="background: rgb(254, 224, 182);"></div>
  <div title="#f1a340" style="background: rgb(241, 163, 64);"></div>
  <div title="#b35806" style="background: rgb(179, 88, 6);"></div>
</div>
<div class="swatch">
  <strong>blueorange-8</strong>
  <div></div>
  <div title="#2166ac" style="background: rgb(33, 102, 172);"></div>
  <div title="#4393c3" style="background: rgb(67, 147, 195);"></div>
  <div title="#92c5de" style="background: rgb(146, 197, 222);"></div>
  <div title="#d1e5f0" style="background: rgb(209, 229, 240);"></div>
  <div></div>
  <div title="#fee0b6" style="background: rgb(254, 224, 182);"></div>
  <div title="#fdb863" style="background: rgb(253, 184, 99);"></div>
  <div title="#e08214" style="background: rgb(224, 130, 20);"></div>
  <div title="#b35806" style="background: rgb(179, 88, 6);"></div>
</div>
<div class="swatch">
  <strong>blueorange-9</strong>
  <div></div>
  <div title="#2166ac" style="background: rgb(33, 102, 172);"></div>
  <div title="#4393c3" style="background: rgb(67, 147, 195);"></div>
  <div title="#92c5de" style="background: rgb(146, 197, 222);"></div>
  <div title="#d1e5f0" style="background: rgb(209, 229, 240);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#fee0b6" style="background: rgb(254, 224, 182);"></div>
  <div title="#fdb863" style="background: rgb(253, 184, 99);"></div>
  <div title="#e08214" style="background: rgb(224, 130, 20);"></div>
  <div title="#b35806" style="background: rgb(179, 88, 6);"></div>
</div>
<div class="swatch">
  <strong>blueorange-10</strong>
  <div title="#053061" style="background: rgb(5, 48, 97);"></div>
  <div title="#2166ac" style="background: rgb(33, 102, 172);"></div>
  <div title="#4393c3" style="background: rgb(67, 147, 195);"></div>
  <div title="#92c5de" style="background: rgb(146, 197, 222);"></div>
  <div title="#d1e5f0" style="background: rgb(209, 229, 240);"></div>
  <div></div>
  <div title="#fee0b6" style="background: rgb(254, 224, 182);"></div>
  <div title="#fdb863" style="background: rgb(253, 184, 99);"></div>
  <div title="#e08214" style="background: rgb(224, 130, 20);"></div>
  <div title="#b35806" style="background: rgb(179, 88, 6);"></div>
  <div title="#7f3b08" style="background: rgb(127, 59, 8);"></div>
</div>
<div class="swatch">
  <strong>blueorange-11</strong>
  <div title="#053061" style="background: rgb(5, 48, 97);"></div>
  <div title="#2166ac" style="background: rgb(33, 102, 172);"></div>
  <div title="#4393c3" style="background: rgb(67, 147, 195);"></div>
  <div title="#92c5de" style="background: rgb(146, 197, 222);"></div>
  <div title="#d1e5f0" style="background: rgb(209, 229, 240);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#fee0b6" style="background: rgb(254, 224, 182);"></div>
  <div title="#fdb863" style="background: rgb(253, 184, 99);"></div>
  <div title="#e08214" style="background: rgb(224, 130, 20);"></div>
  <div title="#b35806" style="background: rgb(179, 88, 6);"></div>
  <div title="#7f3b08" style="background: rgb(127, 59, 8);"></div>
</div>
</div>

<div class="scheme">
<a name="brownbluegreen" href="#brownbluegreen">#</a> <strong>brownbluegreen</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-brownbluegreen">
      <stop offset="0%" stop-color="rgb(84, 48, 5)"></stop>
      <stop offset="10%" stop-color="rgb(139, 84, 15)"></stop>
      <stop offset="20%" stop-color="rgb(188, 132, 53)"></stop>
      <stop offset="30%" stop-color="rgb(222, 190, 123)"></stop>
      <stop offset="40%" stop-color="rgb(242, 228, 192)"></stop>
      <stop offset="50%" stop-color="rgb(238, 241, 234)"></stop>
      <stop offset="60%" stop-color="rgb(195, 231, 226)"></stop>
      <stop offset="70%" stop-color="rgb(127, 201, 191)"></stop>
      <stop offset="80%" stop-color="rgb(57, 152, 143)"></stop>
      <stop offset="90%" stop-color="rgb(10, 103, 95)"></stop>
      <stop offset="100%" stop-color="rgb(0, 60, 48)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-brownbluegreen)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>brownbluegreen-3</strong>
  <div></div> <div></div> <div></div> <div></div>
  <div title="#d8b365" style="background: rgb(216, 179, 101);"></div>
  <div title="#f5f5f5" style="background: rgb(245, 245, 245);"></div>
  <div title="#5ab4ac" style="background: rgb(90, 180, 172);"></div>
</div>
<div class="swatch">
  <strong>brownbluegreen-4</strong>
  <div></div> <div></div> <div></div>
  <div title="#a6611a" style="background: rgb(166, 97, 26);"></div>
  <div title="#dfc27d" style="background: rgb(223, 194, 125);"></div>
  <div></div>
  <div title="#80cdc1" style="background: rgb(128, 205, 193);"></div>
  <div title="#018571" style="background: rgb(1, 133, 113);"></div>
</div>
<div class="swatch">
  <strong>brownbluegreen-5</strong>
  <div></div> <div></div> <div></div>
  <div title="#a6611a" style="background: rgb(166, 97, 26);"></div>
  <div title="#dfc27d" style="background: rgb(223, 194, 125);"></div>
  <div title="#f5f5f5" style="background: rgb(245, 245, 245);"></div>
  <div title="#80cdc1" style="background: rgb(128, 205, 193);"></div>
  <div title="#018571" style="background: rgb(1, 133, 113);"></div>
</div>
<div class="swatch">
  <strong>brownbluegreen-6</strong>
  <div></div> <div></div>
  <div title="#8c510a" style="background: rgb(140, 81, 10);"></div>
  <div title="#d8b365" style="background: rgb(216, 179, 101);"></div>
  <div title="#f6e8c3" style="background: rgb(246, 232, 195);"></div>
  <div></div>
  <div title="#c7eae5" style="background: rgb(199, 234, 229);"></div>
  <div title="#5ab4ac" style="background: rgb(90, 180, 172);"></div>
  <div title="#01665e" style="background: rgb(1, 102, 94);"></div>
</div>
<div class="swatch">
  <strong>brownbluegreen-7</strong>
  <div></div> <div></div>
  <div title="#8c510a" style="background: rgb(140, 81, 10);"></div>
  <div title="#d8b365" style="background: rgb(216, 179, 101);"></div>
  <div title="#f6e8c3" style="background: rgb(246, 232, 195);"></div>
  <div title="#f5f5f5" style="background: rgb(245, 245, 245);"></div>
  <div title="#c7eae5" style="background: rgb(199, 234, 229);"></div>
  <div title="#5ab4ac" style="background: rgb(90, 180, 172);"></div>
  <div title="#01665e" style="background: rgb(1, 102, 94);"></div>
</div>
<div class="swatch">
  <strong>brownbluegreen-8</strong>
  <div></div>
  <div title="#8c510a" style="background: rgb(140, 81, 10);"></div>
  <div title="#bf812d" style="background: rgb(191, 129, 45);"></div>
  <div title="#dfc27d" style="background: rgb(223, 194, 125);"></div>
  <div title="#f6e8c3" style="background: rgb(246, 232, 195);"></div>
  <div></div>
  <div title="#c7eae5" style="background: rgb(199, 234, 229);"></div>
  <div title="#80cdc1" style="background: rgb(128, 205, 193);"></div>
  <div title="#35978f" style="background: rgb(53, 151, 143);"></div>
  <div title="#01665e" style="background: rgb(1, 102, 94);"></div>
</div>
<div class="swatch">
  <strong>brownbluegreen-9</strong>
  <div></div>
  <div title="#8c510a" style="background: rgb(140, 81, 10);"></div>
  <div title="#bf812d" style="background: rgb(191, 129, 45);"></div>
  <div title="#dfc27d" style="background: rgb(223, 194, 125);"></div>
  <div title="#f6e8c3" style="background: rgb(246, 232, 195);"></div>
  <div title="#f5f5f5" style="background: rgb(245, 245, 245);"></div>
  <div title="#c7eae5" style="background: rgb(199, 234, 229);"></div>
  <div title="#80cdc1" style="background: rgb(128, 205, 193);"></div>
  <div title="#35978f" style="background: rgb(53, 151, 143);"></div>
  <div title="#01665e" style="background: rgb(1, 102, 94);"></div>
</div>
<div class="swatch">
  <strong>brownbluegreen-10</strong>
  <div title="#543005" style="background: rgb(84, 48, 5);"></div>
  <div title="#8c510a" style="background: rgb(140, 81, 10);"></div>
  <div title="#bf812d" style="background: rgb(191, 129, 45);"></div>
  <div title="#dfc27d" style="background: rgb(223, 194, 125);"></div>
  <div title="#f6e8c3" style="background: rgb(246, 232, 195);"></div>
  <div></div>
  <div title="#c7eae5" style="background: rgb(199, 234, 229);"></div>
  <div title="#80cdc1" style="background: rgb(128, 205, 193);"></div>
  <div title="#35978f" style="background: rgb(53, 151, 143);"></div>
  <div title="#01665e" style="background: rgb(1, 102, 94);"></div>
  <div title="#003c30" style="background: rgb(0, 60, 48);"></div>
</div>
<div class="swatch">
  <strong>brownbluegreen-11</strong>
  <div title="#543005" style="background: rgb(84, 48, 5);"></div>
  <div title="#8c510a" style="background: rgb(140, 81, 10);"></div>
  <div title="#bf812d" style="background: rgb(191, 129, 45);"></div>
  <div title="#dfc27d" style="background: rgb(223, 194, 125);"></div>
  <div title="#f6e8c3" style="background: rgb(246, 232, 195);"></div>
  <div title="#f5f5f5" style="background: rgb(245, 245, 245);"></div>
  <div title="#c7eae5" style="background: rgb(199, 234, 229);"></div>
  <div title="#80cdc1" style="background: rgb(128, 205, 193);"></div>
  <div title="#35978f" style="background: rgb(53, 151, 143);"></div>
  <div title="#01665e" style="background: rgb(1, 102, 94);"></div>
  <div title="#003c30" style="background: rgb(0, 60, 48);"></div>
</div>
</div>

<div class="scheme">
<a name="purplegreen" href="#purplegreen">#</a> <strong>purplegreen</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-purplegreen">
      <stop offset="0%" stop-color="rgb(64, 0, 75)"></stop>
      <stop offset="10%" stop-color="rgb(115, 47, 128)"></stop>
      <stop offset="20%" stop-color="rgb(154, 109, 170)"></stop>
      <stop offset="30%" stop-color="rgb(193, 164, 205)"></stop>
      <stop offset="40%" stop-color="rgb(228, 210, 230)"></stop>
      <stop offset="50%" stop-color="rgb(239, 240, 239)"></stop>
      <stop offset="60%" stop-color="rgb(214, 238, 209)"></stop>
      <stop offset="70%" stop-color="rgb(162, 215, 158)"></stop>
      <stop offset="80%" stop-color="rgb(92, 173, 101)"></stop>
      <stop offset="90%" stop-color="rgb(33, 120, 57)"></stop>
      <stop offset="100%" stop-color="rgb(0, 68, 27)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-purplegreen)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>purplegreen-3</strong>
  <div></div> <div></div> <div></div> <div></div>
  <div title="#af8dc3" style="background: rgb(175, 141, 195);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#7fbf7b" style="background: rgb(127, 191, 123);"></div>
</div>
<div class="swatch">
  <strong>purplegreen-4</strong>
  <div></div> <div></div> <div></div>
  <div title="#7b3294" style="background: rgb(123, 50, 148);"></div>
  <div title="#c2a5cf" style="background: rgb(194, 165, 207);"></div>
  <div></div>
  <div title="#a6dba0" style="background: rgb(166, 219, 160);"></div>
  <div title="#008837" style="background: rgb(0, 136, 55);"></div>
</div>
<div class="swatch">
  <strong>purplegreen-5</strong>
  <div></div> <div></div> <div></div>
  <div title="#7b3294" style="background: rgb(123, 50, 148);"></div>
  <div title="#c2a5cf" style="background: rgb(194, 165, 207);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#a6dba0" style="background: rgb(166, 219, 160);"></div>
  <div title="#008837" style="background: rgb(0, 136, 55);"></div>
</div>
<div class="swatch">
  <strong>purplegreen-6</strong>
  <div></div> <div></div>
  <div title="#762a83" style="background: rgb(118, 42, 131);"></div>
  <div title="#af8dc3" style="background: rgb(175, 141, 195);"></div>
  <div title="#e7d4e8" style="background: rgb(231, 212, 232);"></div>
  <div></div>
  <div title="#d9f0d3" style="background: rgb(217, 240, 211);"></div>
  <div title="#7fbf7b" style="background: rgb(127, 191, 123);"></div>
  <div title="#1b7837" style="background: rgb(27, 120, 55);"></div>
</div>
<div class="swatch">
  <strong>purplegreen-7</strong>
  <div></div> <div></div>
  <div title="#762a83" style="background: rgb(118, 42, 131);"></div>
  <div title="#af8dc3" style="background: rgb(175, 141, 195);"></div>
  <div title="#e7d4e8" style="background: rgb(231, 212, 232);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#d9f0d3" style="background: rgb(217, 240, 211);"></div>
  <div title="#7fbf7b" style="background: rgb(127, 191, 123);"></div>
  <div title="#1b7837" style="background: rgb(27, 120, 55);"></div>
</div>
<div class="swatch">
  <strong>purplegreen-8</strong>
  <div></div>
  <div title="#762a83" style="background: rgb(118, 42, 131);"></div>
  <div title="#9970ab" style="background: rgb(153, 112, 171);"></div>
  <div title="#c2a5cf" style="background: rgb(194, 165, 207);"></div>
  <div title="#e7d4e8" style="background: rgb(231, 212, 232);"></div>
  <div></div>
  <div title="#d9f0d3" style="background: rgb(217, 240, 211);"></div>
  <div title="#a6dba0" style="background: rgb(166, 219, 160);"></div>
  <div title="#5aae61" style="background: rgb(90, 174, 97);"></div>
  <div title="#1b7837" style="background: rgb(27, 120, 55);"></div>
</div>
<div class="swatch">
  <strong>purplegreen-9</strong>
  <div></div>
  <div title="#762a83" style="background: rgb(118, 42, 131);"></div>
  <div title="#9970ab" style="background: rgb(153, 112, 171);"></div>
  <div title="#c2a5cf" style="background: rgb(194, 165, 207);"></div>
  <div title="#e7d4e8" style="background: rgb(231, 212, 232);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#d9f0d3" style="background: rgb(217, 240, 211);"></div>
  <div title="#a6dba0" style="background: rgb(166, 219, 160);"></div>
  <div title="#5aae61" style="background: rgb(90, 174, 97);"></div>
  <div title="#1b7837" style="background: rgb(27, 120, 55);"></div>
</div>
<div class="swatch">
  <strong>purplegreen-10</strong>
  <div title="#40004b" style="background: rgb(64, 0, 75);"></div>
  <div title="#762a83" style="background: rgb(118, 42, 131);"></div>
  <div title="#9970ab" style="background: rgb(153, 112, 171);"></div>
  <div title="#c2a5cf" style="background: rgb(194, 165, 207);"></div>
  <div title="#e7d4e8" style="background: rgb(231, 212, 232);"></div>
  <div></div>
  <div title="#d9f0d3" style="background: rgb(217, 240, 211);"></div>
  <div title="#a6dba0" style="background: rgb(166, 219, 160);"></div>
  <div title="#5aae61" style="background: rgb(90, 174, 97);"></div>
  <div title="#1b7837" style="background: rgb(27, 120, 55);"></div>
  <div title="#00441b" style="background: rgb(0, 68, 27);"></div>
</div>
<div class="swatch">
  <strong>purplegreen-11</strong>
  <div title="#40004b" style="background: rgb(64, 0, 75);"></div>
  <div title="#762a83" style="background: rgb(118, 42, 131);"></div>
  <div title="#9970ab" style="background: rgb(153, 112, 171);"></div>
  <div title="#c2a5cf" style="background: rgb(194, 165, 207);"></div>
  <div title="#e7d4e8" style="background: rgb(231, 212, 232);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#d9f0d3" style="background: rgb(217, 240, 211);"></div>
  <div title="#a6dba0" style="background: rgb(166, 219, 160);"></div>
  <div title="#5aae61" style="background: rgb(90, 174, 97);"></div>
  <div title="#1b7837" style="background: rgb(27, 120, 55);"></div>
  <div title="#00441b" style="background: rgb(0, 68, 27);"></div>
</div>
</div>

<div class="scheme">
<a name="pinkyellowgreen" href="#pinkyellowgreen">#</a> <strong>pinkyellowgreen</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-pinkyellowgreen">
      <stop offset="0%" stop-color="rgb(142, 1, 82)"></stop>
      <stop offset="10%" stop-color="rgb(192, 38, 126)"></stop>
      <stop offset="20%" stop-color="rgb(221, 114, 173)"></stop>
      <stop offset="30%" stop-color="rgb(240, 179, 214)"></stop>
      <stop offset="40%" stop-color="rgb(250, 221, 237)"></stop>
      <stop offset="50%" stop-color="rgb(245, 243, 239)"></stop>
      <stop offset="60%" stop-color="rgb(225, 242, 202)"></stop>
      <stop offset="70%" stop-color="rgb(182, 222, 135)"></stop>
      <stop offset="80%" stop-color="rgb(128, 187, 71)"></stop>
      <stop offset="90%" stop-color="rgb(79, 145, 37)"></stop>
      <stop offset="100%" stop-color="rgb(39, 100, 25)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-pinkyellowgreen)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>pinkyellowgreen-3</strong>
  <div></div> <div></div> <div></div> <div></div>
  <div title="#e9a3c9" style="background: rgb(233, 163, 201);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#a1d76a" style="background: rgb(161, 215, 106);"></div>
</div>
<div class="swatch">
  <strong>pinkyellowgreen-4</strong>
  <div></div> <div></div> <div></div>
  <div title="#d01c8b" style="background: rgb(208, 28, 139);"></div>
  <div title="#f1b6da" style="background: rgb(241, 182, 218);"></div>
  <div></div>
  <div title="#b8e186" style="background: rgb(184, 225, 134);"></div>
  <div title="#4dac26" style="background: rgb(77, 172, 38);"></div>
</div>
<div class="swatch">
  <strong>pinkyellowgreen-5</strong>
  <div></div> <div></div> <div></div>
  <div title="#d01c8b" style="background: rgb(208, 28, 139);"></div>
  <div title="#f1b6da" style="background: rgb(241, 182, 218);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#b8e186" style="background: rgb(184, 225, 134);"></div>
  <div title="#4dac26" style="background: rgb(77, 172, 38);"></div>
</div>
<div class="swatch">
  <strong>pinkyellowgreen-6</strong>
  <div></div> <div></div>
  <div title="#c51b7d" style="background: rgb(197, 27, 125);"></div>
  <div title="#e9a3c9" style="background: rgb(233, 163, 201);"></div>
  <div title="#fde0ef" style="background: rgb(253, 224, 239);"></div>
  <div></div>
  <div title="#e6f5d0" style="background: rgb(230, 245, 208);"></div>
  <div title="#a1d76a" style="background: rgb(161, 215, 106);"></div>
  <div title="#4d9221" style="background: rgb(77, 146, 33);"></div>
</div>
<div class="swatch">
  <strong>pinkyellowgreen-7</strong>
  <div></div> <div></div>
  <div title="#c51b7d" style="background: rgb(197, 27, 125);"></div>
  <div title="#e9a3c9" style="background: rgb(233, 163, 201);"></div>
  <div title="#fde0ef" style="background: rgb(253, 224, 239);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#e6f5d0" style="background: rgb(230, 245, 208);"></div>
  <div title="#a1d76a" style="background: rgb(161, 215, 106);"></div>
  <div title="#4d9221" style="background: rgb(77, 146, 33);"></div>
</div>
<div class="swatch">
  <strong>pinkyellowgreen-8</strong>
  <div></div>
  <div title="#c51b7d" style="background: rgb(197, 27, 125);"></div>
  <div title="#de77ae" style="background: rgb(222, 119, 174);"></div>
  <div title="#f1b6da" style="background: rgb(241, 182, 218);"></div>
  <div title="#fde0ef" style="background: rgb(253, 224, 239);"></div>
  <div></div>
  <div title="#e6f5d0" style="background: rgb(230, 245, 208);"></div>
  <div title="#b8e186" style="background: rgb(184, 225, 134);"></div>
  <div title="#7fbc41" style="background: rgb(127, 188, 65);"></div>
  <div title="#4d9221" style="background: rgb(77, 146, 33);"></div>
</div>
<div class="swatch">
  <strong>pinkyellowgreen-9</strong>
  <div></div>
  <div title="#c51b7d" style="background: rgb(197, 27, 125);"></div>
  <div title="#de77ae" style="background: rgb(222, 119, 174);"></div>
  <div title="#f1b6da" style="background: rgb(241, 182, 218);"></div>
  <div title="#fde0ef" style="background: rgb(253, 224, 239);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#e6f5d0" style="background: rgb(230, 245, 208);"></div>
  <div title="#b8e186" style="background: rgb(184, 225, 134);"></div>
  <div title="#7fbc41" style="background: rgb(127, 188, 65);"></div>
  <div title="#4d9221" style="background: rgb(77, 146, 33);"></div>
</div>
<div class="swatch">
  <strong>pinkyellowgreen-10</strong>
  <div title="#8e0152" style="background: rgb(142, 1, 82);"></div>
  <div title="#c51b7d" style="background: rgb(197, 27, 125);"></div>
  <div title="#de77ae" style="background: rgb(222, 119, 174);"></div>
  <div title="#f1b6da" style="background: rgb(241, 182, 218);"></div>
  <div title="#fde0ef" style="background: rgb(253, 224, 239);"></div>
  <div></div>
  <div title="#e6f5d0" style="background: rgb(230, 245, 208);"></div>
  <div title="#b8e186" style="background: rgb(184, 225, 134);"></div>
  <div title="#7fbc41" style="background: rgb(127, 188, 65);"></div>
  <div title="#4d9221" style="background: rgb(77, 146, 33);"></div>
  <div title="#276419" style="background: rgb(39, 100, 25);"></div>
</div>
<div class="swatch">
  <strong>pinkyellowgreen-11</strong>
  <div title="#8e0152" style="background: rgb(142, 1, 82);"></div>
  <div title="#c51b7d" style="background: rgb(197, 27, 125);"></div>
  <div title="#de77ae" style="background: rgb(222, 119, 174);"></div>
  <div title="#f1b6da" style="background: rgb(241, 182, 218);"></div>
  <div title="#fde0ef" style="background: rgb(253, 224, 239);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#e6f5d0" style="background: rgb(230, 245, 208);"></div>
  <div title="#b8e186" style="background: rgb(184, 225, 134);"></div>
  <div title="#7fbc41" style="background: rgb(127, 188, 65);"></div>
  <div title="#4d9221" style="background: rgb(77, 146, 33);"></div>
  <div title="#276419" style="background: rgb(39, 100, 25);"></div>
</div>
</div>

<div class="scheme">
<a name="purpleorange" href="#purpleorange">#</a> <strong>purpleorange</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-purpleorange">
      <stop offset="0%" stop-color="rgb(45, 0, 75)"></stop>
      <stop offset="10%" stop-color="rgb(85, 45, 132)"></stop>
      <stop offset="20%" stop-color="rgb(129, 112, 172)"></stop>
      <stop offset="30%" stop-color="rgb(176, 170, 208)"></stop>
      <stop offset="40%" stop-color="rgb(215, 215, 233)"></stop>
      <stop offset="50%" stop-color="rgb(243, 238, 234)"></stop>
      <stop offset="60%" stop-color="rgb(253, 221, 179)"></stop>
      <stop offset="70%" stop-color="rgb(248, 182, 100)"></stop>
      <stop offset="80%" stop-color="rgb(221, 132, 31)"></stop>
      <stop offset="90%" stop-color="rgb(178, 90, 9)"></stop>
      <stop offset="100%" stop-color="rgb(127, 59, 8)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-purpleorange)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>purpleorange-3</strong>
  <div></div> <div></div> <div></div> <div></div>
  <div title="#998ec3" style="background: rgb(153, 142, 195);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#f1a340" style="background: rgb(241, 163, 64);"></div>
</div>
<div class="swatch">
  <strong>purpleorange-4</strong>
  <div></div> <div></div> <div></div>
  <div title="#5e3c99" style="background: rgb(94, 60, 153);"></div>
  <div title="#b2abd2" style="background: rgb(178, 171, 210);"></div>
  <div></div>
  <div title="#fdb863" style="background: rgb(253, 184, 99);"></div>
  <div title="#e66101" style="background: rgb(230, 97, 1);"></div>
</div>
<div class="swatch">
  <strong>purpleorange-5</strong>
  <div></div> <div></div> <div></div>
  <div title="#5e3c99" style="background: rgb(94, 60, 153);"></div>
  <div title="#b2abd2" style="background: rgb(178, 171, 210);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#fdb863" style="background: rgb(253, 184, 99);"></div>
  <div title="#e66101" style="background: rgb(230, 97, 1);"></div>
</div>
<div class="swatch">
  <strong>purpleorange-6</strong>
  <div></div> <div></div>
  <div title="#542788" style="background: rgb(84, 39, 136);"></div>
  <div title="#998ec3" style="background: rgb(153, 142, 195);"></div>
  <div title="#d8daeb" style="background: rgb(216, 218, 235);"></div>
  <div></div>
  <div title="#fee0b6" style="background: rgb(254, 224, 182);"></div>
  <div title="#f1a340" style="background: rgb(241, 163, 64);"></div>
  <div title="#b35806" style="background: rgb(179, 88, 6);"></div>
</div>
<div class="swatch">
  <strong>purpleorange-7</strong>
  <div></div> <div></div>
  <div title="#542788" style="background: rgb(84, 39, 136);"></div>
  <div title="#998ec3" style="background: rgb(153, 142, 195);"></div>
  <div title="#d8daeb" style="background: rgb(216, 218, 235);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#fee0b6" style="background: rgb(254, 224, 182);"></div>
  <div title="#f1a340" style="background: rgb(241, 163, 64);"></div>
  <div title="#b35806" style="background: rgb(179, 88, 6);"></div>
</div>
<div class="swatch">
  <strong>purpleorange-8</strong>
  <div></div>
  <div title="#542788" style="background: rgb(84, 39, 136);"></div>
  <div title="#8073ac" style="background: rgb(128, 115, 172);"></div>
  <div title="#b2abd2" style="background: rgb(178, 171, 210);"></div>
  <div title="#d8daeb" style="background: rgb(216, 218, 235);"></div>
  <div></div>
  <div title="#fee0b6" style="background: rgb(254, 224, 182);"></div>
  <div title="#fdb863" style="background: rgb(253, 184, 99);"></div>
  <div title="#e08214" style="background: rgb(224, 130, 20);"></div>
  <div title="#b35806" style="background: rgb(179, 88, 6);"></div>
</div>
<div class="swatch">
  <strong>purpleorange-9</strong>
  <div></div>
  <div title="#542788" style="background: rgb(84, 39, 136);"></div>
  <div title="#8073ac" style="background: rgb(128, 115, 172);"></div>
  <div title="#b2abd2" style="background: rgb(178, 171, 210);"></div>
  <div title="#d8daeb" style="background: rgb(216, 218, 235);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#fee0b6" style="background: rgb(254, 224, 182);"></div>
  <div title="#fdb863" style="background: rgb(253, 184, 99);"></div>
  <div title="#e08214" style="background: rgb(224, 130, 20);"></div>
  <div title="#b35806" style="background: rgb(179, 88, 6);"></div>
</div>
<div class="swatch">
  <strong>purpleorange-10</strong>
  <div title="#2d004b" style="background: rgb(45, 0, 75);"></div>
  <div title="#542788" style="background: rgb(84, 39, 136);"></div>
  <div title="#8073ac" style="background: rgb(128, 115, 172);"></div>
  <div title="#b2abd2" style="background: rgb(178, 171, 210);"></div>
  <div title="#d8daeb" style="background: rgb(216, 218, 235);"></div>
  <div></div>
  <div title="#fee0b6" style="background: rgb(254, 224, 182);"></div>
  <div title="#fdb863" style="background: rgb(253, 184, 99);"></div>
  <div title="#e08214" style="background: rgb(224, 130, 20);"></div>
  <div title="#b35806" style="background: rgb(179, 88, 6);"></div>
  <div title="#7f3b08" style="background: rgb(127, 59, 8);"></div>
</div>
<div class="swatch">
  <strong>purpleorange-11</strong>
  <div title="#2d004b" style="background: rgb(45, 0, 75);"></div>
  <div title="#542788" style="background: rgb(84, 39, 136);"></div>
  <div title="#8073ac" style="background: rgb(128, 115, 172);"></div>
  <div title="#b2abd2" style="background: rgb(178, 171, 210);"></div>
  <div title="#d8daeb" style="background: rgb(216, 218, 235);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#fee0b6" style="background: rgb(254, 224, 182);"></div>
  <div title="#fdb863" style="background: rgb(253, 184, 99);"></div>
  <div title="#e08214" style="background: rgb(224, 130, 20);"></div>
  <div title="#b35806" style="background: rgb(179, 88, 6);"></div>
  <div title="#7f3b08" style="background: rgb(127, 59, 8);"></div>
</div>
</div>

<div class="scheme">
<a name="redblue" href="#redblue">#</a> <strong>redblue</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-redblue">
      <stop offset="0%" stop-color="rgb(103, 0, 31)"></stop>
      <stop offset="10%" stop-color="rgb(172, 32, 47)"></stop>
      <stop offset="20%" stop-color="rgb(213, 96, 80)"></stop>
      <stop offset="30%" stop-color="rgb(241, 163, 133)"></stop>
      <stop offset="40%" stop-color="rgb(251, 215, 196)"></stop>
      <stop offset="50%" stop-color="rgb(242, 239, 238)"></stop>
      <stop offset="60%" stop-color="rgb(205, 227, 238)"></stop>
      <stop offset="70%" stop-color="rgb(143, 194, 221)"></stop>
      <stop offset="80%" stop-color="rgb(75, 148, 196)"></stop>
      <stop offset="90%" stop-color="rgb(34, 101, 163)"></stop>
      <stop offset="100%" stop-color="rgb(5, 48, 97)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-redblue)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>redblue-3</strong>
  <div></div> <div></div> <div></div> <div></div>
  <div title="#ef8a62" style="background: rgb(239, 138, 98);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#67a9cf" style="background: rgb(103, 169, 207);"></div>
</div>
<div class="swatch">
  <strong>redblue-4</strong>
  <div></div> <div></div> <div></div>
  <div title="#ca0020" style="background: rgb(202, 0, 32);"></div>
  <div title="#f4a582" style="background: rgb(244, 165, 130);"></div>
  <div></div>
  <div title="#92c5de" style="background: rgb(146, 197, 222);"></div>
  <div title="#0571b0" style="background: rgb(5, 113, 176);"></div>
</div>
<div class="swatch">
  <strong>redblue-5</strong>
  <div></div> <div></div> <div></div>
  <div title="#ca0020" style="background: rgb(202, 0, 32);"></div>
  <div title="#f4a582" style="background: rgb(244, 165, 130);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#92c5de" style="background: rgb(146, 197, 222);"></div>
  <div title="#0571b0" style="background: rgb(5, 113, 176);"></div>
</div>
<div class="swatch">
  <strong>redblue-6</strong>
  <div></div> <div></div>
  <div title="#b2182b" style="background: rgb(178, 24, 43);"></div>
  <div title="#ef8a62" style="background: rgb(239, 138, 98);"></div>
  <div title="#fddbc7" style="background: rgb(253, 219, 199);"></div>
  <div></div>
  <div title="#d1e5f0" style="background: rgb(209, 229, 240);"></div>
  <div title="#67a9cf" style="background: rgb(103, 169, 207);"></div>
  <div title="#2166ac" style="background: rgb(33, 102, 172);"></div>
</div>
<div class="swatch">
  <strong>redblue-7</strong>
  <div></div> <div></div>
  <div title="#b2182b" style="background: rgb(178, 24, 43);"></div>
  <div title="#ef8a62" style="background: rgb(239, 138, 98);"></div>
  <div title="#fddbc7" style="background: rgb(253, 219, 199);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#d1e5f0" style="background: rgb(209, 229, 240);"></div>
  <div title="#67a9cf" style="background: rgb(103, 169, 207);"></div>
  <div title="#2166ac" style="background: rgb(33, 102, 172);"></div>
</div>
<div class="swatch">
  <strong>redblue-8</strong>
  <div></div>
  <div title="#b2182b" style="background: rgb(178, 24, 43);"></div>
  <div title="#d6604d" style="background: rgb(214, 96, 77);"></div>
  <div title="#f4a582" style="background: rgb(244, 165, 130);"></div>
  <div title="#fddbc7" style="background: rgb(253, 219, 199);"></div>
  <div></div>
  <div title="#d1e5f0" style="background: rgb(209, 229, 240);"></div>
  <div title="#92c5de" style="background: rgb(146, 197, 222);"></div>
  <div title="#4393c3" style="background: rgb(67, 147, 195);"></div>
  <div title="#2166ac" style="background: rgb(33, 102, 172);"></div>
</div>
<div class="swatch">
  <strong>redblue-9</strong>
  <div></div>
  <div title="#b2182b" style="background: rgb(178, 24, 43);"></div>
  <div title="#d6604d" style="background: rgb(214, 96, 77);"></div>
  <div title="#f4a582" style="background: rgb(244, 165, 130);"></div>
  <div title="#fddbc7" style="background: rgb(253, 219, 199);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#d1e5f0" style="background: rgb(209, 229, 240);"></div>
  <div title="#92c5de" style="background: rgb(146, 197, 222);"></div>
  <div title="#4393c3" style="background: rgb(67, 147, 195);"></div>
  <div title="#2166ac" style="background: rgb(33, 102, 172);"></div>
</div>
<div class="swatch">
  <strong>redblue-10</strong>
  <div title="#67001f" style="background: rgb(103, 0, 31);"></div>
  <div title="#b2182b" style="background: rgb(178, 24, 43);"></div>
  <div title="#d6604d" style="background: rgb(214, 96, 77);"></div>
  <div title="#f4a582" style="background: rgb(244, 165, 130);"></div>
  <div title="#fddbc7" style="background: rgb(253, 219, 199);"></div>
  <div></div>
  <div title="#d1e5f0" style="background: rgb(209, 229, 240);"></div>
  <div title="#92c5de" style="background: rgb(146, 197, 222);"></div>
  <div title="#4393c3" style="background: rgb(67, 147, 195);"></div>
  <div title="#2166ac" style="background: rgb(33, 102, 172);"></div>
  <div title="#053061" style="background: rgb(5, 48, 97);"></div>
</div>
<div class="swatch">
  <strong>redblue-11</strong>
  <div title="#67001f" style="background: rgb(103, 0, 31);"></div>
  <div title="#b2182b" style="background: rgb(178, 24, 43);"></div>
  <div title="#d6604d" style="background: rgb(214, 96, 77);"></div>
  <div title="#f4a582" style="background: rgb(244, 165, 130);"></div>
  <div title="#fddbc7" style="background: rgb(253, 219, 199);"></div>
  <div title="#f7f7f7" style="background: rgb(247, 247, 247);"></div>
  <div title="#d1e5f0" style="background: rgb(209, 229, 240);"></div>
  <div title="#92c5de" style="background: rgb(146, 197, 222);"></div>
  <div title="#4393c3" style="background: rgb(67, 147, 195);"></div>
  <div title="#2166ac" style="background: rgb(33, 102, 172);"></div>
  <div title="#053061" style="background: rgb(5, 48, 97);"></div>
</div>
</div>

<div class="scheme">
<a name="redgrey" href="#redgrey">#</a> <strong>redgrey</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-redgrey">
      <stop offset="0%" stop-color="rgb(103, 0, 31)"></stop>
      <stop offset="10%" stop-color="rgb(172, 32, 47)"></stop>
      <stop offset="20%" stop-color="rgb(213, 96, 80)"></stop>
      <stop offset="30%" stop-color="rgb(241, 163, 133)"></stop>
      <stop offset="40%" stop-color="rgb(252, 216, 197)"></stop>
      <stop offset="50%" stop-color="rgb(250, 244, 241)"></stop>
      <stop offset="60%" stop-color="rgb(223, 223, 223)"></stop>
      <stop offset="70%" stop-color="rgb(184, 184, 184)"></stop>
      <stop offset="80%" stop-color="rgb(134, 134, 134)"></stop>
      <stop offset="90%" stop-color="rgb(78, 78, 78)"></stop>
      <stop offset="100%" stop-color="rgb(26, 26, 26)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-redgrey)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>redgrey-3</strong>
  <div></div> <div></div> <div></div> <div></div>
  <div title="#ef8a62" style="background: rgb(239, 138, 98);"></div>
  <div title="#ffffff" style="background: rgb(255, 255, 255);"></div>
  <div title="#999999" style="background: rgb(153, 153, 153);"></div>
</div>
<div class="swatch">
  <strong>redgrey-4</strong>
  <div></div> <div></div> <div></div>
  <div title="#ca0020" style="background: rgb(202, 0, 32);"></div>
  <div title="#f4a582" style="background: rgb(244, 165, 130);"></div>
  <div></div>
  <div title="#bababa" style="background: rgb(186, 186, 186);"></div>
  <div title="#404040" style="background: rgb(64, 64, 64);"></div>
</div>
<div class="swatch">
  <strong>redgrey-5</strong>
  <div></div> <div></div> <div></div>
  <div title="#ca0020" style="background: rgb(202, 0, 32);"></div>
  <div title="#f4a582" style="background: rgb(244, 165, 130);"></div>
  <div title="#ffffff" style="background: rgb(255, 255, 255);"></div>
  <div title="#bababa" style="background: rgb(186, 186, 186);"></div>
  <div title="#404040" style="background: rgb(64, 64, 64);"></div>
</div>
<div class="swatch">
  <strong>redgrey-6</strong>
  <div></div> <div></div>
  <div title="#b2182b" style="background: rgb(178, 24, 43);"></div>
  <div title="#ef8a62" style="background: rgb(239, 138, 98);"></div>
  <div title="#fddbc7" style="background: rgb(253, 219, 199);"></div>
  <div></div>
  <div title="#e0e0e0" style="background: rgb(224, 224, 224);"></div>
  <div title="#999999" style="background: rgb(153, 153, 153);"></div>
  <div title="#4d4d4d" style="background: rgb(77, 77, 77);"></div>
</div>
<div class="swatch">
  <strong>redgrey-7</strong>
  <div></div> <div></div>
  <div title="#b2182b" style="background: rgb(178, 24, 43);"></div>
  <div title="#ef8a62" style="background: rgb(239, 138, 98);"></div>
  <div title="#fddbc7" style="background: rgb(253, 219, 199);"></div>
  <div title="#ffffff" style="background: rgb(255, 255, 255);"></div>
  <div title="#e0e0e0" style="background: rgb(224, 224, 224);"></div>
  <div title="#999999" style="background: rgb(153, 153, 153);"></div>
  <div title="#4d4d4d" style="background: rgb(77, 77, 77);"></div>
</div>
<div class="swatch">
  <strong>redgrey-8</strong>
  <div></div>
  <div title="#b2182b" style="background: rgb(178, 24, 43);"></div>
  <div title="#d6604d" style="background: rgb(214, 96, 77);"></div>
  <div title="#f4a582" style="background: rgb(244, 165, 130);"></div>
  <div title="#fddbc7" style="background: rgb(253, 219, 199);"></div>
  <div></div>
  <div title="#e0e0e0" style="background: rgb(224, 224, 224);"></div>
  <div title="#bababa" style="background: rgb(186, 186, 186);"></div>
  <div title="#878787" style="background: rgb(135, 135, 135);"></div>
  <div title="#4d4d4d" style="background: rgb(77, 77, 77);"></div>
</div>
<div class="swatch">
  <strong>redgrey-9</strong>
  <div></div>
  <div title="#b2182b" style="background: rgb(178, 24, 43);"></div>
  <div title="#d6604d" style="background: rgb(214, 96, 77);"></div>
  <div title="#f4a582" style="background: rgb(244, 165, 130);"></div>
  <div title="#fddbc7" style="background: rgb(253, 219, 199);"></div>
  <div title="#ffffff" style="background: rgb(255, 255, 255);"></div>
  <div title="#e0e0e0" style="background: rgb(224, 224, 224);"></div>
  <div title="#bababa" style="background: rgb(186, 186, 186);"></div>
  <div title="#878787" style="background: rgb(135, 135, 135);"></div>
  <div title="#4d4d4d" style="background: rgb(77, 77, 77);"></div>
</div>
<div class="swatch">
  <strong>redgrey-10</strong>
  <div title="#67001f" style="background: rgb(103, 0, 31);"></div>
  <div title="#b2182b" style="background: rgb(178, 24, 43);"></div>
  <div title="#d6604d" style="background: rgb(214, 96, 77);"></div>
  <div title="#f4a582" style="background: rgb(244, 165, 130);"></div>
  <div title="#fddbc7" style="background: rgb(253, 219, 199);"></div>
  <div></div>
  <div title="#e0e0e0" style="background: rgb(224, 224, 224);"></div>
  <div title="#bababa" style="background: rgb(186, 186, 186);"></div>
  <div title="#878787" style="background: rgb(135, 135, 135);"></div>
  <div title="#4d4d4d" style="background: rgb(77, 77, 77);"></div>
  <div title="#1a1a1a" style="background: rgb(26, 26, 26);"></div>
</div>
<div class="swatch">
  <strong>redgrey-11</strong>
  <div title="#67001f" style="background: rgb(103, 0, 31);"></div>
  <div title="#b2182b" style="background: rgb(178, 24, 43);"></div>
  <div title="#d6604d" style="background: rgb(214, 96, 77);"></div>
  <div title="#f4a582" style="background: rgb(244, 165, 130);"></div>
  <div title="#fddbc7" style="background: rgb(253, 219, 199);"></div>
  <div title="#ffffff" style="background: rgb(255, 255, 255);"></div>
  <div title="#e0e0e0" style="background: rgb(224, 224, 224);"></div>
  <div title="#bababa" style="background: rgb(186, 186, 186);"></div>
  <div title="#878787" style="background: rgb(135, 135, 135);"></div>
  <div title="#4d4d4d" style="background: rgb(77, 77, 77);"></div>
  <div title="#1a1a1a" style="background: rgb(26, 26, 26);"></div>
</div>
</div>

<div class="scheme">
<a name="redyellowblue" href="#redyellowblue">#</a> <strong>redyellowblue</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-redyellowblue">
      <stop offset="0%" stop-color="rgb(165, 0, 38)"></stop>
      <stop offset="10%" stop-color="rgb(212, 50, 44)"></stop>
      <stop offset="20%" stop-color="rgb(241, 110, 67)"></stop>
      <stop offset="30%" stop-color="rgb(252, 172, 100)"></stop>
      <stop offset="40%" stop-color="rgb(254, 221, 144)"></stop>
      <stop offset="50%" stop-color="rgb(250, 248, 193)"></stop>
      <stop offset="60%" stop-color="rgb(220, 241, 236)"></stop>
      <stop offset="70%" stop-color="rgb(171, 214, 232)"></stop>
      <stop offset="80%" stop-color="rgb(117, 171, 208)"></stop>
      <stop offset="90%" stop-color="rgb(74, 116, 180)"></stop>
      <stop offset="100%" stop-color="rgb(49, 54, 149)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-redyellowblue)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>redyellowblue-3</strong>
  <div></div> <div></div> <div></div> <div></div>
  <div title="#fc8d59" style="background: rgb(252, 141, 89);"></div>
  <div title="#ffffbf" style="background: rgb(255, 255, 191);"></div>
  <div title="#91bfdb" style="background: rgb(145, 191, 219);"></div>
</div>
<div class="swatch">
  <strong>redyellowblue-4</strong>
  <div></div> <div></div> <div></div>
  <div title="#d7191c" style="background: rgb(215, 25, 28);"></div>
  <div title="#fdae61" style="background: rgb(253, 174, 97);"></div>
  <div></div>
  <div title="#abd9e9" style="background: rgb(171, 217, 233);"></div>
  <div title="#2c7bb6" style="background: rgb(44, 123, 182);"></div>
</div>
<div class="swatch">
  <strong>redyellowblue-5</strong>
  <div></div> <div></div> <div></div>
  <div title="#d7191c" style="background: rgb(215, 25, 28);"></div>
  <div title="#fdae61" style="background: rgb(253, 174, 97);"></div>
  <div title="#ffffbf" style="background: rgb(255, 255, 191);"></div>
  <div title="#abd9e9" style="background: rgb(171, 217, 233);"></div>
  <div title="#2c7bb6" style="background: rgb(44, 123, 182);"></div>
</div>
<div class="swatch">
  <strong>redyellowblue-6</strong>
  <div></div> <div></div>
  <div title="#d73027" style="background: rgb(215, 48, 39);"></div>
  <div title="#fc8d59" style="background: rgb(252, 141, 89);"></div>
  <div title="#fee090" style="background: rgb(254, 224, 144);"></div>
  <div></div>
  <div title="#e0f3f8" style="background: rgb(224, 243, 248);"></div>
  <div title="#91bfdb" style="background: rgb(145, 191, 219);"></div>
  <div title="#4575b4" style="background: rgb(69, 117, 180);"></div>
</div>
<div class="swatch">
  <strong>redyellowblue-7</strong>
  <div></div> <div></div>
  <div title="#d73027" style="background: rgb(215, 48, 39);"></div>
  <div title="#fc8d59" style="background: rgb(252, 141, 89);"></div>
  <div title="#fee090" style="background: rgb(254, 224, 144);"></div>
  <div title="#ffffbf" style="background: rgb(255, 255, 191);"></div>
  <div title="#e0f3f8" style="background: rgb(224, 243, 248);"></div>
  <div title="#91bfdb" style="background: rgb(145, 191, 219);"></div>
  <div title="#4575b4" style="background: rgb(69, 117, 180);"></div>
</div>
<div class="swatch">
  <strong>redyellowblue-8</strong>
  <div></div>
  <div title="#d73027" style="background: rgb(215, 48, 39);"></div>
  <div title="#f46d43" style="background: rgb(244, 109, 67);"></div>
  <div title="#fdae61" style="background: rgb(253, 174, 97);"></div>
  <div title="#fee090" style="background: rgb(254, 224, 144);"></div>
  <div></div>
  <div title="#e0f3f8" style="background: rgb(224, 243, 248);"></div>
  <div title="#abd9e9" style="background: rgb(171, 217, 233);"></div>
  <div title="#74add1" style="background: rgb(116, 173, 209);"></div>
  <div title="#4575b4" style="background: rgb(69, 117, 180);"></div>
</div>
<div class="swatch">
  <strong>redyellowblue-9</strong>
  <div></div>
  <div title="#d73027" style="background: rgb(215, 48, 39);"></div>
  <div title="#f46d43" style="background: rgb(244, 109, 67);"></div>
  <div title="#fdae61" style="background: rgb(253, 174, 97);"></div>
  <div title="#fee090" style="background: rgb(254, 224, 144);"></div>
  <div title="#ffffbf" style="background: rgb(255, 255, 191);"></div>
  <div title="#e0f3f8" style="background: rgb(224, 243, 248);"></div>
  <div title="#abd9e9" style="background: rgb(171, 217, 233);"></div>
  <div title="#74add1" style="background: rgb(116, 173, 209);"></div>
  <div title="#4575b4" style="background: rgb(69, 117, 180);"></div>
</div>
<div class="swatch">
  <strong>redyellowblue-10</strong>
  <div title="#a50026" style="background: rgb(165, 0, 38);"></div>
  <div title="#d73027" style="background: rgb(215, 48, 39);"></div>
  <div title="#f46d43" style="background: rgb(244, 109, 67);"></div>
  <div title="#fdae61" style="background: rgb(253, 174, 97);"></div>
  <div title="#fee090" style="background: rgb(254, 224, 144);"></div>
  <div></div>
  <div title="#e0f3f8" style="background: rgb(224, 243, 248);"></div>
  <div title="#abd9e9" style="background: rgb(171, 217, 233);"></div>
  <div title="#74add1" style="background: rgb(116, 173, 209);"></div>
  <div title="#4575b4" style="background: rgb(69, 117, 180);"></div>
  <div title="#313695" style="background: rgb(49, 54, 149);"></div>
</div>
<div class="swatch">
  <strong>redyellowblue-11</strong>
  <div title="#a50026" style="background: rgb(165, 0, 38);"></div>
  <div title="#d73027" style="background: rgb(215, 48, 39);"></div>
  <div title="#f46d43" style="background: rgb(244, 109, 67);"></div>
  <div title="#fdae61" style="background: rgb(253, 174, 97);"></div>
  <div title="#fee090" style="background: rgb(254, 224, 144);"></div>
  <div title="#ffffbf" style="background: rgb(255, 255, 191);"></div>
  <div title="#e0f3f8" style="background: rgb(224, 243, 248);"></div>
  <div title="#abd9e9" style="background: rgb(171, 217, 233);"></div>
  <div title="#74add1" style="background: rgb(116, 173, 209);"></div>
  <div title="#4575b4" style="background: rgb(69, 117, 180);"></div>
  <div title="#313695" style="background: rgb(49, 54, 149);"></div>
</div>
</div>

<div class="scheme">
<a name="redyellowgreen" href="#redyellowgreen">#</a> <strong>redyellowgreen</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-redyellowgreen">
      <stop offset="0%" stop-color="rgb(165, 0, 38)"></stop>
      <stop offset="10%" stop-color="rgb(212, 50, 44)"></stop>
      <stop offset="20%" stop-color="rgb(241, 110, 67)"></stop>
      <stop offset="30%" stop-color="rgb(252, 172, 99)"></stop>
      <stop offset="40%" stop-color="rgb(254, 221, 141)"></stop>
      <stop offset="50%" stop-color="rgb(249, 247, 174)"></stop>
      <stop offset="60%" stop-color="rgb(215, 238, 142)"></stop>
      <stop offset="70%" stop-color="rgb(164, 216, 110)"></stop>
      <stop offset="80%" stop-color="rgb(100, 188, 97)"></stop>
      <stop offset="90%" stop-color="rgb(34, 150, 79)"></stop>
      <stop offset="100%" stop-color="rgb(0, 104, 55)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-redyellowgreen)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>redyellowgreen-3</strong>
  <div></div> <div></div> <div></div> <div></div>
  <div title="#fc8d59" style="background: rgb(252, 141, 89);"></div>
  <div title="#ffffbf" style="background: rgb(255, 255, 191);"></div>
  <div title="#91cf60" style="background: rgb(145, 207, 96);"></div>
</div>
<div class="swatch">
  <strong>redyellowgreen-4</strong>
  <div></div> <div></div> <div></div>
  <div title="#d7191c" style="background: rgb(215, 25, 28);"></div>
  <div title="#fdae61" style="background: rgb(253, 174, 97);"></div>
  <div></div>
  <div title="#a6d96a" style="background: rgb(166, 217, 106);"></div>
  <div title="#1a9641" style="background: rgb(26, 150, 65);"></div>
</div>
<div class="swatch">
  <strong>redyellowgreen-5</strong>
  <div></div> <div></div> <div></div>
  <div title="#d7191c" style="background: rgb(215, 25, 28);"></div>
  <div title="#fdae61" style="background: rgb(253, 174, 97);"></div>
  <div title="#ffffbf" style="background: rgb(255, 255, 191);"></div>
  <div title="#a6d96a" style="background: rgb(166, 217, 106);"></div>
  <div title="#1a9641" style="background: rgb(26, 150, 65);"></div>
</div>
<div class="swatch">
  <strong>redyellowgreen-6</strong>
  <div></div> <div></div>
  <div title="#d73027" style="background: rgb(215, 48, 39);"></div>
  <div title="#fc8d59" style="background: rgb(252, 141, 89);"></div>
  <div title="#fee08b" style="background: rgb(254, 224, 139);"></div>
  <div></div>
  <div title="#d9ef8b" style="background: rgb(217, 239, 139);"></div>
  <div title="#91cf60" style="background: rgb(145, 207, 96);"></div>
  <div title="#1a9850" style="background: rgb(26, 152, 80);"></div>
</div>
<div class="swatch">
  <strong>redyellowgreen-7</strong>
  <div></div> <div></div>
  <div title="#d73027" style="background: rgb(215, 48, 39);"></div>
  <div title="#fc8d59" style="background: rgb(252, 141, 89);"></div>
  <div title="#fee08b" style="background: rgb(254, 224, 139);"></div>
  <div title="#ffffbf" style="background: rgb(255, 255, 191);"></div>
  <div title="#d9ef8b" style="background: rgb(217, 239, 139);"></div>
  <div title="#91cf60" style="background: rgb(145, 207, 96);"></div>
  <div title="#1a9850" style="background: rgb(26, 152, 80);"></div>
</div>
<div class="swatch">
  <strong>redyellowgreen-8</strong>
  <div></div>
  <div title="#d73027" style="background: rgb(215, 48, 39);"></div>
  <div title="#f46d43" style="background: rgb(244, 109, 67);"></div>
  <div title="#fdae61" style="background: rgb(253, 174, 97);"></div>
  <div title="#fee08b" style="background: rgb(254, 224, 139);"></div>
  <div></div>
  <div title="#d9ef8b" style="background: rgb(217, 239, 139);"></div>
  <div title="#a6d96a" style="background: rgb(166, 217, 106);"></div>
  <div title="#66bd63" style="background: rgb(102, 189, 99);"></div>
  <div title="#1a9850" style="background: rgb(26, 152, 80);"></div>
</div>
<div class="swatch">
  <strong>redyellowgreen-9</strong>
  <div></div>
  <div title="#d73027" style="background: rgb(215, 48, 39);"></div>
  <div title="#f46d43" style="background: rgb(244, 109, 67);"></div>
  <div title="#fdae61" style="background: rgb(253, 174, 97);"></div>
  <div title="#fee08b" style="background: rgb(254, 224, 139);"></div>
  <div title="#ffffbf" style="background: rgb(255, 255, 191);"></div>
  <div title="#d9ef8b" style="background: rgb(217, 239, 139);"></div>
  <div title="#a6d96a" style="background: rgb(166, 217, 106);"></div>
  <div title="#66bd63" style="background: rgb(102, 189, 99);"></div>
  <div title="#1a9850" style="background: rgb(26, 152, 80);"></div>
</div>
<div class="swatch">
  <strong>redyellowgreen-10</strong>
  <div title="#a50026" style="background: rgb(165, 0, 38);"></div>
  <div title="#d73027" style="background: rgb(215, 48, 39);"></div>
  <div title="#f46d43" style="background: rgb(244, 109, 67);"></div>
  <div title="#fdae61" style="background: rgb(253, 174, 97);"></div>
  <div title="#fee08b" style="background: rgb(254, 224, 139);"></div>
  <div></div>
  <div title="#d9ef8b" style="background: rgb(217, 239, 139);"></div>
  <div title="#a6d96a" style="background: rgb(166, 217, 106);"></div>
  <div title="#66bd63" style="background: rgb(102, 189, 99);"></div>
  <div title="#1a9850" style="background: rgb(26, 152, 80);"></div>
  <div title="#006837" style="background: rgb(0, 104, 55);"></div>
</div>
<div class="swatch">
  <strong>redyellowgreen-11</strong>
  <div title="#a50026" style="background: rgb(165, 0, 38);"></div>
  <div title="#d73027" style="background: rgb(215, 48, 39);"></div>
  <div title="#f46d43" style="background: rgb(244, 109, 67);"></div>
  <div title="#fdae61" style="background: rgb(253, 174, 97);"></div>
  <div title="#fee08b" style="background: rgb(254, 224, 139);"></div>
  <div title="#ffffbf" style="background: rgb(255, 255, 191);"></div>
  <div title="#d9ef8b" style="background: rgb(217, 239, 139);"></div>
  <div title="#a6d96a" style="background: rgb(166, 217, 106);"></div>
  <div title="#66bd63" style="background: rgb(102, 189, 99);"></div>
  <div title="#1a9850" style="background: rgb(26, 152, 80);"></div>
  <div title="#006837" style="background: rgb(0, 104, 55);"></div>
</div>
</div>

<div class="scheme">
<a name="spectral" href="#spectral">#</a> <strong>spectral</strong>
<svg viewBox="0,0,1,1" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gradient-spectral">
      <stop offset="0%" stop-color="rgb(158, 1, 66)"></stop>
      <stop offset="10%" stop-color="rgb(209, 60, 75)"></stop>
      <stop offset="20%" stop-color="rgb(240, 112, 74)"></stop>
      <stop offset="30%" stop-color="rgb(252, 172, 99)"></stop>
      <stop offset="40%" stop-color="rgb(254, 221, 141)"></stop>
      <stop offset="50%" stop-color="rgb(251, 248, 176)"></stop>
      <stop offset="60%" stop-color="rgb(224, 243, 161)"></stop>
      <stop offset="70%" stop-color="rgb(169, 221, 162)"></stop>
      <stop offset="80%" stop-color="rgb(105, 189, 169)"></stop>
      <stop offset="90%" stop-color="rgb(66, 136, 181)"></stop>
      <stop offset="100%" stop-color="rgb(94, 79, 162)"></stop>
    </linearGradient>
  </defs>
  <rect fill="url(#gradient-spectral)" x="0" y="0" width="1" height="1"></rect>
</svg>
<div class="swatch">
  <strong>spectral-3</strong>
  <div></div> <div></div> <div></div> <div></div>
  <div title="#fc8d59" style="background: rgb(252, 141, 89);"></div>
  <div title="#ffffbf" style="background: rgb(255, 255, 191);"></div>
  <div title="#99d594" style="background: rgb(153, 213, 148);"></div>
</div>
<div class="swatch">
  <strong>spectral-4</strong>
  <div></div> <div></div> <div></div>
  <div title="#d7191c" style="background: rgb(215, 25, 28);"></div>
  <div title="#fdae61" style="background: rgb(253, 174, 97);"></div>
  <div></div>
  <div title="#abdda4" style="background: rgb(171, 221, 164);"></div>
  <div title="#2b83ba" style="background: rgb(43, 131, 186);"></div>
</div>
<div class="swatch">
  <strong>spectral-5</strong>
  <div></div> <div></div> <div></div>
  <div title="#d7191c" style="background: rgb(215, 25, 28);"></div>
  <div title="#fdae61" style="background: rgb(253, 174, 97);"></div>
  <div title="#ffffbf" style="background: rgb(255, 255, 191);"></div>
  <div title="#abdda4" style="background: rgb(171, 221, 164);"></div>
  <div title="#2b83ba" style="background: rgb(43, 131, 186);"></div>
</div>
<div class="swatch">
  <strong>spectral-6</strong>
  <div></div> <div></div>
  <div title="#d53e4f" style="background: rgb(213, 62, 79);"></div>
  <div title="#fc8d59" style="background: rgb(252, 141, 89);"></div>
  <div title="#fee08b" style="background: rgb(254, 224, 139);"></div>
  <div></div>
  <div title="#e6f598" style="background: rgb(230, 245, 152);"></div>
  <div title="#99d594" style="background: rgb(153, 213, 148);"></div>
  <div title="#3288bd" style="background: rgb(50, 136, 189);"></div>
</div>
<div class="swatch">
  <strong>spectral-7</strong>
  <div></div> <div></div>
  <div title="#d53e4f" style="background: rgb(213, 62, 79);"></div>
  <div title="#fc8d59" style="background: rgb(252, 141, 89);"></div>
  <div title="#fee08b" style="background: rgb(254, 224, 139);"></div>
  <div title="#ffffbf" style="background: rgb(255, 255, 191);"></div>
  <div title="#e6f598" style="background: rgb(230, 245, 152);"></div>
  <div title="#99d594" style="background: rgb(153, 213, 148);"></div>
  <div title="#3288bd" style="background: rgb(50, 136, 189);"></div>
</div>
<div class="swatch">
  <strong>spectral-8</strong>
  <div></div>
  <div title="#d53e4f" style="background: rgb(213, 62, 79);"></div>
  <div title="#f46d43" style="background: rgb(244, 109, 67);"></div>
  <div title="#fdae61" style="background: rgb(253, 174, 97);"></div>
  <div title="#fee08b" style="background: rgb(254, 224, 139);"></div>
  <div></div>
  <div title="#e6f598" style="background: rgb(230, 245, 152);"></div>
  <div title="#abdda4" style="background: rgb(171, 221, 164);"></div>
  <div title="#66c2a5" style="background: rgb(102, 194, 165);"></div>
  <div title="#3288bd" style="background: rgb(50, 136, 189);"></div>
</div>
<div class="swatch">
  <strong>spectral-9</strong>
  <div></div>
  <div title="#d53e4f" style="background: rgb(213, 62, 79);"></div>
  <div title="#f46d43" style="background: rgb(244, 109, 67);"></div>
  <div title="#fdae61" style="background: rgb(253, 174, 97);"></div>
  <div title="#fee08b" style="background: rgb(254, 224, 139);"></div>
  <div title="#ffffbf" style="background: rgb(255, 255, 191);"></div>
  <div title="#e6f598" style="background: rgb(230, 245, 152);"></div>
  <div title="#abdda4" style="background: rgb(171, 221, 164);"></div>
  <div title="#66c2a5" style="background: rgb(102, 194, 165);"></div>
  <div title="#3288bd" style="background: rgb(50, 136, 189);"></div>
</div>
<div class="swatch">
  <strong>spectral-10</strong>
  <div title="#9e0142" style="background: rgb(158, 1, 66);"></div>
  <div title="#d53e4f" style="background: rgb(213, 62, 79);"></div>
  <div title="#f46d43" style="background: rgb(244, 109, 67);"></div>
  <div title="#fdae61" style="background: rgb(253, 174, 97);"></div>
  <div title="#fee08b" style="background: rgb(254, 224, 139);"></div>
  <div></div>
  <div title="#e6f598" style="background: rgb(230, 245, 152);"></div>
  <div title="#abdda4" style="background: rgb(171, 221, 164);"></div>
  <div title="#66c2a5" style="background: rgb(102, 194, 165);"></div>
  <div title="#3288bd" style="background: rgb(50, 136, 189);"></div>
  <div title="#5e4fa2" style="background: rgb(94, 79, 162);"></div>
</div>
<div class="swatch">
  <strong>spectral-11</strong>
  <div title="#9e0142" style="background: rgb(158, 1, 66);"></div>
  <div title="#d53e4f" style="background: rgb(213, 62, 79);"></div>
  <div title="#f46d43" style="background: rgb(244, 109, 67);"></div>
  <div title="#fdae61" style="background: rgb(253, 174, 97);"></div>
  <div title="#fee08b" style="background: rgb(254, 224, 139);"></div>
  <div title="#ffffbf" style="background: rgb(255, 255, 191);"></div>
  <div title="#e6f598" style="background: rgb(230, 245, 152);"></div>
  <div title="#abdda4" style="background: rgb(171, 221, 164);"></div>
  <div title="#66c2a5" style="background: rgb(102, 194, 165);"></div>
  <div title="#3288bd" style="background: rgb(50, 136, 189);"></div>
  <div title="#5e4fa2" style="background: rgb(94, 79, 162);"></div>
</div>
</div>
