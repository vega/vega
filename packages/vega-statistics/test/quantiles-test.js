import tape from "tape";
import { quantiles as quantiles$0 } from "../index.js";
var quantiles = { quantiles: quantiles$0 }.quantiles;
tape('quantiles calculates quantile values', t => {
  // unsorted
  const a = [9, 7, 8, 1, 2, 3, 4, 5, 6];

  // with number array
  t.deepEqual([3, 5, 7], quantiles(a, [0.25, 0.5, 0.75]));

  // with object array
  t.deepEqual([3, 5, 7], quantiles(
    a.map(_ => ({v:_})),
    [0.25, 0.5, 0.75],
    _ => _.v
  ));

  t.end();
});
