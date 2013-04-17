require("../env");
var vows = require("vows"),
    assert = require("assert"),
    fs = require("fs"),
    os = require("os");

var suite = vows.describe("vg.examples");

var examplesRoot = "examples";
var examplesDir = examplesRoot + "/vega";
var fileNames = fs.readdirSync(examplesDir);

require("../../examples/lib/d3.geo.projection.min.js"); // need for map.json

// require("../../examples/lib/d3.layout.cloud.js"); // need for wordcloud.json
// cloud layout node support requires canvas module, which won't build for me
fileNames.splice(fileNames.indexOf("wordcloud.js")); // .. so skip it for now

var batch = {
  'example file count' : function() {
    assert.typeOf(fileNames, "array");
    assert.greater(fileNames.length, 15);
  },
  'xhr' : {
    topic: function() {
      // verify that our global.XMLHttpRequest shim in ../env.js is working OK
      assert.isFunction(d3.xhr);
      d3.xhr(examplesRoot + "/data/barley.json", "text/plain", this.callback);
    },
    'file is loaded' : function(err, body) {
      assert.isNull(err);
      assert.isNotNull(body);
    }
  }
};

fileNames.forEach(function(baseFileName) {
  batch["example " + baseFileName] = {
    topic: function() {
      fs.readFile(examplesDir + "/" + baseFileName, this.callback);
    },
    'file': {
      topic: function(specFileContents) {
        assert.isObject(specFileContents);
        return JSON.parse(specFileContents);
      },
      'has correct structure': function(err, specFileJSON) {
        assert.isNull(err, "error loading: " + err);

        // sanity-check the spec
        assert.isObject(specFileJSON);
        assert.isNumber(specFileJSON["width"]);
        assert.isNumber(specFileJSON["height"]);
        assert.isArray(specFileJSON["data"]);
        assert.isArray(specFileJSON["marks"]);
        return;
      },
      'can parse': {
        topic: function(specFileJSON) {
          // fix urls from the examples root dir to the node test harness root
          assert.isArray(specFileJSON.data);
          specFileJSON.data.forEach(function(data) {
            if (data.url)
              data.url = examplesRoot + "/" + data.url;
          });

          var self = this;
          vg.parse.spec(specFileJSON, function(chartFunction) {
            self.callback(null, chartFunction);
          });
        },
        'and load': function(err, chartFunction) {
          assert.isNull(err);
          assert.isFunction(chartFunction, "chart should have been function");

          d3.select("body").html("<div id='viz'/>"); // fresh new dom
          var view = chartFunction({ el: "#viz", renderer: "svg" });

          assert.isObject(view);
          assert.isNotNull(view);
          assert.isFunction(view.update);

          view.update();

          var html = d3.select("html").node().outerHTML;
          assert.isNotNull(html);

          // for writing test output files, you can run with something like:
          // VEGA_TEST_OUTPUT=${HOME}/Desktop make test
          if (process.env.VEGA_TEST_OUTPUT) {
            fs.writeFileSync(process.env.VEGA_TEST_OUTPUT + "/"
                + baseFileName.split(".")[0] + ".html", html);
          }
        }
      }
    }
  };
});

suite.addBatch(batch);
suite.export(module);
