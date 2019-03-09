import {
  array, enums, object, oneOf, orSignal, ref,
  arrayType, nullType, booleanType, numberType, stringType, signalRef,
  stringOrSignal, numberOrSignal, booleanOrSignal, booleanOrNumberOrSignal
} from './util';

import {
  Linear, Log, Pow, Sqrt, Symlog, Time, UTC, Sequential,
  Quantile, Quantize, Threshold, Identity,
  Ordinal, Point, Band, BinOrdinal
} from 'vega-scale';

export const timeIntervals = [
  'millisecond',
  'second',
  'minute',
  'hour',
  'day',
  'week',
  'month',
  'year'
];

export const rangeConstantEnum = [
  'width',
  'height',
  'symbol',
  'category',
  'ordinal',
  'ramp',
  'diverging',
  'heatmap'
];

export const sortOrderEnum = [
  'ascending',
  'descending'
];

const rangeConstant = enums(rangeConstantEnum);

const arrayAllTypes = array(oneOf(
  nullType,
  booleanType,
  stringType,
  numberType,
  signalRef,
  array(numberOrSignal)
));

const scheme = object({
  _scheme_: oneOf(
    stringType,
    array(oneOf(stringType, signalRef)), signalRef),
  count: numberOrSignal,
  extent: oneOf(array(numberOrSignal, {numItems: 2}), signalRef)
});

const schemeRange = oneOf(
  rangeConstant,
  arrayAllTypes,
  scheme,
  signalRef
);

const rangeStep = object({
  _step_: numberOrSignal
});

const bandRange = oneOf(
  rangeConstant,
  arrayAllTypes,
  rangeStep,
  signalRef
);

const scaleBinsRef = ref('scaleBins');
const scaleBins = oneOf(
  array(numberOrSignal),
  object({
    _step_: numberOrSignal,
    start: numberOrSignal,
    stop: numberOrSignal
  }),
  signalRef
);

const scaleInterpolateRef = ref('scaleInterpolate');
const scaleInterpolate = oneOf(
  stringType,
  signalRef,
  object({
    _type_: stringOrSignal,
    gamma: numberOrSignal
  })
);

const sortOrderRef = ref('sortOrder');
const sortOrder = orSignal(enums(sortOrderEnum));

const sortDomain = oneOf(
  booleanType,
  object({
    field: stringOrSignal,
    op: stringOrSignal,
    order: sortOrderRef
  })
);

const sortMultiDomain = oneOf(
  booleanType,
  object({op: enums(['count']), order: sortOrderRef})
);

const scaleDataRef = ref('scaleData');
const scaleData = oneOf(
  object({
    _data_: stringType,
    _field_: stringOrSignal,
    sort: sortDomain
  }),
  object({
    _data_: stringType,
    _fields_: array(stringOrSignal, {minItems: 1}),
    sort: sortMultiDomain
  }),
  object({
    _fields_: array(
      oneOf(
        object({_data_: stringType, _field_: stringOrSignal}),
        array(oneOf(stringType, numberType, booleanType)),
        signalRef
      ),
      {minItems: 1}
    ),
    sort: sortMultiDomain
  })
);

const scaleDomainProps = {
  _name_: stringType,
  domain: oneOf(arrayAllTypes, scaleDataRef, signalRef),
  domainMin: numberOrSignal,
  domainMax: numberOrSignal,
  domainMid: numberOrSignal,
  domainRaw: oneOf(nullType, arrayType, signalRef),
  reverse: booleanOrSignal,
  round: booleanOrSignal
};

const scaleBandProps = {
  range: bandRange,
  padding: numberOrSignal,
  paddingOuter: numberOrSignal,
  align: numberOrSignal,
  ...scaleDomainProps
};

const scaleContinuousProps = {
  range: schemeRange,
  bins: scaleBinsRef,
  interpolate: scaleInterpolateRef,
  clamp: booleanOrSignal,
  padding: numberOrSignal,
  ...scaleDomainProps
};

const scaleNumericProps = {
  nice: booleanOrNumberOrSignal,
  zero: booleanOrSignal,
  ...scaleContinuousProps
};

const scaleTemporalNice = oneOf(
  booleanType,
  enums(timeIntervals),
  object({
    _interval_: orSignal(enums(timeIntervals)),
    step: numberOrSignal
  })
);

const scale = oneOf(
  object({
    _type_: enums([Identity]),
    nice: booleanOrSignal,
    ...scaleDomainProps
  }),
  object({
    _type_: enums([Ordinal]),
    range: oneOf(rangeConstant, arrayAllTypes, scheme, scaleData, signalRef),
    interpolate: scaleInterpolateRef,
    domainImplicit: booleanOrSignal,
    ...scaleDomainProps
  }),
  object({
    _type_: enums([Band]),
    paddingInner: numberOrSignal,
    ...scaleBandProps
  }),
  object({
    _type_: enums([Point]),
    ...scaleBandProps
  }),
  object({
    _type_: enums([Quantize, Threshold]),
    range: schemeRange,
    interpolate: scaleInterpolateRef,
    nice: booleanOrNumberOrSignal,
    zero: booleanOrSignal,
    ...scaleDomainProps
  }),
  object({
    _type_: enums([Quantile]),
    range: schemeRange,
    interpolate: scaleInterpolateRef,
    ...scaleDomainProps
  }),
  object({
    _type_: enums([BinOrdinal]),
    bins: scaleBinsRef,
    range: schemeRange,
    interpolate: scaleInterpolateRef,
    ...scaleDomainProps
  }),
  object({
    _type_: enums([Time, UTC]),
    nice: scaleTemporalNice,
    ...scaleContinuousProps
  }),
  object({
    type: enums([Linear, Sqrt, Sequential]),
    ...scaleNumericProps
  }),
  object({
    _type_: enums([Log]),
    base: numberOrSignal,
    ...scaleNumericProps
  }),
  object({
    _type_: enums([Pow]),
    exponent: numberOrSignal,
    ...scaleNumericProps
  }),
  object({
    _type_: enums([Symlog]),
    constant: numberOrSignal,
    ...scaleNumericProps
  })
);

export default {
  refs: {
    scaleField: stringOrSignal,
    sortOrder,
    scaleBins,
    scaleInterpolate,
    scaleData
  },
  defs: {
    scale
  }
};
