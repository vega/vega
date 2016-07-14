import {isObject, isNumber} from '../util';

export default function(spec) {
  return isObject(spec) ? spec
    : isNumber(spec) ? {top:spec, bottom:spec, left:spec, right:spec}
    : {top: 0, left: 0, bottom: 0, right: 0}; // TODO defaults
}