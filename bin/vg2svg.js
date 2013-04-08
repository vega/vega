#!/usr/bin/env node
// Render a Vega specification to SVG

var helpText =
  "Render a Vega specification to SVG.\n" +
  "Usage: vg2svg vega_json_file [output_svg_file]\n" +
  " If no output_svg_file is given, writes to stdout.";

var svgHeader =
  '<?xml version="1.0" encoding="utf-8"?>\n' +
  '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" ' +
  '"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n';

// import required libraries
var path = require("path");
var fs = require("fs");
var vg = require("../index");

// arguments
var args = require("optimist")
  .usage(helpText)
  .demand(1)
  .boolean('h').alias('h', 'header')
  .describe('h', 'Include XML header and SVG doctype.')
  .argv;

var header = args.h ? svgHeader : "",
    specFile = args._[0],
    outputFile = args._[1] || null;

// load spec, render to svg
fs.readFile(specFile, "utf8", function(err, text) {
  if (err) throw err;
  var spec = JSON.parse(text);
  convert(spec);
});

// ---

function writeSVG(svg, file) {
  svg = header + svg;
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