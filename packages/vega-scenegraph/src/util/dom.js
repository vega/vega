var d3 = require('d3');

module.exports = {
  appendUnique: function(el, tag, className) {
    // remove any existing elements
    var sel = d3.select(el);
    sel.selectAll(tag + '.' + className).remove();

    // add element to the document
    return sel.append(tag).attr('class', className);
  },
  cssClass: function(mark) {
    return 'type-' + mark.marktype + (mark.name ? ' '+mark.name : '');
  },
  fontString: function(item, quote) {
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
  },
  openTag: function(tag, attr, raw) {
    var s = '<' + tag, key, val;
    if (attr) {
      for (key in attr) {
        val = attr[key];
        if (val != null) {
          s += ' ' + key + '="' + val + '"';
        }
      }
    }
    if (raw) s += ' ' + raw;
    return s + '>';
  },
  closeTag: function(tag) {
    return '</' + tag + '>';
  }
};
