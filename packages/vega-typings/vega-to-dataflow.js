#!/usr/bin/env node
// Loads the file from the first arg and outputs the runtime dataflow as JSON ending with a semicolon
const { parse } = require('vega');

const filePath = process.argv[2];
const spec = require(filePath);
const dataflow = parse(spec);
const dataflowStr = JSON.stringify(dataflow);
console.log(dataflowStr + ';');
