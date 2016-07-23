import axisGroup from './guides/axisGroup';
import axisTicks from './guides/axisTicks';
import axisLabels from './guides/axisLabels';
import axisTitle from './guides/axisTitle';
import encoder from './guides/encoder';
import parseMark from './mark';
import {ref, entry, transform} from '../util';
import config from '../config'; // TODO customizable config

export default function(spec, scope) {
  var encode = spec.encode || {},
      defRef, ticksRef, titleRef, group, axisEncode, children;

  // single-element data source for axis group
  defRef = ref(scope.add(entry('Collect', [{orient: spec.orient}], {})));

  // encoding properties for axis group item
  axisEncode = {
    update: {
      offset:       encoder(spec.offset || 0),
      padding:      encoder(spec.axisPadding || config.axisPadding),
      titlePadding: encoder(spec.titlePadding || config.axisTitlePadding),
      minExtent:    encoder(spec.minExtent || config.axisMinExtent),
      maxExtent:    encoder(spec.maxExtent || config.axisMaxExtent)
    }
  };

  // data source for axis ticks
  ticksRef = ref(scope.add(transform('AxisTicks', {
    scale:  scope.scaleRef(spec.scale),
    count:  scope.property(spec.ticks),
    values: scope.property(spec.values),
    formatSpecifier: scope.property(spec.formatSpecifier)
  })));

  // generate axis marks
  // TODO: domain, gridlines
  children = [
    axisTicks(spec, config, encode.ticks, ticksRef),
    axisLabels(spec, config, encode.labels, ticksRef)
  ];

  // include axis title if defined
  if (spec.title) {
    titleRef = ref(scope.add(entry('Collect', [{
      title: spec.title
    }], {})));
    children.push(axisTitle(spec, config, encode.title, titleRef));
  }

  // build axis specification
  group = axisGroup(spec, config, defRef, axisEncode, children);

  // parse axis specification
  return parseMark(group, scope);
}
