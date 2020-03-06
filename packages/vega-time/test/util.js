module.exports = {
  local: function(y, m, d, H, M, S, L) {
    return new Date(y, m||0, d||1, H||0, M||0, S||0, L||0);
  },
  utc: function(y, m, d, H, M, S, L) {
    return new Date(Date.UTC(y, m||0, d||1, H||0, M||0, S||0, L||0));
  }
};
