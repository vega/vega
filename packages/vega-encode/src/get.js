export default function(map, key) {
  return map.hasOwnProperty(key) ? map[key] : null;
}
