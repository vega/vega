define(function() {
  function BitVector(size) {
    size = ~~(size/32) | 32;
    this.bits = Uint32Array(size);
  }

  var prototype = BitVector.prototype;

  prototype.get = function(i) {
    var b = ~~(i / 32), m = 0x1 << (i % 32);
    return (this.bits[b] & m) > 0;
  };

  prototype.set = function(i) {
    var b = ~~(i / 32), m = 1 << (i % 32);
    if (b > this.bits.length) this.resize(b);
    this.bits[b] |= m;
  };

  prototype.clear = function(i) {
    var b = ~~(i / 32), m = ~(1 << (i % 32));
    this.bits[b] &= m;
  };

  prototype.resize = function(min) {
    var size = this.bits.length;
    while (min > size) size *= 2;
    
    var bits = Uint8Array(size);
    bits.set(this.bits);
    this.bits = bits;
  };

  return BitVector;
});