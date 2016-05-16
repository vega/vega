// create a new DOM element
function create(doc, tag, ns) {
  return ns ? doc.createElementNS(ns, tag) : doc.createElement(tag);
}

// remove element from DOM
// recursively remove parent elements if empty
function remove(el) {
  if (!el) return;
  var p = el.parentNode;
  if (p) {
    p.removeChild(el);
    if (!p.childNodes || !p.childNodes.length) remove(p);
  }
}

module.exports = {
  // find first child element with matching tag
  find: function(el, tag) {
    tag = tag.toLowerCase();
    for (var i=0, n=el.childNodes.length; i<n; ++i) {
      if (el.childNodes[i].tagName.toLowerCase() === tag) {
        return el.childNodes[i];
      }
    }
  },
  // retrieve child element at given index
  // create & insert if doesn't exist or if tag/className do not match
  child: function(el, index, tag, ns, className, insert) {
    var a, b;
    a = b = el.childNodes[index];
    if (!a || insert ||
        a.tagName.toLowerCase() !== tag.toLowerCase() ||
        className && a.getAttribute('class') != className) {
      a = create(el.ownerDocument, tag, ns);
      el.insertBefore(a, b || null);
      if (className) a.setAttribute('class', className);
    }
    return a;
  },
  // remove all child elements at or above the given index
  clear: function(el, index) {
    var curr = el.childNodes.length;
    while (curr > index) {
      el.removeChild(el.childNodes[--curr]);
    }
    return el;
  },
  remove: remove,
  // generate css class name for mark
  cssClass: function(mark) {
    return 'mark-' + mark.marktype + (mark.name ? ' '+mark.name : '');
  },
  // generate string for an opening xml tag
  // tag: the name of the xml tag
  // attr: hash of attribute name-value pairs to include
  // raw: additional raw string to include in tag markup
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
  // generate string for closing xml tag
  // tag: the name of the xml tag
  closeTag: function(tag) {
    return '</' + tag + '>';
  }
};
