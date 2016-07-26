export default function(role, dataRef, interactive, encode, marks) {
  return {
    type: 'group',
    role: role,
    from: dataRef,
    interactive: interactive,
    encode: encode,
    marks: marks
  };
}
