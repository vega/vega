import {path} from 'd3-path';

function rectangleX(d) {
  return d.x;
}

function rectangleY(d) {
  return d.y;
}

function rectangleWidth(d) {
  return d.width;
}

function rectangleHeight(d) {
  return d.height;
}

function constant(_) {
  return function() { return _; };
}

export default function() {
  var x = rectangleX,
      y = rectangleY,
      width = rectangleWidth,
      height = rectangleHeight,
      cornerRadius = constant(0),
      context = null;

  function rectangle(_, x0, y0) {
    var buffer,
        x1 = x0 != null ? x0 : +x.call(this, _),
        y1 = y0 != null ? y0 : +y.call(this, _),
        w  = +width.call(this, _),
        h  = +height.call(this, _),
        cr = cornerRadius.call(this, _);

    if (!context) context = buffer = path();

    var crTL, crTR, crBL, crBR;
    if(typeof(cr) !== 'object') {
      crTL = crTR = crBL = crBR = Math.max(0, +cr);
    } else {
      crTL = crTR = crBL = crBR = cr.all !== undefined ? +cr.all : 0;
      // The schema should prevent specify top/bottom and left/right together
      if(cr.left !== undefined) crTL = crBL = Math.max(0, +cr.left);
      if(cr.right !== undefined) crTR = crBR = Math.max(0, +cr.right);
      if(cr.top !== undefined) crTL = crTR = Math.max(0, +cr.top);
      if(cr.bottom !== undefined) crBL = crBR = Math.max(0, +cr.bottom);
      // Individual corners takes higher priority
      if(cr.topLeft !== undefined) crTL = Math.max(0, +cr.topLeft);
      if(cr.topRight !== undefined) crTR = Math.max(0, +cr.topRight);
      if(cr.bottomLeft !== undefined) crBL = Math.max(0, +cr.bottomLeft);
      if(cr.bottomRight !== undefined) crBR = Math.max(0, +cr.bottomRight);
    }

    if (crTL <= 0 && crTR <= 0 && crBL <= 0 && crBR <= 0) {
      context.rect(x1, y1, w, h);
    } else {
      // Make sure corner radiuses doesn't exceed their minimum / maximum.
      // If exceed, scale all of them proportionally.
      var scaler;
      if(crTL + crTR > 0 && crTL + crTR >= Math.abs(w)) {
        scaler = Math.abs(w) / (crTL + crTR);
        crTL *= scaler;
        crTR *= scaler;
      }
      if(crBL + crBR > 0 && crBL + crBR >= Math.abs(w)) {
        scaler = Math.abs(w) / (crBL + crBR);
        crBL *= scaler;
        crBR *= scaler;
      }
      if(crTL + crBL > 0 && crTL + crBL >= Math.abs(h)) {
        scaler = Math.abs(h) / (crTL + crBL);
        crTL *= scaler;
        crBL *= scaler;
      }
      if(crTR + crBR > 0 && crTR + crBR >= Math.abs(h)) {
        scaler = Math.abs(h) / (crTR + crBR);
        crTR *= scaler;
        crBR *= scaler;
      }

      var x2 = x1 + w,
          y2 = y1 + h;
      context.moveTo(x1 + crTL, y1);
      context.lineTo(x2 - crTR, y1);
      context.quadraticCurveTo(x2, y1, x2, y1 + crTR);
      context.lineTo(x2, y2 - crBR);
      context.quadraticCurveTo(x2, y2, x2 - crBR, y2);
      context.lineTo(x1 + crBL, y2);
      context.quadraticCurveTo(x1, y2, x1, y2 - crBL);
      context.lineTo(x1, y1 + crTL);
      context.quadraticCurveTo(x1, y1, x1 + crTL, y1);
      context.closePath();
    }

    if (buffer) {
      context = null;
      return buffer + '' || null;
    }
  }

  rectangle.x = function(_) {
    if (arguments.length) {
      x = typeof _ === 'function' ? _ : constant(+_);
      return rectangle;
    } else {
      return x;
    }
  };

  rectangle.y = function(_) {
    if (arguments.length) {
      y = typeof _ === 'function' ? _ : constant(+_);
      return rectangle;
    } else {
      return y;
    }
  };

  rectangle.width = function(_) {
    if (arguments.length) {
      width = typeof _ === 'function' ? _ : constant(+_);
      return rectangle;
    } else {
      return width;
    }
  };

  rectangle.height = function(_) {
    if (arguments.length) {
      height = typeof _ === 'function' ? _ : constant(+_);
      return rectangle;
    } else {
      return height;
    }
  };

  rectangle.cornerRadius = function(_) {
    if (arguments.length) {
      cornerRadius = typeof _ === 'function' ? _ : constant(_);
      return rectangle;
    } else {
      return cornerRadius;
    }
  };

  rectangle.context = function(_) {
    if (arguments.length) {
      context = _ == null ? null : _;
      return rectangle;
    } else {
      return context;
    }
  };

  return rectangle;
}
