import {Transform, Tuple} from 'vega-dataflow';
import {error, inherits} from 'vega-util';

 /**
  * Generate tuples representing links between tree nodes.
  * The resulting tuples will contain 'source' and 'target' fields,
  * which point to parent and child node tuples, respectively.
  * @constructor
  * @param {object} params - The parameters for this operator.
  */
export default function TreeLinks(params) {
  Transform.call(this, {}, params);
}

var prototype = inherits(TreeLinks, Transform);

function parentTuple(node) {
  var p;
  return node.parent
      && (p=node.parent.data)
      && '_id' in p && p;
}

prototype.transform = function(_, pulse) {
  if (!pulse.source || !pulse.source.root) {
    error('TreeLinks transform requires a backing tree data source.');
  }

  var root = pulse.source.root,
      nodes = root.lookup,
      links = this.value,
      mods = {},
      out = pulse.fork();

  function modify(id) {
    var link = links[id];
    if (link) mods[id] = 1, out.mod.push(link);
  }

  // process removed tuples
  // assumes that if a parent node is removed the child will be, too.
  pulse.visit(pulse.REM, function(t) {
    var link = links[t._id];
    if (link) delete links[t._id], out.rem.push(link);
  });

  // create new link instances for added nodes with valid parents
  pulse.visit(pulse.ADD, function(t) {
    var id = t._id, p;
    if (p = parentTuple(nodes[id])) {
      out.add.push(links[id] = Tuple.ingest({source: p, target: t}));
      mods[id] = 1;
    }
  });

  // process modified nodes and their children
  pulse.visit(pulse.MOD, function(t) {
    var id = t._id,
        node = nodes[id],
        kids = node.children;

    modify(id);
    if (kids) for (var i=0, n=kids.length; i<n; ++i) {
      if (!mods[(id=kids[i].data._id)]) modify(id);
    }
  });

  return out;
};
