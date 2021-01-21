var fs = require('fs'),
    ajv = require('ajv'),
    tape = require('tape'),
    addFormats = require('ajv-formats');

const schemaFile = './build/vega-scenegraph-schema.json';
const schema = JSON.parse(fs.readFileSync(schemaFile));
const res = './test/resources/';

const validator = new ajv.default({
    allErrors: true,
    verbose: true
  });

addFormats(validator);

const validate = validator.compile(schema);

tape('schema should be valid', t => {
  t.ok(validator.validateSchema(schema));
  t.end();
});

tape('schema should validate correct marks', t => {
  const marks = JSON.parse(fs.readFileSync(res + 'marks.json'));
  for (const name in marks) {
    t.ok(validate(marks[name]), name);
  }
  t.end();
});

tape('schema should invalidate incorrect marks', t => {
  const marks = JSON.parse(fs.readFileSync(res + 'marks.json'));
  for (const name in marks) {
    const scene = marks[name];
    switch (scene.marktype) {
      case 'rect': scene.marktype = 'fake'; break;
      case 'text': scene.marktype = 'arc'; break;
      default: scene.marktype = 'text';
    }
    t.notOk(validate(scene));
  }
  t.end();
});

tape('schema should validate scenegraph files', t => {
  const files = [
    'scenegraph-barley.json',
    'scenegraph-defs.json',
    'scenegraph-rect.json'
  ];
  files.forEach(f => {
    const scene = JSON.parse(fs.readFileSync(res + f));
    t.ok(validate(scene));
  });
  t.end();
});

tape('schema should invalidate degenerate scenegraphs', t => {
  const list = [
    {},
    {x: 0, y:1},
    {items: [{x:0, y:0}]},
    {marktype:'blah', items: []}
  ];

  list.forEach(scene => {
    t.notOk(validate(scene));
  });

  t.end();
});

tape('schema should validate svg paths', t => {
  const bad = [
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

  bad.forEach(scene => {
    t.notOk(validate(scene), scene.items[0].path);
  });

  const good = [
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

  good.forEach(scene => {
    t.ok(validate(scene));
  });

  t.end();
});

tape('schema should validate colors', t => {
  const bad = [
    {marktype: 'rect', items: [{fill: '#ffff'}]},
    {marktype: 'rect', items: [{fill: 'rgb(256,0,0)'}]},
    {marktype: 'rect', items: [{fill: 'rgb(50%,50%,120%)'}]},
    {marktype: 'rect', items: [{fill: 'hsl(355,20,30%)'}]}
  ];

  bad.forEach(scene => {
    t.notOk(validate(scene));
  });

  const good = [
    {marktype: 'rect', items: [{fill: '#fff'}]},
    {marktype: 'rect', items: [{fill: '#abcdEf'}]},
    {marktype: 'rect', items: [{fill: 'steelblue'}]},
    {marktype: 'rect', items: [{fill: 'SteelBlue'}]},
    {marktype: 'rect', items: [{fill: 'rgb(255,0,0)'}]},
    {marktype: 'rect', items: [{fill: 'rgb(50%,50%,100%)'}]},
    {marktype: 'rect', items: [{fill: 'hsl(355,20%,30%)'}]}
  ];

  good.forEach(scene => {
    t.ok(validate(scene));
  });

  t.end();
});
