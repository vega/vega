export default function(view, r, el, constructor) {
  r = r || new constructor(view._loadConfig);
  return r
    .initialize(el, view.width(), view.height(), view.padding())
    .background(view._backgroundColor);
}
