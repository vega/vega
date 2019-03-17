/*eslint no-console: "warn"*/
import labelLayout from './LabelLayout';
import {Transform} from 'vega-dataflow';
import {inherits, isFunction} from 'vega-util';

const Output = ['x', 'y', 'opacity', 'align', 'baseline', 'originalOpacity', 'transformed'];

const Params = ['offset'];

const defaultAnchors = ['top-left', 'left', 'bottom-left', 'top', 'bottom', 'top-right', 'right', 'bottom-right'];

export default function Label(params) {
  Transform.call(this, labelLayout(), params);
}

Label.Definition = {
  type: 'Label',
  metadata: {modifies: true},
  params: [
    {name: 'padding', type: 'number', default: 0},
    {name: 'markIndex', type: 'number', default: 0},
    {name: 'lineAnchor', type: 'string', values: ['begin', 'end'], default: 'end'},
    {name: 'avoidBaseMark', type: 'boolean', default: true},
    {name: 'size', type: 'number', array: true, length: [2]},
    {name: 'offset', type: 'number', default: [1]},
    {name: 'sort', type: 'field'},
    {name: 'anchor', type: 'string', default: defaultAnchors},
    {name: 'avoidMarks', type: 'data', array: true},
    {
      name: 'as',
      type: 'string',
      array: true,
      length: Output.length,
      default: Output
    }
  ]
};

const prototype = inherits(Label, Transform);

prototype.transform = function(_, pulse) {
  function modp(param) {
    const p = _[param];
    return isFunction(p) && pulse.modified(p.fields);
  }

  const mod = _.modified();
  if (!(mod || pulse.changed(pulse.ADD_REM) || Params.some(modp))) return;

  const data = pulse.materialize(pulse.SOURCE).source;
  const labelLayout = this.value;
  const as = _.as || Output;
  const offset = Array.isArray(_.offset) ? _.offset : Number.isFinite(_.offset) ? [_.offset] : [1];
  const anchor = Array.isArray(_.anchor) ? _.anchor : typeof _.anchor === 'string' ? [_.anchor] : defaultAnchors;
  const numberPositions = Math.max(offset.length, anchor.length);

  // configure layout
  const labels = labelLayout
    .texts(data)
    .sort(_.sort)
    .offset(offset, numberPositions)
    .anchor(anchor, numberPositions)
    .avoidMarks(_.avoidMarks || [])
    .size(_.size)
    .avoidBaseMark(_.avoidBaseMark !== undefined ? _.avoidBaseMark : true)
    .lineAnchor(_.lineAnchor || 'end')
    .markIndex(_.markIndex || 0)
    .padding(_.padding || 0)
    .layout();
  const n = data.length;

  // fill the information of transformed labels back into data
  let l, t;
  for (let i = 0; i < n; i++) {
    l = labels[i];
    t = l.datum;

    t[as[0]] = l.x;
    t[as[1]] = l.y;
    t[as[2]] = l.opacity;
    t[as[3]] = l.align;
    t[as[4]] = l.baseline;
    t[as[5]] = l.originalOpacity;
    t[as[6]] = true;
  }

  return pulse.reflow(mod).modifies(as);
};
