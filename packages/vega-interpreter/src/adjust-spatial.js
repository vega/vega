export default function(item, encode, swap) {
  let t;

  if (encode.x2) {
    if (encode.x) {
      if (swap && item.x > item.x2) {
        t = item.x;
        item.x = item.x2;
        item.x2 = t;
      }
      item.width = item.x2 - item.x;
    } else {
      item.x = item.x2 - (item.width || 0);
    }
  }

  if (encode.xc) {
    item.x = item.xc - (item.width || 0) / 2;
  }

  if (encode.y2) {
    if (encode.y) {
      if (swap && item.y > item.y2) {
        t = item.y;
        item.y = item.y2;
        item.y2 = t;
      }
      item.height = item.y2 - item.y;
    } else {
      item.y = item.y2 - (item.height || 0);
    }
  }

  if (encode.yc) {
    item.y = item.yc - (item.height || 0) / 2;
  }
}
