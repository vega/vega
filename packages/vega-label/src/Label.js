import labelLayout from './LabelLayout';
import BitMap from './BitMap';
import {Transform} from 'vega-dataflow';
import {array, error, inherits, isFunction} from 'vega-util';

const Output = ['x', 'y', 'opacity', 'align', 'baseline'];
const State = ['_opacity', '_transformed'];
const Params = ['offset'];
const Anchors = ['top-left', 'left', 'bottom-left', 'top', 'bottom', 'top-right', 'right', 'bottom-right'];

export default function Label(params) {
  Transform.call(this, null, params);
}

Label.Definition = {
  type: 'Label',
  metadata: { modifies: true },
  params: [
    { name: 'size', type: 'number', array: true, length: 2, required: true },
    { name: 'sort', type: 'field' },
    { name: 'offset', type: 'number', array: true, default: [1] },
    { name: 'anchor', type: 'string', array: true, default: Anchors },
    { name: 'padding', type: 'number', default: 0 },
    { name: 'markIndex', type: 'number', default: 0 },
    { name: 'lineAnchor', type: 'string', values: ['begin', 'end'], default: 'end' },
    { name: 'avoidBaseMark', type: 'boolean', default: true },
    { name: 'avoidMarks', type: 'data', array: true },
    { name: 'as', type: 'string', array: true, length: Output.length, default: Output }
  ]
};

Label.BitMap = BitMap;

const prototype = inherits(Label, Transform);

prototype.transform = function (_, pulse) {
  function modp(param) {
    const p = _[param];
    return isFunction(p) && pulse.modified(p.fields);
  }

  const mod = _.modified();
  if (!(mod || pulse.changed(pulse.ADD_REM) || Params.some(modp))) return;
  if (!_.size || _.size.length !== 2) {
    error('Size of chart should be specified as a width, height array.');
  }

  const as = _.as || Output;

  // configure layout
  const labels = labelLayout(
    pulse.materialize(pulse.SOURCE).source,
    _.size,
    _.sort,
    array(_.offset || 1),
    array(_.anchor || Anchors),
    _.avoidMarks || [],
    _.avoidBaseMark !== undefined ? _.avoidBaseMark : true,
    _.lineAnchor || 'end',
    _.markIndex || 0,
    _.padding || 0,
  );

  // fill the information of transformed labels back into data
  for (let i=0, n=labels.length, l, t; i<n; ++i) {
    l = labels[i];
    t = l.datum;
    t[as[0]] = l.x;
    t[as[1]] = l.y;
    t[as[2]] = l.opacity;
    t[as[3]] = l.align;
    t[as[4]] = l.baseline;
    t[State[0]] = l._opacity;
    t[State[1]] = true;
  }

  return pulse.reflow(mod).modifies(as).modifies(State);
};
