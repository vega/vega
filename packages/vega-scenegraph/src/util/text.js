function size(item) {
  return item.fontSize != null ? item.fontSize : 11;
}

module.exports = {
  size: size,
  value: function(s) {
    return s != null ? String(s) : '';
  },
  font: function(item, quote) {
    var font = item.font;
    if (quote && font) {
      font = String(font).replace(/\"/g, '\'');
    }
    return '' +
      (item.fontStyle ? item.fontStyle + ' ' : '') +
      (item.fontVariant ? item.fontVariant + ' ' : '') +
      (item.fontWeight ? item.fontWeight + ' ' : '') +
      size(item) + 'px ' +
      (font || 'sans-serif');
  },
  offset: function(item) {
    // perform our own font baseline calculation
    // why? not all browsers support SVG 1.1 'alignment-baseline' :(
    var baseline = item.baseline,
        h = size(item);
    return Math.round(
      baseline === 'top'    ?  0.93*h :
      baseline === 'middle' ?  0.30*h :
      baseline === 'bottom' ? -0.21*h : 0
    );
  }
};
