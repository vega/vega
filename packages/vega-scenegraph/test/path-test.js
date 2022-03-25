var tape = require('tape'),
    vega = require('../'),
    context = vega.path,
    Bounds = vega.Bounds,
    pathParse = vega.pathParse,
    pathRender = vega.pathRender;

function bound(path, bounds) {
  pathRender(vega.boundContext(bounds), path, 0, 0);
  return bounds;
}

const paths = [
  'M 10,10 m 10,20',
  'M 10,10 l 10,20',
  'M 10,10 L 10,20',
  'M 10,10 L 10,20 L 20,20 Z',
  'M 10,10 L 10,20 L 20,20 z',
  'M 10,10 h 20',
  'M 10,10 H 20',
  'M 10,10 v 20',
  'M 10,10 V 20',
  'M 10,10 c 10,0,10,10,0,10',
  'M 10,10 C 10,0,10,10,0,10',
  'M 10,10 c 10,0,10,10,0,10 s 10,20,20,0',
  'M 10,10 C 10,0,10,10,0,10 S 10,20,20,0',
  'M 10,10 q 10,10,0,10',
  'M 10,10 Q 10,10,0,10',
  'M 10,10 t 20,0',
  'M 10,10 q 10,10,0,10 t 20,0',
  'M 10,10 Q 10,10,0,10 t 20,0',
  'M 10,10 t 0,10 t 20,0',
  'M 10,10 Q 10,10,0,10 T 20,0',
  'M  80,80 a 45,45,0,0,0,125,125 L 125,80 Z',
  'M  80,80 A 45,45,0,0,0,125,125 L 125,80 Z',
  'M 230,80 A 45,45,0,1,0,275,125 L 275,80 Z',
  'M  80,230 A 45,45,0,0,1,125,275 L 125,230 Z',
  'M 230,230 A 45,45,0,1,1,275,275 L 275,230 Z',
  'M 0,0 A 0.45,0.45,0,1,1,20,20 Z',
  'M 0,0 A 0.45,0.45,0,0,0,20,20 Z'
];

var bounds = [
  { x1: 10, y1: 10, x2: 20, y2: 30 },
  { x1: 10, y1: 10, x2: 20, y2: 30 },
  { x1: 10, y1: 10, x2: 10, y2: 20 },
  { x1: 10, y1: 10, x2: 20, y2: 20 },
  { x1: 10, y1: 10, x2: 20, y2: 20 },
  { x1: 10, y1: 10, x2: 30, y2: 10 },
  { x1: 10, y1: 10, x2: 20, y2: 10 },
  { x1: 10, y1: 10, x2: 10, y2: 30 },
  { x1: 10, y1: 10, x2: 10, y2: 20 },
  { x1: 10, y1: 10, x2: 17.5, y2: 20 },
  { x1: 0, y1: 5.555555555555556, x2: 10, y2: 10 },
  { x1: 7.274575140626315, y1: 10, x2: 30, y2: 28.888888888888886 },
  { x1: -2.7254248593736854, y1: 0, x2: 20, y2: 12.5 },
  { x1: 10, y1: 10, x2: 15, y2: 20 },
  { x1: 0, y1: 10, x2: 10, y2: 10 },
  { x1: 10, y1: 10, x2: 30, y2: 10 },
  { x1: 7.5, y1: 10, x2: 30, y2: 20 },
  { x1: 0, y1: 10, x2: 20, y2: 10 },
  { x1: 10, y1: 10, x2: 30, y2: 25 },
  { x1: -2.5, y1: 0, x2: 20, y2: 10 },
  { x1: 54.11165235168157, y1: 80, x2: 205, y2: 230.88834764831847 },
  { x1: 80, y1: 80, x2: 125, y2: 125 },
  { x1: 185.00000000000003, y1: 80, x2: 275, y2: 170 },
  { x1: 80, y1: 230, x2: 125, y2: 275 },
  { x1: 230, y1: 185.00000000000003, x2: 320, y2: 275 },
  { x1: 0, y1: -4.142135623730948, x2: 24.14213562373095, y2: 20 },
  { x1: -4.142135623730949, y1: 0, x2: 19.999999999999996, y2: 24.14213562373095 }
];

const output = [
  'M10,10M20,30',
  'M10,10L20,30',
  'M10,10L10,20',
  'M10,10L10,20L20,20Z',
  'M10,10L10,20L20,20Z',
  'M10,10L30,10',
  'M10,10L20,10',
  'M10,10L10,30',
  'M10,10L10,20',
  'M10,10C20,10,20,20,10,20',
  'M10,10C10,0,10,10,0,10',
  'M10,10C20,10,20,20,10,20C0,20,20,40,30,20',
  'M10,10C10,0,10,10,0,10C-10,10,10,20,20,0',
  'M10,10Q20,20,10,20',
  'M10,10Q10,10,0,10',
  'M10,10Q10,10,30,10',
  'M10,10Q20,20,10,20Q0,20,30,20',
  'M10,10Q10,10,0,10Q10,10,20,10',
  'M10,10Q10,10,10,20Q10,30,30,20',
  'M10,10Q10,10,0,10Q-10,10,20,0',
  'M80,80C45.48220313557543,114.5177968644246,45.482203135575425,170.4822031355754,80,205C114.51779686442458,239.51779686442458,170.4822031355754,239.51779686442458,205,205L125,80Z',
  'M80,80C80,104.8528137423857,100.1471862576143,125,125,125L125,80Z',
  'M230,80C205.14718625761432,80,185.00000000000003,100.1471862576143,185.00000000000003,125C185.00000000000003,149.85281374238568,205.14718625761432,170,230.00000000000003,170C254.8528137423857,170,275,149.85281374238573,275,125.00000000000001L275,80Z',
  'M80,230C104.85281374238569,230.00000000000003,125,250.14718625761432,125,275L125,230Z',
  'M230,230C230.00000000000003,205.14718625761432,250.14718625761432,185.00000000000003,275,185.00000000000003C299.8528137423857,185.00000000000003,320,205.14718625761432,320,230.00000000000003C320,254.8528137423857,299.8528137423857,275,275,275L275,230Z',
  'M0,0C5.522847498307938,-5.522847498307931,14.47715250169207,-5.522847498307931,20.000000000000004,3.14018491736755e-15C25.522847498307936,5.522847498307938,25.522847498307936,14.477152501692064,20.000000000000004,20Z',
  'M0,0C-5.522847498307931,5.522847498307935,-5.522847498307933,14.477152501692064,0,20C5.522847498307933,25.522847498307936,14.47715250169206,25.522847498307936,19.999999999999996,20.000000000000004Z'
];

tape('pathParse should parse svg path', t => {
  const s1 = 'M1,1L1,2';
  const s2 = 'M 1 1 L 1 2';
  const s3 = 'M 1,1 L 1 2';
  const p = [['M',1,1], ['L',1,2]];
  t.deepEqual(pathParse(s1), p);
  t.deepEqual(pathParse(s2), p);
  t.deepEqual(pathParse(s3), p);
  t.end();
});

tape('pathParse should handle an empty string', t => {
  const s = '';
  const p = [];
  t.deepEqual(pathParse(s), p);
  t.end();
});

tape('pathParse should handle repeated arguments', t => {
  const s = 'M 1 1 L 1 2 3 4';
  const p = [['M',1,1], ['L',1,2], ['L',3,4]];
  t.deepEqual(pathParse(s), p);
  t.end();
});

tape('pathParse should throw on invalid parameters', t => {
  t.throws(() => pathParse('M 1 foo'));
  t.throws(() => pathParse('M 1 2 3'));
  t.end();
});

tape('pathParse should handle concatenated decimals', t => {
  const s = 'l.5.5.3.3';
  const p = [['l',.5,.5], ['l',.3,.3]];
  t.deepEqual(pathParse(s), p);
  t.end();
});

tape('pathParse should handle dense arc flags', t => {
  const s = 'A 1 2 3 00-1 1';
  const p = [['A',1,2,3,0,0,-1,1]];
  t.deepEqual(pathParse(s), p);
  t.end();
});

tape('pathParse should handle implicit M lineTo', t => {
  const s = 'M0,0 1,1 2,2';
  const p = [['M',0,0], ['L',1,1], ['L',2,2]];
  t.deepEqual(pathParse(s), p);
  t.end();
});

tape('pathParse should handle implicit m lineTo', t => {
  const s = 'm0,0 1,1 2,2';
  const p = [['m',0,0], ['l',1,1], ['l',2,2]];
  t.deepEqual(pathParse(s), p);
  t.end();
});

tape('boundContext should calculate paths bounds', t => {
  for (let i=0; i<paths.length; ++i) {
    const p = pathParse(paths[i]);
    const b = bound(p, new Bounds());
    t.equal(b.x1, bounds[i].x1);
    t.equal(b.x2, bounds[i].x2);
    t.equal(b.y1, bounds[i].y1);
    t.equal(b.y2, bounds[i].y2);
  }
  t.end();
});

tape('pathRender should render paths', t => {
  var ctx, p;
  for (let i=0; i<paths.length; ++i) {
    p = pathParse(paths[i]);
    pathRender(ctx = context(), p, 0, 0);
    t.ok(vega.pathEqual(ctx+'', output[i]), 'path: ' + paths[i]);
  }
  t.end();
});

tape('pathRender should translate paths', t => {
  const ctx = context();
  pathRender(ctx, pathParse(paths[1]), 10, 50);
  t.equal(ctx+'', 'M20,60L30,80');
  t.end();
});

tape('pathRender should scale paths', t => {
  const ctx = context();
  pathRender(ctx, pathParse(paths[1]), 0, 0, 2, 0.5);
  t.equal(ctx+'', 'M20,5L40,15');
  t.end();
});
