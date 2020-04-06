function log(df, method, args) {
  try {
    // eslint-disable-next-line prefer-spread
    df[method].apply(df, ['EXPRESSION'].concat([].slice.call(args)));
  } catch (err) {
    df.warn(err);
  }
  return args[args.length - 1];
}

export function warn(...args) {
  return log(this.context.dataflow, 'warn', args);
}

export function info(...args) {
  return log(this.context.dataflow, 'info', args);
}

export function debug(...args) {
  return log(this.context.dataflow, 'debug', args);
}
