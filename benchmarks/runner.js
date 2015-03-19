var fs = require('fs'),
    webdriverio = require('webdriverio');

function getResults(name) {
  var results;
  try {
    results = JSON.parse(fs.readFileSync('results.raw/'+name+'.json').toString()) || [];
  } catch(e) {
    results = [];
  }
  return results;
}

function saveResults(name, results) {
  fs.writeFileSync('results.raw/'+name+'.json', JSON.stringify(results, null, 2));
}

function run_vega(env, results, done) {
  d3.select('body').append('div').attr('id', 'vis');

  var t0 = Date.now();
  vg.parse.spec(this.spec, function(chart) {
    results.push({ type: env+" parsed", time: Date.now() - t0 });

    t0 = Date.now();
    var view = chart({ el: "#vis" });
    view.update();
    results.push({ type: env+" rendered", time: Date.now() - t0 });

    if(this.benchmark) this.benchmark(view, results);

    done(results);
  });
}

function run(env, spec, N, C, resName, benchmark) {
  console.log(resName, benchmark.name);
  spec = JSON.parse(fs.readFileSync('spec/'+env+'/'+spec+'.json'));

  var data = spec.data[0];
  if(data.url) {
    data.values = JSON.parse(fs.readFileSync(data.url));
    delete data.url;
  }

  var results = getResults(resName);

  webdriverio
    .remote({
      desiredCapabilities: {browserName: 'chrome'}
    })
    .init()

    .url('http://localhost:8000/benchmarks/'+env+'.html')
    .timeoutsAsyncScript(300000)

    .execute(function(spec, N, C) {   
      // Inject data generation into the browser because Selenium throws an error
      // if we send in a large pre-injected spec
      this.random = function(N, C) {
        var out = [];
        for (var i=0; i<N; ++i) {
          var o = {};
          o.idx = i;
          o.x = "c" + ~~(C*(i/N));
          o.y = C * Math.random();
          o.z = o.y + C * Math.random();
          out.push(o);
        }
        return out;
      };

      this.extend = function(data, N) {
        while(data.length < N) data = data.concat(data);
        if(data.length > N) data = data.slice(0, N);
        return data;
      }

      var data = spec.data[0];
      data.values = data.values ? this.extend(data.values, N) : this.random(N, C);
      this.spec = spec;
    }, spec, N, C, function(err, ret) {
      if(err) console.log('Error w/data injection', err.message);
    })
    // Inject the benchmark into the browser
    .execute(benchmark, function(err, ret) { 
      if(err) console.log('loading benchmark', err.message); 
    })
    .executeAsync(runners[env], env, results, function(err, ret) {
      if(err) console.log('runner', err.message);
      else    saveResults(resName, ret.value);
    })
    .end();
}

var runners = { vg1: run_vega, vg2: run_vega };
module.exports = run;