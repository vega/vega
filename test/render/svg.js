var config = require('../../src/util/config'),
  d3 = require('d3'),
  dl = require('datalib'),
  jsdom = require('jsdom');

describe('SVG', function() {
  // setting to false speeds up tests at the cost of no SVG fidelity validation
  var verifyFidelity = true;

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

    config.baseURL = 'file://' + dir + "../"; // needed for data loading
    config.silent = true; // prevent logging when we are loading data

    // validation xpaths for rendered SVG
    var validation = {
      "brush_interactor": "skip", // we have some problems with interactors
      "panzoom_touch": "skip", // we have some problems with interactors

      // the following xpaths will be expected to return exactly 1 item
      "area": "//svg:g[@class='type-area']/svg:path",
      "bar": "//svg:g[@class='type-rect']/svg:rect[20]",
    };

    files.forEach(function(file) {
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
  function compareSVG(name, spec, validator, done) {
    parseSpec(spec, function(viewFactory) {
      // first use the string renderer
      var view = viewFactory({ renderer: "svg-headless" });
      view.update();
      var svg = view._renderer.svg();
      //var svg = view.svg();

      validateSVG(svg, name + "-svgh", function(doc, xpath) {
        validator(doc, xpath);
      });

      if (!verifyFidelity) {
        // skip the slow JSDOM rendering for SVG fidelity validation
        it("should validate SVG fidelity");
        done();
        return;
      }

      // next render to a fake JSDOM and compare the two SVG blobs
      // TODO: why re-parse the spec? seems we can't re-use the viewFactory...
      parseSpec(spec, function(viewFactory) {

        jsdom.env({
          features : { QuerySelector : true },
          html : "<html><body><div id='viz'></div></body></html>",
          done : function(errors, window) {
            var el = window.document.querySelector('#viz')

            var view = viewFactory({ renderer: "svg", el: el });
            view.update();
            var svg2 = d3.select(el.firstChild).html();

            // the DOM element doesn't include the namespace; stick it in so the
            // same xpath will validate and XML string equivalence can be tested
            if (config.svgNamespace) {
              svg2 = svg2.replace(/^<svg ([^>]*)>/,
                '<svg $1 ' + config.svgNamespace + '>');
            }

            validateSVG(svg2, name + "-svgd", function(doc2, xpath2) {
              validator(doc2, xpath2);

              function fixup(xml, jsdom) {
                // compare the strings line-by-line for easier visual debugging
                xml = xml.replace(/></g, '>\n<');

                // JSDOM's innerHTML lower-cases element names
                if (jsdom) {
                  xml = xml.replace(/<(.?)clippath/g, '<$1clipPath');
                  xml = xml.replace(/<(.?)linearGradient/g,'<$1linearGradient');
                  xml = xml.replace(/<(.?)radialgradient/g,'<$1radialGradient');
                }

                // the "font" style isn't getting set in the DOM because
                // of a bug in the CSS parser that JSDOM uses:
                // https://github.com/chad3814/CSSStyleDeclaration/pull/25
                // So strip out the font tag from our SVG so that the XML
                // will be equal
                xml = xml.replace(/<text ([^>]*) style="font: [^;]*; */g,
                    '<text $1 style="');
                xml = xml.replace(/font: 11px sans-serif/g, '');
                xml = xml.replace(/pointer-events: none;/g, '');

                return xml
              }

              expect(fixup(svg, false)).to.equal(fixup(svg2, true));
            });


            done();
          }
        });
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
      compareSVG(path.basename(specFile, ".json"), spec, function(doc, xpath) {
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
