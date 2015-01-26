define(function(require, exports, module) {
  return {
    // aggregate:  require('./aggregate'),
    bin:        require('./Bin'),
    facet:      require('./Facet'),
    filter:     require('./Filter'),
    fold:       require('./Fold'),
    formula:    require('./Formula'),
    sort:       require('./Sort'),
    zip:        require('./Zip')
  };
});