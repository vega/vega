import tape from 'tape';
import * as vega from '../index.js';

tape('selectionTest TYPE_ENUM predicate type', t => {
  const NAME = 'test_store';
  const selection_store = [{unit: '', fields:[{field: 'a', channel: 'x', type: 'E'}], values: [200]}];
  const selectionTest = vega.selectionTest.bind({context: {data: {[NAME]: {values: {value: selection_store}}}}});

  const trueResult = selectionTest(NAME, {a: 200});
  t.equal(trueResult, true);

  const falseResult = selectionTest(NAME, {a: 300});
  t.equal(falseResult, false);

  t.end();
});

tape('selectionTest TYPE_RANGE_INC predicate type', t => {
  const NAME = 'test_store';
  const selection_store = [{unit: '', fields:[{field: 'a', channel: 'x', type: 'R'}], values: [[55,160]]}];
  const selectionTest = vega.selectionTest.bind({context: {data: {[NAME]: {values: {value: selection_store}}}}});

  const trueResult = selectionTest(NAME, {a: 100});
  t.equal(trueResult, true);

  const falseResult = selectionTest(NAME, {a: 300});
  t.equal(falseResult, false);

  const trueLeftInclusiveResult = selectionTest(NAME, {a: 55});
  t.equal(trueLeftInclusiveResult, true);

  const trueRightInclusiveResult = selectionTest(NAME, {a: 160});
  t.equal(trueRightInclusiveResult, true);

  t.end();
});

tape('selectionTest TYPE_RANGE_EXC predicate type', t => {
  const NAME = 'test_store';
  const selection_store = [{unit: '', fields:[{field: 'a', channel: 'x', type: 'R-E'}], values: [[55,160]]}];
  const selectionTest = vega.selectionTest.bind({context: {data: {[NAME]: {values: {value: selection_store}}}}});

  const trueResult = selectionTest(NAME, {a: 100});
  t.equal(trueResult, true);

  const falseResult = selectionTest(NAME, {a: 300});
  t.equal(falseResult, false);

  const falseLeftInclusiveResult = selectionTest(NAME, {a: 55});
  t.equal(falseLeftInclusiveResult, false);

  const falseRightInclusiveResult = selectionTest(NAME, {a: 160});
  t.equal(falseRightInclusiveResult, false);

  t.end();
});

tape('selectionTest TYPE_RANGE_LE predicate type', t => {
  const NAME = 'test_store';
  const selection_store = [{unit: '', fields:[{field: 'a', channel: 'x', type: 'R-LE'}], values: [[55,160]]}];
  const selectionTest = vega.selectionTest.bind({context: {data: {[NAME]: {values: {value: selection_store}}}}});

  const trueResult = selectionTest(NAME, {a: 100});
  t.equal(trueResult, true);

  const falseResult = selectionTest(NAME, {a: 300});
  t.equal(falseResult, false);

  const falseLeftInclusiveResult = selectionTest(NAME, {a: 55});
  t.equal(falseLeftInclusiveResult, false);

  const trueRightInclusiveResult = selectionTest(NAME, {a: 160});
  t.equal(trueRightInclusiveResult, true);

  t.end();
});

tape('selectionTest TYPE_RANGE_RE predicate type', t => {
  const NAME = 'test_store';
  const selection_store = [{unit: '', fields:[{field: 'a', channel: 'x', type: 'R-RE'}], values: [[55,160]]}];
  const selectionTest = vega.selectionTest.bind({context: {data: {[NAME]: {values: {value: selection_store}}}}});

  const trueResult = selectionTest(NAME, {a: 100});
  t.equal(trueResult, true);

  const falseResult = selectionTest(NAME, {a: 300});
  t.equal(falseResult, false);

  const trueLeftInclusiveResult = selectionTest(NAME, {a: 55});
  t.equal(trueLeftInclusiveResult, true);

  const falseRightInclusiveResult = selectionTest(NAME, {a: 160});
  t.equal(falseRightInclusiveResult, false);

  t.end();
});

tape('selectionTest TYPE_PRED_LT predicate type', t => {
  const NAME = 'test_store';
  const selection_store = [{unit: '', fields:[{field: 'a', channel: 'x', type: 'E-LT'}], values: [100]}];
  const selectionTest = vega.selectionTest.bind({context: {data: {[NAME]: {values: {value: selection_store}}}}});

  const trueResult = selectionTest(NAME, {a: 1});
  t.equal(trueResult, true);

  const falseResult = selectionTest(NAME, {a: 300});
  t.equal(falseResult, false);

  const falseBoundaryResult = selectionTest(NAME, {a: 100});
  t.equal(falseBoundaryResult, false);

  t.end();
});

tape('selectionTest TYPE_PRED_LTE predicate type', t => {
  const NAME = 'test_store';
  const selection_store = [{unit: '', fields:[{field: 'a', channel: 'x', type: 'E-LTE'}], values: [100]}];
  const selectionTest = vega.selectionTest.bind({context: {data: {[NAME]: {values: {value: selection_store}}}}});

  const trueResult = selectionTest(NAME, {a: 1});
  t.equal(trueResult, true);

  const falseResult = selectionTest(NAME, {a: 300});
  t.equal(falseResult, false);

  const trueBoundaryResult = selectionTest(NAME, {a: 100});
  t.equal(trueBoundaryResult, true);

  t.end();
});

tape('selectionTest TYPE_PRED_GT predicate type', t => {
  const NAME = 'test_store';
  const selection_store = [{unit: '', fields:[{field: 'a', channel: 'x', type: 'E-GT'}], values: [100]}];
  const selectionTest = vega.selectionTest.bind({context: {data: {[NAME]: {values: {value: selection_store}}}}});

  const trueResult = selectionTest(NAME, {a: 300});
  t.equal(trueResult, true);

  const falseResult = selectionTest(NAME, {a: 1});
  t.equal(falseResult, false);

  const falseBoundaryResult = selectionTest(NAME, {a: 100});
  t.equal(falseBoundaryResult, false);

  t.end();
});

tape('selectionTest TYPE_PRED_GTE predicate type', t => {
  const NAME = 'test_store';
  const selection_store = [{unit: '', fields:[{field: 'a', channel: 'x', type: 'E-GTE'}], values: [100]}];
  const selectionTest = vega.selectionTest.bind({context: {data: {[NAME]: {values: {value: selection_store}}}}});

  const trueResult = selectionTest(NAME, {a: 300});
  t.equal(trueResult, true);

  const falseResult = selectionTest(NAME, {a: 1});
  t.equal(falseResult, false);

  const trueBoundaryResult = selectionTest(NAME, {a: 100});
  t.equal(trueBoundaryResult, true);

  t.end();
});

tape('selectionTest TYPE_PRED_VALID predicate type', t => {
  const NAME = 'test_store';
  const selection_store = [{unit: '', fields:[{field: 'a', channel: 'x', type: 'E-VALID'}], values: []}];
  const selectionTest = vega.selectionTest.bind({context: {data: {[NAME]: {values: {value: selection_store}}}}});

  const falseNullResult = selectionTest(NAME, {a: null});
  t.equal(falseNullResult, false);

  const falseNaNResult = selectionTest(NAME, {a: NaN});
  t.equal(falseNaNResult, false);

  const trueResult = selectionTest(NAME, {a: 100});
  t.equal(trueResult, true);

  t.end();
});

tape('selectionTest TYPE_PRED_ONE_OF predicate type', t => {
  const NAME = 'test_store';
  const selection_store = [{unit: '', fields:[{field: 'a', channel: 'x', type: 'E-ONE'}], values: [[1, 2, 3]]}];
  const selectionTest = vega.selectionTest.bind({context: {data: {[NAME]: {values: {value: selection_store}}}}});

  const trueResult1 = selectionTest(NAME, {a: 1});
  t.equal(trueResult1, true);

  const trueResult2 = selectionTest(NAME, {a: 2});
  t.equal(trueResult2, true);

  const trueResult3 = selectionTest(NAME, {a: 3});
  t.equal(trueResult3, true);

  const falseResult = selectionTest(NAME, {a: 10});
  t.equal(falseResult, false);

  t.end();
});