export var transforms = {};

export function definition(type) {
  var t = transform(type);
  return t && t.Definition || null;
}

export function transform(type) {
  type = type && type.toLowerCase();
  return transforms.hasOwnProperty(type) ? transforms[type] : null;
}
