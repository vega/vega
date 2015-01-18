define(function(require, exports, module) {
  return {
    aggregate:  require('./aggregate'),
    bin:        require('./bin'),
    facet:      require('./facet'),
    filter:     require('./filter'),
    fold:       require('./fold'),
    formula:    require('./formula'),
    sort:       require('./sort'),
    zip:        require('./zip')
  };
});