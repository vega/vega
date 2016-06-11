export default function parseSignal(signal, scope) {
  scope.addSignal(signal.name, signal.init);

  if (signal.streams) {
    signal.streams.forEach(function(_) { parseStream(_, scope); });
  }
}

export function parseStream(stream, scope) {
  // TODO
  scope + '';
}
