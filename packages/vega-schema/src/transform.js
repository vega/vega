import {
  anyOf, array, booleanType, def, enums, nullType, numberType,
  object, oneOf, signalRef, stringType
} from './util';

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
      p = anyOf(enums(param.values), signalRef);
      break;
    case 'expr':
      p = exprStringRef;
      break;
    case 'string':
      p = anyOf(stringType, signalRef);
      break;
    // dates should fall through to number
    // values should be timestamps or date-valued signals
    case 'date':
    case 'number':
      p = anyOf(numberType, signalRef);
      break;
    case 'boolean':
      p = anyOf(booleanType, signalRef);
      break;
    case 'signal':
      p = signalRef;
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
    p = oneOf(p, signalRef);
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

export default function(definitions) {
  const transforms = [],
        marks = [],
        defs = {
          transform: {oneOf: transforms},
          transformMark: {oneOf: marks}
        };

  for (let i=0, n=definitions.length; i<n; ++i) {
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
