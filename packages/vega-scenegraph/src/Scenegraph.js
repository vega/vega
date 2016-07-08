import Bounds from './Bounds';
import GroupItem from './GroupItem';

export default function Scenegraph() {
  this.root = createMark({
    marktype: 'group',
    interactive: false
  });
  this.root.items = [new GroupItem(this.root)];
}

var prototype = Scenegraph.prototype;

prototype.select = function(path, markdef) {
  var items = this.root.items[0],
      node, i, n;

  for (i=0, n=path.length-1; i<n; ++i) {
    items = items.items[path[i]];
    if (!items) error('Invalid scenegraph path: ' + path);
  }
  items = items.items;

  if (!(node = items[path[n]])) {
    if (markdef) items[path[n]] = node = createMark(markdef);
    else error('Invalid scenegraph path: ' + path);
  }

  return node;
};

function error(msg) {
  throw Error(msg);
}

function createMark(def) {
  return {
    bounds:      new Bounds(),
    clip:        !!def.clip,
    interactive: def.interactive === false ? false : true,
    items:       [],
    marktype:    def.marktype
  };
}
