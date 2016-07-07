import pathParse from './parse';
import pathRender from './render';

import {
  symbolCircle,
  symbolCross,
  symbolDiamond,
  symbolSquare,
  symbolTriangle
} from 'd3-shape';

var sqrt3 = Math.sqrt(3);

var symbolTriangleDown = {
  draw: function(context, size) {
    var y = Math.sqrt(size / (sqrt3 * 3));
    context.moveTo(0, y * 2);
    context.lineTo(-sqrt3 * y, -y);
    context.lineTo(sqrt3 * y, -y);
    context.closePath();
  }
};

var builtins = {
  'circle': symbolCircle,
  'cross': symbolCross,
  'diamond': symbolDiamond,
  'square': symbolSquare,
  'triangle-up': symbolTriangle,
  'triangle-down': symbolTriangleDown
};

export default function symbols(_) {
  return builtins.hasOwnProperty(_) ? builtins[_] : customSymbol(_);
}

var custom = {};

function customSymbol(path) {
  if (!custom.hasOwnProperty(path)) {
    var parsed = pathParse(path);
    custom[path] = {
      draw: function(context, size) {
        pathRender(context, parsed, 0, 0, Math.sqrt(size));
      }
    };
  }
  return custom[path];
}
