import Bounds from './Bounds';
import GroupItem from './GroupItem';
import {sceneFromJSON, sceneToJSON} from './util/serialize';

export default function Scenegraph(scene) {
  if (arguments.length) {
    this.root = sceneFromJSON(scene);
  } else {
    this.root = createMark({
      marktype: 'group',
      name: 'root',
      role: 'frame'
    });
    this.root.items = [new GroupItem(this.root)];
  }
}

var prototype = Scenegraph.prototype;

prototype.toJSON = function(indent) {
  return sceneToJSON(this.root, indent || 0);
};

prototype.mark = function(scenepath, markdef) {
  var markpath = scenepath.marks,
      itempath = scenepath.items,
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
      if (mark.zindex) mark.group.zdirty = true;
      return mark;
    }

    throw n;
  } catch (err) {
    error('Invalid scenegraph path: ' + scenepath.marks + ' : ' + scenepath.items);
  }
};

function error(msg) {
  throw Error(msg);
}

function createMark(def, group) {
  return {
    bounds:      new Bounds(),
    bounds_prev: new Bounds(),
    clip:        !!def.clip,
    group:       group,
    interactive: def.interactive === false ? false : true,
    items:       [],
    marktype:    def.marktype,
    name:        def.name || undefined,
    role:        def.role || undefined,
    zindex:      def.zindex || 0
  };
}
