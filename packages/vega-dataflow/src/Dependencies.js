var deps = module.exports = {
  ALL: ['data', 'fields', 'scales', 'signals']
};
deps.ALL.forEach(function(k) { deps[k.toUpperCase()] = k; });
