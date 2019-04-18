import {
  array, def, orSignal, anyOf, enums, oneOf, object, type,
  anyType, stringType, stringOrSignal, booleanOrSignal, signalRef
} from './util';

// types defined elsewhere
const transformRef = def('transform');
const onTriggerRef = def('onTrigger');

const parseDef = oneOf(
  enums(['auto']),
  object(null, oneOf(
    enums(['boolean', 'number', 'date', 'string']),
    type('string', {pattern: '^(date|utc):.*$'})
  )),
  signalRef
);

const paramField = object({
  _field_: stringType,
  as: stringType
});

const dataFormat = anyOf(
  object({
    type: stringOrSignal,
    parse: parseDef
  }, undefined),
  object({
    type: enums(['json']),
    parse: parseDef,
    property: stringOrSignal,
    copy: booleanOrSignal
  }),
  object({
    _type_: enums(['csv', 'tsv']),
    parse: parseDef
  }),
  object({
    _type_: enums(['dsv']),
    _delimiter_: stringType,
    parse: parseDef
  }),
  oneOf(
    object({
      _type_: enums(['topojson']),
      _feature_: stringOrSignal,
      property: stringOrSignal
    }),
    object({
      _type_: enums(['topojson']),
      _mesh_: stringOrSignal,
      property: stringOrSignal
    })
  )
);

const dataProps = {
  _name_: stringType,
  transform: array(transformRef),
  on: onTriggerRef
};

const data = oneOf(
  object(dataProps),
  object({
    _source_: oneOf(stringType, array(stringType, {minItems: 1})),
    ...dataProps
  }),
  object({
    _url_: stringOrSignal,
    format: orSignal(dataFormat),
    ...dataProps
  }),
  object({
    _values_: orSignal(anyType),
    format: orSignal(dataFormat),
    ...dataProps
  })
);

Object.assign(data, { description: "Data set definitions and transforms define the data to load and how to process it. The basic data model used by Vega is tabular data, similar to a spreadsheet or database table. Individual data sets are assumed to contain a collection of records (or “rows”), which may contain any number of named data attributes (fields, or “columns”). Records are modeled using standard JavaScript objects. If the input data is simply an array of primitive values, Vega maps each value to the `data` property of a new object. For example `[5, 3, 8, 1]` is loaded as:\n`[ {\"data\": 5}, {\"data\": 3}, {\"data\": 8}, {\"data\": 1} ]`.\n\n__Required__:`name`. A unique name for dataset." });

export default {
  refs: {
    paramField
  },
  defs: {
    data
  }
};
