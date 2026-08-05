import {GroupMark} from '../marks/marktypes.js';

export default function(mark) {
  mark.type = GroupMark;
  mark.interactive = mark.interactive || false;
  return mark;
}
