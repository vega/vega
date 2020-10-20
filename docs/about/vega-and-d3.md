---
layout: about
title: Vega and D3
permalink: /about/vega-and-d3/index.html
---

A number of great tools for web-based visualization already exist. Principal among them is [D3 (Data-Driven Documents)](http://d3js.org), by Mike Bostock and collaborators at the [Stanford Visualization Group](http://vis.stanford.edu) (now the [University of Washington Interactive Data Lab](http://idl.cs.washington.edu/)!).

To be clear, Vega is **not** intended as a "replacement" for D3. D3 is intentionally a lower-level library. During the early design of D3, we even referred to it as a "visualization kernel" rather than a "toolkit" or "framework". In addition to custom design, D3 is intended as a supporting layer for higher-level visualization tools. Vega is one such tool, and Vega uses D3 heavily within its implementation.

Vega provides a higher-level visualization specification language on top of D3. By design, D3 will maintain an "expressivity advantage" and in some cases will be better suited for novel design ideas. On the other hand, we intend Vega to be convenient for a wide range of common yet customizable visualizations. Vega's design builds on concepts we developed in both [Protovis](https://mbostock.github.io/protovis/) and D3, and is informed by years of research at Stanford and UW.

We had a number of motivations for creating Vega:

- **Support customizable designs**. Vega provides a convenient language of _graphical marks_ for creating custom graphics. These marks support a wide variety of chart types, without the artificial restrictions of monolithic chart widgets. Vega also provides an integrated workflow model of data transformations that supports custom processing and advanced layout algorithms.

- **Make visualizations more reusable and shareable**. Each Vega specification defines a reusable and shareable chart component. Input data can also be included within a specification, resulting in stand-alone definitions. In essence, Vega provides a file-format for saving and sharing visualization designs.

- **Enable programmatic generation of visualizations**. Once the learning curve has been climbed, manually writing D3 code can be both fun and efficient. However, D3 is not always the most convenient form for automatically generating visualizations. One goal of Vega is to provide a "target language" in which computer programs can dynamically generate visualizations. A program can construct a Vega specification (which is simply a JSON object) and then pass it off to the Vega runtime to visualize data. A number of new systems and research projects have been built on top of Vega, included higher-level languages such as [Vega-Lite](https://vega.github.io/vega-lite/) and new interactive applications such as [Lyra](http://idl.cs.washington.edu/projects/lyra/) and [Voyager](https://vega.github.io/voyager/).

- **Improve performance and platform flexibility**. D3 maintains a tight binding between data objects and Document Object Model (DOM) elements. This design decision carries a number of advantages, including use of CSS for styling, transparency, and ease of debugging. However, the core of D3 is limited to DOM-based displays. In contrast, Vega provides an abstraction layer for both rendering and event processing, which in turn provides flexibility. By using an internal scenegraph (rather than the DOM), Vega can render visualizations using either HTML5 Canvas or SVG. Canvas can provide improved rendering performance and scalability: often 2-10x faster than SVG for full-component redraws (though such comparisons require nuance). SVG, on the other hand, can be used for infinitely zoomable, print-worthy vector graphics. Vega can also be extended to other rendering systems, such as [WebGL](https://github.com/vega/vega-webgl-renderer).

As is always the case, the right tool for the job depends on the task at hand. We expect D3 will often be the tool of choice for realizing novel visualization design ideas. For common yet customizable chart types, programmatic generation, and flexible rendering, we believe Vega can further facilitate the use of data visualization across a variety of new tools and web applications.
