import {isFunction} from 'vega-util';

const DEFAULT_BUDGET = 10;

const now = typeof performance !== 'undefined' && performance.now
  ? () => performance.now()
  : () => Date.now();

export default function scheduler(scheduling, budget = DEFAULT_BUDGET) {
  if (!scheduling) return null;

  const signal = (scheduling === true ? null : scheduling.signal) || null,
        pause = isFunction(globalThis.scheduler?.yield)
          ? () => globalThis.scheduler.yield()
          : () => new Promise(resolve => setTimeout(resolve, 0));

  let deadline = 0,
      cancelled = false,
      cancelReason = null;

  return {
    signal,

    cancel(reason) {
      if (!cancelled) {
        cancelled = true;
        cancelReason = reason || new Error('View scheduling cancelled');
      }
    },

    reset() {
      deadline = now() + budget;
      cancelled = false;
    },

    shouldYield() {
      return cancelled || (signal != null && signal.aborted) || now() > deadline;
    },

    async yield() {
      if (cancelled) throw cancelReason;
      if (signal) signal.throwIfAborted();
      await pause();
      if (cancelled) throw cancelReason;
      if (signal) signal.throwIfAborted();
      deadline = now() + budget;
    },

    didAbort(error) {
      return (cancelReason !== null && error === cancelReason)
        || (signal != null && signal.aborted && error === signal.reason);
    }
  };
}
