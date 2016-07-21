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
  var group = this.root.items[0],
      mark = group.items[path[0]],
      i, n;

  try {
    for (i=1, n=path.length-1; i<n; ++i) {
      group = mark.items[path[i++]];
      mark = group.items[path[i]];
    }

    if (!mark && !markdef) throw n;

    if (markdef) {
      mark = createMark(markdef, group);
      group.items[path[n]] = mark;
    }

    return mark;
  } catch (err) {
    error('Invalid scenegraph path: ' + path);
  }
};

function error(msg) {
  throw Error(msg);
}

function createMark(def, group) {
  return {
    bounds:      new Bounds(),
    clip:        !!def.clip,
    group:       group,
    interactive: def.interactive === false ? false : true,
    items:       [],
    marktype:    def.marktype,
    name:        def.name || undefined,
    role:        def.role || undefined
  };
}
