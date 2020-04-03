import { isArray, stringValue } from 'vega-util';
import { Bottom, Left, Top } from './constants';
import { isSignal} from '../../util';

export function resolveAxisOrientConditional(orient, axisOrientSignalRefOrValue, yes, no) {
  var orientArr = isArray(orient) ? orient : [orient];

  if (isSignal(axisOrientSignalRefOrValue)) {
    return axisOrientSignalRef(orientArr, axisOrientSignalRefOrValue.signal, yes, no);
  } else {
    return orientArr.includes(axisOrientSignalRefOrValue) ? yes : no;
  }
}

export function resolveXYAxisOrientConditional(xy, axisOrientSignalRefOrValue, yes, no) {
  if (isSignal(axisOrientSignalRefOrValue)) {
    return xyAxisSignalRef(xy, axisOrientSignalRefOrValue.signal, yes, no);
  } else {
    return axisOrientSignalRefOrValue === Top || axisOrientSignalRefOrValue === Bottom ? yes : no;
  }
}

export function xyAxisSignalRef(xy, axisOrientExpr, yes, no) {
  var yesExpr = exprFromValue(yes);
  var noExpr = exprFromValue(no);
  return {
    signal: `${xyAxisBooleanExpr(xy, axisOrientExpr)} ? (${yesExpr}) : (${noExpr})`
  };
}
  
export function xyAxisBooleanExpr(xy, axisOrientExpr) {
  return `${xy === 'x' ? '' : '!'}(indexof(["${Top}", "${Bottom}"], ${axisOrientExpr}) >= 0)`;
}

export function axisOrientSignalRef(orient, axisOrientExpr, yes, no) {
  var orientArrExpr = stringValue(isArray(orient) ? orient : [orient]);

  var yesExpr = exprFromValue(yes);
  var noExpr = exprFromValue(no);

  return {
    signal: `indexof(${orientArrExpr}, ${axisOrientExpr}) >= 0 ? (${yesExpr}) : (${noExpr})`
  };
}

export function allAxisOrientSignalRef(axisOrientExpr, top, bottom, left, right) {
  var topExpr = exprFromValue(top);
  var bottomExpr = exprFromValue(bottom);
  var leftExpr = exprFromValue(left);
  var rightExpr = exprFromValue(right);

  return {
    signal: `(${axisOrientExpr}) === "${Top}" ? (${topExpr}) : `
      + `(${axisOrientExpr}) === "${Bottom}" ? (${bottomExpr}) : `
      + `(${axisOrientExpr}) === "${Left}" ? (${leftExpr}) : (${rightExpr})`
  };
}

export function xyAxisConditionalEncoding(xy, axisOrientExpr, yes, no) {
  return [
    {
      test: xyAxisBooleanExpr(xy, axisOrientExpr),
      ...yes
    }
  ].concat(no || []);
}


export function exprFromValue(val) {
  return isSignal(val) ? val.signal : stringValue(val === undefined ? null : val);
}