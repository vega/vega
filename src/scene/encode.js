vg.scene.encode = (function() {
  var GROUP  = vg.scene.GROUP,
      ENTER  = vg.scene.ENTER,
      UPDATE = vg.scene.UPDATE,
      EXIT   = vg.scene.EXIT;

  function main(scene, def, trans, request, items) {
    (request && items)
      ? update.call(this, scene, def, trans, request, items)
      : encode.call(this, scene, scene, def, trans, request);
    return scene;
  }
  
  function update(scene, def, trans, request, items) {
    items = vg.array(items);
    var i, len, item, group, props, prop;
    for (i=0, len=items.length; i<len; ++i) {
      item = items[i];
      group = item.mark.group || null;
      props = item.mark.def.properties;
      prop = props && props[request];
      if (prop) prop.call(this, item, group, trans);
    }
  }
  
  function encode(group, scene, def, trans, request) {
    encodeItems.call(this, group, scene.items, def, trans, request);
    if (scene.marktype === GROUP) {
      encodeGroup.call(this, scene, def, group, trans, request);
    }
  }
  
  function encodeGroup(scene, def, parent, trans, request) {
    var i, len, m, mlen, group, scales, axes, axisItems, axisDef;

    for (i=0, len=scene.items.length; i<len; ++i) {
      group = scene.items[i];

      // cascade scales recursively
      scales = group.scales || (group.scales = vg.extend({}, parent.scales));    
      
      // update group-level scales
      if (def.scales) {
        vg.parse.scales(def.scales, scales, this._data, group);
      }
      
      // update group-level axes
      if (def.axes) {
        axes = group.axes || (group.axes = []);
        axisItems = group.axisItems || (group.axisItems = []);
        vg.parse.axes(def.axes, axes, group.scales);
        axes.forEach(function(a, i) {
          axisDef = a.def();
          axisItems[i] = vg.scene.build(axisDef, this._data, axisItems[i]);
          encode.call(this, group, group.axisItems[i], axisDef, trans);
        });
      }
      
      // encode children marks
      for (m=0, mlen=group.items.length; m<mlen; ++m) {
        encode.call(this, group, group.items[m], def.marks[m], trans, request);
      }
    }
  }
  
  function encodeItems(group, items, def, trans, request) {
    if (def.properties == null) return;
    
    var props  = def.properties,
        enter  = props.enter,
        update = props.update,
        exit   = props.exit,
        i, len, item, prop;
    
    if (request && (prop = props[request])) {
      for (i=0, len=items.length; i<len; ++i) {
        prop.call(this, items[i], group, trans);
      }
      return; // exit early if given request
    }
    
    for (i=0; i<items.length; ++i) {
      item = items[i];
      
      // enter set
      if (item.status === ENTER) {
        if (enter) enter.call(this, item, group);
        item.status = UPDATE;
      }

      // update set      
      if (item.status !== EXIT && update) {
        update.call(this, item, group, trans);
      }
      
      // exit set
      if (item.status === EXIT) {
        if (exit && trans) exit.call(this, item, group, trans);
        if (!trans) items[i--].remove();
      }
    }
  }
  
  return main;
})();