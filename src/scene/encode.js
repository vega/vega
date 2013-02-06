vg.scene.encode = (function() {
  var GROUP  = vg.scene.GROUP,
      ENTER  = vg.scene.ENTER,
      UPDATE = vg.scene.UPDATE,
      EXIT   = vg.scene.EXIT;

  function main(scene, enc, trans, request, items) {
    request
      ? update.call(this, scene, enc, trans, request, items)
      : encode.call(this, scene, enc, trans);
    return scene;
  }
  
  function update(scene, enc, trans, request, items) {
    items = vg.array(items);
    var i, len, item, prop;
    for (i=0, len=items.length; i<len; ++i) {
      item = items[i];
      prop = item.path[1].def.properties[request];
      if (prop) prop.call(this, item.item, trans);
    }
  }
  
  function encode(scene, enc, trans) {
    encodeItems.call(this, scene.items, enc, trans);
    if (scene.marktype === GROUP) {
      encodeGroup.apply(this, arguments);
    }
  }
  
  function encodeGroup(scene, enc, trans) {
    var i, len, m, mlen, group;
    for (i=0, len=scene.items.length; i<len; ++i) {
      group = scene.items[i];
      for (m=0, mlen=group.items.length; m<mlen; ++m) {
        encode.call(this, group.items[m], enc.marks[m], trans);
      }
    }
  }
  
  function encodeItems(items, enc, trans) {
    if (enc.properties == null) return;
    
    var props  = enc.properties,
        enter  = props.enter,
        update = props.update,
        exit   = props.exit,
        i, len, item;
    
    if (enter) {
      for (i=0, len=items.length; i<len; ++i) {
        item = items[i];
        if (item.status !== ENTER) continue;
        enter.call(this, item, trans);
      }
    }
    
    if (update) {
      for (i=0, len=items.length; i<len; ++i) {
        item = items[i];
        if (item.status === EXIT) continue;
        update.call(this, item, trans);
      }
    }
    
    if (exit) {
      for (i=0, len=items.length; i<len; ++i) {
        item = items[i];
        if (item.status !== EXIT) continue;
        exit.call(this, item, trans);
      }
    }
  }
  
  return main;
})();