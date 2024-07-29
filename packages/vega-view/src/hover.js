function itemFilter(event) {
  return event.item;
}

function markTarget(event) {
  // grab upstream collector feeding the mark operator
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
  hoverSet = [hoverSet || 'hover'];
  leaveSet = [leaveSet || 'update', hoverSet[0]];

  // invoke hover set upon pointerover
  this.on(
    this.events('view', 'pointerover', itemFilter),
    markTarget,
    invoke(hoverSet)
  );

  // invoke leave set upon pointerout
  this.on(
    this.events('view', 'pointerout', itemFilter),
    markTarget,
    invoke(leaveSet)
  );

  return this;
}
