export default function runAsyncCatch(view, encode, prerun, postrun) {
  const p = view.runAsync(encode, prerun, postrun);
  if (view._scheduler) p.catch(error => view.error(error));
  return p;
}
