export default function(name, field, value) {
  var index = this.context.data[name]['index:' + field],
      entry = index ? index.value.get(value) : undefined;
  return entry ? entry.count : entry;
}
