var dl = require('datalib'),
    u  = {};

dl.extend(u, require('./format'));
module.exports = dl.extend(u, dl);