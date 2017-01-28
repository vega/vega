import axisConfig from './guides/axis-config';
import axisDomain from './guides/axis-domain';
import axisGrid from './guides/axis-grid';
import axisTicks from './guides/axis-ticks';
import axisLabels from './guides/axis-labels';
import axisTitle from './guides/axis-title';
import guideGroup from './guides/guide-group';
import {AxisRole} from './marks/roles';
import parseMark from './mark';
import {encoder, extendEncode} from './encode/encode-util';
import {ref} from '../util';
import {Collect, AxisTicks} from '../transforms';

export default function(spec, scope) {
  var config = axisConfig(spec, scope),
      name = spec.name || undefined,
      encode = spec.encode || {},
      interactive = !!spec.interactive,
      datum, dataRef, ticksRef, size, group, axisEncode, children;

  // single-element data source for axis group
  datum = {
    orient: spec.orient,
    ticks:  spec.ticks  != null ? !!spec.ticks  : config.ticks,
    labels: spec.labels != null ? !!spec.labels : config.labels,
    grid:   spec.grid   != null ? !!spec.grid   : config.grid,
    domain: spec.domain != null ? !!spec.domain : config.domain,
    title:  spec.title  != null
  };
  dataRef = ref(scope.add(Collect({}, [datum])));

  // encoding properties for axis group item
  axisEncode = extendEncode({
    update: {
      range:        {signal: 'abs(span(range("' + spec.scale + '")))'},
      offset:       encoder(spec.offset || 0),
      position:     encoder(spec.position || 0),
      titlePadding: encoder(spec.titlePadding || config.titlePadding),
      minExtent:    encoder(spec.minExtent || config.minExtent),
      maxExtent:    encoder(spec.maxExtent || config.maxExtent)
    }
  }, encode.axis);

  // data source for axis ticks
  ticksRef = ref(scope.add(AxisTicks({
    scale:  scope.scaleRef(spec.scale),
    extra:  config.tickExtra,
    count:  scope.property(spec.tickCount),
    values: scope.property(spec.values),
    formatSpecifier: scope.property(spec.format)
  })));

  // generate axis marks
  children = [];

  // include axis gridlines if requested
  if (datum.grid) {
    children.push(axisGrid(spec, config, encode.grid, ticksRef));
  }

  // include axis ticks if requested
  if (datum.ticks) {
    size = spec.tickSize != null ? spec.tickSize : config.tickSize;
    children.push(axisTicks(spec, config, encode.ticks, ticksRef, size));
  }

  // include axis labels if requested
  if (datum.labels) {
    size = datum.ticks ? size : 0;
    children.push(axisLabels(spec, config, encode.labels, ticksRef, size));
  }

  // include axis domain path if requested
  if (datum.domain) {
    children.push(axisDomain(spec, config, encode.domain, dataRef));
  }

  // include axis title if defined
  if (datum.title) {
    children.push(axisTitle(spec, config, encode.title, dataRef));
  }

  // build axis specification
  group = guideGroup(AxisRole, name, dataRef, interactive, axisEncode, children);
  if (spec.zindex) group.zindex = spec.zindex;

  // parse axis specification
  return parseMark(group, scope);
}
