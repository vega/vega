var fs  = require('fs'),
    stats = require('summary'),
    benchmarks = [
      {name: 'prev',  baseline: 'neverPrev'}, 
      {name: 'skips', baseline: 'noSkips'},
      {name: 'superNodes', baseline: 'noInline'}
      {name: 'scatter', baseline: 'vg1'},
      {name: 'pcp', baseline: 'vg1'},
      {name: 'trellis', baseline: 'vg1'},
      {name: "brushing_linking", baseline: "d3", fps: 1},
      {name: "overview_detail", baseline: "d3", fps: 1},
      {name: "panzoom", baseline: "d3", fps: 1}
    ],
    conditions = ['100.5', '1000.50', '10000.500', '100000.5000'];

benchmarks.forEach(function(b) {
  var n = b.name,
      summaries = {},
      folded   = [], 
      baseline = [],
      baseOps  = {};

  conditions.forEach(function(c) {
    var summary = summaries[c] = {},
        results = JSON.parse(fs.readFileSync('results.raw/'+n+'.'+c+'.json').toString());

    // Compile the types + times
    results.forEach(function(r) {
      var type = r.type.replace(n+'.'+c+' ', ''),
          init = type.split(' ')[0] + ' init';

      if(b.fps) r.time = 1/r.time * 1000;

      summary[type] = summary[type] || [];
      summary[type].push(r.size ? r.size/(1024*1024) : r.time);

      if(type.match(/parsed/) && (type.match(/heap/) == null)) {
        summary[init] = summary[init] || [];
        summary[init].push(r.size ? r.size/(1024*1024) : r.time);
      } else if(type.match(/rendered/) && (type.match(/heap/) == null)) {
        summary[init][summary[init].length-1] += r.size ? r.size/(1024*1024) : r.time;
      }
    });

    // Calculate stats
    Object.keys(summary).forEach(function(s) {
      var data = stats(summary[s]);
      summary[s] = {mean: data.mean(), sd: data.sd()};

      var fold = {
        condition: s.split(' ')[0],
        operation: s.split(' ').splice(1).join(' '),
        N: +c.split('.')[0],
        C: +c.split('.')[1],
        mean: data.mean(),
        sd: data.sd()
      };

      // We ran d3 benchmarks after vg, but we want the results to come first
      // and its easier to sort them here.
      if(fold.condition == b.baseline) {
        baseline.push(fold);
        baseOps[[fold.N, fold.C, fold.operation].join('.')] = fold.mean;
      }
      else folded.push(fold);
    });
  });

  baseline.forEach(function(b) { 
    b.percent_diff = 0;
    b.ratio = 1;
  });

  folded.forEach(function(f, i) {
    var base = baseOps[[f.N, f.C, f.operation].join('.')];
    f.percent_diff = (base - f.mean)/base * 100;
    f.ratio = base/f.mean;
  });

  fs.writeFileSync('results/'+n+'.json', JSON.stringify(summaries, null, 2));
  fs.writeFileSync('results/'+n+'.folded.json', JSON.stringify(baseline.concat(folded), null, 2));
})