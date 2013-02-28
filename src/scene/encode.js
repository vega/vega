vg.scene.encode = (function() {
  var GROUP  = vg.scene.GROUP,
      ENTER  = vg.scene.ENTER,
      UPDATE = vg.scene.UPDATE,
      EXIT   = vg.scene.EXIT;

  function main(scene, enc, trans, request, items) {
    request
      ? update.call(this, scene, enc, trans, request, items)
      : encode.call(this, scene, scene, enc, trans);
    return scene;
  }
  
  function update(scene, enc, trans, request, items) {
    items = vg.array(items);
    var i, len, item, group, props, prop;
    for (i=0, len=items.length; i<len; ++i) {
      item = items[i];
      group = item.path[2] || null;
      props = item.path[1].def.properties;
      prop = props && props[request];
      if (prop) prop.call(this, item.item, group, trans);
    }
  }
  
  function encode(group, scene, enc, trans) {
    encodeItems.call(this, group, scene.items, enc, trans);
    if (scene.marktype === GROUP) {
      encodeGroup.call(this, scene, enc, group, trans);
    }
  }
  
  function encodeGroup(scene, enc, parent, trans) {
    var i, len, m, mlen, group, scales, axes;

    for (i=0, len=scene.items.length; i<len; ++i) {
      group = scene.items[i];

      // TODO cascade scales recursively
      scales = group.scales || (group.scales = vg.extend({}, parent.scales));    
      
      // update group-level scales
      if (enc.scales) {
        vg.parse.scales(enc.scales, scales, this._data, group);
      }
      
      // update group-level axes
      if (enc.axes) {
        axes = group.axes || (group.axes = []);
        vg.parse.axes(enc.axes, axes, group.scales);
      }
      
      // encode children marks
      for (m=0, mlen=group.items.length; m<mlen; ++m) {
        encode.call(this, group, group.items[m], enc.marks[m], trans);
      }
    }
  }
  
  function encodeItems(group, items, enc, trans) {
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
        enter.call(this, item, group, trans);
      }
    }
    
    if (update) {
      for (i=0, len=items.length; i<len; ++i) {
        item = items[i];
        if (item.status === EXIT) continue;
        update.call(this, item, group, trans);
      }
    }
    
    if (exit) {
      for (i=0, len=items.length; i<len; ++i) {
        item = items[i];
        if (item.status !== EXIT) continue;
        exit.call(this, item, group, trans);
      }
    }
  }
  
  return main;
})();