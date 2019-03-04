var fs = require('fs');
var ajv = require('ajv');
var path = require('path');

var schemaFile = path.join(__dirname, '../build/vega-scenegraph-schema.json');
var schema = JSON.parse(fs.readFileSync(schemaFile));
var res = __dirname + '/resources/';

var validator = new ajv({
    allErrors: true,
    verbose: true,
    extendRefs: 'fail'
  })
  .addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));

var validate = validator.compile(schema);

test('schema should be valid', function() {
  expect(validator.validateSchema(schema)).toBeTruthy();
});

test('schema should validate correct marks', function() {
  var marks = JSON.parse(fs.readFileSync(res + 'marks.json'));
  for (var name in marks) {
    expect(validate(marks[name])).toBeTruthy();
  }
});

test('schema should invalidate incorrect marks', function() {
  var marks = JSON.parse(fs.readFileSync(res + 'marks.json'));
  for (var name in marks) {
    var scene = marks[name];
    switch (scene.marktype) {
      case 'rect': scene.marktype = 'fake'; break;
      case 'text': scene.marktype = 'arc'; break;
      default: scene.marktype = 'text';
    }
    expect(validate(scene)).toBeFalsy();
  }
});

test('schema should validate scenegraph files', function() {
  var files = [
    'scenegraph-barley.json',
    'scenegraph-defs.json',
    'scenegraph-rect.json'
  ];
  files.forEach(function(f) {
    var scene = JSON.parse(fs.readFileSync(res + f));
    expect(validate(scene)).toBeTruthy();
  });
});

test('schema should invalidate degenerate scenegraphs', function() {
  var list = [
    {},
    {x: 0, y:1},
    {items: [{x:0, y:0}]},
    {marktype:'blah', items: []}
  ];

  list.forEach(function(scene) {
    expect(validate(scene)).toBeFalsy();
  });
});

test('schema should validate svg paths', function() {
  var bad = [
    {marktype: 'path', items: [{path: 'lorem ipsum'}]},
    {marktype: 'path', items: [{path: 'L1,2'}]},
    {marktype: 'path', items: [{path: 'L1\n2'}]},
    {marktype: 'path', items: [{path: 'M,1,2'}]},
    {marktype: 'path', items: [{path: 'M1,2,3'}]},
    {marktype: 'path', items: [{path: 'M1,2L1'}]},
    {marktype: 'path', items: [{path: 'M1,2L1,2,3'}]},
    {marktype: 'path', items: [{path: 'M1,2A1,2'}]},
    {marktype: 'path', items: [{path: 'M1,2A1,-2,1.3,0,0,3,4'}]},
    {marktype: 'path', items: [{path: 'M1,2A-1,2,1.3,0,0,3,4'}]}
  ];

  bad.forEach(function(scene) {
    expect(validate(scene)).toBeFalsy();
  });

  var good = [
    {marktype: 'path', items: [{path: ''}]},
    {marktype: 'path', items: [{path: 'M1,2'}]},
    {marktype: 'path', items: [{path: 'M1-2'}]},
    {marktype: 'path', items: [{path: 'M1+2'}]},
    {marktype: 'path', items: [{path: '\t  M1,2  \f'}]},
    {marktype: 'path', items: [{path: 'M1,2Z'}]},
    {marktype: 'path', items: [{path: 'M1,2 L1,3 4,5'}]},
    {marktype: 'path', items: [{path: 'M 1 2 L 1 3 4 5'}]},
    {marktype: 'path', items: [{path: 'M1,2L3,4ZM5,6C7,8,9,10,11,12'}]},
    {marktype: 'path', items: [{path: 'M1,2A1,2,1.3,0,0,3,4'}]}
  ];

  good.forEach(function(scene) {
    expect(validate(scene)).toBeTruthy();
  });
});

test('schema should validate colors', function() {
  var bad = [
    {marktype: 'rect', items: [{fill: '#ffff'}]},
    {marktype: 'rect', items: [{fill: 'rgb(256,0,0)'}]},
    {marktype: 'rect', items: [{fill: 'rgb(50%,50%,120%)'}]},
    {marktype: 'rect', items: [{fill: 'hsl(355,20,30%)'}]}
  ];

  bad.forEach(function(scene) {
    expect(validate(scene)).toBeFalsy();
  });

  var good = [
    {marktype: 'rect', items: [{fill: '#fff'}]},
    {marktype: 'rect', items: [{fill: '#abcdEf'}]},
    {marktype: 'rect', items: [{fill: 'steelblue'}]},
    {marktype: 'rect', items: [{fill: 'SteelBlue'}]},
    {marktype: 'rect', items: [{fill: 'rgb(255,0,0)'}]},
    {marktype: 'rect', items: [{fill: 'rgb(50%,50%,100%)'}]},
    {marktype: 'rect', items: [{fill: 'hsl(355,20%,30%)'}]}
  ];

  good.forEach(function(scene) {
    expect(validate(scene)).toBeTruthy();
  });
});
