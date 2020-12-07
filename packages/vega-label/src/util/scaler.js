import Bitmap from './Bitmap';

export default function(width, height, padding) {
  const ratio = Math.max(1, Math.sqrt((width * height) / 1e6));
  const w = ~~((width + 2 * padding + ratio) / ratio);
  const h = ~~((height + 2 * padding + ratio) / ratio);
  const scale = _ => ~~((_ + padding) / ratio);

  scale.invert = _ => (_ * ratio) - padding;
  scale.bitmap = () => Bitmap(w, h);
  scale.ratio = ratio;
  scale.padding = padding;
  scale.width = width;
  scale.height = height;

  return scale;
}
