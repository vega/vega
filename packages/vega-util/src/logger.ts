type LogMethod = 'log' | 'warn' | 'error';

type LogHandler = (method: LogMethod, level: string, args: unknown[]) => void;

function log(method: LogMethod, level: string, input: unknown[]): void {
  const args = [level, ...input];
  console[method](...args); // eslint-disable-line no-console
}

export const None  = 0;
export const Error = 1;
export const Warn  = 2;
export const Info  = 3;
export const Debug = 4;

export interface Logger {
  level(level?: number): number | this;
  error(...args: unknown[]): this;
  warn(...args: unknown[]): this;
  info(...args: unknown[]): this;
  debug(...args: unknown[]): this;
}

export default function logger(_?: number, method?: LogMethod, handler: LogHandler = log): Logger {
  let level = _ || None;
  return {
    level(_?: number) {
      if (arguments.length) {
        level = +_!;
        return this;
      } else {
        return level;
      }
    },
    error(...args: unknown[]) {
      if (level >= Error) handler(method || 'error', 'ERROR', args);
      return this;
    },
    warn(...args: unknown[]) {
      if (level >= Warn) handler(method || 'warn', 'WARN', args);
      return this;
    },
    info(...args: unknown[]) {
      if (level >= Info) handler(method || 'log', 'INFO', args);
      return this;
    },
    debug(...args: unknown[]) {
      if (level >= Debug) handler(method || 'log', 'DEBUG', args);
      return this;
    }
  };
}
