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

  if (pulse.changed(pulse.REM)) {
    view.enqueue(pulse.materialize(pulse.REM).rem);
  }

  if (pulse.changed(pulse.ADD)) {
    view.enqueue(pulse.materialize(pulse.ADD).add);
  }

  if (pulse.changed(pulse.MOD)) {
    view.enqueue(pulse.materialize(pulse.MOD).mod);
  }

  // set z-index dirty flag as needed
  if (pulse.fields && pulse.fields['zindex']) {
    var item = pulse.source && pulse.source[0];
    if (item) item.mark.zdirty = true;
  }
};
