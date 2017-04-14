export default function(context, scene) {
  var group = scene.group;
  context.save();
  context.beginPath();
  context.rect(0, 0, group.width || 0, group.height || 0);
  context.clip();
}
