import labelLayout from './LabelLayout';
import {Transform} from 'vega-dataflow';
import {array, error, inherits, isFunction} from 'vega-util';

const Output = [
  'x',
  'y',
  'opacity',
  'align',
  'baseline'
];

const Anchors = [
  'top-left',
  'left',
  'bottom-left',
  'top',
  'bottom',
  'top-right',
  'right',
  'bottom-right'
];

export default function Label(params) {
  Transform.call(this, null, params);
}

Label.Definition = {
  type: 'Label',
  metadata: { modifies: true },
  params: [
    { name: 'size', type: 'number', array: true, length: 2, required: true },
    { name: 'sort', type: 'compare' },
    { name: 'offset', type: 'number', array: true, default: [1] },
    { name: 'anchor', type: 'string', array: true, default: Anchors },
    { name: 'padding', type: 'number', default: 0 },
    { name: 'markIndex', type: 'number', default: 0 },
    { name: 'lineAnchor', type: 'string', values: ['start', 'end'], default: 'end' },
    { name: 'avoidBaseMark', type: 'boolean', default: true },
    { name: 'avoidMarks', type: 'data', array: true },
    { name: 'as', type: 'string', array: true, length: Output.length, default: Output }
  ]
};

const prototype = inherits(Label, Transform);

prototype.transform = function (_, pulse) {
  function modp(param) {
    const p = _[param];
    return isFunction(p) && pulse.modified(p.fields);
  }

  const mod = _.modified();
  if (!(mod || pulse.changed(pulse.ADD_REM) || modp('sort'))) return;
  if (!_.size || _.size.length !== 2) {
    error('Size of chart should be specified as a width, height array.');
  }

  const as = _.as || Output;

  // run label layout
  labelLayout(
    pulse.materialize(pulse.SOURCE).source,
    _.size,
    _.sort,
    array(_.offset || 1),
    array(_.anchor || Anchors),
    _.avoidMarks || [],
    _.avoidBaseMark === false ? false : true,
    _.lineAnchor || 'end',
    _.markIndex || 0,
    _.padding || 0
  ).forEach(l => {
    // write layout results to data stream
    const t = l.datum;
    t[as[0]] = l.x;
    t[as[1]] = l.y;
    t[as[2]] = l.opacity;
    t[as[3]] = l.align;
    t[as[4]] = l.baseline;
  });

  return pulse.reflow(mod).modifies(as);
};
