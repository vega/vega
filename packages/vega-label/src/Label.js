import labelLayout from './LabelLayout.js';
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

/**
 * Compute text label layout to annotate marks.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<number>} params.size - The size of the layout, provided as a [width, height] array.
 * @param {function(*,*): number} [params.sort] - An optional
 *   comparator function for sorting label data in priority order.
 * @param {Array<string>} [params.anchor] - Label anchor points relative to the base mark bounding box.
 *   The available options are 'top-left', 'left', 'bottom-left', 'top',
 *   'bottom', 'top-right', 'right', 'bottom-right', 'middle'.
 * @param {Array<number>} [params.offset] - Label offsets (in pixels) from the base mark bounding box.
 *   This parameter is parallel to the list of anchor points.
 * @param {number | null} [params.padding=0] - The amount (in pixels) that a label may exceed the layout size.
 *   If this parameter is null, a label may exceed the layout size without any boundary.
 * @param {string} [params.lineAnchor='end'] - For group line mark labels only, indicates the anchor
 *   position for labels. One of 'start' or 'end'.
 * @param {string} [params.markIndex=0] - For group mark labels only, an index indicating
 *   which mark within the group should be labeled.
 * @param {Array<number>} [params.avoidMarks] - A list of additional mark names for which the label
 *   layout should avoid overlap.
 * @param {boolean} [params.avoidBaseMark=true] - Boolean flag indicating if labels should avoid
 *   overlap with the underlying base mark being labeled.
 * @param {string} [params.method='naive'] - For area make labels only, a method for
 *   place labels. One of 'naive', 'reduced-search', or 'floodfill'.
 * @param {Array<string>} [params.as] - The output fields written by the transform.
 *   The default is ['x', 'y', 'opacity', 'align', 'baseline'].
 */
export default function Label(params) {
  Transform.call(this, null, params);
}

Label.Definition = {
  type: 'Label',
  metadata: { modifies: true },
  params: [
    { name: 'size', type: 'number', array: true, length: 2, required: true },
    { name: 'sort', type: 'compare' },
    { name: 'anchor', type: 'string', array: true, default: Anchors },
    { name: 'offset', type: 'number', array: true, default: [1] },
    { name: 'padding', type: 'number', default: 0, null: true },
    { name: 'lineAnchor', type: 'string', values: ['start', 'end'], default: 'end' },
    { name: 'markIndex', type: 'number', default: 0 },
    { name: 'avoidBaseMark', type: 'boolean', default: true },
    { name: 'avoidMarks', type: 'data', array: true },
    { name: 'method', type: 'string', default: 'naive'},
    { name: 'as', type: 'string', array: true, length: Output.length, default: Output }
  ]
};

inherits(Label, Transform, {
  transform(_, pulse) {
    function modp(param) {
      const p = _[param];
      return isFunction(p) && pulse.modified(p.fields);
    }

    const mod = _.modified();
    if (!(mod || pulse.changed(pulse.ADD_REM) || modp('sort'))) return;
    if (!_.size || _.size.length !== 2) {
      error('Size parameter should be specified as a [width, height] array.');
    }

    const as = _.as || Output;

    // run label layout
    labelLayout(
      pulse.materialize(pulse.SOURCE).source || [],
      _.size,
      _.sort,
      array(_.offset == null ? 1 : _.offset),
      array(_.anchor || Anchors),
      _.avoidMarks || [],
      _.avoidBaseMark !== false,
      _.lineAnchor || 'end',
      _.markIndex || 0,
      _.padding === undefined ? 0 : _.padding,
      _.method || 'naive'
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
  }
});
