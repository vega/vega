const innerText = val => (val + '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const attrText = val => innerText(val)
  .replace(/"/g, '&quot;')
  .replace(/\t/g, '&#x9;')
  .replace(/\n/g, '&#xA;')
  .replace(/\r/g, '&#xD;');

export function markup() {
  let stack = [],
      text = '',
      outer = '',
      inner = '',
      push = tag => {
        if (outer) {
          text += `${outer}>${inner}`;
          outer = inner = '';
        }
        stack.push(tag);
      };

  const m = {
    open(tag, ...attrs) {
      push(tag);
      let s = '<' + tag;
      for (const attr of attrs) {
        for (const key in attr) {
          const val = attr[key];
          if (val != null) {
            s += ` ${key}="${attrText(val)}"`;
          }
        }
      }
      outer = s;
      return m;
    },
    close() {
      const tag = stack.pop();
      if (outer) {
        text += outer + (inner
          ? `>${inner}</${tag}>`
          : '/>');
      } else {
        text += `</${tag}>`;
      }
      outer = inner = '';
      return m;
    },
    text: t => (inner += innerText(t), m),
    toString: () => text
  };

  return m;
}

export function serializeXML(node) {
  const m = markup();
  _serialize(m, node);
  return m + '';
}

function _serialize(m, node) {
  const tag = node.tagName;

  if (node.hasAttributes()) {
    const  attr = {};
    const attrs = node.attributes,
          n = attrs.length;
    for (let i=0; i<n; ++i) {
      attr[attrs[i].name] = attrs[i].value;
    }
    m.open(tag, attr);
  } else {
    m.open(tag);
  }

  if (node.hasChildNodes()) {
    const children = node.childNodes,
          n = children.length;

    for (let i=0; i<n; i++) {
      const child = children[i];
      if (child.nodeType === 3) { // text node
        m.text(child.nodeValue);
      } else {
        _serialize(m, child);
      }
    }
  }

  m.close();
}
