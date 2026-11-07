import tape from 'tape';
import {extend} from 'vega-util';
import * as vega from 'vega-dataflow';
import * as vegaEncode from 'vega-encode';
import * as vegaTransforms from 'vega-transforms';
import { parse } from '../index.js';

// legends require transform definitions
extend(vega.transforms, vegaTransforms, vegaEncode);

// Collect the generated code for text processing channels of text marks,
// keyed by mark role and encoding set.
function textChannels(spec) {
  const ops = operators(parse(spec).operators),
        byId = {},
        out = {};

  ops.forEach(op => byId[op.id] = op);
  ops.filter(op => op.type === 'encode').forEach(op => {
    const mark = byId[op.params.pulse.$ref],
          def = mark && mark.params && mark.params.markdef;
    if (!def || def.marktype !== 'text') return;

    const encode = op.params.encoders.$encode,
          entry = out[def.role] || (out[def.role] = {});

    for (const set of ['enter', 'update']) {
      const channels = encode[set] ? encode[set].$expr.channels : {};
      for (const name of ['textProcessor', 'textSelectable']) {
        if (channels[name]) entry[`${set}.${name}`] = channels[name].code;
      }
    }
  });

  return out;
}

// include operators of nested subflows, such as legend entries
function operators(list, out = []) {
  list.forEach(op => {
    out.push(op);
    for (const key in op.params) {
      const p = op.params[key];
      if (p && p.$subflow) operators(p.$subflow.operators, out);
    }
  });
  return out;
}

const scales = [
  {name: 'x', domain: [0, 1], range: [0, 500]},
  {name: 'c', type: 'ordinal', domain: ['a', 'b'], range: ['red', 'blue']},
  {name: 'g', type: 'linear', domain: [0, 1], range: ['white', 'black']}
];

tape('Parser does not add text processing by default', t => {
  const out = textChannels({
    scales,
    title: {text: 'Title', subtitle: 'Subtitle'},
    axes: [{scale: 'x', orient: 'bottom', title: 'X'}],
    legends: [{fill: 'c', title: 'C'}, {fill: 'g', title: 'G'}],
    marks: [{type: 'text', encode: {enter: {text: {value: 'Text'}}}}]
  });

  for (const role in out) {
    t.deepEqual(out[role], {}, role);
  }
  t.end();
});

tape('Parser supports title and subtitle text processors', t => {
  const out = textChannels({
    title: {
      text: 'Title', textProcessor: 'tex',
      subtitle: 'Subtitle', subtitleTextProcessor: 'mathml'
    }
  });

  t.deepEqual(out['title-text'], {'enter.textProcessor': '"tex"'});
  t.deepEqual(out['title-subtitle'], {'enter.textProcessor': '"mathml"'});
  t.end();
});

tape('Parser supports axis text processors', t => {
  const out = textChannels({
    scales,
    axes: [{
      scale: 'x', orient: 'bottom', title: 'X',
      titleTextProcessor: 'tex', labelTextProcessor: 'asciimath'
    }]
  });

  t.deepEqual(out['axis-title'], {'enter.textProcessor': '"tex"'});
  t.deepEqual(out['axis-label'], {'enter.textProcessor': '"asciimath"'});
  t.end();
});

tape('Parser supports axis text processors from config', t => {
  const config = {axis: {labelTextProcessor: 'tex'}, axisX: {titleTextProcessor: 'tex'}};
  const out = textChannels({
    config,
    scales,
    axes: [{scale: 'x', orient: 'bottom', title: 'X'}]
  });
  t.deepEqual(out['axis-title'], {'enter.textProcessor': '"tex"'});
  t.deepEqual(out['axis-label'], {'enter.textProcessor': '"tex"'});

  // "default" in the spec overrides an inherited text processor
  const plain = textChannels({
    config,
    scales,
    axes: [{scale: 'x', orient: 'bottom', title: 'X', labelTextProcessor: 'default'}]
  });
  t.deepEqual(plain['axis-label'], {'enter.textProcessor': '"default"'});
  t.end();
});

tape('Parser supports signal-valued text processors', t => {
  const out = textChannels({
    signals: [{name: 'proc', value: 'tex'}],
    scales,
    axes: [{scale: 'x', orient: 'bottom', labelTextProcessor: {signal: 'proc'}}]
  });

  const label = out['axis-label'];
  t.notOk(label['enter.textProcessor'], 'not set on enter');
  t.ok(/proc/.test(label['update.textProcessor']), 'set on update');
  t.end();
});

tape('Parser supports legend text processors', t => {
  const out = textChannels({
    scales,
    legends: [
      {fill: 'c', title: 'C', titleTextProcessor: 'tex', labelTextProcessor: 'asciimath'}
    ]
  });
  t.deepEqual(out['legend-title'], {'enter.textProcessor': '"tex"'});
  t.deepEqual(out['legend-label'], {'enter.textProcessor': '"asciimath"'}, 'symbol labels');

  const gradient = textChannels({
    config: {legend: {labelTextProcessor: 'tex'}},
    scales,
    legends: [{fill: 'g'}]
  });
  t.deepEqual(gradient['legend-label'], {'enter.textProcessor': '"tex"'}, 'gradient labels');
  t.end();
});

tape('Parser supports text mark and global text processing config', t => {
  const out = textChannels({
    config: {text: {textProcessor: 'tex'}, textSelectable: false},
    scales,
    title: {text: 'Title'},
    axes: [{scale: 'x', orient: 'bottom', title: 'X'}],
    marks: [{type: 'text', encode: {enter: {text: {value: 'Text'}}}}]
  });

  t.deepEqual(out.mark, {
    'enter.textProcessor': '"tex"',
    'enter.textSelectable': 'false'
  });

  // global textSelectable applies to all text, mark config only to marks
  t.deepEqual(out['title-text'], {'enter.textSelectable': 'false'});
  t.deepEqual(out['axis-label'], {'enter.textSelectable': 'false'});
  t.deepEqual(out['axis-title'], {'enter.textSelectable': 'false'});

  // encoding channels override global config
  const encoded = textChannels({
    config: {textSelectable: false},
    marks: [{type: 'text', encode: {enter: {textSelectable: {value: true}}}}]
  });
  t.deepEqual(encoded.mark, {'enter.textSelectable': 'true'});
  t.end();
});
