var runner = require('./runner');

function setup() {
  this.mouseEvt = function(type, x, y, target) {
    var mm = document.createEvent("MouseEvents");
    mm.initMouseEvent("mousemove", true, true, window, null, x, y, x, y, false, false, false, false, target);

    var evt;
    if(type == "wheel") {
      var delta = Math.floor(Math.random() * 2) ? 1 : -1;
      var eventInit = { deltaX: -delta, deltaY: -delta, clientX: x, clientY: y, pageX: x, pageY: y }
      evt = new WheelEvent("wheel", eventInit);
    } else {
      var evt = document.createEvent("MouseEvents");
      evt.initMouseEvent(type, true, true, window, null, x, y, x, y, false, false, false, false, target);
    }

    target.dispatchEvent(mm);
    target.dispatchEvent(evt);
  }

  this.random = function(client, dir) {
    if(!dir) dir = 'horiz';
    var min = dir == 'horiz' ? client.left : client.top,
        max = dir == 'horiz' ? client.right : client.bottom;

    return Math.random() * (max - min) + min;
  };
}

function d3_brushing_linking() {
  var runner = this,
      i = 0, s = 0, c = 0,
      t;

  this.benchmark = function(s0, results) {
    var target, client;
    if(s == 0) {
      t = Date.now();
      target = d3.selectAll('.background')[0][(c = i%16)];
      client = target.getBoundingClientRect();
      mouseEvt('mousedown', client.left+(~~(Math.random()*25)), client.top+(~~(Math.random()*25)), target);
      s = 1;
    } else if(s == 1) {
      results.push({type: "d3", time: Date.now() - t})
      t = Date.now();
      target = d3.selectAll('.background')[0][c];
      client = target.getBoundingClientRect();
      mouseEvt('mouseup', client.left+(~~(Math.random()*25)+75), client.top+(~~(Math.random()*25)+75), target);
      s = 2;
    } else {
      results.push({type: "d3", time: Date.now() - t})
      t = Date.now();
      s = 0; 
    }

    return (++i > 100) ? ++s0 : s0;
  }
}

function d3_overview_detail() {
  var runner = this,
      i = 0, s = 0, c = 0,
      t,
      client, brush;

  this.benchmark = function(s0, results) {
    client = client || d3.select('.context').node().getBoundingClientRect();
    brush  = brush || d3.select('.context .x.brush').node();

    if(s == 0) {
      t = Date.now();
      mouseEvt('mousedown', random(client), client.top+5, brush);
      s = 1;
    } else if(s == 1) {
      results.push({type: "d3", time: Date.now() - t})
      t = Date.now();
      mouseEvt('mouseup', random(client), client.top+5, brush);
      s = 2;
    } else {
      results.push({type: "d3", time: Date.now() - t})
      t = Date.now();
      s = 0; 
    }

    return (++i > 100) ? ++s0 : s0;
  }        
}

function d3_panzoom() {
  var runner = this,
      i = 0, s = 0, c = 0,
      t,
      client, bb;

  this.benchmark = function(s0, results) {
    client = client || d3.select('rect').node();
    bb = bb || client.getBoundingClientRect();

    if(s == 0) {
      t = Date.now();
      mouseEvt('mousedown', random(bb), random(bb, 'vert'), client);
      s = 1;
    } else if(s == 1) {
      results.push({type: "d3", time: Date.now() - t})
      t = Date.now();
      mouseEvt('mouseup', random(bb), random(bb, 'vert'), client);
      s = 2;
    } else if(s == 2) {
      results.push({type: "d3", time: Date.now() - t})
      t = Date.now();
      mouseEvt('wheel', random(bb), random(bb, 'vert'), client);
      s = 3; 
    } else {
      results.push({type: "d3", time: Date.now() - t})
      t = Date.now();
      s = 0; 
    }

    return (++i > 125) ? ++s0 : s0;
  }     
}

function vg_panzoom() {
  var xMin = 0, xMax = 20, yMin = 0, yMax = 1;
  var startX, endX, startY, endY, isDragged = false;

  var i = 0, s = 0, t,
      env = vg.version ? "vg1" : "vg2",
      client, bb, pad;  

  this.interactivity = function(view) {
    var x = d3.scale.linear()
          .domain([0,800])
          .range([xMin, xMax]);
    var y = d3.scale.linear()
          .domain([0,500])
          .range([yMin, yMax]);

    view.on("mousedown", function(evt, item) {
      isDragged = true;
      startX = x(evt.x);
      startY = y(evt.y);
    });

    view.on("mousemove", function(evt, item) {
      if(isDragged) {
        endX = x(evt.x);
        endY = y(evt.y);
        xDiff = endX - startX;
        yDiff = endY - startY;
        view.data({"xDomain": [{"min": xMin - xDiff, "max": xMax - xDiff}]});
        view.data({"yDomain": [{"min": yMin + yDiff, "max": yMax + yDiff}]});
        view.update();
      }
    });

    view.on("mouseup", function(evt, item) {
      isDragged = false;
      endX = x(evt.x);
      endY = y(evt.y);
      xDiff = endX - startX;
      yDiff = endY - startY;
      xMin = xMin - xDiff;
      xMax = xMax - xDiff;
      yMin = yMin + yDiff;
      yMax = yMax + yDiff;
      x.range([xMin, xMax]);
      y.range([yMin, yMax]);
    });

    view.on("wheel", function(evt, item) {
      var xChange = 1.015, 
          yChange = 1.015;
      if(evt.wheelDelta < 0) {
        xMin = xMin * xChange;
        xMax = xMax * xChange;
        yMin = yMin * yChange;
        yMax = yMax * yChange;
        view.data({"xDomain": [{"min": xMin, "max": xMax}]});
        view.data({"yDomain": [{"min": yMin, "max": yMax}]});
        view.update();
      } else if (evt.wheelDelta > 0) {
        xMin = xMin / xChange;
        xMax = xMax / xChange;
        yMin = yMin / yChange;
        yMax = yMax / yChange;
        view.data({"xDomain": [{"min": xMin, "max": xMax}]});
        view.data({"yDomain": [{"min": yMin, "max": yMax}]});
        view.update();
      }
    })
  }

  this.benchmark = function(view, results, done) {
    if(vg.version) this.interactivity(view);

    client = d3.select('.marks').node();
    bb = client.getBoundingClientRect();
    bb = vg.version ? vg.duplicate(bb) : vg.util.duplicate(bb);
    pad = view.padding();
    bb.left += pad.left + 20;
    bb.right -= (pad.right + 20);

    d3.timer(function() {
      if(s == 0) {
        t = Date.now();
        mouseEvt('mousedown', random(bb), random(bb, 'vert'), client);
        s = 1;
      } else if(s == 1) {
        results.push({type: env, time: Date.now() - t})
        t = Date.now();
        mouseEvt('mouseup', random(bb), random(bb, 'vert'), client);
        s = 2;
      } else if(s == 2) {
        results.push({type: env, time: Date.now() - t})
        t = Date.now();
        mouseEvt('wheel', random(bb), random(bb, 'vert'), client);
        s = 3; 
      } else {
        results.push({type: env, time: Date.now() - t})
        t = Date.now();
        s = 0; 
      }

      if (++i > 125) {
        return (done(results), true);
      }
    });
  }

  this.benchmark.async = true;
}

function vg_overview_detail() {
  var x0, x1, d0, d1;
  var OFFSET = 50;

  var i = 0, s = 0, t,
      env = vg.version ? "vg1" : "vg2",
      client, bb, pad;

  this.interactivity = function(view) {
    var isDragged = false;
    var sp500 = this.data;
    var extent = d3.extent(sp500, function(d) { return d.z; });
    var xScale = d3.scale.linear()
      .domain([0, 720])
      .range(extent);

    view.on("mousedown", function(evt, item) {
      view.data({"sp500_filtered": sp500}).update();
      isDragged = true;
      x0 = evt.x - OFFSET;
      view.data({"brush": [{"min": x0, "max": x0}]}).update();
      view.update();
    });

    view.on("mousemove", function(evt, item) {
      if(isDragged) {
        x1 = evt.x - OFFSET;
        var result;
        var filtered = sp500.filter(function(d) {
          if (xScale(x0) > xScale(x1)) { 
            result = [{"min": x1, "max": x0}];
            return d.z <= xScale(x0) && d.z >= xScale(x1);
          }
          result = [{"min": x0, "max": x1}];
          return d.z >= xScale(x0) && d.z <= xScale(x1);
        });
        view.data({"sp500_filtered": filtered}).update();
        view.data({"brush": result}).update();
      }
    });

    view.on("mouseup", function(evt, item) {
      isDragged = false;
    });
  }

  this.benchmark = function(view, results, done) {
    if(vg.version) this.interactivity(view);

    client = d3.select('.marks').node();
    bb = client.getBoundingClientRect();
    bb = vg.version ? vg.duplicate(bb) : vg.util.duplicate(bb);
    pad = view.padding();
    bb.left += pad.left + 20;
    bb.right -= (pad.right + 20);

    d3.timer(function() {
      if(s == 0) {
        t = Date.now();
        mouseEvt('mousedown', random(bb), 500, client);
        s = 1;
      } else if(s == 1) {
        results.push({type: env, time: Date.now() - t})
        t = Date.now();
        mouseEvt('mouseup', random(bb), 500, client);
        s = 2;    
      } else {
        results.push({type: env, time: Date.now() - t})
        t = Date.now();
        s = 0; 
      }

      if (++i > 100) {
        return (done(results), true);
      }
    });
  }

  this.benchmark.async = true;
}

function vg_brushing_linking() {
  var view, isDragged = false;
  var x, x2, y, y2;
  var xScale, yScale, xAccess, yAccess;
  var X_OFFSET = 39, Y_OFFSET = 19;

  var i = 0, s = 0, c = 0, 
      cells = [{"x":0,"y":0},{"x":0,"y":150},{"x":0,"y":300},{"x":0,"y":450},{"x":150,"y":0},{"x":150,"y":150},{"x":150,"y":300},{"x":150,"y":450},{"x":300,"y":0},{"x":300,"y":150},{"x":300,"y":300},{"x":300,"y":450},{"x":450,"y":0},{"x":450,"y":150},{"x":450,"y":300},{"x":450,"y":450}],
      env = vg.version ? "vg1" : "vg2",
      client, bb,
      t;

  this.interactivity = function(view) {
    data = view.model().data().iris
      .map(function(d) { return d.data; });
      .forEach(function(d) { d.color = "grey"; });

    var petalLength = d3.scale.linear()
        .range(d3.extent(data, function(d) { return d.petalLength }));
    var petalWidth = d3.scale.linear()
        .range(d3.extent(data, function(d) { return d.petalWidth }));
    var sepalLength = d3.scale.linear()
        .range(d3.extent(data, function(d) { return d.sepalLength }));
    var sepalWidth = d3.scale.linear()
        .range(d3.extent(data, function(d) { return d.sepalWidth }));

    view.data({"iris": data}).update();

    view.on("mousedown", function(evt, item) {
      isDragged = true;
      x = evt.x;
      y = evt.y;
      view.data({"brush": [{"xmin": x - X_OFFSET, "xmax": x - X_OFFSET, "ymin": y - Y_OFFSET, "ymax": y - Y_OFFSET}]});
      identify();

      data.forEach(function(d) { d.color = "grey"; });
      view.data({"iris": data}).update();
    });

    view.on("mousemove", function(evt, item) {

      if(isDragged) {
        x2 = evt.x;
        y2 = evt.y;

        var xMin = d3.min([xScale(x), xScale(x2)]);
        var xMax = d3.max([xScale(x), xScale(x2)]);
        var yMin = d3.min([yScale(y), yScale(y2)]);
        var yMax = d3.max([yScale(y), yScale(y2)]);

        data.map(function(d) {
          if(d[xAccess] >= xMin && 
             d[xAccess] <= xMax &&
             d[yAccess] >= yMin && 
             d[yAccess] <= yMax) {
            d.color = getColor(d.species)
          } else {
            d.color = "grey";
          }
        });
        view.data({"iris": data});

        var result = [{"xmin": x - X_OFFSET, "xmax": x2 - X_OFFSET, "ymin": y - Y_OFFSET, "ymax": y2 - Y_OFFSET}];
        view.data({"brush": result}).update();
      }
    });

    view.on("mouseup", function(evt, item) {
      isDragged = false;
    });

    function identify() {
      if (x < 167 - X_OFFSET) {
        xScale = petalWidth;
        xScale.domain([35,155]);
        xAccess = "petalWidth";
      } else if (x < 307 - X_OFFSET){
        xScale = petalLength;
        xScale.domain([185,305]);
        xAccess = "petalLength";
      } else if (x < 457 - X_OFFSET){
        xScale = sepalWidth;
        xScale.domain([335,455]);
        xAccess = "sepalWidth";
      } else {
        xScale = sepalLength;
        xScale.domain([485,605]);
        xAccess = "sepalLength";
      }

      if (y < 155 - Y_OFFSET) {
        yScale = petalWidth;
        yScale.domain([140,15]);
        yAccess = "petalWidth";
      } else if (y < 305 - Y_OFFSET){
        yScale = petalLength;
        yScale.domain([290,165]);
        yAccess = "petalLength";
      } else if (y < 455 - Y_OFFSET){
        yScale = sepalWidth;
        yScale.domain([440,315]);
        yAccess = "sepalWidth";
      } else {
        yScale = sepalLength;
        yScale.domain([590,465]);
        yAccess = "sepalLength";
      }
    }

    function getColor(species) {
      if(species == "setosa") {
        return "#1f77b4";
      } else if (species == "versicolor") {
        return "#ff7f0e";
      } else {
        return "#2ca02c";
      }
    }
  }

  this.benchmark = function(view, results, done) {
    if(vg.version) this.interactivity(view);  // Vega 1

    client = d3.select('.marks').node()
    bb = client.getBoundingClientRect();
    cells.forEach(function(c) { c.x += bb.left; c.y += bb.top });

    d3.timer(function() {
      var target;
      if(s == 0) {
        t = Date.now();
        
        target = cells[(c = i%16)];
        mouseEvt('mousedown', target.x+(~~(Math.random()*25)+25), target.y+(~~(Math.random()*25)+25), client);
        s = 1;
      } else if(s == 1) {
        results.push({type: env, time: Date.now() - t})
        t = Date.now();
        target = cells[c];
        mouseEvt('mouseup', target.x+(~~(Math.random()*25)+75), target.y+(~~(Math.random()*25)+75), client);
        s = 2;    
      } else {
        results.push({type: env, time: Date.now() - t})
        t = Date.now();
        s = 0; 
      }

      if (++i > 100) {
        return (done(results), true);
      }
    });
  }
  this.benchmark.async = true;
}

var env = process.argv[2],
    spec = process.argv[3],
    N = process.argv[4] || 1000,
    C = process.argv[5] || 50,
    results = [spec, N, C].join('.');

var benchmarks = {
  d3_panzoom: d3_panzoom,
  d3_overview_detail: d3_overview_detail,
  d3_brushing_linking: d3_brushing_linking,

  vg1_panzoom: vg_panzoom,
  vg1_overview_detail: vg_overview_detail,
  vg1_brushing_linking: vg_brushing_linking,

  vg2_panzoom: vg_panzoom,
  vg2_overview_detail: vg_overview_detail,
  vg2_brushing_linking: vg_brushing_linking
};

runner(env, spec, N, C, results, benchmarks[env+'_'+spec], setup);