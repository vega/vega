module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: 'defaults and not IE 11'
        }
      ]
    ]
  };
};
