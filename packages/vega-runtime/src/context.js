/**
 * Context objects store the current parse state.
 * Enables lookup of parsed operators, event streams, and accessor functions.
 * Provides 'fork' method for creating child contexts for subflows.
 */
export default function context(df, transforms, ctx) {
  var operators = ctx ? Object.create(ctx.operators) : {},
      streams = ctx ? Object.create(ctx.streams) : {};

  function operator(id) {
    return operators.hasOwnProperty(id) && operators[id];
  }

  function stream(id) {
    return streams.hasOwnProperty(id) && streams[id];
  }

  function fork() {
    return context(df, transforms, this);
  }

  return {
    dataflow: df,
    events: ctx ? ctx.events : df.events.bind(df),
    updates: ctx ? Object.create(ctx.updates) : {},
    fn: ctx ? Object.create(ctx.fn) : {},
    operators: operators,
    operator: operator,
    streams: streams,
    stream: stream,
    transforms: transforms,
    fork: fork
  };
}
