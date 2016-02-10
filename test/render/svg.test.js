var config = require('../../src/core/config'),
    jsdom = require('jsdom'),
    d3 = require('d3'),
    path = require('path'),
    svg = require('vega-scenegraph/src/util/svg'),
    output = 'output/';

var svgNamespace = Object.keys(svg.metadata)
  .map(function(n) { return n + '="' + svg.metadata[n] + '"'; })
  .join(' ');

describe('SVG', function() {
  require('d3-geo-projection')(d3);

  describe('Examples', function() {
    var files = examples();

    // validation xpaths for rendered SVG DOM; a single match will be expected
    var validation = {
      "barley": "//svg:g[@class='mark-symbol']/svg:path[120]",
      "area": "//svg:g[@class='mark-area']/svg:path",
      "bar": "//svg:g[@class='mark-rect']/svg:rect[20]",

      "heatmap": "skip" // Stress JSDOM out
    };

    files.forEach(function(file, idx) {
      var name = path.basename(file, '.json');
      // dynamically generate a test case for each example spec
      if (validation[name] === 'skip') {
        // skip, but mark as pending
        it('renders the ' + name + ' example');
      } else {
        it('renders the ' + name + ' example headless', function(done) {
          render(name, file, true, validation[name], done);
        });

        it('renders the ' + name + ' example jsdom', function(done) {
          render(name, file, false, validation[name], done);
        });
      }
    });
  });

  // Render the given spec using both the headless string renderer
  // and the standard SVG renderer (in a fake JSDOM)
  // and compare that the SVG output is identical
  function render(name, specFile, headless, validation, done) {
    fs.readFile(specFile, 'utf8', function(err, text) {
      if (err) return done(err);
      var spec = JSON.parse(text);

      parseSpec(spec, function(error, viewFactory) {
        if (error) return done(error);
        
        if (headless) {
          var view = viewFactory({ renderer: 'svg' }).update();
          var svg  = view.renderer().svg();
          validate(svg, name+'.headless', validation);
          done();
        } else {
          jsdom.env('<html><body></body></html>', function(err, window) {
            global.window = window;

            var body = d3.select(window.document).select('body').node();
            var view = viewFactory({ renderer: 'svg', el: body }).update();
            var svg  = d3.select(body).select('div.vega').node().innerHTML
              .replace(/ href=/g, ' xlink:href=')   // ns hack
              .replace('<svg', '<svg '+svgNamespace);
            validate(svg, name+'.dom', validation);

            delete global.window;
            done();
          });
        }
      });
    });
  }

  // Parse the given SVG blob, save it to a file, and run the validator function
  function validate(svg, saveto, validation) {
    expect(svg).to.not.be.undefined;
    expect(svg).to.not.be.null;
    expect(svg.length).to.be.above(100);

    // ensure we can parse the generated SVG and invoke callback with xpath
    var dom = require('xmldom').DOMParser;
    var selector = require('xpath');
    var xpath = selector.useNamespaces({'svg': 'http://www.w3.org/2000/svg'});

    var doc = new dom().parseFromString(svg);

    // save the snapshot for manual review if we have a 'output' dir
    if (saveto && fs.existsSync(output)) {
      fs.writeFileSync(output + saveto + '.svg', svg);
    }

    // make sure the root is an SVG document
    expect(xpath('/svg:svg', doc).length).to.equal(1);

    if (dl.isString(validation)) {
      // invoke the custom validation as an xpath if it is a string
      expect(xpath(validation, doc).length).to.equal(1);
    } else if (dl.isFunction(validation)) {
      // invoke the custom validation function
      validation(doc, xpath);
    }
  }
})
