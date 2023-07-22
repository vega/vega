function domCanvas(w, h) {
  if (typeof document !== 'undefined' && document.createElement) {
    const c = document.createElement('canvas');
    if (c && c.getContext) {
      c.width = w;
      c.height = h;
      return c;
    }
  }
  return null;
}
const domImage = () => typeof Image !== 'undefined' ? Image : null;

export { domCanvas as canvas, domCanvas, domImage as image };
