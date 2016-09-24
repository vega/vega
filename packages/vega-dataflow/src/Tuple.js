var TUPLE_ID = 1;

/**
 * Resets the internal tuple id counter to zero.
 */
function reset() {
  TUPLE_ID = 1;
}

/**
 * Returns the id of a tuple.
 * @param {Tuple} t - The input tuple.
 * @return the tuple id.
 */
function tupleid(t) {
  return t._id;
}

/**
 * Copy the values of one tuple to another (ignoring id and prev fields).
 * @param {Tuple} t - The tuple to copy from.
 * @param {Tuple} c - The tuple to write to.
 * @return The re-written tuple, same as the argument 'c'.
 */
function copy(t, c) {
  for (var k in t) {
    if (k !== '_id') c[k] = t[k];
  }
  return c;
}

/**
 * Ingest an object or value as a data tuple.
 * If the input value is an object, an id field will be added to it. For
 * efficiency, the input object is modified directly. A copy is not made.
 * If the input value is a literal, it will be wrapped in a new object
 * instance, with the value accessible as the 'data' property.
 * @param datum - The value to ingest.
 * @return {Tuple} The ingested data tuple.
 */
function ingest(datum) {
  var tuple = (datum === Object(datum)) ? datum : {data: datum};
  if (!tuple._id) tuple._id = ++TUPLE_ID;
  return tuple;
}

/**
 * Given a source tuple, return a derived copy.
 * @param {object} t - The source tuple.
 * @return {object} The derived tuple.
 */
function derive(t) {
  return ingest(copy(t, {}));
}

/**
 * Rederive a derived tuple by copying values from the source tuple.
 * @param {object} t - The source tuple.
 * @param {object} d - The derived tuple.
 * @return {object} The derived tuple.
 */
function rederive(t, d) {
  return copy(t, d);
}

/**
 * Replace an existing tuple with a new tuple.
 * The existing tuple will become the previous value of the new.
 * @param {object} t - The existing data tuple.
 * @param {object} d - The new tuple that replaces the old.
 * @return {object} The new tuple.
 */
function replace(t, d) {
  return d._id = t._id, d;
}

export {
  reset, tupleid, ingest,
  replace, derive, rederive
};
