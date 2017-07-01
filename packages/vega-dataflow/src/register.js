export var transforms = {};

export var definitions = {};

export function register(def, constructor) {
  var type = def.type;
  definition(type, def);
  transform(type, constructor);
}

export function definition(type, def) {
  type = type && type.toLowerCase();
  if (arguments.length > 1) {
    definitions[type] = def;
    return this;
  } else {
    return definitions.hasOwnProperty(type) ? definitions[type] : null;
  }
}

export function transform(type, constructor) {
  if (arguments.length > 1) {
    transforms[type] = constructor;
    return this;
  } else {
    return transforms.hasOwnProperty(type) ? transforms[type] : null;
  }
}
