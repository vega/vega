import Bounds from './Bounds';

export default function Item(mark) {
  this.mark = mark;
  this.bounds = (this.bounds || new Bounds());
  this['bounds:prev'] = (this['bounds:prev'] || new Bounds());
}
