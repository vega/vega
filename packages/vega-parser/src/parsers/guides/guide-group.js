import {GroupMark} from '../marks/marktypes';

export default function(role, name, dataRef, interactive, encode, marks) {
  return {
    type: GroupMark,
    name: name,
    role: role,
    from: dataRef,
    interactive: interactive,
    encode: encode,
    marks: marks
  };
}
