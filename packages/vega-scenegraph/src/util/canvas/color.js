import gradient from './gradient';

export default function(context, item, value) {
  return (value.id) ?
    gradient(context, value, item.bounds) :
    value;
}
