describe('CountPattern', function() {

  var values = [
    {t: 'a b c d e f g h i j k'},
    {t: 'a a a b b z'}
  ];

  var spec1 = {
    data: [{
      name: "table",
      values: values,
      transform: [{
        type: 'countpattern',
        field: 't',
        pattern: '\\w+',
        stopwords: '[cdefghijk]+'
      }]
    }]
  };

  var spec2 = {
    data: [{
      name: "table",
      values: values,
      transform: [{
        type: 'countpattern',
        field: 't',
        pattern: ' ',
        stopwords: ''
      }]
    }]
  };

  it('should count patterns', function(done) {
    parseSpec(spec1, modelFactory, function(error, model) {
      var data = model.data('table').values().sort(dl.comparator('-count'));
      expect(data.length).to.equal(3);
      expect(data[0].text).to.equal('a');
      expect(data[1].text).to.equal('b');
      expect(data[2].text).to.equal('z');
      expect(data[0].count).to.equal(4);
      expect(data[1].count).to.equal(3);
      expect(data[2].count).to.equal(1);

      parseSpec(spec2, modelFactory, function(error, model) {
        var data = model.data('table').values().sort(dl.comparator('-count'));
        expect(data.length).to.equal(1);
        expect(data[0].text).to.equal(' ');
        expect(data[0].count).to.equal(15);
        done();
      });

    });
  });

  it('should validate against the schema', function() {
    var schema = schemaPath(transforms.countpattern.schema),
        validate = validator(schema);

    expect(validate({ "type": "countpattern" })).to.be.true;
    expect(validate({ "type": "countpattern", "field": "t" })).to.be.true;
    expect(validate({ "type": "countpattern", "field": {"signal": "field"} })).to.be.true;
    expect(validate({ "type": "countpattern", "pattern": "." })).to.be.true;
    expect(validate({ "type": "countpattern", "pattern": {"signal": "pattern"} })).to.be.true;
    expect(validate({ "type": "countpattern", "case": "lower" })).to.be.true;
    expect(validate({ "type": "countpattern", "case": "upper" })).to.be.true;
    expect(validate({ "type": "countpattern", "case": "none" })).to.be.true;
    expect(validate({ "type": "countpattern", "case": {"signal": "case"} })).to.be.true;
    expect(validate({ "type": "countpattern", "stopwords": "(foo|bar|baz)" })).to.be.true;
    expect(validate({ "type": "countpattern", "stopwords": {"signal": "stop"} })).to.be.true;
    expect(validate({ "type": "countpattern", "output": {"text": "text"} })).to.be.true;
    expect(validate({ "type": "countpattern", "output": {"count": "count"} })).to.be.true;

    expect(validate({ "type": "foo" })).to.be.false;
    expect(validate({ "type": "countpattern", "field": 1 })).to.be.false;
    expect(validate({ "type": "countpattern", "pattern": 2 })).to.be.false;
    expect(validate({ "type": "countpattern", "case": 3 })).to.be.false;
    expect(validate({ "type": "countpattern", "case": "caps" })).to.be.false;
    expect(validate({ "type": "countpattern", "stopwords": 4 })).to.be.false;
    expect(validate({ "type": "countpattern", "output": {"foo": "bar"} })).to.be.false;
    expect(validate({ "type": "countpattern", "foo": "bar" })).to.be.false;
  });

});
