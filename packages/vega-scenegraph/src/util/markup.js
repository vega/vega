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
  let buf = '',
      outer = '',
      inner = '';

  const stack = [],
        clear = () => outer = inner = '',
        push = tag => {
          if (outer) { buf += `${outer}>${inner}`; clear(); }
          stack.push(tag);
        },
        attr = (name, value) => {
          if (value != null) outer += ` ${name}="${attrText(value)}"`;
          return m;
        },

        m = {
          open(tag, ...attrs) {
            push(tag);
            outer = '<' + tag;
            for (const set of attrs) {
              for (const key in set) attr(key, set[key]);
            }
            return m;
          },
          close() {
            const tag = stack.pop();
            if (outer) {
              buf += outer + (inner
                ? `>${inner}</${tag}>`
                : '/>');
            } else {
              buf += `</${tag}>`;
            }
            clear();
            return m;
          },
          attr,
          text: t => (inner += innerText(t), m),
          toString: () => buf
        };

  return m;
}

export const serializeXML = node =>
  _serialize(markup(), node) + '';

function _serialize(m, node) {
  m.open(node.tagName);

  if (node.hasAttributes()) {
    const attrs = node.attributes,
          n = attrs.length;
    for (let i=0; i<n; ++i) {
      m.attr(attrs[i].name, attrs[i].value);
    }
  }

  if (node.hasChildNodes()) {
    const children = node.childNodes;

    for (const child of children) {
      child.nodeType === 3 // text node
        ? m.text(child.nodeValue)
        : _serialize(m, child);
    }
  }

  return m.close();
}
