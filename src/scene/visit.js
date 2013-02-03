vg.scene.visit = (function() {
  function visit(scene, pre, post) {
    var i, j, len, llen, mark, retval,
        items = scene.items,
        isGroup = scene.marktype === vg.scene.GROUP;

    for (i=0, len=items.length; i<len; ++i) {
      mark = items[i];
      
      if (pre) {
        retval = pre.call(this, mark);
        if (retval) return retval;
      }
      
      if (isGroup) {
        for (j=0, llen=mark.items.length; j<llen; ++j) {
          retval = visit.call(this, mark.items[j], pre, post);
          if (retval) return retval;
        }
      }
      
      if (post) {
        retval = post.call(this, mark);
        if (retval) return retval;
      }
    }
  }
  
  return visit;
})();