import translate from '../util/svg/translate';
import {pick} from '../util/canvas/pick';

function getImage(item, renderer) {
  var image = item.image;
  if (!image || image.url !== item.url) {
    image = (item.image = renderer.loadImage(item.url));
    item.image.url = item.url;
  }
  return image;
}

function imageXOffset(align, w) {
  return align === 'center' ? w / 2 : align === 'right' ? w : 0;
}

function imageYOffset(baseline, h) {
  return baseline === 'middle' ? h / 2 : baseline === 'bottom' ? h : 0;
}

function attr(emit, item, renderer) {
  var image = getImage(item, renderer),
      x = item.x || 0,
      y = item.y || 0,
      w = item.width || image.width || 0,
      h = item.height || image.height || 0,
      url = renderer.imageURL(item.url);

  x -= imageXOffset(item.align, w);
  y -= imageYOffset(item.baseline, h);

  emit('href', url, 'http://www.w3.org/1999/xlink', 'xlink:href');
  emit('transform', translate(x, y));
  emit('width', w);
  emit('height', h);
}

function bound(bounds, item) {
  var image = item.image,
      x = item.x || 0,
      y = item.y || 0,
      w = item.width || (image && image.width) || 0,
      h = item.height || (image && image.height) || 0;

  x -= imageXOffset(item.align, w);
  y -= imageYOffset(item.baseline, h);

  return bounds.set(x, y, x + w, y + h);
}

function draw(context, scene, bounds) {
  var items = scene.items,
      item, i, n;

  if (!items || !items.length) return;

  for (i=0, n=items.length; i<n; ++i) {
    item = items[i];
    if (bounds && !bounds.intersects(item.bounds)) continue; // bounds check

    var image = getImage(item, this),
        x = item.x || 0,
        y = item.y || 0,
        w = item.width || image.width || 0,
        h = item.height || image.height || 0,
        opacity;

    x -= imageXOffset(item.align, w);
    y -= imageYOffset(item.baseline, h);

    if (image.loaded) {
      context.globalAlpha = (opacity = item.opacity) != null ? opacity : 1;
      context.drawImage(image, x, y, w, h);
    }
  }
}

export default {
  type:   'image',
  tag:    'image',
  nested: false,
  attr:   attr,
  bound:  bound,
  draw:   draw,
  pick:   pick()
};
