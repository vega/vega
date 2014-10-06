define(function() {
  return function(model) {
    function Node(fn, listeners) {
      this._type = 'operator';  // operator || collector
      this._fn = fn || function(pulse) { return pulse };
      this._rank = ++model._rank;
      this._listeners = [];
      this._deps = dependency();
      this._stamp = 0;
      this._router = false;
      this._touchable = false;

      if(listeners)
        for(var i = 0; i < listeners.length; i++) this.addListener(listeners[i]);
    };

    Node.prototype.addListener = function(l) {
      if(!(l instanceof Node)) throw "Listener is not a Node";
      if(this._listeners.indexOf(l) !== -1) return;

      this._listeners.push(l);
      if(this._rank > l._rank) {
        var q = [l];
        while(q.length) {
          var cur = q.splice(0,1)[0];
          cur._rank = ++model._rank;
          q = q.concat(cur._listeners);
        }
      }
    };

    Node.prototype.removeListener = function (l) {
      var foundSending = false;
      for (var i = 0; i < this._listeners.length && !foundSending; i++) {
        if (this._listeners[i] === l) {
          this._listeners.splice(i, 1);
          foundSending = true;
        }
      }
      
      return foundSending;
    };

    Node.prototype.reevaluate = function(pulse) {
      var node = this, reeval = false;
      return ['signals', 'fields', 'data', 'scales'].some(function(prop) {
        reeval = reeval || node._deps[prop].some(function(k) { return !!pulse[prop][k] });
        return reeval;
      });
    };

    function dependency(signals, fields, data, scales) {
      return {signals: signals||[], fields: fields||[], 
        data: data||[], scales: scales||[]};
    };

    Node.dependency = dependency;
    Node.reset = function() { rank = 0; }
    return Node;
  }
});

