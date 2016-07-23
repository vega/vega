function itemFilter(event) {
  return event.item;
}

function markTarget(event) {
  return event.item.mark.source;
}

function invoke(name) {
  return function(_, event) {
    return event.vega.view()
      .changeset()
      .encode(event.item, name);
  };
}

export default function(hoverSet, leaveSet) {
  // invoke hover set upon mouseover
  this.on(
    this.events('view', 'mouseover', itemFilter),
    markTarget,
    invoke(hoverSet || 'hover')
  );

  // invoke leave set upon mouseout
  this.on(
    this.events('view', 'mouseout', itemFilter),
    markTarget,
    invoke(leaveSet || 'update')
  );

  return this;
}
