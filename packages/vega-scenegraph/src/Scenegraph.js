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

prototype.mark = function(scenepath, markdef) {
  var markpath = scenepath[0],
      itempath = scenepath[1],
      item = this.root.items[0],
      mark, index, i, n;

  try {
    for (i=0, n=markpath.length; i<n; ++i) {
      mark = item.items[markpath[i]];
      if (!mark) break;
      index = itempath[i] || 0;
      item = mark.items[index] || mark.items[mark.items.length-1];
    }

    if (!mark) {
      mark = createMark(markdef, item);
      item.items[markpath[i]] = mark;
      return mark;
    }

    throw n;
  } catch (err) {
    error('Invalid scenegraph path: ' + JSON.stringify(scenepath));
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
