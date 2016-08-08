import {GroupMark} from '../marks/marktypes';

export default function(role, dataRef, interactive, encode, marks) {
  return {
    type: GroupMark,
    role: role,
    from: dataRef,
    interactive: interactive,
    encode: encode,
    marks: marks
  };
}
