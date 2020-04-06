export default function (view, fn) {
  return !fn
    ? null
    : function (...args) {
        try {
          fn.apply(this, args);
        } catch (error) {
          view.error(error);
        }
      };
}
