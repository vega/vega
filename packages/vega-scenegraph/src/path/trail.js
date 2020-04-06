import {Tau} from '../util/constants';
import {path} from 'd3-path';

export default function () {
  let x;
  let y;
  let size;
  let defined;
  let context = null;
  let ready;
  let x1;
  let y1;
  let r1;

  function point(x2, y2, w2) {
    const r2 = w2 / 2;

    if (ready) {
      let ux = y1 - y2;
      let uy = x2 - x1;

      if (ux || uy) {
        // get normal vector
        const ud = Math.sqrt(ux * ux + uy * uy);
        const rx = (ux /= ud) * r1;
        const ry = (uy /= ud) * r1;
        const t = Math.atan2(uy, ux);

        // draw segment
        context.moveTo(x1 - rx, y1 - ry);
        context.lineTo(x2 - ux * r2, y2 - uy * r2);
        context.arc(x2, y2, r2, t - Math.PI, t);
        context.lineTo(x1 + rx, y1 + ry);
        context.arc(x1, y1, r1, t, t + Math.PI);
      } else {
        context.arc(x2, y2, r2, 0, Tau);
      }
      context.closePath();
    } else {
      ready = 1;
    }
    x1 = x2;
    y1 = y2;
    r1 = r2;
  }

  function trail(data) {
    let i;
    const n = data.length;
    let d;
    let defined0 = false;
    let buffer;

    if (context == null) context = buffer = path();

    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined((d = data[i]), i, data)) === defined0) {
        if ((defined0 = !defined0)) ready = 0;
      }
      if (defined0) point(+x(d, i, data), +y(d, i, data), +size(d, i, data));
    }

    if (buffer) {
      context = null;
      return buffer + '' || null;
    }
  }

  trail.x = function (_) {
    if (arguments.length) {
      x = _;
      return trail;
    } else {
      return x;
    }
  };

  trail.y = function (_) {
    if (arguments.length) {
      y = _;
      return trail;
    } else {
      return y;
    }
  };

  trail.size = function (_) {
    if (arguments.length) {
      size = _;
      return trail;
    } else {
      return size;
    }
  };

  trail.defined = function (_) {
    if (arguments.length) {
      defined = _;
      return trail;
    } else {
      return defined;
    }
  };

  trail.context = function (_) {
    if (arguments.length) {
      if (_ == null) {
        context = null;
      } else {
        context = _;
      }
      return trail;
    } else {
      return context;
    }
  };

  return trail;
}
