import {
  array, def, required, orSignal, anyOf, allOf, enums, oneOf, object, type,
  booleanType, stringType, stringOrSignal
} from './util';

const parseDef = oneOf(
  enums(['auto']),
  object(null, oneOf(
    enums(['boolean', 'number', 'date', 'string']),
    type('string', {pattern: '^(date|utc):.*$'})
  ))
);

const paramField = object({
  _field_: stringType,
  as: stringType
});

const dataFormat = anyOf(
  object({
    type: enums(['json']),
    parse: parseDef,
    property: stringType,
    copy: booleanType
  }),
  object({
    type: enums(['csv', 'tsv']),
    parse: parseDef
  }),
  object({
    type: enums(['dsv']),
    delimiter: stringType,
    parse: parseDef
  }),
  oneOf(
    object({
      type: enums(['topojson']),
      feature: stringType,
      property: stringType
    }),
    object({
      type: enums(['topojson']),
      mesh: stringType,
      property: stringType
    })
  )
);

const transformRef = def('transform');
const onTriggerRef = def('onTrigger');

const data = allOf(
  object({
    _name_: stringType,
    transform: array(transformRef),
    on: onTriggerRef
  }, undefined),
  anyOf(
    required('name'),
    oneOf(
      object({
        _source_: oneOf(stringType, array(stringType, {minItems: 1}))
      }, undefined),
      object({
        _url_: stringOrSignal,
        format: orSignal(dataFormat)
      }, undefined)
    )
  )
);

export default {
  refs: {
    paramField
  },
  defs: {
    data
  }
};
