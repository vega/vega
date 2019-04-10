import {
  array, def, orSignal, anyOf, enums, oneOf, object, type,
  anyType, stringType, stringOrSignal, booleanOrSignal, signalRef
} from '../util';
import { en } from '../consts';
import { ENGLISH } from './description';

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

switch(en) { // en is hardcoded currently. A language setting function will go here which will depend on the client side such window.navigator.language
  case en:
    Object.assign(data, { description: ENGLISH })
    break
  default:
    Object.assign(data, { description: ENGLISH })
    break
}

export default {
  refs: {
    paramField
  },
  defs: {
    data
  }
};
