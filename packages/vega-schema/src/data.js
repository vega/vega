import {
  anyOf, anyType, array, booleanOrSignal, def, enums, object, oneOf,
  orSignal, signalRef, stringOrSignal, stringType, type
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
    header: array(stringType),
    parse: parseDef
  }),
  object({
    _type_: enums(['dsv']),
    _delimiter_: stringType,
    header: array(stringType),
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
      property: stringOrSignal,
      filter: enums(['interior', 'exterior', null])
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
    async: booleanOrSignal,
    ...dataProps
  }),
  object({
    _values_: orSignal(anyType),
    format: orSignal(dataFormat),
    async: booleanOrSignal,
    ...dataProps
  })
);

export default {
  data,
  paramField
};
