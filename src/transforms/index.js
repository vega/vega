define(function(require, exports, module) {
  return {
    aggregate:  require('./Aggregate'),
    bin:        require('./Bin'),
    facet:      require('./Facet'),
    filter:     require('./Filter'),
    fold:       require('./Fold'),
    formula:    require('./Formula'),
    sort:       require('./Sort'),
    unique:     require('./Unique'),
    zip:        require('./Zip')
  };
});