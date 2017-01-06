export default function(name) {
  var data = this.context.data[name];
  return data ? data.values.value : [];
}
