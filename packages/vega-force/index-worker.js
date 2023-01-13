import {
  forceCenter, forceCollide, forceLink,
  forceManyBody, forceSimulation, forceX, forceY
} from 'd3-force';
import {
  isFunction, isObject
} from 'vega-util';

const ForceMap = {
  center: forceCenter,
  collide: forceCollide,
  nbody: forceManyBody,
  link: forceLink,
  x: forceX,
  y: forceY
};

const linkDatasets = {};
let sim, pulseId;

onmessage = function (event) {
  const message = event.data;
  switch (message.action) {
    case 'init':
      pulseId = message.id;
      initialize(message.nodes);
      break;
    case 'restart':
      sim.restart();
      break;
    case 'stop':
      sim.stop();
      break;
    case 'nodes':
      pulseId = message.id;
      sim.nodes(message.nodes);
      break;
    case 'tick':
      sim.tick(message.iters);
      reportTick(message.id);
      break;
    case 'param':
      sim[message.name](message.value);
      break;
    case 'force':
      sim.force(message.name, getForce(message.force));
      if ('links' in message.force) {
        linkDatasets[message.name] = message.force.links;
      }
      break;
  }

};

function initialize (nodes) {
  sim = forceSimulation(nodes)
    .on('tick', reportTick)
    .on('end', reportEnd);
}

function reportTick(tickId) {
  postMessage({ action: 'tick', alpha: sim.alpha(), nodes: sim.nodes(), linkData: linkDatasets, id: pulseId, tickId: tickId });
}

function reportEnd() {
  postMessage({ action: 'end', alpha: sim.alpha(), nodes: sim.nodes(), linkData: linkDatasets });
}

export function getForce(_) {
  if (_ === null) return _;
  const f = ForceMap[_.force]();
  for (const p in _) {
    if (isFunction(f[p])) setForceParam(f[p], _[p]);
  }

  return f;
}

function setForceParam(f, v) {
  // deseralize accessor functions
  f(isObject(v) && v.fname ? function(d) { return d[v.fname]; } : v);
}
