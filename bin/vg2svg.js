#!/usr/bin/env node
// Render a Vega specification to SVG

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

// load spec, render to svg
fs.readFile(specFile, "utf8", function(err, text) {
  if (err) throw err;
  var spec = JSON.parse(text);
  convert(spec);
});

// ---

function writeSVG(svg, file) {
  svg = '<?xml version="1.0" encoding="utf-8"?>\n'
      + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n'
      + svg;

  if (file) {
    // write to file
    fs.writeFile(file, svg, function(err) {
      if (err) throw err;
    });
  } else {
    process.stdout.write(svg);
  }
}

function convert(spec) {
  vg.headless.convert(spec, "svg", function(err, data) {
    if (err) throw err;
    writeSVG(data.svg, outputFile);
  });
}