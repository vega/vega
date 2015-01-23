define(function(require, exports, module) {
  return {
    // aggregate:  require('./aggregate'),
    // bin:        require('./bin'),
    facet:      require('./Facet'),
    filter:     require('./Filter'),
    fold:       require('./Fold'),
    formula:    require('./Formula'),
    sort:       require('./Sort'),
    zip:        require('./Zip')
  };
});