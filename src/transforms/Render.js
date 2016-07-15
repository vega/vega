import {Transform} from 'vega-dataflow';
import {inherits} from 'vega-util';

/**
 * Queue modified scenegraph items for rendering.
 * @constructor
 */
export default function Render(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(Render, Transform);

prototype.transform = function(_, pulse) {
  var view = pulse.dataflow;

  if (pulse.changed(pulse.ADD)) {
    view.renderQueue(pulse.materialize(pulse.ADD).add);
  }

  if (pulse.changed(pulse.MOD)) {
    view.renderQueue(pulse.materialize(pulse.MOD).mod);
  }
};
