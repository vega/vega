import {
  forceSimulation, forceCenter, forceCollide,
  forceManyBody, forceLink, forceX, forceY
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

let sim;

onmessage = function (event) {
  const message = event.data;
  switch (message.action) {
    case 'init':
      initialize(message.nodes);
      break;
    case 'restart':
      sim.restart();
      break;
    case 'stop':
      sim.stop();
      break;
    case 'nodes':
      sim.nodes(message.nodes);
      break;
    case 'tick':
      sim.tick(message.iters);
      reportTick();
      break;
    case 'param':
      sim[message.name](message.value);
      break;
    case 'force':
      sim.force(message.name, getForce(message.force));
      break;
  }

};

function initialize (nodes) {
  sim = forceSimulation(nodes)
    .on('tick', reportTick)
    .on('end', reportEnd);
}

function reportTick() {
  postMessage({ action: 'tick', alpha: sim.alpha(), nodes: sim.nodes() });
}

function reportEnd() {
  postMessage({ action: 'end', alpha: sim.alpha(), nodes: sim.nodes() });
}

export function getForce(_) {
  let f;
  if (_ === null) return _;

  f = ForceMap[_.force]();
  for (const p in _) {
    if (isFunction(f[p])) setForceParam(f[p], _[p], _);
  }

  return f;
}

function setForceParam(f, v) {
  f(isObject(v) ? function(d) { return d[v.fname]; } : v);
}
