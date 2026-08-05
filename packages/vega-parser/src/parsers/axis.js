import {addEncoders, extendEncode} from './encode/util.js';
import axisConfig from './guides/axis-config.js';
import axisDomain from './guides/axis-domain.js';
import axisGrid from './guides/axis-grid.js';
import axisTicks from './guides/axis-ticks.js';
import axisLabels from './guides/axis-labels.js';
import axisTitle from './guides/axis-title.js';
import {Skip} from './guides/constants.js';
import guideGroup from './guides/guide-group.js';
import {lookup, tickBand} from './guides/guide-util.js';
import {AxisRole} from './marks/roles.js';
import parseMark from './mark.js';
import {AxisTicks, Collect} from '../transforms.js';
import {ref, value} from '../util.js';

export default function(spec, scope) {
  const config = axisConfig(spec, scope),
        encode = spec.encode || {},
        axisEncode = encode.axis || {},
        name = axisEncode.name || undefined,
        interactive = axisEncode.interactive,
        style = axisEncode.style,
        _ = lookup(spec, config),
        band = tickBand(_);

  // single-element data source for axis group
  const datum = {
    scale:  spec.scale,
    ticks:  !!_('ticks'),
    labels: !!_('labels'),
    grid:   !!_('grid'),
    domain: !!_('domain'),
    title:  spec.title != null
  };
  const dataRef = ref(scope.add(Collect({}, [datum])));

  // data source for axis ticks
  const ticksRef = ref(scope.add(AxisTicks({
    scale:   scope.scaleRef(spec.scale),
    extra:   scope.property(band.extra),
    count:   scope.objectProperty(spec.tickCount),
    values:  scope.objectProperty(spec.values),
    minstep: scope.property(spec.tickMinStep),
    formatType: scope.property(spec.formatType),
    formatSpecifier: scope.property(spec.format)
  })));

  // generate axis marks
  const children = [];
  let size;

  // include axis gridlines if requested
  if (datum.grid) {
    children.push(axisGrid(spec, config, encode.grid, ticksRef, band));
  }

  // include axis ticks if requested
  if (datum.ticks) {
    size = _('tickSize');
    children.push(axisTicks(spec, config, encode.ticks, ticksRef, size, band));
  }

  // include axis labels if requested
  if (datum.labels) {
    size = datum.ticks ? size : 0;
    children.push(axisLabels(spec, config, encode.labels, ticksRef, size, band));
  }

  // include axis domain path if requested
  if (datum.domain) {
    children.push(axisDomain(spec, config, encode.domain, dataRef));
  }

  // include axis title if defined
  if (datum.title) {
    children.push(axisTitle(spec, config, encode.title, dataRef));
  }

  // parse axis specification
  return parseMark(
    guideGroup({
      role:        AxisRole,
      from:        dataRef,
      encode:      extendEncode(buildAxisEncode(_, spec), axisEncode, Skip),
      marks:       children,
      aria:        _('aria'),
      description: _('description'),
      zindex:      _('zindex'),
      name,
      interactive,
      style
    }),
    scope
  );
}

function buildAxisEncode(_, spec) {
  const encode = {enter: {}, update: {}};

  addEncoders(encode, {
    orient:       _('orient'),
    offset:       _('offset') || 0,
    position:     value(spec.position, 0),
    titlePadding: _('titlePadding'),
    minExtent:    _('minExtent'),
    maxExtent:    _('maxExtent'),
    range:        {signal: `abs(span(range("${spec.scale}")))`},
    translate:    _('translate'),

    // accessibility support
    format:       spec.format,
    formatType:   spec.formatType
  });

  return encode;
}
