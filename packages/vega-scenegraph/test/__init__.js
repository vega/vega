const vega = require('../');

// Standardize font metrics to suppress cross-platform variance.
vega.textMetrics.canvas(false);

// for cross-platform rendering compatibility,
// draw text bounding boxes rather than text strings
vega.Marks.text.draw = function(context, scene) {
  vega.sceneVisit(scene, item => {
    if (!item.text) return;
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
