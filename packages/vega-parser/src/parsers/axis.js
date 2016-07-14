import parseMark from './mark';
import {ref, entry, transform} from '../util';

import axisGroup from './guides/axisGroup';
import axisTicks from './guides/axisTicks';
import axisLabels from './guides/axisLabels';
import axisTitle from './guides/axisTitle';

import config from '../config'; // TODO customizable config

export default function(spec, scope) {
  var defRef, ticksRef, titleRef, group, children;

  defRef = ref(scope.add(entry('Collect', [{
    orient:       spec.orient,
    padding:      +spec.axisPadding || config.axisPadding,
    titlePadding: +spec.titlePadding || config.axisTitlePadding,
    minExtent:    +spec.minExtent || config.axisMinExtent,
    maxExtent:    +spec.maxExtent || config.axisMaxExtent
  }], {})));

  ticksRef = ref(scope.add(transform('AxisTicks', {
    scale:  scope.scaleRef(spec.scale),
    count:  scope.property(spec.ticks),
    values: scope.property(spec.values),
    formatSpecifier: scope.property(spec.formatSpecifier)
  })));

  children = [
    axisTicks(spec, config, ticksRef),
    axisLabels(spec, config, ticksRef)
  ];

  if (spec.title) {
    titleRef = ref(scope.add(entry('Collect', [{
      title: spec.title
    }], {})));
    children.push(axisTitle(spec, config, titleRef));
  }

  // TODO: domain, gridlines
  group = axisGroup(spec, config, defRef, children);

  return parseMark(group, scope);
}
