import Bitmap from './Bitmap.js';

export default function(width, height, padding) {
  const ratio = Math.max(1, Math.sqrt((width * height) / 1e6)),
        w = ~~((width + 2 * padding + ratio) / ratio),
        h = ~~((height + 2 * padding + ratio) / ratio),
        scale = _ => ~~((_ + padding) / ratio);

  scale.invert = _ => (_ * ratio) - padding;
  scale.bitmap = () => Bitmap(w, h);
  scale.ratio = ratio;
  scale.padding = padding;
  scale.width = width;
  scale.height = height;

  return scale;
}