/**
 * Visit array entries in fixed-size batches, giving a cooperative scheduler
 * the opportunity to yield to the event loop between batches. The scheduler
 * check is performed per batch rather than per entry to keep it cheap.
 * @param {Array} array - The array of entries to visit.
 * @param {function(*, number, Array)} visitor - Visitor invoked per entry.
 * @param {object} scheduler - A cooperative scheduler exposing shouldYield
 *   and yield methods.
 * @param {number} batch - The number of entries to visit per batch.
 * @return {Promise} - A promise that resolves once all entries are visited.
 */
export default async function visitChunked(array, visitor, scheduler, batch) {
  const n = array.length;

  for (let i = 0; i < n; i += batch) {
    if (i > 0 && scheduler.shouldYield()) await scheduler.yield();

    const stop = Math.min(n, i + batch);
    for (let j = i; j < stop; ++j) visitor(array[j], j, array);
  }
}
