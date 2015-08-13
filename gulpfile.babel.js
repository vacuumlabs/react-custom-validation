'use strict';

var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var browserSync = require('browser-sync');
var browserify = require('browserify');
var source = require ('vinyl-source-stream');
var babelify = require("babelify");
var buffer = require('vinyl-buffer');

var ASSETS_FOLDER = './app/assets/';
var BUILD_FOLDER = './public/';
var argv = require('yargs').alias('e', 'example').default('e', 'example1').argv;

// Build JS and JSX and copy it to build folder
gulp.task('js', function() {
  return browserify(`./${argv.example}/main-client.jsx`)
  //.transform(reactify)
  .transform(babelify)
  .bundle()
  .pipe(source('main.js'))
  .pipe(buffer())
  .pipe(gulp.dest(BUILD_FOLDER + 'js'))
  //.pipe(browserSync.reload());
});

gulp.task('html', function() {
  return gulp.src('./html/index.html')
    .pipe(gulp.dest(BUILD_FOLDER));
})

gulp.task('build', ['js', 'html']);

// Main task to run
gulp.task('watch', ['build'], function () {
  gulp.watch(`./${argv.example}/**/*`, ['js']);
  gulp.watch('./lib/**/*', ['js']);
});