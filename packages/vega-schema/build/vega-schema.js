(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vega-scale')) :
  typeof define === 'function' && define.amd ? define(['exports', 'vega-scale'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.vega = {}, global.vega));
})(this, (function (exports, vegaScale) { 'use strict';

  const fontWeightEnum$1 = [null, 'normal', 'bold', 'lighter', 'bolder', '100', '200', '300', '400', '500', '600', '700', '800', '900', 100, 200, 300, 400, 500, 600, 700, 800, 900];
  const alignEnum$1 = ['left', 'right', 'center'];
  const baselineEnum$1 = ['top', 'middle', 'bottom', 'alphabetic', 'line-top', 'line-bottom'];
  const anchorEnum$1 = [null, 'start', 'middle', 'end'];
  const formatTypeEnum = ['number', 'time', 'utc'];
  const orientEnum$1 = ['left', 'right', 'top', 'bottom'];
  function oneOf(...types) {
    return {
      oneOf: types
    };
  }
  function allOf(...types) {
    return {
      allOf: types
    };
  }
  function anyOf(...types) {
    return {
      anyOf: types
    };
  }
  function not(schema) {
    return {
      not: schema
    };
  }
  function def(name) {
    return {
      $ref: '#/definitions/' + name
    };
  }
  function type(name, props) {
    return Object.assign({
      type: name
    }, props);
  }
  function enums(values, props) {
    return Object.assign({
      enum: values
    }, props);
  }
  function array(items, props) {
    return Object.assign({
      type: 'array',
      items: items || undefined
    }, props);
  }
  function object(properties, addl) {
    const p = {},
      r = [];
    for (const key in properties) {
      let k = key;
      if (key.startsWith('_') && key.endsWith('_')) {
        r.push(k = key.slice(1, -1));
      }
      p[k] = properties[key];
    }
    return {
      type: 'object',
      properties: p,
      required: r.length ? r : undefined,
      additionalProperties: arguments.length < 2 ? false : addl
    };
  }
  function required(...types) {
    return {
      type: 'object',
      required: types
    };
  }
  function pattern(obj, properties) {
    if (arguments.length === 1) {
      properties = obj;
      obj = {
        type: 'object',
        additionalProperties: false
      };
    }
    obj.patternProperties = properties;
    return obj;
  }
  function orSignal(obj) {
    return oneOf(obj, signalRef$1);
  }
  const anyType = {};
  const arrayType = type('array');
  const booleanType = type('boolean');
  const numberType = type('number');
  const objectType = type('object');
  const stringType = type('string');
  const nullType = type('null');
  const signalRef$1 = def('signalRef');
  const formatTypeType = enums(formatTypeEnum);
  const formatSpecifier = object({
    year: stringType,
    quarter: stringType,
    month: stringType,
    date: stringType,
    week: stringType,
    day: stringType,
    hours: stringType,
    minutes: stringType,
    seconds: stringType,
    milliseconds: stringType
  });
  const formatTypeOrSignal = {
    oneOf: [stringType, formatSpecifier, signalRef$1]
  };
  const textType = {
    oneOf: [stringType, {
      type: 'array',
      items: stringType
    }]
  };
  const alignValue = oneOf(enums(alignEnum$1), def('alignValue'));
  const anchorValue = oneOf(enums(anchorEnum$1), def('anchorValue'));
  const baselineValue = oneOf(enums(baselineEnum$1), def('baselineValue'));
  const booleanValue = oneOf(booleanType, def('booleanValue'));
  const colorValue$1 = oneOf(nullType, stringType, def('colorValue'));
  const dashArrayValue = oneOf(array(numberType), def('arrayValue'));
  const fontWeightValue = oneOf(enums(fontWeightEnum$1), def('fontWeightValue'));
  const numberValue = oneOf(numberType, def('numberValue'));
  const orientValue = oneOf(enums(orientEnum$1), def('orientValue'));
  const stringValue = oneOf(stringType, def('stringValue'));
  const booleanOrNumberOrSignal = oneOf(booleanType, numberType, signalRef$1);
  const booleanOrSignal$1 = def('booleanOrSignal');
  const arrayOrSignal$1 = def('arrayOrSignal');
  const numberOrSignal$1 = def('numberOrSignal');
  const stringOrSignal$1 = def('stringOrSignal');
  const textOrSignal$1 = def('textOrSignal');

  const autosizeEnum = ['pad', 'fit', 'fit-x', 'fit-y', 'none'];
  const containsEnum = ['content', 'padding'];
  const autosizeType = enums(autosizeEnum, {
    default: 'pad'
  });
  const autosize = oneOf(autosizeType, object({
    _type_: autosizeType,
    resize: booleanType,
    contains: enums(containsEnum)
  }), signalRef$1);
  var autosize$1 = {
    autosize
  };

  const timeIntervals = ['millisecond', 'second', 'minute', 'hour', 'day', 'week', 'month', 'year'];
  const rangeConstantEnum = ['width', 'height', 'symbol', 'category', 'ordinal', 'ramp', 'diverging', 'heatmap'];
  const sortOrderEnum = ['ascending', 'descending'];
  const rangeConstant = enums(rangeConstantEnum);
  const arrayAllTypes = array(oneOf(nullType, booleanType, stringType, numberType, signalRef$1, array(numberOrSignal$1)));
  const scheme = object({
    _scheme_: oneOf(stringType, array(oneOf(stringType, signalRef$1)), signalRef$1),
    count: numberOrSignal$1,
    extent: oneOf(array(numberOrSignal$1, {
      minItems: 2,
      maxItems: 2
    }), signalRef$1)
  });
  const schemeRange = oneOf(rangeConstant, arrayAllTypes, scheme, signalRef$1);
  const rangeStep = object({
    _step_: numberOrSignal$1
  });
  const bandRange = oneOf(rangeConstant, arrayAllTypes, rangeStep, signalRef$1);
  const scaleBinsRef = def('scaleBins');
  const scaleBins = oneOf(array(numberOrSignal$1), object({
    _step_: numberOrSignal$1,
    start: numberOrSignal$1,
    stop: numberOrSignal$1
  }), signalRef$1);
  const scaleInterpolateRef = def('scaleInterpolate');
  const scaleInterpolate = oneOf(stringType, signalRef$1, object({
    _type_: stringOrSignal$1,
    gamma: numberOrSignal$1
  }));
  const sortOrderRef$1 = def('sortOrder');
  const sortOrder = orSignal(enums(sortOrderEnum));
  const sortDomain = oneOf(booleanType, object({
    field: stringOrSignal$1,
    op: stringOrSignal$1,
    order: sortOrderRef$1
  }));
  const sortMultiDomain = oneOf(booleanType, object({
    op: enums(['count']),
    order: sortOrderRef$1
  }), object({
    _field_: stringOrSignal$1,
    _op_: enums(['count', 'min', 'max']),
    order: sortOrderRef$1
  }));
  const scaleDataRef = def('scaleData');
  const scaleData = oneOf(object({
    _data_: stringType,
    _field_: stringOrSignal$1,
    sort: sortDomain
  }), object({
    _data_: stringType,
    _fields_: array(stringOrSignal$1, {
      minItems: 1
    }),
    sort: sortMultiDomain
  }), object({
    _fields_: array(oneOf(object({
      _data_: stringType,
      _field_: stringOrSignal$1
    }), array(oneOf(stringType, numberType, booleanType)), signalRef$1), {
      minItems: 1
    }),
    sort: sortMultiDomain
  }));
  const scaleDomainProps = {
    _name_: stringType,
    domain: oneOf(arrayAllTypes, scaleDataRef, signalRef$1),
    domainMin: numberOrSignal$1,
    domainMax: numberOrSignal$1,
    domainMid: numberOrSignal$1,
    domainRaw: oneOf(nullType, arrayType, signalRef$1),
    reverse: booleanOrSignal$1,
    round: booleanOrSignal$1
  };
  const scaleBandProps = {
    range: bandRange,
    padding: numberOrSignal$1,
    paddingOuter: numberOrSignal$1,
    align: numberOrSignal$1,
    ...scaleDomainProps
  };
  const scaleContinuousProps = {
    range: schemeRange,
    bins: scaleBinsRef,
    interpolate: scaleInterpolateRef,
    clamp: booleanOrSignal$1,
    padding: numberOrSignal$1,
    ...scaleDomainProps
  };
  const scaleNumericProps = {
    nice: booleanOrNumberOrSignal,
    zero: booleanOrSignal$1,
    ...scaleContinuousProps
  };
  const scaleTemporalNice = oneOf(booleanType, enums(timeIntervals), object({
    _interval_: orSignal(enums(timeIntervals)),
    step: numberOrSignal$1
  }));
  const scale = oneOf(object({
    _type_: enums([vegaScale.Identity]),
    nice: booleanOrSignal$1,
    ...scaleDomainProps
  }), object({
    _type_: enums([vegaScale.Ordinal]),
    range: oneOf(rangeConstant, arrayAllTypes, scheme, scaleData, signalRef$1),
    interpolate: scaleInterpolateRef,
    domainImplicit: booleanOrSignal$1,
    ...scaleDomainProps
  }), object({
    _type_: enums([vegaScale.Band]),
    paddingInner: numberOrSignal$1,
    ...scaleBandProps
  }), object({
    _type_: enums([vegaScale.Point]),
    ...scaleBandProps
  }), object({
    _type_: enums([vegaScale.Quantize, vegaScale.Threshold]),
    range: schemeRange,
    interpolate: scaleInterpolateRef,
    nice: booleanOrNumberOrSignal,
    zero: booleanOrSignal$1,
    ...scaleDomainProps
  }), object({
    _type_: enums([vegaScale.Quantile]),
    range: schemeRange,
    interpolate: scaleInterpolateRef,
    ...scaleDomainProps
  }), object({
    _type_: enums([vegaScale.BinOrdinal]),
    bins: scaleBinsRef,
    range: schemeRange,
    interpolate: scaleInterpolateRef,
    ...scaleDomainProps
  }), object({
    _type_: enums([vegaScale.Time, vegaScale.UTC]),
    nice: scaleTemporalNice,
    ...scaleContinuousProps
  }), object({
    type: enums([vegaScale.Linear, vegaScale.Sqrt, vegaScale.Sequential]),
    ...scaleNumericProps
  }), object({
    _type_: enums([vegaScale.Log]),
    base: numberOrSignal$1,
    ...scaleNumericProps
  }), object({
    _type_: enums([vegaScale.Pow]),
    exponent: numberOrSignal$1,
    ...scaleNumericProps
  }), object({
    _type_: enums([vegaScale.Symlog]),
    constant: numberOrSignal$1,
    ...scaleNumericProps
  }));
  var scale$1 = {
    scale,
    scaleField: stringOrSignal$1,
    sortOrder,
    scaleBins,
    scaleInterpolate,
    scaleData
  };

  // types defined elsewhere
  const guideEncodeRef$2 = def('guideEncode');
  const overlapEnum = ['parity', 'greedy'];
  const labelOverlap = oneOf(booleanType, enums(overlapEnum), signalRef$1);
  const labelOverlapRef$1 = def('labelOverlap');
  const tickBandEnum = ['center', 'extent'];
  const tickBand = oneOf(enums(tickBandEnum), signalRef$1);
  const tickBandRef = def('tickBand');
  const tickCount = oneOf(numberType, enums(timeIntervals), object({
    _interval_: orSignal(enums(timeIntervals)),
    step: numberOrSignal$1
  }), signalRef$1);
  const tickCountRef$1 = def('tickCount');
  const axisOrientEnum = ['top', 'bottom', 'left', 'right'];
  const axisOrient = orSignal(enums(axisOrientEnum));
  const axis = object({
    _orient_: axisOrient,
    _scale_: stringType,
    format: formatTypeOrSignal,
    formatType: orSignal(formatTypeType),
    minExtent: numberValue,
    maxExtent: numberValue,
    offset: numberValue,
    position: numberValue,
    bandPosition: numberValue,
    translate: numberValue,
    values: arrayOrSignal$1,
    zindex: numberType,
    // ARIA CONFIG
    aria: booleanType,
    description: stringType,
    // TITLE CONFIG
    title: textOrSignal$1,
    titlePadding: numberValue,
    titleAlign: alignValue,
    titleAnchor: anchorValue,
    titleAngle: numberValue,
    titleX: numberValue,
    titleY: numberValue,
    titleBaseline: baselineValue,
    titleColor: colorValue$1,
    titleFont: stringValue,
    titleFontSize: numberValue,
    titleFontStyle: stringValue,
    titleFontWeight: fontWeightValue,
    titleLimit: numberValue,
    titleLineHeight: numberValue,
    titleOpacity: numberValue,
    // DOMAIN CONFIG
    domain: booleanType,
    domainCap: stringValue,
    domainColor: colorValue$1,
    domainDash: dashArrayValue,
    domainDashOffset: numberValue,
    domainOpacity: numberValue,
    domainWidth: numberValue,
    // TICK CONFIG
    ticks: booleanType,
    tickBand: tickBandRef,
    tickCap: stringValue,
    tickColor: colorValue$1,
    tickDash: dashArrayValue,
    tickDashOffset: numberValue,
    tickOffset: numberValue,
    tickOpacity: numberValue,
    tickRound: booleanValue,
    tickSize: numberValue,
    tickWidth: numberValue,
    tickCount: tickCountRef$1,
    tickExtra: booleanOrSignal$1,
    tickMinStep: numberOrSignal$1,
    // GRID CONFIG
    grid: booleanType,
    gridScale: stringType,
    gridCap: stringValue,
    gridColor: colorValue$1,
    gridDash: dashArrayValue,
    gridDashOffset: numberValue,
    gridOpacity: numberValue,
    gridWidth: numberValue,
    // LABEL CONFIG
    labels: booleanType,
    labelAlign: alignValue,
    labelBaseline: baselineValue,
    labelBound: booleanOrNumberOrSignal,
    labelFlush: booleanOrNumberOrSignal,
    labelFlushOffset: numberOrSignal$1,
    labelOverlap: labelOverlapRef$1,
    labelAngle: numberValue,
    labelColor: colorValue$1,
    labelFont: stringValue,
    labelFontSize: numberValue,
    labelFontWeight: fontWeightValue,
    labelFontStyle: stringValue,
    labelLimit: numberValue,
    labelLineHeight: numberValue,
    labelOpacity: numberValue,
    labelOffset: numberValue,
    labelPadding: numberValue,
    labelSeparation: numberOrSignal$1,
    // CUSTOMIZED ENCODERS
    encode: object({
      axis: guideEncodeRef$2,
      ticks: guideEncodeRef$2,
      labels: guideEncodeRef$2,
      title: guideEncodeRef$2,
      grid: guideEncodeRef$2,
      domain: guideEncodeRef$2
    })
  });
  var axis$1 = {
    axis,
    labelOverlap,
    tickBand,
    tickCount
  };

  const background = stringOrSignal$1;
  var background$1 = {
    background
  };

  const Checkbox = 'checkbox',
    Radio = 'radio',
    Select = 'select',
    Range = 'range';
  const element = stringType;
  const elementRef = def('element');
  const bind = oneOf(object({
    _input_: enums([Checkbox]),
    element: elementRef,
    debounce: numberType,
    name: stringType
  }), object({
    _input_: enums([Radio, Select]),
    element: elementRef,
    _options_: arrayType,
    labels: array(stringType),
    debounce: numberType,
    name: stringType
  }), object({
    _input_: enums([Range]),
    element: elementRef,
    min: numberType,
    max: numberType,
    step: numberType,
    debounce: numberType,
    name: stringType
  }), object({
    _input_: not(enums([Checkbox, Radio, Range, Select])),
    element: elementRef,
    debounce: numberType,
    name: stringType
  }, true), object({
    _element_: elementRef,
    event: stringType,
    debounce: numberType
  }));
  var bind$1 = {
    bind,
    element
  };

  // types defined elsewhere
  const transformRef = def('transform');
  const onTriggerRef = def('onTrigger');
  const parseDef = oneOf(enums(['auto']), object(null, oneOf(enums(['boolean', 'number', 'date', 'string']), type('string', {
    pattern: '^(date|utc):.*$'
  }))), signalRef$1);
  const paramField = object({
    _field_: stringType,
    as: stringType
  });
  const dataFormat = anyOf(object({
    type: stringOrSignal$1,
    parse: parseDef
  }, undefined), object({
    type: enums(['json']),
    parse: parseDef,
    property: stringOrSignal$1,
    copy: booleanOrSignal$1
  }), object({
    _type_: enums(['csv', 'tsv']),
    header: array(stringType),
    parse: parseDef
  }), object({
    _type_: enums(['dsv']),
    _delimiter_: stringType,
    header: array(stringType),
    parse: parseDef
  }), oneOf(object({
    _type_: enums(['topojson']),
    _feature_: stringOrSignal$1,
    property: stringOrSignal$1
  }), object({
    _type_: enums(['topojson']),
    _mesh_: stringOrSignal$1,
    property: stringOrSignal$1,
    filter: enums(['interior', 'exterior', null])
  })));
  const dataProps = {
    _name_: stringType,
    transform: array(transformRef),
    on: onTriggerRef
  };
  const data = oneOf(object(dataProps), object({
    _source_: oneOf(stringType, array(stringType, {
      minItems: 1
    })),
    ...dataProps
  }), object({
    _url_: stringOrSignal$1,
    format: orSignal(dataFormat),
    async: booleanOrSignal$1,
    ...dataProps
  }), object({
    _values_: orSignal(anyType),
    format: orSignal(dataFormat),
    async: booleanOrSignal$1,
    ...dataProps
  }));
  var data$1 = {
    data,
    paramField
  };

  const blendEnum = [null, 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'];
  const fontWeightEnum = [null, 'normal', 'bold', 'lighter', 'bolder', '100', '200', '300', '400', '500', '600', '700', '800', '900', 100, 200, 300, 400, 500, 600, 700, 800, 900];
  const alignEnum = ['left', 'right', 'center'];
  const baselineEnum = ['top', 'middle', 'bottom', 'alphabetic'];
  const anchorEnum = ['start', 'middle', 'end'];
  const orientEnum = ['left', 'right', 'top', 'bottom'];
  const directionEnum = ['horizontal', 'vertical'];
  const strokeCapEnum = ['butt', 'round', 'square'];
  const strokeJoinEnum = ['miter', 'round', 'bevel'];
  function baseValueSchema(type, nullable) {
    type = Array.isArray(type) ? {
      enum: type
    } : type && type.oneOf ? type : {
      type: type
    };
    var modType = type.type === 'number' ? 'number' : 'string',
      valueType = nullable ? oneOf(type, nullType) : type;
    const valueRef = allOf(def(modType + 'Modifiers'), anyOf(oneOf(signalRef$1, object({
      _value_: valueType
    }, undefined), object({
      _field_: fieldRef
    }, undefined), object({
      _range_: oneOf(numberType, booleanType)
    }, undefined)), required('scale', 'value'), required('scale', 'band'), required('offset')));
    return valueRef;
  }
  function valueSchema(type, nullable) {
    const valueRef = baseValueSchema(type, nullable);
    return oneOf(array(allOf(ruleRef, valueRef)), valueRef);
  }
  const ruleRef = def('rule');
  const rule = object({
    test: stringType
  }, undefined);
  const fieldRef = def('field');
  const field = oneOf(stringType, signalRef$1, object({
    _datum_: fieldRef
  }), object({
    _group_: fieldRef,
    level: numberType
  }), object({
    _parent_: fieldRef,
    level: numberType
  }));
  const scaleRef = fieldRef;
  const stringModifiers = object({
    scale: scaleRef
  }, undefined);
  const numberModifiers = object({
    exponent: numberValue,
    mult: numberValue,
    offset: numberValue,
    round: type('boolean', {
      default: false
    }),
    scale: scaleRef,
    band: oneOf(numberType, booleanType),
    extra: booleanType
  }, undefined);

  // defined below
  const anyValueRef = def('anyValue');
  const arrayValueRef = def('arrayValue');
  const booleanValueRef = def('booleanValue');
  const colorValueRef = def('colorValue');
  const numberValueRef = def('numberValue');
  const stringValueRef$1 = def('stringValue');
  const textValueRef = def('textValue');
  const colorRGB = object({
    _r_: numberValueRef,
    _g_: numberValueRef,
    _b_: numberValueRef
  }, undefined);
  const colorHSL = object({
    _h_: numberValueRef,
    _s_: numberValueRef,
    _l_: numberValueRef
  }, undefined);
  const colorLAB = object({
    _l_: numberValueRef,
    _a_: numberValueRef,
    _b_: numberValueRef
  }, undefined);
  const colorHCL = object({
    _h_: numberValueRef,
    _c_: numberValueRef,
    _l_: numberValueRef
  }, undefined);
  const gradientStops = array(object({
    _offset_: numberType,
    _color_: stringType
  }));
  const linearGradient = object({
    _gradient_: enums(['linear']),
    id: stringType,
    x1: numberType,
    y1: numberType,
    x2: numberType,
    y2: numberType,
    _stops_: def('gradientStops')
  });
  const radialGradient = object({
    _gradient_: enums(['radial']),
    id: stringType,
    x1: numberType,
    y1: numberType,
    r1: numberType,
    x2: numberType,
    y2: numberType,
    r2: numberType,
    _stops_: def('gradientStops')
  });
  const baseColorValue = oneOf(baseValueSchema('string', true), object({
    _value_: def('linearGradient')
  }), object({
    _value_: def('radialGradient')
  }), object({
    _gradient_: scaleRef,
    start: array(numberType, {
      minItems: 2,
      maxItems: 2
    }),
    stop: array(numberType, {
      minItems: 2,
      maxItems: 2
    }),
    count: numberType
  }), object({
    _color_: oneOf(def('colorRGB'), def('colorHSL'), def('colorLAB'), def('colorHCL'))
  }));
  const colorValue = oneOf(array(allOf(ruleRef, def('baseColorValue'))), def('baseColorValue'));
  const encodeEntryRef$2 = def('encodeEntry');
  const encodeEntry = object({
    // Common Properties
    x: numberValueRef,
    x2: numberValueRef,
    xc: numberValueRef,
    width: numberValueRef,
    y: numberValueRef,
    y2: numberValueRef,
    yc: numberValueRef,
    height: numberValueRef,
    opacity: numberValueRef,
    fill: colorValueRef,
    fillOpacity: numberValueRef,
    stroke: colorValueRef,
    strokeOpacity: numberValueRef,
    strokeWidth: numberValueRef,
    strokeCap: def('strokeCapValue'),
    strokeDash: arrayValueRef,
    strokeDashOffset: numberValueRef,
    strokeJoin: def('strokeJoinValue'),
    strokeMiterLimit: numberValueRef,
    blend: def('blendValue'),
    cursor: stringValueRef$1,
    tooltip: anyValueRef,
    zindex: numberValueRef,
    description: stringValueRef$1,
    aria: booleanValueRef,
    // experimental aria properties, may change
    ariaRole: stringValueRef$1,
    ariaRoleDescription: stringValueRef$1,
    // Group-mark properties
    clip: booleanValueRef,
    strokeForeground: booleanValueRef,
    strokeOffset: numberValueRef,
    // Rect-mark properties
    cornerRadius: numberValueRef,
    cornerRadiusTopLeft: numberValueRef,
    cornerRadiusTopRight: numberValueRef,
    cornerRadiusBottomRight: numberValueRef,
    cornerRadiusBottomLeft: numberValueRef,
    // Symbol-, Path- and text-mark properties
    angle: numberValueRef,
    // Symbol-mark properties
    size: numberValueRef,
    shape: stringValueRef$1,
    // Path-mark properties
    path: stringValueRef$1,
    scaleX: numberValueRef,
    scaleY: numberValueRef,
    // Arc-mark properties
    innerRadius: numberValueRef,
    outerRadius: numberValueRef,
    startAngle: numberValueRef,
    endAngle: numberValueRef,
    padAngle: numberValueRef,
    // Area- and line-mark properties
    interpolate: stringValueRef$1,
    tension: numberValueRef,
    orient: def('directionValue'),
    defined: booleanValueRef,
    // Image-mark properties
    url: stringValueRef$1,
    align: def('alignValue'),
    baseline: def('baselineValue'),
    aspect: booleanValueRef,
    smooth: booleanValueRef,
    // Text-mark properties
    text: textValueRef,
    dir: stringValueRef$1,
    ellipsis: stringValueRef$1,
    limit: numberValueRef,
    lineBreak: stringValueRef$1,
    lineHeight: numberValueRef,
    dx: numberValueRef,
    dy: numberValueRef,
    radius: numberValueRef,
    theta: numberValueRef,
    font: stringValueRef$1,
    fontSize: numberValueRef,
    fontWeight: def('fontWeightValue'),
    fontStyle: stringValueRef$1
  }, true);
  const encode = pattern({
    '^.+$': encodeEntryRef$2
  });
  var encode$1 = {
    rule,
    encodeEntry,
    encode,
    field,
    stringModifiers,
    numberModifiers,
    anyValue: valueSchema(undefined),
    blendValue: valueSchema(blendEnum),
    numberValue: valueSchema('number'),
    stringValue: valueSchema('string'),
    textValue: valueSchema(textType),
    booleanValue: valueSchema('boolean'),
    arrayValue: valueSchema('array'),
    fontWeightValue: valueSchema(fontWeightEnum),
    anchorValue: valueSchema(anchorEnum),
    alignValue: valueSchema(alignEnum),
    baselineValue: valueSchema(baselineEnum),
    directionValue: valueSchema(directionEnum),
    orientValue: valueSchema(orientEnum),
    strokeCapValue: valueSchema(strokeCapEnum),
    strokeJoinValue: valueSchema(strokeJoinEnum),
    baseColorValue,
    colorRGB,
    colorHSL,
    colorLAB,
    colorHCL,
    colorValue,
    gradientStops,
    linearGradient,
    radialGradient
  };

  const expr = object({
    _expr_: stringType,
    as: stringType
  }, undefined);
  const exprString = stringType;
  var expr$1 = {
    expr,
    exprString
  };

  const layoutAlignEnum = ['all', 'each', 'none'];
  const layoutBoundsEnum = ['full', 'flush'];
  const layoutTitleAnchorEnum = ['start', 'end'];
  const layoutAlign = oneOf(enums(layoutAlignEnum), signalRef$1);
  const layoutTitleAnchor = oneOf(enums(layoutTitleAnchorEnum), signalRef$1);
  const band = oneOf(numberOrSignal$1, nullType, object({
    row: numberOrSignal$1,
    column: numberOrSignal$1
  }));
  const layout = orSignal(object({
    align: oneOf(layoutAlign, object({
      row: layoutAlign,
      column: layoutAlign
    })),
    bounds: orSignal(enums(layoutBoundsEnum)),
    center: oneOf(booleanType, signalRef$1, object({
      row: booleanOrSignal$1,
      column: booleanOrSignal$1
    })),
    columns: numberOrSignal$1,
    padding: oneOf(numberType, signalRef$1, object({
      row: numberOrSignal$1,
      column: numberOrSignal$1
    })),
    offset: oneOf(numberType, signalRef$1, object({
      rowHeader: numberOrSignal$1,
      rowFooter: numberOrSignal$1,
      rowTitle: numberOrSignal$1,
      columnHeader: numberOrSignal$1,
      columnFooter: numberOrSignal$1,
      columnTitle: numberOrSignal$1
    })),
    headerBand: band,
    footerBand: band,
    titleBand: band,
    titleAnchor: oneOf(layoutTitleAnchor, object({
      row: layoutTitleAnchor,
      column: layoutTitleAnchor
    }))
  }));
  var layout$1 = {
    layout
  };

  // types defined elsewhere
  const encodeEntryRef$1 = def('encodeEntry');
  const styleRef$2 = def('style');
  const labelOverlapRef = def('labelOverlap');
  const tickCountRef = def('tickCount');
  const guideEncodeRef$1 = def('guideEncode');
  const guideEncode = pattern(object({
    name: stringType,
    interactive: type('boolean', {
      default: false
    }),
    style: styleRef$2
  }), {
    '^(?!interactive|name|style).+$': encodeEntryRef$1
  });
  const legendTypeEnum = ['gradient', 'symbol'];
  const legendDirectionEnum = ['vertical', 'horizontal'];
  const legendOrientEnum = ['none', 'left', 'right', 'top', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
  const legendProps = object({
    // LEGEND SCALES
    size: stringType,
    shape: stringType,
    fill: stringType,
    stroke: stringType,
    opacity: stringType,
    strokeDash: stringType,
    strokeWidth: stringType,
    // LEGEND TYPE
    type: enums(legendTypeEnum),
    direction: enums(legendDirectionEnum),
    orient: orSignal(enums(legendOrientEnum, {
      default: 'right'
    })),
    // LEGEND CONFIG
    tickCount: tickCountRef,
    tickMinStep: numberOrSignal$1,
    symbolLimit: numberOrSignal$1,
    values: arrayOrSignal$1,
    zindex: numberType,
    // LEGEND ARIA CONFIG
    aria: booleanType,
    description: stringType,
    // LEGEND GROUP CONFIG
    cornerRadius: numberValue,
    fillColor: colorValue$1,
    offset: numberValue,
    padding: numberValue,
    strokeColor: colorValue$1,
    legendX: numberValue,
    legendY: numberValue,
    // LEGEND TITLE CONFIG
    title: textOrSignal$1,
    titleAlign: alignValue,
    titleAnchor: anchorValue,
    titleBaseline: baselineValue,
    titleColor: colorValue$1,
    titleFont: stringValue,
    titleFontSize: numberValue,
    titleFontStyle: stringValue,
    titleFontWeight: fontWeightValue,
    titleLimit: numberValue,
    titleLineHeight: numberValue,
    titleOpacity: numberValue,
    titleOrient: orientValue,
    titlePadding: numberValue,
    // GRADIENT CONFIG
    gradientLength: numberOrSignal$1,
    gradientOpacity: numberValue,
    gradientStrokeColor: colorValue$1,
    gradientStrokeWidth: numberValue,
    gradientThickness: numberOrSignal$1,
    // SYMBOL LAYOUT CONFIG
    clipHeight: numberOrSignal$1,
    columns: numberOrSignal$1,
    columnPadding: numberOrSignal$1,
    rowPadding: numberOrSignal$1,
    gridAlign: layoutAlign,
    // SYMBOL CONFIG
    symbolDash: dashArrayValue,
    symbolDashOffset: numberValue,
    symbolFillColor: colorValue$1,
    symbolOffset: numberValue,
    symbolOpacity: numberValue,
    symbolSize: numberValue,
    symbolStrokeColor: colorValue$1,
    symbolStrokeWidth: numberValue,
    symbolType: stringValue,
    // LABEL CONFIG
    format: formatTypeOrSignal,
    formatType: orSignal(formatTypeType),
    labelAlign: alignValue,
    labelBaseline: baselineValue,
    labelColor: colorValue$1,
    labelFont: stringValue,
    labelFontSize: numberValue,
    labelFontStyle: stringValue,
    labelFontWeight: fontWeightValue,
    labelLimit: numberValue,
    labelOffset: numberValue,
    labelOpacity: numberValue,
    labelOverlap: labelOverlapRef,
    labelSeparation: numberOrSignal$1,
    // CUSTOMIZED ENCODERS
    encode: object({
      title: guideEncodeRef$1,
      labels: guideEncodeRef$1,
      legend: guideEncodeRef$1,
      entries: guideEncodeRef$1,
      symbols: guideEncodeRef$1,
      gradient: guideEncodeRef$1
    })
  });
  const legend = allOf(legendProps, anyOf(required('size'), required('shape'), required('fill'), required('stroke'), required('opacity'), required('strokeDash'), required('strokeWidth')));
  var legend$1 = {
    guideEncode,
    legend
  };

  // types defined elsewhere
  const sortOrderRef = def('sortOrder');
  const marktypeRef = def('marktype');
  const sortField = oneOf(def('scaleField'), def('expr'));
  const compareRef$1 = def('compare');
  const compare = oneOf(object({
    field: sortField,
    order: sortOrderRef
  }), object({
    field: array(sortField),
    order: array(sortOrderRef)
  }));
  const facetRef = def('facet');
  const facet = object({
    data: stringType,
    _facet_: oneOf(object({
      _name_: stringType,
      _data_: stringType,
      _field_: stringType
    }), object({
      _name_: stringType,
      _data_: stringType,
      // TODO revisit for signal support
      _groupby_: oneOf(stringType, array(stringType)),
      aggregate: object({
        cross: booleanType,
        fields: array(stringType),
        ops: array(stringType),
        as: array(stringType)
      })
    }))
  });
  const fromRef = def('from');
  const from = object({
    data: stringType
  });
  const markclipRef = def('markclip');
  const markclip = oneOf(booleanOrSignal$1, object({
    _path_: stringOrSignal$1
  }), object({
    _sphere_: stringOrSignal$1
  }));
  const styleRef$1 = def('style');
  const style = oneOf(stringType, array(stringType));
  const markRef = def('mark');
  const mark = object({
    _type_: marktypeRef,
    role: stringType,
    name: stringType,
    description: stringType,
    aria: booleanType,
    style: styleRef$1,
    key: stringType,
    clip: markclipRef,
    sort: compareRef$1,
    interactive: booleanOrSignal$1,
    encode: def('encode'),
    transform: array(def('transformMark')),
    on: def('onMarkTrigger')
  }, undefined);
  const markGroup = allOf(object({
    _type_: enums(['group']),
    from: oneOf(fromRef, facetRef)
  }, undefined), markRef, def('scope'));
  const markVisual = allOf(object({
    type: not(enums(['group'])),
    from: fromRef
  }, undefined), markRef);
  var mark$1 = {
    compare,
    from,
    facet,
    mark,
    markclip,
    markGroup,
    markVisual,
    style
  };

  var marktype = {
    marktype: stringType
  };

  // types defined elsewhere
  const exprStringRef$4 = def('exprString');
  const exprRef$1 = def('expr');
  const selectorRef = def('selector');
  const streamRef$1 = def('stream');
  const listenerRef = def('listener');
  const listener = oneOf(signalRef$1, object({
    _scale_: stringType
  }, undefined), streamRef$1);
  const onEvents = array(allOf(object({
    _events_: oneOf(selectorRef, listenerRef, array(listenerRef, {
      minItems: 1
    })),
    force: booleanType
  }, undefined), oneOf(object({
    _encode_: stringType
  }, undefined), object({
    _update_: oneOf(exprStringRef$4, exprRef$1, signalRef$1, object({
      _value_: anyType
    }, undefined))
  }, undefined))));
  var onEvents$1 = {
    listener,
    onEvents
  };

  // types defined elsewhere
  const exprStringRef$3 = def('exprString');
  const onTrigger = array(object({
    _trigger_: exprStringRef$3,
    insert: exprStringRef$3,
    remove: oneOf(booleanType, exprStringRef$3),
    toggle: exprStringRef$3,
    modify: exprStringRef$3,
    values: exprStringRef$3
  }));
  const onMarkTrigger = array(object({
    _trigger_: exprStringRef$3,
    modify: exprStringRef$3,
    values: exprStringRef$3
  }));
  var onTrigger$1 = {
    onTrigger,
    onMarkTrigger
  };

  const padding = oneOf(numberType, object({
    top: numberType,
    bottom: numberType,
    left: numberType,
    right: numberType
  }), signalRef$1);
  var padding$1 = {
    padding
  };

  const array2 = orSignal(array(numberOrSignal$1, {
    minItems: 2,
    maxItems: 2
  }));
  const array3 = orSignal(array(numberOrSignal$1, {
    minItems: 2,
    maxItems: 3
  }));
  const extent = orSignal(array(array2, {
    minItems: 2,
    maxItems: 2
  }));
  const projection = object({
    _name_: stringType,
    type: stringOrSignal$1,
    clipAngle: numberOrSignal$1,
    clipExtent: extent,
    scale: numberOrSignal$1,
    translate: array2,
    center: array2,
    rotate: array3,
    parallels: array2,
    precision: numberOrSignal$1,
    pointRadius: numberOrSignal$1,
    fit: oneOf(objectType, arrayType),
    extent: extent,
    size: array2
  }, true);
  var projection$1 = {
    projection
  };

  const scope = object({
    encode: def('encode'),
    layout: def('layout'),
    signals: array(def('signal')),
    data: array(def('data')),
    scales: array(def('scale')),
    projections: array(def('projection')),
    axes: array(def('axis')),
    legends: array(def('legend')),
    title: def('title'),
    marks: array(oneOf(def('markGroup'), def('markVisual'))),
    usermeta: objectType
  }, undefined);
  var scope$1 = {
    scope
  };

  const selector = stringType;
  var selector$1 = {
    selector
  };

  // types defined elsewhere
  const exprStringRef$2 = def('exprString');
  const onEventsRef = def('onEvents');
  const bindRef = def('bind');
  const ReservedNameEnum = ['parent', 'datum', 'event', 'item'];
  const signalRef = object({
    _signal_: stringType
  }, undefined);
  const arrayOrSignal = orSignal(arrayType);
  const booleanOrSignal = orSignal(booleanType);
  const numberOrSignal = orSignal(numberType);
  const stringOrSignal = orSignal(stringType);
  const textOrSignal = orSignal(textType);
  const signalNameRef = def('signalName');
  const signalName = type('string', not(enums(ReservedNameEnum)));
  const signalNew = object({
    _name_: signalNameRef,
    description: stringType,
    value: anyType,
    react: type('boolean', {
      default: true
    }),
    update: exprStringRef$2,
    on: onEventsRef,
    bind: bindRef
  });
  const signalInit = object({
    _name_: signalNameRef,
    description: stringType,
    value: anyType,
    _init_: exprStringRef$2,
    on: onEventsRef,
    bind: bindRef
  });
  const signalPush = object({
    _name_: signalNameRef,
    description: stringType,
    _push_: enums(['outer']),
    on: onEventsRef
  });
  const signal = oneOf(signalPush, signalNew, signalInit);
  var signal$1 = {
    signal,
    signalName,
    signalRef,
    arrayOrSignal,
    booleanOrSignal,
    numberOrSignal,
    stringOrSignal,
    textOrSignal
  };

  // types defined elsewhere
  const exprStringRef$1 = def('exprString');
  const streamRef = def('stream');
  const streamParams = object({
    between: array(streamRef, {
      minItems: 2,
      maxItems: 2
    }),
    marktype: stringType,
    markname: stringType,
    filter: oneOf(exprStringRef$1, array(exprStringRef$1, {
      minItems: 1
    })),
    throttle: numberType,
    debounce: numberType,
    consume: booleanType
  }, undefined);
  const streamEvents = object({
    _type_: stringType,
    source: stringType
  }, undefined);
  const stream = allOf(streamParams, oneOf(streamEvents, object({
    _stream_: streamRef
  }, undefined), object({
    _merge_: array(streamRef, {
      minItems: 1
    })
  }, undefined)));
  var stream$1 = {
    stream
  };

  // types defined elsewhere
  const guideEncodeRef = def('guideEncode');
  const encodeEntryRef = def('encodeEntry');
  const stringValueRef = def('stringValue');
  const styleRef = def('style');
  const titleOrientEnum = ['none', 'left', 'right', 'top', 'bottom'];
  const titleFrameEnum = ['group', 'bounds'];
  const titleEncode = pattern({
    '^(?!interactive|name|style).+$': encodeEntryRef
  });
  const title = oneOf(stringType, object({
    orient: orSignal(enums(titleOrientEnum, {
      default: 'top'
    })),
    anchor: anchorValue,
    frame: oneOf(enums(titleFrameEnum), stringValueRef),
    offset: numberValue,
    // ARIA CONFIG
    aria: booleanType,
    // SHARED TEXT CONFIG
    limit: numberValue,
    zindex: numberType,
    align: alignValue,
    angle: numberValue,
    baseline: baselineValue,
    dx: numberValue,
    dy: numberValue,
    // TITLE TEXT CONFIG
    text: textOrSignal$1,
    color: colorValue$1,
    font: stringValue,
    fontSize: numberValue,
    fontStyle: stringValue,
    fontWeight: fontWeightValue,
    lineHeight: numberValue,
    // SUBTITLE TEXT CONFIG
    subtitle: textOrSignal$1,
    subtitleColor: colorValue$1,
    subtitleFont: stringValue,
    subtitleFontSize: numberValue,
    subtitleFontStyle: stringValue,
    subtitleFontWeight: fontWeightValue,
    subtitleLineHeight: numberValue,
    subtitlePadding: numberOrSignal$1,
    // CUSTOM ENCODERS
    encode: anyOf(titleEncode,
    // deprecated! (v5.7.0)
    object({
      group: guideEncodeRef,
      title: guideEncodeRef,
      subtitle: guideEncodeRef
    })),
    // deprecated! (v5.7.0)
    name: stringType,
    interactive: booleanType,
    style: styleRef
  }));
  var title$1 = {
    title
  };

  // types defined elsewhere
  const compareRef = def('compare');
  const scaleFieldRef = def('scaleField');
  const paramFieldRef = def('paramField');
  const exprStringRef = def('exprString');
  const exprRef = def('expr');
  function req(key) {
    return '_' + key + '_';
  }
  function transformSchema(name, def) {
    function parameters(list) {
      list.forEach(param => {
        if (param.type === 'param') {
          const schema = {
            oneOf: param.params.map(subParameterSchema)
          };
          props[param.name] = param.array ? array(schema) : schema;
        } else if (param.params) {
          parameters(param.params);
        } else {
          const key = param.required ? req(param.name) : param.name;
          props[key] = parameterSchema(param);
        }
      });
    }
    const props = {
      _type_: enums([name]),
      signal: stringType
    };
    parameters(def.params || []);
    return object(props);
  }
  function parameterSchema(param) {
    let p = {};
    switch (param.type) {
      case 'projection':
      case 'data':
        p = stringType;
        break;
      case 'field':
        p = oneOf(scaleFieldRef, paramFieldRef, exprRef);
        break;
      case 'compare':
        p = compareRef;
        break;
      case 'enum':
        p = anyOf(enums(param.values), signalRef$1);
        break;
      case 'expr':
        p = exprStringRef;
        break;
      case 'string':
        p = anyOf(stringType, signalRef$1);
        break;
      // dates should fall through to number
      // values should be timestamps or date-valued signals
      case 'date':
      case 'number':
        p = anyOf(numberType, signalRef$1);
        break;
      case 'boolean':
        p = anyOf(booleanType, signalRef$1);
        break;
      case 'signal':
        p = signalRef$1;
        break;
    }
    if (param.expr) {
      (p.anyOf || p.oneOf || (p = oneOf(p)).oneOf).push(exprRef, paramFieldRef);
    }
    if (param.null) {
      (p.anyOf || p.oneOf || (p = oneOf(p)).oneOf).push(nullType);
    }
    if (param.array) {
      p = array(p);
      if (param.length != null) {
        p.minItems = p.maxItems = param.length;
      }
      p = oneOf(p, signalRef$1);
      if (param.array === 'nullable') {
        p.oneOf.push(nullType);
      }
    }
    if (param.default) {
      p.default = param.default;
    }
    return p;
  }
  function subParameterSchema(sub) {
    const props = {},
      key = sub.key;
    for (const name in key) {
      props[req(name)] = enums([key[name]]);
    }
    sub.params.forEach(param => {
      const key = param.required ? req(param.name) : param.name;
      props[key] = parameterSchema(param);
    });
    return object(props);
  }
  function transform (definitions) {
    const transforms = [],
      marks = [],
      defs = {
        transform: {
          oneOf: transforms
        },
        transformMark: {
          oneOf: marks
        }
      };
    for (let i = 0, n = definitions.length; i < n; ++i) {
      const d = definitions[i],
        name = d.type.toLowerCase(),
        key = name + 'Transform',
        ref = def(key),
        md = d.metadata;
      defs[key] = transformSchema(name, d);
      if (!(md.generates || md.changes)) marks.push(ref);
      transforms.push(ref);
    }
    return defs;
  }

  function extend(target, source) {
    for (const key in source) {
      target[key] = source[key];
    }
  }
  function addModule(schema, module) {
    extend(schema.definitions, module);
  }
  function schema (definitions) {
    const schema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'Vega Visualization Specification Language',
      definitions: {},
      type: 'object',
      allOf: [def('scope'), {
        properties: {
          $schema: type('string', {
            format: 'uri'
          }),
          config: objectType,
          description: stringType,
          width: numberOrSignal$1,
          height: numberOrSignal$1,
          padding: def('padding'),
          autosize: def('autosize'),
          background: def('background'),
          style: def('style')
        }
      }]
    };
    [autosize$1, axis$1, background$1, bind$1, data$1, encode$1, expr$1, layout$1, legend$1, mark$1, marktype, onEvents$1, onTrigger$1, padding$1, projection$1, scale$1, scope$1, selector$1, signal$1, stream$1, title$1, transform(definitions)].forEach(module => {
      addModule(schema, module);
    });
    return schema;
  }

  exports.schema = schema;

}));
