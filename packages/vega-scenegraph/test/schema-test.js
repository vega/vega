var fs = require('fs'),
    ajv = require('ajv'),
    tape = require('tape');

var schemaFile = './build/vega-scenegraph-schema.json';
var schema = JSON.parse(fs.readFileSync(schemaFile));
var res = './test/resources/';

var validator = new ajv({
    allErrors: true,
    verbose: true,
    extendRefs: 'fail'
  })
  .addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));

var validate = validator.compile(schema);

tape('schema should be valid', function(t) {
  t.ok(validator.validateSchema(schema));
  t.end();
});

tape('schema should validate correct marks', function(t) {
  var marks = JSON.parse(fs.readFileSync(res + 'marks.json'));
  for (var name in marks) {
    t.ok(validate(marks[name]), name);
  }
  t.end();
});

tape('schema should invalidate incorrect marks', function(t) {
  var marks = JSON.parse(fs.readFileSync(res + 'marks.json'));
  for (var name in marks) {
    var scene = marks[name];
    switch (scene.marktype) {
      case 'rect': scene.marktype = 'fake'; break;
      case 'text': scene.marktype = 'arc'; break;
      default: scene.marktype = 'text';
    }
    t.notOk(validate(scene));
  }
  t.end();
});

tape('schema should validate scenegraph files', function(t) {
  var files = [
    'scenegraph-barley.json',
    'scenegraph-defs.json',
    'scenegraph-rect.json'
  ];
  files.forEach(function(f) {
    var scene = JSON.parse(fs.readFileSync(res + f));
    t.ok(validate(scene));
  });
  t.end();
});

tape('schema should invalidate degenerate scenegraphs', function(t) {
  var list = [
    {},
    {x: 0, y:1},
    {items: [{x:0, y:0}]},
    {marktype:'blah', items: []}
  ];

  list.forEach(function(scene) {
    t.notOk(validate(scene));
  });

  t.end();
});

tape('schema should validate svg paths', function(t) {
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
    t.notOk(validate(scene), scene.items[0].path);
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
    t.ok(validate(scene));
  });

  t.end();
});

tape('schema should validate colors', function(t) {
  var bad = [
    {marktype: 'rect', items: [{fill: '#ffff'}]},
    {marktype: 'rect', items: [{fill: 'rgb(256,0,0)'}]},
    {marktype: 'rect', items: [{fill: 'rgb(50%,50%,120%)'}]},
    {marktype: 'rect', items: [{fill: 'hsl(355,20,30%)'}]}
  ];

  bad.forEach(function(scene) {
    t.notOk(validate(scene));
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
    t.ok(validate(scene));
  });

  t.end();
});
