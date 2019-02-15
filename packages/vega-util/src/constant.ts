import isFunction from './isFunction';

function constant<T extends () => any>(_: T): T;
function constant<V>(_: V): () => V;
function constant(_: any): any {
  return isFunction(_)
    ? _
    : function() {
        return _;
      };
}

export default constant;
