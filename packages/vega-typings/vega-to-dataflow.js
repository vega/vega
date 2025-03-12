#!/usr/bin/env node
// Parses a vega spec file into a dataflow runtime
// ./vega-to-dataflow path-to-vega-spec.json path-to-output.js

import {parse} from 'vega';
import { appendFileSync } from 'fs';

const specPath = process.argv[2];
const outputPath = process.argv[3];
const spec = require(specPath);
const dataflow = parse(spec);
const dataflowStr = JSON.stringify(dataflow);
appendFileSync(outputPath, dataflowStr + ';\n');
