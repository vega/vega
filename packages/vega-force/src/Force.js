import {Transform} from 'vega-dataflow';
import {array, error, inherits, isFunction} from 'vega-util';
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
    ForceConfig = ['static', 'iterations'],
    ForceOutput = ['x', 'y', 'vx', 'vy'];

/**
 * Force simulation layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<object>} params.forces - The forces to apply.
 */
export default function Force(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(Force, Transform);

prototype.transform = function(_, pulse) {
  var sim = this.value,
      change = pulse.changed(pulse.ADD_REM),
      params = _.modified(ForceParams),
      iters = _.iterations || 300;

  // configure simulation
  if (!sim) {
    this.value = sim = simulation(pulse.source, _);
    sim.on('tick', rerun(pulse.dataflow, this));
    if (!_.static) change = true, sim.tick(); // ensure we run on init
    pulse.modifies('index');
  } else {
    if (change) pulse.modifies('index'), sim.nodes(pulse.source);
    if (params) setup(sim, _);
  }

  // run simulation
  if (params || change || _.modified(ForceConfig)
      || (pulse.changed() && _.restart))
  {
    sim.alpha(Math.max(sim.alpha(), _.alpha || 1))
       .alphaDecay(1 - Math.pow(sim.alphaMin(), 1 / iters));

    if (_.static) {
      for (sim.stop(); --iters >= 0;) sim.tick();
    } else {
      if (sim.stopped()) sim.restart();
      if (!change) return pulse.StopPropagation; // defer to sim ticks
    }
  }

  return this.finish(_, pulse);
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
        dataflow.touch(op); break;
      }
    }
  }

  // reflow all nodes
  return pulse.reflow(_.modified()).modifies(ForceOutput);
};

function rerun(df, op) {
  return function() { df.touch(op).run(); }
}

function simulation(nodes, _) {
  var sim = forceSimulation(nodes),
      stopped = false,
      stop = sim.stop,
      restart = sim.restart;

  sim.stopped = function() { return stopped; };
  sim.restart = function() { return stopped = false, restart(); };
  sim.stop = function() { return stopped = true, stop(); };

  return setup(sim, _, true).on('end', function() { stopped = true; });
}

function setup(sim, _, init) {
  var f = array(_.forces), i, n, p;

  for (i=0, n=ForceParams.length; i<n; ++i) {
    p = ForceParams[i];
    if (p !== Forces && _.modified(p)) sim[p](_[p]);
  }

  for (i=0, n=f.length; i<n; ++i) {
    if (init || _.modified(Forces, i)) {
      sim.force(Forces + i, getForce(f[i]));
    }
  }
  for (n=(sim.numForces || 0); i<n; ++i) {
    sim.force(Forces + i, null); // remove
  }

  return sim.numForces = f.length, sim;
}

function getForce(_) {
  var f, p;
  if (!ForceMap.hasOwnProperty(_.force)) {
    error('Unrecognized force: ' + _.force);
  }
  f = ForceMap[_.force]();
  for (p in _) if (isFunction(f[p])) f[p](_[p]);
  return f;
}
