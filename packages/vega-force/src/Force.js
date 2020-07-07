import {Transform} from 'vega-dataflow';
import {
  accessorFields, array, error, hasOwnProperty,
  inherits, isFunction, accessorName
} from 'vega-util';
import {
  forceSimulation, forceCenter, forceCollide,
  forceManyBody, forceLink, forceX, forceY
} from 'd3-force';

var ForceMap = {
  center: forceCenter,
  collide: forceCollide,
  nbody: forceManyBody,
  link: forceLink,
  x: forceX,
  y: forceY
};

var Forces = 'forces',
    ForceParams = [
      'alpha', 'alphaMin', 'alphaTarget',
      'velocityDecay', 'forces'
    ],
    ForceParamMethods = ['alpha', 'alphaMin', 'alphaDecay'],
    ForceInput = ['x', 'y', 'vx', 'vy', 'fx', 'fy'],
    ForceConfig = ['static', 'iterations'],
    ForceOutput = ['x', 'y', 'vx', 'vy', 'source', 'target'];

/**
 * Force simulation layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<object>} params.forces - The forces to apply.
 */
export default function Force(params) {
  Transform.call(this, null, params);
}

Force.Definition = {
  "type": "ForceWorker",
  "metadata": {"modifies": true},
  "params": [
    { "name": "static", "type": "boolean", "default": false },
    { "name": "restart", "type": "boolean", "default": false },
    { "name": "worker", "type": "URL", "default": undefined },
    { "name": "iterations", "type": "number", "default": 300 },
    { "name": "alpha", "type": "number", "default": 1 },
    { "name": "alphaMin", "type": "number", "default": 0.001 },
    { "name": "alphaTarget", "type": "number", "default": 0 },
    { "name": "velocityDecay", "type": "number", "default": 0.4 },
    { "name": "forces", "type": "param", "array": true,
      "params": [
        {
          "key": {"force": "center"},
          "params": [
            { "name": "x", "type": "number", "default": 0 },
            { "name": "y", "type": "number", "default": 0 }
          ]
        },
        {
          "key": {"force": "collide"},
          "params": [
            { "name": "radius", "type": "number", "expr": true },
            { "name": "strength", "type": "number", "default": 0.7 },
            { "name": "iterations", "type": "number", "default": 1 }
          ]
        },
        {
          "key": {"force": "nbody"},
          "params": [
            { "name": "strength", "type": "number", "default": -30 },
            { "name": "theta", "type": "number", "default": 0.9 },
            { "name": "distanceMin", "type": "number", "default": 1 },
            { "name": "distanceMax", "type": "number" }
          ]
        },
        {
          "key": {"force": "link"},
          "params": [
            { "name": "links", "type": "data" },
            { "name": "id", "type": "field" },
            { "name": "distance", "type": "number", "default": 30, "expr": true },
            { "name": "strength", "type": "number", "expr": true },
            { "name": "iterations", "type": "number", "default": 1 }
          ]
        },
        {
          "key": {"force": "x"},
          "params": [
            { "name": "strength", "type": "number", "default": 0.1 },
            { "name": "x", "type": "field" }
          ]
        },
        {
          "key": {"force": "y"},
          "params": [
            { "name": "strength", "type": "number", "default": 0.1 },
            { "name": "y", "type": "field" }
          ]
        }
      ] },
    {
      "name": "as", "type": "string", "array": true, "modify": false,
      "default": ForceOutput
    }
  ]
};

var prototype = inherits(Force, Transform);

prototype.transform = function(_, pulse) {
  var sim = this.value,
      change = pulse.changed(pulse.ADD_REM),
      params = _.modified(ForceParams),
      iters = _.iterations || 300,
      tick;
  // configure simulation
  if (!sim) {
    this.value = sim = _.worker
      ? simulationWorker(pulse.source, _)
      : simulation(pulse.source, _);
    if (!_.static) {
      change = true;
      tick = sim.tick(); // ensure we run on init
    }
    pulse.modifies('index');
  } else {
    if (change) {
      pulse.modifies('index');
      sim.nodes(pulse.source, _);
    }
    if (params || pulse.changed(pulse.MOD)) {
      setup(sim, _, 0, pulse);
    }
  }

  // run simulation
  if (params || change || _.modified(ForceConfig)
      || (pulse.changed() && _.restart))
  {
    sim.alpha(Math.max(sim.alpha(), _.alpha || 1))
       .alphaDecay(1 - Math.pow(sim.alphaMin(), 1 / iters));

    if (_.static) {
        sim.on('tick', null);
        sim.stop();
        tick = sim.tick(iters);
    } else {
      sim.on('tick', rerun(pulse.dataflow, this));
      if (sim.stopped()) sim.restart();
      if (!change) return pulse.StopPropagation; // defer to sim ticks
    }
  }

  return Promise.resolve(tick)
    .then(() => { return this.finish(_, pulse); });
};

prototype.finish = function(_, pulse) {
  var dataflow = pulse.dataflow;

  // inspect dependencies, touch link source data
  for (var args=this._argops, j=0, m=args.length, arg; j<m; ++j) {
    arg = args[j];
    if (arg.name !== Forces || arg.op._argval.force !== 'link') {
      continue;
    }
    for (var ops=arg.op._argops, i=0, n=ops.length, op; i<n; ++i) {
      if (ops[i].name === 'links' && (op = ops[i].op.source)) {
        dataflow.pulse(op, dataflow.changeset().reflow());
        break;
      }
    }
  }

  // reflow all nodes
  return pulse.reflow(_.modified()).modifies(ForceOutput);
};

prototype.detach = function () {
  if (this.value && this.value.worker) {
    this.value.worker.terminate();
  }
  return Transform.prototype.detach.call(this);
}

function rerun(df, op) {
  return function() { df.touch(op).run(); }
}

function simulation(nodes, _) {
  var sim = forceSimulation(nodes),
      stopped = false,
      stop = sim.stop,
      restart = sim.restart;

  sim.stopped = function() {
    return stopped;
  };
  sim.restart = function() {
    stopped = false;
    return restart();
  };
  sim.stop = function() {
    stopped = true;
    return stop();
  };

  return setup(sim, _, true).on('end', function() { stopped = true; });
}

function simulationWorker(nodes, _) {
  var stopped = false,
      resolvers = {},
      pulseId = 0,
      tickId = 0,
      sim;
  sim = {
    isWorker: true,
    worker: new Worker(_.worker),
    local: { nodes: nodes, alphaMin: 0.001, alpha: 1, forces: {} },
    onEnd: function() { stopped = true; },
    onTick: null
  };
  sim.worker.onmessage = function (event) {
    var message = event.data;
    if (message.action === 'tick') {
      // ignore delayed tick results from obsolete data
      if (message.id === pulseId) {
        sim.local.alpha = message.alpha;
        updateNodesFromWorker(message.nodes, sim.local.nodes);
        Object.keys(message.linkData).forEach(function (force) {
          updateNodesFromWorker(message.linkData[force], sim.local.forces[force].links);
        });
        // redraw with updates from automatic ticks
        if (message.tickId === undefined && isFunction(sim.onTick)) {
          sim.onTick(message);
        }
      }
      // resolve promises for manually invoked ticks
      if (resolvers[message.tickId]) resolvers[message.tickId]();
    }
    if (message.action === 'end') {
      sim.local.alpha = message.alpha;
      sim.onEnd(message);
    }
  };

  sim.stopped = function() {
    return stopped;
  };
  sim.restart = function() {
    stopped = false;
    sim.worker.postMessage({ action: 'restart' });
    return sim;
  };
  sim.stop = function() {
    stopped = true;
    sim.worker.postMessage({ action: 'stop' });
    return sim;
  };
  sim.force = function(name, force) {
    if (arguments.length === 1) return sim.local.forces[name];
    sim.worker.postMessage({ action: 'force', name: name, force: force });
    if (force === null) {
      delete sim.local.forces[name];
    } else {
      sim.local.forces[name] = force;
    }
    return sim;
  };
  sim.on = function(type, handler) {
    if (type === 'tick') sim.onTick = handler;
    return sim;
  };
  sim.tick = function(iters) {
    return new Promise(function (resolve) {
      resolvers[++tickId] = resolve;
      sim.worker.postMessage({ action: 'tick', iters: iters, id: tickId });
    });
  };
  sim.nodes = function(nodes, _) {
    if (!arguments.length) return sim.local.nodes;
    sim.worker.postMessage({ action: 'nodes', nodes: getWorkerNodes(nodes, _), id: ++pulseId });
    sim.local.nodes = nodes;
    return sim;
  };
  ForceParamMethods.forEach(function (param) {
    sim[param] = function (value) {
      if (!arguments.length) return sim.local[param];
      sim.worker.postMessage({action: 'param', name: param, value: value});
      sim.local[param] = value;
      return sim;
    };
  });

  sim.worker.postMessage({ action: 'init', nodes: getWorkerNodes(nodes, _), id: ++pulseId });
  setup(sim, _, true);
  return sim;
}

function setup(sim, _, init, pulse) {
  var f = array(_.forces), i, n, p, name;

  for (i=0, n=ForceParams.length; i<n; ++i) {
    p = ForceParams[i];
    if (p !== Forces && _.modified(p)) sim[p](_[p]);
  }

  for (i=0, n=f.length; i<n; ++i) {
    name = Forces + i;
    p = init || _.modified(Forces, i) ? getForce(f[i], sim.isWorker)
      : pulse && modified(f[i], pulse) ? sim.force(name)
      : null;
    if (p) sim.force(name, p);
  }

  for (n=(sim.numForces || 0); i<n; ++i) {
    sim.force(Forces + i, null); // remove
  }

  sim.numForces = f.length;
  return sim;
}

function modified(f, pulse) {
  var k, v;
  for (k in f) {
    if (isFunction(v = f[k]) && pulse.modified(accessorFields(v)))
      return 1;
  }
  return 0;
}

export function getForce(_, isWorker) {
  var f, p;

  if (!hasOwnProperty(ForceMap, _.force)) {
    error('Unrecognized force: ' + _.force);
  }
  if (isWorker) {
    f = { force: _.force };
    for (p in _) {
      f[p] = isFunction(_[p]) ? { fname: accessorName(_[p]) } : _[p];
    }
    return f;
  }
  f = ForceMap[_.force]();

  for (p in _) {
    if (isFunction(f[p])) setForceParam(f[p], _[p], _);
  }

  return f;
}

function setForceParam(f, v, _) {
  f(isFunction(v) ? function(d) { return v(d, _); } : v);
}

// send only relevant data to worker, avoid non-cloneable props like mark
function getWorkerNodes(nodes, _) {
  var nodesCloneable = new Array(nodes.length),
      f = array(_.forces),
      accessors = [],
      prop;
  // accessors aren't cloneable; resolve before transfer
  f.forEach(function (force) {
    for (const forceProp of Object.keys(force)) {
      if (isFunction(force[forceProp])) {
        accessors.push(function (input, output) {
          output[accessorName(force[forceProp])] = force[forceProp](input);
        })
      }
    }
  });
  nodes.forEach(function (node, i) {
    nodesCloneable[i] = {};
    for(prop of ForceInput) {
      if (prop in node) nodesCloneable[i][prop] = node[prop];
    }
    accessors.forEach(function (acc) { acc(node, nodesCloneable[i]) })

  });
  return nodesCloneable;
}

// copy updated simulation values back into pulse source
function updateNodesFromWorker(workerNodes, nodes) {
  var p;
  workerNodes.forEach(function (source, i) {
    for(p of ForceOutput) {
      nodes[i][p] = source[p];
    }
  })
}
