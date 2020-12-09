var tape = require('tape'),
    vega = require('../');

tape('lruCache should cache items', t => {
  const cache = vega.lruCache();

  // test adding an entry
  cache.set('a', 'foo');
  t.equal(cache.has('a'), true);
  t.equal(cache.get('a'), 'foo');

  // test adding another entry
  cache.set('b', 'bar');
  t.equal(cache.has('b'), true);
  t.equal(cache.get('b'), 'bar');

  // test for non-existent entry
  t.equal(cache.has('c'), false);
  t.equal(cache.get('c'), undefined);

  // test adding a null value
  cache.set('c', null);
  t.equal(cache.has('c'), true);
  t.equal(cache.get('c'), null);

  // test overwriting a key value
  cache.set('c', 0);
  t.equal(cache.has('c'), true);
  t.equal(cache.get('c'), 0);

  // test cache clear
  cache.clear();
  t.equal(cache.has('a'), false);
  t.equal(cache.has('b'), false);
  t.equal(cache.has('c'), false);
  t.equal(cache.get('a'), undefined);
  t.equal(cache.get('b'), undefined);
  t.equal(cache.get('c'), undefined);

  t.end();
});

tape('lruCache should evict least recently used items', t => {
  const cache = vega.lruCache(2);

  cache.set('a', 1); // a in curr cache
  cache.set('b', 2); // a,b in curr cache
  t.equal(cache.has('a'), true);
  t.equal(cache.has('b'), true);

  cache.set('c', 3); // a,b in prev cache, c in curr cache
  t.equal(cache.has('a'), true);
  t.equal(cache.has('b'), true);
  t.equal(cache.has('c'), true);

  cache.get('a');    // a,c in curr cache, b is LRU item
  t.equal(cache.has('a'), true);
  t.equal(cache.has('b'), true);
  t.equal(cache.has('c'), true);

  cache.set('d', 4); // a,c in prev cache, d in curr cache
  t.equal(cache.has('a'), true);
  t.equal(cache.has('b'), false);
  t.equal(cache.has('c'), true);
  t.equal(cache.has('d'), true);

  cache.set('e', 5); // a,c in prev cache, d,e in curr cache
  t.equal(cache.has('a'), true);
  t.equal(cache.has('b'), false);
  t.equal(cache.has('c'), true);
  t.equal(cache.has('d'), true);
  t.equal(cache.has('e'), true);

  cache.get('a');    // d,e in prev cache, a in curr cache
  t.equal(cache.has('a'), true);
  t.equal(cache.has('b'), false);
  t.equal(cache.has('c'), false);
  t.equal(cache.has('d'), true);
  t.equal(cache.has('e'), true);

  t.end();
});
