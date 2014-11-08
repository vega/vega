define(function(require, module, exports) {
  return {
    GROUP: "group",
    
    ENTER: 0,
    UPDATE: 1,
    EXIT: 2,

    DEFAULT_DATA: {"sentinel": 1},

    MODIFY_ADD: "add",
    MODIFY_REMOVE: "remove",
    MODIFY_TOGGLE: "toggle",
    MODIFY_CLEAR: "clear"
  }
});