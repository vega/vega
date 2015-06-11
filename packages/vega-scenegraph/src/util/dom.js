function create(doc, tag, ns) {
  return ns ? doc.createElementNS(ns, tag) : doc.createElement(tag);
}

module.exports = {
  appendUnique: function(el, tag, ns, className, child) {
    var i, c;

    for (i=el.childNodes.length-1; i>=0; --i) {
      c = el.childNodes[i];
      if (c.tagName.toLowerCase() === tag) {
        el.removeChild(c);
      }
    }
    
    c = child || create(el.ownerDocument, tag, ns);
    c.setAttribute('class', className);
    return c;
  },
  childAt: function(el, index, tag, ns) {
    var a, b;
    a = b = el.childNodes[index];
    if (!a || a.tagName.toLowerCase() !== tag) {
      a = create(el.ownerDocument, tag, ns);
      el.insertBefore(a, b);
    }
    return a;
  },
  clearChildren: function(el, index) {
    var curr = el.childNodes.length;
    while (curr > index) {
      el.removeChild(el.childNodes[--curr]);
    }
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
