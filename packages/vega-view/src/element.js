export default function(tag, attr, text) {
  const el = document.createElement(tag);
  for (const key in attr) el.setAttribute(key, attr[key]);
  if (text != null) el.textContent = text;
  return el;
}
