var gulp = require('gulp');
var ts = require('gulp-typescript');
var del = require('del');
var watch = require('gulp-watch');
var batch = require('gulp-batch');
var jsdoc = require("gulp-jsdoc");

gulp.task('default', ['build']);

gulp.task('build', ['compile']);

gulp.task('compile', ['clean'], function() {
  var tsResult = gulp.src('src/**/*.ts')
    .pipe(ts({
      // noImplicitAny: true,
      noEmitOnError: true,
      target: 'ES5',
      module: 'commonjs'
    }));

  return tsResult.js.pipe(gulp.dest('release/js'));
});

gulp.task('doc', function() {
  gulp.src(['release/js/**/*.js', 'README.md'])
    .pipe(jsdoc.parser())
    .pipe(jsdoc.generator('./doc'));
});

gulp.task('clean', function(cb) {
  del([
    'release/**/*',
    '!release/js/config.js'
  ], cb);
});

gulp.task('watch', function() {
  watch('src/**/*', batch(function(ev, done) {
    gulp.start('build', done);
  }));
});
