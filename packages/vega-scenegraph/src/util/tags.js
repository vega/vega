// generate string for an opening xml tag
// tag: the name of the xml tag
// attr: hash of attribute name-value pairs to include
// raw: additional raw string to include in tag markup
export function openTag(tag, attr, raw) {
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
}

// generate string for closing xml tag
// tag: the name of the xml tag
export function closeTag(tag) {
  return '</' + tag + '>';
}
