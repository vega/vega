(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vega-canvas'), require('vega-dataflow'), require('vega-util'), require('vega-scale'), require('vega-statistics')) :
  typeof define === 'function' && define.amd ? define(['exports', 'vega-canvas', 'vega-dataflow', 'vega-util', 'vega-scale', 'vega-statistics'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.vega = global.vega || {}, global.vega.transforms = {}), global.vega, global.vega, global.vega, global.vega, global.vega));
})(this, (function (exports, vegaCanvas, vegaDataflow, vegaUtil, vegaScale, vegaStatistics) { 'use strict';

  /*
  Copyright (c) 2013, Jason Davies.
  All rights reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice, this
      list of conditions and the following disclaimer.

    * Redistributions in binary form must reproduce the above copyright notice,
      this list of conditions and the following disclaimer in the documentation
      and/or other materials provided with the distribution.

    * The name Jason Davies may not be used to endorse or promote products
      derived from this software without specific prior written permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
  DISCLAIMED. IN NO EVENT SHALL JASON DAVIES BE LIABLE FOR ANY DIRECT, INDIRECT,
  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
  OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
  ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  */

  // Word cloud layout by Jason Davies, https://www.jasondavies.com/wordcloud/
  // Algorithm due to Jonathan Feinberg, http://static.mrfeinberg.com/bv_ch03.pdf

  var cloudRadians = Math.PI / 180,
    cw = 1 << 11 >> 5,
    ch = 1 << 11;
  function cloud () {
    var size = [256, 256],
      text,
      font,
      fontSize,
      fontStyle,
      fontWeight,
      rotate,
      padding,
      spiral = archimedeanSpiral,
      words = [],
      random = Math.random,
      cloud = {};
    cloud.layout = function () {
      var contextAndRatio = getContext(vegaCanvas.canvas()),
        board = zeroArray((size[0] >> 5) * size[1]),
        bounds = null,
        n = words.length,
        i = -1,
        tags = [],
        data = words.map(d => ({
          text: text(d),
          font: font(d),
          style: fontStyle(d),
          weight: fontWeight(d),
          rotate: rotate(d),
          size: ~~(fontSize(d) + 1e-14),
          padding: padding(d),
          xoff: 0,
          yoff: 0,
          x1: 0,
          y1: 0,
          x0: 0,
          y0: 0,
          hasText: false,
          sprite: null,
          datum: d
        })).sort((a, b) => b.size - a.size);
      while (++i < n) {
        var d = data[i];
        d.x = size[0] * (random() + .5) >> 1;
        d.y = size[1] * (random() + .5) >> 1;
        cloudSprite(contextAndRatio, d, data, i);
        if (d.hasText && place(board, d, bounds)) {
          tags.push(d);
          if (bounds) cloudBounds(bounds, d);else bounds = [{
            x: d.x + d.x0,
            y: d.y + d.y0
          }, {
            x: d.x + d.x1,
            y: d.y + d.y1
          }];
          // Temporary hack
          d.x -= size[0] >> 1;
          d.y -= size[1] >> 1;
        }
      }
      return tags;
    };
    function getContext(canvas) {
      canvas.width = canvas.height = 1;
      var ratio = Math.sqrt(canvas.getContext('2d').getImageData(0, 0, 1, 1).data.length >> 2);
      canvas.width = (cw << 5) / ratio;
      canvas.height = ch / ratio;
      var context = canvas.getContext('2d');
      context.fillStyle = context.strokeStyle = 'red';
      context.textAlign = 'center';
      return {
        context: context,
        ratio: ratio
      };
    }
    function place(board, tag, bounds) {
      var startX = tag.x,
        startY = tag.y,
        maxDelta = Math.hypot(size[0], size[1]),
        s = spiral(size),
        dt = random() < .5 ? 1 : -1,
        t = -dt,
        dxdy,
        dx,
        dy;
      while (dxdy = s(t += dt)) {
        dx = ~~dxdy[0];
        dy = ~~dxdy[1];
        if (Math.min(Math.abs(dx), Math.abs(dy)) >= maxDelta) break;
        tag.x = startX + dx;
        tag.y = startY + dy;
        if (tag.x + tag.x0 < 0 || tag.y + tag.y0 < 0 || tag.x + tag.x1 > size[0] || tag.y + tag.y1 > size[1]) continue;
        // TODO only check for collisions within current bounds.
        if (!bounds || !cloudCollide(tag, board, size[0])) {
          if (!bounds || collideRects(tag, bounds)) {
            var sprite = tag.sprite,
              w = tag.width >> 5,
              sw = size[0] >> 5,
              lx = tag.x - (w << 4),
              sx = lx & 0x7f,
              msx = 32 - sx,
              h = tag.y1 - tag.y0,
              x = (tag.y + tag.y0) * sw + (lx >> 5),
              last;
            for (var j = 0; j < h; j++) {
              last = 0;
              for (var i = 0; i <= w; i++) {
                board[x + i] |= last << msx | (i < w ? (last = sprite[j * w + i]) >>> sx : 0);
              }
              x += sw;
            }
            tag.sprite = null;
            return true;
          }
        }
      }
      return false;
    }
    cloud.words = function (_) {
      if (arguments.length) {
        words = _;
        return cloud;
      } else {
        return words;
      }
    };
    cloud.size = function (_) {
      if (arguments.length) {
        size = [+_[0], +_[1]];
        return cloud;
      } else {
        return size;
      }
    };
    cloud.font = function (_) {
      if (arguments.length) {
        font = functor(_);
        return cloud;
      } else {
        return font;
      }
    };
    cloud.fontStyle = function (_) {
      if (arguments.length) {
        fontStyle = functor(_);
        return cloud;
      } else {
        return fontStyle;
      }
    };
    cloud.fontWeight = function (_) {
      if (arguments.length) {
        fontWeight = functor(_);
        return cloud;
      } else {
        return fontWeight;
      }
    };
    cloud.rotate = function (_) {
      if (arguments.length) {
        rotate = functor(_);
        return cloud;
      } else {
        return rotate;
      }
    };
    cloud.text = function (_) {
      if (arguments.length) {
        text = functor(_);
        return cloud;
      } else {
        return text;
      }
    };
    cloud.spiral = function (_) {
      if (arguments.length) {
        spiral = spirals[_] || _;
        return cloud;
      } else {
        return spiral;
      }
    };
    cloud.fontSize = function (_) {
      if (arguments.length) {
        fontSize = functor(_);
        return cloud;
      } else {
        return fontSize;
      }
    };
    cloud.padding = function (_) {
      if (arguments.length) {
        padding = functor(_);
        return cloud;
      } else {
        return padding;
      }
    };
    cloud.random = function (_) {
      if (arguments.length) {
        random = _;
        return cloud;
      } else {
        return random;
      }
    };
    return cloud;
  }

  // Fetches a monochrome sprite bitmap for the specified text.
  // Load in batches for speed.
  function cloudSprite(contextAndRatio, d, data, di) {
    if (d.sprite) return;
    var c = contextAndRatio.context,
      ratio = contextAndRatio.ratio;
    c.clearRect(0, 0, (cw << 5) / ratio, ch / ratio);
    var x = 0,
      y = 0,
      maxh = 0,
      n = data.length,
      w,
      w32,
      h,
      i,
      j;
    --di;
    while (++di < n) {
      d = data[di];
      c.save();
      c.font = d.style + ' ' + d.weight + ' ' + ~~((d.size + 1) / ratio) + 'px ' + d.font;
      w = c.measureText(d.text + 'm').width * ratio;
      h = d.size << 1;
      if (d.rotate) {
        var sr = Math.sin(d.rotate * cloudRadians),
          cr = Math.cos(d.rotate * cloudRadians),
          wcr = w * cr,
          wsr = w * sr,
          hcr = h * cr,
          hsr = h * sr;
        w = Math.max(Math.abs(wcr + hsr), Math.abs(wcr - hsr)) + 0x1f >> 5 << 5;
        h = ~~Math.max(Math.abs(wsr + hcr), Math.abs(wsr - hcr));
      } else {
        w = w + 0x1f >> 5 << 5;
      }
      if (h > maxh) maxh = h;
      if (x + w >= cw << 5) {
        x = 0;
        y += maxh;
        maxh = 0;
      }
      if (y + h >= ch) break;
      c.translate((x + (w >> 1)) / ratio, (y + (h >> 1)) / ratio);
      if (d.rotate) c.rotate(d.rotate * cloudRadians);
      c.fillText(d.text, 0, 0);
      if (d.padding) {
        c.lineWidth = 2 * d.padding;
        c.strokeText(d.text, 0, 0);
      }
      c.restore();
      d.width = w;
      d.height = h;
      d.xoff = x;
      d.yoff = y;
      d.x1 = w >> 1;
      d.y1 = h >> 1;
      d.x0 = -d.x1;
      d.y0 = -d.y1;
      d.hasText = true;
      x += w;
    }
    var pixels = c.getImageData(0, 0, (cw << 5) / ratio, ch / ratio).data,
      sprite = [];
    while (--di >= 0) {
      d = data[di];
      if (!d.hasText) continue;
      w = d.width;
      w32 = w >> 5;
      h = d.y1 - d.y0;
      // Zero the buffer
      for (i = 0; i < h * w32; i++) sprite[i] = 0;
      x = d.xoff;
      if (x == null) return;
      y = d.yoff;
      var seen = 0,
        seenRow = -1;
      for (j = 0; j < h; j++) {
        for (i = 0; i < w; i++) {
          var k = w32 * j + (i >> 5),
            m = pixels[(y + j) * (cw << 5) + (x + i) << 2] ? 1 << 31 - i % 32 : 0;
          sprite[k] |= m;
          seen |= m;
        }
        if (seen) seenRow = j;else {
          d.y0++;
          h--;
          j--;
          y++;
        }
      }
      d.y1 = d.y0 + seenRow;
      d.sprite = sprite.slice(0, (d.y1 - d.y0) * w32);
    }
  }

  // Use mask-based collision detection.
  function cloudCollide(tag, board, sw) {
    sw >>= 5;
    var sprite = tag.sprite,
      w = tag.width >> 5,
      lx = tag.x - (w << 4),
      sx = lx & 0x7f,
      msx = 32 - sx,
      h = tag.y1 - tag.y0,
      x = (tag.y + tag.y0) * sw + (lx >> 5),
      last;
    for (var j = 0; j < h; j++) {
      last = 0;
      for (var i = 0; i <= w; i++) {
        if ((last << msx | (i < w ? (last = sprite[j * w + i]) >>> sx : 0)) & board[x + i]) return true;
      }
      x += sw;
    }
    return false;
  }
  function cloudBounds(bounds, d) {
    var b0 = bounds[0],
      b1 = bounds[1];
    if (d.x + d.x0 < b0.x) b0.x = d.x + d.x0;
    if (d.y + d.y0 < b0.y) b0.y = d.y + d.y0;
    if (d.x + d.x1 > b1.x) b1.x = d.x + d.x1;
    if (d.y + d.y1 > b1.y) b1.y = d.y + d.y1;
  }
  function collideRects(a, b) {
    return a.x + a.x1 > b[0].x && a.x + a.x0 < b[1].x && a.y + a.y1 > b[0].y && a.y + a.y0 < b[1].y;
  }
  function archimedeanSpiral(size) {
    var e = size[0] / size[1];
    return function (t) {
      return [e * (t *= .1) * Math.cos(t), t * Math.sin(t)];
    };
  }
  function rectangularSpiral(size) {
    var dy = 4,
      dx = dy * size[0] / size[1],
      x = 0,
      y = 0;
    return function (t) {
      var sign = t < 0 ? -1 : 1;
      // See triangular numbers: T_n = n * (n + 1) / 2.
      switch (Math.sqrt(1 + 4 * sign * t) - sign & 3) {
        case 0:
          x += dx;
          break;
        case 1:
          y += dy;
          break;
        case 2:
          x -= dx;
          break;
        default:
          y -= dy;
          break;
      }
      return [x, y];
    };
  }

  // TODO reuse arrays?
  function zeroArray(n) {
    var a = [],
      i = -1;
    while (++i < n) a[i] = 0;
    return a;
  }
  function functor(d) {
    return typeof d === 'function' ? d : function () {
      return d;
    };
  }
  var spirals = {
    archimedean: archimedeanSpiral,
    rectangular: rectangularSpiral
  };

  const Output = ['x', 'y', 'font', 'fontSize', 'fontStyle', 'fontWeight', 'angle'];
  const Params = ['text', 'font', 'rotate', 'fontSize', 'fontStyle', 'fontWeight'];
  function Wordcloud(params) {
    vegaDataflow.Transform.call(this, cloud(), params);
  }
  Wordcloud.Definition = {
    'type': 'Wordcloud',
    'metadata': {
      'modifies': true
    },
    'params': [{
      'name': 'size',
      'type': 'number',
      'array': true,
      'length': 2
    }, {
      'name': 'font',
      'type': 'string',
      'expr': true,
      'default': 'sans-serif'
    }, {
      'name': 'fontStyle',
      'type': 'string',
      'expr': true,
      'default': 'normal'
    }, {
      'name': 'fontWeight',
      'type': 'string',
      'expr': true,
      'default': 'normal'
    }, {
      'name': 'fontSize',
      'type': 'number',
      'expr': true,
      'default': 14
    }, {
      'name': 'fontSizeRange',
      'type': 'number',
      'array': 'nullable',
      'default': [10, 50]
    }, {
      'name': 'rotate',
      'type': 'number',
      'expr': true,
      'default': 0
    }, {
      'name': 'text',
      'type': 'field'
    }, {
      'name': 'spiral',
      'type': 'string',
      'values': ['archimedean', 'rectangular']
    }, {
      'name': 'padding',
      'type': 'number',
      'expr': true
    }, {
      'name': 'as',
      'type': 'string',
      'array': true,
      'length': 7,
      'default': Output
    }]
  };
  vegaUtil.inherits(Wordcloud, vegaDataflow.Transform, {
    transform(_, pulse) {
      if (_.size && !(_.size[0] && _.size[1])) {
        vegaUtil.error('Wordcloud size dimensions must be non-zero.');
      }
      function modp(param) {
        const p = _[param];
        return vegaUtil.isFunction(p) && pulse.modified(p.fields);
      }
      const mod = _.modified();
      if (!(mod || pulse.changed(pulse.ADD_REM) || Params.some(modp))) return;
      const data = pulse.materialize(pulse.SOURCE).source,
        layout = this.value,
        as = _.as || Output;
      let fontSize = _.fontSize || 14,
        range;
      vegaUtil.isFunction(fontSize) ? range = _.fontSizeRange : fontSize = vegaUtil.constant(fontSize);

      // create font size scaling function as needed
      if (range) {
        const fsize = fontSize,
          sizeScale = vegaScale.scale('sqrt')().domain(vegaUtil.extent(data, fsize)).range(range);
        fontSize = x => sizeScale(fsize(x));
      }
      data.forEach(t => {
        t[as[0]] = NaN;
        t[as[1]] = NaN;
        t[as[3]] = 0;
      });

      // configure layout
      const words = layout.words(data).text(_.text).size(_.size || [500, 500]).padding(_.padding || 1).spiral(_.spiral || 'archimedean').rotate(_.rotate || 0).font(_.font || 'sans-serif').fontStyle(_.fontStyle || 'normal').fontWeight(_.fontWeight || 'normal').fontSize(fontSize).random(vegaStatistics.random).layout();
      const size = layout.size(),
        dx = size[0] >> 1,
        dy = size[1] >> 1,
        n = words.length;
      for (let i = 0, w, t; i < n; ++i) {
        w = words[i];
        t = w.datum;
        t[as[0]] = w.x + dx;
        t[as[1]] = w.y + dy;
        t[as[2]] = w.font;
        t[as[3]] = w.size;
        t[as[4]] = w.style;
        t[as[5]] = w.weight;
        t[as[6]] = w.rotate;
      }
      return pulse.reflow(mod).modifies(as);
    }
  });

  exports.wordcloud = Wordcloud;

}));
