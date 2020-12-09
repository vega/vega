import {Transform, stableCompare} from 'vega-dataflow';
import {error, inherits, one} from 'vega-util';

/**
 * Abstract class for tree layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 */
export default function HierarchyLayout(params) {
  Transform.call(this, null, params);
}

const defaultSeparation = (a, b) => a.parent === b.parent ? 1 : 2;

inherits(HierarchyLayout, Transform, {
  transform(_, pulse) {
    if (!pulse.source || !pulse.source.root) {
      error(this.constructor.name
        + ' transform requires a backing tree data source.');
    }

    const layout = this.layout(_.method),
          fields = this.fields,
          root = pulse.source.root,
          as = _.as || fields;

    if (_.field) root.sum(_.field); else root.count();
    if (_.sort) root.sort(stableCompare(_.sort, d => d.data));

    setParams(layout, this.params, _);
    if (layout.separation) {
      layout.separation(_.separation !== false ? defaultSeparation : one);
    }

    try {
      this.value = layout(root);
    } catch (err) {
      error(err);
    }
    root.each(node => setFields(node, fields, as));

    return pulse.reflow(_.modified()).modifies(as).modifies('leaf');
  }
});

function setParams(layout, params, _) {
  for (let p, i=0, n=params.length; i<n; ++i) {
    p = params[i];
    if (p in _) layout[p](_[p]);
  }
}

function setFields(node, fields, as) {
  const t = node.data,
        n = fields.length - 1;
  for (let i=0; i<n; ++i) {
    t[as[i]] = node[fields[i]];
  }
  t[as[n]] = node.children ? node.children.length : 0;
}
