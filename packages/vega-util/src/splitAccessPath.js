export default function(p) {
  return String(p)
    .match(/\[(.*?)\]|[^.\[]+/g)
    .map(path_trim);
}

function path_trim(d) {
  return d[0] !== '[' ? d
    : d[1] !== "'" && d[1] !== '"' ? d.slice(1, -1)
    : d.slice(2, -2).replace(/\\(["'])/g, '$1');
}
