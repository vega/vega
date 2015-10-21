describe('Impute', function() {

  var values = [
    {a: 1, b: 1, c: 1},
    {a: 1, b: 2, c: 3},
    {a: 1, b: 4, c: 5},
    {a: 2, b: 1, c: 2},
    {a: 2, b: 3, c: 5},
    {a: 2, b: 4, c: 11}
  ];
  
  function spec(opt) {
    var impute = {
      type: 'impute',
      groupby: ['a'],
      orderby: ['b'],
      field:   'c',
      method:  opt.method,
      value:   opt.value
    };
    
    return {
      data: [{
        name: "table",
        values: values,
        transform: [impute]
      }]
    };
  }

  function imputed(d) {
    return d._imputed;
  };

  it('should impute values', function(done) {
    parseSpec(spec({method: 'value', value: -1}),
      function(model) {
        var ds = model.data('table'),
            data = ds.values().filter(imputed);

        expect(data).to.have.length(2);
        expect(data[0]).to.have.property('a', 1);
        expect(data[0]).to.have.property('b', 3);
        expect(data[0]).to.have.property('c', -1);
        expect(data[1]).to.have.property('a', 2);
        expect(data[1]).to.have.property('b', 2);
        expect(data[1]).to.have.property('c', -1);
        done();
      },
      modelFactory);
  });

  it('should impute mean', function(done) {
    parseSpec(spec({method: 'mean'}),
      function(model) {
        var ds = model.data('table'),
            data = ds.values().filter(imputed);

        expect(data).to.have.length(2);
        expect(data[0]).to.have.property('c', 3);
        expect(data[1]).to.have.property('c', 6);
        done();
      },
      modelFactory);
  });

  it('should impute median', function(done) {
    parseSpec(spec({method: 'median'}),
      function(model) {
        var ds = model.data('table'),
            data = ds.values().filter(imputed);

        expect(data).to.have.length(2);
        expect(data[0]).to.have.property('c', 3);
        expect(data[1]).to.have.property('c', 5);
        done();
      },
      modelFactory);
  });

  it('should impute min', function(done) {
    parseSpec(spec({method: 'min'}),
      function(model) {
        var ds = model.data('table'),
            data = ds.values().filter(imputed);

        expect(data).to.have.length(2);
        expect(data[0]).to.have.property('c', 1);
        expect(data[1]).to.have.property('c', 2);
        done();
      },
      modelFactory);
  });

  it('should impute max', function(done) {
    parseSpec(spec({method: 'max'}),
      function(model) {
        var ds = model.data('table'),
            data = ds.values().filter(imputed);

        expect(data).to.have.length(2);
        expect(data[0]).to.have.property('c', 5);
        expect(data[1]).to.have.property('c', 11);
        done();
      },
      modelFactory);
  });

  it('should validate against the schema', function() {
    var schema = schemaPath(transforms.impute.schema),
        validate = validator(schema);

    expect(validate({ "type": "impute", "groupby": ["a"], "orderby": ["b"], "field": "c" })).to.be.true;
    expect(validate({ "type": "impute", "groupby": ["a"], "orderby": ["b"], "field": "c", "value": 0 })).to.be.true;
    expect(validate({ "type": "impute", "groupby": ["a"], "orderby": ["b"], "field": "c", "method": "median" })).to.be.true;
    expect(validate({ "type": "impute", "groupby": ["a"], "orderby": ["b"], "field": "c", "method": "mean" })).to.be.true;
    expect(validate({ "type": "impute", "groupby": ["a"], "orderby": ["b"], "field": "c", "method": "min" })).to.be.true;
    expect(validate({ "type": "impute", "groupby": ["a"], "orderby": ["b"], "field": "c", "method": "max" })).to.be.true;
    expect(validate({ "type": "impute", "groupby": ["a"], "orderby": ["b"], "field": "c", "method": "value", "value": 5 })).to.be.true;
    expect(validate({ "type": "impute", "groupby": ["a"], "orderby": ["b"], "field": "c", "method": "value", "value": "na" })).to.be.true;
    expect(validate({ "type": "impute", "groupby": ["a"], "orderby": ["b"], "field": "c", "method": "value", "value": false })).to.be.true;
    
    expect(validate({ "type": "foo" })).to.be.false;
    expect(validate({ "type": "impute" })).to.be.false;    
    expect(validate({ "type": "impute", "groupby": ["a"] })).to.be.false;
    expect(validate({ "type": "impute", "groupby": ["a"], "orderby": "b" })).to.be.false;
    expect(validate({ "type": "impute", "groupby": ["a"], "orderby": ["b"] })).to.be.false;
    expect(validate({ "type": "impute", "groupby": "a", "orderby": ["b"], "field": "c" })).to.be.false;
    expect(validate({ "type": "impute", "groupby": ["a"], "orderby": "b", "field": "c" })).to.be.false;
    expect(validate({ "type": "impute", "groupby": ["a"], "orderby": ["b"], "field": "c", "method": "foo" })).to.be.false;
    expect(validate({ "type": "impute", "groupby": ["a"], "orderby": ["b"], "field": "c", "value": {} })).to.be.false;
  });
});
