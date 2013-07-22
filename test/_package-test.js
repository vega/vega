var vows = require('vows'),
    assert = require('assert');

var suite = vows.describe('_package');

suite.addBatch({
  '_package': {
    topic: require('../index.js'),
    'isNumber': {
      'isNumber(0) should be true': function (vg) {
        assert.equal(vg.isNumber(0), true);
      }
    },
    'number': {
      'should convert String containing int to number': function (vg) {
        assert.strictEqual(vg.number('2.2'), 2.2);
      },
      'should return NaN for unparseable Strings': function (vg) {
        assert.isNaN(vg.number('not a number'));
      },
      'should return NaN for objects': function (vg) {
        assert.isNaN(vg.number({}));
      },
      'should return 0 for empty arrays': function (vg) {
        assert.strictEqual(vg.number([]), 0);
      },
      'should return value of single-item numerical arrays': function (vg) {
        assert.strictEqual(vg.number([2.2]), 2.2);
      },
      'should return value of single-item String arrays if it can be converted': function (vg) {
        assert.strictEqual(vg.number(['2.2']), 2.2);
      },
      'should return NaN for single-item String arrays that cannot be parsed': function (vg) {
        assert.isNaN(vg.number(['not a number']));
      },
      'should return NaN for arrays with several elements': function (vg) {
        assert.isNaN(vg.number([5, 2]));
      },
      'should return NaN for functions': function (vg) {
        assert.isNaN(vg.number(function () {
        }));
      },
      'should return number argument': function (vg) {
        assert.strictEqual(vg.number(2.2), 2.2);
      }
    },
    'extend': {
      topic: function (vg) {
        function createChild(o) {
          var F = function () {
          };
          F.prototype = o;
          return new F();
        }

        var grandParent = { 'p2_1': 'vp2_1', 'p2_2': 'vp2_2' },
          parent = createChild(grandParent),
          object1 = createChild(parent),
          object2 = { 'o2_1': 'vo2_1', 'override_1': 'overridden' };

        object1['o1_1'] = 'vo1_1';
        object1['o1_2'] = 'vo1_2';
        object1['override_1'] = 'x';
        parent['p1_1'] = 'vp1_1';

        return vg.extend({ 'c1': 'vc1', 'p2_2': 'x', 'o1_1': 'y'}, object1, object2);
      },
      'object should inherit all direct properties': {
        '1st object 1st property': function (topic) {
          assert.equal(topic['o1_1'], 'vo1_1');
        },
        '1st object 2nd property': function (topic) {
          assert.equal(topic['o1_2'], 'vo1_2');
        },
        '2nd object 1st property': function (topic) {
          assert.equal(topic['o2_1'], 'vo2_1');
        }
      },
      'object should inherit all parent properties': {
        'parent 1st property': function (topic) {
          assert.equal(topic['p1_1'], 'vp1_1');
        },
        'grandparent 1st property': function (topic) {
          assert.equal(topic['p2_1'], 'vp2_1');
        },
        'grandparent 2nd property': function (topic) {
          assert.equal(topic ['p2_2'], 'vp2_2');
        }
      },
      'object properties should be overridden': {
        'by arguments properties': function (topic) {
          assert.equal(topic['o1_1'], 'vo1_1');
        },
        'by argument parent properties': function (topic) {
          assert.equal(topic['p2_2'], 'vp2_2');
        }
      },
      'later arguments override values from previous arguments': function (topic) {
        assert.equal(topic['override_1'], 'overridden');
      }
    },
    'duplicate': {
      topic: function (vg) {
        return vg;
      },
      'should perform a deep clone of the argument': {
        topic: function (vg) {
          return function () {
            var original = {
              'number': -3.452,
              'string': 'text',
              'boolean': true,
              'array': [ 'arrayvalue' ],
              'child': { 'value': 'original value' }
            };

            return {
              'original': original,
              'clone': vg.duplicate(original)
            };
          }
        },
        'changing clone child objects should not change original child objects': function (createTopic) {
          var topic = createTopic();
          topic.clone.child.value = 'changed value'
          assert.equal(topic.original.child.value, 'original value');
        },
        'changing original child objects should not change clone child objects': function (createTopic) {
          var topic = createTopic();
          topic.original.child.value = 'changed value'
          assert.equal(topic.clone.child.value, 'original value');
        },
        'should clone all values': {
          topic: function (createTopic) {
            return createTopic().clone;
          },
          'should clone child value': function (clone) {
            assert.strictEqual(clone.child.value, 'original value');
          },
          'should clone Number values': function (clone) {
            assert.strictEqual(clone.number, -3.452);
          },
          'should clone String values': function (clone) {
            assert.strictEqual(clone.string, 'text');
          },
          'should clone Boolean values': function (clone) {
            assert.strictEqual(clone.boolean, true);
          },
          'should clone Array values': function (clone) {
            assert.deepEqual(clone.array, [ 'arrayvalue' ]);
          }
        }
      },
      'duplicating functions': {
        topic: function (vg) {
          vg.duplicate(function () {
          });
        },
        'should throw SyntaxError': function (topic) {
          assert.equal(topic.toString().substring(0, 11), 'SyntaxError');
        }
      },
      'duplicating objects with circular dependencies': {
        topic: function (vg) {
          var o1 = {}, o2 = { 'o1': o1 };
          o1['o2'] = o2;
          vg.duplicate(o1);
        },
        'should throw TypeError': function (topic) {
          assert.equal(topic, 'TypeError: Converting circular structure to JSON');
        }
      }
    },
    'field': {
      'should treat \\. as . in field name': function (vg) {
        assert.deepEqual(vg.field('a\\.b\\.c'), ['a.b.c' ]);
      },
      'should separate fields on .': function (vg) {
        assert.deepEqual(vg.field('a.b.c'), ['a', 'b', 'c' ]);
      },
      'should support mix of \\. and .': function (vg) {
        assert.deepEqual(
          vg.field('a\\.b\\.c.a2\\.b2.a3\\.b3\\.c3'),
          ['a.b.c', 'a2.b2', 'a3.b3.c3' ]);
      }
    },
    'accessor': {
      'should return null argument': function (vg) {
        assert.isNull(vg.accessor(null));
      },
      'should return function argument': function (vg) {
        var f = function () {
        };
        assert.strictEqual(vg.accessor(f), f);
      },
      'should return accessor function for property of simple String argument': function (vg) {
        assert.equal(vg.accessor('test')({ 'test': 'value'}), 'value');
      },
      'should return accessor function that resolves property paths for String arguments with .': function (vg) {
        assert.equal(vg.accessor('a\\.b.c.d')({ 'a.b': { 'c': { 'd': 'value'}}}), 'value');
      },
      'should return accessor function for number arguments': function (vg) {
        assert.equal(vg.accessor(1)(['a', 'b']), 'b');
      }
    },
    'comparator': {
      'when called without argument, the comparator': {
        'should always return 0': function (vg) {
          assert.equal(vg.comparator()('a', 'b'), 0);
        }
      },
      'when sort argument contains single String without prefix, the comparator': {
        topic: function (vg) {
          return vg.comparator(['p']);
        },
        'should return 1 if resolved property of 1st arg is greater than resolved property of 2nd arg': function (comparator) {
          assert.equal(comparator({'p': 1}, {'p': 0}), 1);
        },
        'should return 1 if resolved property of 2nd arg is greater than resolved property of 1st arg': function (comparator) {
          assert.equal(comparator({'p': 0}, {'p': 1}), -1);
        },
        'should return 0 if resolved property of 1st arg is equal to resolved property of 2nd arg': function (comparator) {
          assert.equal(comparator({'p': 1}, {'p': 1}), 0);
        }
      },
      'when sort argument contains single String with "+" prefix, the comparator': {
        topic: function (vg) {
          return vg.comparator(['+p']);
        },
        'should return 1 if resolved property of 1st arg is greater than resolved property of 2nd arg': function (comparator) {
          assert.equal(comparator({'p': 1}, {'p': 0}), 1);
        },
        'should return 1 if resolved property of 2nd arg is greater than resolved property of 1st arg': function (comparator) {
          assert.equal(comparator({'p': 0}, {'p': 1}), -1);
        },
        'should return 0 if resolved property of 1st arg is equal to resolved property of 2nd arg': function (comparator) {
          assert.equal(comparator({'p': 1}, {'p': 1}), 0);
        }
      },
      'when sort argument contains single String with "-" prefix, the comparator': {
        topic: function (vg) {
          return vg.comparator(['-p']);
        },
        'should return -1 if resolved property of 1st arg is greater than resolved property of 2nd arg': function (comparator) {
          assert.equal(comparator({'p': 1}, {'p': 0}), -1);
        },
        'should return 1 if resolved property of 2nd arg is greater than resolved property of 1st arg': function (comparator) {
          assert.equal(comparator({'p': 0}, {'p': 1}), 1);
        },
        'should return 0 if resolved property of 1st arg is equal to resolved property of 2nd arg': function (comparator) {
          assert.equal(comparator({'p': 1}, {'p': 1}), 0);
        }
      },
      'when sort argument contains two Strings (without prefix), the comparator': {
        topic: function (vg) {
          return vg.comparator(['p', 'q']);
        },
        'should return 1 if 1st resolved property of 1st arg is greater than 1st resolved property of 2nd arg': function (comparator) {
          assert.equal(comparator({'p': 1}, {'p': 0}), 1);
        },
        'should return -1 if 1st resolved property of 2nd arg is greater than 1st resolved property of 1st arg': function (comparator) {
          assert.equal(comparator({'p': 0}, {'p': 1}), -1);
        },
        'when 1st resolved properties of both arguments are equal': {
          'should return 1 if 2nd resolved property of 1st arg is greater than 2nd resolved property of 2nd arg': function (comparator) {
            assert.equal(comparator({'p': 1, 'q': 2}, {'p': 1, 'q': -2}), 1);
          },
          'should return -1 1st if 2nd resolved property of 2nd arg is greater than 2nd resolved property of 1st arg': function (comparator) {
            assert.equal(comparator({'p': 1, 'q': -2}, {'p': 1, 'q': 2}), -1);
          },
          'should return 0 if both 2nd resolved properties are equal': function (comparator) {
            assert.equal(comparator({'p': 1, 'q': 5}, {'p': 1, 'q': 5}), 0);
          }
        }
      }
    },
    'array': {
      'array(null) should return an empty array': function (vg) {
        assert.deepEqual(vg.array(null), []);
      },
      'array(undefined) should return an empty array': function (vg) {
        assert.deepEqual(vg.array(), []);
      },
      'array(some array) should return the same array': function (vg) {
        var value = [1, 2, 3];
        assert.strictEqual(vg.array(value), value);
      },
      'array(one non-array argument) should return an array containing the argument': function (vg) {
        assert.deepEqual(vg.array(1), [1]);
      }
    },
    'unique': {
      'without transformation': {
        'should return all values of an array that contains only unique values in the same order': function (vg) {
          assert.deepEqual(vg.unique([1, 2, 3]), [1, 2, 3]);
        },
        'should filter out repeated occurrences of values': function (vg) {
          assert.deepEqual(vg.unique([1, 1, 2, 1, 2, 3, 1, 2, 3, 3, 3]), [1, 2, 3]);
        },
        'should treat undefined as a value and remove duplicates': function (vg) {
          assert.deepEqual(vg.unique([1, undefined, 2, undefined]), [1, undefined, 2]);
        }
      },
      'with transformation': {
        'should apply transformation to array elements': function (vg) {
          assert.deepEqual(vg.unique([1, 2, 3], function (d) {
            return -2 * d
          }), [-2, -4, -6]);
        },
        'should filter out repeated occurrences of transformed values': function (vg) {
          assert.deepEqual(vg.unique([1, 1, 2, 3], function (d) {
            return d < 3 ? 1 : 3;
          }), [1, 3]);
        }
      }
    },
    "keys": {
      "should enumerate every defined key": function (vg) {
        assert.deepEqual(vg.keys({a: 1, b: 1}), ["a", "b"]);
      },
      "should include keys defined on prototypes": function (vg) {
        function Abc() {
          this.a = 1;
          this.b = 2;
        }

        Abc.prototype.c = 3;
        assert.deepEqual(vg.keys(new Abc()), ["a", "b", "c"]);
      },
      "should include keys with null or undefined values": function (vg) {
        assert.deepEqual(vg.keys({a: undefined, b: null, c: NaN}), ["a", "b", "c"]);
      }
    },
    'values': {
      'should return "values" property of an object argument that has a "values" property': function (vg) {
        var testValues = [1];
        assert.strictEqual(vg.values({'values': testValues}), testValues);
      },
      'should return the argument itself if it is an object, but has no "values" property': function (vg) {
        var object = {};
        assert.strictEqual(vg.values(object), object);
      },
      'should return an array argument, even if it has a "values" property': function (vg) {
        var array = [];
        array.values = {};
        assert.strictEqual(vg.values(array), array);
      },
      'should return a number argument': function (vg) {
        assert.equal(vg.values(2.2), 2.2);
      }
    },
    'str': {
      'should wrap string arguments in single quotation marks': function (vg) {
        assert.strictEqual(vg.str('test'), "'test'");
      },
      'should wrap arrays in square brackets': function (vg) {
        assert.equal(vg.str(['1', '2']), "['1','2']");
      },
      'should return boolean arguments as they are': {
        'true': function (vg) {
          assert.equal(vg.str(true), true);
        },
        'false': function (vg) {
          assert.equal(vg.str(false), false);
        }
      },
      'should return number arguments as they are': {
        '2': function (vg) {
          assert.equal(vg.str(2), 2);
        },
        '-2': function (vg) {
          assert.equal(vg.str(-2), -2);
        },
        '5.32': function (vg) {
          assert.equal(vg.str(-5.32), -5.32);
        }
      },
      'should recursively wrap arrays in square brackets': function (vg) {
        assert.equal(vg.str([
          ['1', 3],
          '2'
        ]), "[['1',3],'2']");
      }
    }
  }
})
;

suite.export(module);