import {isGradient} from '../../Gradient.js';
import gradient from './gradient.js';

export default function(context, item, value) {
  if (!isGradient(value)) return value;

  // Preserve the origin when rotated bounds use another coordinate system.
  const type = item.mark?.marktype,
        translate = !item.angle || (type != null && type !== 'text' && type !== 'path');
  return gradient(context, value, item.bounds, translate);
}
