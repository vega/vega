function log(method: 'log' | 'error' | 'warn', level: Level, input: IArguments): void {
  var args = [level].concat([].slice.call(input)) as any;
  console[method].apply(console, args);
}

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

export default function(_: number) {
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
      if (level >= Error) log('error', 'ERROR', arguments);
      return this;
    },
    warn: function(this: LoggerInterface): LoggerInterface {
      if (level >= Warn) log('warn', 'WARN', arguments);
      return this;
    },
    info: function(this: LoggerInterface) {
      if (level >= Info) log('log', 'INFO', arguments);
      return this;
    },
    debug: function(this: LoggerInterface) {
      if (level >= Debug) log('log', 'DEBUG', arguments);
      return this;
    },
  } as LoggerInterface;
}
