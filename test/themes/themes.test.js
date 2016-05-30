var dl = require('datalib'),
  fs = require('fs'),
  path = require('path'),
  output = 'output/';

describe('Themes', function() {
  var specs = getFiles(['test/themes/spec/']);

  themes().forEach(function(t) {
    var theme = JSON.parse(fs.readFileSync(t)),
        themeName = path.basename(t, '.json');

    specs.forEach(function(spec) {
      var name = themeName + '-' + path.basename(spec, '.json');
      it('renders ' + name, function(done) {
        render(name, spec, theme, done);
      });
    });
  });

  // Render the given spec using the headless canvas renderer
  function render(name, specFile, theme, done) {
    fs.readFile(specFile, 'utf8', function(err, text) {
      if (err) throw err;
      var spec = JSON.parse(text);

      theme.load = theme.load || {};
      theme.load.baseURL = 'file://node_modules/vega-datasets/';

      parseSpec(spec, theme, function(error, viewFactory) {
        if (error) return done(error);

        var view = viewFactory({ renderer: 'canvas' }).update();
        view.canvasAsync(function(canvas) {
          var data = canvas.toDataURL();
          expect(data).to.not.be.undefined;

          writePNG(canvas, output+name+'.png');
          done();
        });
      });
    });
  }

  function writePNG(canvas, file) {
    if (!fs.existsSync(output)) return;
    var out = file ? fs.createWriteStream(file) : process.stdout;
    var stream = canvas.createPNGStream();
    stream.on('data', function(chunk) { out.write(chunk); });
  }
})
