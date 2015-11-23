describe('Treeify', function() {

  var values = [
    {a: 'a', b: 1},
    {a: 'b', b: 2},
    {a: 'a', b: 3},
    {a: 'b', b: 4}
  ];

  function spec() {
    return {
      data: [{
        name: "table",
        values: values,
        transform: [{type: 'treeify', groupby: ['a']}]
      }]
    };
  }

  it('should treeify a table', function(done) {
    parseSpec(spec(), modelFactory,
      function(error, model) {
        var ds = model.data('table'),
            data = ds.values(),
            root = data.filter(function(d) { return d.parent==null; });

        expect(data).to.have.length(7);
        expect(root).to.have.length(1);
        expect(root[0].children).to.have.length(2);
        expect(root[0].children[0].children).to.have.length(2);
        expect(root[0].children[1].children).to.have.length(2);

        done();
      });
  });

  it('should validate against the schema', function() {
    var schema = schemaPath(transforms.treeify.schema),
        validate = validator(schema);

    expect(validate({ "type": "treeify", "groupby": ["a"] })).to.be.true;
    expect(validate({ "type": "treeify", "groupby": ["a", "b"] })).to.be.true;

    expect(validate({ "type": "foo" })).to.be.false;
    expect(validate({ "type": "treeify" })).to.be.false;
    expect(validate({ "type": "treeify", "output": {"foo": "bar"} })).to.be.false;
    expect(validate({ "type": "treeify", "foo": "bar" })).to.be.false;
  });

});