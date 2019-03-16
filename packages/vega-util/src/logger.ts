function log(method: Method, level: Level, input: IArguments): void {
  var msg = [level].concat([].slice.call(input));
  console[method](...msg);
}

export type Method = keyof Console;

export type Level = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

export var None = 0;
export var Error = 1;
export var Warn = 2;
export var Info = 3;
export var Debug = 4;

export interface LoggerInterface {
  level: (_: number) => number | LoggerInterface;
  warn(...args: any[]): LoggerInterface;
  info(...args: any[]): LoggerInterface;
  debug(...args: any[]): LoggerInterface;
}

export default function(_: number, method: Method) {
  var level = _ || None;
  return {
    level: function(this: LoggerInterface, _: number): number | LoggerInterface {
      if (arguments.length) {
        level = +_;
        return this;
      } else {
        return level;
      }
    },
    error: function(this: LoggerInterface): LoggerInterface {
      if (level >= Error) log(method || 'error', 'ERROR', arguments);
      return this;
    },
    warn: function(this: LoggerInterface): LoggerInterface {
      if (level >= Warn) log(method || 'warn', 'WARN', arguments);
      return this;
    },
    info: function(this: LoggerInterface) {
      if (level >= Info) log(method || 'log', 'INFO', arguments);
      return this;
    },
    debug: function(this: LoggerInterface) {
      if (level >= Debug) log(method || 'log', 'DEBUG', arguments);
      return this;
    },
  } as LoggerInterface;
}
