export default function(renderer, item, size) {
  var defs = renderer._defs,
      id = item.clip_id || (item.clip_id = 'clip' + defs.clip_id++),
      c = defs.clipping[id] || (defs.clipping[id] = {id: id});
  c.width = size.width || 0;
  c.height = size.height || 0;
  return 'url(#' + id + ')';
}
