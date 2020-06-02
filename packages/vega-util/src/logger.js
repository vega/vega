function log(method, level, input) {
  const args = [level].concat([].slice.call(input));
  console[method].apply(console, args); // eslint-disable-line no-console
}

export const None  = 0;
export const Error = 1;
export const Warn  = 2;
export const Info  = 3;
export const Debug = 4;

export default function(_, method) {
  let level = _ || None;
  return {
    level(_) {
      if (arguments.length) {
        level = +_;
        return this;
      } else {
        return level;
      }
    },
    error() {
      if (level >= Error) log(method || 'error', 'ERROR', arguments);
      return this;
    },
    warn() {
      if (level >= Warn) log(method || 'warn', 'WARN', arguments);
      return this;
    },
    info() {
      if (level >= Info) log(method || 'log', 'INFO', arguments);
      return this;
    },
    debug() {
      if (level >= Debug) log(method || 'log', 'DEBUG', arguments);
      return this;
    }
  };
}
