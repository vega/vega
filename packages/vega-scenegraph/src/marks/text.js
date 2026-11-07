import Bounds from '../Bounds.js';
import {DegToRad, HalfPi} from '../util/constants.js';
import {font, lineHeight, offset, processedText, textLines, textMetrics, textValue} from '../util/text.js';
import {processedOffset, processedURL} from '../util/textProcessor.js';
import {intersectBoxLine} from '../util/intersect.js';
import {visit} from '../util/visit.js';
import blend from '../util/canvas/blend.js';
import fill from '../util/canvas/fill.js';
import {pick} from '../util/canvas/pick.js';
import stroke from '../util/canvas/stroke.js';
import {rotate, translate} from '../util/svg/transform.js';
import {isArray, isString, lruCache} from 'vega-util';

const textAlign = {
  'left':   'start',
  'center': 'middle',
  'right':  'end'
};

const tempBounds = new Bounds();

function anchorPoint(item) {
  var x = item.x || 0,
      y = item.y || 0,
      r = item.radius || 0, t;

  if (r) {
    t = (item.theta || 0) - HalfPi;
    x += r * Math.cos(t);
    y += r * Math.sin(t);
  }

  tempBounds.x1 = x;
  tempBounds.y1 = y;
  return tempBounds;
}

// processed text is drawn in the fill color, or stroke color if unfilled;
// gradients can not be applied to an image, so fall back to black
function processedColor(item) {
  const c = item.fill || item.stroke;
  return isString(c) ? c : c ? 'black' : null;
}

function attr(emit, item) {
  var tp = processedText(item),
      dx = item.dx || 0,
      dy = (item.dy || 0) + (tp ? 0 : offset(item)),
      p = anchorPoint(item),
      x = p.x1,
      y = p.y1,
      a = item.angle || 0, t;

  emit('text-anchor', tp ? null : textAlign[item.align] || 'start');

  if (a) {
    t = translate(x, y) + ' ' + rotate(a);
    if (dx || dy) t += ' ' + translate(dx, dy);
  } else {
    t = translate(x + dx, y + dy);
  }
  emit('transform', t);
}

function bound(bounds, item, mode) {
  const tp = processedText(item);
  if (tp) return boundProcessed(bounds, item, mode, tp);

  var h = textMetrics.height(item),
      a = item.align,
      p = anchorPoint(item),
      x = p.x1,
      y = p.y1,
      dx = item.dx || 0,
      dy = (item.dy || 0) + offset(item) - Math.round(0.8*h), // use 4/5 offset
      tl = textLines(item),
      w;

  // get dimensions
  if (isArray(tl)) {
    // multi-line text
    h += lineHeight(item) * (tl.length - 1);
    w = tl.reduce((w, t) => Math.max(w, textMetrics.width(item, t)), 0);
  } else {
    // single-line text
    w = textMetrics.width(item, tl);
  }

  // horizontal alignment
  if (a === 'center') {
    dx -= (w / 2);
  } else if (a === 'right') {
    dx -= w;
  } else {
    // left by default, do nothing
  }

  bounds.set(dx+=x, dy+=y, dx+w, dy+h);
  return rotateBounds(bounds, item, mode, x, y);
}

function boundProcessed(bounds, item, mode, tp) {
  const p = anchorPoint(item),
        x = p.x1,
        y = p.y1,
        o = processedOffset(item, tp),
        x0 = x + (item.dx || 0) + o[0],
        y0 = y + (item.dy || 0) + o[1];

  bounds.set(x0, y0, x0 + tp.width, y0 + tp.height);
  return rotateBounds(bounds, item, mode, x, y);
}

function rotateBounds(bounds, item, mode, x, y) {
  if (item.angle && !mode) {
    bounds.rotate(item.angle * DegToRad, x, y);
  } else if (mode === 2) {
    return bounds.rotatedPoints(item.angle * DegToRad, x, y);
  }
  return bounds;
}

function draw(context, scene, bounds) {
  visit(scene, item => {
    var opacity = item.opacity == null ? 1 : item.opacity,
        p, x, y, i, lh, tl, str;

    if (bounds && !bounds.intersects(item.bounds) || // bounds check
        opacity === 0 || item.fontSize <= 0 ||
        item.text == null || item.text.length === 0) return;

    const tp = processedText(item);
    if (tp) {
      drawProcessed(this, context, item, tp, opacity);
      return;
    }

    context.font = font(item);
    context.textAlign = item.align || 'left';

    p = anchorPoint(item);
    x = p.x1,
    y = p.y1;

    if (item.angle) {
      context.save();
      context.translate(x, y);
      context.rotate(item.angle * DegToRad);
      x = y = 0; // reset x, y
    }
    x += (item.dx || 0);
    y += (item.dy || 0) + offset(item);

    tl = textLines(item);
    blend(context, item);
    if (isArray(tl)) {
      lh = lineHeight(item);
      for (i=0; i<tl.length; ++i) {
        str = textValue(item, tl[i]);
        if (item.fill && fill(context, item, opacity)) {
          context.fillText(str, x, y);
        }
        if (item.stroke && stroke(context, item, opacity)) {
          context.strokeText(str, x, y);
        }
        y += lh;
      }
    } else {
      str = textValue(item, tl);
      if (item.fill && fill(context, item, opacity)) {
        context.fillText(str, x, y);
      }
      if (item.stroke && stroke(context, item, opacity)) {
        context.strokeText(str, x, y);
      }
    }

    if (item.angle) context.restore();
  });
}

// cache of loaded images per renderer, keyed by data URL
function processedImage(renderer, context, item, tp) {
  const color = processedColor(item);
  if (!color) return null;

  const url = processedURL(tp, color, item.fillOpacity,
                (context.pixelRatio || 1)),
        cache = renderer._textImages || (renderer._textImages = lruCache(500));

  let img = cache.get(url);
  if (!img) {
    // placeholder until loaded; the renderer redraws when loading completes
    cache.set(url, img = {complete: false});
    renderer.loadImage(url).then(_ => cache.set(url, _));
  }

  if (img.complete && img.width) {
    item._textImage = img;
  }
  // until the new image loads, reuse the last image drawn for this item
  // to avoid blank frames when text changes dynamically
  return item._textImage || null;
}

function drawProcessed(renderer, context, item, tp, opacity) {
  const img = processedImage(renderer, context, item, tp);
  if (!img) return;

  const p = anchorPoint(item),
        o = processedOffset(item, tp);
  let x = p.x1,
      y = p.y1;

  if (item.angle) {
    context.save();
    context.translate(x, y);
    context.rotate(item.angle * DegToRad);
    x = y = 0;
  }

  blend(context, item);
  context.globalAlpha = opacity;
  context.drawImage(img,
    x + (item.dx || 0) + o[0],
    y + (item.dy || 0) + o[1],
    tp.width, tp.height
  );

  if (item.angle) context.restore();
}

// SVG element tag for an item: processed text is a group containing
// an image and, optionally, an invisible selectable text layer
function itemTag(item) {
  return processedText(item) ? 'g' : 'text';
}

// SVG child elements for processed text, or null for standard text
// the processed output is embedded as an image, which browsers render
// without running scripts or loading resources
function itemContent(item) {
  const tp = processedText(item);
  if (!tp) return null;

  const color = processedColor(item),
        o = processedOffset(item, tp),
        nodes = [];

  if (color) {
    nodes.push({
      tag: 'image',
      attrs: {
        'xlink:href': processedURL(tp, color, item.fillOpacity),
        x: o[0],
        y: o[1],
        width: tp.width,
        height: tp.height,
        preserveAspectRatio: 'none'
      }
    });
  }

  if (item.textSelectable !== false && tp.copyText) {
    // transparent text stretched over the image, enabling the processed
    // text to be selected, copied and found by text search
    nodes.push({
      tag: 'text',
      attrs: {
        x: o[0],
        y: o[1] + 0.8 * tp.height,
        'font-size': tp.height + 'px',
        textLength: tp.width,
        lengthAdjust: 'spacingAndGlyphs',
        'fill-opacity': 0,
        stroke: 'none',
        'aria-hidden': true
      },
      text: tp.copyText
    });
  }

  return nodes;
}

function hit(context, item, x, y, gx, gy) {
  if (item.fontSize <= 0) return false;
  if (!item.angle) return true; // bounds sufficient if no rotation

  // project point into space of unrotated bounds
  var p = anchorPoint(item),
      ax = p.x1,
      ay = p.y1,
      b = bound(tempBounds, item, 1),
      a = -item.angle * DegToRad,
      cos = Math.cos(a),
      sin = Math.sin(a),
      px = cos * gx - sin * gy + (ax - cos * ax + sin * ay),
      py = sin * gx + cos * gy + (ay - sin * ax - cos * ay);

  return b.contains(px, py);
}

function intersectText(item, box) {
  const p = bound(tempBounds, item, 2);
  return intersectBoxLine(box, p[0], p[1], p[2], p[3])
      || intersectBoxLine(box, p[0], p[1], p[4], p[5])
      || intersectBoxLine(box, p[4], p[5], p[6], p[7])
      || intersectBoxLine(box, p[2], p[3], p[6], p[7]);
}

export default {
  type:   'text',
  tag:    'text',
  nested: false,
  attr:   attr,
  bound:  bound,
  draw:   draw,
  pick:   pick(hit),
  isect:  intersectText,
  itemTag: itemTag,
  itemContent: itemContent
};
