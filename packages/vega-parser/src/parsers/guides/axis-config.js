import {ifOrient, ifX} from './axis-util';
import {Bottom, GuideLabelStyle, GuideTitleStyle, Top} from './constants';
import {isSignal} from '../../util';
import {extend, hasOwnProperty} from 'vega-util';

function fallback(prop, axisOrientConfig, axisConfig, style) {
  var styleProp;
  if (hasOwnProperty(axisOrientConfig, prop)) {
    return axisOrientConfig[prop];
  }

  if (hasOwnProperty(axisOrientConfig, prop)) {
    return axisConfig[prop];
  }

  if (prop.startsWith('title')) {
    switch(prop) {
      case 'titleColor':
        styleProp = 'fill';
        break;
      case 'titleFont':
      case 'titleFontSize':
      case 'titleFontWeight':
        styleProp = prop[5].toLowerCase() + prop.slice(6);
    }

    return style[GuideTitleStyle][styleProp];
  } else if (prop.startsWith('label')) {
    switch(prop) {
      case 'labelColor':
        styleProp = 'fill';
        break;
      case 'labelFont':
      case 'labelFontSize':
        styleProp = prop[5].toLowerCase() + prop.slice(6);
    }
    return style[GuideLabelStyle][styleProp];
  }

  return null;
}

export default function(spec, scope) {
  var config = scope.config,
      style = config.style,
      axis = config.axis,
      band = scope.scaleType(spec.scale) === 'band' && config.axisBand,
      orient = spec.orient,
      xy,
      or;

  if (isSignal(orient)) {
    var axisX = config.axisX || {},
        axisY = config.axisY || {},
        axisTop = config.axisTop || {},
        axisBottom = config.axisBottom || {},
        axisLeft = config.axisLeft || {},
        axisRight = config.axisRight || {},
        axisXYConfigKeys = Array.from(new Set(
          Object.keys(axisX)
            .concat(Object.keys(axisY))
        )),
        axisOrientConfigKeys = Array.from(new Set(
          Object.keys(axisTop)
            .concat(Object.keys(axisBottom)
            .concat(Object.keys(axisLeft)
            .concat(Object.keys(axisRight))))
        ));


    xy = {};
    for (var prop of axisXYConfigKeys) {
      xy[prop] = ifX(
        orient,
        fallback(prop, axisX, axis, style),
        fallback(prop, axisY, axis, style),
      );
    }

    or = {};
    for (prop of axisOrientConfigKeys) {
      or[prop] = ifOrient(
        orient,
        fallback(prop, axisTop, axis, style),
        fallback(prop, axisBottom, axis, style),
        fallback(prop, axisLeft, axis, style),
        fallback(prop, axisRight, axis, style),
      );
    }
  } else {
    xy = (orient === Top || orient === Bottom) ? config.axisX : config.axisY;
    or = config['axis' + orient[0].toUpperCase() + orient.slice(1)];
  }

  var result = (xy || or || band)
    ? extend({}, axis, xy, or, band)
    : axis;

  return result;
}