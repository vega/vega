import {Bounds, intersect} from 'vega-scenegraph';
import {array} from 'vega-util';

export default function(b, opt, group) {
  if (!b) return [];

  const scene = group || this.context.dataflow.scenegraph().root;
  const box = new Bounds().set(b[0], b[1], b[2], b[3]);

  return intersect(scene, box, filter(opt));
}

function filter(opt) {
  let p = null;

  if (opt) {
    const types = array(opt.marktype),
          names = array(opt.markname);
    p = _ => (!types.length || types.some(t => _.marktype === t))
          && (!names.length || names.some(s => _.name === s));
  }

  return p;
}