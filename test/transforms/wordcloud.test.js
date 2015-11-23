describe('Wordcloud', function() {

  var values = [
    {w: 'a', v: 10, r:-45},
    {w: 'b', v: 20, r:+0},
    {w: 'c', v: 30, r:+45}
  ];

  var spec = {
    data: [{
      name: "table",
      values: values,
      transform: [{
        type: 'wordcloud',
        text: 'w',
        fontSize: 'v',
        fontScale: [10, 100]
      }]
    }]
  };

  it('should layout wordcloud', function(done) {
    var s = dl.duplicate(spec);
    s.data[0].transform[0].fontScale = null;

    parseSpec(s, modelFactory, function(error, model) {
      var data = model.data('table').values();
      expect(data.length).to.equal(3);
      expect(data[0].w).to.equal('a');
      expect(data[1].w).to.equal('b');
      expect(data[2].w).to.equal('c');
      expect(data[0].layout_fontSize).to.equal(10);
      expect(data[1].layout_fontSize).to.equal(20);
      expect(data[2].layout_fontSize).to.equal(30);
      expect(data[0].layout_rotate).to.equal(0);
      expect(data[1].layout_rotate).to.equal(0);
      expect(data[2].layout_rotate).to.equal(0);
      expect(data[0].layout_x).to.be.defined;
      expect(data[1].layout_x).to.be.defined;
      expect(data[2].layout_x).to.be.defined;
      expect(data[0].layout_y).to.be.defined;
      expect(data[1].layout_y).to.be.defined;
      expect(data[2].layout_y).to.be.defined;

      done();
    });
  });

  it('should layout scaled wordcloud', function(done) {
    var s = dl.duplicate(spec);
    s.data[0].transform[0].rotate = 'r';
    parseSpec(s, modelFactory, function(error, model) {
      var data = model.data('table').values();
      expect(data.length).to.equal(3);
      expect(data[0].w).to.equal('a');
      expect(data[1].w).to.equal('b');
      expect(data[2].w).to.equal('c');
      expect(data[0].layout_fontSize).to.equal(10);
      expect(data[1].layout_fontSize).to.equal(60);
      expect(data[2].layout_fontSize).to.equal(100);
      expect(data[0].layout_rotate).to.equal(-45);
      expect(data[1].layout_rotate).to.equal(0);
      expect(data[2].layout_rotate).to.equal(+45);
      expect(data[0].layout_x).to.be.defined;
      expect(data[1].layout_x).to.be.defined;
      expect(data[2].layout_x).to.be.defined;
      expect(data[0].layout_y).to.be.defined;
      expect(data[1].layout_y).to.be.defined;
      expect(data[2].layout_y).to.be.defined;

      done();
    });
  });

  it('should validate against the schema', function() {
    var schema = schemaPath(transforms.wordcloud.schema),
        validate = validator(schema);

    expect(validate({ "type": "wordcloud" })).to.be.true;
    expect(validate({ "type": "wordcloud", "size": [800, 400] })).to.be.true;
    expect(validate({ "type": "wordcloud", "size": {"signal": "size"} })).to.be.true;
    expect(validate({ "type": "wordcloud", "size": [{"signal": "width"}, {"signal": "height"}] })).to.be.true;
    expect(validate({ "type": "wordcloud", "font": "Helvetica" })).to.be.true;
    expect(validate({ "type": "wordcloud", "font": {"signal": "font"} })).to.be.true;
    expect(validate({ "type": "wordcloud", "fontStyle": "italic" })).to.be.true;
    expect(validate({ "type": "wordcloud", "fontStyle": {"signal": "style"} })).to.be.true;
    expect(validate({ "type": "wordcloud", "fontWeight": "bold" })).to.be.true;
    expect(validate({ "type": "wordcloud", "fontWeight": {"signal": "weight"} })).to.be.true;
    expect(validate({ "type": "wordcloud", "fontSize": 12 })).to.be.true;
    expect(validate({ "type": "wordcloud", "fontSize": {"signal": "size"} })).to.be.true;
    expect(validate({ "type": "wordcloud", "fontScale": [10, 100] })).to.be.true;
    expect(validate({ "type": "wordcloud", "fontScale": [{"signal": "lo"}, {"signal": "hi"}] })).to.be.true;
    expect(validate({ "type": "wordcloud", "fontScale": null })).to.be.true;
    expect(validate({ "type": "wordcloud", "rotate": 90 })).to.be.true;
    expect(validate({ "type": "wordcloud", "rotate": "field" })).to.be.true;
    expect(validate({ "type": "wordcloud", "rotate": {"signal": "rotate"} })).to.be.true;
    expect(validate({ "type": "wordcloud", "text": "field" })).to.be.true;
    expect(validate({ "type": "wordcloud", "text": {"signal": "text"} })).to.be.true;
    expect(validate({ "type": "wordcloud", "spiral": "archimedean" })).to.be.true;
    expect(validate({ "type": "wordcloud", "spiral": "rectangular" })).to.be.true;
    expect(validate({ "type": "wordcloud", "spiral": {"signal": "spiral"} })).to.be.true;
    expect(validate({ "type": "wordcloud", "padding": 1 })).to.be.true;
    expect(validate({ "type": "wordcloud", "padding": {"signal": "padding"} })).to.be.true;
    expect(validate({ "type": "wordcloud", "output": {"x": "x"} })).to.be.true;
    expect(validate({ "type": "wordcloud", "output": {"y": "y"} })).to.be.true;
    expect(validate({ "type": "wordcloud", "output": {"font": "font"} })).to.be.true;
    expect(validate({ "type": "wordcloud", "output": {"fontSize": "size"} })).to.be.true;
    expect(validate({ "type": "wordcloud", "output": {"fontStyle": "style"} })).to.be.true;
    expect(validate({ "type": "wordcloud", "output": {"fontWeight": "weight"} })).to.be.true;
    expect(validate({ "type": "wordcloud", "output": {"rotate": "rotate"} })).to.be.true;

    expect(validate({ "type": "foo" })).to.be.false;
    expect(validate({ "type": "wordcloud", "size": 1 })).to.be.false;
    expect(validate({ "type": "wordcloud", "font": 2 })).to.be.false;
    expect(validate({ "type": "wordcloud", "fontStyle": 2 })).to.be.false;
    expect(validate({ "type": "wordcloud", "fontWeight": 3 })).to.be.false;
    expect(validate({ "type": "wordcloud", "fontScale": 4 })).to.be.false;
    expect(validate({ "type": "wordcloud", "fontScale": {"signal": "scale"} })).to.be.false;
    expect(validate({ "type": "wordcloud", "rotate": {} })).to.be.false;
    expect(validate({ "type": "wordcloud", "text": 5 })).to.be.false;
    expect(validate({ "type": "wordcloud", "spiral": 6 })).to.be.false;
    expect(validate({ "type": "wordcloud", "spiral": "foo" })).to.be.false;
    expect(validate({ "type": "wordcloud", "padding": "foo" })).to.be.false;
    expect(validate({ "type": "wordcloud", "output": {"foo": "bar"} })).to.be.false;
    expect(validate({ "type": "wordcloud", "foo": "bar" })).to.be.false;
  });

});
