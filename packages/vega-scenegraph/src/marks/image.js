import {visit} from '../util/visit';
import {pick} from '../util/canvas/pick';
import {translate} from '../util/svg/transform';
import {truthy} from 'vega-util';

function getImage(item, renderer) {
  var image = item.image;
  if (!image || item.url && item.url !== image.url) {
    image = {complete: false, width: 0, height: 0};
    renderer.loadImage(item.url).then(image => {
      item.image = image;
      item.image.url = item.url;
    });
  }
  return image;
}

function imageWidth(item, image) {
  return item.width != null ? item.width
    : !image || !image.width ? 0
    : item.aspect !== false && item.height ? item.height * image.width / image.height
    : image.width;
}

function imageHeight(item, image) {
  return item.height != null ? item.height
    : !image || !image.height ? 0
    : item.aspect !== false && item.width ? item.width * image.height / image.width
    : image.height;
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
      w = imageWidth(item, image),
      h = imageHeight(item, image),
      a = item.aspect === false ? 'none' : 'xMidYMid';

  x -= imageXOffset(item.align, w);
  y -= imageYOffset(item.baseline, h);

  if (!image.src && image.toDataURL) {
    emit('href', image.toDataURL(), 'http://www.w3.org/1999/xlink', 'xlink:href');
  } else {
    emit('href', image.src || '', 'http://www.w3.org/1999/xlink', 'xlink:href');
  }
  emit('transform', translate(x, y));
  emit('width', w);
  emit('height', h);
  emit('preserveAspectRatio', a);
}

function bound(bounds, item) {
  var image = item.image,
      x = item.x || 0,
      y = item.y || 0,
      w = imageWidth(item, image),
      h = imageHeight(item, image);

  x -= imageXOffset(item.align, w);
  y -= imageYOffset(item.baseline, h);

  return bounds.set(x, y, x + w, y + h);
}

function draw(context, scene, bounds) {
  var renderer = this;

  visit(scene, function(item) {
    if (bounds && !bounds.intersects(item.bounds)) return; // bounds check

    var image = getImage(item, renderer),
        x = item.x || 0,
        y = item.y || 0,
        w = imageWidth(item, image),
        h = imageHeight(item, image),
        opacity, ar0, ar1, t;

    x -= imageXOffset(item.align, w);
    y -= imageYOffset(item.baseline, h);

    if (item.aspect !== false) {
      ar0 = image.width / image.height;
      ar1 = item.width / item.height;
      if (ar0 === ar0 && ar1 === ar1 && ar0 !== ar1) {
        if (ar1 < ar0) {
          t = w / ar0;
          y += (h - t) / 2;
          h = t;
        } else {
          t = h * ar0;
          x += (w - t) / 2;
          w = t;
        }
      }
    }

    if (image.complete || image.toDataURL) {
      context.globalAlpha = (opacity = item.opacity) != null ? opacity : 1;
      context.imageSmoothingEnabled = item.smooth !== false;
      context.drawImage(image, x, y, w, h);
    }
  });
}

export default {
  type:     'image',
  tag:      'image',
  nested:   false,
  attr:     attr,
  bound:    bound,
  draw:     draw,
  pick:     pick(),
  isect:    truthy, // bounds check is sufficient
  get:      getImage,
  xOffset:  imageXOffset,
  yOffset:  imageYOffset
};
