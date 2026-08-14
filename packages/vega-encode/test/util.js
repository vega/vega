// a scheduler that yields at every opportunity, invoking probe() at each
// suspension point so tests can observe intermediate operator state
export function testScheduler(probe) {
  return {
    reset() {},
    shouldYield() { return true; },
    async yield() {
      probe();
      await new Promise(resolve => setTimeout(resolve, 0));
    },
    didAbort() { return false; }
  };
}
