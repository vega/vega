var fs = require('fs'),
    gulp = require('gulp'),
    stream = require('event-stream'),
    browserify = require('browserify'),
    through = require('through'),
    buffer = require('vinyl-buffer'),
    rename = require('gulp-rename'),
    exorcist   = require('exorcist'),
    transform = require('vinyl-transform'),
    source = require('vinyl-source-stream'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify'),
    watchify = require('watchify'),
    gutil = require('gulp-util'),
    del = require('del'),
    mocha = require('gulp-spawn-mocha'),
    jstransform = require('jstransform'),
    jstutils = require('jstransform/src/utils'),
    Syntax = jstransform.Syntax,
    vega_schema = require('./src/core/schema'),
    argv = require('yargs').argv;

function browser() {
  return browserify({
      entries: ['./index'],
      standalone: 'vg',
      debug: true,
      cache: {}, packageCache: {}
    })
    .transform(stripSchema)
    .external(['d3', 'topojson', 'canvas']); 
}

function watcher() {
  return watchify(browser());
}

function schema() {
  return stream.readArray(JSON.stringify(vega_schema(), null, 2).split())
    .on('error', gutil.log.bind(gutil, 'Schema Generation Error'))
    .pipe(source('vega-schema.json'))
    .pipe(gulp.dest('.'))
}

// Strip schema definitions from source files for smaller
// built file size. We do this by building an AST of source
// files and removing everything after the module.exports = (.*) expr.

function stripSchema(file) {
  var data = '';

  function visitModuleExportsExpr(traverse, node, path, state) {
    jstutils.catchup(node.range[1]+1, state); // Last line is module.exports = (.*);
    jstutils.move(data.length, state); // Skip over schema definitions
  }

  visitModuleExportsExpr.test = function(node, path, state) {
    if (node.type !== Syntax.AssignmentExpression) return false;
    if (node.left.type !== Syntax.MemberExpression) return false;
    if (node.left.object.type !== Syntax.Identifier) return false;
    if (node.left.property.type !== Syntax.Identifier) return false;
    if (node.left.object.name !== "module") return false;
    if (node.left.property.name !== "exports") return false;

    return true;
  };

  return through(function(buf) { data += buf }, function() {
    var stripped = jstransform.transform(
      [visitModuleExportsExpr],
      data
    );
    this.queue(stripped.code);
    this.queue(null);
  });
}

function build(b) {
  schema();
  return b.bundle()
    // log errors if they happen
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('vega.js'))
    .pipe(buffer())
    // Remove map from vega.js
    .pipe(transform(function () { return exorcist('./vega.js.map'); }))
    .pipe(gulp.dest('.'))
    // This will minify and rename to vegalite.min.js
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest('.')); 
}

gulp.task('build', function() { 
  build(browser()); 
});

gulp.task('watch', function() { 
  var b = watcher();
  b.on('update', function() { build(b) });
  b.on('log', gutil.log); // output build logs to terminal
  build(b); 
});

gulp.task('test', function() {
  if (fs.existsSync('output/')) del(['output/*']);
  return gulp.src(['test/**/*.js'], { read: false })
    .pipe(mocha({ 
      grep: argv.g, 
      timeout: 30000,
      istanbul: argv.i !== undefined ? (argv.i === "true") : true
    }))
    .on('error', gutil.log);
});

gulp.task('schema', schema);
gulp.task('default', ['test', 'build']);
