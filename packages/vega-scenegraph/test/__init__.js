import * as vega from '../index.js';

// Standardize font metrics to suppress cross-platform variance.
vega.textMetrics.canvas(false);

// Deterministic text processor for testing: draws a box sized by text length.
// Returns null for the text "fail" and a custom copy text for "copy".
vega.textProcessor('test', text => text === 'fail' ? null : {
  svg: '<svg xmlns="http://www.w3.org/2000/svg" width="1ex" height="1ex"'
    + ` viewBox="0 -800 ${600 * text.length} 1000">`
    + `<rect y="-800" width="${600 * text.length}" height="1000"`
    + ' fill="currentColor"/></svg>',
  width: 0.6 * text.length,
  ascent: 0.8,
  descent: 0.2,
  copyText: text === 'copy' ? 'copied' : undefined
});

// for cross-platform rendering compatibility,
// draw text bounding boxes rather than text strings
// processed text is drawn as an image, so it uses the standard draw method
const drawText = vega.Marks.text.draw;
vega.Marks.text.draw = function(context, scene, bounds) {
  vega.sceneVisit(scene, item => {
    if (!item.text) return;
    if (item.textProcessor === 'test' && item.text !== 'fail') {
      drawText.call(this, context, {items: [item]}, bounds);
      return;
    }
    const b = vega.Marks.text.bound(item.bounds, item);
    if (item.fill) {
      context.fillStyle = item.fill;
      context.fillRect(b.x1, b.y1, b.width(), b.height());
    }
    if (item.stroke) {
      context.lineWidth = item.strokeWidth || 1;
      context.strokeStyle = item.stroke;
      context.strokeRect(b.x1, b.y1, b.width(), b.height());
    }
  });
};
