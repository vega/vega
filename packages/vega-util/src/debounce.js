export default function(delay, handler) {
  let tid;

  return e => {
    if (tid) clearTimeout(tid);
    tid = setTimeout(
      () => (handler(e), tid = null),
      delay
    );
  };
}
