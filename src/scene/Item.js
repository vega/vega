vg.scene.Item = (function() {
  function item(mark) {
    this.mark = mark;
  }
  
  var prototype = item.prototype;

  prototype.cousin = function(offset, index) {
    if (offset === 0) return this;
    offset = offset || -1;
    var mark = this.mark,
        group = mark.group,
        iidx = index==null ? mark.items.indexOf(this) : index,
        midx = group.items.indexOf(mark) + offset;
    return group.items[midx].items[iidx];
  };
  
  prototype.sibling = function(offset) {
    if (offset === 0) return this;
    offset = offset || -1;
    var mark = this.mark,
        iidx = mark.items.indexOf(this) + offset;
    return mark.items[iidx];
  };
  
  prototype.remove = function() {
    var item = this,
        list = item.mark.items,
        i = list.indexOf(item);
    if (i >= 0) (i===list.length-1) ? list.pop() : list.splice(i, 1);
    return item;
  };
  
  return item;
})();

vg.scene.item = function(mark) {
  return new vg.scene.Item(mark);
};