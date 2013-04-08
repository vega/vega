#!/usr/bin/env node
// Render a Vega specification to PNG, using node canvas

var helpText =
  "Render a Vega specification to PNG.\n" +
  "Usage: vg2png vega_json_file [output_png_file]\n" +
  " If no output_png_file is given, writes to stdout.";

// import required libraries
var path = require("path");
var fs = require("fs");
var vg = require("../index");

// arguments
var args = require("optimist")
  .usage(helpText)
  .demand(1)
  .argv;

var specFile = args._[0],
    outputFile = args._[1] || null;

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