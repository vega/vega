import { numberType } from './util';

const height = numberType;
    
Object.assign(height, { description: "The height of a visualization.\n\n__Default value:__\n- If a view's [`autosize`](https://vega.github.io/vega-lite/docs/size.html#autosize) type is `\"fit\"` or its y-channel has a [continuous scale](https://vega.github.io/vega-lite/docs/scale.html#continuous), the height will be the value of [`config.view.height`](https://vega.github.io/vega-lite/docs/spec.html#config).\n- For y-axis with a band or point scale: if [`rangeStep`](https://vega.github.io/vega-lite/docs/scale.html#band) is a numeric value or unspecified, the height is [determined by the range step, paddings, and the cardinality of the field mapped to y-channel](https://vega.github.io/vega-lite/docs/scale.html#band). Otherwise, if the `rangeStep` is `null`, the height will be the value of [`config.view.height`](https://vega.github.io/vega-lite/docs/spec.html#config).\n- If no field is mapped to `y` channel, the `height` will be the value of `rangeStep`.\n\n__Note__: For plots with [`row` and `column` channels](https://vega.github.io/vega-lite/docs/encoding.html#facet), this represents the height of a single view.\n\n__See also:__ The documentation for [width and height](https://vega.github.io/vega-lite/docs/size.html) contains more examples." })

export default {
  defs: {
    height
  },
};