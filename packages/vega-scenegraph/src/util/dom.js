function create(doc, tag, ns) {
  return ns ? doc.createElementNS(ns, tag) : doc.createElement(tag);
}

module.exports = {
  child: function(el, index, tag, ns, className) {
    var a, b;
    a = b = el.childNodes[index];
    if (!a || a.tagName.toLowerCase() !== tag ||
        className && a.getAttribute('class') != className) {
      a = create(el.ownerDocument, tag, ns);
      el.insertBefore(a, b);
      if (className) a.setAttribute('class', className);
    }
    return a;
  },
  clear: function(el, index) {
    var curr = el.childNodes.length;
    while (curr > index) {
      el.removeChild(el.childNodes[--curr]);
    }
    return el;
  },
  cssClass: function(mark) {
    return 'mark-' + mark.marktype + (mark.name ? ' '+mark.name : '');
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
