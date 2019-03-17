const tape = require('tape'),
  BitMap = require('../').BitMap;

function createUnscaledBitMap() {
  return new BitMap(100, 100, 0);
}

function createScaledBitMap() {
  return new BitMap(1234, 1234, 0);
}

tape('BitMap scale pixel to the correct position in bit map', test => {
  const bm1 = new BitMap(200, 200, 0);
  test.equals(bm1.scalePixel(3), 3);
  test.equals(bm1.scalePixel(4), 4);

  const bm2 = new BitMap(1000, 1000, 0);
  test.equals(bm2.scalePixel(3), 3);
  test.equals(bm2.scalePixel(4), 4);

  const bm3 = new BitMap(1234, 1234, 0);
  test.equals(bm3.scalePixel(40), 32);
  test.equals(bm3.scalePixel(70), 56);

  const bm4 = new BitMap(2345, 3456, 0);
  test.equals(bm4.scalePixel(30), 10);
  test.equals(bm4.scalePixel(50), 17);

  const bm5 = new BitMap(2345, 3456, 7);
  test.equals(bm5.scalePixel(30), 12);
  test.equals(bm5.scalePixel(50), 20);

  test.end();
});

tape('BitMap get, mark, and unmark single pixel correctly', test => {
  const bmu = createUnscaledBitMap();
  bmu.mark(13, 14);
  bmu.markScaled(17, 18);
  test.ok(bmu.get(13, 14));
  test.ok(bmu.getScaled(13, 14));
  test.ok(bmu.get(17, 18));
  test.ok(bmu.getScaled(17, 18));

  test.notOk(bmu.get(14, 14));
  test.notOk(bmu.getScaled(14, 14));
  test.notOk(bmu.get(13, 15));
  test.notOk(bmu.getScaled(13, 15));

  bmu.unmark(13, 14);
  bmu.unmarkScaled(17, 18);
  test.notOk(bmu.get(13, 14));
  test.notOk(bmu.get(17, 18));

  const bms = createScaledBitMap();
  bms.mark(13, 14);
  bms.markScaled(27, 28);
  test.ok(bms.get(13, 14));
  test.ok(bms.getScaled(bms.scalePixel(13), bms.scalePixel(14)));
  test.ok(bms.getScaled(27, 28));

  test.notOk(bms.get(14, 14));
  test.notOk(bms.getScaled(bms.scalePixel(14), bms.scalePixel(14)));
  test.notOk(bms.getScaled(26, 28));

  bms.unmark(13, 14);
  bms.unmarkScaled(27, 28);
  test.notOk(bmu.get(13, 14));
  test.notOk(bmu.getScaled(27, 28));
  test.end();
});

tape('BitMap markInRange and unmarkInRange correctly', test => {
  const bms = createScaledBitMap();
  bms.markInRange(13, 14, 35, 36);
  bms.markInRangeScaled(47, 48, 69, 70);
  for (let i = 13; i <= 35; i++) {
    for (let j = 14; j <= 36; j++) {
      if (!bms.get(i, j)) {
        test.fail('There is one pixel in the range unmarked in marked area');
      }
    }
  }

  for (let i = 47; i <= 69; i++) {
    for (let j = 48; j <= 70; j++) {
      if (!bms.getScaled(i, j)) {
        test.fail('There is one pixel in the range unmarked in marked area');
      }
    }
  }

  bms.unmarkInRange(20, 20, 30, 30);
  bms.unmarkInRangeScaled(50, 50, 60, 60);

  for (let i = 20; i <= 30; i++) {
    for (let j = 20; j <= 30; j++) {
      if (bms.get(i, j)) {
        test.fail('There is one pixel in the ranged marked in unmarked area');
      }
    }
  }

  for (let i = 50; i <= 60; i++) {
    for (let j = 50; j <= 60; j++) {
      if (bms.getScaled(i, j)) {
        test.fail('There is one pixel in the ranged marked in unmarked area');
      }
    }
  }

  test.end();
});

tape('BitMap getInRange correctly', test => {
  const bms = createScaledBitMap();
  bms.mark(40, 70);
  test.ok(bms.getInRange(40, 70, 40, 70));
  test.ok(bms.getInRange(40, 70, 50, 80));
  test.ok(bms.getInRange(30, 70, 40, 80));
  test.ok(bms.getInRange(40, 60, 50, 70));
  test.ok(bms.getInRange(30, 60, 40, 70));

  bms.markScaled(170, 200);
  test.ok(bms.getInRangeScaled(170, 200, 170, 200));
  test.ok(bms.getInRangeScaled(170, 200, 180, 210));
  test.ok(bms.getInRangeScaled(160, 200, 170, 210));
  test.ok(bms.getInRangeScaled(170, 190, 180, 200));
  test.ok(bms.getInRangeScaled(160, 190, 170, 200));

  test.end();
});

tape('BitMap searchOutOfBound() works correctly', test => {
  const bms = createScaledBitMap();
  test.notOk(bms.searchOutOfBound(0, 0, 1000, 1000));

  test.ok(bms.searchOutOfBound(999, 999, 1001, 999));
  test.ok(bms.searchOutOfBound(999, 999, 999, 1001));
  test.ok(bms.searchOutOfBound(-1, 1, 1, 1));
  test.ok(bms.searchOutOfBound(1, -1, 1, 1));

  test.end();
});
