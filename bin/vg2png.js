#!/usr/bin/env node
// Render a Vega specification to PNG, using node canvas

// import required libraries
var path = require("path");
var fs = require("fs");
var vg = require("../index");

// process arguments
var args = process.argv.slice(2),
    specFile = args[0],
    outputFile = args[1] || null;
    
if (specFile == null) {
  console.log("Missing arguments.");
  process.exit(1);
}

// load spec, render to png
fs.readFile(specFile, "utf8", function(err, text) {
  if (err) throw err;
  var spec = JSON.parse(text);
  convert(spec);
});

// ---

function writePNG(canvas, file) {
  var out = process.stdout;
  if (file) {
    // write to file
    out = fs.createWriteStream(file);
  }
  var stream = canvas.createPNGStream();
  stream.on('data', function(chunk){ out.write(chunk); });
}

function convert(spec) {
  vg.headless.convert(spec, "canvas", function(err, data) {
    if (err) throw err;
    writePNG(data.canvas, outputFile);
  });
}
