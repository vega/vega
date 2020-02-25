const data = require("../src/components/data");

test('Max Median', () => expect(Math.max(...data.median)).toBe(76));
test('Min Median', () => expect(Math.min(...data.median)).toBe(66));

test('Max Mode', () => expect(Math.max(...data.mode)).toBe(86));
test('Min Mode', () => expect(Math.min(...data.mode)).toBe(62));

test('Max Summary', () => expect(Math.max(...data.summary)).toBe(5331));
test('Min Summary', () => expect(Math.min(...data.summary)).toBe(19));
