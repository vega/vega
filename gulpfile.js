var gulp = require('gulp'),
    browserify = require('browserify'),
    buffer = require('vinyl-buffer'),
    rename = require('gulp-rename'),
    exorcist   = require('exorcist'),
    transform = require('vinyl-transform'),
    source = require('vinyl-source-stream'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify'),
    watchify = require('watchify'),
    gutil = require('gulp-util'),
    mocha = require('gulp-spawn-mocha'),
    argv = require('yargs').argv;

function browser() {
  return browserify({
      entries: ['./index'],
      standalone: 'vg',
      debug: true,
      cache: {}, packageCache: {}
    })
    .external(['d3', 'topojson', 'canvas']); 
}

function watcher() {
  return watchify(browser());
}

function build(b) {
  return b.bundle()
    // log errors if they happen
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('vega2.js'))
    .pipe(buffer())
    // Remove map from vega.js
    .pipe(transform(function () { return exorcist('./vega2.js.map'); }))
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
  return gulp.src(['test/**/*.js'], { read: false })
    .pipe(mocha({ 
      grep: argv.g, 
      timeout: 30000,
      istanbul: argv.i !== undefined ? (argv.i === "true") : true
    }))
    .on('error', gutil.log);
});

gulp.task('default', ['test', 'build']);
