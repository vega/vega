describe('Hierarchy', function() {

  var EPSILON = 1e-8;

  var values = [
    {a: 'a', b: 1, c: (2/3)-0.5},
    {a: 'b', b: 2, c: (2/3)},
    {a: 'a', b: 3, c: (1/3)},
    {a: 'b', b: 4, c: (1/3)+0.5}
  ];

  function spec() {
    return {
      data: [{
        name: "table",
        values: values,
        transform: [
          {type: 'treeify', groupby: ['a']},
          {type: 'hierarchy', size: [1,1]}
        ]
      }]
    };
  }

  it('should perform hierarchy layout', function(done) {
    parseSpec(spec(),
      function(model) {
        var ds = model.data('table'),
            data = ds.values();

        data.forEach(function(d) {
          if (!d.b) return;
          expect(d.layout_y).to.equal(1);
          expect(d.layout_x).closeTo(d.c, EPSILON);
        });

        done();
      },
      modelFactory);
  });

  it('should validate against the schema', function() {
    var schema = schemaPath(transforms.hierarchy.schema),
        validate = validator(schema);

    expect(validate({ "type": "hierarchy" })).to.be.true;
    expect(validate({ "type": "hierarchy", "field": "field" })).to.be.true;
    expect(validate({ "type": "hierarchy", "field": {"signal": "field"} })).to.be.true;
    expect(validate({ "type": "hierarchy", "sort": ["field"] })).to.be.true;
    expect(validate({ "type": "hierarchy", "sort": {"signal": "field"} })).to.be.true;
    expect(validate({ "type": "hierarchy", "children": "field" })).to.be.true;
    expect(validate({ "type": "hierarchy", "children": {"signal": "field"} })).to.be.true;
    expect(validate({ "type": "hierarchy", "size": [500, 300] })).to.be.true;
    expect(validate({ "type": "hierarchy", "size": [{"signal": "w"}, {"signal": "h"}] })).to.be.true;
    expect(validate({ "type": "hierarchy", "size": {"signal": "size"} })).to.be.true;
    expect(validate({ "type": "hierarchy", "nodesize": [500, 300] })).to.be.true;
    expect(validate({ "type": "hierarchy", "nodesize": [{"signal": "w"}, {"signal": "h"}] })).to.be.true;
    expect(validate({ "type": "hierarchy", "nodesize": {"signal": "nodesize"} })).to.be.true;
    expect(validate({ "type": "hierarchy", "mode": "tidy" })).to.be.true;
    expect(validate({ "type": "hierarchy", "mode": "cluster" })).to.be.true;
    expect(validate({ "type": "hierarchy", "mode": "partition" })).to.be.true;
    expect(validate({ "type": "hierarchy", "mode": {"signal": "mode"} })).to.be.true;
    expect(validate({ "type": "hierarchy", "orient": "cartesian" })).to.be.true;
    expect(validate({ "type": "hierarchy", "orient": "radial" })).to.be.true;
    expect(validate({ "type": "hierarchy", "orient": {"signal": "orient"} })).to.be.true;
    expect(validate({ "type": "hierarchy", "output": {"x": "x"} })).to.be.true;
    expect(validate({ "type": "hierarchy", "output": {"y": "y"} })).to.be.true;
    expect(validate({ "type": "hierarchy", "output": {"width": "w"} })).to.be.true;
    expect(validate({ "type": "hierarchy", "output": {"height": "h"} })).to.be.true;
    expect(validate({ "type": "hierarchy", "output": {"depth": "d"} })).to.be.true;

    expect(validate({ "type": "foo" })).to.be.false;
    expect(validate({ "type": "hierarchy", "field": 1 })).to.be.false;
    expect(validate({ "type": "hierarchy", "sort": 2 })).to.be.false;
    expect(validate({ "type": "hierarchy", "sort": [2] })).to.be.false;
    expect(validate({ "type": "hierarchy", "children": 3 })).to.be.false;
    expect(validate({ "type": "hierarchy", "size": 4 })).to.be.false;
    expect(validate({ "type": "hierarchy", "size": "foo" })).to.be.false;
    expect(validate({ "type": "hierarchy", "nodesize": 4 })).to.be.false;
    expect(validate({ "type": "hierarchy", "nodesize": "foo" })).to.be.false;
    expect(validate({ "type": "hierarchy", "mode": 5 })).to.be.false;
    expect(validate({ "type": "hierarchy", "mode": "yes" })).to.be.false;
    expect(validate({ "type": "hierarchy", "orient": 6 })).to.be.false;
    expect(validate({ "type": "hierarchy", "orient": "yes" })).to.be.false;
    expect(validate({ "type": "hierarchy", "output": {"foo": "bar"} })).to.be.false;
    expect(validate({ "type": "hierarchy", "foo": "bar" })).to.be.false;
  });
});
