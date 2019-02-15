export default function<F extends (evt: Event | undefined | null) => void>(delay: number, handler: F): F {
  var tid: NodeJS.Timeout | null, evt: Event | undefined | null;

  function callback() {
    handler(evt);
    tid = evt = null;
  }

  return function(e?: Event) {
    evt = e;
    if (tid) clearTimeout(tid);
    tid = setTimeout(callback, delay);
  } as any;  // TODO: remove any
}
