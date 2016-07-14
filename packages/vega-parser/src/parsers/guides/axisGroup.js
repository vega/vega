export default function(spec, config, dataRef, marks) {
  return {
    type: 'group',
    role: 'axis',
    interactive: false,
    from: dataRef,
    marks: marks
  };
}
