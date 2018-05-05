import {GroupMark} from '../marks/marktypes';

export default function(role, style, name, dataRef, interactive, encode, marks, layout) {
  return {
    type: GroupMark,
    name: name,
    role: role,
    style: style,
    from: dataRef,
    interactive: interactive || false,
    encode: encode,
    marks: marks,
    layout: layout
  };
}
