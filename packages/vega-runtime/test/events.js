import * as vega from 'vega-dataflow';
const registry = {};

export function events(source, type, filter) {
  const handlers = registry[source] || (registry[source] = {});
  return (handlers[type] = new vega.EventStream(filter));
}

export function fire(source, type, event) {
  var handlers = registry[source],
      handler = handlers && handlers[type];
  if (handler) handler.receive(event);
  if (this && this.run) this.run();
}
