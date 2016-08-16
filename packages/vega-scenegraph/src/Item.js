import Bounds from './Bounds';

export default function Item(mark) {
  this.mark = mark;
  this.bounds = (this.bounds || new Bounds());
  this.bounds_prev = (this.bounds_prev || new Bounds());
}
