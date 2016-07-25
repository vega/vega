import axisDomain from './guides/axisDomain';
import axisGrid from './guides/axisGrid';
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
      datum, defRef, ticksRef, titleRef, group, axisEncode, children;

  // single-element data source for axis group
  datum = {
    orient: spec.orient,
    domain: spec.domain != null ? !!spec.domain : true,
    grid:   spec.grid != null ? !!spec.grid : false,
    title:  !!spec.title
  };
  defRef = ref(scope.add(entry('Collect', [datum], {})));

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
  children = [
    axisTicks(spec, config, encode.ticks, ticksRef),
    axisLabels(spec, config, encode.labels, ticksRef)
  ];

  // include axis gridlines if requested
  if (datum.grid) {
    children.unshift(axisGrid(spec, config, encode.grid, ticksRef));
  }

  // include axis domain path if requested
  if (datum.domain) {
    children.push(axisDomain(spec, config, encode.domain, defRef));
  }

  // include axis title if defined
  if (datum.title) {
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
