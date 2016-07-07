import translate from './translate';

export default function(item) {
  return translate(item.x || 0, item.y || 0);
}