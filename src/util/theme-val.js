module.exports = function(def, config, property, defaultVal) {
  if (def[property] !== undefined) {
    return def[property];
  } else if (config !== undefined && config[property] !== undefined) {
    return config[property];
  } else if (defaultVal !== undefined) {
    return defaultVal;
  }
  return undefined;
};