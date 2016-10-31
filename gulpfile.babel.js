'use strict'

let gulp = require('gulp')
let babel = require('gulp-babel')
let eslint = require('gulp-eslint')
let del = require('del')

gulp.task('clean', function() {
  return del(['dist/**/*'])
})

gulp.task('build-dist', ['clean'], function() {
  return gulp.src('lib/**/*.js')
    .pipe(babel({presets: ['es2015', 'react', 'stage-0']}))
    .pipe(gulp.dest('dist'))
})

gulp.task('eslint', () => {
  return gulp.src([
    'gulpfile.babel.js',
    'lib/**/*.js',
    'example1/**/*.js',
    'example2/**/*.js',
    'example3/**/*.js',
  ])
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failAfterError())
})
