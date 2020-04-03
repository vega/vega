import {Bottom, GuideLabelStyle, GuideTitleStyle, Top} from './constants';
import {extend, hasOwnProperty} from 'vega-util';
import { isSignal } from '../../util';
import { allAxisOrientSignalRef, xyAxisSignalRef } from './axis-util';

function getFallbackConfigValue(prop, axisOrientConfig, axisConfig, style) {
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
      orient = spec.orient,
      band = scope.scaleType(spec.scale) === 'band' && config.axisBand,
      xy,
      or;

  if (isSignal(spec.orient)) {
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
      xy[prop] = xyAxisSignalRef(
        'x',
        spec.orient.signal,
        getFallbackConfigValue(prop, axisX, config.axis, style),
        getFallbackConfigValue(prop, axisY, config.axis, style),
      );
    }

    or = {};
    for (prop of axisOrientConfigKeys) {
      or[prop] = allAxisOrientSignalRef(
        spec.orient.signal,
        getFallbackConfigValue(prop, axisTop, config.axis, style),
        getFallbackConfigValue(prop, axisBottom, config.axis, style),
        getFallbackConfigValue(prop, axisLeft, config.axis, style),
        getFallbackConfigValue(prop, axisRight, config.axis, style),
      );
    }
  } else {
    xy = (orient === Top || orient === Bottom) ? config.axisX : config.axisY;
    or = config['axis' + orient[0].toUpperCase() + orient.slice(1)];
  }

  var result = (xy || or || band)
    ? extend({}, config.axis, xy, or, band)
    : config.axis;
  
  return result;
}