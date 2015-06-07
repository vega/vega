var dl = require('datalib'),
    jsdom = require('jsdom'),
    canvasIO = require('../../src/render/canvas/'),
    parseStreams = require('../../src/parse/streams'),
    fs = require('fs');

describe('Streams', function() {
  var renderer = "canvas";

  function test(spec, interaction) {
    parseSpec(spec, function(chart) { 
      jsdom.env("<html><body></body></html>", function(err, window) {
        var document = window.document,
            body = d3.select(document).select('body').node(),
            isCanvas = (renderer === "canvas"),
            opt = {renderer: (renderer = (isCanvas = !isCanvas) ? "canvas" : "svg")};

        if (!isCanvas) opt.el = body;
        
        // HACK due to bug w/node-canvas+jsdom dropping attributes
        // so d3.select("canvas.marks") within Vega fails. So, 
        // manually initialize the canvas view handler.
        var view = chart(opt),
            w = view.width(),
            h = view.height(),
            pad = view.padding(),
            tw = w + (pad ? pad.left + pad.right : 0),
            th = h + (pad ? pad.top + pad.bottom : 0),
            canvas, ctx;

        if (isCanvas) {
          body.innerHTML = "<canvas class=\"marks\"></canvas>";
          view._el = body;
          canvas = d3.select(body).select("canvas").node();
          canvas.width  = tw;
          canvas.height = th;
          ctx = canvas.getContext("2d");
          ctx.setTransform(1, 0, 0, 1, pad.left, pad.top);
          view._renderer.context(ctx);

          // Manually init handler
          view._handler = new canvasIO.Handler().model(view.model());
          view._handler.el = body;
          view._handler._canvas = canvas;
          view._handler._padding = pad;
          view._handler._obj = view;
          parseStreams(view);
        }

        view.update();
        interaction(view, d3.select(body).select('.marks').node(), mouseEvt);
        
        function mouseEvt(type, x, y, target) {
          if (isCanvas) target = canvas;

          var mm = document.createEvent("MouseEvents");
          mm.initMouseEvent("mousemove", true, true, window, null, x, y, x, y, false, false, false, false, target);

          var evt;
          if (type == "wheel") {
            var delta = Math.floor(Math.random() * 2) ? 1 : -1;
            var eventInit = { deltaX: -delta, deltaY: -delta, clientX: x, clientY: y, pageX: x, pageY: y }
            evt = new WheelEvent("wheel", eventInit);
          } else {
            var evt = document.createEvent("MouseEvents");
            evt.initMouseEvent(type, true, true, window, null, x, y, x, y, false, false, false, false, target);
          }

          target.dispatchEvent(mm);
          target.dispatchEvent(evt);

          if (isCanvas) {
            view._handler.mousemove(mm);
            view._handler[type](evt);
          }
        }
      });
    });
  }

  it('should propagate DOM events', function(done) {
    var spec = {
      signals: [{
        name: "signalA",
        streams: [{ type: "mousedown", expr: "event" }]
      }, {
        name: "signalB",
        streams: [{ type: "mousedown", expr: "event.clientX" }]
      }, {
        name: "signalC",
        streams: [{ type: "mouseup", expr: "{x: event.clientX, y: event.clientY}"}]
      }]
    };

    test(spec, function(view, svg, mouseEvt) {
      mouseEvt('mousedown', 350, 350, svg);
      expect(view.signal('signalA')).to.have.property("type", "mousedown");
      expect(view.signal('signalB')).to.equal(350);

      mouseEvt('mouseup', 275, 265, svg);
      expect(view.signal('signalC')).to.deep.equal({ x: 275, y: 265 });

      done();
    });
  });

  describe('Element Selector', function() {
    var spec = {
      signals: [{
        name: "signalA",
        streams: [{ type: "@mark1:mousedown", expr: "event.clientX" }]
      }, {
        name: "signalB",
        streams: [{ type: "@mark2:mousedown", expr: "event.clientY" }]
      }, {
        name: "signalC",
        streams: [{ type: "rect:mousedown", expr: "event.clientX" }]
      }, {
        name: "signalD",
        streams: [{ type: "group:mousedown", expr: "event.clientY" }]
      }],

      marks: [{
        name: "mark1",
        type: "rect",
        properties: {
          enter: {
            x: {value: 25},
            y: {value: 25},
            width: {value: 25},
            height: {value: 25},
            fill: {value: "red"}
          }
        }
      }, {
        name: "mark2",
        type: "group",
        properties: {
          enter: {
            x: {value: 75},
            y: {value: 75},
            width: {value: 25},
            height: {value: 25},
            fill: {value: "red"}
          }
        }
      }]
    };

    it('should respect names', function(done) {
      test(spec, function(view, svg, mouseEvt) {
        mouseEvt('mousedown', 50, 50, d3.select(svg).select('.mark1 rect').node());
        expect(view.signal('signalA')).to.equal(50);
        expect(view.signal('signalB')).to.be.undefined;

        mouseEvt('mousedown', 75, 75, d3.select(svg).select('.mark2 rect').node());
        expect(view.signal('signalA')).to.equal(50);
        expect(view.signal('signalB')).to.equal(75);

        done();
      });
    });

    it('should respect mark types', function(done) {
      test(spec, function(view, svg, mouseEvt) {
        mouseEvt('mousedown', 50, 50, d3.select(svg).select('.mark1 rect').node());
        expect(view.signal('signalC')).to.equal(50);
        expect(view.signal('signalD')).to.be.undefined;

        mouseEvt('mousedown', 75, 75, d3.select(svg).select('.mark2 rect').node());
        expect(view.signal('signalC')).to.equal(50);
        expect(view.signal('signalD')).to.equal(75);

        done();
      });
    });

    // Can't set the d3.document context
    it.skip('should register on external targets', function(done) {
      test(spec, function(view, svg, mouseEvt) {
        mouseEvt('mousedown', 50, 50, d3.select(svg.parentNode).node());
        expect(view.signal('signalA')).to.be.undefined;
        expect(view.signal('signalB')).to.be.undefined;
        expect(view.signal('signalC')).to.be.undefined;
        expect(view.signal('signalD')).to.be.undefined;
        expect(view.signal('signalE')).to.equal("DIV");
        done();
      });
    });
  });

  it('should propagated signals', function(done) {
    var spec = {
      signals: [{
        name: "signalA",
        streams: [{ type: "mousedown", expr: "event" }]
      }, {
        name: "signalB",
        streams: [{ 
          type: "signalA", expr: "signalA.clientX",
          scale: {name: "x", invert: true}
        }]
      }, {
        name: "signalC",
        expr: "signalA.clientX + 250",
        scale: {name: "x", invert: true}
      }],

      scales: [
        {
          name: "x",
          type: "time",
          domainMin: (new Date("Wed Dec 31 2014 16:00:00 GMT-0800 (PST)")).getTime(),
          domainMax: (new Date("Wed Dec 30 2015 16:00:00 GMT-0800 (PST)")).getTime(),
          range: "width"
        }
      ]
    };

    test(spec, function(view, svg, mouseEvt) {
      mouseEvt('mousedown', 350, 350, svg);
      expect(view.signal('signalA')).to.have.property("type", "mousedown");
      expect(view.signal('signalB').getTime())
        .to.equal(new Date("Sat Sep 12 2015 12:12:00 GMT-0700 (PDT)").getTime());
      expect(view.signal('signalC').getTime())
        .to.equal(new Date("Sat Mar 12 2016 11:12:00 GMT-0800 (PST)").getTime());
      done();
    });
  });

  it('should respect filters', function(done) {
    var spec = {
      signals: [{
        name: "signalA",
        streams: [{ type: "mousedown[event.clientX > 200]", expr: "event" }]
      }]
    };

    test(spec, function(view, svg, mouseEvt) {
      mouseEvt('mousedown', 190, 350, svg);
      expect(view.signal('signalA')).to.be.undefined;

      mouseEvt('mousedown', 200, 350, svg);
      expect(view.signal('signalA')).to.be.undefined;

      mouseEvt('mousedown', 201, 350, svg);
      expect(view.signal('signalA')).to.not.be.undefined;
      done();
    });    
  });

  it('should propagate ordered streams', function(done) {
    var spec = {
      signals: [{
        name: "signalA",
        streams: [{ type: "[mousedown, mouseup] > mousemove", expr: "event" }]
      }]
    };

    test(spec, function(view, svg, mouseEvt) {
      mouseEvt('mousemove', 190, 100, svg);
      expect(view.signal('signalA')).to.be.undefined;

      mouseEvt('mousedown', 190, 100, svg);
      expect(view.signal('signalA')).to.be.undefined;

      mouseEvt('mousemove', 250, 350, svg);
      expect(view.signal('signalA')).to.have.property('clientX', 250);
      expect(view.signal('signalA')).to.have.property('clientY', 350);

      mouseEvt('mouseup', 250, 350, svg);  
      mouseEvt('mousemove', 190, 100, svg);    
      expect(view.signal('signalA')).to.have.property('clientX', 250);
      expect(view.signal('signalA')).to.have.property('clientY', 350);

      done();
    });
  });

  it('should propagate merged streams', function(done) {
    var spec = {
      signals: [{
        name: "signalA",
        streams: [{ type: "mousedown, mouseup", expr: "event" }]
      }]
    };

    test(spec, function(view, svg, mouseEvt) {
      mouseEvt('mousemove', 190, 100, svg);
      expect(view.signal('signalA')).to.be.undefined;

      mouseEvt('mousedown', 190, 100, svg);
      expect(view.signal('signalA')).to.have.property('clientX', 190);
      expect(view.signal('signalA')).to.have.property('clientY', 100);

      mouseEvt('mousemove', 250, 350, svg);
      expect(view.signal('signalA')).to.have.property('clientX', 190);
      expect(view.signal('signalA')).to.have.property('clientY', 100);

      mouseEvt('mouseup', 250, 350, svg);  
      mouseEvt('mousemove', 190, 100, svg);    
      expect(view.signal('signalA')).to.have.property('clientX', 250);
      expect(view.signal('signalA')).to.have.property('clientY', 350);

      done();
    });    
  });

  it('should populate vgItem, vgX, and vgY', function(done) {
    var spec = {
      signals: [{
        name: "signalA",
        streams: [{ type: "mousedown", expr: "event" }]
      }],

      marks: [{
        name: "mark1",
        type: "rect",
        properties: {
          enter: {
            x: {value: 25},
            y: {value: 25},
            width: {value: 25},
            height: {value: 25},
            fill: {value: "red"}
          }
        }
      }]
    };

    test(spec, function(view, svg, mouseEvt) {
      mouseEvt('mousedown', 50, 50, d3.select(svg).select('.mark1 rect').node());
      var sgA = view.signal('signalA');
      expect(sgA).to.have.deep.property("vgItem.mark.marktype", "rect");
      expect(sgA).to.have.deep.property("vgItem.mark.def.name", "mark1");
      expect(sgA).to.have.deep.property("vgItem.x", 25);
      expect(sgA).to.have.deep.property("vgItem.fill", "red");
      expect(sgA).to.have.property("vgX");
      expect(sgA).to.have.property("vgY");
      done();
    });
  });

  it('should populate named ancestors', function(done) {
    var spec = {
      signals: [{
        name: "signalA",
        streams: [{ type: "mousedown", expr: "event" }]
      }],

      marks: [{
        name: "mark1",
        type: "group",
        properties: {
          enter: {
            x: {value: 25},
            y: {value: 25},
            width: {value: 50},
            height: {value: 50},
            fill: {value: "red"}
          }
        },
        marks: [{
          name: "mark2",
          type: "rect",
          properties: {
            enter: {
              x: {value: 25},
              y: {value: 25},
              width: {value: 25},
              height: {value: 25},
              fill: {value: "green"}
            }
          }
        }]
      }]
    };

    test(spec, function(view, svg, mouseEvt) {
      mouseEvt('mousedown', 50, 50, d3.select(svg).select('.mark2 rect').node());
      var sgA = view.signal('signalA');

      expect(sgA).to.have.deep.property("vgItem.mark.marktype", "rect");
      expect(sgA).to.have.deep.property("vgItem.mark.def.name", "mark2");
      expect(sgA).to.have.deep.property("vgItem.x", 25);
      expect(sgA).to.have.deep.property("vgItem.fill", "green");
      expect(sgA).to.have.property("vgX");
      expect(sgA).to.have.property("vgY");

      expect(sgA).to.have.deep.property("vgMark2Item.mark.marktype", "rect");
      expect(sgA).to.have.deep.property("vgMark2Item.mark.def.name", "mark2");
      expect(sgA).to.have.deep.property("vgMark2Item.x", 25);
      expect(sgA).to.have.deep.property("vgMark2Item.fill", "green");

      expect(sgA).to.have.deep.property("vgMark1Item.mark.marktype", "group");
      expect(sgA).to.have.deep.property("vgMark1Item.mark.def.name", "mark1");
      expect(sgA).to.have.deep.property("vgMark1Item.x", 25);
      expect(sgA).to.have.deep.property("vgMark1Item.fill", "red");
      expect(sgA).to.have.property("vgMark1X");
      expect(sgA).to.have.property("vgMark1Y");

      done();
    });
  });

  describe('Custom Handlers', function() {
    var spec = {
      signals: [{
        name: "signalA",
        streams: [{ type: "mouseup", expr: "event" }]
      }],

      marks: [{
        name: "mark1",
        type: "rect",
        properties: {
          enter: {
            x: {value: 25},
            y: {value: 25},
            width: {value: 50},
            height: {value: 50},
            fill: {value: "red"}
          }
        }
      }]
    };

    it('should turn on/off svg event handlers', function(done) {
      var handler = chai.spy();

      test(spec, function(view, svg, mouseEvt) {
        view.on('mousedown', handler);

        mouseEvt('mousedown', 50, 50, d3.select(svg).select('.mark1 rect').node());
        expect(handler).to.have.been.called.once;

        mouseEvt('mousedown', 150, 150, d3.select(svg).select('.mark1 rect').node());
        expect(handler).to.have.been.called.twice;

        view.off('mousedown', handler);
        mouseEvt('mousedown', 200, 200, d3.select(svg).select('.mark1 rect').node());
        expect(handler).to.have.been.called.twice;

        done();
      });
    });

    it('should turn on/off canvas event handlers', function(done) {
      var handler = chai.spy();

      test(spec, function(view, svg, mouseEvt) {
        view.on('mousedown', handler);

        mouseEvt('mousedown', 50, 50, d3.select(svg).select('.mark1 rect').node());
        expect(handler).to.have.been.called.once;

        mouseEvt('mousedown', 150, 150, d3.select(svg).select('.mark1 rect').node());
        expect(handler).to.have.been.called.twice;

        view.off('mousedown', handler);
        mouseEvt('mousedown', 200, 200, d3.select(svg).select('.mark1 rect').node());
        expect(handler).to.have.been.called.twice;

        done();
      });
    });

    it('should turn on/off signal handlers', function(done) {
      var handler = chai.spy();

      test(spec, function(view, svg, mouseEvt) {
        view.onSignal('signalA', handler);

        mouseEvt('mouseup', 50, 50, d3.select(svg).select('.mark1 rect').node());
        expect(handler).to.have.been.called.once;

        mouseEvt('mouseup', 150, 150, d3.select(svg).select('.mark1 rect').node());
        expect(handler).to.have.been.called.twice;

        view.offSignal('signalA', handler);
        mouseEvt('mouseup', 200, 200, d3.select(svg).select('.mark1 rect').node());
        expect(handler).to.have.been.called.twice;

        done();
      });
    });
  });
});