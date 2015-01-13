define(function(require, exports, module) {
  var load = require('../util/load'),
      util = require('../util/index'),
      C = require('../util/constants');

  return function parseInteractors(model, spec, defFactory) {
    var count = 0,
        sg = {}, pd = {}, mk = {};

    function loaded(i) {
      return function(error, data) {
        if(error) {
          util.error("LOADING FAILED: " + i.url);
        } else {
          var def = util.isObject(data) ? data : JSON.parse(data);
          interactor(i.name, def);
        }
        if(--count == 0) inject();
      }
    }

    function interactor(name, def) {
      sg = {}, pd = {};
      spec.signals = util.array(spec.signals);
      spec.predicates = util.array(spec.predicates);
      spec.signals.push.apply(spec.signals, nsSignals(name, def.signals));
      spec.predicates.push.apply(spec.predicates, nsPredicates(name, def.predicates));
      nsMarks(name, def.marks);
    }

    function inject() {
      if(util.keys(mk).length > 0) injectMarks(spec.marks);
      defFactory();
    }

    function injectMarks(marks) {
      var m, r, i, len;
      marks = util.array(marks);

      for(i = 0, len = marks.length; i < len; i++) {
        m = marks[i];
        if(r = mk[m.type]) {
          marks[i] = util.duplicate(r);
          if(m.from) marks[i] = m.from;
          if(m.properties) {
            [C.ENTER, C.UPDATE, C.EXIT].forEach(function(p) {
              marks[i].properties[p] = util.extend(r.properties[p], m.properties[p]);
            });
          }
        } else if(m.marks) {  // TODO how to override properties of nested marks?
          injectMarks(m.marks);
        }
      }    
    }

    function ns(n, s) { 
      if(util.isString(s)) return s+":"+n;
      else {
        util.keys(s).forEach(function(x) { n = n.replace(x, s[x]) });
        return n;
      }
    }

    function nsSignals(name, signals) {
      signals = util.array(signals);
      signals.forEach(function(s) {
        s.name = sg[s.name] = ns(s.name, name);
        (s.streams || []).forEach(function(t) {
          t.type = ns(t.type, sg);
          t.expr = ns(t.expr, sg);
        });
      });
      return signals;
    }

    function nsPredicates(name, predicates) {
      predicates = util.array(predicates);
      predicates.forEach(function(p) {
        p.name = pd[p.name] = ns(p.name, name);

        [p.operands, p.range].forEach(function(x) {
          (x || []).forEach(function(o) {
            if(o.signal) o.signal = ns(o.signal, sg);
            else if(o.predicate) nsOperand(o);
          })
        });

      });  
      return predicates; 
    }

    function nsOperand(o) {
      o.predicate = pd[o.predicate];
      util.keys(o.input).forEach(function(k) {
        var i = o.input[k];
        if(i.signal) i.signal = ns(i.signal, sg);
      });
    }

    function nsMarks(name, marks) {
      (marks||[]).forEach(function(m) { 
        nsProperties(m.properties.enter);
        nsProperties(m.properties.update);
        nsProperties(m.properties.exit);

        mk[ns(m.name, name)] = m; 
      });
    }

    function nsProperties(propset) {
      util.keys(propset).forEach(function(k) {
        var p = propset[k];
        if(p.signal) p.signal = ns(p.signal, sg);
        else if(p.rule) {
          p.rule.forEach(function(r) { 
            if(r.signal) r.signal = ns(r.signal, sg);
            if(r.predicate) nsOperand(r); 
          });
        }
      });
    }

    (spec.interactors || []).forEach(function(i) {
      if(i.url) {
        count += 1;
        load(i.url, loaded(i));
      }
    });

    if (count === 0) setTimeout(inject, 1);
    return spec;
  }
});