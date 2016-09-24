import Transform from '../../Transform';
import TupleStore from './TupleStore';
import {createMeasure, compileMeasures} from './Measures';
import {ingest, replace} from '../../Tuple';
import {accessorName, array, error, inherits} from 'vega-util';

export var ValidAggregates = [
  'values', 'count', 'valid', 'missing', 'distinct',
  'min', 'max', 'argmin', 'argmax', 'sum', 'mean', 'average',
  'variance', 'variancep', 'stdev', 'stdevp', 'stderr',
  'median', 'q1', 'q3', 'ci0', 'ci1'
];

/**
 * Group-by aggregation operator.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<function(object): *>} params.groupby - An array of accessors to groupby.
 * @param {Array<function(object): *>} params.fields - An array of accessors to aggregate.
 * @param {Array<string>} params.ops - An array of strings indicating aggregation operations.
 * @param {Array<string>} [params.as] - An array of output field names for aggregated values.
 * @param {boolean} [params.drop=true] - A flag indicating if empty cells should be removed.
 */
export default function Aggregate(params) {
  Transform.call(this, null, params);

  this._adds = []; // array of added output tuples
  this._mods = []; // array of modified output tuples
  this._alen = 0;  // number of active added tuples
  this._mlen = 0;  // number of active modified tuples
  this._drop = true; // should empty aggregation cells be removed

  this._dims = [];   // group-by dimension accessors
  this._dnames = []; // group-by dimension names

  this._measures = []; // collection of aggregation monoids
  this._countOnly = false; // flag indicating only count aggregation
  this._counts = null; // collection of count fields
  this._prev = null;   // previous aggregation cells

  this._inputs = null;  // array of dependent input tuple field names
  this._outputs = null; // array of output tuple field names
}

var prototype = inherits(Aggregate, Transform);

prototype.transform = function(_, pulse) {
  var aggr = this,
      out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      mod;

  this.stamp = out.stamp;

  if (this.value && ((mod = _.modified()) || pulse.modified(this._inputs))) {
    this._prev = this.value;
    this.value = mod ? this.init(_) : {};
    pulse.visit(pulse.SOURCE, function(t) { aggr.add(t); });
  } else {
    this.value = this.value || this.init(_);
    pulse.visit(pulse.REM, function(t) { aggr.rem(t); });
    pulse.visit(pulse.ADD, function(t) { aggr.add(t); });
  }

  // Indicate output fields and return aggregate tuples.
  out.modifies(this._outputs);

  aggr._drop = _.drop !== false;
  return aggr.changes(out);
};

prototype.init = function(_) {
  // initialize input and output fields
  var inputs = (this._inputs = []),
      outputs = (this._outputs = []),
      inputMap = {};

  function inputVisit(get) {
    var fields = get.fields, i = 0, n = fields.length, f;
    for (; i<n; ++i) {
      if (!inputMap[f=fields[i]]) {
        inputMap[f] = 1;
        inputs.push(f);
      }
    }
  }

  // initialize group-by dimensions
  this._dims = array(_.groupby);
  this._dnames = this._dims.map(function(d) {
    var dname = accessorName(d)
    return (inputVisit(d), outputs.push(dname), dname);
  });
  this.cellkey = _.key ? _.key
    : this._dims.length === 0 ? function() { return ''; }
    : this._dims.length === 1 ? this._dims[0]
    : cellkey;

  // initialize aggregate measures
  this._countOnly = true;
  this._counts = [];
  this._measures = [];

  var fields = _.fields || [null],
      ops = _.ops || ['count'],
      as = _.as || [],
      n = fields.length,
      map = {},
      field, op, m, mname, outname, i;

  if (n !== ops.length) {
    error('Unmatched number of fields and aggregate ops.');
  }

  for (i=0; i<n; ++i) {
    field = fields[i];
    op = ops[i];

    if (field == null && op !== 'count') {
      error('Null aggregate field specified.');
    }
    mname = accessorName(field);
    outname = measureName(op, mname, as[i]);
    outputs.push(outname);

    if (op === 'count') {
      this._counts.push(outname);
      continue;
    }

    m = map[mname];
    if (!m) {
      inputVisit(field);
      m = (map[mname] = []);
      m.field = field;
      this._measures.push(m);
    }

    if (op !== 'count') this._countOnly = false;
    m.push(createMeasure(op, outname));
  }

  this._measures = this._measures.map(function(m) {
    return compileMeasures(m, m.field);
  });

  return {}; // aggregation cells (this.value)
};

function measureName(op, mname, as) {
  return as || (op + (!mname ? '' : '_' + mname));
}

// -- Cell Management -----

function cellkey(x) {
  var d = this._dims,
      n = d.length, i,
      k = String(d[0](x));

  for (i=1; i<n; ++i) {
    k += '|' + d[i](x);
  }

  return k;
}

prototype.cellkey = cellkey;

prototype.cell = function(key, t) {
  var cell = this.value[key];
  if (!cell) {
    cell = this.value[key] = this.newcell(key, t);
    this._adds[this._alen++] = cell;
  } else if (cell.num === 0 && this._drop && cell.stamp < this.stamp) {
    cell.stamp = this.stamp;
    this._adds[this._alen++] = cell;
  } else if (cell.stamp < this.stamp) {
    cell.stamp = this.stamp;
    this._mods[this._mlen++] = cell;
  }
  return cell;
};

prototype.newcell = function(key, t) {
  var cell = {
    key:   key,
    num:   0,
    agg:   null,
    tuple: this.newtuple(t, this._prev && this._prev[key]),
    stamp: this.stamp,
    store: false
  };

  if (!this._countOnly) {
    var measures = this._measures,
        n = measures.length, i;

    cell.agg = Array(n);
    for (i=0; i<n; ++i) {
      cell.agg[i] = new measures[i](cell, cell.tuple);
    }
  }

  if (cell.store) {
    cell.data = new TupleStore();
  }

  return cell;
};

prototype.newtuple = function(t, p) {
  var names = this._dnames,
      dims = this._dims,
      x = {}, i, n;

  for (i=0, n=dims.length; i<n; ++i) {
    x[names[i]] = dims[i](t);
  }

  return p ? replace(p.tuple, x) : ingest(x);
};

// -- Process Tuples -----

prototype.add = function(t) {
  var key = this.cellkey(t),
      cell = this.cell(key, t),
      agg, i, n;

  cell.num += 1;
  if (this._countOnly) return;

  if (cell.store) cell.data.add(t);

  agg = cell.agg;
  for (i=0, n=agg.length; i<n; ++i) {
    agg[i].add(agg[i].get(t), t);
  }
};

prototype.rem = function(t) {
  var key = this.cellkey(t),
      cell = this.cell(key, t),
      agg, i, n;

  cell.num -= 1;
  if (this._countOnly) return;

  if (cell.store) cell.data.rem(t);

  agg = cell.agg;
  for (i=0, n=agg.length; i<n; ++i) {
    agg[i].rem(agg[i].get(t), t);
  }
};

prototype.celltuple = function(cell) {
  var tuple = cell.tuple,
      counts = this._counts,
      agg, i, n;

  // consolidate stored values
  if (cell.store) {
    cell.data.values();
  }

  // update tuple properties
  for (i=0, n=counts.length; i<n; ++i) {
    tuple[counts[i]] = cell.num;
  }
  if (!this._countOnly) {
    agg = cell.agg;
    for (i=0, n=agg.length; i<n; ++i) {
      agg[i].set();
    }
  }

  return tuple;
};

prototype.changes = function(out) {
  var adds = this._adds,
      mods = this._mods,
      prev = this._prev,
      drop = this._drop,
      add = out.add,
      rem = out.rem,
      mod = out.mod,
      cell, key, i, n;

  if (prev) for (key in prev) {
    rem.push(prev[key].tuple);
  }

  for (i=0, n=this._alen; i<n; ++i) {
    add.push(this.celltuple(adds[i]));
    adds[i] = null; // for garbage collection
  }

  for (i=0, n=this._mlen; i<n; ++i) {
    cell = mods[i];
    (cell.num === 0 && drop ? rem : mod).push(this.celltuple(cell));
    mods[i] = null; // for garbage collection
  }

  this._alen = this._mlen = 0; // reset list of active cells
  this._prev = null;
  return out;
};
