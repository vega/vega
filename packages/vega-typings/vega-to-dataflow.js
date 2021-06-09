#!/usr/bin/env node
// Parses a vega spec file into a dataflow runtime
// ./vega-to-dataflow path-to-vega-spec.json path-to-output.js

const vega = require('vega');
const fs = require('fs');

const specPath = process.argv[2];
const outputPath = process.argv[3];
const spec = require(specPath);
const dataflow = vega.parse(spec);
const dataflowStr = JSON.stringify(dataflow);
fs.appendFileSync(outputPath, dataflowStr + ';');
