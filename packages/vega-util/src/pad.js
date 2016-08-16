import repeat from './repeat';

export default function(str, length, padchar, align) {
  var c = padchar || ' ',
      n = length - str.length;

  return n <= 0 ? str
    : align === 'left' ? repeat(c, n) + str
    : align === 'center' ? repeat(c, ~~(n/2)) + str + repeat(c, Math.ceil(n/2))
    : str + repeat(c, n);
}
