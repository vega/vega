import adjustSpatial from './adjust-spatial.js';
import interpret from './interpret.js';

export default {
  /**
   * Parse an expression used to update an operator value.
   */
  operator(ctx, expr) {
    const ast = expr.ast, fn = ctx.functions;
    return _ => interpret(ast, fn, _);
  },

  /**
   * Parse an expression provided as an operator parameter value.
   */
  parameter(ctx, expr) {
    const ast = expr.ast, fn = ctx.functions;
    return (datum, _) => interpret(ast, fn, _, datum);
  },

  /**
   * Parse an expression applied to an event stream.
   */
  event(ctx, expr) {
    const ast = expr.ast, fn = ctx.functions;
    return event => interpret(ast, fn, undefined, undefined, event);
  },

  /**
   * Parse an expression used to handle an event-driven operator update.
   */
  handler(ctx, expr) {
    const ast = expr.ast, fn = ctx.functions;
    return (_, event) => {
      const datum = event.item && event.item.datum;
      return interpret(ast, fn, _, datum, event);
    };
  },

  /**
   * Parse an expression that performs visual encoding.
   */
  encode(ctx, encode) {
    const {marktype, channels} = encode,
          fn = ctx.functions,
          swap = marktype === 'group'
              || marktype === 'image'
              || marktype === 'rect';

    return (item, _) => {
      const datum = item.datum;
      let m = 0, v;

      for (const name in channels) {
        v = interpret(channels[name].ast, fn, _, datum, undefined, item);
        if (item[name] !== v) {
          item[name] = v;
          m = 1;
        }
      }

      if (marktype !== 'rule') {
        adjustSpatial(item, channels, swap);
      }
      return m;
    };
  }
};
