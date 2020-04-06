export default function Heap(cmp) {
  let nodes = [];
  return {
    clear: () => (nodes = []),
    size: () => nodes.length,
    peek: () => nodes[0],
    push: x => {
      nodes.push(x);
      return siftdown(nodes, 0, nodes.length - 1, cmp);
    },
    pop: () => {
      const last = nodes.pop();
      let item;
      if (nodes.length) {
        item = nodes[0];
        nodes[0] = last;
        siftup(nodes, 0, cmp);
      } else {
        item = last;
      }
      return item;
    }
  };
}

function siftdown(array, start, idx, cmp) {
  let parent;
  let pidx;

  const item = array[idx];
  while (idx > start) {
    pidx = (idx - 1) >> 1;
    parent = array[pidx];
    if (cmp(item, parent) < 0) {
      array[idx] = parent;
      idx = pidx;
      continue;
    }
    break;
  }
  return (array[idx] = item);
}

function siftup(array, idx, cmp) {
  const start = idx;
  const end = array.length;
  const item = array[idx];
  let cidx = (idx << 1) + 1;
  let ridx;

  while (cidx < end) {
    ridx = cidx + 1;
    if (ridx < end && cmp(array[cidx], array[ridx]) >= 0) {
      cidx = ridx;
    }
    array[idx] = array[cidx];
    idx = cidx;
    cidx = (idx << 1) + 1;
  }
  array[idx] = item;
  return siftdown(array, start, idx, cmp);
}
