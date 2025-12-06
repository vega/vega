type LogMethod = 'log' | 'warn' | 'error';

type LogHandler = (method: LogMethod, level: string, args: IArguments) => void;

function log(method: LogMethod, level: string, input: IArguments): void {
  const args = [level].concat([].slice.call(input));
  console[method].apply(console, args); // eslint-disable-line no-console
}

export const None  = 0;
export const Error = 1;
export const Warn  = 2;
export const Info  = 3;
export const Debug = 4;

export interface Logger {
  level(): number;
  level(level: number): this;
  error(...args: any[]): this;
  warn(...args: any[]): this;
  info(...args: any[]): this;
  debug(...args: any[]): this;
}

export default function logger(_?: number, method?: LogMethod, handler: LogHandler = log): Logger {
  let level = _ || None;
  return {
    level(_?: number): any {
      if (arguments.length) {
        level = +_!;
        return this;
      } else {
        return level;
      }
    },
    error(): Logger {
      if (level >= Error) handler(method || 'error', 'ERROR', arguments);
      return this;
    },
    warn(): Logger {
      if (level >= Warn) handler(method || 'warn', 'WARN', arguments);
      return this;
    },
    info(): Logger {
      if (level >= Info) handler(method || 'log', 'INFO', arguments);
      return this;
    },
    debug(): Logger {
      if (level >= Debug) handler(method || 'log', 'DEBUG', arguments);
      return this;
    }
  };
}
