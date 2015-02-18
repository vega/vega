define(function(require, exports, module) {
  return {
    bin:        require('./Bin'),
    facet:      require('./Facet'),
    filter:     require('./Filter'),
    fold:       require('./Fold'),
    formula:    require('./Formula'),
    sort:       require('./Sort'),
    stats:      require('./Stats'),
    unique:     require('./Unique'),
    zip:        require('./Zip')
  };
});