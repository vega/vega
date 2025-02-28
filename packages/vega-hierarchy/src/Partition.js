import HierarchyLayout from './HierarchyLayout.js';
import {inherits} from 'vega-util';
import {partition} from 'd3-hierarchy';

const Output = ['x0', 'y0', 'x1', 'y1', 'depth', 'children'];

/**
 * Partition tree layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to size nodes.
 */
export default function Partition(params) {
  HierarchyLayout.call(this, params);
}

Partition.Definition = {
  'type': 'Partition',
  'metadata': {'tree': true, 'modifies': true},
  'params': [
    { 'name': 'field', 'type': 'field' },
    { 'name': 'sort', 'type': 'compare' },
    { 'name': 'padding', 'type': 'number', 'default': 0 },
    { 'name': 'round', 'type': 'boolean', 'default': false },
    { 'name': 'size', 'type': 'number', 'array': true, 'length': 2 },
    { 'name': 'as', 'type': 'string', 'array': true, 'length': Output.length, 'default': Output }
  ]
};

inherits(Partition, HierarchyLayout, {
  layout: partition,
  params: ['size', 'round', 'padding'],
  fields: Output
});
