import {
  allOf, array, def, enums, not, object, oneOf, ref,
  booleanType, stringType, booleanOrSignal, stringOrSignal
} from './util';

// types defined elsewhere
const sortOrderRef = ref('sortOrder');
const marktypeRef = ref('marktype');
const sortField = oneOf(ref('scaleField'), ref('expr'));

const compareRef = ref('compare');
const compare = oneOf(
  object({
    field: sortField,
    order: sortOrderRef
  }),
  object({
    field: array(sortField),
    order: array(sortOrderRef)
  })
);

const facetRef = ref('facet');
const facet = object({
  data: stringType,
  _facet_: oneOf(
    object({
      _name_: stringType,
      _data_: stringType,
      _field_: stringType
    }),
    object({
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
    })
  )
});

const fromRef = ref('from');
const from = object({
  data: stringType
});

const markclipRef = ref('markclip');
const markclip = oneOf(
  booleanOrSignal,
  object({_path_: stringOrSignal}),
  object({_sphere_: stringOrSignal})
);

const styleRef = ref('style');
const style = oneOf(stringType, array(stringType));

const markRef = def('mark');
const mark = object({
  _type_: marktypeRef,
  role: stringType,
  name: stringType,
  style: styleRef,
  key: stringType,
  clip: markclipRef,
  sort: compareRef,
  interactive: booleanOrSignal,
  encode: def('encode'),
  transform: array(def('transformMark')),
  on: def('onMarkTrigger')
}, undefined);

const markGroup = allOf(
  object({
    _type_: enums(['group']),
    from: oneOf(fromRef, facetRef)
  }, undefined),
  markRef,
  def('scope')
);

const markVisual = allOf(
  object({
    type: not(enums(['group'])),
    from: fromRef
  }, undefined),
  markRef
);

export default {
  refs: {
    compare,
    from,
    facet,
    markclip,
    style
  },

  defs: {
    mark,
    markGroup,
    markVisual
  }
};
