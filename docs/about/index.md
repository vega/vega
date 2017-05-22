---
layout: about
title: About the Vega Project
permalink: /about/index.html
---

Over years working in data visualization, we've sought to build tools that help designers craft sophisticated graphics, including systems such as [Prefuse](http://prefuse.org), [Protovis](http://protovis.org) and [D3.js](http://d3js.org). However, in the grand scheme of things, "artisanal" visualizations hand-coded by skilled designers are the exception, not the rule. The vast majority of the world’s visualizations instead are produced using end-user applications such as spreadsheets and business intelligence tools. While valuable, these tools often fall short of fully supporting the iterative, interactive process of data analysis. Improved tools could help a larger swath of people create effective visualizations and better understand their data.

**The goal of the [Vega project](https://vega.github.io/) is to promote an _ecosystem of usable and interoperable tools_, supporting use cases ranging from exploratory data analysis to effective communication via custom visualization design.**

This goal has led us to develop not a singular system, but rather a stack of tools for interactive data visualization. At the foundation of this stack is the Vega visualization grammar. Similar in spirit to how SQL provides a language for expressing database queries, Vega provides a [declarative language](https://en.wikipedia.org/wiki/Declarative_programming) for describing visualizations. Vega specifications include the data transformations and visual encoding rules needed to express a rich space of visualizations. Building on libraries such as D3, the Vega runtime parses specifications in a JSON format to produce interactive web-based graphics. One unique aspect of Vega is its support for declarative interaction design: instead of the "spaghetti code" of event handler callbacks, Vega treats user input (mouse movement, touch events, _etc._) as first-class streaming data to drive reactive updates to a visualization.

While Vega is useful in its own right (for example, [Vega is deployed on Wikipedia](https://www.mediawiki.org/wiki/Extension:Graph) to define visualizations directly within wiki pages), our primary motivation is for Vega to serve as a foundation for [higher-level tools](projects). **Vega provides a formal language and computational file format for representing and reasoning about visualizations.** In other words, Vega provides a more convenient yet powerful means for writing _programs_ that generate visualizations, ranging from interactive design tools to automatic chart recommendation tools. Vega provides a performant runtime and can serve as an "assembly language" for visualization, letting other tools focus on design questions rather than low-level implementation details.

## Want to Learn More?

| :------------------------- | :------------------ |
| [Video](video)             | Videos of presentations about Vega and related topics.|
| [Projects](projects)       | Other languages, tools and models built on Vega.|
| [Research](research)       | Research publications from the Vega project.|
| [Vega and D3](vega-and-d3) | On the relationship between Vega and D3.|
