import {Group} from '../marks/marktypes';

export default function(role, dataRef, interactive, encode, marks) {
  return {
    type: Group,
    role: role,
    from: dataRef,
    interactive: interactive,
    encode: encode,
    marks: marks
  };
}
