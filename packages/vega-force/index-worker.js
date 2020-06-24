// import { setup } from './src/Force';
import {
  forceSimulation, forceCenter, forceCollide,
  forceManyBody, forceLink, forceX, forceY
} from 'd3-force';

var sim;

onmessage = function (event) {
  var message = event.data;
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
