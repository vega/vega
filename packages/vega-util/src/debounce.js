export default function (delay, handler) {
  let tid;
  let evt;

  function callback() {
    handler(evt);
    tid = evt = null;
  }

  return function (e) {
    evt = e;
    if (tid) clearTimeout(tid);
    tid = setTimeout(callback, delay);
  };
}
