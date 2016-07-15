export default function(spec, config, dataRef, marks) {
  return {
    type: 'group',
    role: 'axis',
    from: dataRef,
    interactive: false,
    marks: marks
  };
}
