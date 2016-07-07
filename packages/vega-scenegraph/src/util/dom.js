// create a new DOM element
function create(doc, tag, ns) {
  return ns ? doc.createElementNS(ns, tag) : doc.createElement(tag);
}

// remove element from DOM
// recursively remove parent elements if empty
export function remove(el) {
  if (!el) return;
  var p = el.parentNode;
  if (p) {
    p.removeChild(el);
    if (!p.childNodes || !p.childNodes.length) remove(p);
  }
}

// find first child element with matching tag
export function find(el, tag) {
  tag = tag.toLowerCase();
  for (var i=0, n=el.childNodes.length; i<n; ++i) {
    if (el.childNodes[i].tagName.toLowerCase() === tag) {
      return el.childNodes[i];
    }
  }
}

// retrieve child element at given index
// create & insert if doesn't exist or if tag/className do not match
export function child(el, index, tag, ns, className, insert) {
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
}

// remove all child elements at or above the given index
export function clear(el, index) {
  var curr = el.childNodes.length;
  while (curr > index) {
    el.removeChild(el.childNodes[--curr]);
  }
  return el;
}

// generate css class name for mark
export function cssClass(mark) {
  return 'mark-' + mark.marktype + (mark.name ? ' '+mark.name : '');
}
