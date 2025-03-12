import tape from "tape";
import { bootstrapCI as bootstrapCI$0 } from "../index.js";
var bootstrapCI = { bootstrapCI: bootstrapCI$0 }.bootstrapCI;

tape('bootstrapCI returns array of undefined for empty data', t => {
  const ci = bootstrapCI([], 1000, 0.05);
  t.deepEqual(ci, [undefined, undefined]);
  t.end();
});
