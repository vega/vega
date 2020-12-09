export default function(item) {
  const group = this.context.group;
  let value = false;

  if (group) while (item) {
    if (item === group) { value = true; break; }
    item = item.mark.group;
  }
  return value;
}
