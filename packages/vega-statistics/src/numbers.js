export default function(array, f) {
  var numbers = [],
      n = array.length,
      i = -1, a;

  if (f == null) {
    while (++i < n) if (!isNaN(a = number(array[i]))) numbers.push(a);
  } else {
    while (++i < n) if (!isNaN(a = number(f(array[i], i, array)))) numbers.push(a);
  }
  return numbers;
}

function number(x) {
  return x === null ? NaN : +x;
}
