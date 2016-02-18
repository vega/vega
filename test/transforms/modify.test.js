describe('Modify Transforms', function() {
  it('should clear', function(done) {
    var spec = {
      "signals": [{"name": "clear", "init": false}],

      "data": [{
        "name": "table",
        "values": [1, 2, 3, 4],
        "modify": [{"type": "clear", "test": "clear"}]
      }]
    };

    parseSpec(spec, modelFactory, function(error, model) {
      var ds = model.data('table');
      expect(ds._data).to.have.length(4);
      expect(ds.values()).to.have.length(4);

      model.signal('clear').value(true).fire();
      expect(ds._data).to.have.length(0);
      expect(ds.values()).to.have.length(0);

      ds.insert([5, 6, 7, 8]).fire();
      expect(ds._data).to.have.length(0);
      expect(ds.values()).to.have.length(0);

      ds.insert([5, 6, 7, 8]);
      model.signal('clear').value(false).fire();
      expect(ds._data).to.have.length(4);
      expect(ds.values()).to.have.length(4);

      done();
    });
  });

  it('should insert', function(done) {
    var spec = {
      "signals": [{"name": "A", "init": 1}, {"name": "B", "init": 2}],
      "data": [{
        "name": "table",
        "values": [0],
        "modify": [
          {"type": "insert", "signal": "A"},
          {"type": "insert", "signal": "B", "field": "foobar"}
        ]
      }]
    };

    parseSpec(spec, modelFactory, function(error, model) {
      var ds = model.data('table'),
          vals = ds.values();

      expect(vals).to.have.length(1);
      expect(vals[0].data).to.equal(0);

      model.signal('A').value(2).fire();
      vals = ds.values();
      expect(vals).to.have.length(2);
      expect(vals[0].data).to.equal(0);
      expect(vals[1].data).to.equal(2);

      model.signal('B').value(3).fire();
      vals = ds.values();
      expect(vals).to.have.length(3);
      expect(vals[0].data).to.equal(0);
      expect(vals[1].data).to.equal(2);
      expect(vals[2].foobar).to.equal(3);

      model.signal('A').value({hello: 'world'}).fire();
      vals = ds.values();
      expect(vals).to.have.length(4);
      expect(vals[0].data).to.equal(0);
      expect(vals[1].data).to.equal(2);
      expect(vals[2].foobar).to.equal(3);
      expect(vals[3]).to.have.property('hello', 'world');

      done();
    });
  });

  it('should toggle values', function(done) {
    var spec = {
      "signals": [{"name": "toggle", "init": 1, "verbose": true}],
      "data": [{
        "name": "table",
        "values": [0],
        "modify": [
          {"type": "toggle", "signal": "toggle", "field": "data"}
        ]
      }]
    };

    parseSpec(spec, modelFactory, function(error, model) {
      var ds = model.data('table'),
          vals = ds.values();

      expect(vals).to.have.length(1);
      expect(vals[0].data).to.equal(0);

      model.signal('toggle').value(2).fire();
      vals = ds.values();
      expect(vals).to.have.length(2);
      expect(vals[0].data).to.equal(0);
      expect(vals[1].data).to.equal(2);

      model.signal('toggle').value(2).fire();
      vals = ds.values();
      expect(vals).to.have.length(1);
      expect(vals[0].data).to.equal(0);

      model.signal('toggle').value(0).fire();
      vals = ds.values();
      expect(vals).to.have.length(0);

      model.signal('toggle').value(5).fire();
      vals = ds.values();
      expect(vals).to.have.length(1);
      expect(vals[0].data).to.equal(5);

      done();
    });
  });

  it('should toggle objects', function(done) {
    var spec = {
      "signals": [{"name": "toggle", "init": {"id": 1, "species": "setosa"}}],
      "data": [{
        "name": "table",
        "values": [],
        "modify": [
          {"type": "toggle", "signal": "toggle"}
        ]
      }]
    };

    parseSpec(spec, modelFactory, function(error, model) {
      var ds = model.data('table'),
          vals = ds.values();

      expect(vals).to.have.length(0);

      model.signal('toggle').value({id: 2, 'species': 'versicolor'}).fire();
      vals = ds.values();
      expect(vals).to.have.length(1);
      expect(vals[0]).to.have.property('id', 2);
      expect(vals[0]).to.have.property('species', 'versicolor');

      model.signal('toggle').value({id: 2, 'species': 'versicolor'}).fire();
      vals = ds.values();
      expect(vals).to.have.length(0);

      done();
    });
  });

  it('should clear+toggle', function(done) {
    var spec = {
      "signals": [
        {"name": "clear", "init": false},
        {"name": "toggle", "init": 5},
      ],
      "data": [{
        "name": "table",
        "values": [0],
        "modify": [
          {"type": "clear", "test": "clear"},
          {"type": "toggle", "signal": "toggle", "field": "data"}
        ]
      }]
    };

    parseSpec(spec, modelFactory, function(error, model) {
      var ds = model.data('table'),
          vals = ds.values();

      expect(vals).to.have.length(1);
      expect(vals[0].data).to.equal(0);

      model.signal('toggle').value(2).fire();
      vals = ds.values();
      expect(vals).to.have.length(2);
      expect(vals[0].data).to.equal(0);
      expect(vals[1].data).to.equal(2);

      model.signal('toggle').value(2).fire();
      vals = ds.values();
      expect(vals).to.have.length(1);
      expect(vals[0].data).to.equal(0);

      model.signal('toggle').value(0).fire();
      vals = ds.values();
      expect(vals).to.have.length(0);

      model.signal('toggle').value(5).fire();
      vals = ds.values();
      expect(vals).to.have.length(1);
      expect(vals[0].data).to.equal(5);

      model.signal('clear').value(true);
      model.signal('toggle').value(2).fire();
      vals = ds.values();
      expect(vals).to.have.length(1);
      expect(vals[0].data).to.equal(2);

      model.signal('toggle').value(2).fire();
      vals = ds.values();
      expect(vals).to.have.length(1);
      expect(vals[0].data).to.equal(2);

      done();
    });
  });
});