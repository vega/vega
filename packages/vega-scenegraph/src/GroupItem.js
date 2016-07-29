import Item from './item';
import inherits from './util/inherits';

export default function GroupItem(mark) {
  Item.call(this, mark);
  this.items = (this.items || []);
}

inherits(GroupItem, Item);
