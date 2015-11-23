var config = require('../../src/core/config'),
  jsdom = require('jsdom'),
  d3 = require('d3'),
  dl = require('datalib'),
  fs = require('fs'),
  path = require('path'),
  output = "output/",
  examples = "test/spec/";

describe('Canvas', function() {
  require('d3-geo-projection')(d3);

  describe('Examples', function() {
    // list all the example json spec files
    expect(fs.statSync(examples).isDirectory()).to.equal(true);
    var files = fs.readdirSync(examples).filter(function(name) {
      return path.extname(name) === ".json";
    });
    expect(files.length).to.be.at.least(15);

    config.load.baseURL = 'file://' + examples + "../"; // needed for data loading

    var skip = {};

    files.forEach(function(file, idx) {
      var name = path.basename(file, ".json");
      if (skip[name]) {
        // skip, but mark as pending
        it('renders the ' + name + ' example');
      } else {
        it('renders the ' + name + ' example', function(done) {
          render(name, examples + file, done);
        });
      }
    });
  });

  // Render the given spec using the headless canvas renderer
  function render(name, specFile, done) {
    fs.readFile(specFile, "utf8", function(err, text) {
      if (err) throw err;
      var spec = JSON.parse(text);

      parseSpec(spec, function(error, viewFactory) {
        var view = viewFactory({ renderer: "canvas" }).update();
        view.canvasAsync(function(canvas) {
          var data = canvas.toDataURL();
          expect(data).to.not.be.undefined;

          writePNG(canvas, output+name+".png");
          done();
        });
      });
    });
  }

  function writePNG(canvas, file) {
    if (!fs.existsSync(output)) return;
    var out = file ? fs.createWriteStream(file) : process.stdout;
    var stream = canvas.createPNGStream();
    stream.on("data", function(chunk) { out.write(chunk); });
  }
})
