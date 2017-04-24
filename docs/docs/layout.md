---
layout: spec
title: Layout
permalink: /docs/layout/index.html
---

A **layout** positions a collection of group marks within a grid, simplifying the composition of small multiples and coordinated multiple view displays. When applied at the top-level of a specification or within a group mark, all immediate children group marks will be collected and positioned according to the layout specification. The layout engine supports flow layout as well as column, row, and grid-aligned layouts.

The layout engine also supports inclusion of header and footer cells for both rows and columns, as well as row title and column title cells. To indicate headers, footers and titles, the specifications for these groups must include a `role` property set to one of `column-header`, `column-footer`, `column-title`, `row-header`, `row-footer`, or `row-title`. The number of header, footer, or title elements should match the number of rows or columns in the table. If there are fewer elements, some cells will be left empty. If there are too many elements, the additional elements will be ignored and a warning will be logged.

## Layout Properties

Properties for specifying a grid layout of contained group marks.

| Property      | Type                           | Description    |
| :------------ | :----------------------------: | :------------- |
| align         | {% include type t="String|Object" %}  | The alignment to apply to grid rows and columns. The supported string values are `all`, `each`, and `none` (the default). If set to `none`, a flow layout will be used, in which adjacent plots are simply placed one after the other. If set to `each`, elements will be  aligned into a clean grid structure, but each row or column may be of variable size. If set to `all`, elements will be aligned and each row or column will be sized identically based on the maximum observed size. String values for this property will be applied to both grid rows and columns. Alternatively, an object value of the form `{"row": string, "column": string}` can be used to supply different alignments for rows and columns.|
| bounds        | {% include type t="String" %}  | The bounds calculation method to use for determining the extent of a sub-plot. One of `full` (the default) or `flush`. If set to `full`, the entire calculated bounds (including axes, title, and legend) will be used. If set to `flush`, only the specified width and height values for the group mark will be used. The `flush` setting can be useful when attempting to place sub-plots without axes or legends into a uniform grid structure.|
| columns       | {% include type t="Number" %}  | The number of columns to include in the layout. If unspecified, an infinite number of columns (a single row) will be assumed.|
| padding       | {% include type t="Number|Object" %}  | The padding in pixels to add between elements within a row or column. An object value of the form `{"row": number, `"column"`: number}` can be used to supply different padding values for rows and columns.|
| offset        | {% include type t="Number|Object" %}  | The orthogonal offset in pixels by which to displace grid header, footer, and title cells from their position along the edge of the grid (default `0`). A number value applies to all header, footer, and title elements. An object value can be used to supply different values for each element; the supported properties are `columnHeader`, `columnFooter`, `columnTitle`, `rowHeader`, `rowFooter`, and `rowTitle`.|
| titleBand     | {% include type t="Number|Object" %}  | A band positioning parameter in the interval [0,1]indicating where in a cell a title should be placed. The default value is `0.5`, indicating a centered position. For a column title, `0` maps to the left edge of the title cell and `1` to right edge. A number value applies to both row and column titles. An object value of the form `{"row": number, "column": number}` can be used to supply different values for row and column titles.|
