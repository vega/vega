function log(method, level, input) {
  const args = [level].concat([].slice.call(input));
  console[method](...args); // eslint-disable-line no-console
}

export const None = 0;
export const Error = 1;
export const Warn = 2;
export const Info = 3;
export const Debug = 4;

export default function (_, method) {
  let level = _ || None;
  return {
    level: function (_) {
      if (arguments.length) {
        level = +_;
        return this;
      } else {
        return level;
      }
    },
    error: function (...args) {
      if (level >= Error) log(method || 'error', 'ERROR', args);
      return this;
    },
    warn: function (...args) {
      if (level >= Warn) log(method || 'warn', 'WARN', args);
      return this;
    },
    info: function (...args) {
      if (level >= Info) log(method || 'log', 'INFO', args);
      return this;
    },
    debug: function (...args) {
      if (level >= Debug) log(method || 'log', 'DEBUG', args);
      return this;
    }
  };
}
