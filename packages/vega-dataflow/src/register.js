export var transforms = {};

export var definitions = {};

export function register(def, constructor) {
  var type = def.type;
  definition(type, def);
  transform(type, constructor);
}

export function definition(type, def) {
  type = type && type.toLowerCase();
  return arguments.length > 1 ? (definitions[type] = def, this)
    : definitions.hasOwnProperty(type) ? definitions[type] : null;
}

export function transform(type, constructor) {
  return arguments.length > 1 ? (transforms[type] = constructor, this)
    : transforms.hasOwnProperty(type) ? transforms[type] : null;
}
