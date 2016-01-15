var dl = require('datalib');

describe('Properties Parser', function() {
  it('should evaluate expression rules', function(done) {
    var spec = {
      data: [],
      signals: [{name: 'signal1', init: true}],
      marks: [
        {
          name: 'mark1',
          type: 'rect',
          properties: {
            update: {
              x: 0,
              y: 0,
              width: 100,
              height: 100,
              fill: [
                {test:'false', value: 'red'},
                {test:'signal1', value: 'blue'},
                {value: 'green'}
              ]
            }
          }
        }
      ]
    };
    parseSpec(spec, function(error, viewFactory) {
      var view = viewFactory().update();
      // get the rect item, which is in group -> mark1 -> item
      var mark = view.model().scene().items[0].items[0].items[0];
      expect(mark.fill).to.equal('blue');
      view.model().signal('signal1', false);
      view.update();
      expect(mark.fill).to.equal('green');
      done();
    });
  });

  it('should evaluate predicate rules', function(done) {
    var spec = {
      data: [],
      signals: [{name: 'signal1', init: true}],
      predicates: [{name:'predicate1', type:'==', operands: [{signal:'signal1'}, {value: true}]}],
      marks: [
        {
          name: 'mark1',
          type: 'rect',
          properties: {
            update: {
              x: 0,
              y: 0,
              width: 100,
              height: 100,
              fill: [
                {predicate:'predicate1', value: 'blue'},
                {value: 'green'}
              ]
            }
          }
        }
      ]
    };
    parseSpec(spec, function(error, viewFactory) {
      var view = viewFactory().update();
      // get the rect item, which is in group -> mark1 -> item
      var mark = view.model().scene().items[0].items[0].items[0];
      expect(mark.fill).to.equal('blue');
      view.model().signal('signal1', false);
      view.update();
      expect(mark.fill).to.equal('green');
      done();
    });
  });

});
