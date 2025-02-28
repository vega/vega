import {groupkey} from './util/AggregateKeys.js';
import {ValidAggregateOps, compileMeasures, createMeasure, measureName} from './util/AggregateOps.js';
import TupleStore from './util/TupleStore.js';
import {Transform, ingest, replace} from 'vega-dataflow';
import {accessorFields, accessorName, array, error, inherits} from 'vega-util';

/**
 * Group-by aggregation operator.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<function(object): *>} [params.groupby] - An array of accessors to groupby.
 * @param {Array<function(object): *>} [params.fields] - An array of accessors to aggregate.
 * @param {Array<string>} [params.ops] - An array of strings indicating aggregation operations.
 * @param {Array<number>} [params.aggregate_params] - An optional array of parameters for aggregation operations.
 * @param {Array<string>} [params.as] - An array of output field names for aggregated values.
 * @param {boolean} [params.cross=false] - A flag indicating that the full
 *   cross-product of groupby values should be generated, including empty cells.
 *   If true, the drop parameter is ignored and empty cells are retained.
 * @param {boolean} [params.drop=true] - A flag indicating if empty cells should be removed.
 */
export default function Aggregate(params) {
  Transform.call(this, null, params);

  this._adds = []; // array of added output tuples
  this._mods = []; // array of modified output tuples
  this._alen = 0;  // number of active added tuples
  this._mlen = 0;  // number of active modified tuples
  this._drop = true;   // should empty aggregation cells be removed
  this._cross = false; // produce full cross-product of group-by values

  this._dims = [];   // group-by dimension accessors
  this._dnames = []; // group-by dimension names

  this._measures = []; // collection of aggregation monoids
  this._countOnly = false; // flag indicating only count aggregation
  this._counts = null; // collection of count fields
  this._prev = null;   // previous aggregation cells

  this._inputs = null;  // array of dependent input tuple field names
  this._outputs = null; // array of output tuple field names
}

Aggregate.Definition = {
  'type': 'Aggregate',
  'metadata': {'generates': true, 'changes': true},
  'params': [
    { 'name': 'groupby', 'type': 'field', 'array': true },
    { 'name': 'ops', 'type': 'enum', 'array': true, 'values': ValidAggregateOps },
    { 'name': 'aggregate_params', 'type': 'number', 'null': true, 'array': true },
    { 'name': 'fields', 'type': 'field', 'null': true, 'array': true },
    { 'name': 'as', 'type': 'string', 'null': true, 'array': true },
    { 'name': 'drop', 'type': 'boolean', 'default': true },
    { 'name': 'cross', 'type': 'boolean', 'default': false },
    { 'name': 'key', 'type': 'field' }
  ]
};

inherits(Aggregate, Transform, {
  transform(_, pulse) {
    const aggr = this,
          out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
          mod = _.modified();

    aggr.stamp = out.stamp;

    if (aggr.value && (mod || pulse.modified(aggr._inputs, true))) {
      aggr._prev = aggr.value;
      aggr.value = mod ? aggr.init(_) : Object.create(null);
      pulse.visit(pulse.SOURCE, t => aggr.add(t));
    } else {
      aggr.value = aggr.value || aggr.init(_);
      pulse.visit(pulse.REM, t => aggr.rem(t));
      pulse.visit(pulse.ADD, t => aggr.add(t));
    }

    // Indicate output fields and return aggregate tuples.
    out.modifies(aggr._outputs);

    // Should empty cells be dropped?
    aggr._drop = _.drop !== false;

    // If domain cross-product requested, generate empty cells as needed
    // and ensure that empty cells are not dropped
    if (_.cross && aggr._dims.length > 1) {
      aggr._drop = false;
      aggr.cross();
    }

    if (pulse.clean() && aggr._drop) {
      out.clean(true).runAfter(() => this.clean());
    }

    return aggr.changes(out);
  },

  cross() {
    const aggr = this,
          curr = aggr.value,
          dims = aggr._dnames,
          vals = dims.map(() => ({})),
          n = dims.length;

    // collect all group-by domain values
    function collect(cells) {
      let key, i, t, v;
      for (key in cells) {
        t = cells[key].tuple;
        for (i=0; i<n; ++i) {
          vals[i][(v = t[dims[i]])] = v;
        }
      }
    }
    collect(aggr._prev);
    collect(curr);

    // iterate over key cross-product, create cells as needed
    function generate(base, tuple, index) {
      const name = dims[index],
          v = vals[index++];

      for (const k in v) {
        const key = base ? base + '|' + k : k;
        tuple[name] = v[k];
        if (index < n) generate(key, tuple, index);
        else if (!curr[key]) aggr.cell(key, tuple);
      }
    }
    generate('', {}, 0);
  },

  init(_) {
    // initialize input and output fields
    const inputs = (this._inputs = []),
          outputs = (this._outputs = []),
          inputMap = {};

    function inputVisit(get) {
      const fields = array(accessorFields(get)),
            n = fields.length;
      let i = 0, f;
      for (; i<n; ++i) {
        if (!inputMap[f=fields[i]]) {
          inputMap[f] = 1;
          inputs.push(f);
        }
      }
    }

    // initialize group-by dimensions
    this._dims = array(_.groupby);
    this._dnames = this._dims.map(d => {
      const dname = accessorName(d);
      inputVisit(d);
      outputs.push(dname);
      return dname;
    });
    this.cellkey = _.key ? _.key : groupkey(this._dims);

    // initialize aggregate measures
    this._countOnly = true;
    this._counts = [];
    this._measures = [];

    const fields = _.fields || [null],
          ops = _.ops || ['count'],
          aggregate_params = _.aggregate_params || [null],
          as = _.as || [],
          n = fields.length,
          map = {};
    let field, op, aggregate_param, m, mname, outname, i;

    if (n !== ops.length) {
      error('Unmatched number of fields and aggregate ops.');
    }

    for (i=0; i<n; ++i) {
      field = fields[i];
      op = ops[i];
      aggregate_param = aggregate_params[i] || null;

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
      m.push(createMeasure(op, aggregate_param, outname));
    }

    this._measures = this._measures.map(m => compileMeasures(m, m.field));

    return Object.create(null); // aggregation cells (this.value)
  },

  // -- Cell Management -----

  cellkey: groupkey(),

  cell(key, t) {
    let cell = this.value[key];
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
  },

  newcell(key, t) {
    const cell = {
      key:   key,
      num:   0,
      agg:   null,
      tuple: this.newtuple(t, this._prev && this._prev[key]),
      stamp: this.stamp,
      store: false
    };

    if (!this._countOnly) {
      const measures = this._measures,
            n = measures.length;

      cell.agg = Array(n);
      for (let i=0; i<n; ++i) {
        cell.agg[i] = new measures[i](cell);
      }
    }

    if (cell.store) {
      cell.data = new TupleStore();
    }

    return cell;
  },

  newtuple(t, p) {
    const names = this._dnames,
          dims = this._dims,
          n = dims.length,
          x = {};

    for (let i=0; i<n; ++i) {
      x[names[i]] = dims[i](t);
    }

    return p ? replace(p.tuple, x) : ingest(x);
  },

  clean() {
    const cells = this.value;
    for (const key in cells) {
      if (cells[key].num === 0) {
        delete cells[key];
      }
    }
  },

  // -- Process Tuples -----

  add(t) {
    const key = this.cellkey(t),
          cell = this.cell(key, t);

    cell.num += 1;
    if (this._countOnly) return;

    if (cell.store) cell.data.add(t);

    const agg = cell.agg;
    for (let i=0, n=agg.length; i<n; ++i) {
      agg[i].add(agg[i].get(t), t);
    }
  },

  rem(t) {
    const key = this.cellkey(t),
          cell = this.cell(key, t);

    cell.num -= 1;
    if (this._countOnly) return;

    if (cell.store) cell.data.rem(t);

    const agg = cell.agg;
    for (let i=0, n=agg.length; i<n; ++i) {
      agg[i].rem(agg[i].get(t), t);
    }
  },

  celltuple(cell) {
    const tuple = cell.tuple,
          counts = this._counts;

    // consolidate stored values
    if (cell.store) {
      cell.data.values();
    }

    // update tuple properties
    for (let i=0, n=counts.length; i<n; ++i) {
      tuple[counts[i]] = cell.num;
    }
    if (!this._countOnly) {
      const agg = cell.agg;
      for (let i=0, n=agg.length; i<n; ++i) {
        agg[i].set(tuple);
      }
    }

    return tuple;
  },

  changes(out) {
    const adds = this._adds,
          mods = this._mods,
          prev = this._prev,
          drop = this._drop,
          add = out.add,
          rem = out.rem,
          mod = out.mod;

    let cell, key, i, n;

    if (prev) for (key in prev) {
      cell = prev[key];
      if (!drop || cell.num) rem.push(cell.tuple);
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
  }
});
