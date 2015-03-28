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

function run_d3(env, results, done) {
  var runner = this,
      s0 = 0,
      rendered = false, 
      t;

  d3.timer(function() {
    if(s0 == 0) {
      t = Date.now();
      runner.init();
      s0 = 1;
    } else if(s0 == 1) {
      results.push({ type: "d3 parsed", time: Date.now() - t });
      t = Date.now();
      runner.update(runner.data);
      s0 = 2;
    } else if(s0 == 2) {
      if(!rendered) results.push({ type: "d3 rendered", time: Date.now() - t });
      t = Date.now();
      rendered = true;

      if(runner.benchmark) s0 = runner.benchmark(s0, results);
      else return done(results), true;
    } else if(s0 == 3) {
      return done(results), true;
    }
  });
}

function run_vega(env, results, done) {
  d3.select('body').append('div').attr('id', 'vis');

  var t = Date.now();
  vg.parse.spec(this.spec, function(chart) {
    results.push({ type: env+" parsed", time: Date.now() - t });

    t = Date.now();
    var view = chart({ el: "#vis" });

    // if(env === 'vg1') view.render = function() {};
    // else if(env === 'vg2') {
    //   view._build = true;
    //   view._model.scene(new vg.dataflow.Node(view._model.graph));
    // }

    view.update();
    results.push({ type: env+" rendered", time: Date.now() - t });

    if(this.benchmark) this.benchmark(view, results, done);
    if(!this.benchmark.async) done(results);
  }, this.viewFactory);
}

function run(env, spec, N, C, resName, setup, viewFactory) {
  console.log(resName, setup.name);
  var results  = getResults(resName),
      specName = spec,
      data;

  if(env == 'vg1' || env == 'vg2') {
    spec = JSON.parse(fs.readFileSync('spec/'+env+'/'+spec+'.json'));

    var data = spec.data[0];
    if(data.url) {
      data.values = JSON.parse(fs.readFileSync(data.url));
      delete data.url;
    }    
  } else {
    spec = require('./spec/d3/'+spec);
    if(spec.data) data = JSON.parse(fs.readFileSync(spec.data));
  }

  var client = webdriverio.remote({
      desiredCapabilities: {
        browserName: 'chrome',
        chromeOptions: {
          args: ['--enable-precise-memory-info']
        }
      }
    })
    .init()
    .url('http://localhost:8000/benchmarks/'+env+'.html')
    .timeoutsAsyncScript(300000)
    .execute(function(env, specName, spec, data, N, C) {
      this.N = N;
      this.C = C;
      
      // Inject data generation into the browser because Selenium throws an error
      // if we send in a large pre-injected spec
      this.random = function(N, C) {
        if(specName == 'splom') N = Math.floor(Math.sqrt(N));
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
        if(specName == 'splom') N = Math.floor(Math.sqrt(N));
        while(data.length < N) data = data.concat(data);
        if(data.length > N) data = data.slice(0, N);
        return data;
      }

      if(env == 'vg1' || env == 'vg2') {
        var data = spec.data[0];
        data.values = data.values ? this.extend(data.values, N) : this.random(N, C);
        this.spec = spec;
      } else {
        this.data = data ? this.extend(data, N) : this.random(N, C);
      }   
    }, env, specName, spec, data, N, C, function(err, ret) {
      if(err) console.log('Error w/data injection', err.message);
    })
    // Inject the setup into the browser
    .execute(setup, function(err, ret) { 
      if(err) console.log('loading setup', err.message); 
    });

  if(viewFactory) client.execute(viewFactory, function(err, ret) {
    if(err) console.log('viewFactory', err.message); 
  });

  if(env == 'd3') client.execute(spec, function(err, ret) {
    if(err) console.log('loading d3 spec', err.message); 
  })

  client.executeAsync(runners[env], env, results, function(err, ret) {
      if(err) console.log('runner', err.message);
      else    saveResults(resName, ret.value);
  })
    .end();
}

var runners = { d3: run_d3, vg1: run_vega, vg2: run_vega };
module.exports = run;