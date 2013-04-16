vg.parse.marks = function(spec, width, height) {
  return {
    type: "group",
    width: width,
    height: height,
    axes: spec.axes || [],
    scales: spec.scales || [],
    marks: (spec.marks || []).map(vg.parse.mark)
  };
};