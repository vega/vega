import Item from './Item.js';
import {inherits} from 'vega-util';

export default function GroupItem(mark) {
  Item.call(this, mark);
  this.items = (this.items || []);
}

inherits(GroupItem, Item);
