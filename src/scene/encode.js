vg.scene.encode = (function() {
  var GROUP  = vg.scene.GROUP,
      ENTER  = vg.scene.ENTER,
      UPDATE = vg.scene.UPDATE,
      EXIT   = vg.scene.EXIT,
      EMPTY  = {};

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
      if (prop) {
        prop.call(vg, item, group, trans);
        vg.scene.bounds.item(item);
      }
    }
  }
  
  function encode(group, scene, def, trans, request) {
    encodeItems.call(this, group, scene.items, def, trans, request);
    if (scene.marktype === GROUP) {
      encodeGroup.call(this, scene, def, group, trans, request);
    } else {
      vg.scene.bounds.mark(scene);
    }
  }
  
  function encodeLegend(group, scene, def, trans, request) {
    encodeGroup.call(this, scene, def, group, trans, request);
    encodeItems.call(this, group, scene.items, def, trans, request);
    vg.scene.bounds.mark(scene, null, true);
  }
  
  function encodeGroup(scene, def, parent, trans, request) {
    var i, len, m, mlen, group, scales,
        axes, axisItems, axisDef, leg, legItems, legDef;

    for (i=0, len=scene.items.length; i<len; ++i) {
      group = scene.items[i];

      // cascade scales recursively
      // use parent scales if there are no group-level scale defs
      scales = group.scales || (group.scales =
        def.scales ? vg.extend({}, parent.scales) : parent.scales);
      
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
          axisItems[i].group = group;
          encode.call(this, group, group.axisItems[i], axisDef, trans);
        });
      }
      
      // encode children marks
      for (m=0, mlen=group.items.length; m<mlen; ++m) {
        encode.call(this, group, group.items[m], def.marks[m], trans, request);
      }
    }
    
    // compute bounds (without legend)
    vg.scene.bounds.mark(scene, null, !def.legends);
    
    // update legends
    if (def.legends) {
      for (i=0, len=scene.items.length; i<len; ++i) {
        group = scene.items[i];
        leg = group.legends || (group.legends = []);
        legItems = group.legendItems || (group.legendItems = []);
        vg.parse.legends(def.legends, leg, group.scales);
        leg.forEach(function(l, i) {
          legDef = l.def();
          legItems[i] = vg.scene.build(legDef, this._data, legItems[i]);
          legItems[i].group = group;
          encodeLegend.call(this, group, group.legendItems[i], legDef, trans);
        });
      }
      vg.scene.bounds.mark(scene, null, true);
    }
  }
  
  function encodeItems(group, items, def, trans, request) {    
    var props  = def.properties || EMPTY,
        enter  = props.enter,
        update = props.update,
        exit   = props.exit,
        i, len, item, prop;

    if (request) {
      if (prop = props[request]) {
        for (i=0, len=items.length; i<len; ++i) {
          prop.call(vg, items[i], group, trans);
        }
      }
      return; // exit early if given request
    }

    for (i=0; i<items.length; ++i) {
      item = items[i];

      // enter set
      if (item.status === ENTER) {
        if (enter) enter.call(vg, item, group);
        item.status = UPDATE;
      }

      // update set      
      if (item.status !== EXIT && update) {
        update.call(vg, item, group, trans);
      }
      
      // exit set
      if (item.status === EXIT) {
        if (exit) exit.call(vg, item, group, trans);
        if (trans && !exit) trans.interpolate(item, EMPTY);
        else if (!trans) items[i--].remove();
      }
    }
  }
  
  return main;
})();