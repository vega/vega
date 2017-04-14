export default function(renderer, scene) {
  var defs = renderer._defs,
      id = scene.clip_id || (scene.clip_id = 'clip' + defs.clip_id++),
      c = defs.clipping[id] || (defs.clipping[id] = {id: id});
  c.width = scene.group.width || 0;
  c.height = scene.group.height || 0;
  return 'url(#' + id + ')';
}