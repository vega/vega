describe('Treemap', function() {

  it('should perform treemap layout');

  it('should validate against the schema', function() {
    var schema = schemaPath(transforms.treemap.schema),
        validate = validator(schema);

    expect(validate({ "type": "treemap" })).to.be.true;
    expect(validate({ "type": "treemap", "field": "field" })).to.be.true;
    expect(validate({ "type": "treemap", "field": {"signal": "field"} })).to.be.true;
    expect(validate({ "type": "treemap", "sort": ["field"] })).to.be.true;
    expect(validate({ "type": "treemap", "sort": {"signal": "field"} })).to.be.true;
    expect(validate({ "type": "treemap", "children": "field" })).to.be.true;
    expect(validate({ "type": "treemap", "children": {"signal": "field"} })).to.be.true;
    expect(validate({ "type": "treemap", "size": [500, 300] })).to.be.true;
    expect(validate({ "type": "treemap", "size": [{"signal": "w"}, {"signal": "h"}] })).to.be.true;
    expect(validate({ "type": "treemap", "size": {"signal": "size"} })).to.be.true;
    expect(validate({ "type": "treemap", "round": true })).to.be.true;
    expect(validate({ "type": "treemap", "round": false })).to.be.true;
    expect(validate({ "type": "treemap", "round": {"signal": "round"} })).to.be.true;
    expect(validate({ "type": "treemap", "sticky": true })).to.be.true;
    expect(validate({ "type": "treemap", "sticky": false })).to.be.true;
    expect(validate({ "type": "treemap", "sticky": {"signal": "sticky"} })).to.be.true;
    expect(validate({ "type": "treemap", "ratio": 1 })).to.be.true;
    expect(validate({ "type": "treemap", "ratio": {"signal": "ratio"} })).to.be.true;
    expect(validate({ "type": "treemap", "padding": 1 })).to.be.true;
    expect(validate({ "type": "treemap", "padding": [1,1,1,1] })).to.be.true;
    expect(validate({ "type": "treemap", "padding": [{"signal":"pad"},1,1,1] })).to.be.true;
    expect(validate({ "type": "treemap", "padding": {"signal": "pad"} })).to.be.true;
    expect(validate({ "type": "treemap", "output": {"x": "x"} })).to.be.true;
    expect(validate({ "type": "treemap", "output": {"y": "y"} })).to.be.true;
    expect(validate({ "type": "treemap", "output": {"width": "w"} })).to.be.true;
    expect(validate({ "type": "treemap", "output": {"height": "h"} })).to.be.true;
    expect(validate({ "type": "treemap", "output": {"depth": "d"} })).to.be.true;
    
    expect(validate({ "type": "foo" })).to.be.false;
    expect(validate({ "type": "treemap", "field": 1 })).to.be.false;
    expect(validate({ "type": "treemap", "sort": 2 })).to.be.false;
    expect(validate({ "type": "treemap", "sort": [2] })).to.be.false;
    expect(validate({ "type": "treemap", "children": 3 })).to.be.false;
    expect(validate({ "type": "treemap", "size": 4 })).to.be.false;
    expect(validate({ "type": "treemap", "size": "foo" })).to.be.false;
    expect(validate({ "type": "treemap", "round": 5 })).to.be.false;
    expect(validate({ "type": "treemap", "round": "yes" })).to.be.false;
    expect(validate({ "type": "treemap", "sticky": 6 })).to.be.false;
    expect(validate({ "type": "treemap", "sticky": "yes" })).to.be.false;
    expect(validate({ "type": "treemap", "ratio": "foo" })).to.be.false;
    expect(validate({ "type": "treemap", "padding": "foo" })).to.be.false;
    expect(validate({ "type": "treemap", "padding": ["foo",1,1,1] })).to.be.false;
    expect(validate({ "type": "treemap", "output": {"foo": "bar"} })).to.be.false;
    expect(validate({ "type": "treemap", "foo": "bar" })).to.be.false;
  });
});
