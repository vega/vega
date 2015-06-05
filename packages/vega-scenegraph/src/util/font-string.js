module.exports = function(item, quote) {
  var font = item.font;
  if (quote && font) {
    font = String(font).replace(/\"/g, '\'');
  }
  return '' +
    (item.fontStyle ? item.fontStyle + ' ' : '') +
    (item.fontVariant ? item.fontVariant + ' ' : '') +
    (item.fontWeight ? item.fontWeight + ' ' : '') +
    (item.fontSize != null ? item.fontSize : 11) + 'px ' +
    (font || 'sans-serif');
};
