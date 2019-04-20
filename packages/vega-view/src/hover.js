function itemFilter(event) {
  return event.item;
}

function markTarget(event) {
  // grab upstream collector feeding the mark operator
  var source = event.item.mark.source;
  return source.source || source;
}

function invoke(name) {
  return function(_, event) {
    return event.vega.view()
      .changeset()
      .encode(event.item, name);
  };
}

export default function(hoverSet, leaveSet) {
  hoverSet = [hoverSet || 'hover'];
  leaveSet = [leaveSet || 'update', hoverSet[0]];

  // invoke hover set upon mouseover
  this.on(
    this.events('view', 'mouseover', itemFilter),
    markTarget,
    invoke(hoverSet)
  );

  // invoke leave set upon mouseout
  this.on(
    this.events('view', 'mouseout', itemFilter),
    markTarget,
    invoke(leaveSet)
  );

  return this;
}
