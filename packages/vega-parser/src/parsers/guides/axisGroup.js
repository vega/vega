export default function(spec, config, dataRef, encode, marks) {
  return {
    type: 'group',
    role: 'axis',
    from: dataRef,
    interactive: false,
    encode: encode,
    marks: marks
  };
}
