/* global require, process */

var gulp   = require('gulp');
var gutil  = require('gulp-util');
var coffee = require('gulp-coffee');

gulp.task('coffee', function() {
  gulp.src('./src/*.coffee')
    .pipe(coffee({bare: true}).on('error', gutil.log))
    .pipe(gulp.dest('./dist/'))
});

gulp.task('watch', function() {
  gulp.watch([
    './src/*.coffee'
  ], ['coffee']).on('change', function() {});
});


gulp.task('default', ['coffee', 'watch']);
