---
layout: transform
title: Label Transform
permalink: /docs/transforms/label/index.html
---

The **label** transform repositions text marks so that they are not colliding with other elements in the chart. The label transform avoids all marks of types listed in `avoidMarks` and the mark that is used as backing data (as explained in [reactive geometry](../../marks/#reactivegeom)) of the text mark this label transform is using as input.

The label transform is useful for labeling data points by creating a text mark that takes in data from the mark that represents the data point (we will call this mark the "base mark"). You can then use the label transform on the text mark to reposition the text so that the texts appear near their data points without colliding with other objects in the chart.

## Transform Parameters

| Property      |              Type               | Description                                                                                                                                                                                                                                                                                                                                                                                                                |
| :------------ | :-----------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sort          |  {% include type t="Field" %}   | the field indicating order of labels to be placed (**greater** will be placed **after**).                                                                                                                                                                                                                                                                                                                                  |
| padding       |  {% include type t="Number" %}  | the amount of pixels label can extend pass chart bounding box. **Default value:** `0`                                                                                                                                                                                                                                                                                                                                      |
| size          | {% include type t="Number[]" %} | {% include required %} size of the chart in format `[width, height]`. **This size have to match with the chart size**.                                                                                                                                                                                                                                                                                                     |
| anchor        |    {% include type t="String    | String[]" %}                                                                                                                                                                                                                                                                                                                                                                                                               | list of anchor points of labels relative to its base mark's bounding box that you want Vega-Label to consider placing. The available options are `"top-left"`, `"left"`, `"bottom-left"`, `"top"`, `"bottom"`, `"top-right"`, `"right"`, `"bottom-right"`, `"middle"`. Can also be specified as a single anchor point. **Default value:** `["top-left", "left", "bottom-left", "top", "bottom", "top-right", "right", "bottom-right"]` |
| offset        |    {% include type t="Number    | Number[]" %}                                                                                                                                                                                                                                                                                                                                                                                                               | list of offset of labels relative to its base mark's bounding box. This list is parallel to the list of anchor points. This property can also be specified as a single number for a constant offset through every anchor point. **Default value:** `[1, 1, 1, 1, 1, 1, 1, 1]` |
| avoidMarks    | {% include type t="String[]" %} | The property `avoidMarks` is useful when you want to take other objects in the chart into consideration when placing label. For example, in connected scatter plot in below example, we do not want label to the data point itself, but we also do not want a line to cross over our labels. So, we have to add the name of the line mark into `avoidMarks` to avoid the line when placing labels. **Default value:** `[]` |
| avoidBaseMark | {% include type t="Boolean" %}  | the flag to specify if you want you labels to collide with the base mark. This flag is usually `true` (no allowing collision between labels and base mark); however, in some case like area chart, we want to place each label inside its area, so this flag has to be `false`. **Default value:** `true`                                                                                                                  |
| lineAnchor    |  {% include type t="String" %}  | When labeling group-line mark, you can only have one label per 1 line. `lineAnchor` specify if you want the labels to be at the start (`"start"`) or at the end (`"end"`) of the line. **Note**: this property only works with group line mark as the base mark. **Default value:** `"end"`                                                                                                                            |
| markIndex     |  {% include type t="Number" %}  | `markIndex` is used to specify which mark in the group mark you want to label because group mark can have more than 1 mark in the group. Regularly, `markIndex` is used with group-line and group-area mark. **Note**: `markIndex` only works with group mark as the base mark. **Default value:** `0`                                                                                                                     |
| as            | {% include type t="String[]" %} | The output fields written by the transform. The default is `['x', 'y', 'opacity', 'align', 'baseline', 'originalOpacity', 'transformed']`                                                                                                                                                                                                                                                                                  |

## Usage

### <a name="concept"></a>Basic concept

{% include embed spec="label-examples/basic-concept-no-label" %}

In this scatter plot example, we can add labels to each point by adding a text mark with the same `x` and `y` encoding channels to the chart. Since `x` and `y` encoding channels of the text mark follow the ones from the symbol mark (as we call this base mark), we can use reactive geometry to get information from the symbol mark and only modify the text.

{% include embed spec="label-examples/basic-concept-no-transform" %}

Even though reactive geometry anables the text mark to be placed at the same position as its base mark, it cannot prevent the texts from colliding into each other and to their base mark. We can, then, use label-transfrom to rearrange the text to be nicely spaced without collision. 

{% include embed spec="label-examples/basic-concept-transformed" %}

For better readability, we can also add ticks to indicate which label is belong to which point.

{% include embed spec="label-examples/basic-concept-with-tick" %}

In scatter plot, labeling can be done by having text mark that takes in data from the the symbol mark name `"basePoint"`(or what we call base mark). The text mark recieves all the information including position and bounding box of each point in `"basePoint"`. Then, we transform the text mark with label transform so that the labels spaced out nicely near the point it is representing and not colliding into each other.

**Note** the reason that we do not have `x` and `y` channels in the text mark's encoding is that label transform will replace the `x` and `y` channels of the text mark anyway. Label transform will use the position bounding box of each point in `"basePoint"` to decide the position of each label.

### Label in area chart

Placing labels in area chart is a special case. In area chart, area mark is in a group mark, and we also want our label to be inside area. For this reason, we have to create a text mark outside the group mark and use the group mark as the base mark. Then in property of label, we have to set `markIndex` to the index of the area mark in the group mark, so label-transform will know which mark in the group is the base mark. Then, we have to set `avoidBaseMark` to `false` because we want to place label inside its area. The example of label in area chart is in the [examples](./#examples) section.

### <a name="padding"></a>Example of using padding

{% include embed spec="label-examples/padding" %}

### <a name="anchoroffset"></a>Anchor and Offset

`anchor` and `offset` are parallel array to specify possible positions of each label in relation to its data point bounding box. For example, when `anchor = ["top", "left", "right", "bottom"]` and `offset = [1, 2, 3, 4]`, the possible positions of each label in relation to its data point bounding box are top with offset=1, left with offset=2, right with offset=3, bottom with offset=4.

When the arrays of `anchor` and `offset` have different size, vega transform will auto pad the small array using the last element. For example, `anchor = ["top", "bottom", "left"]` and `offset = [1, 2, 3, 4, 5, 6]`, the padded `anchor` is `["top", "bottom", "left", "left", "left", "left"]`.

## <a name="examples"></a>Examples of Vega-Label

### With area

#### In Stacked Area Chart - Job Voyager Example

{% include embed spec="label-examples/label_area_job_voyager" %}

Groups of area are used as the base mark, but `avoidBaseMark` flag is `false`, so labels can collide with their marks, but not to each other.

This example is from Vega [Job Voyager Example](../../../examples/job-voyager/). In the original example, each label is placed at the position that has the widest vertical space in the area. Vertical space is a good estimate of the largest area to be placing label; however, there can be some edge cases that vertical space does not well represent the area for placing label.

When adding label using text with label transform, each label is placed at the position that has the largest rectangle (with the same ratio as the label) fitting in the area. This method is better because label transform considers both horizontal and vertical space, so it is more likely for the label to be placed completely inside the area.


### With line

#### In Connected Scatter Plot - Connected Scatter Plot Example

{% include embed spec="label-examples/label_line_connected_scatter" %}

Symbol is used as the base mark to label, and line is the mark to avoid when labeling.

This example is from Vega [Connected Scatter Plot Example](../../../examples/connected-scatter-plot/). In the original example, the position of each label is pre-calculated into the dataset. Therefore, both the dataset and the vega spec depend on each other.

By adding label using text with label transform, the position of each label is calculated based on the object in the chart, so making changes to dataset or vega spec is more flexible.

#### In Grouped Lines Chart - Carbon Dioxide in the Atmosphere

{% include embed spec="label-examples/label_line_end" %}

Groups of line are used as the base mark to label, so one label is placed at the end of each line.

This example is inspired by Vega-Lite [Carbon Dioxide in the Atmosphere](https://vega.github.io/vega-lite/examples/layer_line_co2_concentration.html). In the original, Vega-Lite example, we need to find the start and the end data points of each line, and mark them as start/end. Then, place labels twice. First time, place each label at the lower-right of its data point, and filter out all the labels except the starting labels. Second time, do the same but place each label at the upper-right of its data point, and filter out all the labels except the end labels. This process is complicated, and may cause inefficiency by transforming and filtering out most of the labels.

By adding label using text with label transform in Vega, labels are automatically positioned at the end of each lines when the text mark's data is backed by the group-line mark using reactive geometry.

### With rect

#### In Stacked Bar Chart - Stacked Bar Chart Example

{% include embed spec="label-examples/label_rect_stack" %}

Rect is used as the base mark to label. There are 2 sets of labels in this chart. The first label is the overall height of each combined bars, and label positions is set to the outer top of each bar. The second label is the height of each bar, and label position is set to the inner top of each bar.

This example is inspired by Vega [Stacked Bar Chart Example](../../../examples/stacked-bar-chart/). The original example does not have label on the chart.

When adding label using text with label transform, labels are placed in the available position, and they are hidden when there is not enough space (collision with the bar itself). The example is at the blue bars at `x = 3, 7` and the orange bars at `x = 8, 9`.

#### In Bar Bhart - Bar Chart Example

{% include embed spec="label-examples/label_rect" %}

Rect is used as the base mark to label. The label position is set to inner right of each bar as default, and outer right if bar is too small.

### With interactive chart

#### Interactive Scatter Plot Example

{% include embed spec="label-examples/label_scatter_interactive" %}

Label-transform can also be used with interactive chart. Labling algorithm is implemented with greedy approach, so that the calculation is fast and deliver smooth experience when using with interactive chart. In this interactive scatter plot, label is hidden when (1) there are too many data point clustering and it is not possible to place the label near the data point, and (2) when the data point is out of chart bounding box.
