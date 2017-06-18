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
        cr = +cornerRadius.call(this, _);

    if (!context) context = buffer = path();

    if (cr <= 0) {
      context.rect(x1, y1, w, h);
    } else {
      var x2 = x1 + w,
          y2 = y1 + h;
      context.moveTo(x1 + cr, y1);
      context.lineTo(x2 - cr, y1);
      context.quadraticCurveTo(x2, y1, x2, y1 + cr);
      context.lineTo(x2, y2 - cr);
      context.quadraticCurveTo(x2, y2, x2 - cr, y2);
      context.lineTo(x1 + cr, y2);
      context.quadraticCurveTo(x1, y2, x1, y2 - cr);
      context.lineTo(x1, y1 + cr);
      context.quadraticCurveTo(x1, y1, x1 + cr, y1);
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
      cornerRadius = typeof _ === 'function' ? _ : constant(+_);
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
