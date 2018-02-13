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
import {Skip} from './guides/constants';
import {ref, value} from '../util';
import {Collect, AxisTicks} from '../transforms';

export default function(spec, scope) {
  var config = axisConfig(spec, scope),
      encode = spec.encode || {},
      axisEncode = encode.axis || {},
      name = axisEncode.name || undefined,
      interactive = axisEncode.interactive,
      style = axisEncode.style,
      datum, dataRef, ticksRef, size, group, children;

  // single-element data source for axis group
  datum = {
    orient: spec.orient,
    ticks:  !!value(spec.ticks, config.ticks),
    labels: !!value(spec.labels, config.labels),
    grid:   !!value(spec.grid, config.grid),
    domain: !!value(spec.domain, config.domain),
    title:  !!value(spec.title, false)
  };
  dataRef = ref(scope.add(Collect({}, [datum])));

  // encoding properties for axis group item
  axisEncode = extendEncode({
    update: {
      range:        {signal: 'abs(span(range("' + spec.scale + '")))'},
      offset:       encoder(value(spec.offset, 0)),
      position:     encoder(value(spec.position, 0)),
      titlePadding: encoder(value(spec.titlePadding, config.titlePadding)),
      minExtent:    encoder(value(spec.minExtent, config.minExtent)),
      maxExtent:    encoder(value(spec.maxExtent, config.maxExtent))
    }
  }, encode.axis, Skip);

  // data source for axis ticks
  ticksRef = ref(scope.add(AxisTicks({
    scale:  scope.scaleRef(spec.scale),
    extra:  config.tickExtra,
    count:  scope.objectProperty(spec.tickCount),
    values: scope.objectProperty(spec.values),
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
    size = value(spec.tickSize, config.tickSize);
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
  group = guideGroup(AxisRole, style, name, dataRef, interactive, axisEncode, children);
  if (spec.zindex) group.zindex = spec.zindex;

  // parse axis specification
  return parseMark(group, scope);
}
