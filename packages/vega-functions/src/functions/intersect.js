import {Bounds, intersect} from 'vega-scenegraph';
import {array} from 'vega-util';

export default function(b, opt, group) {
  if (!b) return [];

  const [u, v] = b;
  const box = new Bounds().set(u[0], u[1], v[0], v[1]);
  const scene = group || this.context.dataflow.scenegraph().root;

  return intersect(scene, box, filter(opt));
}

function filter(opt) {
  let p = null;

  if (opt) {
    const types = array(opt.marktype);
    const names = array(opt.markname);
    p = _ => (!types.length || types.some(t => _.marktype === t))
          && (!names.length || names.some(s => _.name === s));
  }

  return p;
}
