import Bounds from './Bounds';

export default function Item(mark) {
  this.mark = mark;
  this.bounds = new Bounds();
  this['bounds:prev'] = new Bounds();
}

Item.prototype = {
  remove: function() {
    var item = this,
        list = item.mark.items,
        i = list.indexOf(item);
    if (i >= 0) {
      if (i===list.length-1) {
        list.pop();
      } else {
        list.splice(i, 1);
      }
    }
    return item;
  }
}
