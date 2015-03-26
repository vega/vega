var fs  = require('fs'),
    stats = require('summary'),
    benchmarks = ['prev', 'skips', 'scatter', 'pcp', 'trellis'],
    conditions = ['100.5', '1000.50', '10000.500', '100000.5000'];

benchmarks.forEach(function(b) {
  var summaries = {},
      folded = [];

  conditions.forEach(function(c) {
    var summary = summaries[c] = {},
        results = JSON.parse(fs.readFileSync('results.raw/'+b+'.'+c+'.json').toString());

    // Compile the types + times
    results.forEach(function(r) {
      var type = r.type.replace(b+'.'+c+' ', '');
      summary[type] = summary[type] || [];
      summary[type].push(r.size ? r.size/(1024*1024) : r.time);
    });

    // Calculate stats
    Object.keys(summary).forEach(function(s) {
      var data = stats(summary[s]);
      summary[s] = {mean: data.mean(), sd: data.sd()};
      folded.push({
        condition: s.split(' ')[0],
        operation: s.split(' ').splice(1).join(' '),
        N: +c.split('.')[0],
        C: +c.split('.')[1],
        mean: data.mean(),
        sd: data.sd()
      });
    });
  });

  fs.writeFileSync('results/'+b+'.json', JSON.stringify(summaries, null, 2));
  fs.writeFileSync('results/'+b+'.folded.json', JSON.stringify(folded, null, 2));
})