var config = require('../../src/util/config');

describe('Canvas', function() {
  var fs = require("fs");
  var path = require("path");

  describe('Canvas', function() {

    it('can measure text', function(done) {
      // this test verified that the "canvas" node module works
      var Bounds = require("../../src/core/Bounds");
      var measure = require("../../src/util/bounds").text;

      expect(measure).to.not.be.undefined;

      var text = { text: "Hello There", font: "Courier", fontSize: 52 };
      var bounds = measure(text, new Bounds(), false);

      // allow some leniency since platforms have different font render paths
      expect(bounds.x2 - bounds.x1).to.be.closeTo(345.0, 5.0);
      expect(bounds.y2 - bounds.y1).to.be.closeTo(54.0, 5.0);

      done();
    });

    
    it('should render to a bitmap') /*, function(done) {

      parseSpec(exampleSpecBar, function(model) {
        var renderer = new headless.Renderer();
        var w = spec.width, h = spec.height, pad = spec.padding;

        renderer.initialize("canvas", w, h, pad);
        expect(renderer).to.not.be.undefined;
        renderer.render(model.scene());

        var canvas = renderer.canvas();
        expect(canvas).to.not.be.undefined;
        expect(canvas).to.not.be.null;

        var out = fs.createWriteStream("/Users/mprudhom/Desktop/viz.png");
        var stream = canvas.createPNGStream();

        stream.on("data", function(chunk) {
          out.write(chunk);
        });

        stream.on("end", function() {
          done();
        });

      }, viewFactory);

    });
    */

  });
})
