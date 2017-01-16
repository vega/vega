import {toSet} from 'vega-util';

var Skip = toSet(['rule']),
    Swap = toSet(['group', 'image', 'rect'])

export default function(encode, marktype) {
  var code = '';

  if (Skip[marktype]) return code;

  if (encode.x2) {
    if (encode.x) {
      if (Swap[marktype]) {
        code += 'if(o.x>o.x2)$=o.x,o.x=o.x2,o.x2=$;';
      }
      code += 'o.width=o.x2-o.x;';
    } else if (encode.width) {
      code += 'o.x=o.x2-o.width;';
    } else {
      code += 'o.x=o.x2;';
    }
  }

  if (encode.xc) {
    if (encode.width) {
      code += 'o.x=o.xc-o.width/2;';
    } else {
      code += 'o.x=o.xc;';
    }
  }

  if (encode.y2) {
    if (encode.y) {
      if (Swap[marktype]) {
        code += 'if(o.y>o.y2)$=o.y,o.y=o.y2,o.y2=$;';
      }
      code += 'o.height=o.y2-o.y;';
    } else if (encode.height) {
      code += 'o.y=o.y2-o.height;';
    } else {
      code += 'o.y=o.y2;';
    }
  }

  if (encode.yc) {
    if (encode.height) {
      code += 'o.y=o.yc-o.height/2;';
    } else {
      code += 'o.y=o.yc;';
    }
  }

  return code;
}
