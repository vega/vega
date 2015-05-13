var config = require('../../src/util/config'),
  d3 = require('d3'),
  dl = require('datalib');

describe('SVG', function() {
  // setting to false speeds up tests at the cost of no SVG fidelity validation
  var verifyFidelity = false; // TODO: enable

  var fs = require("fs");
  var path = require("path");

  describe('Examples', function() {
    // list all the example json spec files
    var dir = "./examples/spec/"
    expect(fs.statSync(dir).isDirectory()).to.equal(true);
    var files = fs.readdirSync(dir).filter(function(name) {
      return path.extname(name) === ".json";
    });
    expect(files.length).to.be.at.least(15);

    config.load.baseURL = 'file://' + dir + "../"; // needed for data loading

    // validation xpaths for rendered SVG DOM; a single match will be expected
    var validation = {
      // FIXME: obscure error when trying to render interactors
      "brush_interactor": "skip",
      "map": "skip",

      "barley": "//svg:g[@class='type-symbol']/svg:path[120]",
      "area": "//svg:g[@class='type-area']/svg:path",
      "bar": "//svg:g[@class='type-rect']/svg:rect[20]",
    };

    files.forEach(function(file, idx) {
      var name = path.basename(file, ".json");
      // dynamically generate a test case for each example spec
      if (validation[name] === "skip") {
        // skip, but mark as pending
        it('renders the ' + name + ' example');
      } else {
        it('renders the ' + name + ' example', function(done) {
          render(dir + file, validation[name], done);
        });
      }
    });
  });

  // Render the given spec using both the headless string renderer
  // and the standard SVG renderer (in a fake JSDOM)
  // and compare that the SVG output is identical
  function renderSVG(name, spec, validator, done) {
    parseSpec(spec, function(viewFactory) {
      // first use the string renderer
      var view = viewFactory({ renderer: "svg" });
      view.update();
      var svg = view.renderer().svg();

      validateSVG(svg, name, function(doc, xpath) {
        validator(doc, xpath);
        done();
      });
    });
  };

  // Parse the given SVG blob, save it to a file, and run the validator function
  function validateSVG(svg, saveto, validator) {
      expect(svg).to.not.be.undefined;
      expect(svg).to.not.be.null;
      expect(svg.length).to.be.above(100);

      // ensure we can parse the generated SVG and invoke callback with xpath
      var dom = require('xmldom').DOMParser;
      var selector = require('xpath');
      var xpath = selector.useNamespaces({"svg": "http://www.w3.org/2000/svg"});

      var doc = new dom().parseFromString(svg);

      // save the snapshot for manual review if we have a "test_output" dir
      var dir = "test_output";
      if (saveto && fs.existsSync(dir)) {
        fs.writeFileSync(dir + "/" + saveto + ".svg", svg);
      }

      if (validator) validator(doc, xpath);
  }

  function render(specFile, validation, done) {
    fs.readFile(specFile, "utf8", function(err, text) {
      if (err) throw err;
      var spec = JSON.parse(text);
      renderSVG(path.basename(specFile, ".json"), spec, function(doc, xpath) {
        // make sure the root is an SVG document
        expect(xpath("/svg:svg", doc).length).to.equal(1);

        if (dl.isString(validation)) {
          // invoke the custom validation as an xpath if it is a string
          expect(xpath(validation, doc).length).to.equal(1);
        } else if (dl.isFunction(validation)) {
          // invoke the custom validation function
          validation(doc, xpath);
        }
      }, done);
    });
  }
})
