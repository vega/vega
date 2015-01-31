describe.skip('Build', function() {
  it('should build singleton marks', function(done) {
    var spec = {
      "data": [],
      "marks": [{
        "type": "rect",
        "properties": {"enter": {
          "x": 0, "y": 0, "width": 10, "height": 10
        }}
      }]
    };

    parseSpec(spec, function(model) {
      var scene = model.scene(new model.Node());
      model.fire();

      expect(scene.marktype).to.equal("group");
      expect(scene.items).to.have.length(1);
      expect(scene.items[0].items).to.have.length(1);

      expect(scene.items[0].items[0].marktype).to.equal("rect");
      expect(scene.items[0].items[0].items).to.have.length(1);

      done();
    }, viewFactory);
  });

  it('should build from function', function(done) {
    var spec = {
      "data": [{"name": "table", "values": [1, 2, 3, 4, 5]}],
      "marks": [{
        "type": "rect",
        "properties": {"enter": {
          "x": 0, "y": 0, "width": 10, "height": 10
        }}
      }]
    };

    parseSpec(spec, function(model) {
      var scene = model.scene(new model.Node());
      model.fire();

      scene.items[0].items[0].def.from = function() { return [1, 2, 3, 4, 5]; }
      model.fire();

      expect(scene.items[0].items[0].marktype).to.equal("rect");
      expect(scene.items[0].items[0].items).to.have.length(5);

      scene.items[0].items[0].def.from = function() { return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; }
      model.fire();

      expect(scene.items[0].items[0].marktype).to.equal("rect");
      expect(scene.items[0].items[0].items).to.have.length(10);

      done();
    }, viewFactory);    
  });

  it('should handle streaming adds', function(done) {
    var spec = {
      "data": [{"name": "table", "values": [1, 2, 3, 4, 5]}],
      "marks": [{
        "type": "rect",
        "from": {"data": "table"},
        "properties": {"enter": {
          "x": 0, "y": 0, "width": 10, "height": 10
        }}
      }]
    };

    parseSpec(spec, function(model) {
      var scene = model.scene(new model.Node());
      model.fire();

      expect(scene.items[0].items[0].marktype).to.equal("rect");
      expect(scene.items[0].items[0].items).to.have.length(5);

      model.data('table').add([6, 7, 8, 9, 10]).fire();

      expect(scene.items[0].items[0].marktype).to.equal("rect");
      expect(scene.items[0].items[0].items).to.have.length(10);

      done();
    }, viewFactory);        
  });



});